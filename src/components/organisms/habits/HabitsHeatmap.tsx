import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@/src/theme/colors';

const LEVELS = [
  '#1A1A1A',
  'rgba(34,197,94,0.22)',
  'rgba(34,197,94,0.45)',
  'rgba(34,197,94,0.7)',
  '#22C55E',
];

interface Props {
  heatmap: number[][];
  days: string[][];
  onDayPress?: (date: string) => void;
}

export function HabitsHeatmap({ heatmap, days, onDayPress }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Consistency</Text>
      <View style={styles.grid}>
        {heatmap.map((week, w) => (
          <View key={w} style={styles.weekCol}>
            {week.map((level, d) => {
              const date = days[w]?.[d];
              return (
                <TouchableOpacity
                  key={d}
                  activeOpacity={onDayPress ? 0.6 : 1}
                  onPress={onDayPress && date ? () => onDayPress(date) : undefined}
                  style={[styles.cell, { backgroundColor: LEVELS[level] ?? LEVELS[0] }]}
                />
              );
            })}
          </View>
        ))}
      </View>
      <View style={styles.legend}>
        <Text style={styles.legendLabel}>Less</Text>
        {LEVELS.map((bg, i) => (
          <View key={i} style={[styles.legendCell, { backgroundColor: bg }]} />
        ))}
        <Text style={styles.legendLabel}>More</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'space-between',
  },
  weekCol: {
    gap: 4,
  },
  cell: {
    width: 13,
    height: 13,
    borderRadius: 3,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
  },
  legendLabel: {
    fontSize: 9,
    color: colors.textMuted,
  },
  legendCell: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});
