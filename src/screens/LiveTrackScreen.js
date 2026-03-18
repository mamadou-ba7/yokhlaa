import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Platform, Animated, TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { supabase } from '../lib/supabase';
import DakarMap from '../components/DakarMap';

const STATUS_MAP = {
  pending: { label: 'En attente d\'un chauffeur', color: '#FFB800', icon: 'hourglass' },
  accepted: { label: 'Chauffeur en route', color: COLORS.green, icon: 'car' },
  arriving: { label: 'Chauffeur arrive', color: '#4A90FF', icon: 'navigate' },
  in_progress: { label: 'Course en cours', color: '#4A90FF', icon: 'speedometer' },
  completed: { label: 'Course terminee', color: COLORS.green, icon: 'checkmark-circle' },
  cancelled: { label: 'Course annulee', color: '#EF4444', icon: 'close-circle' },
};

export default function LiveTrackScreen({ route, navigation }) {
  const { shareToken, rideId } = route.params || {};
  const [ride, setRide] = useState(null);
  const [driver, setDriver] = useState(null);
  const [driverLoc, setDriverLoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseRef = useRef(null);

  // Load ride data
  useEffect(() => {
    loadRide();
  }, []);

  const loadRide = async () => {
    try {
      let q;
      if (shareToken) {
        q = supabase.from('rides').select('*').eq('share_token', shareToken).single();
      } else if (rideId) {
        q = supabase.from('rides').select('*').eq('id', rideId).single();
      } else {
        setError('Lien invalide');
        setLoading(false);
        return;
      }
      const { data, error: e } = await q;
      if (e || !data) {
        setError('Course introuvable');
        setLoading(false);
        return;
      }
      setRide(data);
      if (data.driver_id) loadDriver(data.driver_id);
      setLoading(false);
    } catch {
      setError('Erreur de chargement');
      setLoading(false);
    }
  };

  const loadDriver = async (driverId) => {
    try {
      const { data } = await supabase.from('profiles')
        .select('nom, telephone, vehicule, plaque, latitude, longitude, rating')
        .eq('id', driverId).single();
      if (data) {
        setDriver(data);
        if (data.latitude && data.longitude) {
          setDriverLoc({ latitude: data.latitude, longitude: data.longitude });
        }
      }
    } catch {}
  };

  // Realtime ride updates
  useEffect(() => {
    if (!ride?.id) return;
    const ch = supabase.channel(`track-${ride.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rides', filter: `id=eq.${ride.id}` },
        ({ new: u }) => {
          setRide(u);
          if (u.driver_id && !driver) loadDriver(u.driver_id);
        }).subscribe();
    return () => supabase.removeChannel(ch);
  }, [ride?.id]);

  // Live driver position
  useEffect(() => {
    if (!ride?.driver_id || ride.status === 'completed' || ride.status === 'cancelled') return;
    const interval = setInterval(async () => {
      try {
        const { data } = await supabase.from('profiles')
          .select('latitude, longitude')
          .eq('id', ride.driver_id).single();
        if (data?.latitude && data?.longitude) {
          setDriverLoc({ latitude: data.latitude, longitude: data.longitude });
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [ride?.driver_id, ride?.status]);

  // Pulse animation for active states
  useEffect(() => {
    const active = ride && !['completed', 'cancelled'].includes(ride.status);
    if (active) {
      pulseRef.current = Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]));
      pulseRef.current.start();
    } else {
      if (pulseRef.current) { pulseRef.current.stop(); pulseRef.current = null; }
      pulseAnim.setValue(1);
    }
    return () => { if (pulseRef.current) pulseRef.current.stop(); };
  }, [ride?.status]);

  if (loading) {
    return (
      <View style={[st.root, st.center]}>
        <StatusBar style="light" />
        <Animated.View style={[st.loadCircle, { transform: [{ scale: pulseAnim }] }]}>
          <Ionicons name="locate" size={28} color="#fff" />
        </Animated.View>
        <Text style={st.loadTxt}>Chargement du suivi...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[st.root, st.center]}>
        <StatusBar style="light" />
        <View style={st.errorCircle}>
          <Ionicons name="warning" size={32} color="#FFB800" />
        </View>
        <Text style={st.errorTitle}>{error}</Text>
        <Text style={st.errorSub}>Ce lien de suivi n'est plus valide</Text>
        {navigation.canGoBack() && (
          <TouchableOpacity style={st.backBtn} onPress={() => navigation.goBack()}>
            <Text style={st.backBtnTxt}>Retour</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const info = STATUS_MAP[ride.status] || STATUS_MAP.pending;
  const isActive = !['completed', 'cancelled'].includes(ride.status);
  const dest = ride.dropoff_lat ? { latitude: ride.dropoff_lat, longitude: ride.dropoff_lng } : null;
  const pickup = ride.pickup_lat ? { latitude: ride.pickup_lat, longitude: ride.pickup_lng } : null;

  return (
    <View style={st.root}>
      <StatusBar style="light" />

      {/* Map */}
      <View style={st.map}>
        <DakarMap
          userLocation={pickup}
          destination={dest ? { lat: ride.dropoff_lat, lng: ride.dropoff_lng, name: ride.dropoff_address } : null}
          driverLocation={driverLoc && isActive ? driverLoc : null}
        />
      </View>

      {/* Top bar */}
      <View style={st.topBar}>
        {navigation.canGoBack() && (
          <TouchableOpacity style={st.topBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={COLORS.white} />
          </TouchableOpacity>
        )}
        <View style={st.topBadge}>
          <Ionicons name="eye" size={12} color={COLORS.green} />
          <Text style={st.topBadgeTxt}>Suivi en direct</Text>
        </View>
      </View>

      {/* Bottom sheet */}
      <View style={st.sheet}>
        <View style={st.handle} />

        {/* Status */}
        <View style={[st.statusPill, { backgroundColor: info.color + '14', borderColor: info.color + '30' }]}>
          <Animated.View style={isActive ? { transform: [{ scale: pulseAnim }] } : undefined}>
            <View style={[st.statusDot, { backgroundColor: info.color }]} />
          </Animated.View>
          <Ionicons name={info.icon} size={16} color={info.color} />
          <Text style={[st.statusTxt, { color: info.color }]}>{info.label}</Text>
        </View>

        {/* Route */}
        <View style={st.routeCard}>
          <View style={st.routeDots}>
            <View style={st.dotG} />
            <View style={st.dotLine} />
            <Ionicons name="location" size={10} color={COLORS.green} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.routeFrom} numberOfLines={1}>{ride.pickup_address || 'Depart'}</Text>
            <Text style={st.routeTo} numberOfLines={1}>{ride.dropoff_address || 'Destination'}</Text>
          </View>
        </View>

        {/* Ride info */}
        <View style={st.infoRow}>
          {ride.distance_km > 0 && (
            <View style={st.infoItem}>
              <Ionicons name="navigate-outline" size={14} color={COLORS.dim} />
              <Text style={st.infoVal}>{ride.distance_km} km</Text>
            </View>
          )}
          {ride.duration_min > 0 && (
            <View style={st.infoItem}>
              <Ionicons name="time-outline" size={14} color={COLORS.dim} />
              <Text style={st.infoVal}>~{ride.duration_min} min</Text>
            </View>
          )}
          {ride.ride_class && (
            <View style={st.infoItem}>
              <Ionicons name="car-outline" size={14} color={COLORS.dim} />
              <Text style={st.infoVal}>{ride.ride_class}</Text>
            </View>
          )}
        </View>

        {/* Driver info */}
        {driver && (
          <View style={st.driverCard}>
            <View style={st.driverAvatar}>
              <Text style={st.driverInit}>{(driver.nom || '?')[0].toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.driverName}>{driver.nom || 'Chauffeur'}</Text>
              <View style={st.driverMeta}>
                {driver.rating > 0 && (
                  <>
                    <Ionicons name="star" size={11} color="#FFB800" />
                    <Text style={st.driverRating}>{driver.rating.toFixed(1)}</Text>
                  </>
                )}
                {driver.vehicule && <Text style={st.driverCar}>{driver.vehicule}</Text>}
              </View>
            </View>
            {driver.plaque && (
              <View style={st.plateWrap}>
                <Text style={st.plateTxt}>{driver.plaque}</Text>
              </View>
            )}
          </View>
        )}

        {/* Yokh Laa branding */}
        <View style={st.branding}>
          <Text style={st.brandTxt}>
            Suivi via Yokh<Text style={{ color: COLORS.green }}>Laa</Text>
          </Text>
          <Text style={st.brandSub}>Transport Dakar · 0% commission</Text>
        </View>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.black },
  center: { alignItems: 'center', justifyContent: 'center' },
  map: { flex: 1 },

  // Loading
  loadCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: COLORS.green, alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    shadowColor: COLORS.green, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16,
  },
  loadTxt: { fontSize: 14, color: COLORS.dim },

  // Error
  errorCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,184,0,0.12)', alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: { fontSize: 18, fontWeight: '700', color: COLORS.white, marginBottom: 6 },
  errorSub: { fontSize: 13, color: COLORS.dim },
  backBtn: {
    marginTop: 24, paddingVertical: 12, paddingHorizontal: 32,
    borderRadius: 12, backgroundColor: COLORS.card,
    borderWidth: 1, borderColor: COLORS.line,
  },
  backBtnTxt: { fontSize: 14, fontWeight: '600', color: COLORS.white },

  // Top
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingTop: Platform.OS === 'ios' ? 54 : 38, paddingHorizontal: 16, paddingBottom: 8,
  },
  topBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(8,10,13,0.7)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  topBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(8,10,13,0.85)', borderRadius: 20,
    paddingVertical: 6, paddingHorizontal: 12,
    borderWidth: 1, borderColor: COLORS.greenBorder,
  },
  topBadgeTxt: { fontSize: 12, fontWeight: '600', color: COLORS.green },

  // Sheet
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.black, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderTopWidth: 1, borderColor: COLORS.line,
    paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.dim2,
    alignSelf: 'center', marginTop: 10, marginBottom: 14,
  },

  // Status
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 14, marginBottom: 14,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusTxt: { flex: 1, fontSize: 14, fontWeight: '600' },

  // Route
  routeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.line,
    padding: 14, marginBottom: 12,
  },
  routeDots: { alignItems: 'center', gap: 2 },
  dotG: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4A90FF' },
  dotLine: { width: 1, height: 14, backgroundColor: COLORS.line },
  routeFrom: { fontSize: 12, color: COLORS.dim, marginBottom: 4 },
  routeTo: { fontSize: 14, fontWeight: '600', color: COLORS.white },

  // Info row
  infoRow: {
    flexDirection: 'row', gap: 16, marginBottom: 14,
    paddingHorizontal: 4,
  },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoVal: { fontSize: 12, fontWeight: '600', color: COLORS.dim },

  // Driver
  driverCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.line,
    padding: 14, marginBottom: 14,
  },
  driverAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.greenLight, borderWidth: 2, borderColor: COLORS.green,
    alignItems: 'center', justifyContent: 'center',
  },
  driverInit: { fontSize: 16, fontWeight: '800', color: COLORS.green },
  driverName: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  driverMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  driverRating: { fontSize: 12, fontWeight: '600', color: '#FFB800' },
  driverCar: { fontSize: 12, color: COLORS.dim },
  plateWrap: {
    backgroundColor: COLORS.surface, borderRadius: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: COLORS.line,
  },
  plateTxt: { fontSize: 11, fontWeight: '700', color: COLORS.white, letterSpacing: 1 },

  // Branding
  branding: { alignItems: 'center', paddingTop: 6 },
  brandTxt: { fontSize: 13, fontWeight: '700', color: COLORS.dim },
  brandSub: { fontSize: 10, color: COLORS.dim2, marginTop: 2 },
});
