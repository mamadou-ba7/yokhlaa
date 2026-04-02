import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Animated, Dimensions, Platform,
  ScrollView, KeyboardAvoidingView, Linking, Share,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import DakarMap from '../components/DakarMap';
import RatingModal from '../components/RatingModal';
import { registerForPushNotifications, notifyDriversOfNewRide, notifyDriverRideCancelled } from '../lib/notifications';
import { getRouteWithTraffic, calculatePrice, getTrafficLevel } from '../lib/traffic';
import { getSearchHistory, addToSearchHistory, clearSearchHistory, POPULAR_PLACES } from '../lib/searchHistory';
import { tapLight, tapMedium, selectionChanged } from '../lib/haptics';
import { reportDriverMismatch } from '../lib/driverVerification';

const PAYMENT_METHODS = [
  { id: 'cash', name: 'Especes', icon: 'cash-outline' },
  { id: 'wave', name: 'Wave', icon: 'phone-portrait-outline' },
  { id: 'orange_money', name: 'Orange Money', icon: 'phone-portrait-outline' },
];

const SOS_NUMBER = '17'; // Police Senegal

const { width } = Dimensions.get('window');
const DAKAR = { latitude: 14.7167, longitude: -17.4677 };

const calcPrice = (km) => Math.round(500 + km * 400); // Fallback simple
const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const RIDE_CLASSES = [
  { id: 'start', name: 'Start', icon: 'car-outline', mult: 0.85, desc: 'Economique' },
  { id: 'confort', name: 'Confort', icon: 'car-sport-outline', mult: 1, desc: 'Recommande' },
  { id: 'premium', name: 'Premium', icon: 'car-sport', mult: 1.5, desc: 'Vehicule recent' },
];

