import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

export default function StepItem({ number, title, description, active = false, onPress }) {
  return (
    <TouchableOpacity style={styles.step} onPress={onPress} activeOpacity={0.7}>
      {active && <View style={styles.activeLine} />}
      <View style={[styles.number, active && styles.numberActive]}>
        <Text style={[styles.numText, active && { color: '#fff' }]}>{number}</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, active && { color: COLORS.white }]}>{title}</Text>
        {active && <Text style={styles.desc}>{description}</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  step: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    position: 'relative',
  },
  activeLine: {
    position: 'absolute',
    left: -16,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: COLORS.green,
    borderRadius: 2,
  },
  number: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberActive: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  numText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.dim,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.dim,
    marginBottom: 4,
  },
  desc: {
    fontSize: 13,
    color: COLORS.dim,
    lineHeight: 20,
  },
});
