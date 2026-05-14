import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HeatmapWeek } from '@/src/components/molecules/HeatmapWeek';
import { colors } from '@/src/theme/colors';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const LEVELS = ['#1A1A1A', 'rgba(59,130,246,0.2)', 'rgba(59,130,246,0.4)', 'rgba(59,130,246,0.65)', '#3B82F6'];

interface Props {
  heatmap: number[][];
}

export function StudyHeatmap({ heatmap }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.dayLabels}>
        {DAY_LABELS.map((d, i) => (
          <Text key={i} style={styles.dayLabel}>{d}</Text>
        ))}
      </View>
      {heatmap.map((week, i) => (
        <HeatmapWeek key={i} data={week} />
      ))}
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
  },
  dayLabels: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 6,
  },
  dayLabel: {
    width: 18,
    textAlign: 'center',
    fontSize: 9,
    color: colors.textMuted,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
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
