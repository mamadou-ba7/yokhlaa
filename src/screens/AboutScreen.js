import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

export default function AboutScreen({ navigation }) {
  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>A propos</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <View style={s.logo}>
          <Text style={s.logoIcon}>Y</Text>
        </View>
        <Text style={s.appName}>Yokh<Text style={{ color: COLORS.green }}>Laa</Text></Text>
        <Text style={s.version}>Version 1.0.0</Text>
        <Text style={s.tagline}>Transport sans commission — Dakar, Senegal</Text>

        <View style={s.card}>
          <View style={s.row}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.green} />
            <Text style={s.rowTxt}>0% de commission pour les chauffeurs</Text>
          </View>
          <View style={s.row}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.green} />
            <Text style={s.rowTxt}>Abonnement fixe : 18 500 FCFA / mois</Text>
          </View>
          <View style={s.row}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.green} />
            <Text style={s.rowTxt}>Prix transparents pour les passagers</Text>
          </View>
          <View style={s.row}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.green} />
            <Text style={s.rowTxt}>100% senegalais</Text>
          </View>
        </View>

        <Text style={s.footer}>Fait avec amour a Dakar</Text>
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
  content: { alignItems: 'center', padding: 30 },
  logo: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: COLORS.green,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  logoIcon: { fontSize: 36, fontWeight: '900', color: '#fff' },
  appName: { fontSize: 28, fontWeight: '900', color: COLORS.white, marginBottom: 4 },
  version: { fontSize: 13, color: COLORS.dim, marginBottom: 8 },
  tagline: { fontSize: 14, color: COLORS.dim, textAlign: 'center', marginBottom: 30 },
  card: {
    width: '100%', backgroundColor: COLORS.card, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.line, padding: 18, gap: 14,
    marginBottom: 30,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowTxt: { fontSize: 14, color: COLORS.white },
  footer: { fontSize: 12, color: COLORS.dim2 },
});
