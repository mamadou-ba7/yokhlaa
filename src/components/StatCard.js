import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

export default function StatCard({ value, label, green = false }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.value, green && { color: COLORS.green }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  value: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -1,
  },
  label: {
    fontSize: 10,
    color: COLORS.dim,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 4,
  },
});
