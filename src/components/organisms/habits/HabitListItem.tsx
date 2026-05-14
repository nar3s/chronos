import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

interface Props {
  emoji: string;
  label: string;
  streak: number;
  completedToday: boolean;
  onToggle(): void;
  onDelete(): void;
}

export function HabitListItem({ emoji, label, streak, completedToday, onToggle, onDelete }: Props) {
  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={[styles.check, completedToday && styles.checkDone]}
        onPress={onToggle}
        activeOpacity={0.75}
      >
        <Text style={styles.emoji}>{emoji}</Text>
      </TouchableOpacity>

      <View style={styles.info}>
        <Text style={[styles.label, completedToday && styles.labelDone]}>{label}</Text>
        <Text style={styles.streak}>
          {streak > 0 ? `🔥 ${streak}d streak` : '— no streak yet'}
        </Text>
      </View>

      <View style={styles.right}>
        {completedToday && (
          <View style={styles.doneBadge}>
            <Text style={styles.doneBadgeText}>✓</Text>
          </View>
        )}
        <TouchableOpacity onPress={onDelete} style={styles.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.deleteText}>✕</Text>
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
    width: 44,
    height: 44,
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
  emoji: { fontSize: 20 },
  info: { flex: 1 },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  labelDone: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  streak: {
    fontSize: 12,
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
  doneBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.success,
  },
  deleteBtn: {
    padding: 4,
  },
  deleteText: {
    fontSize: 14,
    color: colors.textMuted,
  },
});
