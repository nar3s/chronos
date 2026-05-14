import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Preset = 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'muted';

interface Props {
  label: string;
  preset?: Preset;
  color?: string;
  bg?: string;
}

const PRESETS: Record<Preset, { color: string; bg: string }> = {
  success: { color: '#22C55E', bg: 'rgba(34,197,94,0.15)' },
  warning: { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  danger: { color: '#EF4444', bg: 'rgba(239,68,68,0.15)' },
  info: { color: '#3B82F6', bg: 'rgba(59,130,246,0.15)' },
  purple: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)' },
  muted: { color: '#A0A0A0', bg: 'rgba(160,160,160,0.1)' },
};

export function Badge({ label, preset = 'info', color, bg }: Props) {
  const { color: c, bg: b } = PRESETS[preset];
  return (
    <View style={[styles.container, { backgroundColor: bg ?? b }]}>
      <Text style={[styles.text, { color: color ?? c }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});
