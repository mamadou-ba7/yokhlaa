import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert,
  Animated, Linking, Platform, ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import GreenButton from '../../components/GreenButton';
import AnimatedScreen from '../../components/AnimatedScreen';
import { tapLight, tapMedium, notifySuccess, notifyError } from '../../lib/haptics';
import { createSubscriptionPayment, openPaymentUrl, waitForPaymentConfirmation } from '../../lib/payments';

const PLAN = {
  name: 'Abonnement Chauffeur',
  price: 18500,
  period: 'mois',
  features: [
    { icon: 'checkmark-circle', text: '0% de commission sur vos courses' },
    { icon: 'checkmark-circle', text: 'Courses illimitees' },
    { icon: 'checkmark-circle', text: 'Chat in-app avec passagers' },
    { icon: 'checkmark-circle', text: 'Tableau de bord et statistiques' },
    { icon: 'checkmark-circle', text: 'Notifications en temps reel' },
    { icon: 'checkmark-circle', text: 'Support prioritaire' },
  ],
};

const PAYMENT_METHODS = [
  {
    id: 'wave',
    name: 'Wave',
    icon: 'phone-portrait-outline',
    color: '#1DC3E2',
    description: 'Paiement via Wave Money',
  },
  {
    id: 'orange_money',
    name: 'Orange Money',
    icon: 'phone-portrait-outline',
    color: '#FF6600',
    description: 'Paiement via Orange Money',
  },
  {
    id: 'free_money',
    name: 'Free Money',
    icon: 'phone-portrait-outline',
    color: '#E30613',
    description: 'Paiement via Free Money',
  },
];

