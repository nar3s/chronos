import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ScreenTemplate } from '@/src/components/templates/ScreenTemplate';
import { HabitListItem } from '@/src/components/organisms/habits/HabitListItem';
import { AddHabitSheet } from '@/src/components/organisms/habits/AddHabitSheet';
import { useHabits } from '@/src/hooks/useHabits';
import { getToday } from '@/src/utils/dates';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export function HabitsScreen() {
  const { habits, todayDone, todayTotal, toggleHabit, addHabit, removeHabit } = useHabits();
  const [showAdd, setShowAdd] = useState(false);
  const today = getToday();

  return (
    <ScreenTemplate>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Habits</Text>
        <TouchableOpacity onPress={() => setShowAdd(true)} style={styles.addBtn}>
          <Ionicons name="add" size={24} color={colors.accent} />
        </TouchableOpacity>
      </View>

      <Animated.View entering={FadeInDown.duration(400)} style={styles.statBanner}>
        <Text style={styles.statValue}>{todayDone}/{todayTotal}</Text>
        <Text style={styles.statLabel}>done today</Text>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        {habits.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={styles.emptyTitle}>No habits yet</Text>
            <Text style={styles.emptyHint}>Tap + to add your first habit</Text>
          </View>
        ) : (
          <Animated.View entering={FadeInDown.duration(400).delay(80)} style={styles.listCard}>
            {habits.map((h) => (
              <HabitListItem
                key={h.id}
                emoji={h.emoji}
                label={h.label}
                streak={h.streak}
                completedToday={h.completedToday}
                onToggle={() => toggleHabit(h.id, today)}
                onDelete={() => removeHabit(h.id)}
              />
            ))}
          </Animated.View>
        )}
      </ScrollView>

      <AddHabitSheet
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={(emoji, label) => addHabit({ emoji, label })}
      />
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  backBtn: { padding: 4 },
  addBtn: { padding: 4 },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statBanner: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.base,
    alignItems: 'center',
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    gap: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  list: {
    paddingBottom: 40,
  },
  listCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingHorizontal: spacing.base,
    borderWidth: 1,
    borderColor: colors.border,
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
    gap: 8,
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptyHint: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
