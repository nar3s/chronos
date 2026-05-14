import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/src/theme/colors';
import { minutesToHHMM } from '@/src/utils/formatters';

interface Props {
  totalMinutes: number;
  sessionCount: number;
}

export function DailyStudyBanner({ totalMinutes, sessionCount }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.bigTime}>{minutesToHHMM(totalMinutes)}</Text>
      <Text style={styles.sub}>
        {sessionCount === 0
          ? 'No sessions today'
          : `${sessionCount} session${sessionCount > 1 ? 's' : ''} today`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  bigTime: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.accent,
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  sub: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
