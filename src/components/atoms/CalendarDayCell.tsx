import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@/src/theme/colors';

interface Props {
  dayNum: number;
  activeCount: number;
  study: boolean;
  gym: boolean;
  protein: boolean;
  sleep: boolean;
  isToday: boolean;
  isFuture: boolean;
  isSelected?: boolean;
  onPress?: () => void;
}

const INTENSITY_BG = [
  'transparent',
  'rgba(59,130,246,0.15)',
  'rgba(59,130,246,0.30)',
  'rgba(59,130,246,0.50)',
  'rgba(59,130,246,0.75)',
];

const DOT_COLORS = {
  study: colors.accent,
  gym: colors.success,
  protein: colors.warning,
  sleep: colors.purple,
};

export function CalendarDayCell({
  dayNum,
  activeCount,
  study,
  gym,
  protein,
  sleep,
  isToday,
  isFuture,
  isSelected,
  onPress,
}: Props) {
  const bg = isFuture ? 'transparent' : INTENSITY_BG[activeCount] ?? INTENSITY_BG[0];
  const dots = isFuture ? [] : [
    study && DOT_COLORS.study,
    gym && DOT_COLORS.gym,
    protein && DOT_COLORS.protein,
    sleep && DOT_COLORS.sleep,
  ].filter(Boolean) as string[];

  return (
    <TouchableOpacity
      style={[
        styles.cell,
        { backgroundColor: bg },
        isToday && styles.today,
        isSelected && styles.selected,
        isFuture && styles.future,
      ]}
      onPress={isFuture ? undefined : onPress}
      activeOpacity={isFuture ? 1 : 0.6}
      disabled={isFuture}
    >
      <Text
        style={[
          styles.dayNum,
          isToday && styles.todayNum,
          isSelected && styles.selectedNum,
          isFuture && styles.futureNum,
          activeCount >= 3 && !isFuture && styles.brightNum,
        ]}
      >
        {dayNum}
      </Text>
      {dots.length > 0 && (
        <View style={styles.dotRow}>
          {dots.map((color, i) => (
            <View key={i} style={[styles.dot, { backgroundColor: color }]} />
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

export function EmptyCell() {
  return <View style={styles.cell} />;
}

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 2,
  },
  today: {
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  selected: {
    borderWidth: 1.5,
    borderColor: colors.warning,
  },
  future: {
    opacity: 0.25,
  },
  dayNum: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  todayNum: {
    color: colors.accent,
    fontWeight: '700',
  },
  selectedNum: {
    color: colors.warning,
    fontWeight: '700',
  },
  futureNum: {
    color: colors.textMuted,
  },
  brightNum: {
    color: '#fff',
    fontWeight: '600',
  },
  dotRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
