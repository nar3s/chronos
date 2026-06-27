import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from '@/src/components/molecules/BottomSheet';
import { Toggle } from '@/src/components/atoms/Toggle';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export interface SkipTodayData {
  todayStudyMinutes: number;
  todayProteinGrams: number;
  isRestDay: boolean;
  isGymSkippedToday: boolean;
  isStudySkippedToday: boolean;
  isProteinSkippedToday: boolean;
  todaySessionCompleted: boolean;
}

interface Props {
  visible: boolean;
  data: SkipTodayData;
  onClose: () => void;
  onToggle: (key: Row['key'], next: boolean) => void;
}

interface Row {
  key: 'studySkipped' | 'gymSkipped' | 'proteinSkipped';
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  tint: string;
  hint: string;
  alreadyDone: boolean;
}

export function SkipTodaySheet({ visible, data, onClose, onToggle }: Props) {
  const studyAlreadyDone = data.todayStudyMinutes > 0;
  const gymAlreadyDone = data.todaySessionCompleted || data.isRestDay;
  const proteinAlreadyDone = data.todayProteinGrams > 0;

  const rows: Row[] = [
    {
      key: 'studySkipped',
      label: 'Skip study today',
      icon: 'book-outline',
      tint: colors.accent,
      hint: studyAlreadyDone
        ? 'Already logged - skip not needed.'
        : "Won't count as pending, won't extend streak.",
      alreadyDone: studyAlreadyDone,
    },
    {
      key: 'gymSkipped',
      label: data.isRestDay ? 'Rest day' : 'Skip workout today',
      icon: 'barbell-outline',
      tint: colors.success,
      hint: data.isRestDay
        ? 'Rest day - nothing to skip.'
        : gymAlreadyDone
          ? 'Already done - skip not needed.'
          : "Won't count as pending, won't extend streak.",
      alreadyDone: gymAlreadyDone,
    },
    {
      key: 'proteinSkipped',
      label: 'Skip protein target today',
      icon: 'restaurant-outline',
      tint: colors.warning,
      hint: proteinAlreadyDone
        ? 'Already logged - skip not needed.'
        : "Won't count as pending.",
      alreadyDone: proteinAlreadyDone,
    },
  ];

  const skippedState: Record<Row['key'], boolean> = {
    studySkipped: data.isStudySkippedToday,
    gymSkipped: data.isGymSkippedToday,
    proteinSkipped: data.isProteinSkippedToday,
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.body}>
        <Text style={styles.title}>Manage today</Text>
        <Text style={styles.subtitle}>
          Skip a domain if you can&apos;t log it today. Streaks stay strict -
          skipping won&apos;t extend them, but won&apos;t count as pending either.
        </Text>

        {rows.map((row) => {
          const isSkipped = skippedState[row.key];
          const disabled = row.alreadyDone;
          return (
            <View
              key={row.key}
              style={[styles.row, disabled && styles.rowDisabled]}
            >
              <View style={[styles.iconBox, { backgroundColor: `${row.tint}18` }]}>
                <Ionicons name={row.icon} size={18} color={row.tint} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Text style={styles.rowHint}>{row.hint}</Text>
              </View>
              <Toggle
                size="sm"
                value={isSkipped}
                onValueChange={(v) => onToggle(row.key, v)}
                disabled={disabled}
              />
            </View>
          );
        })}

        <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.85}>
          <Text style={styles.closeText}>Done</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
    marginBottom: spacing.base,
    lineHeight: 17,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  rowDisabled: {
    opacity: 0.4,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  rowHint: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15,
  },
  closeBtn: {
    marginTop: spacing.base,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  closeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
