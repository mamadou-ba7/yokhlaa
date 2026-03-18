import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Platform, Share, Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import DakarMap from '../components/DakarMap';
import { tapLight, notifySuccess } from '../lib/haptics';

export default function RideDetailScreen({ route, navigation }) {
  const { rideId } = route.params;
  const { user } = useAuth();
  const [ride, setRide] = useState(null);
  const [driverProfile, setDriverProfile] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadRide();
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, [rideId]);

  const loadRide = async () => {
    try {
      const { data } = await supabase.from('rides')
        .select('*')
        .eq('id', rideId)
        .single();
      if (data) {
        setRide(data);
        if (data.driver_id) loadDriver(data.driver_id);
      }
    } catch (e) {
      console.warn('Load ride error:', e);
    }
  };

  const loadDriver = async (driverId) => {
    try {
      const { data } = await supabase.from('profiles')
        .select('nom, phone, vehicule, plaque, rating, photo_url')
        .eq('id', driverId)
        .single();
      if (data) setDriverProfile(data);
    } catch (e) {
      console.warn('Load driver error:', e);
    }
  };

  const reorder = () => {
    tapLight();
    // Navigate back to map with destination pre-filled
    navigation.navigate('Course', {
      reorderDest: {
        name: ride.dropoff_address,
        lat: ride.dropoff_lat,
        lng: ride.dropoff_lng,
      },
    });
  };

  const shareReceipt = async () => {
    tapLight();
    try {
      await Share.share({
        message: `Yokh Laa - Recu de course\n\n` +
          `${ride.pickup_address} → ${ride.dropoff_address}\n` +
          `Distance: ${ride.distance_km} km\n` +
          `Duree: ${ride.duration_min} min\n` +
          `Prix: ${ride.price?.toLocaleString()} FCFA\n` +
          `Paiement: ${formatPayment(ride.payment_method)}\n` +
          `Date: ${formatFullDate(ride.created_at)}\n\n` +
          `Yokh Laa — Transport Dakar sans commission`,
      });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  const formatFullDate = (d) => {
    if (!d) return '';
    const date = new Date(d);
    const months = ['jan', 'fev', 'mar', 'avr', 'mai', 'jun', 'jul', 'aou', 'sep', 'oct', 'nov', 'dec'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} a ${date.getHours()}h${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const formatDuration = (start, end) => {
    if (!start || !end) return null;
    const diff = Math.round((new Date(end) - new Date(start)) / 60000);
    return diff > 0 ? `${diff} min` : null;
  };

  const formatPayment = (method) => {
    switch (method) {
      case 'wave': return 'Wave';
      case 'orange_money': return 'Orange Money';
      default: return 'Especes';
    }
  };

  const statusConfig = (s) => {
    switch (s) {
      case 'completed': return { text: 'Terminee', color: COLORS.green, icon: 'checkmark-circle' };
      case 'cancelled': return { text: 'Annulee', color: COLORS.red, icon: 'close-circle' };
      case 'pending': return { text: 'En attente', color: '#FFB800', icon: 'time' };
      case 'accepted': return { text: 'Acceptee', color: '#4A90FF', icon: 'checkmark' };
      case 'in_progress': return { text: 'En cours', color: '#4A90FF', icon: 'car' };
      default: return { text: s, color: COLORS.dim, icon: 'help' };
    }
  };

  if (!ride) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chargement...</Text>
          <View style={{ width: 38 }} />
        </View>
      </View>
    );
  }

  const st = statusConfig(ride.status);
  const dest = ride.dropoff_lat ? { lat: ride.dropoff_lat, lng: ride.dropoff_lng, name: ride.dropoff_address } : null;
  const pickup = ride.pickup_lat ? { latitude: ride.pickup_lat, longitude: ride.pickup_lng } : null;
  const actualDuration = formatDuration(ride.started_at || ride.accepted_at, ride.completed_at);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => { tapLight(); navigation.goBack(); }}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Details de la course</Text>
        <TouchableOpacity style={styles.backBtn} onPress={shareReceipt}>
          <Ionicons name="share-outline" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView style={{ opacity: fadeAnim }}>
        {/* Mini Map */}
        {pickup && (
          <View style={styles.mapWrap}>
            <DakarMap userLocation={pickup} destination={dest} />
          </View>
        )}

        {/* Status badge */}
        <View style={styles.content}>
          <View style={[styles.statusBadge, { backgroundColor: st.color + '15' }]}>
            <Ionicons name={st.icon} size={16} color={st.color} />
            <Text style={[styles.statusText, { color: st.color }]}>{st.text}</Text>
            <Text style={styles.statusDate}>{formatFullDate(ride.created_at)}</Text>
          </View>

          {/* Route */}
          <View style={styles.routeCard}>
            <View style={styles.routeRow}>
              <View style={styles.routeDots}>
                <View style={styles.dotBlue} />
                <View style={styles.routeLine} />
                <Ionicons name="location" size={12} color={COLORS.green} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.routeLabel}>DEPART</Text>
                <Text style={styles.routeAddress}>{ride.pickup_address || 'Point de depart'}</Text>
                {ride.created_at && <Text style={styles.routeTime}>{new Date(ride.created_at).getHours()}h{String(new Date(ride.created_at).getMinutes()).padStart(2, '0')}</Text>}
              </View>
            </View>
            <View style={styles.routeDivider} />
            <View style={styles.routeRow}>
              <View style={styles.routeDots}>
                <Ionicons name="location" size={12} color={COLORS.green} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.routeLabel}>ARRIVEE</Text>
                <Text style={styles.routeAddress}>{ride.dropoff_address || 'Destination'}</Text>
                {ride.completed_at && <Text style={styles.routeTime}>{new Date(ride.completed_at).getHours()}h{String(new Date(ride.completed_at).getMinutes()).padStart(2, '0')}</Text>}
              </View>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="navigate-outline" size={16} color={COLORS.green} />
              <Text style={styles.statValue}>{ride.distance_km || '—'} km</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={16} color={COLORS.green} />
              <Text style={styles.statValue}>{actualDuration || `${ride.duration_min || '—'} min`}</Text>
              <Text style={styles.statLabel}>Duree</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name={ride.ride_class === 'premium' ? 'car-sport' : 'car-outline'} size={16} color={COLORS.green} />
              <Text style={styles.statValue}>{ride.ride_class || 'Confort'}</Text>
              <Text style={styles.statLabel}>Classe</Text>
            </View>
          </View>

          {/* Receipt */}
          <View style={styles.receiptCard}>
            <Text style={styles.receiptTitle}>Recu</Text>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Course ({ride.distance_km} km)</Text>
              <Text style={styles.receiptValue}>{ride.price?.toLocaleString()} FCFA</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Commission Yokh Laa</Text>
              <Text style={[styles.receiptValue, { color: COLORS.green }]}>0 FCFA</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Paiement</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name={ride.payment_method === 'cash' ? 'cash-outline' : 'phone-portrait-outline'} size={14} color={COLORS.dim} />
                <Text style={styles.receiptValue}>{formatPayment(ride.payment_method)}</Text>
              </View>
            </View>
            <View style={styles.receiptDivider} />
            <View style={styles.receiptRow}>
              <Text style={styles.receiptTotal}>Total</Text>
              <Text style={styles.receiptTotalValue}>{ride.price?.toLocaleString()} FCFA</Text>
            </View>
          </View>

          {/* Driver info */}
          {driverProfile && (
            <View style={styles.driverCard}>
              <View style={styles.driverAvatar}>
                <Text style={styles.driverInit}>{(driverProfile.nom || 'C')[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.driverName}>{driverProfile.nom}</Text>
                <View style={styles.driverMeta}>
                  {driverProfile.rating > 0 && (
                    <>
                      <Ionicons name="star" size={12} color="#FFB800" />
                      <Text style={styles.driverRating}>{driverProfile.rating}</Text>
                      <Text style={styles.driverDot}>·</Text>
                    </>
                  )}
                  <Text style={styles.driverCar}>{driverProfile.vehicule || 'Vehicule'}</Text>
                </View>
                {driverProfile.plaque && (
                  <View style={styles.plateWrap}>
                    <Text style={styles.plateTxt}>{driverProfile.plaque}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Rating display */}
          {ride.rating_driver && (
            <View style={styles.ratingCard}>
              <Text style={styles.ratingTitle}>Votre note</Text>
              <View style={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map(i => (
                  <Ionicons
                    key={i}
                    name={i <= ride.rating_driver ? 'star' : 'star-outline'}
                    size={22}
                    color={i <= ride.rating_driver ? '#FFB800' : COLORS.dim2}
                  />
                ))}
              </View>
              {ride.comment_passenger && (
                <Text style={styles.ratingComment}>"{ride.comment_passenger}"</Text>
              )}
            </View>
          )}

          {/* Actions */}
          {ride.status === 'completed' && (
            <TouchableOpacity style={styles.reorderBtn} onPress={reorder} activeOpacity={0.85}>
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.reorderTxt}>Re-commander ce trajet</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 40 }} />
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 54 : 38,
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.line,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: COLORS.card,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  mapWrap: {
    height: 180, borderBottomWidth: 1, borderBottomColor: COLORS.line,
  },
  content: { padding: 20 },

  // Status
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 16,
  },
  statusText: { fontSize: 14, fontWeight: '700' },
  statusDate: { fontSize: 12, color: COLORS.dim, marginLeft: 'auto' },

  // Route
  routeCard: {
    backgroundColor: COLORS.card, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.line,
    padding: 16, marginBottom: 16,
  },
  routeRow: { flexDirection: 'row', gap: 12 },
  routeDots: { alignItems: 'center', paddingTop: 2 },
  dotBlue: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4A90FF' },
  routeLine: { width: 1, height: 20, backgroundColor: COLORS.line, marginVertical: 2 },
  routeLabel: { fontSize: 10, fontWeight: '700', color: COLORS.dim, letterSpacing: 0.5, marginBottom: 2 },
  routeAddress: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  routeTime: { fontSize: 11, color: COLORS.dim, marginTop: 2 },
  routeDivider: { height: 1, backgroundColor: COLORS.line, marginVertical: 12, marginLeft: 24 },

  // Stats
  statsRow: {
    flexDirection: 'row', backgroundColor: COLORS.card,
    borderRadius: 14, borderWidth: 1, borderColor: COLORS.line,
    padding: 16, marginBottom: 16,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 15, fontWeight: '700', color: COLORS.white },
  statLabel: { fontSize: 10, color: COLORS.dim, textTransform: 'uppercase' },
  statDivider: { width: 1, backgroundColor: COLORS.line },

  // Receipt
  receiptCard: {
    backgroundColor: COLORS.card, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.line,
    padding: 16, marginBottom: 16,
  },
  receiptTitle: { fontSize: 16, fontWeight: '700', color: COLORS.white, marginBottom: 14 },
  receiptRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8,
  },
  receiptLabel: { fontSize: 13, color: COLORS.dim },
  receiptValue: { fontSize: 13, fontWeight: '600', color: COLORS.white },
  receiptDivider: { height: 1, backgroundColor: COLORS.line, marginVertical: 4 },
  receiptTotal: { fontSize: 15, fontWeight: '800', color: COLORS.white },
  receiptTotalValue: { fontSize: 17, fontWeight: '800', color: COLORS.green },

  // Driver
  driverCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.card, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.line,
    padding: 16, marginBottom: 16,
  },
  driverAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.greenLight, borderWidth: 2, borderColor: COLORS.green,
    alignItems: 'center', justifyContent: 'center',
  },
  driverInit: { fontSize: 18, fontWeight: '800', color: COLORS.green },
  driverName: { fontSize: 15, fontWeight: '700', color: COLORS.white },
  driverMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  driverRating: { fontSize: 12, fontWeight: '600', color: '#FFB800' },
  driverDot: { fontSize: 10, color: COLORS.dim },
  driverCar: { fontSize: 12, color: COLORS.dim },
  plateWrap: {
    alignSelf: 'flex-start', marginTop: 4,
    backgroundColor: COLORS.surface, borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: COLORS.line,
  },
  plateTxt: { fontSize: 11, fontWeight: '700', color: COLORS.white, letterSpacing: 1 },

  // Rating
  ratingCard: {
    backgroundColor: COLORS.card, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.line,
    padding: 16, marginBottom: 16, alignItems: 'center',
  },
  ratingTitle: { fontSize: 13, fontWeight: '600', color: COLORS.dim, marginBottom: 8 },
  ratingStars: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  ratingComment: { fontSize: 13, color: COLORS.dim, fontStyle: 'italic', textAlign: 'center' },

  // Reorder
  reorderBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.green, borderRadius: 14,
    paddingVertical: 17,
  },
  reorderTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
