import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

const WEEK_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface Props {
  emoji: string;
  label: string;
  streak: number;
  completedToday: boolean;
  bestStreak?: number;
  thisWeek?: boolean[];
  onToggle(): void;
  onDelete(): void;
}

export function HabitListItem({
  label,
  streak,
  completedToday,
  bestStreak,
  thisWeek,
  onToggle,
  onDelete,
}: Props) {
  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={[styles.check, completedToday && styles.checkDone]}
        onPress={onToggle}
        activeOpacity={0.75}
      >
        <Ionicons
          name={completedToday ? 'checkmark' : 'ellipse-outline'}
          size={20}
          color={completedToday ? colors.success : colors.textMuted}
        />
      </TouchableOpacity>

      <View style={styles.info}>
        <Text style={[styles.label, completedToday && styles.labelDone]} numberOfLines={1}>
          {label}
        </Text>
        <View style={styles.streakRow}>
          <Ionicons name="flame-outline" size={13} color={colors.textMuted} />
          <Text style={styles.streak}>
            {streak > 0 ? `${streak}d streak` : 'No streak yet'}
          </Text>
          {bestStreak && bestStreak > 0 ? (
            <Text style={styles.best}>· best {bestStreak}d</Text>
          ) : null}
        </View>
        {thisWeek ? (
          <View style={styles.weekRow}>
            {thisWeek.map((done, i) => (
              <View key={i} style={styles.weekItem}>
                <View style={[styles.weekDot, done && styles.weekDotDone]} />
                <Text style={styles.weekLabel}>{WEEK_LABELS[i]}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.right}>
        {completedToday ? (
          <View style={styles.doneBadge}>
            <Ionicons name="checkmark" size={14} color={colors.success} />
          </View>
        ) : null}
        <TouchableOpacity
          onPress={onDelete}
          style={styles.deleteBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={17} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  check: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.cardElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: {
    backgroundColor: `${colors.success}20`,
    borderColor: colors.success,
  },
  info: { flex: 1 },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 3,
  },
  labelDone: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streak: {
    fontSize: 12,
    color: colors.textMuted,
  },
  best: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 2,
  },
  weekRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  weekItem: {
    alignItems: 'center',
    gap: 3,
  },
  weekDot: {
    width: 9,
    height: 9,
    borderRadius: 3,
    backgroundColor: colors.cardElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weekDotDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  weekLabel: {
    fontSize: 8,
    color: colors.textMuted,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  doneBadge: {
    backgroundColor: `${colors.success}20`,
    borderRadius: 8,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    padding: 4,
  },
});
