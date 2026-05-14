import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@/src/theme/colors';

interface Props {
  label: string;
  active?: boolean;
  isToday?: boolean;
  size?: number;
  onPress?: () => void;
}

export function Chip({ label, active = false, isToday = false, size = 40, onPress }: Props) {
  const chip = (
    <View
      style={[
        styles.chip,
        { height: size, flex: 1 },
        active && styles.active,
        isToday && !active && styles.today,
      ]}
    >
      <Text style={[styles.label, active && styles.activeLabel]}>{label}</Text>
    </View>
  );

  if (!onPress) {
    return chip;
  }

  return (
    <TouchableOpacity style={styles.pressable} onPress={onPress} activeOpacity={0.8}>
      {chip}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
  },
  chip: {
    borderRadius: 6,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: {
    backgroundColor: colors.accent,
  },
  today: {
    backgroundColor: 'rgba(59,130,246,0.15)',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textMuted,
    fontFamily: undefined,
  },
  activeLabel: {
    color: '#fff',
  },
});
