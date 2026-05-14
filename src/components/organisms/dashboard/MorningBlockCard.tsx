import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  BounceIn,
} from 'react-native-reanimated';
import { colors } from '@/src/theme/colors';
import type { DailySnapshot } from '@/src/domain/types/snapshot';

interface Props {
  snapshot: DailySnapshot | null;
  streak: number;
}

export function MorningBlockCard({ snapshot, streak }: Props) {
  const started = snapshot?.morningBlockStarted ?? false;
  const time = snapshot?.morningBlockTime ?? '--:--';

  const formattedTime = started
    ? formatTime(time)
    : 'Not started';

  const scale = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withSpring(1, {
      damping: 8,
      stiffness: 150,
      mass: 0.5,
    });
  }, [streak]);

  const streakAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={[styles.card, { borderLeftColor: started ? colors.success : colors.textMuted }]}>
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.label}>MORNING BLOCK STATUS</Text>
          <Text style={styles.time}>{formattedTime}</Text>
          {started ? (
            <Text style={styles.onTime}>✓ On time</Text>
          ) : (
            <Text style={styles.late}>Not started yet</Text>
          )}
        </View>
        <Animated.View
          style={[styles.right]}
          entering={BounceIn.duration(600).delay(200)}
        >
          <Animated.Text style={[styles.streakNum, streakAnimStyle]}>
            {streak}
          </Animated.Text>
          <Text style={styles.streakLabel}>day streak</Text>
        </Animated.View>
      </View>
    </View>
  );
}

function formatTime(t: string): string {
  const [hStr, mStr] = t.split(':');
  const h = parseInt(hStr, 10);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `Started at ${h12}:${mStr} ${period}`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  left: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  time: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  onTime: {
    fontSize: 13,
    color: colors.success,
    marginTop: 4,
  },
  late: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  right: {
    alignItems: 'center',
  },
  streakNum: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.accent,
    fontVariant: ['tabular-nums'],
  },
  streakLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
});
