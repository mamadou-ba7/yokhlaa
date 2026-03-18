import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SIZES } from '../constants/theme';
import FAQItem from '../components/FAQItem';

const FAQS = [
  {
    q: "Combien coute l'abonnement ?",
    a: "18 500 FCFA par mois, payable via Wave ou Orange Money. C'est le seul frais. Aucune commission sur les courses, aucun frais cache.",
  },
  {
    q: "Quand l'app sera disponible ?",
    a: "Lancement prevu en 2026 sur App Store et Google Play. Les inscrits en liste d'attente seront notifies en premier, avec acces prioritaire.",
  },
  {
    q: 'Le premier mois est-il gratuit ?',
    a: "Oui. Les 50 premiers chauffeurs inscrits beneficient du premier mois d'abonnement entierement offert.",
  },
  {
    q: 'Quelles zones sont couvertes ?',
    a: "Au lancement : Plateau, Medina, Parcelles Assainies, Almadies. Expansion rapide vers Pikine, Guediawaye, puis Thies et Saint-Louis.",
  },
  {
    q: 'Comment les passagers paient-ils ?',
    a: "Les passagers paient directement le chauffeur via Wave, Orange Money ou en especes. Yokh Laa ne prend aucune commission sur ces transactions.",
  },
  {
    q: 'Puis-je me desabonner a tout moment ?',
    a: "Oui, sans preavis et sans frais. L'abonnement est mensuel. Si vous ne renouvelez pas, votre compte est suspendu jusqu'au prochain paiement.",
  },
];

export default function FAQScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.tag}>FAQ</Text>
        <Text style={styles.title}>Questions frequentes</Text>
        <Text style={styles.subtitle}>
          Tout ce que vous devez savoir sur Yokh Laa.
        </Text>

        <View style={styles.faqList}>
          {FAQS.map((f, i) => (
            <FAQItem key={i} question={f.q} answer={f.a} />
          ))}
        </View>

        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Encore des questions ?</Text>
          <Text style={styles.contactText}>
            Ecrivez-nous a contact@yokhla.com ou sur WhatsApp.
          </Text>
        </View>
      </ScrollView>
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
  tag: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.5,
    color: COLORS.green,
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -1.5,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.dim,
    lineHeight: 24,
    marginBottom: 28,
  },
  faqList: {
    gap: 0,
  },
  contactCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 32,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: COLORS.dim,
    textAlign: 'center',
    lineHeight: 22,
  },
});
