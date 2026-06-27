import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from '@/src/components/molecules/BottomSheet';
import { formatDisplayDate } from '@/src/utils/dates';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import type { HabitDayDetail } from '@/src/hooks/useHabitStats';

interface Props {
  visible: boolean;
  detail: HabitDayDetail | null;
  onClose(): void;
}

export function HabitDayDetailSheet({ visible, detail, onClose }: Props) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.body}>
        {detail ? (
          <>
            <Text style={styles.date}>{formatDisplayDate(detail.date)}</Text>
            <Text style={styles.summary}>
              {detail.done.length}/{detail.activeCount} habits completed
            </Text>

            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {detail.activeCount === 0 ? (
                <Text style={styles.empty}>No habits existed on this day.</Text>
              ) : (
                <>
                  {detail.done.map((h) => (
                    <View key={h.id} style={styles.row}>
                      <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                      <Text style={styles.rowLabel}>{h.label}</Text>
                    </View>
                  ))}
                  {detail.missed.map((h) => (
                    <View key={h.id} style={styles.row}>
                      <Ionicons name="ellipse-outline" size={18} color={colors.textMuted} />
                      <Text style={[styles.rowLabel, styles.rowMissed]}>{h.label}</Text>
                    </View>
                  ))}
                </>
              )}
            </ScrollView>
          </>
        ) : null}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  date: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  summary: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  list: {
    maxHeight: 300,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
  },
  rowLabel: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  rowMissed: {
    color: colors.textMuted,
  },
  empty: {
    fontSize: 14,
    color: colors.textMuted,
    paddingVertical: spacing.md,
  },
});
