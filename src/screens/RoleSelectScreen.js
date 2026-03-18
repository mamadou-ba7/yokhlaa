import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useAuth } from '../lib/AuthContext';

export default function RoleSelectScreen({ navigation }) {
  const { user, isGuest, createProfile } = useAuth();
  const [showDriverForm, setShowDriverForm] = useState(false);
  const [vehicule, setVehicule] = useState('');
  const [plaque, setPlaque] = useState('');
  const [loading, setLoading] = useState(false);

  const goPassenger = async () => {
    if (user?.id) {
      try {
        await createProfile({ role: 'passager' });
      } catch (e) {
        console.warn('Erreur sauvegarde rôle:', e);
      }
    }
    // En mode invité, la navigation est gérée par App.js via le state
    // Pour les users connectés, le profile.role change → App.js redirige automatiquement
  };

  const submitDriver = async () => {
    if (isGuest) {
      Alert.alert(
        'Compte requis',
        'Vous devez vous connecter pour devenir chauffeur.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!vehicule.trim()) {
      Alert.alert('Véhicule requis', 'Entrez la marque et le modèle de votre véhicule.');
      return;
    }
    if (!plaque.trim()) {
      Alert.alert('Plaque requise', 'Entrez le numéro de plaque de votre véhicule.');
      return;
    }

    setLoading(true);
    try {
      await createProfile({
        role: 'chauffeur',
        vehicule: vehicule.trim(),
        plaque: plaque.trim().toUpperCase(),
      });
      // Le profile.role change → App.js redirige automatiquement vers DriverMain
    } catch (e) {
      console.warn('Driver registration error:', e);
      Alert.alert('Erreur', 'Impossible de sauvegarder vos informations. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  if (showDriverForm) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.backBtn} onPress={() => setShowDriverForm(false)}>
            <Ionicons name="arrow-back" size={20} color={COLORS.white} />
          </TouchableOpacity>

          <View style={styles.formHeader}>
            <View style={[styles.logoIcon, { backgroundColor: COLORS.green }]}>
              <Ionicons name="car" size={24} color="#fff" />
            </View>
            <Text style={styles.formTitle}>Inscription Chauffeur</Text>
            <Text style={styles.formSubtitle}>Renseignez votre vehicule pour commencer a recevoir des courses</Text>
          </View>

          <View style={styles.formFields}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Vehicule</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Toyota Corolla 2019"
                placeholderTextColor={COLORS.dim}
                value={vehicule}
                onChangeText={setVehicule}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Plaque d'immatriculation</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: DK-1234-AB"
                placeholderTextColor={COLORS.dim}
                value={plaque}
                onChangeText={setPlaque}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={18} color={COLORS.green} />
              <Text style={styles.infoText}>Abonnement: 18 500 FCFA/mois{'\n'}0% commission sur vos courses</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.6 }]}
            onPress={submitDriver}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitTxt}>Commencer</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.inner}>
        <View style={styles.top}>
          <View style={styles.logoWrap}>
            <View style={styles.logoIcon}>
              <Ionicons name="car-sport" size={24} color="#fff" />
            </View>
          </View>
          <Text style={styles.title}>Comment souhaitez-vous{'\n'}utiliser Yokh Laa ?</Text>
          <Text style={styles.subtitle}>Vous pourrez changer a tout moment</Text>
        </View>

        <View style={styles.cards}>
          <TouchableOpacity
            style={styles.card}
            onPress={goPassenger}
            activeOpacity={0.8}
          >
            <View style={styles.cardTop}>
              <View style={styles.cardIconWrap}>
                <Ionicons name="person" size={28} color={COLORS.white} />
              </View>
              <Ionicons name="arrow-forward-circle" size={28} color={COLORS.dim} />
            </View>
            <Text style={styles.cardTitle}>Passager</Text>
            <Text style={styles.cardDesc}>Commander une course a Dakar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, styles.cardGreen]}
            onPress={() => setShowDriverForm(true)}
            activeOpacity={0.8}
          >
            <View style={styles.cardTop}>
              <View style={[styles.cardIconWrap, styles.cardIconGreen]}>
                <Ionicons name="car" size={28} color="#fff" />
              </View>
              <Ionicons name="arrow-forward-circle" size={28} color="rgba(255,255,255,0.5)" />
            </View>
            <Text style={[styles.cardTitle, { color: '#fff' }]}>Chauffeur</Text>
            <Text style={[styles.cardDesc, { color: 'rgba(255,255,255,0.7)' }]}>Recevoir des courses · 0% commission</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  inner: {
    flex: 1, justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  top: { marginBottom: 40 },
  logoWrap: { marginBottom: 24 },
  logoIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: COLORS.green, alignItems: 'center', justifyContent: 'center',
  },
  title: {
    fontSize: 26, fontWeight: '800', color: COLORS.white,
    lineHeight: 32, letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14, color: COLORS.dim, marginTop: 8,
  },
  cards: { gap: 14 },
  card: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.line,
    borderRadius: 20, padding: 22,
  },
  cardGreen: {
    backgroundColor: COLORS.green, borderColor: COLORS.green,
  },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 16,
  },
  cardIconWrap: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: COLORS.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  cardIconGreen: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  cardTitle: {
    fontSize: 20, fontWeight: '700', color: COLORS.white, marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14, color: COLORS.dim,
  },
  // Driver form styles
  formScroll: {
    flexGrow: 1, paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.line, marginBottom: 24,
  },
  formHeader: { marginBottom: 32 },
  formTitle: {
    fontSize: 24, fontWeight: '800', color: COLORS.white, marginTop: 16, marginBottom: 6,
  },
  formSubtitle: {
    fontSize: 14, color: COLORS.dim, lineHeight: 20,
  },
  formFields: { gap: 18, marginBottom: 28 },
  inputGroup: {},
  inputLabel: {
    fontSize: 13, fontWeight: '600', color: COLORS.dim,
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.line,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: COLORS.white,
  },
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: COLORS.greenLight || 'rgba(34,197,94,0.08)',
    borderWidth: 1, borderColor: COLORS.greenBorder || 'rgba(34,197,94,0.15)',
    borderRadius: 12, padding: 14,
  },
  infoText: {
    flex: 1, fontSize: 13, color: COLORS.green, lineHeight: 20,
  },
  submitBtn: {
    backgroundColor: COLORS.green, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  submitTxt: {
    fontSize: 16, fontWeight: '700', color: '#fff',
  },
});
