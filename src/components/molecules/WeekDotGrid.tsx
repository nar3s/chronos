import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Chip } from '@/src/components/atoms/Chip';

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

export function WeekDotGrid({ days, onSelectDay }: Props) {
  return (
    <View style={styles.row}>
      {days.map((d, i) => (
        <Chip
          key={i}
          label={d.label}
          active={d.isSelected ? true : d.completed}
          isToday={d.isToday && !d.isSelected}
          onPress={onSelectDay ? () => onSelectDay(d.day) : undefined}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
  },
});
