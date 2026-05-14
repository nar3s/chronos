import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  BounceIn,
} from 'react-native-reanimated';
import { colors } from '@/src/theme/colors';

interface Props {
  streak: number;
}

export function StudyStreakCard({ streak }: Props) {
  const scale = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 8, stiffness: 150, mass: 0.5 });
  }, [streak]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (streak === 0) return null;

  return (
    <Animated.View style={styles.container} entering={BounceIn.duration(500).delay(100)}>
      <Text style={styles.fire}>🔥</Text>
      <Animated.Text style={[styles.number, animatedStyle]}>{streak}</Animated.Text>
      <Text style={styles.label}>day study streak</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  fire: {
    fontSize: 20,
  },
  number: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.warning,
    fontVariant: ['tabular-nums'],
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.warning,
  },
});
