import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, Linking, Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

const WHATSAPP_NUMBER = '+221781234567'; // TODO: Replace with real number
const EMAIL = 'support@yokhlaa.com'; // TODO: Replace with real email

const FAQ = [
  { q: 'Comment fonctionne Yokh Laa ?', a: 'Yokh Laa connecte passagers et chauffeurs a Dakar. Les chauffeurs payent un abonnement fixe de 18 500 FCFA/mois et gardent 100% de leurs courses. Le paiement se fait directement entre vous et le chauffeur.' },
  { q: 'Quels sont les modes de paiement ?', a: 'Le paiement se fait directement au chauffeur en especes ou via mobile money (Wave, Orange Money). Yokh Laa ne prend aucune commission sur les courses.' },
  { q: 'Comment devenir chauffeur ?', a: 'Inscrivez-vous comme chauffeur, fournissez votre permis de conduire et carte grise. Apres verification, souscrivez a l\'abonnement mensuel et commencez a recevoir des courses.' },
  { q: 'Que faire en cas de probleme ?', a: 'Contactez-nous par WhatsApp ou email. Nous repondons dans les 24h. Votre securite est notre priorite.' },
  { q: 'Les prix sont-ils fixes ?', a: 'Les prix sont calcules en fonction de la distance et du type de vehicule choisi. Ils sont transparents et affiches avant la commande.' },
];

export default function HelpScreen({ navigation }) {
  const [open, setOpen] = useState(null);

  const openWhatsApp = async () => {
    const url = `https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=${encodeURIComponent('Bonjour, j\'ai besoin d\'aide avec Yokh Laa.')}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Erreur', 'WhatsApp n\'est pas installe sur votre appareil.');
      }
    } catch (e) {
      Alert.alert('Erreur', 'Impossible d\'ouvrir WhatsApp.');
    }
  };

  const openEmail = async () => {
    const url = `mailto:${EMAIL}?subject=${encodeURIComponent('Aide Yokh Laa')}&body=${encodeURIComponent('Bonjour,\n\nJ\'ai besoin d\'aide avec:\n')}`;
    try {
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible d\'ouvrir l\'application email.');
    }
  };

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Aide</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.sectionTitle}>Questions frequentes</Text>

        {FAQ.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={s.faqItem}
            onPress={() => setOpen(open === i ? null : i)}
            activeOpacity={0.7}
          >
            <View style={s.faqHeader}>
              <Text style={s.faqQ}>{item.q}</Text>
              <Ionicons name={open === i ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.dim} />
            </View>
            {open === i && <Text style={s.faqA}>{item.a}</Text>}
          </TouchableOpacity>
        ))}

        <View style={s.contactCard}>
          <Ionicons name="chatbubbles" size={24} color={COLORS.green} />
          <Text style={s.contactTitle}>Besoin d'aide ?</Text>
          <Text style={s.contactDesc}>Contactez notre equipe</Text>
          <View style={s.contactBtns}>
            <TouchableOpacity style={s.contactBtn} onPress={openWhatsApp}>
              <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
              <Text style={s.contactBtnTxt}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.contactBtn} onPress={openEmail}>
              <Ionicons name="mail" size={18} color="#4A90FF" />
              <Text style={s.contactBtnTxt}>Email</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.line,
  },
  back: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.white },
  content: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.white, marginBottom: 16 },
  faqItem: {
    backgroundColor: COLORS.card, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.line,
    padding: 16, marginBottom: 10,
  },
  faqHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  faqQ: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.white, marginRight: 10 },
  faqA: { fontSize: 13, color: COLORS.dim, lineHeight: 20, marginTop: 10 },
  contactCard: {
    backgroundColor: COLORS.card, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.line,
    padding: 24, alignItems: 'center', marginTop: 10,
  },
  contactTitle: { fontSize: 16, fontWeight: '700', color: COLORS.white, marginTop: 10, marginBottom: 4 },
  contactDesc: { fontSize: 13, color: COLORS.dim, marginBottom: 16 },
  contactBtns: { flexDirection: 'row', gap: 12 },
  contactBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.surface, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 18,
    borderWidth: 1, borderColor: COLORS.line,
  },
  contactBtnTxt: { fontSize: 13, fontWeight: '600', color: COLORS.white },
});
