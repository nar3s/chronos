import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';

interface Props {
  name: string;
  sets: number;
  reps: number;
  weightKg?: number;
  lastWeightKg?: number;
  done: boolean;
  onToggle: () => void;
  isFirst?: boolean;
}

export function ExerciseCheckRow({ name, sets, reps, weightKg, lastWeightKg, done, onToggle, isFirst }: Props) {
  const setsLabel = `${sets}x${reps}`;
  const weightLabel = weightKg ? `${weightKg}kg` : null;
  const lastLabel = !weightKg && lastWeightKg ? `last: ${lastWeightKg}kg` : null;

  return (
    <TouchableOpacity
      onPress={onToggle}
      style={[styles.row, !isFirst && styles.border]}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, done && styles.checkboxDone]}>
        {done ? <Ionicons name="checkmark" size={13} color={colors.textPrimary} /> : null}
      </View>
      <Text style={[styles.name, done && styles.nameDone]}>{name}</Text>
      <View style={styles.meta}>
        <Text style={styles.sets}>{setsLabel}</Text>
        {weightLabel && (
          <Text style={styles.weight}>{weightLabel}</Text>
        )}
        {lastLabel && (
          <Text style={styles.lastWeight}>{lastLabel}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  border: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxDone: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  name: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  nameDone: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  meta: {
    alignItems: 'flex-end',
    gap: 2,
  },
  sets: {
    fontSize: 12,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  weight: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
    fontVariant: ['tabular-nums'],
  },
  lastWeight: {
    fontSize: 11,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
    fontStyle: 'italic',
  },
});
