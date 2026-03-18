import React, { useRef } from 'react';
import { Animated, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';
import { tapLight } from '../lib/haptics';

export default function GreenButton({
  title,
  onPress,
  style,
  outline = false,
  loading = false,
  disabled = false,
  icon,
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  };

  const handlePress = () => {
    if (loading || disabled) return;
    tapLight();
    onPress?.();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        style={[
          outline ? styles.outline : styles.button,
          (loading || disabled) && styles.disabled,
        ]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={loading || disabled}
      >
        {loading ? (
          <ActivityIndicator size="small" color={outline ? COLORS.green : '#fff'} />
        ) : (
          <>
            {icon}
            <Text style={[styles.text, outline && styles.outlineText]}>{title}</Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.green,
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: COLORS.green,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
    minHeight: 54,
  },
  outline: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.line2,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    minHeight: 54,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  outlineText: {
    color: COLORS.white,
    fontWeight: '500',
  },
});
