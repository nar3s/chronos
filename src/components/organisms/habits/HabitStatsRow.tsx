import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';

interface Props {
  completionPct: number;
  perfectDayStreak: number;
  bestStreak: number;
}

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function Stat({
  icon,
  value,
  label,
  color,
}: {
  icon: IconName;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.stat}>
      <View style={[styles.iconChip, { backgroundColor: `${color}18`, borderColor: `${color}33` }]}>
        <Ionicons name={icon} size={15} color={color} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

export function HabitStatsRow({ completionPct, perfectDayStreak, bestStreak }: Props) {
  return (
    <View style={styles.row}>
      <Stat
        icon="trending-up-outline"
        value={`${completionPct}%`}
        label="30-day rate"
        color={colors.accent}
      />
      <Stat
        icon="ribbon-outline"
        value={`${perfectDayStreak}d`}
        label="Perfect streak"
        color={colors.success}
      />
      <Stat
        icon="flame-outline"
        value={`${bestStreak}d`}
        label="Best streak"
        color={colors.warning}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 4,
  },
  iconChip: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 2,
  },
  value: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  label: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
