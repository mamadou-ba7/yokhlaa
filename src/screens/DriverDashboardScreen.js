import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Platform, RefreshControl, Animated, Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import AnimatedScreen, { AnimatedListItem } from '../components/AnimatedScreen';
import SkeletonLoader from '../components/SkeletonLoader';
import { selectionChanged, tapLight } from '../lib/haptics';

const { width } = Dimensions.get('window');
const BAR_MAX_HEIGHT = 100;

const PERIODS = [
  { id: 'today', label: "Aujourd'hui" },
  { id: 'week', label: 'Semaine' },
  { id: 'month', label: 'Mois' },
  { id: 'all', label: 'Total' },
];

export default function DriverDashboardScreen({ navigation }) {
  const { user, profile } = useAuth();
  const [period, setPeriod] = useState('week');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalRides: 0,
    avgRating: 0,
    ratingCount: 0,
    avgEarningsPerRide: 0,
    totalKm: 0,
    completionRate: 0,
    peakHour: null,
    dailyData: [],
    recentRides: [],
  });

  useEffect(() => { loadStats(); }, [period, user?.id]);

  const loadStats = async () => {
    if (!user?.id) return;
    try {
      // Build date filter
      const now = new Date();
      let dateFilter = null;
      if (period === 'today') {
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        dateFilter = today.toISOString();
      } else if (period === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateFilter = weekAgo.toISOString();
      } else if (period === 'month') {
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        dateFilter = monthAgo.toISOString();
      }

      // Fetch completed rides
      let q = supabase.from('rides')
        .select('price, distance_km, duration_min, created_at, completed_at, status, pickup_address, dropoff_address, rating_driver')
        .eq('driver_id', user.id);

      if (dateFilter) {
        q = q.gte('created_at', dateFilter);
      }

      const { data: rides } = await q.order('created_at', { ascending: false });

      if (!rides) { setLoading(false); return; }

      const completed = rides.filter(r => r.status === 'completed');
      const cancelled = rides.filter(r => r.status === 'cancelled');
      const totalEarnings = completed.reduce((s, r) => s + (r.price || 0), 0);
      const totalKm = completed.reduce((s, r) => s + (r.distance_km || 0), 0);
      const rated = completed.filter(r => r.rating_driver);
      const avgRating = rated.length > 0
        ? rated.reduce((s, r) => s + r.rating_driver, 0) / rated.length
        : profile?.rating || 5;

      // Peak hour calculation
      const hourCounts = {};
      completed.forEach(r => {
        const h = new Date(r.created_at).getHours();
        hourCounts[h] = (hourCounts[h] || 0) + 1;
      });
      const peakHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];

      // Daily earnings for chart (last 7 days)
      const dailyData = [];
      const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const nextD = new Date(d);
        nextD.setDate(nextD.getDate() + 1);

        const dayRides = completed.filter(r => {
          const rd = new Date(r.completed_at || r.created_at);
          return rd >= d && rd < nextD;
        });

        dailyData.push({
          label: days[d.getDay()],
          date: `${d.getDate()}/${d.getMonth() + 1}`,
          earnings: dayRides.reduce((s, r) => s + (r.price || 0), 0),
          rides: dayRides.length,
          isToday: i === 0,
        });
      }

      setStats({
        totalEarnings,
        totalRides: completed.length,
        avgRating: Math.round(avgRating * 10) / 10,
        ratingCount: rated.length,
        avgEarningsPerRide: completed.length > 0 ? Math.round(totalEarnings / completed.length) : 0,
        totalKm: Math.round(totalKm),
        completionRate: rides.length > 0 ? Math.round((completed.length / rides.length) * 100) : 100,
        peakHour: peakHour ? `${peakHour[0]}h` : null,
        dailyData,
        recentRides: completed.slice(0, 5),
      });
    } catch (e) {
      console.warn('Dashboard load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }, [period, user?.id]);

  const maxDailyEarnings = Math.max(...stats.dailyData.map(d => d.earnings), 1);

  const formatTime = (d) => {
    const date = new Date(d);
    return `${date.getHours()}h${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => { tapLight(); navigation.goBack(); }}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tableau de bord</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Period selector */}
      <View style={styles.periods}>
        {PERIODS.map(p => (
          <TouchableOpacity
            key={p.id}
            style={[styles.periodBtn, period === p.id && styles.periodActive]}
            onPress={() => { selectionChanged(); setPeriod(p.id); setLoading(true); }}
          >
            <Text style={[styles.periodTxt, period === p.id && styles.periodTxtActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.green} />}
        contentContainerStyle={styles.scroll}
      >
        {loading ? (
          <View style={{ gap: 16 }}>
            <SkeletonLoader width="100%" height={120} borderRadius={16} />
            <SkeletonLoader width="100%" height={200} borderRadius={16} />
            <SkeletonLoader width="100%" height={100} borderRadius={16} />
          </View>
        ) : (
          <AnimatedScreen>
            {/* Big earnings card */}
            <View style={styles.earningsCard}>
              <Text style={styles.earningsLabel}>Revenus</Text>
              <Text style={styles.earningsValue}>{stats.totalEarnings.toLocaleString()}</Text>
              <Text style={styles.earningsCurrency}>FCFA</Text>
              <View style={styles.earningsMeta}>
                <View style={styles.earningsMetaItem}>
                  <Ionicons name="car" size={14} color={COLORS.green} />
                  <Text style={styles.earningsMetaTxt}>{stats.totalRides} courses</Text>
                </View>
                <View style={styles.earningsMetaDot} />
                <View style={styles.earningsMetaItem}>
                  <Ionicons name="trending-up" size={14} color={COLORS.green} />
                  <Text style={styles.earningsMetaTxt}>{stats.avgEarningsPerRide.toLocaleString()} F/course</Text>
                </View>
              </View>
              <View style={styles.zeroBadge}>
                <Text style={styles.zeroBadgeTxt}>0% commission</Text>
              </View>
            </View>

            {/* Bar chart - 7 jours */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>7 derniers jours</Text>
              <View style={styles.chartBars}>
                {stats.dailyData.map((d, i) => {
                  const barH = maxDailyEarnings > 0
                    ? Math.max(4, (d.earnings / maxDailyEarnings) * BAR_MAX_HEIGHT)
                    : 4;
                  return (
                    <AnimatedListItem key={i} index={i}>
                      <View style={styles.chartBarCol}>
                        <Text style={styles.chartBarValue}>
                          {d.earnings > 0 ? `${Math.round(d.earnings / 1000)}k` : ''}
                        </Text>
                        <View
                          style={[
                            styles.chartBar,
                            { height: barH },
                            d.isToday && styles.chartBarToday,
                            d.earnings === 0 && styles.chartBarEmpty,
                          ]}
                        />
                        <Text style={[styles.chartBarLabel, d.isToday && styles.chartBarLabelToday]}>
                          {d.label}
                        </Text>
                        <Text style={styles.chartBarDate}>{d.date}</Text>
                      </View>
                    </AnimatedListItem>
                  );
                })}
              </View>
            </View>

            {/* Stats grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: 'rgba(34,197,94,0.1)' }]}>
                  <Ionicons name="star" size={18} color="#FFB800" />
                </View>
                <Text style={styles.statCardValue}>{stats.avgRating}</Text>
                <Text style={styles.statCardLabel}>Note moyenne</Text>
                <Text style={styles.statCardSub}>{stats.ratingCount} avis</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: 'rgba(74,144,255,0.1)' }]}>
                  <Ionicons name="navigate" size={18} color="#4A90FF" />
                </View>
                <Text style={styles.statCardValue}>{stats.totalKm}</Text>
                <Text style={styles.statCardLabel}>Kilometres</Text>
                <Text style={styles.statCardSub}>parcourus</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: 'rgba(34,197,94,0.1)' }]}>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.green} />
                </View>
                <Text style={styles.statCardValue}>{stats.completionRate}%</Text>
                <Text style={styles.statCardLabel}>Completion</Text>
                <Text style={styles.statCardSub}>des courses</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: 'rgba(255,184,0,0.1)' }]}>
                  <Ionicons name="time" size={18} color="#FFB800" />
                </View>
                <Text style={styles.statCardValue}>{stats.peakHour || '—'}</Text>
                <Text style={styles.statCardLabel}>Heure de pointe</Text>
                <Text style={styles.statCardSub}>la plus active</Text>
              </View>
            </View>

            {/* Subscription status */}
            <SubscriptionCard userId={user?.id} />

            {/* Recent rides */}
            {stats.recentRides.length > 0 && (
              <View style={styles.recentCard}>
                <Text style={styles.recentTitle}>Dernieres courses</Text>
                {stats.recentRides.map((r, i) => (
                  <AnimatedListItem key={r.id || i} index={i}>
                    <TouchableOpacity
                      style={styles.recentItem}
                      activeOpacity={0.7}
                      onPress={() => { tapLight(); navigation.navigate('RideDetail', { rideId: r.id }); }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.recentDest} numberOfLines={1}>
                          {r.dropoff_address || 'Destination'}
                        </Text>
                        <Text style={styles.recentMeta}>
                          {r.distance_km} km · {formatTime(r.created_at)}
                        </Text>
                      </View>
                      <Text style={styles.recentPrice}>{r.price?.toLocaleString()} F</Text>
                      {r.rating_driver && (
                        <View style={styles.recentRating}>
                          <Ionicons name="star" size={10} color="#FFB800" />
                          <Text style={styles.recentRatingTxt}>{r.rating_driver}</Text>
                        </View>
                      )}
                      <Ionicons name="chevron-forward" size={16} color={COLORS.dim2} />
                    </TouchableOpacity>
                  </AnimatedListItem>
                ))}
              </View>
            )}

            <View style={{ height: 30 }} />
          </AnimatedScreen>
        )}
      </ScrollView>
    </View>
  );
}

/**
 * Subscription status sub-component
 */
function SubscriptionCard({ userId }) {
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    (async () => {
      try {
        const { data } = await supabase.from('subscriptions')
          .select('*')
          .eq('driver_id', userId)
          .eq('status', 'active')
          .order('ends_at', { ascending: false })
          .limit(1)
          .single();
        if (data) setSub(data);
      } catch (e) {
        // No active sub
      }
      setLoading(false);
    })();
  }, [userId]);

  if (loading) return <SkeletonLoader width="100%" height={80} borderRadius={16} style={{ marginBottom: 16 }} />;

  const daysLeft = sub ? Math.max(0, Math.ceil((new Date(sub.ends_at) - new Date()) / 86400000)) : 0;
  const isExpiringSoon = daysLeft > 0 && daysLeft <= 5;

  return (
    <View style={[subStyles.card, !sub && subStyles.cardInactive, isExpiringSoon && subStyles.cardWarning]}>
      <View style={subStyles.iconWrap}>
        <Ionicons
          name={sub ? 'shield-checkmark' : 'shield-outline'}
          size={22}
          color={sub ? (isExpiringSoon ? '#FFB800' : COLORS.green) : COLORS.dim}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={subStyles.title}>
          {sub ? 'Abonnement actif' : 'Pas d\'abonnement'}
        </Text>
        <Text style={subStyles.sub}>
          {sub
            ? isExpiringSoon
              ? `Expire dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''} !`
              : `${daysLeft} jours restants`
            : '18 500 FCFA/mois · 0% commission'
          }
        </Text>
      </View>
      {sub && (
        <View style={[subStyles.badge, isExpiringSoon && subStyles.badgeWarning]}>
          <Text style={[subStyles.badgeTxt, isExpiringSoon && { color: '#FFB800' }]}>{daysLeft}j</Text>
        </View>
      )}
    </View>
  );
}

const subStyles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.card, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.greenBorder,
    padding: 16, marginBottom: 16,
  },
  cardInactive: { borderColor: COLORS.line },
  cardWarning: { borderColor: 'rgba(255,184,0,0.3)', backgroundColor: 'rgba(255,184,0,0.05)' },
  iconWrap: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: COLORS.greenLight,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  sub: { fontSize: 12, color: COLORS.dim, marginTop: 2 },
  badge: {
    backgroundColor: COLORS.greenLight, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  badgeWarning: { backgroundColor: 'rgba(255,184,0,0.12)' },
  badgeTxt: { fontSize: 13, fontWeight: '800', color: COLORS.green },
});

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
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.white },
  periods: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 20, paddingVertical: 12,
  },
  periodBtn: {
    flex: 1, paddingVertical: 8,
    borderRadius: 10, backgroundColor: COLORS.card,
    borderWidth: 1, borderColor: COLORS.line,
    alignItems: 'center',
  },
  periodActive: { backgroundColor: COLORS.greenLight, borderColor: COLORS.green },
  periodTxt: { fontSize: 12, fontWeight: '600', color: COLORS.dim },
  periodTxtActive: { color: COLORS.green },
  scroll: { padding: 20 },

  // Earnings
  earningsCard: {
    backgroundColor: COLORS.card, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.line,
    padding: 24, alignItems: 'center', marginBottom: 16,
  },
  earningsLabel: { fontSize: 13, fontWeight: '600', color: COLORS.dim, marginBottom: 8 },
  earningsValue: { fontSize: 42, fontWeight: '800', color: COLORS.white },
  earningsCurrency: { fontSize: 16, fontWeight: '700', color: COLORS.green, marginTop: -2, marginBottom: 14 },
  earningsMeta: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  earningsMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  earningsMetaTxt: { fontSize: 13, color: COLORS.dim },
  earningsMetaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: COLORS.dim2 },
  zeroBadge: {
    marginTop: 14, backgroundColor: COLORS.greenLight,
    borderWidth: 1, borderColor: COLORS.greenBorder,
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 5,
  },
  zeroBadgeTxt: { fontSize: 12, fontWeight: '700', color: COLORS.green },

  // Chart
  chartCard: {
    backgroundColor: COLORS.card, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.line,
    padding: 16, marginBottom: 16,
  },
  chartTitle: { fontSize: 14, fontWeight: '700', color: COLORS.white, marginBottom: 16 },
  chartBars: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', height: BAR_MAX_HEIGHT + 50,
  },
  chartBarCol: { alignItems: 'center', flex: 1 },
  chartBarValue: { fontSize: 9, color: COLORS.dim, marginBottom: 4, fontWeight: '600' },
  chartBar: {
    width: 22, borderRadius: 6,
    backgroundColor: 'rgba(34,197,94,0.3)',
  },
  chartBarToday: { backgroundColor: COLORS.green },
  chartBarEmpty: { backgroundColor: COLORS.surface },
  chartBarLabel: { fontSize: 11, color: COLORS.dim, marginTop: 6, fontWeight: '600' },
  chartBarLabelToday: { color: COLORS.green },
  chartBarDate: { fontSize: 9, color: COLORS.dim2, marginTop: 1 },

  // Stats grid
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    marginBottom: 16,
  },
  statCard: {
    width: (width - 50) / 2, backgroundColor: COLORS.card,
    borderRadius: 16, borderWidth: 1, borderColor: COLORS.line,
    padding: 16,
  },
  statIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  statCardValue: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  statCardLabel: { fontSize: 12, fontWeight: '600', color: COLORS.dim, marginTop: 2 },
  statCardSub: { fontSize: 10, color: COLORS.dim2 },

  // Recent
  recentCard: {
    backgroundColor: COLORS.card, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.line,
    padding: 16,
  },
  recentTitle: { fontSize: 14, fontWeight: '700', color: COLORS.white, marginBottom: 12 },
  recentItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.line,
  },
  recentDest: { fontSize: 14, fontWeight: '600', color: COLORS.white },
  recentMeta: { fontSize: 11, color: COLORS.dim, marginTop: 2 },
  recentPrice: { fontSize: 14, fontWeight: '800', color: COLORS.green },
  recentRating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  recentRatingTxt: { fontSize: 11, fontWeight: '600', color: '#FFB800' },
});
