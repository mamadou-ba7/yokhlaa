import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

export default function FeatureCard({ icon, title, description, badge, accent = false }) {
  return (
    <View style={[styles.card, accent && styles.cardAccent]}>
      <View style={[styles.icon, accent && styles.iconGreen]}>
        <Ionicons name={icon} size={22} color={accent ? COLORS.green : COLORS.dim} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.desc}>{description}</Text>
      {badge && (
        <View style={[styles.badge, accent && styles.badgeGreen]}>
          <Text style={[styles.badgeText, accent && { color: COLORS.green }]}>{badge}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 20,
    padding: 24,
    gap: 12,
  },
  cardAccent: {
    backgroundColor: 'rgba(34,197,94,0.04)',
    borderColor: 'rgba(34,197,94,0.18)',
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGreen: {
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderColor: 'rgba(34,197,94,0.2)',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  desc: {
    fontSize: 14,
    color: COLORS.dim,
    lineHeight: 22,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 100,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  badgeGreen: {
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderColor: 'rgba(34,197,94,0.2)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.dim,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
});
