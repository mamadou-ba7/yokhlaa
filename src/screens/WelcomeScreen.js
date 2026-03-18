import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { useAuth } from '../lib/AuthContext';
import { tapLight } from '../lib/haptics';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  const { enterGuestMode } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const btnAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(btnAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Background map effect */}
      <View style={styles.bgMap}>
        {Array.from({ length: 15 }).map((_, i) => (
          <View key={`h${i}`} style={[styles.gridLine, styles.gridH, { top: `${(i + 1) * 6.5}%` }]} />
        ))}
        {Array.from({ length: 10 }).map((_, i) => (
          <View key={`v${i}`} style={[styles.gridLine, styles.gridV, { left: `${(i + 1) * 10}%` }]} />
        ))}
        <View style={[styles.road, { top: '30%', left: 0, right: 0, height: 2 }]} />
        <View style={[styles.road, { top: '55%', left: 0, right: 0, height: 2 }]} />
        <View style={[styles.road, { top: '75%', left: 0, right: 0, height: 2 }]} />
        <View style={[styles.road, { left: '25%', top: 0, bottom: 0, width: 2 }]} />
        <View style={[styles.road, { left: '60%', top: 0, bottom: 0, width: 2 }]} />
        <View style={[styles.road, { left: '80%', top: 0, bottom: 0, width: 2 }]} />

        {/* Animated dots simulating cars */}
        <View style={[styles.carDot, { top: '30%', left: '35%' }]} />
        <View style={[styles.carDot, styles.carDotGreen, { top: '55%', left: '55%' }]} />
        <View style={[styles.carDot, { top: '75%', left: '20%' }]} />

        {/* Gradient overlay */}
        <View style={styles.bgOverlay} />
        <View style={styles.bgOverlayBottom} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Animated.View style={[styles.topSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Ionicons name="car-sport" size={28} color="#fff" />
            </View>
            <Text style={styles.logo}>
              Yokh<Text style={styles.logoGreen}>Laa</Text>
            </Text>
          </View>
          <Text style={styles.tagline}>
            Transport sans commission
          </Text>
          <Text style={styles.subtitle}>Dakar, Senegal</Text>
        </Animated.View>

        <Animated.View style={[styles.bottomSection, { opacity: btnAnim }]}>
          <View style={styles.features}>
            <View style={styles.featureRow}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>0% de commission pour les chauffeurs</Text>
            </View>
            <View style={styles.featureRow}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>Prix transparents pour les passagers</Text>
            </View>
            <View style={styles.featureRow}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>100% senegalais</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.mainBtn}
            onPress={() => { tapLight(); navigation.navigate('Login'); }}
            activeOpacity={0.85}
          >
            <Text style={styles.mainBtnText}>Se connecter</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondBtn}
            onPress={() => { tapLight(); enterGuestMode(); }}
            activeOpacity={0.7}
          >
            <Text style={styles.secondBtnText}>Continuer sans compte</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },

  // Background
  bgMap: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  gridLine: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.025)' },
  gridH: { left: 0, right: 0, height: 1 },
  gridV: { top: 0, bottom: 0, width: 1 },
  road: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.05)' },
  carDot: {
    position: 'absolute',
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  carDotGreen: {
    backgroundColor: COLORS.green,
    width: 8, height: 8, borderRadius: 4,
    shadowColor: COLORS.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  bgOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, height: '40%',
    backgroundColor: COLORS.black,
    opacity: 0.85,
  },
  bgOverlayBottom: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0, height: '50%',
    backgroundColor: COLORS.black,
    opacity: 0.95,
  },

  // Content
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: height * 0.18,
    paddingBottom: 48,
    zIndex: 10,
  },
  topSection: {
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoIcon: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: COLORS.green,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    shadowColor: COLORS.green,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  logo: {
    fontSize: 42, fontWeight: '800', color: COLORS.white, letterSpacing: -1,
  },
  logoGreen: {
    color: COLORS.green,
  },
  tagline: {
    fontSize: 17, fontWeight: '600', color: COLORS.white, textAlign: 'center',
  },
  subtitle: {
    fontSize: 14, color: COLORS.dim, marginTop: 6,
  },

  // Bottom
  bottomSection: {},
  features: {
    marginBottom: 32,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  featureDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: COLORS.green,
  },
  featureText: {
    fontSize: 14, color: COLORS.dim,
  },
  mainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.green,
    borderRadius: 14,
    paddingVertical: 18,
    marginBottom: 14,
    shadowColor: COLORS.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  mainBtnText: {
    fontSize: 17, fontWeight: '700', color: '#fff',
  },
  secondBtn: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  secondBtnText: {
    fontSize: 15, color: COLORS.dim, textDecorationLine: 'underline',
  },
});
