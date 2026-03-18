import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity,
  Platform, PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

const NOTIF_ICONS = {
  new_ride: { name: 'car', color: COLORS.green, bg: COLORS.greenLight },
  driver_accepted: { name: 'checkmark-circle', color: COLORS.green, bg: COLORS.greenLight },
  driver_arriving: { name: 'navigate', color: '#4A90FF', bg: 'rgba(74,144,255,0.12)' },
  ride_started: { name: 'speedometer', color: '#4A90FF', bg: 'rgba(74,144,255,0.12)' },
  ride_completed: { name: 'flag', color: COLORS.green, bg: COLORS.greenLight },
  ride_cancelled: { name: 'close-circle', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
  new_message: { name: 'chatbubble', color: '#9B59B6', bg: 'rgba(155,89,182,0.12)' },
  rating: { name: 'star', color: '#FFB800', bg: 'rgba(255,184,0,0.12)' },
  default: { name: 'notifications', color: COLORS.green, bg: COLORS.greenLight },
};

export default function InAppNotification({ notification, onPress, onDismiss }) {
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const dismissTimer = useRef(null);

  const dismiss = useCallback(() => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    Animated.parallel([
      Animated.timing(translateY, { toValue: -120, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => onDismiss?.());
  }, [onDismiss]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderMove: (_, g) => {
        if (g.dy < 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy < -30) {
          dismiss();
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (!notification) return;
    translateY.setValue(-120);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 60, friction: 9 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    dismissTimer.current = setTimeout(dismiss, 4500);
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [notification]);

  if (!notification) return null;

  const type = notification.data?.type || 'default';
  const icon = NOTIF_ICONS[type] || NOTIF_ICONS.default;

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY }], opacity }]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        style={styles.content}
        activeOpacity={0.85}
        onPress={() => { dismiss(); onPress?.(notification); }}
      >
        <View style={[styles.iconWrap, { backgroundColor: icon.bg }]}>
          <Ionicons name={icon.name} size={20} color={icon.color} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title} numberOfLines={1}>{notification.title || 'Yokh Laa'}</Text>
          <Text style={styles.body} numberOfLines={2}>{notification.body || ''}</Text>
        </View>
        <Text style={styles.time}>maintenant</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 12,
    right: 12,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 2,
  },
  body: {
    fontSize: 12,
    color: COLORS.dim,
    lineHeight: 17,
  },
  time: {
    fontSize: 10,
    color: COLORS.dim2,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
});
