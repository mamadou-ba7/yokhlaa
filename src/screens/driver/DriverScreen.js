import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  Animated, Platform, Linking, Share,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import DakarMap from '../../components/DakarMap';
import {
  registerForPushNotifications, notifyPassengerDriverAccepted,
  notifyPassengerDriverArriving, notifyPassengerRideStarted, notifyPassengerRideCompleted,
} from '../../lib/notifications';
import { startBackgroundLocation, stopBackgroundLocation } from '../../lib/backgroundLocation';
import { tapHeavy, tapMedium, tapLight, notifySuccess, notifyError, notifyWarning } from '../../lib/haptics';
import { subscribeToDriverOffers, respondToOffer } from '../../lib/matching';

const DAKAR = { latitude: 14.7167, longitude: -17.4677 };

export default function DriverScreen({ navigation }) {
  const { user, profile, switchRole } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [loc, setLoc] = useState(DAKAR);
  const [pending, setPending] = useState(null);
  const [ride, setRide] = useState(null);
  const [status, setStatus] = useState('idle');
  const [earnings, setEarnings] = useState({ today: 0, rides: 0 });
  const [rideDest, setRideDest] = useState(null);
  const [currentOffer, setCurrentOffer] = useState(null); // { id, ride_id, expires_at, ... }
  const [offerCountdown, setOfferCountdown] = useState(20);
  const slideAnim = useRef(new Animated.Value(400)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseRef = useRef(null);
  const watcher = useRef(null);
  const offerTimerRef = useRef(null);

  useEffect(() => {
    getLocation();
    loadTodayEarnings();
    // Register push notifications
    if (user?.id) {
      registerForPushNotifications(user.id);
    }
    return () => {
      if (watcher.current) { watcher.current.remove(); watcher.current = null; }
    };
  }, []);

  // Listen for ride offers targeted at THIS driver (remplace le broadcast global)
  useEffect(() => {
    if (!isOnline || !user?.id) return;

    const unsubscribe = subscribeToDriverOffers(user.id, async (offer) => {
      // Charger les details complets de la course associee
      const { data: rideData } = await supabase
        .from('rides')
        .select('*')
        .eq('id', offer.ride_id)
        .maybeSingle();

      if (!rideData || rideData.status !== 'pending') return;

      notifyWarning();
      setCurrentOffer(offer);
      setPending(rideData);
      setStatus('incoming');
      showIncoming();

      // Timer de 20 secondes (auto-timeout cote serveur via expires_at)
      const expiresMs = new Date(offer.expires_at).getTime();
      const updateCountdown = () => {
        const remaining = Math.max(0, Math.ceil((expiresMs - Date.now()) / 1000));
        setOfferCountdown(remaining);
        if (remaining <= 0) {
          if (offerTimerRef.current) { clearInterval(offerTimerRef.current); offerTimerRef.current = null; }
          setCurrentOffer(null);
          setPending(null);
          setStatus('idle');
          slideAnim.setValue(400);
        }
      };
      updateCountdown();
      if (offerTimerRef.current) clearInterval(offerTimerRef.current);
      offerTimerRef.current = setInterval(updateCountdown, 1000);
    });

    return () => {
      unsubscribe();
      if (offerTimerRef.current) { clearInterval(offerTimerRef.current); offerTimerRef.current = null; }
    };
  }, [isOnline, user?.id]);

  // Listen for updates on current ride
  useEffect(() => {
    if (!ride?.id) return;
    const ch = supabase.channel(`driver-ride-${ride.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rides', filter: `id=eq.${ride.id}` },
        ({ new: u }) => {
          if (u.status === 'cancelled') {
            Alert.alert('Course annulee', 'Le passager a annule la course.');
            setRide(null); setRideDest(null); setStatus('idle'); slideAnim.setValue(400);
          }
        }).subscribe();
    return () => supabase.removeChannel(ch);
  }, [ride?.id]);

  // Pulse animation for incoming
  useEffect(() => {
    if (status === 'incoming') {
      pulseRef.current = Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]));
      pulseRef.current.start();
    } else {
      if (pulseRef.current) { pulseRef.current.stop(); pulseRef.current = null; }
      pulseAnim.setValue(1);
    }
  }, [status]);

  const getLocation = async () => {
    try {
      const { status: s } = await Location.requestForegroundPermissionsAsync();
      if (s !== 'granted') {
        Alert.alert('Localisation', 'Activez la localisation pour recevoir des courses.');
        return;
      }
      const r = await Location.getCurrentPositionAsync({});
      setLoc({ latitude: r.coords.latitude, longitude: r.coords.longitude });
    } catch (e) {
      console.warn('Location error:', e);
      setLoc(DAKAR);
    }
  };

  const loadTodayEarnings = async () => {
    if (!user?.id) return;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data } = await supabase.from('rides')
        .select('price')
        .eq('driver_id', user.id)
        .eq('status', 'completed')
        .gte('completed_at', today.toISOString());
      if (data) {
        setEarnings({
          today: data.reduce((sum, r) => sum + (r.price || 0), 0),
          rides: data.length,
        });
      }
    } catch (e) {
      console.warn('Earnings load error:', e);
    }
  };

  const startTracking = async () => {
    try {
      // Set online in DB
      if (user?.id) {
        await supabase.from('profiles').update({
          is_online: true, updated_at: new Date().toISOString(),
        }).eq('id', user.id);
      }

      // Try background location first, fall back to foreground
      let bgStarted = false;
      if (user?.id) {
        try {
          bgStarted = await startBackgroundLocation(user.id);
        } catch (e) {
          console.warn('Background location unavailable:', e.message);
        }
      }

      // Always keep foreground watcher for UI updates
      watcher.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
        (r) => {
          const c = { latitude: r.coords.latitude, longitude: r.coords.longitude };
          setLoc(c);
          // Only update DB from foreground if background isn't running
          if (user?.id && !bgStarted) {
            supabase.from('profiles').update({
              latitude: c.latitude, longitude: c.longitude,
              is_online: true, updated_at: new Date().toISOString(),
            }).eq('id', user.id).then(({ error }) => {
              if (error) console.warn('Location update error:', error.message);
            });
          }
        }
      );
    } catch (e) {
      console.warn('Tracking error:', e);
      Alert.alert('Erreur', 'Impossible d\'activer le suivi GPS.');
    }
  };

  const stopTracking = async () => {
    if (watcher.current) { watcher.current.remove(); watcher.current = null; }
    await stopBackgroundLocation().catch(() => {});
    if (user?.id) {
      await supabase.from('profiles').update({
        is_online: false, updated_at: new Date().toISOString(),
      }).eq('id', user.id).catch(() => {});
    }
  };

  const toggleOnline = () => {
    tapMedium();

    if (isOnline) {
      setIsOnline(false);
      stopTracking();
      return;
    }

    // Enforcement: driver_status doit etre 'approved'
    if (profile?.driver_status !== 'approved') {
      notifyError();
      const msg = profile?.driver_status === 'rejected'
        ? 'Votre dossier a ete refuse. Contactez le support.'
        : profile?.driver_status === 'suspended'
        ? 'Votre compte est suspendu. Contactez le support.'
        : 'Votre dossier est en cours de validation par notre equipe. Vous recevrez une notification des qu\'il sera approuve.';
      Alert.alert('Validation en cours', msg, [{ text: 'OK' }]);
      return;
    }

    // Enforcement: abonnement actif requis
    const subActive = profile?.subscription_active &&
      profile?.subscription_ends_at &&
      new Date(profile.subscription_ends_at) > new Date();

    if (!subActive) {
      notifyWarning();
      Alert.alert(
        'Abonnement requis',
        'Vous devez avoir un abonnement actif (18 500 FCFA/mois) pour recevoir des courses.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'S\'abonner', onPress: () => (navigation.getParent() || navigation).navigate('Subscription') },
        ]
      );
      return;
    }

    setIsOnline(true);
    startTracking();
  };

  const showIncoming = () => {
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 50 }).start();
  };

  const clearOfferState = () => {
    if (offerTimerRef.current) { clearInterval(offerTimerRef.current); offerTimerRef.current = null; }
    setCurrentOffer(null);
    setPending(null);
    setStatus('idle');
    slideAnim.setValue(400);
  };

  const accept = async () => {
    if (!currentOffer || !pending) return;

    try {
      const result = await respondToOffer(currentOffer.id, 'accepted');

      if (!result?.success) {
        Alert.alert('Course indisponible', result?.error || 'Un autre chauffeur a deja pris cette course.');
        clearOfferState();
        return;
      }

      tapHeavy();
      const acceptedRide = result.ride;
      setRide(acceptedRide);
      setRideDest(acceptedRide.dropoff_lat ? { lat: acceptedRide.dropoff_lat, lng: acceptedRide.dropoff_lng, name: acceptedRide.dropoff_address } : null);
      setStatus('accepted');
      setPending(null);
      setCurrentOffer(null);
      if (offerTimerRef.current) { clearInterval(offerTimerRef.current); offerTimerRef.current = null; }

      // Notify passenger
      const { data: p } = await supabase.from('profiles').select('nom').eq('id', user.id).single();
      notifyPassengerDriverAccepted(acceptedRide, p?.nom || 'Votre chauffeur');
    } catch (e) {
      console.warn('Accept error:', e);
      Alert.alert('Erreur', e.message || 'Impossible d\'accepter la course. Reessayez.');
      clearOfferState();
    }
  };

  const handleSOS = async () => {
    Alert.alert(
      'Urgence',
      'Appeler la police et partager votre position ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Appeler le 17',
          style: 'destructive',
          onPress: async () => {
            if (ride?.share_token) {
              try {
                await Share.share({
                  message: `URGENCE — Chauffeur Yokh Laa en course. Suivez ma position : https://yokhlaa.app/track/${ride.share_token}`,
                });
              } catch (e) {
                console.warn('Share error:', e);
              }
            }
            Linking.openURL('tel:17');
          },
        },
      ]
    );
  };

  const reject = async () => {
    tapLight();
    const offerId = currentOffer?.id;
    // Clean UI immediately
    if (offerTimerRef.current) { clearInterval(offerTimerRef.current); offerTimerRef.current = null; }
    setCurrentOffer(null);
    setPending(null);
    setStatus('idle');
    Animated.timing(slideAnim, { toValue: 400, duration: 300, useNativeDriver: true }).start();

    // Notifier le serveur (re-matching sera lance pour trouver un autre chauffeur)
    if (offerId) {
      try { await respondToOffer(offerId, 'declined'); }
      catch (e) { console.warn('Decline error:', e); }
    }
  };

  const cancelByDriver = () => {
    if (!ride?.id) return;
    if (status === 'trip') {
      Alert.alert('Impossible', 'Vous ne pouvez pas annuler une course en cours. En cas de probleme, utilisez le bouton SOS.');
      return;
    }
    Alert.alert(
      'Annuler la course ?',
      'Annuler cette course sera enregistre et peut affecter votre evaluation. Etes-vous sur ?',
      [
        { text: 'Retour', style: 'cancel' },
        {
          text: 'Annuler la course',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.from('rides').update({
                status: 'cancelled',
                cancelled_by: 'driver',
                cancelled_at: new Date().toISOString(),
              }).eq('id', ride.id);

              // Increment driver cancellation count
              if (user?.id) {
                const { data: p } = await supabase.from('profiles')
                  .select('driver_cancellation_count')
                  .eq('id', user.id).single();
                await supabase.from('profiles')
                  .update({ driver_cancellation_count: (p?.driver_cancellation_count || 0) + 1 })
                  .eq('id', user.id);
              }

              setRide(null); setRideDest(null); setStatus('idle'); slideAnim.setValue(400);
            } catch (e) {
              console.warn('Driver cancel error:', e);
              Alert.alert('Erreur', 'Impossible d\'annuler. Reessayez.');
            }
          },
        },
      ]
    );
  };

  const updateRideStatus = async (newStatus) => {
    if (!ride?.id) return;
    try {
      tapMedium();
      const updates = { status: newStatus };
      if (newStatus === 'in_progress') updates.started_at = new Date().toISOString();
      const { error } = await supabase.from('rides').update(updates).eq('id', ride.id);
      if (error) throw error;
      setStatus(newStatus === 'arriving' ? 'arriving' : newStatus === 'in_progress' ? 'trip' : status);

      // Push notifications to passenger
      const { data: profile } = await supabase.from('profiles').select('nom').eq('id', user.id).single();
      const driverName = profile?.nom || 'Votre chauffeur';
      if (newStatus === 'arriving') {
        notifyPassengerDriverArriving(ride, driverName);
      } else if (newStatus === 'in_progress') {
        notifyPassengerRideStarted(ride);
      }
    } catch (e) {
      console.warn('Status update error:', e);
      Alert.alert('Erreur', 'Mise a jour impossible. Reessayez.');
    }
  };

  const complete = async () => {
    if (!ride) return;
    try {
      const { error } = await supabase.from('rides').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      }).eq('id', ride.id);
      if (error) throw error;

      notifySuccess();
      notifyPassengerRideCompleted(ride);
      setEarnings(prev => ({ today: prev.today + (ride.price || 0), rides: prev.rides + 1 }));
      Alert.alert('Course terminee !', `${ride.price?.toLocaleString()} FCFA gagnes\n0% commission — tout est a vous`);
      setRide(null); setRideDest(null); setStatus('idle'); slideAnim.setValue(400);
    } catch (e) {
      console.warn('Complete error:', e);
      Alert.alert('Erreur', 'Impossible de terminer la course. Reessayez.');
    }
  };

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <View style={s.map}><DakarMap userLocation={loc} destination={rideDest} /></View>

      <View style={s.top}>
        <TouchableOpacity style={s.topBtn} onPress={() => { tapLight(); (navigation.getParent() || navigation).navigate('DriverDashboard'); }}>
          <Ionicons name="stats-chart" size={20} color={COLORS.white} />
        </TouchableOpacity>

        <View style={s.modeSwitcher}>
          <TouchableOpacity
            style={s.modeOption}
            onPress={() => { tapMedium(); if (isOnline) stopTracking(); switchRole('passager'); }}
            activeOpacity={0.7}
          >
            <Ionicons name="person" size={14} color={COLORS.dim} />
            <Text style={s.modeTxt}>Se deplacer</Text>
          </TouchableOpacity>
          <View style={[s.modeOption, s.modeActive]}>
            <Ionicons name="car" size={14} color="#fff" />
            <Text style={s.modeActiveTxt}>Conduire</Text>
          </View>
        </View>

        <TouchableOpacity style={s.topBtn}>
          <Ionicons name="notifications-outline" size={18} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <View style={s.sheet}>
        <View style={s.handle} />
        <TouchableOpacity style={[s.toggle, isOnline && s.toggleOn]} onPress={toggleOnline} activeOpacity={0.8}>
          <View style={[s.toggleDot, isOnline && s.toggleDotOn]} />
          <Text style={[s.toggleTxt, isOnline && { color: COLORS.green }]}>{isOnline ? 'EN LIGNE' : 'HORS LIGNE'}</Text>
        </TouchableOpacity>

        <View style={s.stats}>
          <View style={s.statBox}><Text style={s.statVal}>{earnings.today.toLocaleString()}</Text><Text style={s.statLbl}>FCFA</Text></View>
          <View style={s.statDiv} />
          <View style={s.statBox}><Text style={s.statVal}>{earnings.rides}</Text><Text style={s.statLbl}>Courses</Text></View>
          <View style={s.statDiv} />
          <View style={s.statBox}><Text style={[s.statVal, { color: COLORS.green }]}>0%</Text><Text style={s.statLbl}>Commission</Text></View>
        </View>

        {ride && (status === 'accepted' || status === 'arriving' || status === 'trip') && (
          <View style={s.activeRide}>
            <View style={s.statusPill}>
              <View style={[s.statusDot, status === 'arriving' && { backgroundColor: '#FFB800' }, status === 'trip' && { backgroundColor: '#4A90FF' }]} />
              <Text style={[s.statusTxt, status === 'arriving' && { color: '#FFB800' }, status === 'trip' && { color: '#4A90FF' }]}>
                {status === 'accepted' ? 'Allez chercher le passager' : status === 'arriving' ? 'Vous etes arrive' : 'Course en cours'}
              </Text>
            </View>
            <View style={s.rideRoute}>
              <View style={s.routeDots}><View style={s.rdotB} /><View style={s.routeL} /><Ionicons name="location" size={12} color={COLORS.green} /></View>
              <View style={{ flex: 1 }}><Text style={s.rideFrom}>{ride.pickup_address}</Text><Text style={s.rideTo}>{ride.dropoff_address}</Text></View>
              <TouchableOpacity
                style={s.chatBtn}
                onPress={() => {
                  tapLight();
                  (navigation.getParent() || navigation).navigate('Chat', {
                    rideId: ride.id,
                    otherName: 'Passager',
                    otherRole: 'passager',
                  });
                }}
              >
                <Ionicons name="chatbubble-outline" size={16} color={COLORS.green} />
              </TouchableOpacity>
              <Text style={s.ridePrice}>{ride.price?.toLocaleString()} F</Text>
            </View>
            {status === 'accepted' && <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#4A90FF' }]} onPress={() => updateRideStatus('arriving')}><Text style={s.actionTxt}>Je suis arrive</Text></TouchableOpacity>}
            {status === 'arriving' && <TouchableOpacity style={s.actionBtn} onPress={() => updateRideStatus('in_progress')}><Text style={s.actionTxt}>Demarrer la course</Text></TouchableOpacity>}
            {status === 'trip' && <TouchableOpacity style={s.actionBtn} onPress={complete}><Text style={s.actionTxt}>Terminer la course</Text></TouchableOpacity>}
            <View style={s.secondaryRow}>
              {(status === 'accepted' || status === 'arriving') && (
                <TouchableOpacity style={s.cancelRideBtn} onPress={cancelByDriver} activeOpacity={0.7}>
                  <Ionicons name="close-circle-outline" size={14} color={COLORS.dim} />
                  <Text style={s.cancelRideTxt}>Annuler</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={s.sosBtn} onPress={handleSOS} activeOpacity={0.7}>
                <Ionicons name="alert-circle" size={14} color={COLORS.red} />
                <Text style={s.sosTxt}>SOS Urgence</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isOnline && status === 'idle' && !ride && <View style={s.waiting}><Ionicons name="radio-outline" size={20} color={COLORS.green} /><Text style={s.waitingTxt}>En attente de courses...</Text></View>}
        {!isOnline && !ride && <View style={s.waiting}><Ionicons name="power" size={20} color={COLORS.dim} /><Text style={[s.waitingTxt, { color: COLORS.dim }]}>Passez en ligne pour recevoir des courses</Text></View>}
      </View>

      {status === 'incoming' && pending && (
        <Animated.View style={[s.incoming, { transform: [{ translateY: slideAnim }] }]}>
          <Animated.View style={[s.inCircle, { transform: [{ scale: pulseAnim }] }]}><Ionicons name="car" size={28} color="#fff" /></Animated.View>
          <Text style={s.inTitle}>Nouvelle course !</Text>
          {currentOffer && (
            <View style={s.countdownBadge}>
              <Ionicons name="time-outline" size={14} color={offerCountdown <= 5 ? COLORS.red : COLORS.green} />
              <Text style={[s.countdownTxt, offerCountdown <= 5 && { color: COLORS.red }]}>{offerCountdown}s</Text>
            </View>
          )}
          <View style={s.inCard}>
            <View style={s.inRoute}><Text style={s.inFrom}>{pending.pickup_address}</Text><Ionicons name="arrow-forward" size={14} color={COLORS.green} /><Text style={s.inTo}>{pending.dropoff_address}</Text></View>
            <Text style={s.inDist}>{pending.distance_km} km · ~{pending.duration_min} min</Text>
            {currentOffer?.eta_minutes && (
              <Text style={s.inDist}>Vous etes a ~{currentOffer.eta_minutes} min du passager ({currentOffer.distance_km} km)</Text>
            )}
            <Text style={s.inPrice}>{pending.price?.toLocaleString()} FCFA</Text>
          </View>
          <View style={s.inBtns}>
            <TouchableOpacity style={s.rejectBtn} onPress={reject}><Ionicons name="close" size={22} color={COLORS.red} /></TouchableOpacity>
            <TouchableOpacity style={s.acceptBtn} onPress={accept}><Ionicons name="checkmark" size={22} color="#fff" /><Text style={s.acceptTxt}>Accepter</Text></TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.black },
  map: { flex: 1 },
  top: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Platform.OS === 'ios' ? 54 : 38, paddingHorizontal: 16, paddingBottom: 8 },
  topBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(8,10,13,0.7)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  topTitle: { fontSize: 15, fontWeight: '800', color: COLORS.white },
  modeSwitcher: {
    flexDirection: 'row', backgroundColor: 'rgba(8,10,13,0.85)',
    borderRadius: 25, padding: 3,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  modeOption: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 22,
  },
  modeActive: { backgroundColor: COLORS.green },
  modeActiveTxt: { fontSize: 13, fontWeight: '700', color: '#fff' },
  modeTxt: { fontSize: 13, fontWeight: '600', color: COLORS.dim },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.black, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: 1, borderColor: COLORS.line, paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 24 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.dim2, alignSelf: 'center', marginTop: 10, marginBottom: 14 },
  toggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.line, borderRadius: 14, padding: 15, marginBottom: 14 },
  toggleOn: { backgroundColor: COLORS.greenLight, borderColor: COLORS.green },
  toggleDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.dim },
  toggleDotOn: { backgroundColor: COLORS.green },
  toggleTxt: { fontSize: 14, fontWeight: '800', letterSpacing: 2, color: COLORS.dim },
  stats: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.line, padding: 14, marginBottom: 14 },
  statBox: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '800', color: COLORS.white },
  statLbl: { fontSize: 10, color: COLORS.dim, marginTop: 3, textTransform: 'uppercase' },
  statDiv: { width: 1, backgroundColor: COLORS.line },
  activeRide: { marginBottom: 8 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.greenLight, borderWidth: 1, borderColor: COLORS.greenBorder, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 12, marginBottom: 12 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.green },
  statusTxt: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.green },
  rideRoute: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.line, marginBottom: 12 },
  routeDots: { alignItems: 'center', gap: 2 },
  rdotB: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4A90FF' },
  routeL: { width: 1, height: 14, backgroundColor: COLORS.line },
  rideFrom: { fontSize: 12, color: COLORS.dim, marginBottom: 6 },
  rideTo: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  chatBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.greenLight, borderWidth: 1, borderColor: COLORS.greenBorder, alignItems: 'center', justifyContent: 'center' },
  ridePrice: { fontSize: 17, fontWeight: '800', color: COLORS.green },
  actionBtn: { backgroundColor: COLORS.green, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  actionTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
  waiting: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  waitingTxt: { fontSize: 13, color: COLORS.green },
  incoming: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.black, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: 2, borderColor: COLORS.green, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 30, alignItems: 'center' },
  inCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.green, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  inTitle: { fontSize: 18, fontWeight: '800', color: COLORS.white, marginBottom: 14 },
  inCard: { width: '100%', backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.line, padding: 16, marginBottom: 18 },
  inRoute: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  inFrom: { fontSize: 13, color: COLORS.dim },
  inTo: { fontSize: 13, fontWeight: '600', color: COLORS.white },
  inDist: { fontSize: 11, color: COLORS.dim, marginBottom: 6 },
  inPrice: { fontSize: 24, fontWeight: '800', color: COLORS.green },
  inBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  rejectBtn: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
  acceptBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.green, borderRadius: 14, padding: 16 },
  acceptTxt: { fontSize: 16, fontWeight: '700', color: '#fff' },
  secondaryRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  sosBtn: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 10, paddingVertical: 10,
  },
  sosTxt: { fontSize: 13, fontWeight: '700', color: COLORS.red },
  cancelRideBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.line,
    borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14,
  },
  cancelRideTxt: { fontSize: 13, fontWeight: '600', color: COLORS.dim },
  countdownBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.greenLight, borderWidth: 1, borderColor: COLORS.greenBorder,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 10,
  },
  countdownTxt: { fontSize: 14, fontWeight: '800', color: COLORS.green },
});
