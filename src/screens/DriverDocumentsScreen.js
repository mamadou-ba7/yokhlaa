import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, Image, Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useAuth } from '../lib/AuthContext';
import { tapLight, tapMedium, notifySuccess, notifyError } from '../lib/haptics';
import {
  pickDocumentImage, uploadDocument, loadDriverDocuments,
  getDocumentProgress, DOC_CATEGORIES, REQUIRED_DOCS,
  getDocLabel, getDocIcon,
} from '../lib/documentUpload';

const STATUS_CONFIG = {
  pending: { color: '#FFB800', icon: 'time', label: 'En verification' },
  approved: { color: COLORS.green, icon: 'checkmark-circle', label: 'Valide' },
  rejected: { color: '#EF4444', icon: 'close-circle', label: 'Refuse' },
};

export default function DriverDocumentsScreen({ navigation }) {
  const { user } = useAuth();
  const [docs, setDocs] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(null); // docType currently uploading

  useEffect(() => {
    if (user?.id) loadDocs();
  }, [user?.id]);

  const loadDocs = async () => {
    setLoading(true);
    const d = await loadDriverDocuments(user.id);
    setDocs(d);
    setLoading(false);
  };

  const progress = getDocumentProgress(docs);

  const handleUpload = useCallback(async (docType) => {
    tapLight();

    // Show source picker
    Alert.alert(
      getDocLabel(docType),
      'Comment souhaitez-vous ajouter ce document ?',
      [
        {
          text: 'Prendre une photo',
          onPress: () => doUpload(docType, true),
        },
        {
          text: 'Choisir dans la galerie',
          onPress: () => doUpload(docType, false),
        },
        { text: 'Annuler', style: 'cancel' },
      ],
    );
  }, [user?.id]);

  const doUpload = async (docType, useCamera) => {
    try {
      const result = await pickDocumentImage(docType, useCamera);

      if (!result) return; // cancelled

      // Auto-rejected by verification
      if (result.rejected) {
        notifyError();
        Alert.alert(
          'Document refuse',
          result.reason,
          [{ text: 'Reessayer', onPress: () => handleUpload(docType) }, { text: 'Annuler' }],
        );
        return;
      }

      // Upload
      setUploading(docType);
      const doc = await uploadDocument(user.id, docType, result);
      notifySuccess();

      setDocs(prev => ({ ...prev, [docType]: doc }));
      setUploading(null);
    } catch (e) {
      setUploading(null);
      notifyError();
      Alert.alert('Erreur', 'Impossible d\'envoyer le document. Verifiez votre connexion.');
    }
  };

  if (loading) {
    return (
      <View style={s.container}>
        <StatusBar style="light" />
        <View style={s.center}>
          <ActivityIndicator size="large" color={COLORS.green} />
          <Text style={s.loadingTxt}>Chargement des documents...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={s.scroll}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Mes documents</Text>
          <View style={{ width: 38 }} />
        </View>

        {/* Progress card */}
        <View style={s.progressCard}>
          <View style={s.progressTop}>
            <View>
              <Text style={s.progressLabel}>Progression</Text>
              <Text style={s.progressCount}>
                {progress.uploaded}/{progress.total} documents
              </Text>
            </View>
            <View style={s.progressCircle}>
              <Text style={s.progressPct}>{Math.round(progress.progress * 100)}%</Text>
            </View>
          </View>
          <View style={s.progressBarBg}>
            <View style={[s.progressBarFill, { width: `${progress.progress * 100}%` }]} />
          </View>
          <View style={s.progressStats}>
            {progress.approved > 0 && (
              <View style={s.progressStat}>
                <View style={[s.statDot, { backgroundColor: COLORS.green }]} />
                <Text style={s.statTxt}>{progress.approved} valide{progress.approved > 1 ? 's' : ''}</Text>
              </View>
            )}
            {progress.pending > 0 && (
              <View style={s.progressStat}>
                <View style={[s.statDot, { backgroundColor: '#FFB800' }]} />
                <Text style={s.statTxt}>{progress.pending} en attente</Text>
              </View>
            )}
            {progress.rejected > 0 && (
              <View style={s.progressStat}>
                <View style={[s.statDot, { backgroundColor: '#EF4444' }]} />
                <Text style={s.statTxt}>{progress.rejected} refuse{progress.rejected > 1 ? 's' : ''}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Info banner */}
        {!progress.complete && (
          <View style={s.infoBanner}>
            <Ionicons name="information-circle" size={18} color={COLORS.green} />
            <Text style={s.infoBannerTxt}>
              Envoyez tous les documents pour activer votre compte chauffeur. Les photos doivent etre nettes et lisibles.
            </Text>
          </View>
        )}

        {progress.allApproved && (
          <View style={[s.infoBanner, { borderColor: 'rgba(34,197,94,0.3)', backgroundColor: 'rgba(34,197,94,0.08)' }]}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.green} />
            <Text style={[s.infoBannerTxt, { color: COLORS.green }]}>
              Tous vos documents sont valides. Votre compte est actif !
            </Text>
          </View>
        )}

        {/* Document categories */}
        {DOC_CATEGORIES.map(cat => (
          <View key={cat.title} style={s.category}>
            <View style={s.catHeader}>
              <Ionicons name={cat.icon} size={16} color={cat.optional ? '#FFB800' : COLORS.green} />
              <Text style={s.catTitle}>{cat.title}</Text>
            </View>
            {cat.optional && (
              <View style={s.optionalBanner}>
                <Ionicons name="star" size={14} color="#FFB800" />
                <Text style={s.optionalTxt}>
                  Fournir ce document vous donne le badge "Verifie+" visible par les passagers. Plus de confiance = plus de courses !
                </Text>
              </View>
            )}

            {cat.docs.map(docType => {
              const doc = docs[docType];
              const isUploading = uploading === docType;
              const statusConf = doc ? STATUS_CONFIG[doc.status] : null;

              return (
                <TouchableOpacity
                  key={docType}
                  style={[
                    s.docItem,
                    doc?.status === 'approved' && s.docItemApproved,
                    doc?.status === 'rejected' && s.docItemRejected,
                  ]}
                  onPress={() => handleUpload(docType)}
                  disabled={isUploading}
                  activeOpacity={0.7}
                >
                  {/* Thumbnail or placeholder */}
                  <View style={s.docThumb}>
                    {doc?.file_url && doc.status !== 'rejected' ? (
                      <Image source={{ uri: doc.file_url }} style={s.docThumbImg} />
                    ) : (
                      <Ionicons
                        name={getDocIcon(docType)}
                        size={20}
                        color={doc?.status === 'rejected' ? '#EF4444' : COLORS.dim}
                      />
                    )}
                  </View>

                  {/* Info */}
                  <View style={s.docInfo}>
                    <Text style={s.docLabel}>{getDocLabel(docType)}</Text>
                    {doc ? (
                      <View style={s.docStatus}>
                        <Ionicons
                          name={statusConf.icon}
                          size={12}
                          color={statusConf.color}
                        />
                        <Text style={[s.docStatusTxt, { color: statusConf.color }]}>
                          {statusConf.label}
                        </Text>
                      </View>
                    ) : (
                      <Text style={s.docMissing}>Non envoye</Text>
                    )}
                    {doc?.status === 'rejected' && doc.reject_reason && (
                      <Text style={s.docRejectReason} numberOfLines={2}>
                        {doc.reject_reason}
                      </Text>
                    )}
                  </View>

                  {/* Action */}
                  {isUploading ? (
                    <ActivityIndicator size="small" color={COLORS.green} />
                  ) : (
                    <View style={s.docAction}>
                      <Ionicons
                        name={doc ? 'refresh' : 'camera'}
                        size={18}
                        color={doc?.status === 'rejected' ? '#EF4444' : COLORS.green}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {/* Tips */}
        <View style={s.tips}>
          <Text style={s.tipsTitle}>Conseils pour des photos valides</Text>
          {[
            'Prenez les photos dans un endroit bien eclaire',
            'Assurez-vous que le document est entierement visible',
            'Evitez les reflets et les ombres sur le document',
            'La CNI et le permis doivent etre en mode paysage',
            'Le casier judiciaire doit dater de moins de 3 mois',
          ].map((tip, i) => (
            <View key={i} style={s.tipItem}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.green} />
              <Text style={s.tipTxt}>{tip}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingTxt: { color: COLORS.dim, marginTop: 12, fontSize: 14 },
  scroll: { paddingBottom: 20 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingHorizontal: 20, paddingBottom: 16,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.line,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.white },

  // Progress card
  progressCard: {
    marginHorizontal: 20, marginBottom: 16,
    backgroundColor: COLORS.card, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.line, padding: 18,
  },
  progressTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 14,
  },
  progressLabel: { fontSize: 12, color: COLORS.dim, marginBottom: 4 },
  progressCount: { fontSize: 18, fontWeight: '800', color: COLORS.white },
  progressCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.green,
  },
  progressPct: { fontSize: 14, fontWeight: '800', color: COLORS.green },
  progressBarBg: {
    height: 6, borderRadius: 3, backgroundColor: COLORS.surface,
    marginBottom: 12, overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%', borderRadius: 3, backgroundColor: COLORS.green,
  },
  progressStats: { flexDirection: 'row', gap: 16 },
  progressStat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statDot: { width: 6, height: 6, borderRadius: 3 },
  statTxt: { fontSize: 11, color: COLORS.dim },

  // Info banner
  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    marginHorizontal: 20, marginBottom: 16, padding: 14,
    backgroundColor: COLORS.surface, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.line,
  },
  infoBannerTxt: { flex: 1, fontSize: 13, color: COLORS.dim, lineHeight: 18 },

  // Category
  category: { marginHorizontal: 20, marginBottom: 16 },
  catHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: 10,
  },
  catTitle: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  optionalBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: 'rgba(255,184,0,0.06)', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,184,0,0.15)',
    padding: 12, marginBottom: 8,
  },
  optionalTxt: { flex: 1, fontSize: 12, color: '#FFB800', lineHeight: 17 },

  // Document item
  docItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.card, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.line,
    padding: 14, marginBottom: 8,
  },
  docItemApproved: {
    borderColor: 'rgba(34,197,94,0.2)',
    backgroundColor: 'rgba(34,197,94,0.04)',
  },
  docItemRejected: {
    borderColor: 'rgba(239,68,68,0.2)',
    backgroundColor: 'rgba(239,68,68,0.04)',
  },
  docThumb: {
    width: 48, height: 48, borderRadius: 10,
    backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  docThumbImg: { width: 48, height: 48, borderRadius: 10 },
  docInfo: { flex: 1 },
  docLabel: { fontSize: 14, fontWeight: '600', color: COLORS.white, marginBottom: 3 },
  docStatus: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  docStatusTxt: { fontSize: 12, fontWeight: '600' },
  docMissing: { fontSize: 12, color: COLORS.dim },
  docRejectReason: { fontSize: 11, color: '#EF4444', marginTop: 3, lineHeight: 15 },
  docAction: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center',
  },

  // Tips
  tips: {
    marginHorizontal: 20, marginTop: 8,
    backgroundColor: COLORS.card, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.line, padding: 16,
  },
  tipsTitle: { fontSize: 14, fontWeight: '700', color: COLORS.white, marginBottom: 12 },
  tipItem: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 6,
  },
  tipTxt: { fontSize: 13, color: COLORS.dim, flex: 1 },
});