// ──────────────────────────────────────────────
export default function PassengerMapScreen({ navigation }) {
  const { user, profile, switchRole } = useAuth();
  const [loc, setLoc] = useState(null);
  const [dest, setDest] = useState(null);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [rideClass, setRideClass] = useState('confort');
  const [status, setStatus] = useState('idle'); // idle|confirm|searching|matched|arriving|trip|done
  const [ride, setRide] = useState(null);
  const [driver, setDriver] = useState(null);
  const [nearbyDrivers, setNearbyDrivers] = useState([]);
  const [km, setKm] = useState(0);
  const [eta, setEta] = useState(0);
  const [basePrice, setBasePrice] = useState(0);
  const [showRating, setShowRating] = useState(false);
  const [ratingRideId, setRatingRideId] = useState(null);
  const [searchError, setSearchError] = useState(false);
  const [payMethod, setPayMethod] = useState('cash');
  const [savedAddresses, setSavedAddresses] = useState({ home: null, work: null });
  const [pickupAddress, setPickupAddress] = useState('Ma position');
  const [driverLoc, setDriverLoc] = useState(null);
  const [trafficInfo, setTrafficInfo] = useState(null); // { congestionRatio, trafficDelay, source }
  const [surgeActive, setSurgeActive] = useState(false);
  const [surgeMult, setSurgeMult] = useState(1);
  const [searchHistory, setSearchHistory] = useState([]);
  const [searchingPickup, setSearchingPickup] = useState(false); // true = editing pickup, false = editing destination
  const pulse = useRef(new Animated.Value(1)).current;
  const pulseRef = useRef(null);
  const timer = useRef(null);
  const rideTimeoutRef = useRef(null);

  // ── Location + push registration + saved addresses ──
  useEffect(() => {
    (async () => {
      try {
        const { status: s } = await Location.requestForegroundPermissionsAsync();
        if (s !== 'granted') {
          Alert.alert('Localisation', 'Activez la localisation pour utiliser Yokh Laa.');
          setLoc(DAKAR);
          return;
        }
        const r = await Location.getCurrentPositionAsync({});
        const coords = { latitude: r.coords.latitude, longitude: r.coords.longitude };
        setLoc(coords);
        // Reverse geocode pickup address
        reverseGeocode(coords.latitude, coords.longitude);
      } catch (e) {
        console.warn('Location error:', e);
        setLoc(DAKAR);
      }
    })();
    // Register push notifications for passenger
    if (user?.id) {
      registerForPushNotifications(user.id);
      loadSavedAddresses();
    }
    // Load search history
    getSearchHistory().then(setSearchHistory);
    return () => {
      if (timer.current) clearTimeout(timer.current);
      if (rideTimeoutRef.current) clearTimeout(rideTimeoutRef.current);
    };
  }, []);

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=18`,
        { headers: { 'User-Agent': 'YokhLaa/1.0' } }
      );
      const data = await res.json();
      if (data?.address) {
        const a = data.address;
        const name = a.road || a.neighbourhood || a.suburb || a.city_district || '';
        const area = a.suburb || a.city_district || a.city || '';
        setPickupAddress(name ? `${name}${area && area !== name ? ', ' + area : ''}` : 'Ma position');
      }
    } catch (e) {
      console.warn('Reverse geocode error:', e);
    }
  };

  const loadSavedAddresses = async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase.from('profiles')
        .select('home_address, home_lat, home_lng, work_address, work_lat, work_lng')
        .eq('id', user.id).single();
      if (data) {
        const saved = { home: null, work: null };
        if (data.home_lat && data.home_lng) {
          saved.home = { name: data.home_address, lat: data.home_lat, lng: data.home_lng };
        }
        if (data.work_lat && data.work_lng) {
          saved.work = { name: data.work_address, lat: data.work_lat, lng: data.work_lng };
        }
        setSavedAddresses(saved);
      }
    } catch (e) {
      // Columns may not exist yet
    }
  };

  // ── Load nearby online drivers ─────────────
  useEffect(() => {
    if (!loc || status !== 'idle') return;
    loadNearbyDrivers();
    const interval = setInterval(loadNearbyDrivers, 15000);
    return () => clearInterval(interval);
  }, [loc, status]);

  const loadNearbyDrivers = async () => {
    try {
      const { data } = await supabase.from('profiles')
        .select('id, nom, latitude, longitude, vehicule')
        .eq('role', 'chauffeur')
        .eq('is_online', true)
        .not('latitude', 'is', null);
      if (data) setNearbyDrivers(data);
    } catch (e) {
      console.warn('Nearby drivers error:', e);
    }
  };

  // ── Pulse animation for searching ─────────
  useEffect(() => {
    if (status === 'searching') {
      pulseRef.current = Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]));
      pulseRef.current.start();
    } else {
      if (pulseRef.current) { pulseRef.current.stop(); pulseRef.current = null; }
      pulse.setValue(1);
    }
  }, [status]);

  // ── Realtime ride updates ──────────────────
  useEffect(() => {
    if (!ride?.id) return;
    const ch = supabase.channel(`r-${ride.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rides', filter: `id=eq.${ride.id}` },
        ({ new: u }) => {
          setRide(u);
          if (u.status === 'accepted') {
            if (rideTimeoutRef.current) { clearTimeout(rideTimeoutRef.current); rideTimeoutRef.current = null; }
            setStatus('matched'); loadDriver(u.driver_id);
          }
          else if (u.status === 'arriving') setStatus('arriving');
          else if (u.status === 'in_progress') setStatus('trip');
          else if (u.status === 'completed') {
            setRatingRideId(u.id);
            setShowRating(true);
            setStatus('idle'); setRide(null); setDest(null); setDriver(null);
            Alert.alert('Course terminee', `${u.price?.toLocaleString()} FCFA\nMerci d'avoir choisi Yokh Laa !`);
          }
        }).subscribe();
    return () => supabase.removeChannel(ch);
  }, [ride?.id]);

  const loadDriver = async (id) => {
    if (!id) return;
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (data) { setDriver(data); setDriverLoc({ latitude: data.latitude, longitude: data.longitude }); return; }
    } catch (e) {
      console.warn('Load driver error:', e);
    }
    setDriver(null);
  };

  // ── Live driver position tracking ──────────
  useEffect(() => {
    if (!ride?.driver_id || status === 'idle' || status === 'confirm' || status === 'searching') return;
    const interval = setInterval(async () => {
      try {
        const { data } = await supabase.from('profiles')
          .select('latitude, longitude')
          .eq('id', ride.driver_id).single();
        if (data?.latitude && data?.longitude) {
          setDriverLoc({ latitude: data.latitude, longitude: data.longitude });
        }
      } catch (e) {
        console.warn('Driver position error:', e);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [ride?.driver_id, status]);

  // ── Address search (Nominatim) ─────────────
  const onSearch = (txt) => {
    setSearch(txt);
    setSearchError(false);
    if (timer.current) clearTimeout(timer.current);
    if (txt.length < 2) { setResults([]); return; }
    timer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const q = encodeURIComponent(txt + ', Dakar, Senegal');
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=8&countrycodes=sn&viewbox=-17.56,14.80,-17.33,14.60&bounded=1`,
          { headers: { 'User-Agent': 'YokhLaa/1.0' }, signal: controller.signal }
        );
        clearTimeout(timeout);
        const data = await res.json();
        setResults(data.map(i => ({
          name: i.display_name.split(',')[0],
          area: i.display_name.split(',').slice(1, 3).join(',').trim(),
          lat: parseFloat(i.lat), lng: parseFloat(i.lon),
        })));
      } catch (e) {
        if (e.name !== 'AbortError') {
          console.warn('Search error:', e);
          setSearchError(true);
        }
        setResults([]);
      }
      setSearching(false);
    }, 350);
  };

  const pickPickup = (p) => {
    selectionChanged();
    const newLoc = { latitude: p.lat, longitude: p.lng };
    setLoc(newLoc);
    setPickupAddress(p.name);
    setSearch(''); setShowSearch(false); setSearchingPickup(false);
    // Recalculate route if destination already set
    if (dest) {
      const k = haversine(p.lat, p.lng, dest.lat, dest.lng);
      setKm(Math.round(k * 10) / 10);
      setBasePrice(calcPrice(k));
      setEta(Math.max(3, Math.round(k * 4)));
      fetchTrafficRoute(p.lat, p.lng, dest.lat, dest.lng);
      setStatus('confirm');
    }
  };

  const pickDest = (d) => {
    selectionChanged();
    setDest(d); setSearch(d.name); setShowSearch(false); setSearchingPickup(false);
    // Save to history
    addToSearchHistory(d).then(setSearchHistory);
    if (loc) {
      const k = haversine(loc.latitude, loc.longitude, d.lat, d.lng);
      setKm(Math.round(k * 10) / 10);
      setBasePrice(calcPrice(k));
      // Fallback ETA
      setEta(Math.max(3, Math.round(k * 4)));
      // Fetch ETA avec trafic temps réel
      fetchTrafficRoute(loc.latitude, loc.longitude, d.lat, d.lng);
    }
    setStatus('confirm');
  };

  const fetchTrafficRoute = async (fromLat, fromLng, toLat, toLng) => {
    try {
      const route = await getRouteWithTraffic(fromLat, fromLng, toLat, toLng);
      setKm(route.distanceKm);
      setEta(route.etaMinutes);
      setTrafficInfo(route);

      // Calculer le prix avec surge
      const classMult = RIDE_CLASSES.find(r => r.id === rideClass)?.mult || 1;
      const pricing = calculatePrice(route.distanceKm, route.congestionRatio, classMult);
      setBasePrice(pricing.basePrice);
      setSurgeActive(pricing.surgeActive);
      setSurgeMult(pricing.surgeMult);
    } catch (e) {
      console.warn('Traffic route error:', e);
    }
  };

  const getPrice = (id) => {
    const c = RIDE_CLASSES.find(r => r.id === id);
    const classMult = c?.mult || 1;
    if (trafficInfo) {
      const pricing = calculatePrice(km, trafficInfo.congestionRatio, classMult);
      return pricing.finalPrice;
    }
    return Math.round(basePrice * classMult);
  };

  // ── Request ride ───────────────────────────
  const requestRide = async () => {
    if (!dest || !loc) return;
    const p = getPrice(rideClass);
    setStatus('searching');
    try {
      const { data, error } = await supabase.from('rides').insert({
        passenger_id: user?.id || null,
        pickup_address: pickupAddress, pickup_lat: loc.latitude, pickup_lng: loc.longitude,
        dropoff_address: dest.name, dropoff_lat: dest.lat, dropoff_lng: dest.lng,
        distance_km: km, duration_min: eta, price: p, ride_class: rideClass, status: 'pending',
        payment_method: payMethod,
      }).select().single();
      if (error) throw error;
      setRide(data);

      // Push notify all online drivers
      notifyDriversOfNewRide(data);

      // Auto-cancel if no driver accepts within 3 minutes
      rideTimeoutRef.current = setTimeout(async () => {
        try {
          // Only cancel if still pending
          const { data: current } = await supabase.from('rides')
            .select('status').eq('id', data.id).single();
          if (current?.status === 'pending') {
            await supabase.from('rides').update({ status: 'cancelled' }).eq('id', data.id);
            setStatus('confirm');
            setRide(null);
            setDriver(null);
            Alert.alert(
              'Aucun chauffeur disponible',
              'Aucun chauffeur n\'a accepte votre course. Reessayez dans quelques instants.'
            );
          }
        } catch (e) {
          console.warn('Ride timeout error:', e);
        }
      }, 180000); // 3 minutes
    } catch (e) {
      console.warn('Request ride error:', e);
      setStatus('confirm');
      Alert.alert('Erreur', 'Impossible de commander. Verifiez votre connexion et reessayez.');
    }
  };

  const cancel = async () => {
    if (rideTimeoutRef.current) { clearTimeout(rideTimeoutRef.current); rideTimeoutRef.current = null; }
    if (ride?.id) {
      try {
        await supabase.from('rides').update({ status: 'cancelled' }).eq('id', ride.id);
        if (ride.driver_id) notifyDriverRideCancelled(ride);
      } catch (e) {
        console.warn('Cancel error:', e);
      }
    }
    setStatus(dest ? 'confirm' : 'idle'); setRide(null); setDriver(null);
  };

  const shareRide = async () => {
    if (!ride?.id) return;
    tapLight();
    try {
      // Generate share token if not exists
      let token = ride.share_token;
      if (!token) {
        token = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
        await supabase.from('rides').update({ share_token: token }).eq('id', ride.id);
        setRide(prev => ({ ...prev, share_token: token }));
      }

      const driverInfo = driver?.nom ? `\nChauffeur: ${driver.nom}` : '';
      const plateInfo = driver?.plaque ? ` (${driver.plaque})` : '';
      const statusText = status === 'matched' ? 'en route' : status === 'arriving' ? 'arrive' : 'en cours';

      await Share.share({
        message: `Je suis en course avec Yokh Laa !\n\n` +
          `Trajet: ${ride.pickup_address} → ${ride.dropoff_address}\n` +
          `Statut: ${statusText}${driverInfo}${plateInfo}\n` +
          `Distance: ${ride.distance_km} km\n\n` +
          `Suivez ma course en direct dans l'app Yokh Laa avec le code: ${token}\n\n` +
          `#YokhLaa - Transport Dakar sans commission`,
        title: 'Partager ma course Yokh Laa',
      });
    } catch (e) {
      if (e.message !== 'User did not share') {
        console.warn('Share error:', e);
      }
    }
  };

  const handleRatingSubmit = async ({ rating, comment }) => {
    if (ratingRideId) {
      try {
        const updates = { rating_driver: rating };
        if (comment) updates.comment_passenger = comment;
        await supabase.from('rides').update(updates).eq('id', ratingRideId);

        // Update driver's average rating
        if (ride?.driver_id || driver?.id) {
          const driverId = ride?.driver_id || driver?.id;
          const { data: driverRides } = await supabase.from('rides')
            .select('rating_driver')
            .eq('driver_id', driverId)
            .not('rating_driver', 'is', null);
          if (driverRides?.length) {
            const avg = driverRides.reduce((sum, r) => sum + r.rating_driver, 0) / driverRides.length;
            await supabase.from('profiles').update({
              rating: Math.round(avg * 100) / 100,
              rating_count: driverRides.length,
            }).eq('id', driverId);
          }
        }
      } catch (e) {
        console.warn('Rating error:', e);
      }
    }
    setShowRating(false); setRatingRideId(null);
  };

  const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Bonjour' : h < 18 ? 'Bon apres-midi' : 'Bonsoir'; };

  const callDriver = () => {
    if (driver?.phone) {
      Linking.openURL(`tel:${driver.phone}`);
    } else {
      Alert.alert('Appel', 'Le numero du chauffeur n\'est pas disponible.');
    }
  };

  const chatDriver = () => {
    if (ride?.id && driver) {
      navigation.getParent()?.navigate('Chat', {
        rideId: ride.id,
        otherName: driver.nom || 'Chauffeur',
        otherRole: 'chauffeur',
      });
    } else if (driver?.phone) {
      const msg = encodeURIComponent('Bonjour, je suis votre passager Yokh Laa.');
      Linking.openURL(`https://wa.me/${driver.phone.replace('+', '')}?text=${msg}`);
    } else {
      Alert.alert('Message', 'Le numero du chauffeur n\'est pas disponible.');
    }
  };

  const handleSOS = () => {
    Alert.alert(
      'Urgence',
      'Voulez-vous appeler les secours ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Appeler le 17', style: 'destructive', onPress: () => Linking.openURL(`tel:${SOS_NUMBER}`) },
      ]
    );
  };

  const handleReport = () => {
    tapLight();
    Alert.alert(
      'Signaler un probleme',
      'Que souhaitez-vous signaler ?',
      [
        {
          text: 'Ce n\'est pas le bon chauffeur',
          onPress: () => submitReport('wrong_driver', 'Le chauffeur ne correspond pas a la photo'),
        },
        {
          text: 'Ce n\'est pas le bon vehicule',
          onPress: () => submitReport('wrong_vehicle', 'Le vehicule ne correspond pas a celui enregistre'),
        },
        {
          text: 'Je ne me sens pas en securite',
          onPress: () => submitReport('unsafe', 'Passager ne se sent pas en securite'),
        },
        { text: 'Annuler', style: 'cancel' },
      ],
    );
  };

  const submitReport = async (type, desc) => {
    if (!ride?.id || !user?.id) return;
    const ok = await reportDriverMismatch(ride.id, user.id, type, desc);
    if (ok) {
      Alert.alert(
        'Signalement envoye',
        'Notre equipe va examiner votre signalement. Si vous etes en danger, appelez le 17.',
      );
    } else {
      Alert.alert('Erreur', 'Impossible d\'envoyer le signalement. Reessayez.');
    }
  };

  const setSavedAddress = (type) => {
    const addr = savedAddresses[type];
    if (addr) {
      pickDest(addr);
    } else {
      Alert.alert(
        type === 'home' ? 'Maison' : 'Travail',
        'Adresse non definie. Recherchez votre adresse et elle sera sauvegardee.',
      );
    }
  };

  // ── LOADING ────────────────────────────────
  if (!loc) return (
    <View style={s.root}>
      <StatusBar style="light" />
      <View style={s.center}><ActivityIndicator size="large" color={COLORS.green} /><Text style={s.loadTxt}>Localisation...</Text></View>
    </View>
  );

  // ── SEARCH FULLSCREEN ──────────────────────
  if (showSearch) {
    const showHistoryAndPopular = search.length < 2 && results.length === 0;

    return (
      <View style={s.root}>
        <StatusBar style="light" />
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {/* Header */}
          <View style={s.shdr}>
            <TouchableOpacity onPress={() => { setShowSearch(false); setSearchingPickup(false); }} style={s.shdrBack}>
              <Ionicons name="arrow-back" size={22} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={s.shdrTitle}>{searchingPickup ? 'Point de depart' : 'Destination'}</Text>
            <View style={{ width: 38 }} />
          </View>

          {/* From / To inputs */}
          <View style={s.sinputBox}>
            <View style={s.sdots}>
              <View style={s.sdotG} /><View style={s.sdotLine} /><View style={s.sdotR} />
            </View>
            <View style={{ flex: 1 }}>
              {searchingPickup ? (
                <View style={s.sfieldRow}>
                  <Ionicons name="radio-button-on" size={10} color={COLORS.green} />
                  <TextInput
                    style={s.sinput}
                    value={search}
                    onChangeText={onSearch}
                    placeholder="Modifier le depart"
                    placeholderTextColor={COLORS.dim2}
                    autoFocus
                    returnKeyType="search"
                  />
                  {search.length > 0 && (
                    <TouchableOpacity onPress={() => { setSearch(''); setResults([]); setSearchError(false); }}>
                      <Ionicons name="close-circle" size={18} color={COLORS.dim} />
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <TouchableOpacity style={s.sfieldRow} onPress={() => { setSearchingPickup(true); setSearch(''); setResults([]); }} activeOpacity={0.7}>
                  <Ionicons name="radio-button-on" size={10} color={COLORS.green} />
                  <Text style={s.sfieldFixed} numberOfLines={1}>{pickupAddress}</Text>
                  <Ionicons name="create-outline" size={14} color={COLORS.dim} />
                </TouchableOpacity>
              )}
              <View style={s.sdivider} />
              {searchingPickup ? (
                <TouchableOpacity style={s.sfieldRow} onPress={() => { setSearchingPickup(false); setSearch(''); setResults([]); }} activeOpacity={0.7}>
                  <Ionicons name="location" size={10} color={COLORS.red} />
                  <Text style={s.sfieldFixed} numberOfLines={1}>{dest?.name || 'Ou allez-vous ?'}</Text>
                </TouchableOpacity>
              ) : (
                <View style={s.sfieldRow}>
                  <Ionicons name="location" size={10} color={COLORS.red} />
                  <TextInput
                    style={s.sinput}
                    value={search}
                    onChangeText={onSearch}
                    placeholder="Ou allez-vous ?"
                    placeholderTextColor={COLORS.dim2}
                    autoFocus
                    returnKeyType="search"
                  />
                  {search.length > 0 && (
                    <TouchableOpacity onPress={() => { setSearch(''); setResults([]); setSearchError(false); }}>
                      <Ionicons name="close-circle" size={18} color={COLORS.dim} />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* Results */}
          <ScrollView style={s.slist} keyboardShouldPersistTaps="handled">
            {/* GPS position shortcut (pickup mode) */}
            {searchingPickup && (
              <TouchableOpacity style={s.sresult} onPress={async () => {
                tapLight();
                try {
                  const r = await Location.getCurrentPositionAsync({});
                  const coords = { latitude: r.coords.latitude, longitude: r.coords.longitude };
                  setLoc(coords);
                  reverseGeocode(coords.latitude, coords.longitude);
                  setSearch(''); setShowSearch(false); setSearchingPickup(false);
                  if (dest) {
                    const k = haversine(coords.latitude, coords.longitude, dest.lat, dest.lng);
                    setKm(Math.round(k * 10) / 10);
                    setBasePrice(calcPrice(k));
                    setEta(Math.max(3, Math.round(k * 4)));
                    fetchTrafficRoute(coords.latitude, coords.longitude, dest.lat, dest.lng);
                    setStatus('confirm');
                  }
                } catch (e) { console.warn('GPS error:', e); }
              }}>
                <View style={[s.sresultIcon, { backgroundColor: COLORS.greenLight }]}>
                  <Ionicons name="navigate" size={16} color={COLORS.green} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.sresultName}>Ma position GPS</Text>
                  <Text style={s.sresultArea}>Utiliser la localisation actuelle</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Saved addresses */}
            <View style={s.ssaved}>
              <TouchableOpacity style={s.ssavedItem} onPress={() => setSavedAddress('home')}>
                <View style={[s.ssavedIcon, { backgroundColor: 'rgba(74,144,255,0.1)' }]}>
                  <Ionicons name="home" size={16} color="#4A90FF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.ssavedTxt}>Maison</Text>
                  {savedAddresses.home && <Text style={s.ssavedAddr} numberOfLines={1}>{savedAddresses.home.name}</Text>}
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={s.ssavedItem} onPress={() => setSavedAddress('work')}>
                <View style={[s.ssavedIcon, { backgroundColor: COLORS.greenLight }]}>
                  <Ionicons name="briefcase" size={16} color={COLORS.green} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.ssavedTxt}>Travail</Text>
                  {savedAddresses.work && <Text style={s.ssavedAddr} numberOfLines={1}>{savedAddresses.work.name}</Text>}
                </View>
              </TouchableOpacity>
            </View>

            {/* Recent searches */}
            {showHistoryAndPopular && searchHistory.length > 0 && (
              <>
                <View style={s.sectionHeader}>
                  <Ionicons name="time-outline" size={14} color={COLORS.dim} />
                  <Text style={s.sectionTitle}>Recents</Text>
                  <TouchableOpacity
                    onPress={() => { clearSearchHistory(); setSearchHistory([]); }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={s.sectionAction}>Effacer</Text>
                  </TouchableOpacity>
                </View>
                {searchHistory.map((h, i) => (
                  <TouchableOpacity key={`h-${i}`} style={s.sresult} onPress={() => searchingPickup ? pickPickup(h) : pickDest(h)}>
                    <View style={[s.sresultIcon, { backgroundColor: 'rgba(74,144,255,0.08)' }]}>
                      <Ionicons name="time" size={16} color="#4A90FF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.sresultName} numberOfLines={1}>{h.name}</Text>
                      {h.area ? <Text style={s.sresultArea} numberOfLines={1}>{h.area}</Text> : null}
                    </View>
                    <Ionicons name="arrow-forward" size={14} color={COLORS.dim2} />
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* Popular places */}
            {showHistoryAndPopular && (
              <>
                <View style={s.sectionHeader}>
                  <Ionicons name="trending-up" size={14} color={COLORS.green} />
                  <Text style={s.sectionTitle}>Lieux populaires</Text>
                </View>
                {POPULAR_PLACES.map((p, i) => (
                  <TouchableOpacity key={`p-${i}`} style={s.sresult} onPress={() => searchingPickup ? pickPickup(p) : pickDest(p)}>
                    <View style={[s.sresultIcon, { backgroundColor: COLORS.greenLight }]}>
                      <Ionicons name={p.icon || 'location'} size={16} color={COLORS.green} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.sresultName} numberOfLines={1}>{p.name}</Text>
                      <Text style={s.sresultArea} numberOfLines={1}>{p.area}</Text>
                    </View>
                    <Ionicons name="arrow-forward" size={14} color={COLORS.dim2} />
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* Search results */}
            {searching && <ActivityIndicator color={COLORS.green} style={{ marginVertical: 20 }} />}

            {!showHistoryAndPopular && results.length > 0 && (
              <View style={s.sectionHeader}>
                <Ionicons name="search" size={14} color={COLORS.dim} />
                <Text style={s.sectionTitle}>Resultats</Text>
                <Text style={s.sectionCount}>{results.length}</Text>
              </View>
            )}

            {results.map((r, i) => (
              <TouchableOpacity key={`r-${i}`} style={s.sresult} onPress={() => searchingPickup ? pickPickup(r) : pickDest(r)}>
                <View style={s.sresultIcon}><Ionicons name="location" size={16} color={COLORS.green} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.sresultName} numberOfLines={1}>{r.name}</Text>
                  <Text style={s.sresultArea} numberOfLines={1}>{r.area}</Text>
                </View>
                {loc && <Text style={s.sresultDist}>{Math.round(haversine(loc.latitude, loc.longitude, r.lat, r.lng) * 10) / 10} km</Text>}
              </TouchableOpacity>
            ))}

            {searchError && (
              <View style={s.serrorWrap}>
                <Ionicons name="cloud-offline-outline" size={32} color={COLORS.dim} />
                <Text style={s.snoResult}>Erreur de connexion</Text>
                <Text style={s.serrorSub}>Verifiez votre internet et reessayez</Text>
              </View>
            )}

            {!searching && !searchError && search.length >= 2 && results.length === 0 && (
              <View style={s.serrorWrap}>
                <Ionicons name="location-outline" size={32} color={COLORS.dim} />
                <Text style={s.snoResult}>Aucun resultat</Text>
                <Text style={s.serrorSub}>Essayez un quartier ou un lieu connu de Dakar</Text>
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // ── MAIN SCREEN ────────────────────────────
  return (
    <View style={s.root}>
      <StatusBar style="light" />

      {/* Map */}
      <View style={s.map}>
        <DakarMap
          userLocation={loc}
          destination={dest}
          nearbyDrivers={status === 'idle' || status === 'confirm' ? nearbyDrivers : []}
          driverLocation={driverLoc && (status === 'matched' || status === 'arriving' || status === 'trip') ? driverLoc : null}
        />
      </View>

      {/* Top overlay — Uber-style mode switcher */}
      <View style={s.top}>
        <TouchableOpacity style={s.topBtn} onPress={() => navigation.openDrawer?.()}>
          <Ionicons name="menu" size={20} color={COLORS.white} />
        </TouchableOpacity>

        {profile?.vehicule && profile?.plaque ? (
          <View style={s.modeSwitcher}>
            <View style={[s.modeOption, s.modeActive]}>
              <Ionicons name="person" size={14} color="#fff" />
              <Text style={s.modeActiveTxt}>Se deplacer</Text>
            </View>
            <TouchableOpacity
              style={s.modeOption}
              onPress={() => { tapMedium(); switchRole('chauffeur'); }}
              activeOpacity={0.7}
            >
              <Ionicons name="car" size={14} color={COLORS.dim} />
              <Text style={s.modeTxt}>Conduire</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={s.topGreet}>{greet()} !</Text>
        )}

        <TouchableOpacity style={s.topBtn}>
          <Ionicons name="notifications-outline" size={18} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* ─── IDLE: "Ou allez-vous?" ─── */}
      {status === 'idle' && (
        <View style={s.sheet}>
          <View style={s.handle} />
          <TouchableOpacity style={s.whereTo} onPress={() => { setSearch(''); setResults([]); setSearchError(false); setShowSearch(true); }} activeOpacity={0.8}>
            <Ionicons name="search" size={18} color={COLORS.green} />
            <Text style={s.whereToTxt}>Ou allez-vous ?</Text>
            <View style={s.whereToNow}><Ionicons name="time" size={12} color={COLORS.dim} /><Text style={s.whereToNowTxt}>Maintenant</Text></View>
          </TouchableOpacity>
          {nearbyDrivers.length > 0 && (
            <View style={s.driversNearby}>
              <View style={s.driversNearbyDot} />
              <Text style={s.driversNearbyTxt}>{nearbyDrivers.length} chauffeur{nearbyDrivers.length > 1 ? 's' : ''} a proximite</Text>
            </View>
          )}
        </View>
      )}

      {/* ─── CONFIRM: Route + class selection ─── */}
      {status === 'confirm' && dest && (
        <View style={s.sheet}>
          <View style={s.handle} />

          {/* Route bar */}
          <View style={s.routeBar}>
            <View style={s.routeDots}><View style={s.sdotG} /><View style={[s.sdotLine, { height: 10 }]} /><View style={s.sdotR} /></View>
            <View style={{ flex: 1 }}>
              <TouchableOpacity onPress={() => { setSearchingPickup(true); setSearch(''); setResults([]); setShowSearch(true); }} activeOpacity={0.7}>
                <Text style={s.routeFrom} numberOfLines={1}>{pickupAddress} <Ionicons name="create-outline" size={11} color={COLORS.dim} /></Text>
              </TouchableOpacity>
              <Text style={s.routeTo} numberOfLines={1}>{dest.name}</Text>
            </View>
            <TouchableOpacity onPress={() => { setDest(null); setStatus('idle'); setSearchingPickup(false); setShowSearch(true); }}>
              <Ionicons name="create-outline" size={18} color={COLORS.dim} />
            </TouchableOpacity>
          </View>

          {/* Ride class horizontal scroll */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.classScroll} contentContainerStyle={s.classScrollContent}>
            {RIDE_CLASSES.map(c => {
              const active = rideClass === c.id;
              const etaForClass = c.id === 'start' ? eta : c.id === 'confort' ? eta + 1 : c.id === 'premium' ? eta + 3 : eta + 5;
              return (
                <TouchableOpacity key={c.id} style={[s.classCard, active && s.classCardActive]} onPress={() => setRideClass(c.id)} activeOpacity={0.7}>
                  <View style={s.classTop}>
                    <Ionicons name={c.icon} size={22} color={active ? COLORS.green : COLORS.dim} />
                    {c.id === 'confort' && <View style={s.classBadge}><Text style={s.classBadgeTxt}>Top</Text></View>}
                  </View>
                  <Text style={[s.className, active && { color: COLORS.white }]}>{c.name}</Text>
                  <Text style={s.classTime}>{etaForClass} min</Text>
                  <Text style={[s.classPrice, active && { color: COLORS.green }]}>{getPrice(c.id).toLocaleString()} F</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Traffic indicator + surge */}
          {trafficInfo && (
            <View style={s.trafficRow}>
              <View style={[s.trafficDot, { backgroundColor: getTrafficLevel(trafficInfo.congestionRatio).color }]} />
              <Text style={s.trafficLabel}>{getTrafficLevel(trafficInfo.congestionRatio).label}</Text>
              {trafficInfo.trafficDelay > 0 && (
                <Text style={s.trafficDelay}>+{trafficInfo.trafficDelay} min</Text>
              )}
              {surgeActive && (
                <View style={s.surgeBadge}>
                  <Ionicons name="trending-up" size={12} color="#fff" />
                  <Text style={s.surgeTxt}>x{surgeMult}</Text>
                </View>
              )}
            </View>
          )}

          {/* Payment method */}
          <View style={s.payRow}>
            {PAYMENT_METHODS.map(pm => (
              <TouchableOpacity
                key={pm.id}
                style={[s.payOption, payMethod === pm.id && s.payOptionActive]}
                onPress={() => setPayMethod(pm.id)}
              >
                <Ionicons name={pm.icon} size={14} color={payMethod === pm.id ? COLORS.green : COLORS.dim} />
                <Text style={[s.payOptionTxt, payMethod === pm.id && { color: COLORS.green }]}>{pm.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* CTA */}
          <TouchableOpacity style={s.cta} onPress={requestRide} activeOpacity={0.85}>
            <Text style={s.ctaTxt}>Commander · {getPrice(rideClass).toLocaleString()} FCFA</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ─── SEARCHING ─── */}
      {status === 'searching' && (
        <View style={s.sheet}>
          <View style={s.handle} />
          <View style={s.searchingWrap}>
            <Animated.View style={[s.searchingCircle, { transform: [{ scale: pulse }] }]}>
              <Ionicons name="car" size={24} color="#fff" />
            </Animated.View>
            <Text style={s.searchingTitle}>Recherche d'un chauffeur</Text>
            <Text style={s.searchingDest}>{dest?.name} · {km} km · ~{Math.round(km * 4)} min</Text>
            <TouchableOpacity style={s.cancelBtn} onPress={cancel}>
              <Text style={s.cancelTxt}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ─── DRIVER MATCHED / ARRIVING / TRIP ─── */}
      {(status === 'matched' || status === 'arriving' || status === 'trip') && driver && (
        <View style={s.sheet}>
          <View style={s.handle} />

          {/* Status pill */}
          <View style={s.statusPill}>
            <View style={[s.statusDot, status === 'arriving' && { backgroundColor: '#FFB800' }, status === 'trip' && { backgroundColor: '#4A90FF' }]} />
            <Text style={[s.statusTxt, status === 'arriving' && { color: '#FFB800' }, status === 'trip' && { color: '#4A90FF' }]}>
              {status === 'matched' ? 'Chauffeur en route vers vous' : status === 'arriving' ? 'Votre chauffeur est arrive' : 'Course en cours'}
            </Text>
            {status === 'matched' && <Text style={s.statusEta}>{eta > 0 ? `${Math.max(2, Math.round(eta * 0.4))} min` : '...'}</Text>}
          </View>

          {/* Driver card */}
          {driver && <View style={s.driverCard}>
            <View style={s.driverAvatar}><Text style={s.driverInit}>{(driver.nom || 'C')[0]}</Text></View>
            <View style={s.driverInfo}>
              <Text style={s.driverName}>{driver.nom || 'Chauffeur'}</Text>
              <View style={s.driverMeta}>
                {driver.rating > 0 && <>
                  <Ionicons name="star" size={11} color="#FFB800" />
                  <Text style={s.driverRating}>{driver.rating}</Text>
                  <Text style={s.driverDot}>·</Text>
                </>}
                <Text style={s.driverCar}>{driver.vehicule || 'Vehicule'}</Text>
              </View>
              {driver.plaque && (
                <View style={s.plateWrap}>
                  <Text style={s.plateTxt}>{driver.plaque}</Text>
                </View>
              )}
            </View>
            <View style={s.driverActions}>
              <TouchableOpacity style={s.driverActBtn} onPress={chatDriver}><Ionicons name="chatbubble-outline" size={18} color={COLORS.green} /></TouchableOpacity>
              <TouchableOpacity style={[s.driverActBtn, { backgroundColor: COLORS.green }]} onPress={callDriver}><Ionicons name="call" size={18} color="#fff" /></TouchableOpacity>
            </View>
          </View>}

          {/* Route summary */}
          <View style={s.rideSummary}>
            <View style={s.rideSumRow}>
              <Ionicons name="navigate" size={13} color={COLORS.green} />
              <Text style={s.rideSumTxt}>{dest?.name}</Text>
              <Text style={s.rideSumRight}>{km} km · ~{eta} min</Text>
            </View>
            <View style={[s.rideSumRow, { borderBottomWidth: 0 }]}>
              <Ionicons name="cash-outline" size={13} color={COLORS.green} />
              <Text style={s.rideSumTxt}>{getPrice(rideClass).toLocaleString()} FCFA</Text>
              <Text style={s.rideSumRight}>A regler au chauffeur</Text>
            </View>
          </View>

          {/* Share + Cancel row */}
          <View style={s.shareRow}>
            <TouchableOpacity style={s.shareBtn} onPress={shareRide} activeOpacity={0.7}>
              <Ionicons name="share-outline" size={16} color={COLORS.green} />
              <Text style={s.shareTxt}>Partager ma course</Text>
            </TouchableOpacity>
            {status === 'matched' && (
              <TouchableOpacity style={s.cancelSmall} onPress={cancel}>
                <Text style={s.cancelSmallTxt}>Annuler</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Safety row */}
          {(status === 'matched' || status === 'arriving' || status === 'trip') && (
            <View style={s.safetyRow}>
              <TouchableOpacity style={s.reportBtn} onPress={handleReport} activeOpacity={0.7}>
                <Ionicons name="flag" size={14} color="#FFB800" />
                <Text style={s.reportTxt}>Signaler</Text>
              </TouchableOpacity>
              {status === 'trip' && (
                <TouchableOpacity style={s.sosBtn} onPress={handleSOS}>
                  <Ionicons name="alert-circle" size={14} color="#fff" />
                  <Text style={s.sosTxt}>SOS Urgence</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}

      {/* Rating Modal */}
      <RatingModal
        visible={showRating}
        onSubmit={handleRatingSubmit}
        onClose={() => { setShowRating(false); setRatingRideId(null); }}
        driverName={driver?.nom}
        ridePrice={ride?.price}
      />
    </View>
  );
}

// ── STYLES ─────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.black },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadTxt: { color: COLORS.dim, marginTop: 10, fontSize: 14 },
  map: { flex: 1 },

  // Top bar
  top: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 54 : 38, paddingHorizontal: 16, paddingBottom: 8,
  },
  topBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(8,10,13,0.7)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  topGreet: {
    fontSize: 16, fontWeight: '700', color: COLORS.white,
    textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6,
  },

  // Uber-style mode switcher
  modeSwitcher: {
    flexDirection: 'row', backgroundColor: 'rgba(8,10,13,0.85)',
    borderRadius: 25, padding: 3,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  modeOption: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 22,
  },
  modeActive: {
    backgroundColor: COLORS.green,
  },
  modeActiveTxt: { fontSize: 13, fontWeight: '700', color: '#fff' },
  modeTxt: { fontSize: 13, fontWeight: '600', color: COLORS.dim },

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

  // Where to
  whereTo: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.card, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.line,
    paddingVertical: 16, paddingHorizontal: 16, marginBottom: 8,
  },
  whereToTxt: { flex: 1, fontSize: 16, fontWeight: '600', color: COLORS.dim },
  whereToNow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.surface, borderRadius: 8, paddingVertical: 5, paddingHorizontal: 10,
  },
  whereToNowTxt: { fontSize: 11, color: COLORS.dim, fontWeight: '600' },

  // Nearby drivers indicator
  driversNearby: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', paddingVertical: 6 },
  driversNearbyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.green },
  driversNearbyTxt: { fontSize: 12, color: COLORS.green },

  // Route bar
  routeBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.line,
    padding: 14, marginBottom: 14,
  },
  routeDots: { alignItems: 'center', gap: 1 },
  routeFrom: { fontSize: 12, color: COLORS.dim, marginBottom: 4 },
  routeTo: { fontSize: 14, fontWeight: '700', color: COLORS.white },

  // Ride class scroll
  classScroll: { marginBottom: 12, marginHorizontal: -20 },
  classScrollContent: { paddingHorizontal: 20, gap: 8 },
  classCard: {
    width: (width - 64) / 4, backgroundColor: COLORS.card, borderRadius: 14,
    borderWidth: 1.5, borderColor: COLORS.line,
    paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center',
  },
  classCardActive: { borderColor: COLORS.green, backgroundColor: 'rgba(34,197,94,0.06)' },
  classTop: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  classBadge: { backgroundColor: COLORS.green, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
  classBadgeTxt: { fontSize: 7, fontWeight: '800', color: '#fff' },
  className: { fontSize: 12, fontWeight: '700', color: COLORS.dim, marginBottom: 2 },
  classTime: { fontSize: 10, color: COLORS.dim2, marginBottom: 4 },
  classPrice: { fontSize: 13, fontWeight: '800', color: COLORS.dim },

  // Pay info
  payInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  payInfoTxt: { fontSize: 12, color: COLORS.dim },

  // CTA
  cta: {
    backgroundColor: COLORS.green, borderRadius: 14, paddingVertical: 17, alignItems: 'center',
  },
  ctaTxt: { fontSize: 16, fontWeight: '700', color: '#fff' },

  // Searching
  searchingWrap: { alignItems: 'center', paddingVertical: 12 },
  searchingCircle: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.green,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  searchingTitle: { fontSize: 17, fontWeight: '700', color: COLORS.white, marginBottom: 4 },
  searchingDest: { fontSize: 13, color: COLORS.dim, marginBottom: 18 },
  cancelBtn: {
    paddingVertical: 10, paddingHorizontal: 28, borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', backgroundColor: 'rgba(239,68,68,0.05)',
  },
  cancelTxt: { fontSize: 14, fontWeight: '600', color: COLORS.red },

  // Status pill
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.greenLight, borderWidth: 1, borderColor: COLORS.greenBorder,
    borderRadius: 10, paddingVertical: 9, paddingHorizontal: 12, marginBottom: 14,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.green },
  statusTxt: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.green },
  statusEta: { fontSize: 13, fontWeight: '700', color: COLORS.green },

  // Driver card
  driverCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14,
  },
  driverAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(34,197,94,0.1)', borderWidth: 2, borderColor: COLORS.green,
    alignItems: 'center', justifyContent: 'center',
  },
  driverInit: { fontSize: 18, fontWeight: '800', color: COLORS.green },
  driverInfo: { flex: 1 },
  driverName: { fontSize: 15, fontWeight: '700', color: COLORS.white },
  driverMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  driverRating: { fontSize: 12, fontWeight: '600', color: '#FFB800' },
  driverDot: { fontSize: 10, color: COLORS.dim },
  driverCar: { fontSize: 12, color: COLORS.dim },
  plateWrap: {
    alignSelf: 'flex-start', marginTop: 4,
    backgroundColor: COLORS.surface, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: COLORS.line,
  },
  plateTxt: { fontSize: 11, fontWeight: '700', color: COLORS.white, letterSpacing: 1 },
  driverActions: { flexDirection: 'row', gap: 8 },
  driverActBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.greenLight, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.greenBorder,
  },

  // Ride summary
  rideSummary: {
    backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.line,
    marginBottom: 10, overflow: 'hidden',
  },
  rideSumRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.line,
  },
  rideSumTxt: { flex: 1, fontSize: 13, color: COLORS.white },
  rideSumRight: { fontSize: 12, color: COLORS.dim },

  // Payment selector
  payRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  payOption: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 10,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.line,
  },
  payOptionActive: { borderColor: COLORS.green, backgroundColor: 'rgba(34,197,94,0.06)' },
  payOptionTxt: { fontSize: 11, fontWeight: '600', color: COLORS.dim },

  // Traffic
  trafficRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 4, paddingVertical: 8,
  },
  trafficDot: { width: 8, height: 8, borderRadius: 4 },
  trafficLabel: { fontSize: 12, fontWeight: '600', color: COLORS.dim },
  trafficDelay: { fontSize: 12, color: '#F97316', fontWeight: '600' },
  surgeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: '#F97316', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3, marginLeft: 'auto',
  },
  surgeTxt: { fontSize: 11, fontWeight: '700', color: '#fff' },

  // Safety row
  safetyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8,
  },
  reportBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 12,
    backgroundColor: 'rgba(255,184,0,0.08)', borderWidth: 1, borderColor: 'rgba(255,184,0,0.2)',
  },
  reportTxt: { fontSize: 13, fontWeight: '700', color: '#FFB800' },
  sosBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
  },
  sosTxt: { fontSize: 13, fontWeight: '700', color: COLORS.red },

  shareRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10,
    backgroundColor: COLORS.greenLight, borderWidth: 1, borderColor: COLORS.greenBorder,
  },
  shareTxt: { fontSize: 13, fontWeight: '600', color: COLORS.green },
  cancelSmall: { paddingVertical: 8, paddingHorizontal: 12 },
  cancelSmallTxt: { fontSize: 13, color: COLORS.red },

  // ── SEARCH FULLSCREEN ──
  shdr: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 54 : 38, paddingHorizontal: 16, paddingBottom: 8,
  },
  shdrBack: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center',
  },
  shdrTitle: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  sinputBox: {
    flexDirection: 'row', gap: 10, marginHorizontal: 16,
    backgroundColor: COLORS.card, borderRadius: 14, borderWidth: 1, borderColor: COLORS.line,
    padding: 14,
  },
  sdots: { alignItems: 'center', gap: 2, paddingTop: 6 },
  sdotG: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.green },
  sdotLine: { width: 1, height: 14, backgroundColor: COLORS.line },
  sdotR: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.red },
  sfieldRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  sfieldFixed: { fontSize: 14, color: COLORS.dim },
  sdivider: { height: 1, backgroundColor: COLORS.line, marginVertical: 2 },
  sinput: { flex: 1, fontSize: 15, color: COLORS.white, padding: 0 },
  slist: { flex: 1, marginTop: 8 },
  ssaved: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 8, marginTop: 6 },
  ssavedItem: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.line,
    paddingVertical: 12, paddingHorizontal: 14,
  },
  ssavedIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  ssavedTxt: { fontSize: 13, fontWeight: '600', color: COLORS.white },
  sresult: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 13, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.line,
  },
  sresultIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.greenLight, alignItems: 'center', justifyContent: 'center',
  },
  sresultName: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  sresultArea: { fontSize: 11, color: COLORS.dim, marginTop: 1 },
  sresultDist: { fontSize: 11, color: COLORS.dim2, fontWeight: '600' },
  ssavedAddr: { fontSize: 10, color: COLORS.dim2, marginTop: 1 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingTop: 18, paddingBottom: 8,
  },
  sectionTitle: { flex: 1, fontSize: 12, fontWeight: '700', color: COLORS.dim, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionAction: { fontSize: 12, color: COLORS.green, fontWeight: '600' },
  sectionCount: {
    fontSize: 10, fontWeight: '700', color: COLORS.dim,
    backgroundColor: COLORS.surface, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2,
  },
  snoResult: { fontSize: 14, fontWeight: '600', color: COLORS.dim, marginTop: 8 },
  serrorWrap: { alignItems: 'center', paddingVertical: 40 },
  serrorSub: { fontSize: 12, color: COLORS.dim2, marginTop: 4 },
});
