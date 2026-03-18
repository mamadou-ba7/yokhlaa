import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

/**
 * Skeleton shimmer effect for loading states
 * Usage: <SkeletonLoader width={200} height={20} />
 *        <SkeletonLoader width="100%" height={80} borderRadius={14} />
 */
export default function SkeletonLoader({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: COLORS.card2 || '#202226',
          opacity,
        },
        style,
      ]}
    />
  );
}

/**
 * Pre-built skeleton for a ride card
 */
export function RideCardSkeleton() {
  return (
    <View style={skeletonStyles.rideCard}>
      <View style={skeletonStyles.row}>
        <SkeletonLoader width={100} height={12} />
        <SkeletonLoader width={70} height={22} borderRadius={6} />
      </View>
      <View style={[skeletonStyles.row, { marginTop: 14 }]}>
        <SkeletonLoader width={10} height={30} borderRadius={5} />
        <View style={{ flex: 1, gap: 8 }}>
          <SkeletonLoader width="70%" height={12} />
          <SkeletonLoader width="85%" height={14} />
        </View>
        <SkeletonLoader width={60} height={18} />
      </View>
    </View>
  );
}

/**
 * Pre-built skeleton for profile card
 */
export function ProfileSkeleton() {
  return (
    <View style={skeletonStyles.profileCard}>
      <SkeletonLoader width={52} height={52} borderRadius={26} />
      <View style={{ flex: 1, gap: 6 }}>
        <SkeletonLoader width={140} height={16} />
        <SkeletonLoader width={100} height={13} />
      </View>
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  rideCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 18,
  },
});
