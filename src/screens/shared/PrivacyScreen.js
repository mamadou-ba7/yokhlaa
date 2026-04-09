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
    title: '1. Introduction',
    text: `Yokh Laa ("nous", "notre") s'engage a proteger la vie privee de ses utilisateurs ("vous", "votre"). La presente politique de confidentialite explique comment nous collectons, utilisons, stockons et protegeons vos donnees personnelles.

Cette politique est conforme a la loi senegalaise n° 2008-12 du 25 janvier 2008 sur la protection des donnees a caractere personnel et au reglement de la Commission de Protection des Donnees Personnelles (CDP) du Senegal.`,
  },
  {
    title: '2. Donnees collectees',
    text: `Nous collectons les types de donnees suivants :

Donnees d'identification :
- Numero de telephone (+221)
- Nom et prenom
- Photo de profil (optionnel)

Donnees de localisation :
- Position GPS en temps reel (pendant l'utilisation de l'app)
- Position GPS en arriere-plan (chauffeurs en mode "en ligne" uniquement)
- Historique des adresses recherchees

Donnees de course :
- Adresses de depart et d'arrivee
- Distance, duree, prix
- Historique des courses
- Notes et commentaires

Donnees de chauffeur (supplementaires) :
- Carte nationale d'identite (CNI)
- Permis de conduire
- Carte grise du vehicule
- Attestation d'assurance
- Photos du vehicule

Donnees techniques :
- Type d'appareil, systeme d'exploitation
- Token de notification push
- Adresse IP (logs serveur)`,
  },
  {
    title: '3. Utilisation des donnees',
    text: `Vos donnees sont utilisees pour :

- Creer et gerer votre compte utilisateur
- Vous mettre en relation avec des chauffeurs ou passagers
- Calculer les itineraires et estimer les prix
- Envoyer des notifications (courses, messages, alertes)
- Assurer la securite (verification d'identite, suivi en temps reel)
- Ameliorer nos services (statistiques anonymisees)
- Traiter les paiements d'abonnement
- Repondre a vos demandes de support
- Respecter nos obligations legales`,
  },
  {
    title: '4. Base legale du traitement',
    text: `Le traitement de vos donnees repose sur :

- Votre consentement (inscription, acceptation des CGU)
- L'execution du contrat de service (mise en relation, courses)
- Nos obligations legales (conservation des donnees, securite)
- Notre interet legitime (amelioration du service, prevention de la fraude)`,
  },
  {
    title: '5. Partage des donnees',
    text: `Vos donnees peuvent etre partagees avec :

- Les chauffeurs/passagers avec qui vous etes mis en relation (nom, position, note — pendant la course uniquement)
- Les proches avec qui vous partagez votre course (position en temps reel via lien de partage)
- Nos prestataires techniques :
  · Supabase (hebergement des donnees — serveurs securises)
  · Twilio (envoi de SMS — numero de telephone uniquement)
  · TomTom (calcul de trafic — coordonnees GPS anonymisees)
  · Expo (notifications push — token d'appareil uniquement)

Nous ne vendons jamais vos donnees a des tiers.
Nous ne partageons pas vos donnees a des fins publicitaires.`,
  },
  {
    title: '6. Stockage et securite',
    text: `Vos donnees sont :

- Stockees sur des serveurs securises (Supabase, chiffrement au repos)
- Protegees par des politiques de securite au niveau ligne (RLS)
- Accessibles uniquement par vous et les personnes autorisees
- Transmises via des connexions chiffrees (HTTPS/TLS)

Les tokens d'authentification sont stockes de maniere securisee sur votre appareil (Expo SecureStore, chiffrement materiel).

Les documents des chauffeurs (CNI, permis) sont stockes dans un espace de stockage prive et chiffre, accessible uniquement par l'equipe de verification.`,
  },
  {
    title: '7. Conservation des donnees',
    text: `Nous conservons vos donnees :

- Compte actif : tant que votre compte est actif
- Historique des courses : 2 ans apres la derniere course
- Documents chauffeur : duree de validite + 1 an
- Donnees de localisation : 30 jours (puis anonymisees)
- Messages chat : 90 jours apres la course
- Compte supprime : donnees effacees sous 30 jours (sauf obligations legales)`,
  },
  {
    title: '8. Vos droits',
    text: `Conformement a la loi senegalaise, vous disposez des droits suivants :

- Droit d'acces : consulter les donnees que nous detenons sur vous
- Droit de rectification : corriger vos donnees inexactes
- Droit de suppression : demander la suppression de vos donnees
- Droit d'opposition : refuser certains traitements
- Droit a la portabilite : recevoir vos donnees dans un format lisible
- Droit de retrait du consentement : retirer votre consentement a tout moment

Pour exercer ces droits, contactez-nous a : contact@yokhlaa.app

Nous repondrons dans un delai maximum de 30 jours.`,
  },
  {
    title: '9. Localisation et GPS',
    text: `Passagers :
- Votre position est collectee uniquement quand l'app est ouverte
- Elle sert a trouver des chauffeurs proches et calculer les itineraires
- Vous pouvez desactiver la localisation dans les parametres de votre telephone

Chauffeurs :
- Votre position est collectee en arriere-plan quand vous etes "en ligne"
- Elle sert a vous rendre visible aux passagers et calculer les temps d'arrivee
- La collecte s'arrete immediatement quand vous passez "hors ligne"
- Les mises a jour sont effectuees toutes les 5 secondes en mode actif`,
  },
  {
    title: '10. Notifications',
    text: `Nous envoyons des notifications push pour :
- Nouvelles courses disponibles (chauffeurs)
- Statut de votre course (passagers)
- Messages du chat
- Alertes de securite

Vous pouvez desactiver les notifications dans les parametres de votre telephone a tout moment.`,
  },
  {
    title: '11. Mineurs',
    text: `Yokh Laa est reserve aux personnes agees de 18 ans et plus. Nous ne collectons pas sciemment de donnees concernant des mineurs. Si nous decouvrons qu'un mineur a cree un compte, celui-ci sera immediatement supprime.`,
  },
  {
    title: '12. Modifications',
    text: `Nous nous reservons le droit de modifier cette politique de confidentialite. En cas de modification substantielle, vous serez informe par notification dans l'application.

La date de derniere mise a jour est indiquee en haut de cette page.`,
  },
  {
    title: '13. Autorite de controle',
    text: `Pour toute reclamation relative au traitement de vos donnees, vous pouvez contacter :

Commission de Protection des Donnees Personnelles (CDP)
Autorite de protection des donnees du Senegal
Site : www.cdp.sn`,
  },
  {
    title: '14. Contact',
    text: `Pour toute question relative a cette politique :

- Email : contact@yokhlaa.app
- WhatsApp : +221 XX XXX XX XX
- Adresse : Dakar, Senegal`,
  },
];

export default function PrivacyScreen({ navigation }) {
  return (
    <View style={s.container}>
      <StatusBar style="light" />

      <View style={s.header}>
        <TouchableOpacity onPress={() => { tapLight(); navigation.goBack(); }} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Politique de confidentialite</Text>
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
  headerTitle: { fontSize: 15, fontWeight: '700', color: COLORS.white },
  content: { paddingHorizontal: 20 },
  lastUpdate: { color: COLORS.dim, fontSize: 12, marginBottom: 20, marginTop: 8 },
  section: { marginBottom: 20 },
  sectionTitle: { color: COLORS.white, fontSize: 16, fontWeight: '700', marginBottom: 8 },
  sectionText: { color: COLORS.dim, fontSize: 14, lineHeight: 22 },
});
