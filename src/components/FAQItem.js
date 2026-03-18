import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { COLORS } from '../constants/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(!open);
  };

  return (
    <View style={styles.faq}>
      <TouchableOpacity style={styles.question} onPress={toggle} activeOpacity={0.7}>
        <Text style={[styles.qText, open && { color: COLORS.green }]}>{question}</Text>
        <View style={[styles.arrow, open && styles.arrowOpen]}>
          <Text style={[styles.arrowText, open && { color: COLORS.green }]}>+</Text>
        </View>
      </TouchableOpacity>
      {open && (
        <View style={styles.answerWrap}>
          <Text style={styles.answer}>{answer}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  faq: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
  },
  question: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    gap: 12,
  },
  qText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  arrow: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowOpen: {
    backgroundColor: COLORS.greenLight,
  },
  arrowText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dim,
  },
  answerWrap: {
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  answer: {
    fontSize: 13,
    color: COLORS.dim,
    lineHeight: 21,
  },
});
