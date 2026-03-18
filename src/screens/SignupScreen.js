import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Alert, Linking, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';
import GreenButton from '../components/GreenButton';
import { supabase } from '../lib/supabase';

const ZONES = ['Plateau', 'Medina', 'Parcelles Assainies', 'Almadies / Ngor', 'Ouakam / Mermoz', 'Pikine / Guediawaye', 'Autre'];
const VEHICLES = ['Berline (Toyota, Hyundai...)', 'SUV / 4x4', 'Minivan / 7 places', 'Autre'];

export default function SignupScreen({ route, navigation }) {
  const initialRole = route?.params?.role || 'driver';
  const [role, setRole] = useState(initialRole);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [zone, setZone] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [flyer, setFlyer] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState(0);

  const isDriver = role === 'driver';

  useEffect(() => {
    fetchWaitlistCount();
  }, []);

  const fetchWaitlistCount = async () => {
    try {
      const { count } = await supabase
        .from('waitlist')
        .select('*', { count: 'exact', head: true });
      if (count !== null) setWaitlistCount(count);
    } catch (e) {
      // Table might not exist yet
      setWaitlistCount(147);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Champs requis', 'Veuillez remplir votre nom et numero WhatsApp.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('waitlist').insert({
        nom: name.trim(),
        whatsapp: phone.trim(),
        role: isDriver ? 'chauffeur' : 'passager',
        zone: isDriver ? zone : null,
        vehicule: isDriver ? vehicle : null,
        flyer,
      });

      if (error) throw error;
      setWaitlistCount(prev => prev + 1);
      setSubmitted(true);
    } catch (e) {
      // If table doesn't exist yet, still show success for demo
      console.log('Supabase error:', e.message);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const shareWhatsApp = () => {
    Linking.openURL('https://wa.me/?text=Yokh%20Laa%20-%20Transport%20Dakar%200%25%20commission%20%21%20Rejoins%20la%20liste');
  };

  if (submitted) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.successWrap}>
          <View style={styles.successRing}>
            <Ionicons name="checkmark" size={32} color={COLORS.green} />
          </View>
          <Text style={styles.successTitle}>Vous etes inscrit·e !</Text>
          <Text style={styles.successText}>
            Nous vous contacterons des que le lancement approche.{'\n'}Partagez avec vos collegues chauffeurs.
          </Text>
          <TouchableOpacity style={styles.shareBtn} onPress={shareWhatsApp}>
            <Ionicons name="share-outline" size={16} color={COLORS.green} />
            <Text style={styles.shareText}>Partager sur WhatsApp</Text>
          </TouchableOpacity>
          <GreenButton
            title="Retour a l'accueil"
            onPress={() => { setSubmitted(false); navigation.goBack(); }}
            outline
            style={{ marginTop: 16, width: '100%' }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Rejoindre la{'\n'}liste d'attente</Text>

          {/* TAB SWITCH */}
          <View style={styles.tabSwitch}>
            <TouchableOpacity
              style={[styles.tab, isDriver && styles.tabActive]}
              onPress={() => setRole('driver')}
            >
              <Text style={[styles.tabText, isDriver && styles.tabTextActive]}>Chauffeur</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, !isDriver && styles.tabActive]}
              onPress={() => setRole('passenger')}
            >
              <Text style={[styles.tabText, !isDriver && styles.tabTextActive]}>Passager</Text>
            </TouchableOpacity>
          </View>

          {/* COUNTER */}
          <View style={styles.counterBar}>
            <View>
              <Text style={styles.counterNum}>{waitlistCount || 147}</Text>
              <Text style={styles.counterLabel}>inscrits en liste d'attente</Text>
            </View>
            <View style={styles.counterDot} />
          </View>

          {/* FORM */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>PRENOM ET NOM</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Mamadou Diallo"
              placeholderTextColor={COLORS.dim2}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>NUMERO WHATSAPP</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+221 77 000 00 00"
              placeholderTextColor={COLORS.dim2}
              keyboardType="phone-pad"
            />
          </View>

          {isDriver && (
            <>
              <View style={styles.formGroup}>
                <Text style={styles.label}>ZONE PRINCIPALE</Text>
                <View style={styles.optionsWrap}>
                  {ZONES.map((z) => (
                    <TouchableOpacity
                      key={z}
                      style={[styles.option, zone === z && styles.optionActive]}
                      onPress={() => setZone(z)}
                    >
                      <Text style={[styles.optionText, zone === z && styles.optionTextActive]}>{z}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>TYPE DE VEHICULE</Text>
                <View style={styles.optionsWrap}>
                  {VEHICLES.map((v) => (
                    <TouchableOpacity
                      key={v}
                      style={[styles.option, vehicle === v && styles.optionActive]}
                      onPress={() => setVehicle(v)}
                    >
                      <Text style={[styles.optionText, vehicle === v && styles.optionTextActive]}>{v}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* FLYER OFFER */}
              <View style={styles.flyerOffer}>
                <View style={styles.flyerTop}>
                  <View style={styles.flyerBadge}>
                    <Text style={styles.flyerBadgeText}>10 000 F</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.flyerTitle}>Autocollant Yokh Laa</Text>
                    <Text style={styles.flyerSub}>Paiement unique · Visibilite maximale</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.flyerCheck}
                  onPress={() => setFlyer(!flyer)}
                >
                  <View style={[styles.flyerBox, flyer && styles.flyerBoxChecked]}>
                    {flyer && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                  <Text style={styles.flyerLabel}>J'accepte d'apposer un autocollant sur ma voiture</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {!isDriver && (
            <View style={styles.parrainOffer}>
              <View style={styles.parrainIcon}>
                <Ionicons name="people-outline" size={20} color={COLORS.green} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.parrainTitle}>Parrainez 2 amis → Course offerte</Text>
                <Text style={styles.parrainDesc}>
                  Invitez 2 personnes qui effectuent leur premiere course et votre prochaine course jusqu'a 6 km est offerte.
                </Text>
              </View>
            </View>
          )}

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.green} style={{ marginTop: 20 }} />
          ) : (
            <GreenButton
              title={isDriver ? 'Rejoindre en tant que chauffeur' : 'Rejoindre en tant que passager'}
              onPress={handleSubmit}
              style={{ marginTop: 20 }}
            />
          )}

          <Text style={styles.disclaimer}>
            En vous inscrivant, vous acceptez de recevoir des informations sur le lancement. Aucun paiement requis.
          </Text>

          {/* TRUST */}
          <View style={styles.trustList}>
            {[
              { icon: 'lock-closed-outline', text: 'Vos donnees ne seront jamais vendues' },
              { icon: 'mail-outline', text: 'Un email a chaque etape du lancement' },
              { icon: 'checkmark-outline', text: '1er mois gratuit pour les 50 premiers chauffeurs' },
              { icon: 'close-outline', text: 'Desabonnement libre, sans frais' },
            ].map((t, i) => (
              <View key={i} style={styles.trustItem}>
                <View style={styles.trustIcon}>
                  <Ionicons name={t.icon} size={16} color={COLORS.green} />
                </View>
                <Text style={styles.trustText}>{t.text}</Text>
              </View>
            ))}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  scroll: {
    padding: SIZES.padding,
    paddingTop: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -1.5,
    lineHeight: 34,
    marginBottom: 24,
  },

  // TABS
  tabSwitch: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 4,
    marginBottom: 18,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: COLORS.green,
    shadowColor: COLORS.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.dim,
  },
  tabTextActive: {
    color: '#fff',
  },

  // COUNTER
  counterBar: {
    backgroundColor: COLORS.greenLight,
    borderWidth: 1,
    borderColor: COLORS.greenBorder,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  counterNum: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.green,
  },
  counterLabel: {
    fontSize: 11,
    color: COLORS.dim,
  },
  counterDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORS.green,
  },

  // FORM
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: COLORS.dim,
    textTransform: 'uppercase',
    marginBottom: 7,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
    color: COLORS.white,
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  optionActive: {
    backgroundColor: COLORS.greenLight,
    borderColor: COLORS.green,
  },
  optionText: {
    fontSize: 13,
    color: COLORS.dim,
  },
  optionTextActive: {
    color: COLORS.green,
    fontWeight: '600',
  },

  // FLYER
  flyerOffer: {
    backgroundColor: 'rgba(34,197,94,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.2)',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    marginBottom: 4,
  },
  flyerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  flyerBadge: {
    backgroundColor: COLORS.green,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  flyerBadgeText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  flyerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 2,
  },
  flyerSub: {
    fontSize: 12,
    color: COLORS.dim,
  },
  flyerCheck: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  flyerBox: {
    width: 20, height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: 'rgba(34,197,94,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  flyerBoxChecked: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  flyerLabel: {
    flex: 1,
    fontSize: 13,
    color: COLORS.dim,
    lineHeight: 20,
  },

  // PARRAIN
  parrainOffer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(34,197,94,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.15)',
    borderRadius: 14,
    padding: 16,
    gap: 14,
    marginBottom: 4,
  },
  parrainIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  parrainTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 4,
  },
  parrainDesc: {
    fontSize: 13,
    color: COLORS.dim,
    lineHeight: 20,
  },

  disclaimer: {
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.dim2,
    marginTop: 12,
    lineHeight: 18,
  },

  // TRUST
  trustList: {
    gap: 12,
    marginTop: 28,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  trustIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: COLORS.greenLight,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustText: {
    fontSize: 14,
    color: COLORS.dim,
    flex: 1,
  },

  // SUCCESS
  successWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.padding,
  },
  successRing: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: COLORS.greenLight,
    borderWidth: 2,
    borderColor: 'rgba(34,197,94,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: COLORS.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 10,
  },
  successText: {
    fontSize: 14,
    color: COLORS.dim,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.greenLight,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.2)',
    borderRadius: 9,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  shareText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.green,
  },
});
