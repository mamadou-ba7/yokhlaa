import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { tapLight } from '../../lib/haptics';

const SECTIONS = [
  {
    title: '1. Objet',
    text: `Les presentes conditions generales d'utilisation (CGU) regissent l'utilisation de l'application mobile Yokh Laa, editee et exploitee au Senegal.

Yokh Laa est une plateforme de mise en relation entre des passagers et des chauffeurs independants pour des services de transport prive dans la region de Dakar.`,
  },
  {
    title: '2. Inscription et compte',
    text: `Pour utiliser Yokh Laa, vous devez :
- Etre age d'au moins 18 ans
- Disposer d'un numero de telephone senegalais (+221)
- Fournir des informations exactes lors de l'inscription

Votre compte est personnel et non transferable. Vous etes responsable de la securite de votre compte et de toutes les activites effectuees sous votre identifiant.`,
  },
  {
    title: '3. Services proposes',
    text: `Yokh Laa propose :
- Un service de mise en relation entre passagers et chauffeurs
- Trois classes de vehicules : Start, Confort, Premium
- Un systeme de paiement en especes, Wave ou Orange Money
- Un chat in-app entre passager et chauffeur pendant la course
- Un systeme de suivi en temps reel et de partage de course

Yokh Laa n'est pas une entreprise de transport. Les chauffeurs sont des prestataires independants.`,
  },
  {
    title: '4. Tarification',
    text: `Pour les passagers :
- Le prix est calcule selon la distance (500 FCFA de base + 400 FCFA/km)
- Le prix peut varier selon la classe choisie et les conditions de trafic
- Le prix affiche avant la commande est un estimatif

Pour les chauffeurs :
- Abonnement mensuel fixe de 18 500 FCFA
- 0% de commission sur les courses effectuees
- L'abonnement n'est pas remboursable une fois active`,
  },
  {
    title: '5. Obligations des passagers',
    text: `En tant que passager, vous vous engagez a :
- Etre present au point de prise en charge a l'heure convenue
- Adopter un comportement respectueux envers le chauffeur
- Payer le montant de la course a la fin du trajet
- Ne pas transporter de substances illicites ou dangereuses
- Ne pas demander au chauffeur d'enfreindre le code de la route
- Signaler tout incident via l'application`,
  },
  {
    title: '6. Obligations des chauffeurs',
    text: `En tant que chauffeur, vous vous engagez a :
- Disposer d'un permis de conduire valide (categorie B minimum)
- Disposer d'une assurance vehicule en cours de validite
- Maintenir votre vehicule en bon etat de fonctionnement
- Respecter le code de la route senegalais
- Adopter un comportement professionnel et respectueux
- Maintenir un abonnement actif pour recevoir des courses
- Fournir les documents requis (CNI, permis, carte grise, assurance)`,
  },
  {
    title: '7. Annulations',
    text: `Passagers :
- Annulation gratuite avant l'arrivee du chauffeur
- Annulations repetitives peuvent entrainer une suspension du compte

Chauffeurs :
- Peuvent refuser une course avant de l'accepter
- Ne doivent pas annuler une course deja acceptee sans motif valable
- Un taux d'annulation eleve peut entrainer une suspension`,
  },
  {
    title: '8. Notation et avis',
    text: `Apres chaque course, passagers et chauffeurs peuvent se noter mutuellement (1 a 5 etoiles). Les notes sont anonymes.

Un chauffeur dont la note moyenne descend en dessous de 3.5 pourra faire l'objet d'un avertissement ou d'une suspension.

Les avis frauduleux ou abusifs sont interdits et peuvent entrainer la suspension du compte.`,
  },
  {
    title: '9. Securite',
    text: `Yokh Laa met en place les mesures suivantes :
- Verification d'identite des chauffeurs (CNI, permis)
- Bouton SOS accessible pendant toute la duree de la course
- Partage de course en temps reel avec un proche
- Verification aleatoire de l'identite du chauffeur pendant les courses
- Systeme de signalement des comportements inappropries

En cas d'urgence, contactez les autorites locales (Police : 17).`,
  },
  {
    title: '10. Donnees personnelles',
    text: `Yokh Laa collecte et traite vos donnees conformement a sa Politique de Confidentialite et a la loi senegalaise n° 2008-12 sur la protection des donnees a caractere personnel.

Voir notre Politique de Confidentialite pour plus de details.`,
  },
  {
    title: '11. Responsabilite',
    text: `Yokh Laa agit en tant qu'intermediaire technique. En consequence :
- Yokh Laa n'est pas responsable des actes des chauffeurs ou des passagers
- Yokh Laa n'est pas responsable des retards lies au trafic
- Yokh Laa n'est pas responsable de la perte d'objets dans les vehicules
- Yokh Laa fait ses meilleurs efforts pour assurer la disponibilite du service

Toute reclamation doit etre addressee dans un delai de 7 jours apres l'incident.`,
  },
  {
    title: '12. Suspension et resiliation',
    text: `Yokh Laa se reserve le droit de suspendre ou resilier un compte en cas de :
- Violation des presentes CGU
- Comportement dangereux ou inapproprie
- Fraude ou utilisation abusive de la plateforme
- Non-paiement de l'abonnement chauffeur
- Note moyenne inferieure a 3.0 sur 5`,
  },
  {
    title: '13. Modification des CGU',
    text: `Yokh Laa se reserve le droit de modifier les presentes CGU a tout moment. Les utilisateurs seront informes de toute modification par notification dans l'application.

L'utilisation continue de l'application apres modification vaut acceptation des nouvelles CGU.`,
  },
  {
    title: '14. Droit applicable',
    text: `Les presentes CGU sont regies par le droit senegalais. Tout litige sera soumis aux tribunaux competents de Dakar, Senegal.`,
  },
  {
    title: '15. Contact',
    text: `Pour toute question relative aux presentes CGU :
- Email : contact@yokhlaa.app
- WhatsApp : +221 XX XXX XX XX
- Adresse : Dakar, Senegal`,
  },
];

export default function TermsScreen({ navigation }) {
  return (
    <View style={s.container}>
      <StatusBar style="light" />

      <View style={s.header}>
        <TouchableOpacity onPress={() => { tapLight(); navigation.goBack(); }} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Conditions d'utilisation</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.lastUpdate}>Derniere mise a jour : 1er avril 2026</Text>

        {SECTIONS.map((section, i) => (
          <View key={i} style={s.section}>
            <Text style={s.sectionTitle}>{section.title}</Text>
            <Text style={s.sectionText}>{section.text}</Text>
          </View>
        ))}

        <View style={{ height: 40 }} />
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
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.white },
  content: { paddingHorizontal: 20 },
  lastUpdate: { color: COLORS.dim, fontSize: 12, marginBottom: 20, marginTop: 8 },
  section: { marginBottom: 20 },
  sectionTitle: { color: COLORS.white, fontSize: 16, fontWeight: '700', marginBottom: 8 },
  sectionText: { color: COLORS.dim, fontSize: 14, lineHeight: 22 },
});