export default function SubscriptionScreen({ navigation }) {
  const { user, profile, fetchProfile } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState('select'); // select | confirm | pending | success
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadSubscription();
    Animated.spring(slideAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }).start();
  }, []);

  // Pulse animation for active badge
  useEffect(() => {
    if (subscription?.status === 'active') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [subscription]);

  const loadSubscription = async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase.from('subscriptions')
        .select('*')
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      setSubscription(data);
    } catch (e) {
      // No subscription found
    }
    setLoading(false);
  };

  const isActive = subscription?.status === 'active' &&
    new Date(subscription.ends_at) > new Date();

  const daysRemaining = subscription?.ends_at
    ? Math.max(0, Math.ceil((new Date(subscription.ends_at) - new Date()) / (1000 * 60 * 60 * 24)))
    : 0;

  const handleSelectMethod = (method) => {
    tapLight();
    setSelectedMethod(method);
  };

  const handlePay = async () => {
    if (!selectedMethod) {
      Alert.alert('Methode de paiement', 'Veuillez choisir une methode de paiement.');
      return;
    }
    tapMedium();
    setPaymentStep('confirm');
  };

  const confirmPayment = async () => {
    tapMedium();
    setProcessing(true);

    try {
      // 1. Creer le paiement via Edge Function → CinetPay
      const { payment_url, transaction_id } = await createSubscriptionPayment({
        paymentMethod: selectedMethod.id,
      });

      // 2. Ouvrir la page de paiement CinetPay dans le navigateur
      setPaymentStep('pending');
      await openPaymentUrl(payment_url);

      // 3. Attendre la confirmation webhook (poll toutes les 3s, timeout 3min)
      const result = await waitForPaymentConfirmation(transaction_id);

      if (result.success) {
        // Paiement reussi — rafraichir le profil (trigger SQL a mis subscription_active=true)
        await fetchProfile();
        setSubscription(result.subscription);
        setPaymentStep('success');
        notifySuccess();
      } else {
        // Paiement echoue
        notifyError();
        Alert.alert('Paiement echoue', result.error || 'Le paiement n\'a pas abouti. Reessayez.');
        setPaymentStep('select');
      }
    } catch (e) {
      console.warn('Payment error:', e);
      notifyError();
      Alert.alert('Erreur', e.message || 'Impossible de traiter le paiement. Reessayez.');
      setPaymentStep('select');
    }

    setProcessing(false);
  };

  const renderActiveSubscription = () => (
    <View style={s.activeCard}>
      <Animated.View style={[s.activeBadge, { transform: [{ scale: pulseAnim }] }]}>
        <Ionicons name="checkmark-circle" size={24} color={COLORS.green} />
        <Text style={s.activeBadgeText}>Abonnement actif</Text>
      </Animated.View>

      <Text style={s.activePrice}>{PLAN.price.toLocaleString()} FCFA<Text style={s.activePeriod}> / mois</Text></Text>

      <View style={s.activeInfo}>
        <View style={s.activeInfoRow}>
          <Ionicons name="calendar-outline" size={18} color={COLORS.dim} />
          <Text style={s.activeInfoText}>
            Debut : {new Date(subscription.starts_at).toLocaleDateString('fr-FR')}
          </Text>
        </View>
        <View style={s.activeInfoRow}>
          <Ionicons name="time-outline" size={18} color={COLORS.dim} />
          <Text style={s.activeInfoText}>
            Expire : {new Date(subscription.ends_at).toLocaleDateString('fr-FR')}
          </Text>
        </View>
        <View style={s.activeInfoRow}>
          <Ionicons name="hourglass-outline" size={18} color={daysRemaining <= 5 ? COLORS.red : COLORS.green} />
          <Text style={[s.activeInfoText, daysRemaining <= 5 && { color: COLORS.red }]}>
            {daysRemaining} jour{daysRemaining > 1 ? 's' : ''} restant{daysRemaining > 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {daysRemaining <= 5 && (
        <TouchableOpacity style={s.renewBtn} onPress={() => { tapLight(); setPaymentStep('select'); setSubscription(null); }}>
          <Ionicons name="refresh" size={18} color={COLORS.white} />
          <Text style={s.renewBtnText}>Renouveler maintenant</Text>
        </TouchableOpacity>
      )}

      <View style={s.commissionBadge}>
        <Text style={s.commissionText}>0% commission</Text>
        <Text style={s.commissionSub}>Vous gardez 100% de vos gains</Text>
      </View>
    </View>
  );

  const renderPaymentSelect = () => (
    <View>
      {/* Plan card */}
      <View style={s.planCard}>
        <View style={s.planHeader}>
          <Ionicons name="car-sport" size={28} color={COLORS.green} />
          <Text style={s.planName}>{PLAN.name}</Text>
        </View>
        <Text style={s.planPrice}>{PLAN.price.toLocaleString()} FCFA<Text style={s.planPeriod}> / mois</Text></Text>
        <View style={s.planFeatures}>
          {PLAN.features.map((f, i) => (
            <View key={i} style={s.featureRow}>
              <Ionicons name={f.icon} size={18} color={COLORS.green} />
              <Text style={s.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Comparison badge */}
      <View style={s.comparisonCard}>
        <Ionicons name="trending-down" size={20} color={COLORS.green} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.comparisonTitle}>Moins cher que la concurrence</Text>
          <Text style={s.comparisonText}>
            Uber/Yango prennent 20-25% de commission.{'\n'}
            Sur 300 000 FCFA de courses, vous payez 18 500 FCFA (6%) au lieu de 75 000 FCFA.
          </Text>
        </View>
      </View>

      {/* Payment methods */}
      <Text style={s.sectionTitle}>Choisir le moyen de paiement</Text>

      {PAYMENT_METHODS.map((method) => (
        <TouchableOpacity
          key={method.id}
          style={[
            s.methodCard,
            selectedMethod?.id === method.id && { borderColor: method.color, borderWidth: 2 },
          ]}
          onPress={() => handleSelectMethod(method)}
          activeOpacity={0.7}
        >
          <View style={[s.methodIcon, { backgroundColor: method.color + '20' }]}>
            <Ionicons name={method.icon} size={24} color={method.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.methodName}>{method.name}</Text>
            <Text style={s.methodDesc}>{method.description}</Text>
          </View>
          {selectedMethod?.id === method.id && (
            <Ionicons name="checkmark-circle" size={24} color={method.color} />
          )}
        </TouchableOpacity>
      ))}

      <GreenButton
        title="Payer 18 500 FCFA"
        onPress={handlePay}
        disabled={!selectedMethod}
        icon="card-outline"
        style={{ marginTop: 20 }}
      />
    </View>
  );

  const renderConfirmation = () => (
    <View style={s.confirmCard}>
      <Ionicons name="shield-checkmark" size={48} color={COLORS.green} style={{ alignSelf: 'center' }} />
      <Text style={s.confirmTitle}>Confirmer le paiement</Text>

      <View style={s.confirmDetails}>
        <View style={s.confirmRow}>
          <Text style={s.confirmLabel}>Abonnement</Text>
          <Text style={s.confirmValue}>{PLAN.name}</Text>
        </View>
        <View style={s.confirmRow}>
          <Text style={s.confirmLabel}>Duree</Text>
          <Text style={s.confirmValue}>1 mois</Text>
        </View>
        <View style={s.confirmRow}>
          <Text style={s.confirmLabel}>Paiement</Text>
          <Text style={s.confirmValue}>{selectedMethod?.name}</Text>
        </View>
        <View style={[s.confirmRow, { borderBottomWidth: 0 }]}>
          <Text style={[s.confirmLabel, { fontWeight: '700', color: COLORS.white }]}>Total</Text>
          <Text style={[s.confirmValue, { fontWeight: '700', color: COLORS.green, fontSize: 18 }]}>
            {PLAN.price.toLocaleString()} FCFA
          </Text>
        </View>
      </View>

      <GreenButton
        title="Confirmer et payer"
        onPress={confirmPayment}
        icon="lock-closed-outline"
        style={{ marginTop: 16 }}
      />

      <TouchableOpacity
        style={s.cancelBtn}
        onPress={() => { tapLight(); setPaymentStep('select'); }}
      >
        <Text style={s.cancelBtnText}>Annuler</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPending = () => (
    <View style={s.pendingCard}>
      <ActivityIndicator size="large" color={COLORS.green} />
      <Text style={s.pendingTitle}>Paiement en cours...</Text>
      <Text style={s.pendingText}>
        Completez le paiement dans l'application {selectedMethod?.name}.{'\n'}
        Ne fermez pas cette page.
      </Text>
      {selectedMethod?.ussd && (
        <View style={s.ussdBox}>
          <Text style={s.ussdLabel}>Code USSD</Text>
          <Text style={s.ussdCode}>{selectedMethod.ussd}</Text>
          <Text style={s.ussdHint}>Composez ce code si l'app ne s'ouvre pas</Text>
        </View>
      )}
    </View>
  );

  const renderSuccess = () => (
    <View style={s.successCard}>
      <View style={s.successCircle}>
        <Ionicons name="checkmark" size={48} color={COLORS.white} />
      </View>
      <Text style={s.successTitle}>Paiement reussi !</Text>
      <Text style={s.successText}>
        Votre abonnement est maintenant actif.{'\n'}
        Vous pouvez recevoir des courses immediatement.
      </Text>

      <View style={s.successDetails}>
        <View style={s.confirmRow}>
          <Text style={s.confirmLabel}>Montant</Text>
          <Text style={s.confirmValue}>{PLAN.price.toLocaleString()} FCFA</Text>
        </View>
        <View style={s.confirmRow}>
          <Text style={s.confirmLabel}>Methode</Text>
          <Text style={s.confirmValue}>{selectedMethod?.name}</Text>
        </View>
        <View style={[s.confirmRow, { borderBottomWidth: 0 }]}>
          <Text style={s.confirmLabel}>Valide jusqu'au</Text>
          <Text style={[s.confirmValue, { color: COLORS.green }]}>
            {subscription?.ends_at
              ? new Date(subscription.ends_at).toLocaleDateString('fr-FR')
              : '—'}
          </Text>
        </View>
      </View>

      <GreenButton
        title="Commencer a conduire"
        onPress={() => { tapMedium(); navigation.goBack(); }}
        icon="car-sport-outline"
        style={{ marginTop: 16 }}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={s.container}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={COLORS.green} style={{ marginTop: 100 }} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => { tapLight(); navigation.goBack(); }} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Abonnement</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <AnimatedScreen>
          {isActive && paymentStep === 'select' ? renderActiveSubscription() : null}
          {!isActive && paymentStep === 'select' ? renderPaymentSelect() : null}
          {paymentStep === 'confirm' ? renderConfirmation() : null}
          {paymentStep === 'pending' ? renderPending() : null}
          {paymentStep === 'success' ? renderSuccess() : null}

          {/* FAQ */}
          <View style={s.faqSection}>
            <Text style={s.sectionTitle}>Questions frequentes</Text>

            <View style={s.faqItem}>
              <Text style={s.faqQ}>Puis-je annuler a tout moment ?</Text>
              <Text style={s.faqA}>Oui, votre abonnement ne se renouvelle pas automatiquement. Vous choisissez de renouveler chaque mois.</Text>
            </View>

            <View style={s.faqItem}>
              <Text style={s.faqQ}>Que se passe-t-il si mon abonnement expire ?</Text>
              <Text style={s.faqA}>Vous ne pourrez plus recevoir de courses tant que vous n'aurez pas renouvele. Vos donnees et statistiques sont conservees.</Text>
            </View>

            <View style={s.faqItem}>
              <Text style={s.faqQ}>Y a-t-il des frais supplementaires ?</Text>
              <Text style={s.faqA}>Non. 18 500 FCFA/mois, c'est tout. 0% de commission sur toutes vos courses, sans exception.</Text>
            </View>

            <View style={s.faqItem}>
              <Text style={s.faqQ}>Comment fonctionne le paiement ?</Text>
              <Text style={s.faqA}>Vous payez via Wave, Orange Money ou Free Money. Le paiement est confirme instantanement et votre abonnement est active immediatement.</Text>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </AnimatedScreen>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 12,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  content: { paddingHorizontal: 20 },

  // Active subscription
  activeCard: {
    backgroundColor: COLORS.card, borderRadius: 20, padding: 24, marginTop: 8,
    borderWidth: 1, borderColor: COLORS.greenBorder,
  },
  activeBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'center', marginBottom: 16,
    backgroundColor: COLORS.greenLight, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
  },
  activeBadgeText: { color: COLORS.green, fontWeight: '700', fontSize: 16, marginLeft: 8 },
  activePrice: { color: COLORS.white, fontSize: 32, fontWeight: '800', textAlign: 'center' },
  activePeriod: { fontSize: 16, fontWeight: '400', color: COLORS.dim },
  activeInfo: { marginTop: 20, gap: 12 },
  activeInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  activeInfoText: { color: COLORS.dim, fontSize: 14 },
  renewBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.red, borderRadius: 12, padding: 14, marginTop: 20,
  },
  renewBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  commissionBadge: {
    backgroundColor: COLORS.greenLight, borderRadius: 12, padding: 16, marginTop: 20, alignItems: 'center',
  },
  commissionText: { color: COLORS.green, fontWeight: '800', fontSize: 20 },
  commissionSub: { color: COLORS.green, fontSize: 13, marginTop: 4, opacity: 0.8 },

  // Plan card
  planCard: {
    backgroundColor: COLORS.card, borderRadius: 20, padding: 24, marginTop: 8,
    borderWidth: 1, borderColor: COLORS.greenBorder,
  },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  planName: { color: COLORS.white, fontSize: 18, fontWeight: '700' },
  planPrice: { color: COLORS.white, fontSize: 36, fontWeight: '800' },
  planPeriod: { fontSize: 16, fontWeight: '400', color: COLORS.dim },
  planFeatures: { marginTop: 20, gap: 12 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { color: COLORS.dim, fontSize: 14 },

  // Comparison
  comparisonCard: {
    flexDirection: 'row', backgroundColor: COLORS.greenLight, borderRadius: 16, padding: 16, marginTop: 16,
    borderWidth: 1, borderColor: COLORS.greenBorder,
  },
  comparisonTitle: { color: COLORS.green, fontWeight: '700', fontSize: 14 },
  comparisonText: { color: COLORS.dim, fontSize: 12, marginTop: 4, lineHeight: 18 },

  // Payment methods
  sectionTitle: { color: COLORS.white, fontSize: 16, fontWeight: '700', marginTop: 24, marginBottom: 12 },
  methodCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card,
    borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: COLORS.line,
  },
  methodIcon: {
    width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  methodName: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
  methodDesc: { color: COLORS.dim, fontSize: 12, marginTop: 2 },

  // Confirmation
  confirmCard: { backgroundColor: COLORS.card, borderRadius: 20, padding: 24, marginTop: 8 },
  confirmTitle: { color: COLORS.white, fontSize: 22, fontWeight: '700', textAlign: 'center', marginTop: 16 },
  confirmDetails: {
    backgroundColor: COLORS.surface, borderRadius: 14, marginTop: 20, overflow: 'hidden',
  },
  confirmRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.line,
  },
  confirmLabel: { color: COLORS.dim, fontSize: 14 },
  confirmValue: { color: COLORS.white, fontSize: 14, fontWeight: '600' },
  cancelBtn: { alignItems: 'center', padding: 16, marginTop: 8 },
  cancelBtnText: { color: COLORS.dim, fontSize: 15 },

  // Pending
  pendingCard: { backgroundColor: COLORS.card, borderRadius: 20, padding: 32, marginTop: 8, alignItems: 'center' },
  pendingTitle: { color: COLORS.white, fontSize: 20, fontWeight: '700', marginTop: 20 },
  pendingText: { color: COLORS.dim, fontSize: 14, textAlign: 'center', marginTop: 10, lineHeight: 22 },
  ussdBox: {
    backgroundColor: COLORS.surface, borderRadius: 14, padding: 20, marginTop: 24, alignItems: 'center', width: '100%',
  },
  ussdLabel: { color: COLORS.dim, fontSize: 12 },
  ussdCode: { color: COLORS.white, fontSize: 28, fontWeight: '800', marginTop: 6 },
  ussdHint: { color: COLORS.dim, fontSize: 11, marginTop: 8 },

  // Success
  successCard: { backgroundColor: COLORS.card, borderRadius: 20, padding: 24, marginTop: 8, alignItems: 'center' },
  successCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.green,
    alignItems: 'center', justifyContent: 'center',
  },
  successTitle: { color: COLORS.white, fontSize: 24, fontWeight: '800', marginTop: 16 },
  successText: { color: COLORS.dim, fontSize: 14, textAlign: 'center', marginTop: 10, lineHeight: 22 },
  successDetails: {
    backgroundColor: COLORS.surface, borderRadius: 14, marginTop: 20, overflow: 'hidden', width: '100%',
  },

  // FAQ
  faqSection: { marginTop: 8 },
  faqItem: { backgroundColor: COLORS.card, borderRadius: 14, padding: 16, marginBottom: 10 },
  faqQ: { color: COLORS.white, fontSize: 14, fontWeight: '600' },
  faqA: { color: COLORS.dim, fontSize: 13, marginTop: 6, lineHeight: 20 },
});
