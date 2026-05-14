import React from 'react';
import { View, StyleSheet } from 'react-native';

const LEVELS = [
  '#1A1A1A',
  'rgba(59,130,246,0.2)',
  'rgba(59,130,246,0.4)',
  'rgba(59,130,246,0.65)',
  '#3B82F6',
];

interface Props {
  data: number[];
}

export function HeatmapWeek({ data }: Props) {
  return (
    <View style={styles.row}>
      {data.map((v, i) => (
        <View
          key={i}
          style={[styles.cell, { backgroundColor: LEVELS[v] ?? LEVELS[0] }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 3,
  },
  cell: {
    width: 18,
    height: 18,
    borderRadius: 3,
  },
});
