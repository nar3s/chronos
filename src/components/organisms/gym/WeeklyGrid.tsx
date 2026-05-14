import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WeekDotGrid } from '@/src/components/molecules/WeekDotGrid';
import { SectionHeader } from '@/src/components/molecules/SectionHeader';

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
      <WeekDotGrid days={days} onSelectDay={onSelectDay} />
    </View>
  );
}
