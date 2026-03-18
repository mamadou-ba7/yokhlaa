import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Animated, Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants/theme';
import GreenButton from '../components/GreenButton';
import StatCard from '../components/StatCard';
import StepItem from '../components/StepItem';
import FeatureCard from '../components/FeatureCard';

const { width } = Dimensions.get('window');

const STEPS = [
  { num: '01', title: 'Inscrivez-vous en 2 minutes', desc: 'Remplissez le formulaire, transmettez votre permis et carte grise. Validation en 24h.' },
  { num: '02', title: "Payez l'abonnement fixe", desc: '18 500 FCFA par mois via Wave ou Orange Money. Aucun frais caché.' },
  { num: '03', title: "Recevez des courses sur l'app", desc: 'Connectez-vous et recevez des demandes en temps réel dans votre zone.' },
  { num: '04', title: '100% de vos revenus', desc: 'Chaque franc payé par le passager vous revient intégralement.' },
];

export default function HomeScreen({ navigation }) {
  const [activeStep, setActiveStep] = useState(0);
  const [count, setCount] = useState(147);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();

    const interval = setInterval(() => {
      setActiveStep(prev => (prev + 1) % 4);
    }, 4200);

    const countInterval = setInterval(() => {
      if (Math.random() < 0.3) setCount(prev => prev + 1);
    }, 8000);

    return () => { clearInterval(interval); clearInterval(countInterval); };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* HERO */}
        <Animated.View style={[styles.hero, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.eyebrow}>
            <View style={styles.eyebrowDot} />
            <Text style={styles.eyebrowText}>DAKAR 2026 · BIENTOT DISPONIBLE</Text>
          </View>

          <Text style={styles.heroTitle}>
            Transport{'\n'}
            <Text style={styles.heroGreen}>sans commission</Text>
          </Text>
          <Text style={styles.heroMuted}>100% senegalais · iOS + Android</Text>

          <Text style={styles.heroPara}>
            Yokh Laa connecte chauffeurs et passagers a Dakar.{' '}
            <Text style={{ color: COLORS.white, fontWeight: '500' }}>0% de commission sur chaque course.</Text>
            {' '}Chaque franc gagne vous appartient.
          </Text>

          <View style={styles.ctas}>
            <GreenButton
              title="Je suis chauffeur"
              onPress={() => navigation.navigate('RoleSelect')}
              style={{ flex: 1 }}
            />
            <GreenButton
              title="Je suis passager"
              onPress={() => navigation.navigate('PassengerMain')}
              outline
              style={{ flex: 1 }}
            />
          </View>

          <View style={styles.proof}>
            <View style={styles.avatars}>
              {['MD', 'AB', 'FD', '+'].map((a, i) => (
                <View key={i} style={[styles.av, i > 0 && { marginLeft: -8 }]}>
                  <Text style={styles.avText}>{a}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.proofText}>
              <Text style={{ color: COLORS.white, fontWeight: '700' }}>{count}</Text> chauffeurs inscrits
            </Text>
          </View>
        </Animated.View>

        {/* PHONE MOCKUP */}
        <View style={styles.phoneMockup}>
          <View style={styles.phone}>
            <View style={styles.phoneNotch} />
            <View style={styles.phoneScreen}>
              <View style={styles.phoneBar}>
                <Text style={styles.phoneTime}>9:41</Text>
                <Ionicons name="cellular" size={12} color={COLORS.white} />
              </View>
              <View style={styles.phoneMap}>
                <View style={styles.mapGrid} />
                <View style={[styles.pin, styles.pinGreen]} />
                <View style={[styles.pin, styles.pinWhite]} />
              </View>
              <View style={styles.phoneDest}>
                <View style={styles.phoneDestIcon}>
                  <Ionicons name="location" size={14} color={COLORS.green} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.phoneLabel}>DESTINATION</Text>
                  <Text style={styles.phoneValue}>Plateau, Dakar</Text>
                </View>
                <Text style={styles.phonePrice}>2 500 F</Text>
              </View>
              <View style={styles.phoneDriver}>
                <View style={styles.phoneAvatar}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.green }}>M</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.phoneDName}>Mamadou · Toyota Corolla</Text>
                  <Text style={styles.phoneStars}>★★★★★ 4.9</Text>
                </View>
                <View style={styles.phoneStatus}>
                  <Text style={styles.phoneStatusText}>En route</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* STATS */}
        <View style={styles.statsBar}>
          <View style={styles.statsRow}>
            <StatCard value="0%" label="Commission" green />
            <StatCard value="18 500" label="FCFA / mois" green />
          </View>
          <View style={styles.statsRow}>
            <StatCard value="3,4 M" label="Habitants Dakar" />
            <StatCard value="2026" label="Lancement" />
          </View>
        </View>

        {/* HOW IT WORKS */}
        <View style={styles.section}>
          <Text style={styles.sTag}>POUR LES CHAUFFEURS</Text>
          <Text style={styles.sTitle}>Travaillez pour vous,{'\n'}pas pour une plateforme.</Text>
          <Text style={styles.sPara}>
            Fini les commissions qui grignotent votre revenu. Un abonnement fixe, et vous gardez le reste.
          </Text>

          <View style={styles.stepsList}>
            {STEPS.map((s, i) => (
              <StepItem
                key={i}
                number={s.num}
                title={s.title}
                description={s.desc}
                active={activeStep === i}
                onPress={() => setActiveStep(i)}
              />
            ))}
          </View>
        </View>

        {/* AIBD */}
        <View style={[styles.section, { backgroundColor: COLORS.ink, marginHorizontal: -SIZES.padding, paddingHorizontal: SIZES.padding }]}>
          <Text style={[styles.sTag, { textAlign: 'center' }]}>NOUVEAU SERVICE</Text>
          <Text style={[styles.sTitle, { textAlign: 'center' }]}>
            Dakar <Text style={{ color: COLORS.green }}>↔</Text> AIBD
          </Text>
          <Text style={[styles.sPara, { textAlign: 'center', alignSelf: 'center' }]}>
            Reservez votre transfert aeroport a l'avance. Chauffeur confirme, ponctualite garantie.
          </Text>

          <View style={styles.featureCards}>
            <FeatureCard
              icon="time-outline"
              title="Reservation a l'avance"
              description="Planifiez votre trajet jusqu'a 24h a l'avance. Chauffeur confirme avant votre depart."
              badge="Confirmation garantie"
            />
            <FeatureCard
              icon="shield-checkmark-outline"
              title="Zero stress"
              description="Si votre chauffeur est indisponible, un remplacant est automatiquement assigne."
              badge="Backup automatique"
              accent
            />
            <FeatureCard
              icon="airplane-outline"
              title="Dakar ↔ AIBD direct"
              description="Prise en charge depuis tous les quartiers de Dakar. Prix fixe, sans surprise."
              badge="Prix fixe"
            />
          </View>

          {/* Steps AIBD */}
          <View style={styles.aibdSteps}>
            {['Reservez', 'Confirmation', 'Voyagez serein', 'Payez a bord'].map((s, i) => (
              <View key={i} style={styles.aibdStep}>
                <Text style={styles.aibdNum}>0{i + 1}</Text>
                <Text style={styles.aibdLabel}>{s}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* REGIONS */}
        <View style={styles.section}>
          <View style={styles.soonBadge}>
            <View style={styles.soonDot} />
            <Text style={styles.soonText}>BIENTOT DISPONIBLE</Text>
          </View>
          <Text style={styles.sTitle}>
            Dakar <Text style={{ color: COLORS.green }}>→</Text> Regions
          </Text>
          <Text style={styles.sPara}>
            Thies, Saint-Louis, Ziguinchor, Kaolack, Touba — les navettes interurbaines arrivent sur Yokh Laa.
          </Text>

          {['Departs planifies depuis Dakar', 'Prix fixe par trajet', 'Chauffeurs verifies longue distance', 'Wave et Orange Money acceptes'].map((f, i) => (
            <View key={i} style={styles.regionFeat}>
              <View style={styles.regionDot} />
              <Text style={styles.regionText}>{f}</Text>
            </View>
          ))}

          <GreenButton
            title="Etre notifie au lancement"
            onPress={() => navigation.navigate('Signup', { role: 'driver' })}
            outline
            style={{ marginTop: 24, alignSelf: 'flex-start' }}
          />
        </View>

        {/* COMPARE */}
        <View style={[styles.section, { backgroundColor: COLORS.surface, marginHorizontal: -SIZES.padding, paddingHorizontal: SIZES.padding }]}>
          <Text style={[styles.sTag, { textAlign: 'center' }]}>COMPARAISON</Text>
          <Text style={[styles.sTitle, { textAlign: 'center' }]}>
            Pourquoi Yokh Laa ?
          </Text>

          <View style={styles.compareCards}>
            {/* Competitor */}
            <View style={[styles.ccard, styles.ccardBad]}>
              <Text style={styles.ccBrand}>Concurrent classique</Text>
              <Text style={[styles.ccName, { color: COLORS.red }]}>−25%</Text>
              <View style={styles.ccRow}><Text style={styles.ccK}>Commission</Text><Text style={[styles.ccV, { color: COLORS.red }]}>25%</Text></View>
              <View style={styles.ccRow}><Text style={styles.ccK}>Revenus 150k</Text><Text style={[styles.ccV, { color: COLORS.red }]}>112 500 F</Text></View>
              <View style={styles.ccRow}><Text style={styles.ccK}>Frais caches</Text><Text style={[styles.ccV, { color: COLORS.red }]}>Oui</Text></View>
            </View>

            {/* Yokh Laa */}
            <View style={[styles.ccard, styles.ccardGood]}>
              <View style={styles.recommendBadge}>
                <Text style={styles.recommendText}>Recommande</Text>
              </View>
              <Text style={styles.ccBrand}>Yokh Laa</Text>
              <Text style={[styles.ccName, { color: COLORS.green }]}>0%</Text>
              <View style={styles.ccRow}><Text style={styles.ccK}>Commission</Text><Text style={[styles.ccV, { color: COLORS.green }]}>0%</Text></View>
              <View style={styles.ccRow}><Text style={styles.ccK}>Revenus 150k</Text><Text style={[styles.ccV, { color: COLORS.green }]}>131 500 F</Text></View>
              <View style={styles.ccRow}><Text style={styles.ccK}>Frais caches</Text><Text style={[styles.ccV, { color: COLORS.green }]}>Non</Text></View>
            </View>
          </View>
        </View>

        {/* CTA BOTTOM */}
        <View style={styles.ctaBottom}>
          <Text style={[styles.sTitle, { textAlign: 'center', marginBottom: 8 }]}>
            Soyez parmi{'\n'}les premiers.
          </Text>
          <Text style={[styles.sPara, { textAlign: 'center', marginBottom: 24 }]}>
            Les 50 premiers chauffeurs inscrits beneficient du premier mois offert.
          </Text>
          <GreenButton
            title="Rejoindre la liste d'attente"
            onPress={() => navigation.navigate('Signup', { role: 'driver' })}
          />
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerLogo}>
            Yokh<Text style={{ color: COLORS.green }}>Laa</Text>
          </Text>
          <Text style={styles.footerDesc}>
            L'application de transport dakarois sans commission. Concue et developpee au Senegal.
          </Text>
          <View style={styles.footerLinks}>
            <Text style={styles.footerLink} onPress={() => navigation.navigate('FAQ')}>FAQ</Text>
            <Text style={styles.footerLink}>contact@yokhla.com</Text>
          </View>
          <Text style={styles.footerCopy}>© 2026 Yokh Laa · Dakar, Senegal</Text>
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
    paddingHorizontal: SIZES.padding,
  },

  // HERO
  hero: {
    paddingTop: 70,
    paddingBottom: 32,
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.25)',
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  eyebrowDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: COLORS.green,
  },
  eyebrowText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: COLORS.green,
  },
  heroTitle: {
    fontSize: 44,
    fontWeight: '800',
    color: COLORS.white,
    lineHeight: 44,
    letterSpacing: -2,
    marginBottom: 8,
  },
  heroGreen: {
    color: COLORS.green,
  },
  heroMuted: {
    fontSize: 16,
    color: COLORS.dim,
    fontWeight: '600',
    marginBottom: 18,
  },
  heroPara: {
    fontSize: 15,
    color: COLORS.dim,
    lineHeight: 24,
    marginBottom: 28,
  },
  ctas: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  proof: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatars: {
    flexDirection: 'row',
  },
  av: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: COLORS.card2,
    borderWidth: 2,
    borderColor: COLORS.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.green,
  },
  proofText: {
    fontSize: 13,
    color: COLORS.dim,
  },

  // PHONE MOCKUP
  phoneMockup: {
    alignItems: 'center',
    marginBottom: 32,
  },
  phone: {
    width: 220,
    backgroundColor: COLORS.card,
    borderRadius: 36,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.09)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 40 },
    shadowOpacity: 0.8,
    shadowRadius: 60,
    elevation: 20,
  },
  phoneNotch: {
    width: 70, height: 20,
    backgroundColor: COLORS.black,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    alignSelf: 'center',
  },
  phoneScreen: {
    padding: 10,
    paddingBottom: 16,
    backgroundColor: COLORS.ink,
  },
  phoneBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  phoneTime: {
    fontSize: 11, fontWeight: '700', color: COLORS.white,
  },
  phoneMap: {
    height: 160,
    borderRadius: 12,
    backgroundColor: '#0B0D10',
    marginBottom: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  mapGrid: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  pin: {
    position: 'absolute',
    width: 12, height: 12,
    borderRadius: 6,
  },
  pinGreen: {
    backgroundColor: COLORS.green,
    bottom: '36%', left: '26%',
    shadowColor: COLORS.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  pinWhite: {
    backgroundColor: COLORS.white,
    top: '22%', right: '22%',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  phoneDest: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  phoneDestIcon: {
    width: 26, height: 26, borderRadius: 7,
    backgroundColor: COLORS.greenLight,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneLabel: {
    fontSize: 7, color: COLORS.dim, textTransform: 'uppercase', letterSpacing: 1,
  },
  phoneValue: {
    fontSize: 10, fontWeight: '600', color: COLORS.white,
  },
  phonePrice: {
    fontSize: 12, fontWeight: '700', color: COLORS.green,
  },
  phoneDriver: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.greenLight,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.18)',
    borderRadius: 10,
    padding: 8,
  },
  phoneAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(26,42,26,1)',
    borderWidth: 1.5,
    borderColor: 'rgba(34,197,94,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneDName: {
    fontSize: 9, fontWeight: '600', color: COLORS.white,
  },
  phoneStars: {
    fontSize: 7, color: COLORS.dim,
  },
  phoneStatus: {
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.2)',
    borderRadius: 5,
    paddingVertical: 3,
    paddingHorizontal: 7,
  },
  phoneStatusText: {
    fontSize: 7, fontWeight: '700', color: COLORS.green,
  },

  // STATS
  statsBar: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },

  // SECTIONS
  section: {
    paddingVertical: 48,
  },
  sTag: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: COLORS.green,
    marginBottom: 12,
  },
  sTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -1.5,
    lineHeight: 34,
    marginBottom: 12,
  },
  sPara: {
    fontSize: 15,
    color: COLORS.dim,
    lineHeight: 24,
    maxWidth: 500,
  },
  stepsList: {
    marginTop: 28,
    paddingLeft: 16,
  },

  // FEATURES
  featureCards: {
    gap: 14,
    marginTop: 32,
    marginBottom: 32,
  },

  // AIBD Steps
  aibdSteps: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  aibdStep: {
    width: '45%',
    gap: 4,
  },
  aibdNum: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.green,
    letterSpacing: -1,
  },
  aibdLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },

  // REGIONS
  soonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  soonDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: COLORS.green,
  },
  soonText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.5,
    color: COLORS.green,
  },
  regionFeat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  regionDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: COLORS.green,
  },
  regionText: {
    fontSize: 14,
    color: COLORS.dim,
  },

  // COMPARE
  compareCards: {
    gap: 14,
    marginTop: 32,
  },
  ccard: {
    borderRadius: 20,
    padding: 24,
    position: 'relative',
  },
  ccardBad: {
    backgroundColor: 'rgba(239,68,68,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.12)',
  },
  ccardGood: {
    backgroundColor: 'rgba(34,197,94,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.18)',
  },
  recommendBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.25)',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  recommendText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.green,
  },
  ccBrand: {
    fontSize: 12, color: COLORS.dim, fontWeight: '500', marginBottom: 4,
  },
  ccName: {
    fontSize: 24, fontWeight: '800', marginBottom: 16,
  },
  ccRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  ccK: {
    fontSize: 13, color: COLORS.dim,
  },
  ccV: {
    fontSize: 13, fontWeight: '600',
  },

  // CTA BOTTOM
  ctaBottom: {
    paddingVertical: 56,
    alignItems: 'center',
  },

  // FOOTER
  footer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    paddingVertical: 32,
    alignItems: 'center',
  },
  footerLogo: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 10,
  },
  footerDesc: {
    fontSize: 13,
    color: COLORS.dim,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    maxWidth: 260,
  },
  footerLinks: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
  },
  footerLink: {
    fontSize: 13,
    color: COLORS.dim,
  },
  footerCopy: {
    fontSize: 12,
    color: COLORS.dim2,
  },
});
