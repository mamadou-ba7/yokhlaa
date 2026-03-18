import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Platform,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { RideCardSkeleton } from '../components/SkeletonLoader';
import { AnimatedListItem } from '../components/AnimatedScreen';
import { selectionChanged, tapLight } from '../lib/haptics';

export default function ActivityScreen({ navigation }) {
  const { user } = useAuth();
  const [rides, setRides] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, completed, cancelled

  useEffect(() => { loadRides(); }, [user?.id]);

  const loadRides = async () => {
    if (!user?.id) return;
    try {
      let q = supabase.from('rides').select('*').eq('passenger_id', user.id).order('created_at', { ascending: false }).limit(50);
      if (filter === 'completed') q = q.eq('status', 'completed');
      else if (filter === 'cancelled') q = q.eq('status', 'cancelled');
      const { data } = await q;
      if (data) setRides(data);
    } catch (e) {
      console.warn('Load rides error:', e);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => { loadRides(); }, [filter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRides();
    setRefreshing(false);
  }, [user?.id, filter]);

  const formatDate = (d) => {
    if (!d) return '';
    const date = new Date(d);
    const now = new Date();
    const diff = now - date;
    if (diff < 86400000) {
      return `Aujourd'hui ${date.getHours()}h${String(date.getMinutes()).padStart(2, '0')}`;
    }
    if (diff < 172800000) {
      return `Hier ${date.getHours()}h${String(date.getMinutes()).padStart(2, '0')}`;
    }
    const months = ['jan', 'fev', 'mar', 'avr', 'mai', 'jun', 'jul', 'aou', 'sep', 'oct', 'nov', 'dec'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getHours()}h${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const statusLabel = (s) => {
    switch (s) {
      case 'completed': return { text: 'Terminee', color: COLORS.green };
      case 'cancelled': return { text: 'Annulee', color: COLORS.red };
      case 'pending': return { text: 'En attente', color: '#FFB800' };
      case 'accepted': return { text: 'Acceptee', color: '#4A90FF' };
      case 'in_progress': return { text: 'En cours', color: '#4A90FF' };
      default: return { text: s, color: COLORS.dim };
    }
  };

  const filters = [
    { id: 'all', label: 'Toutes' },
    { id: 'completed', label: 'Terminees' },
    { id: 'cancelled', label: 'Annulees' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Activite</Text>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {filters.map(f => (
          <TouchableOpacity
            key={f.id}
            style={[styles.filterBtn, filter === f.id && styles.filterActive]}
            onPress={() => { selectionChanged(); setFilter(f.id); }}
          >
            <Text style={[styles.filterTxt, filter === f.id && styles.filterTxtActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={rides.length === 0 && !initialLoading ? styles.scrollEmpty : styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.green} />}
      >
        {initialLoading ? (
          <View style={{ gap: 12 }}>
            {[0, 1, 2, 3].map(i => <RideCardSkeleton key={i} />)}
          </View>
        ) : rides.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="time-outline" size={48} color={COLORS.dim} />
            </View>
            <Text style={styles.emptyTitle}>Aucune course</Text>
            <Text style={styles.emptyDesc}>
              Vos courses apparaitront ici apres votre premier trajet.
            </Text>
          </View>
        ) : (
          rides.map((r, i) => {
            const st = statusLabel(r.status);
            return (
              <AnimatedListItem key={r.id || i} index={i}>
              <TouchableOpacity
                style={styles.rideCard}
                activeOpacity={0.7}
                onPress={() => {
                  tapLight();
                  navigation.getParent()?.navigate('RideDetail', { rideId: r.id });
                }}
              >
                <View style={styles.rideHeader}>
                  <Text style={styles.rideDate}>{formatDate(r.created_at)}</Text>
                  <View style={[styles.rideBadge, { backgroundColor: st.color + '18' }]}>
                    <View style={[styles.rideDot, { backgroundColor: st.color }]} />
                    <Text style={[styles.rideBadgeTxt, { color: st.color }]}>{st.text}</Text>
                  </View>
                </View>
                <View style={styles.rideRoute}>
                  <View style={styles.routeDots}>
                    <View style={styles.dotBlue} />
                    <View style={styles.routeLine} />
                    <Ionicons name="location" size={10} color={COLORS.green} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rideFrom} numberOfLines={1}>{r.pickup_address || 'Point de depart'}</Text>
                    <Text style={styles.rideTo} numberOfLines={1}>{r.dropoff_address || 'Destination'}</Text>
                  </View>
                  {r.price > 0 && (
                    <Text style={styles.ridePrice}>{r.price?.toLocaleString()} F</Text>
                  )}
                </View>
                {r.distance_km > 0 && (
                  <View style={styles.rideMeta}>
                    <Ionicons name="navigate-outline" size={11} color={COLORS.dim} />
                    <Text style={styles.rideMetaTxt}>{r.distance_km} km</Text>
                    {r.duration_min > 0 && (
                      <>
                        <Text style={styles.rideMetaDot}>·</Text>
                        <Ionicons name="time-outline" size={11} color={COLORS.dim} />
                        <Text style={styles.rideMetaTxt}>{r.duration_min} min</Text>
                      </>
                    )}
                  </View>
                )}
              </TouchableOpacity>
              </AnimatedListItem>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  headerTitle: {
    fontSize: 24, fontWeight: '800', color: COLORS.white,
  },
  filters: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 20, paddingVertical: 12,
  },
  filterBtn: {
    paddingVertical: 7, paddingHorizontal: 16,
    borderRadius: 20, backgroundColor: COLORS.card,
    borderWidth: 1, borderColor: COLORS.line,
  },
  filterActive: {
    backgroundColor: COLORS.greenLight, borderColor: COLORS.green,
  },
  filterTxt: { fontSize: 13, fontWeight: '600', color: COLORS.dim },
  filterTxtActive: { color: COLORS.green },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 12 },
  scrollEmpty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyState: { alignItems: 'center' },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.surface,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18, fontWeight: '700', color: COLORS.white, marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14, color: COLORS.dim, textAlign: 'center', lineHeight: 22,
  },
  rideCard: {
    backgroundColor: COLORS.card, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.line,
    padding: 16,
  },
  rideHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12,
  },
  rideDate: { fontSize: 12, color: COLORS.dim },
  rideBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6,
  },
  rideDot: { width: 5, height: 5, borderRadius: 3 },
  rideBadgeTxt: { fontSize: 11, fontWeight: '600' },
  rideRoute: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  routeDots: { alignItems: 'center', gap: 2 },
  dotBlue: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4A90FF' },
  routeLine: { width: 1, height: 12, backgroundColor: COLORS.line },
  rideFrom: { fontSize: 12, color: COLORS.dim, marginBottom: 4 },
  rideTo: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  ridePrice: { fontSize: 16, fontWeight: '800', color: COLORS.green },
  rideMeta: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 10, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: COLORS.line,
  },
  rideMetaTxt: { fontSize: 11, color: COLORS.dim },
  rideMetaDot: { fontSize: 8, color: COLORS.dim2 },
});
