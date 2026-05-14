import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/src/theme/colors';
import type { ExamCheckpoint } from '@/src/domain/types/study';

interface Props {
  checkpoint: ExamCheckpoint;
  daysLeft: number;
}

export function ExamCountdownBanner({ checkpoint, daysLeft }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <Text style={styles.label}>UPCOMING EXAM</Text>
        <Text style={styles.name}>{checkpoint.name}</Text>
        <Text style={styles.date}>{formatDate(checkpoint.date)}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.days}>{daysLeft}</Text>
        <Text style={styles.daysLabel}>days left</Text>
      </View>
    </View>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.2)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  left: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: colors.accent,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  date: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  right: {
    alignItems: 'center',
    paddingLeft: 16,
  },
  days: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.accent,
    fontVariant: ['tabular-nums'],
  },
  daysLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
});
