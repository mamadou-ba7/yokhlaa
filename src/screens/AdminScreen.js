import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Alert, RefreshControl, Platform, Image, TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { tapLight } from '../lib/haptics';
import { getDocLabel } from '../lib/documentUpload';

const TABS = ['Dashboard', 'Chauffeurs', 'Signalements'];

export default function AdminScreen({ navigation }) {
  const { signOut } = useAuth();
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Dashboard stats
  const [stats, setStats] = useState({
    totalUsers: 0, totalDrivers: 0, totalPassengers: 0,
    pendingDrivers: 0, onlineDrivers: 0,
    totalRides: 0, todayRides: 0, activeRides: 0,
    todayRevenue: 0, totalRevenue: 0,
    openReports: 0,
  });

  // Drivers list
  const [drivers, setDrivers] = useState([]);
  const [driverFilter, setDriverFilter] = useState('pending'); // pending, approved, all
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [driverDocs, setDriverDocs] = useState([]);

  // Reports
  const [reports, setReports] = useState([]);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadStats(), loadDrivers(), loadReports()]);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadStats(), loadDrivers(), loadReports()]);
    setRefreshing(false);
  };

  // ── STATS ──────────────────────────────────────
  const loadStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [users, rides, online, pending, openRep] = await Promise.all([
        supabase.from('profiles').select('role', { count: 'exact', head: false }),
        supabase.from('rides').select('status, price, created_at'),
        supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'chauffeur').eq('is_online', true),
        supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'chauffeur').eq('driver_status', 'pending'),
        supabase.from('driver_reports').select('id', { count: 'exact' }).eq('status', 'open'),
      ]);

      const profiles = users.data || [];
      const allRides = rides.data || [];
      const todayR = allRides.filter(r => new Date(r.created_at) >= today);
      const completed = allRides.filter(r => r.status === 'completed');
      const todayCompleted = todayR.filter(r => r.status === 'completed');

      setStats({
        totalUsers: profiles.length,
        totalDrivers: profiles.filter(p => p.role === 'chauffeur').length,
        totalPassengers: profiles.filter(p => p.role === 'passager').length,
        pendingDrivers: pending.count || 0,
        onlineDrivers: online.count || 0,
        totalRides: allRides.length,
        todayRides: todayR.length,
        activeRides: allRides.filter(r => ['pending', 'accepted', 'arriving', 'in_progress'].includes(r.status)).length,
        todayRevenue: todayCompleted.reduce((s, r) => s + (r.price || 0), 0),
        totalRevenue: completed.reduce((s, r) => s + (r.price || 0), 0),
        openReports: openRep.count || 0,
      });
    } catch (e) {
      console.warn('Stats error:', e);
    }
  };

  // ── DRIVERS ────────────────────────────────────
  const loadDrivers = async () => {
    try {
      let query = supabase.from('profiles')
        .select('*')
        .eq('role', 'chauffeur')
        .order('created_at', { ascending: false });

      if (driverFilter === 'pending') query = query.eq('driver_status', 'pending');
      else if (driverFilter === 'approved') query = query.eq('driver_status', 'approved');

      const { data } = await query.limit(50);
      setDrivers(data || []);
    } catch (e) {
      console.warn('Drivers error:', e);
    }
  };

  useEffect(() => { loadDrivers(); }, [driverFilter]);

  const loadDriverDocs = async (driverId) => {
    try {
      const { data } = await supabase.from('driver_documents')
        .select('*')
        .eq('driver_id', driverId)
        .order('created_at');
      setDriverDocs(data || []);
    } catch (e) {
      setDriverDocs([]);
    }
  };

  const selectDriver = (d) => {
    tapLight();
    setSelectedDriver(d);
    loadDriverDocs(d.id);
  };

  const approveDriver = async (driverId) => {
    Alert.alert('Approuver', 'Confirmer l\'approbation de ce chauffeur ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Approuver', onPress: async () => {
          await supabase.from('profiles')
            .update({ driver_status: 'approved', is_verified: true, updated_at: new Date().toISOString() })
            .eq('id', driverId);
          setSelectedDriver(null);
          loadDrivers();
          loadStats();
        }
      },
    ]);
  };

  const rejectDriver = async (driverId) => {
    Alert.alert('Refuser', 'Confirmer le refus de ce chauffeur ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Refuser', style: 'destructive', onPress: async () => {
          await supabase.from('profiles')
            .update({ driver_status: 'rejected', updated_at: new Date().toISOString() })
            .eq('id', driverId);
          setSelectedDriver(null);
          loadDrivers();
          loadStats();
        }
      },
    ]);
  };

  const suspendDriver = async (driverId) => {
    Alert.alert('Suspendre', 'Suspendre ce chauffeur ? Il ne pourra plus se mettre en ligne.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Suspendre', style: 'destructive', onPress: async () => {
          await supabase.from('profiles')
            .update({ driver_status: 'suspended', is_online: false, updated_at: new Date().toISOString() })
            .eq('id', driverId);
          setSelectedDriver(null);
          loadDrivers();
          loadStats();
        }
      },
    ]);
  };

  const approveDoc = async (docId) => {
    await supabase.from('driver_documents')
      .update({ status: 'approved', verified_at: new Date().toISOString() })
      .eq('id', docId);
    if (selectedDriver) loadDriverDocs(selectedDriver.id);
  };

  const rejectDoc = async (docId, reason) => {
    await supabase.from('driver_documents')
      .update({ status: 'rejected', reject_reason: reason || 'Document non conforme' })
      .eq('id', docId);
    if (selectedDriver) loadDriverDocs(selectedDriver.id);
  };

  const handleRejectDoc = (docId) => {
    Alert.alert('Refuser le document', 'Raison du refus :', [
      { text: 'Photo floue', onPress: () => rejectDoc(docId, 'Photo floue ou illisible. Renvoyez une photo plus nette.') },
      { text: 'Document invalide', onPress: () => rejectDoc(docId, 'Document invalide ou expire. Envoyez un document en cours de validite.') },
      { text: 'Mauvais document', onPress: () => rejectDoc(docId, 'Ce n\'est pas le bon type de document.') },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  // ── REPORTS ────────────────────────────────────
  const loadReports = async () => {
    try {
      const { data } = await supabase.from('driver_reports')
        .select('*, rides(pickup_address, dropoff_address, driver_id)')
        .order('created_at', { ascending: false })
        .limit(50);
      setReports(data || []);
    } catch (e) {
      setReports([]);
    }
  };

  const resolveReport = async (reportId) => {
    await supabase.from('driver_reports')
      .update({ status: 'resolved' })
      .eq('id', reportId);
    loadReports();
    loadStats();
  };

  const handleSignOut = async () => {
    await signOut();
  };

  // ── LOADING ────────────────────────────────────
  if (loading) {
    return (
      <View style={s.container}>
        <StatusBar style="light" />
        <View style={s.center}>
          <ActivityIndicator size="large" color={COLORS.green} />
          <Text style={s.loadTxt}>Chargement admin...</Text>
        </View>
      </View>
    );
  }

  // ── DRIVER DETAIL VIEW ─────────────────────────
  if (selectedDriver) {
    const d = selectedDriver;
    const statusColor = {
      pending: '#FFB800', approved: COLORS.green, rejected: '#EF4444', suspended: '#EF4444',
    }[d.driver_status] || COLORS.dim;

    return (
      <View style={s.container}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={s.scroll}>
          <View style={s.header}>
            <TouchableOpacity style={s.backBtn} onPress={() => setSelectedDriver(null)}>
              <Ionicons name="arrow-back" size={20} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={s.headerTitle}>Dossier chauffeur</Text>
            <View style={{ width: 38 }} />
          </View>

          {/* Driver info card */}
          <View style={s.driverCard}>
            <View style={s.driverAvatar}>
              <Text style={s.driverInit}>{(d.prenom || d.nom || 'C')[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.driverName}>{d.prenom} {d.nom}</Text>
              <Text style={s.driverPhone}>{d.phone}</Text>
              <View style={[s.statusBadge, { borderColor: statusColor }]}>
                <View style={[s.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[s.statusLabel, { color: statusColor }]}>{d.driver_status}</Text>
              </View>
            </View>
          </View>

          {/* Info details */}
          <View style={s.infoSection}>
            <Text style={s.sectionTitle}>Informations</Text>
            <InfoRow label="CNI" value={d.cni} />
            <InfoRow label="Permis" value={d.permis_numero} />
            <InfoRow label="Zone" value={d.zone} />
            <InfoRow label="Inscription" value={d.created_at ? new Date(d.created_at).toLocaleDateString('fr-FR') : '-'} />
          </View>

          <View style={s.infoSection}>
            <Text style={s.sectionTitle}>Vehicule</Text>
            <InfoRow label="Vehicule" value={d.vehicule} />
            <InfoRow label="Plaque" value={d.plaque} />
            <InfoRow label="Couleur" value={d.vehicule_couleur} />
            <InfoRow label="Annee" value={d.vehicule_annee} />
            <InfoRow label="Places" value={d.vehicule_places} />
            <InfoRow label="Carte grise" value={d.carte_grise} />
            <InfoRow label="Assurance" value={d.assurance_numero} />
          </View>

          {/* Documents */}
          <View style={s.infoSection}>
            <Text style={s.sectionTitle}>Documents ({driverDocs.length})</Text>
            {driverDocs.length === 0 && (
              <Text style={s.emptyTxt}>Aucun document envoye</Text>
            )}
            {driverDocs.map(doc => (
              <View key={doc.id} style={s.docRow}>
                <View style={s.docThumb}>
                  {doc.file_url ? (
                    <Image source={{ uri: doc.file_url }} style={s.docThumbImg} />
                  ) : (
                    <Ionicons name="document" size={18} color={COLORS.dim} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.docType}>{getDocLabel(doc.doc_type)}</Text>
                  <Text style={[s.docStatus, {
                    color: doc.status === 'approved' ? COLORS.green : doc.status === 'rejected' ? '#EF4444' : '#FFB800'
                  }]}>
                    {doc.status === 'approved' ? 'Valide' : doc.status === 'rejected' ? 'Refuse' : 'En attente'}
                  </Text>
                  {doc.reject_reason && <Text style={s.docReason}>{doc.reject_reason}</Text>}
                </View>
                {doc.status === 'pending' && (
                  <View style={s.docActions}>
                    <TouchableOpacity style={s.docApprove} onPress={() => approveDoc(doc.id)}>
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={s.docReject} onPress={() => handleRejectDoc(doc.id)}>
                      <Ionicons name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Actions */}
          <View style={s.actionSection}>
            {d.driver_status === 'pending' && (
              <>
                <TouchableOpacity style={s.approveBtn} onPress={() => approveDriver(d.id)}>
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={s.approveTxt}>Approuver le chauffeur</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.rejectBtn} onPress={() => rejectDriver(d.id)}>
                  <Ionicons name="close-circle" size={18} color="#EF4444" />
                  <Text style={s.rejectTxt}>Refuser</Text>
                </TouchableOpacity>
              </>
            )}
            {d.driver_status === 'approved' && (
              <TouchableOpacity style={s.rejectBtn} onPress={() => suspendDriver(d.id)}>
                <Ionicons name="ban" size={18} color="#EF4444" />
                <Text style={s.rejectTxt}>Suspendre le compte</Text>
              </TouchableOpacity>
            )}
            {d.driver_status === 'suspended' && (
              <TouchableOpacity style={s.approveBtn} onPress={() => approveDriver(d.id)}>
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={s.approveTxt}>Reactiver le compte</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  // ── MAIN ADMIN VIEW ────────────────────────────
  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.green} />}
      >
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.headerTitle}>Admin Yokh<Text style={{ color: COLORS.green }}>Laa</Text></Text>
            <Text style={s.headerSub}>Gestion de la plateforme</Text>
          </View>
          <TouchableOpacity style={s.backBtn} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={18} color={COLORS.red} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={s.tabs}>
          {TABS.map((t, i) => (
            <TouchableOpacity
              key={t}
              style={[s.tab, tab === i && s.tabActive]}
              onPress={() => { tapLight(); setTab(i); }}
            >
              <Text style={[s.tabTxt, tab === i && s.tabTxtActive]}>{t}</Text>
              {i === 1 && stats.pendingDrivers > 0 && (
                <View style={s.tabBadge}><Text style={s.tabBadgeTxt}>{stats.pendingDrivers}</Text></View>
              )}
              {i === 2 && stats.openReports > 0 && (
                <View style={[s.tabBadge, { backgroundColor: '#EF4444' }]}><Text style={s.tabBadgeTxt}>{stats.openReports}</Text></View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── TAB 0: DASHBOARD ── */}
        {tab === 0 && (
          <View style={s.section}>
            {/* Key stats */}
            <View style={s.statsGrid}>
              <StatCard icon="people" label="Utilisateurs" value={stats.totalUsers} color="#4A90FF" />
              <StatCard icon="car" label="Chauffeurs" value={stats.totalDrivers} color={COLORS.green} />
              <StatCard icon="radio-button-on" label="En ligne" value={stats.onlineDrivers} color={COLORS.green} />
              <StatCard icon="time" label="En attente" value={stats.pendingDrivers} color="#FFB800" />
            </View>

            <View style={s.statsGrid}>
              <StatCard icon="swap-horizontal" label="Courses total" value={stats.totalRides} color="#4A90FF" />
              <StatCard icon="today" label="Courses aujourd'hui" value={stats.todayRides} color={COLORS.green} />
              <StatCard icon="navigate" label="En cours" value={stats.activeRides} color="#FFB800" />
              <StatCard icon="flag" label="Signalements" value={stats.openReports} color="#EF4444" />
            </View>

            {/* Revenue */}
            <View style={s.revenueCard}>
              <View style={s.revenueRow}>
                <View>
                  <Text style={s.revenueLabel}>Revenus aujourd'hui</Text>
                  <Text style={s.revenueValue}>{stats.todayRevenue.toLocaleString()} FCFA</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.revenueLabel}>Revenus total</Text>
                  <Text style={[s.revenueValue, { color: COLORS.dim }]}>{stats.totalRevenue.toLocaleString()} FCFA</Text>
                </View>
              </View>
              <View style={s.revenueSub}>
                <Ionicons name="information-circle" size={14} color={COLORS.dim} />
                <Text style={s.revenueSubTxt}>Volume total des courses (paye aux chauffeurs)</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── TAB 1: CHAUFFEURS ── */}
        {tab === 1 && (
          <View style={s.section}>
            {/* Filter */}
            <View style={s.filterRow}>
              {[
                { key: 'pending', label: 'En attente', count: stats.pendingDrivers },
                { key: 'approved', label: 'Approuves' },
                { key: 'all', label: 'Tous' },
              ].map(f => (
                <TouchableOpacity
                  key={f.key}
                  style={[s.filterChip, driverFilter === f.key && s.filterChipActive]}
                  onPress={() => { tapLight(); setDriverFilter(f.key); }}
                >
                  <Text style={[s.filterTxt, driverFilter === f.key && s.filterTxtActive]}>
                    {f.label}{f.count ? ` (${f.count})` : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Driver list */}
            {drivers.length === 0 && (
              <View style={s.emptyWrap}>
                <Ionicons name="car-outline" size={40} color={COLORS.dim2} />
                <Text style={s.emptyTxt}>Aucun chauffeur</Text>
              </View>
            )}
            {drivers.map(d => {
              const sc = {
                pending: '#FFB800', approved: COLORS.green, rejected: '#EF4444', suspended: '#EF4444',
              }[d.driver_status] || COLORS.dim;
              return (
                <TouchableOpacity key={d.id} style={s.driverRow} onPress={() => selectDriver(d)} activeOpacity={0.7}>
                  <View style={s.driverAvatar}>
                    <Text style={s.driverInit}>{(d.prenom || d.nom || 'C')[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.driverName}>{d.prenom || ''} {d.nom || 'Sans nom'}</Text>
                    <Text style={s.driverPhone}>{d.phone} · {d.vehicule || '-'}</Text>
                    <Text style={s.driverPlaque}>{d.plaque || '-'} · {d.zone || '-'}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <View style={[s.statusBadge, { borderColor: sc }]}>
                      <View style={[s.statusDot, { backgroundColor: sc }]} />
                      <Text style={[s.statusLabel, { color: sc }]}>{d.driver_status || 'pending'}</Text>
                    </View>
                    {d.is_online && <Text style={s.onlineTxt}>En ligne</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── TAB 2: SIGNALEMENTS ── */}
        {tab === 2 && (
          <View style={s.section}>
            {reports.length === 0 && (
              <View style={s.emptyWrap}>
                <Ionicons name="shield-checkmark" size={40} color={COLORS.green} />
                <Text style={s.emptyTxt}>Aucun signalement</Text>
              </View>
            )}
            {reports.map(r => {
              const typeLabel = {
                wrong_driver: 'Mauvais chauffeur',
                wrong_vehicle: 'Mauvais vehicule',
                unsafe: 'Insecurite',
                other: 'Autre',
              }[r.report_type] || r.report_type;
              const typeColor = {
                wrong_driver: '#EF4444',
                wrong_vehicle: '#FFB800',
                unsafe: '#EF4444',
                other: COLORS.dim,
              }[r.report_type] || COLORS.dim;

              return (
                <View key={r.id} style={s.reportCard}>
                  <View style={s.reportTop}>
                    <View style={[s.reportTypeBadge, { borderColor: typeColor }]}>
                      <Ionicons name="flag" size={12} color={typeColor} />
                      <Text style={[s.reportTypeLabel, { color: typeColor }]}>{typeLabel}</Text>
                    </View>
                    <View style={[s.reportStatusBadge, {
                      backgroundColor: r.status === 'open' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                    }]}>
                      <Text style={{
                        fontSize: 11, fontWeight: '700',
                        color: r.status === 'open' ? '#EF4444' : COLORS.green,
                      }}>
                        {r.status === 'open' ? 'Ouvert' : r.status === 'reviewed' ? 'Examine' : 'Resolu'}
                      </Text>
                    </View>
                  </View>
                  {r.description && <Text style={s.reportDesc}>{r.description}</Text>}
                  {r.rides && (
                    <Text style={s.reportRoute}>
                      {r.rides.pickup_address} → {r.rides.dropoff_address}
                    </Text>
                  )}
                  <Text style={s.reportDate}>
                    {new Date(r.created_at).toLocaleDateString('fr-FR')} a {new Date(r.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  {r.status === 'open' && (
                    <View style={s.reportActions}>
                      <TouchableOpacity
                        style={s.reportResolve}
                        onPress={() => resolveReport(r.id)}
                      >
                        <Ionicons name="checkmark" size={14} color={COLORS.green} />
                        <Text style={s.reportResolveTxt}>Marquer resolu</Text>
                      </TouchableOpacity>
                      {r.rides?.driver_id && (
                        <TouchableOpacity
                          style={s.reportViewDriver}
                          onPress={async () => {
                            const { data } = await supabase.from('profiles').select('*').eq('id', r.rides.driver_id).single();
                            if (data) selectDriver(data);
                          }}
                        >
                          <Ionicons name="person" size={14} color="#FFB800" />
                          <Text style={s.reportViewTxt}>Voir chauffeur</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ── Helper components ────────────────────────────
function StatCard({ icon, label, value, color }) {
  return (
    <View style={s.statCard}>
      <View style={[s.statIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value || '-'}</Text>
    </View>
  );
}

// ── STYLES ───────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadTxt: { color: COLORS.dim, marginTop: 12, fontSize: 14 },
  scroll: { paddingBottom: 20 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingHorizontal: 20, paddingBottom: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  headerSub: { fontSize: 12, color: COLORS.dim, marginTop: 2 },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.line,
  },

  // Tabs
  tabs: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 16,
    backgroundColor: COLORS.card, borderRadius: 12, padding: 3,
    borderWidth: 1, borderColor: COLORS.line,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 10, borderRadius: 10,
  },
  tabActive: { backgroundColor: COLORS.green },
  tabTxt: { fontSize: 13, fontWeight: '600', color: COLORS.dim },
  tabTxtActive: { color: '#fff' },
  tabBadge: {
    backgroundColor: '#FFB800', borderRadius: 8,
    paddingHorizontal: 5, paddingVertical: 1, minWidth: 18, alignItems: 'center',
  },
  tabBadgeTxt: { fontSize: 10, fontWeight: '800', color: '#fff' },

  section: { paddingHorizontal: 20 },

  // Stats grid
  statsGrid: {
    flexDirection: 'row', gap: 8, marginBottom: 8,
  },
  statCard: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.line, padding: 14, alignItems: 'center',
  },
  statIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: COLORS.white, marginBottom: 2 },
  statLabel: { fontSize: 10, color: COLORS.dim, textAlign: 'center' },

  // Revenue
  revenueCard: {
    backgroundColor: COLORS.card, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.line, padding: 18, marginTop: 8,
  },
  revenueRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  revenueLabel: { fontSize: 12, color: COLORS.dim, marginBottom: 4 },
  revenueValue: { fontSize: 22, fontWeight: '800', color: COLORS.green },
  revenueSub: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  revenueSubTxt: { fontSize: 11, color: COLORS.dim },

  // Filter
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterChip: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.line,
  },
  filterChipActive: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  filterTxt: { fontSize: 13, fontWeight: '600', color: COLORS.dim },
  filterTxtActive: { color: '#fff' },

  // Driver list
  driverRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.card, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.line,
    padding: 14, marginBottom: 8,
  },
  driverAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.green, alignItems: 'center', justifyContent: 'center',
  },
  driverInit: { fontSize: 18, fontWeight: '800', color: '#fff' },
  driverName: { fontSize: 15, fontWeight: '700', color: COLORS.white, marginBottom: 2 },
  driverPhone: { fontSize: 12, color: COLORS.dim },
  driverPlaque: { fontSize: 11, color: COLORS.dim },
  onlineTxt: { fontSize: 10, fontWeight: '700', color: COLORS.green, marginTop: 4 },

  // Status badge
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6,
    borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { fontSize: 11, fontWeight: '700' },

  // Driver detail
  driverCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: 20, marginBottom: 16,
    backgroundColor: COLORS.card, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.line, padding: 18,
  },

  // Info section
  infoSection: {
    marginHorizontal: 20, marginBottom: 16,
    backgroundColor: COLORS.card, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.line, padding: 16,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.white, marginBottom: 12 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.line,
  },
  infoLabel: { fontSize: 13, color: COLORS.dim },
  infoValue: { fontSize: 13, fontWeight: '600', color: COLORS.white, maxWidth: '60%', textAlign: 'right' },

  // Docs in detail
  docRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.line,
  },
  docThumb: {
    width: 44, height: 44, borderRadius: 8,
    backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  docThumbImg: { width: 44, height: 44, borderRadius: 8 },
  docType: { fontSize: 13, fontWeight: '600', color: COLORS.white },
  docStatus: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  docReason: { fontSize: 10, color: '#EF4444', marginTop: 2 },
  docActions: { flexDirection: 'row', gap: 6 },
  docApprove: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: COLORS.green, alignItems: 'center', justifyContent: 'center',
  },
  docReject: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center',
  },

  // Action buttons
  actionSection: { marginHorizontal: 20, gap: 10 },
  approveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.green, borderRadius: 14, paddingVertical: 16,
  },
  approveTxt: { fontSize: 16, fontWeight: '700', color: '#fff' },
  rejectBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, paddingVertical: 16,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.05)',
  },
  rejectTxt: { fontSize: 16, fontWeight: '600', color: '#EF4444' },

  // Reports
  reportCard: {
    backgroundColor: COLORS.card, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.line,
    padding: 16, marginBottom: 10,
  },
  reportTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8,
  },
  reportTypeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1,
  },
  reportTypeLabel: { fontSize: 12, fontWeight: '700' },
  reportStatusBadge: {
    paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6,
  },
  reportDesc: { fontSize: 13, color: COLORS.white, marginBottom: 6, lineHeight: 18 },
  reportRoute: { fontSize: 12, color: COLORS.dim, marginBottom: 4 },
  reportDate: { fontSize: 11, color: COLORS.dim },
  reportActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  reportResolve: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8,
    backgroundColor: 'rgba(34,197,94,0.08)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)',
  },
  reportResolveTxt: { fontSize: 12, fontWeight: '600', color: COLORS.green },
  reportViewDriver: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8,
    backgroundColor: 'rgba(255,184,0,0.08)', borderWidth: 1, borderColor: 'rgba(255,184,0,0.2)',
  },
  reportViewTxt: { fontSize: 12, fontWeight: '600', color: '#FFB800' },

  // Empty
  emptyWrap: { alignItems: 'center', paddingVertical: 40 },
  emptyTxt: { fontSize: 14, color: COLORS.dim, marginTop: 8 },
});
