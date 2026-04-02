import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useAuth } from '../lib/AuthContext';

const ZONES_DAKAR = [
  'Dakar Plateau', 'Medina', 'Fann / Point E / Amitie',
  'Ouakam / Ngor / Yoff', 'Almadies / Virage',
  'Grand Dakar / HLM', 'Parcelles Assainies',
  'Guediawaye', 'Pikine', 'Keur Massar',
  'Rufisque', 'Diamniadio', 'Mbour / Thies',
];

const COULEURS_VEHICULE = [
  'Blanc', 'Noir', 'Gris', 'Bleu', 'Rouge',
  'Beige', 'Jaune', 'Vert', 'Marron', 'Autre',
];

const STEPS = [
  { id: 'info', title: 'Informations personnelles', icon: 'person' },
  { id: 'vehicule', title: 'Votre vehicule', icon: 'car' },
  { id: 'documents', title: 'Documents', icon: 'document-text' },
  { id: 'zone', title: 'Zone d\'activite', icon: 'location' },
];

export default function RoleSelectScreen({ navigation }) {
  const { user, isGuest, createProfile } = useAuth();
  const [showDriverForm, setShowDriverForm] = useState(false);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 1 — Infos personnelles
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [cni, setCni] = useState('');

  // Step 2 — Vehicule
  const [marque, setMarque] = useState('');
  const [modele, setModele] = useState('');
  const [annee, setAnnee] = useState('');
  const [couleur, setCouleur] = useState('');
  const [plaque, setPlaque] = useState('');
  const [places, setPlaces] = useState('4');

  // Step 3 — Documents
  const [permisNumero, setPermisNumero] = useState('');
  const [carteGrise, setCarteGrise] = useState('');
  const [assuranceNumero, setAssuranceNumero] = useState('');

  // Step 4 — Zone
  const [zone, setZone] = useState('');

  const goPassenger = async () => {
    if (user?.id) {
      try {
        await createProfile({ role: 'passager' });
      } catch (e) {
        console.warn('Erreur sauvegarde role:', e);
      }
    }
  };

  const validateStep = () => {
    switch (step) {
      case 0: // Info perso
        if (!prenom.trim()) { Alert.alert('Prenom requis', 'Entrez votre prenom.'); return false; }
        if (!nom.trim()) { Alert.alert('Nom requis', 'Entrez votre nom de famille.'); return false; }
        if (!cni.trim() || cni.trim().length < 10) {
          Alert.alert('CNI requise', 'Entrez votre numero de Carte Nationale d\'Identite (13 chiffres).');
          return false;
        }
        return true;
      case 1: // Vehicule
        if (!marque.trim()) { Alert.alert('Marque requise', 'Ex: Toyota, Renault, Hyundai...'); return false; }
        if (!modele.trim()) { Alert.alert('Modele requis', 'Ex: Corolla, Duster, i10...'); return false; }
        if (!annee.trim() || parseInt(annee) < 2005 || parseInt(annee) > new Date().getFullYear()) {
          Alert.alert('Annee invalide', 'Le vehicule doit avoir moins de 20 ans (2005 minimum).');
          return false;
        }
        if (!couleur.trim()) { Alert.alert('Couleur requise', 'Selectionnez la couleur du vehicule.'); return false; }
        if (!plaque.trim()) { Alert.alert('Plaque requise', 'Entrez le numero de plaque d\'immatriculation.'); return false; }
        return true;
      case 2: // Documents
        if (!permisNumero.trim()) {
          Alert.alert('Permis requis', 'Entrez votre numero de permis de conduire.');
          return false;
        }
        if (!carteGrise.trim()) {
          Alert.alert('Carte grise requise', 'Entrez le numero de votre carte grise.');
          return false;
        }
        if (!assuranceNumero.trim()) {
          Alert.alert('Assurance requise', 'Entrez le numero de votre police d\'assurance.');
          return false;
        }
        return true;
      case 3: // Zone
        if (!zone) { Alert.alert('Zone requise', 'Selectionnez votre zone d\'activite principale.'); return false; }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (!validateStep()) return;
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      submitDriver();
    }
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
    else setShowDriverForm(false);
  };

  const submitDriver = async () => {
    if (isGuest) {
      Alert.alert('Compte requis', 'Vous devez vous connecter pour devenir chauffeur.', [{ text: 'OK' }]);
      return;
    }

    setLoading(true);
    try {
      const vehiculeStr = `${marque.trim()} ${modele.trim()} ${annee.trim()}`;
      await createProfile({
        role: 'chauffeur',
        prenom: prenom.trim(),
        nom: nom.trim(),
        cni: cni.trim(),
        vehicule: vehiculeStr,
        vehicule_marque: marque.trim(),
        vehicule_modele: modele.trim(),
        vehicule_annee: parseInt(annee),
        vehicule_couleur: couleur,
        vehicule_places: parseInt(places) || 4,
        plaque: plaque.trim().toUpperCase(),
        permis_numero: permisNumero.trim(),
        carte_grise: carteGrise.trim(),
        assurance_numero: assuranceNumero.trim(),
        zone: zone,
        driver_status: 'pending',
      });
    } catch (e) {
      console.warn('Driver registration error:', e);
      Alert.alert('Erreur', 'Impossible de sauvegarder. Verifiez votre connexion et reessayez.');
    } finally {
      setLoading(false);
    }
  };

  // ── DRIVER MULTI-STEP FORM ──────────────────
  if (showDriverForm) {
    return (
      <KeyboardAvoidingView style={st.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={st.formScroll} keyboardShouldPersistTaps="handled">
          {/* Header + back */}
          <View style={st.formTop}>
            <TouchableOpacity style={st.backBtn} onPress={prevStep}>
              <Ionicons name="arrow-back" size={20} color={COLORS.white} />
            </TouchableOpacity>
            <Text style={st.stepCount}>Etape {step + 1}/{STEPS.length}</Text>
          </View>

          {/* Progress bar */}
          <View style={st.progressBar}>
            {STEPS.map((s, i) => (
              <View key={s.id} style={[st.progressDot, i <= step && st.progressDotActive]}>
                {i < step ? (
                  <Ionicons name="checkmark" size={12} color="#fff" />
                ) : (
                  <Ionicons name={s.icon} size={12} color={i === step ? '#fff' : COLORS.dim} />
                )}
              </View>
            ))}
            <View style={st.progressLine}>
              <View style={[st.progressFill, { width: `${(step / (STEPS.length - 1)) * 100}%` }]} />
            </View>
          </View>

          {/* Step title */}
          <View style={st.stepHeader}>
            <Text style={st.formTitle}>{STEPS[step].title}</Text>
            <Text style={st.formSubtitle}>
              {step === 0 && 'Ces informations permettent de verifier votre identite'}
              {step === 1 && 'Renseignez les details de votre vehicule'}
              {step === 2 && 'Documents obligatoires pour circuler au Senegal'}
              {step === 3 && 'Ou souhaitez-vous recevoir des courses ?'}
            </Text>
          </View>

          {/* ── STEP 0: Infos personnelles ── */}
          {step === 0 && (
            <View style={st.fields}>
              <View style={st.inputGroup}>
                <Text style={st.inputLabel}>Prenom</Text>
                <TextInput
                  style={st.input}
                  placeholder="Votre prenom"
                  placeholderTextColor={COLORS.dim2}
                  value={prenom}
                  onChangeText={setPrenom}
                  autoCapitalize="words"
                />
              </View>
              <View style={st.inputGroup}>
                <Text style={st.inputLabel}>Nom de famille</Text>
                <TextInput
                  style={st.input}
                  placeholder="Votre nom"
                  placeholderTextColor={COLORS.dim2}
                  value={nom}
                  onChangeText={setNom}
                  autoCapitalize="words"
                />
              </View>
              <View style={st.inputGroup}>
                <Text style={st.inputLabel}>Numero CNI (Carte Nationale d'Identite)</Text>
                <TextInput
                  style={st.input}
                  placeholder="Ex: 1 234 1990 01234"
                  placeholderTextColor={COLORS.dim2}
                  value={cni}
                  onChangeText={setCni}
                  keyboardType="numeric"
                />
                <Text style={st.inputHint}>Carte d'identite CEDEAO en cours de validite</Text>
              </View>
            </View>
          )}

          {/* ── STEP 1: Vehicule ── */}
          {step === 1 && (
            <View style={st.fields}>
              <View style={st.row}>
                <View style={[st.inputGroup, { flex: 1 }]}>
                  <Text style={st.inputLabel}>Marque</Text>
                  <TextInput
                    style={st.input}
                    placeholder="Toyota"
                    placeholderTextColor={COLORS.dim2}
                    value={marque}
                    onChangeText={setMarque}
                    autoCapitalize="words"
                  />
                </View>
                <View style={[st.inputGroup, { flex: 1 }]}>
                  <Text style={st.inputLabel}>Modele</Text>
                  <TextInput
                    style={st.input}
                    placeholder="Corolla"
                    placeholderTextColor={COLORS.dim2}
                    value={modele}
                    onChangeText={setModele}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={st.row}>
                <View style={[st.inputGroup, { flex: 1 }]}>
                  <Text style={st.inputLabel}>Annee</Text>
                  <TextInput
                    style={st.input}
                    placeholder="2019"
                    placeholderTextColor={COLORS.dim2}
                    value={annee}
                    onChangeText={setAnnee}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                </View>
                <View style={[st.inputGroup, { flex: 1 }]}>
                  <Text style={st.inputLabel}>Places</Text>
                  <TextInput
                    style={st.input}
                    placeholder="4"
                    placeholderTextColor={COLORS.dim2}
                    value={places}
                    onChangeText={setPlaces}
                    keyboardType="numeric"
                    maxLength={1}
                  />
                </View>
              </View>

              <View style={st.inputGroup}>
                <Text style={st.inputLabel}>Couleur du vehicule</Text>
                <View style={st.colorGrid}>
                  {COULEURS_VEHICULE.map(c => (
                    <TouchableOpacity
                      key={c}
                      style={[st.colorChip, couleur === c && st.colorChipActive]}
                      onPress={() => setCouleur(c)}
                    >
                      <Text style={[st.colorChipTxt, couleur === c && st.colorChipTxtActive]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={st.inputGroup}>
                <Text style={st.inputLabel}>Plaque d'immatriculation</Text>
                <TextInput
                  style={st.input}
                  placeholder="Ex: DK-1234-AB"
                  placeholderTextColor={COLORS.dim2}
                  value={plaque}
                  onChangeText={setPlaque}
                  autoCapitalize="characters"
                />
                <Text style={st.inputHint}>Format senegalais: AA-0000-BB</Text>
              </View>

              <View style={st.infoBox}>
                <Ionicons name="shield-checkmark" size={18} color={COLORS.green} />
                <Text style={st.infoText}>Vehicule de 2005 ou plus recent{'\n'}4 portes minimum · Climatisation fonctionnelle</Text>
              </View>
            </View>
          )}

          {/* ── STEP 2: Documents ── */}
          {step === 2 && (
            <View style={st.fields}>
              <View style={st.inputGroup}>
                <Text style={st.inputLabel}>Numero de permis de conduire</Text>
                <TextInput
                  style={st.input}
                  placeholder="Numero du permis"
                  placeholderTextColor={COLORS.dim2}
                  value={permisNumero}
                  onChangeText={setPermisNumero}
                />
                <Text style={st.inputHint}>Permis categorie B minimum · delivre au Senegal</Text>
              </View>

              <View style={st.inputGroup}>
                <Text style={st.inputLabel}>Numero de carte grise</Text>
                <TextInput
                  style={st.input}
                  placeholder="Numero carte grise du vehicule"
                  placeholderTextColor={COLORS.dim2}
                  value={carteGrise}
                  onChangeText={setCarteGrise}
                />
                <Text style={st.inputHint}>Le vehicule doit etre a votre nom ou avec procuration</Text>
              </View>

              <View style={st.inputGroup}>
                <Text style={st.inputLabel}>Numero police d'assurance</Text>
                <TextInput
                  style={st.input}
                  placeholder="Numero d'assurance vehicule"
                  placeholderTextColor={COLORS.dim2}
                  value={assuranceNumero}
                  onChangeText={setAssuranceNumero}
                />
                <Text style={st.inputHint}>Assurance tous risques ou tiers en cours de validite</Text>
              </View>

              <View style={st.docList}>
                <Text style={st.docListTitle}>Documents obligatoires (a envoyer apres inscription) :</Text>
                {[
                  'Photo de la CNI (recto/verso)',
                  'Photo du permis de conduire',
                  'Photo de la carte grise',
                  'Attestation d\'assurance',
                  'Photo du vehicule (4 angles)',
                ].map((doc, i) => (
                  <View key={i} style={st.docItem}>
                    <Ionicons name="checkmark-circle" size={14} color={COLORS.green} />
                    <Text style={st.docItemTxt}>{doc}</Text>
                  </View>
                ))}
                <View style={st.docDivider} />
                <Text style={[st.docListTitle, { color: '#FFB800' }]}>Optionnel — Badge Verifie+ :</Text>
                <View style={st.docItem}>
                  <Ionicons name="star" size={14} color="#FFB800" />
                  <Text style={st.docItemTxt}>Casier judiciaire (bulletin n°3) — plus de confiance des passagers</Text>
                </View>
              </View>
            </View>
          )}

          {/* ── STEP 3: Zone ── */}
          {step === 3 && (
            <View style={st.fields}>
              <View style={st.zoneGrid}>
                {ZONES_DAKAR.map(z => (
                  <TouchableOpacity
                    key={z}
                    style={[st.zoneChip, zone === z && st.zoneChipActive]}
                    onPress={() => setZone(z)}
                  >
                    <Ionicons name="location" size={14} color={zone === z ? '#fff' : COLORS.dim} />
                    <Text style={[st.zoneChipTxt, zone === z && st.zoneChipTxtActive]}>{z}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={st.infoBox}>
                <Ionicons name="information-circle" size={18} color={COLORS.green} />
                <Text style={st.infoText}>
                  Abonnement : 18 500 FCFA/mois{'\n'}
                  0% de commission sur vos courses{'\n'}
                  Paiement via Wave ou Orange Money
                </Text>
              </View>

              <View style={[st.infoBox, { borderColor: 'rgba(255,184,0,0.2)', backgroundColor: 'rgba(255,184,0,0.05)' }]}>
                <Ionicons name="time" size={18} color="#FFB800" />
                <Text style={[st.infoText, { color: '#FFB800' }]}>
                  Votre inscription sera verifiee sous 24 a 48h.{'\n'}
                  Vous recevrez un SMS de confirmation au +221.
                </Text>
              </View>
            </View>
          )}

          {/* CTA */}
          <TouchableOpacity
            style={[st.submitBtn, loading && { opacity: 0.6 }]}
            onPress={nextStep}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={st.submitInner}>
                <Text style={st.submitTxt}>
                  {step < STEPS.length - 1 ? 'Continuer' : 'Soumettre mon inscription'}
                </Text>
                <Ionicons name={step < STEPS.length - 1 ? 'arrow-forward' : 'checkmark-circle'} size={20} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── ROLE SELECT ──────────────────────────────
  return (
    <View style={st.container}>
      <StatusBar style="light" />
      <View style={st.inner}>
        <View style={st.top}>
          <View style={st.logoWrap}>
            <View style={st.logoIcon}>
              <Ionicons name="car-sport" size={24} color="#fff" />
            </View>
          </View>
          <Text style={st.title}>Comment souhaitez-vous{'\n'}utiliser Yokh Laa ?</Text>
          <Text style={st.subtitle}>Vous pourrez changer a tout moment</Text>
        </View>

        <View style={st.cards}>
          <TouchableOpacity style={st.card} onPress={goPassenger} activeOpacity={0.8}>
            <View style={st.cardTop}>
              <View style={st.cardIconWrap}>
                <Ionicons name="person" size={28} color={COLORS.white} />
              </View>
              <Ionicons name="arrow-forward-circle" size={28} color={COLORS.dim} />
            </View>
            <Text style={st.cardTitle}>Passager</Text>
            <Text style={st.cardDesc}>Commander une course a Dakar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[st.card, st.cardGreen]}
            onPress={() => {
              if (isGuest) {
                Alert.alert('Compte requis', 'Connectez-vous pour devenir chauffeur.', [{ text: 'OK' }]);
                return;
              }
              setShowDriverForm(true);
              setStep(0);
            }}
            activeOpacity={0.8}
          >
            <View style={st.cardTop}>
              <View style={[st.cardIconWrap, st.cardIconGreen]}>
                <Ionicons name="car" size={28} color="#fff" />
              </View>
              <Ionicons name="arrow-forward-circle" size={28} color="rgba(255,255,255,0.5)" />
            </View>
            <Text style={[st.cardTitle, { color: '#fff' }]}>Chauffeur</Text>
            <Text style={[st.cardDesc, { color: 'rgba(255,255,255,0.7)' }]}>Recevoir des courses · 0% commission</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
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
  subtitle: { fontSize: 14, color: COLORS.dim, marginTop: 8 },
  cards: { gap: 14 },
  card: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.line,
    borderRadius: 20, padding: 22,
  },
  cardGreen: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 16,
  },
  cardIconWrap: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center',
  },
  cardIconGreen: { backgroundColor: 'rgba(255,255,255,0.2)' },
  cardTitle: { fontSize: 20, fontWeight: '700', color: COLORS.white, marginBottom: 4 },
  cardDesc: { fontSize: 14, color: COLORS.dim },

  // ── Multi-step form ──
  formScroll: {
    flexGrow: 1, paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 40,
  },
  formTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 20,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.line,
  },
  stepCount: { fontSize: 13, fontWeight: '600', color: COLORS.dim },

  // Progress
  progressBar: {
    flexDirection: 'row', alignItems: 'center', gap: 0,
    marginBottom: 28, position: 'relative', height: 28,
    justifyContent: 'space-between', paddingHorizontal: 4,
  },
  progressLine: {
    position: 'absolute', left: 18, right: 18, top: 13,
    height: 2, backgroundColor: COLORS.dim2, borderRadius: 1, zIndex: 0,
  },
  progressFill: {
    height: '100%', backgroundColor: COLORS.green, borderRadius: 1,
  },
  progressDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.card, borderWidth: 2, borderColor: COLORS.dim2,
    alignItems: 'center', justifyContent: 'center', zIndex: 1,
  },
  progressDotActive: {
    backgroundColor: COLORS.green, borderColor: COLORS.green,
  },

  // Step header
  stepHeader: { marginBottom: 24 },
  formTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white, marginBottom: 6 },
  formSubtitle: { fontSize: 14, color: COLORS.dim, lineHeight: 20 },

  // Fields
  fields: { gap: 16, marginBottom: 28 },
  row: { flexDirection: 'row', gap: 12 },
  inputGroup: { marginBottom: 0 },
  inputLabel: {
    fontSize: 12, fontWeight: '700', color: COLORS.dim,
    marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  input: {
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.line,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: COLORS.white,
  },
  inputHint: {
    fontSize: 11, color: COLORS.dim, marginTop: 6, lineHeight: 16,
  },

  // Color chips
  colorGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
  },
  colorChip: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.line,
  },
  colorChipActive: {
    backgroundColor: COLORS.green, borderColor: COLORS.green,
  },
  colorChipTxt: { fontSize: 13, fontWeight: '600', color: COLORS.dim },
  colorChipTxtActive: { color: '#fff' },

  // Zone chips
  zoneGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  zoneChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.line,
  },
  zoneChipActive: { backgroundColor: COLORS.green, borderColor: COLORS.green },
  zoneChipTxt: { fontSize: 13, fontWeight: '600', color: COLORS.dim },
  zoneChipTxtActive: { color: '#fff' },

  // Documents list
  docList: {
    backgroundColor: COLORS.card, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.line, padding: 16,
  },
  docListTitle: {
    fontSize: 13, fontWeight: '700', color: COLORS.white, marginBottom: 12,
  },
  docItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.line,
  },
  docItemTxt: { fontSize: 13, color: COLORS.dim, flex: 1 },
  docDivider: { height: 1, backgroundColor: COLORS.line, marginVertical: 10 },

  // Info box
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderWidth: 1, borderColor: 'rgba(34,197,94,0.15)',
    borderRadius: 12, padding: 14,
  },
  infoText: { flex: 1, fontSize: 13, color: COLORS.green, lineHeight: 20 },

  // Submit
  submitBtn: {
    backgroundColor: COLORS.green, borderRadius: 14,
    paddingVertical: 17, alignItems: 'center',
  },
  submitInner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  submitTxt: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
