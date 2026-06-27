import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WeekDotGrid } from '@/src/components/molecules/WeekDotGrid';
import { SectionHeader } from '@/src/components/molecules/SectionHeader';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

interface DayCell {
  day: string;
  label: string;
  completed: boolean;
  isToday: boolean;
  isSelected?: boolean;
}

interface Props {
  days: DayCell[];
  onSelectDay?: (day: string) => void;
}

export function WeeklyGrid({ days, onSelectDay }: Props) {
  return (
    <View>
      <SectionHeader title="This Week" />
      <View style={styles.card}>
        <WeekDotGrid days={days} onSelectDay={onSelectDay} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
