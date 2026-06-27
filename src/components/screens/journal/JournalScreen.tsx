import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useBookmarkStore } from '@/src/store/bookmarkStore';
import { useDiaryStore } from '@/src/store/diaryStore';
import { Ionicons } from '@expo/vector-icons';
import { ScreenTemplate } from '@/src/components/templates/ScreenTemplate';
import { JournalHeroCard } from '@/src/components/organisms/journal/JournalHeroCard';
import { DiaryCalendar } from '@/src/components/organisms/journal/DiaryCalendar';
import { DayEntryCard } from '@/src/components/organisms/journal/DayEntryCard';
import { DoneTasksList } from '@/src/components/organisms/journal/DoneTasksList';
import { DayBookmarksSheet } from '@/src/components/organisms/journal/DayBookmarksSheet';
import { SectionHeader } from '@/src/components/molecules/SectionHeader';
import { getToday } from '@/src/utils/dates';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export function JournalScreen() {
  const today = getToday();
  const [selectedDate, setSelectedDate] = useState(today);
  const [showSheet, setShowSheet] = useState(false);

  const entries = useDiaryStore((s) => s.entries);
  const allTasks = useDiaryStore((s) => s.tasks);
  const removeEntry = useDiaryStore((s) => s.removeEntry);
  const removeTask = useDiaryStore((s) => s.removeTask);
  const bookmarks = useBookmarkStore((s) => s.bookmarks);
  const dayEntry = entries.find((entry) => entry.date === selectedDate) ?? null;
  const dayTasks = allTasks.filter((task) => task.date === selectedDate);
  const dayBookmarks = bookmarks.filter((bookmark) => bookmark.date === selectedDate);
  const isBookmarked = dayBookmarks.length > 0;

  function handleStarPress() {
    if (dayBookmarks.length === 0) {
      router.push(`/modals/add-bookmark?date=${selectedDate}` as any);
    } else if (dayBookmarks.length === 1) {
      router.push(`/modals/add-bookmark?id=${dayBookmarks[0].id}` as any);
    } else {
      setShowSheet(true);
    }
  }

  return (
    <ScreenTemplate>
      <JournalHeroCard
        selectedDate={selectedDate}
        entry={dayEntry}
        taskCount={dayTasks.length}
        isBookmarked={isBookmarked}
        onStarPress={handleStarPress}
      />

      <DiaryCalendar
        selectedDate={selectedDate}
        entries={entries}
        tasks={allTasks}
        bookmarks={bookmarks}
        onSelectDate={setSelectedDate}
      />

      <DayEntryCard
        date={selectedDate}
        entry={dayEntry}
        onDelete={removeEntry}
      />

      <DoneTasksList tasks={dayTasks} onDelete={removeTask} />

      {dayBookmarks.length > 0 && (
        <View style={styles.bookmarksSection}>
          <SectionHeader title="Bookmarks" />
          {dayBookmarks.map((b, i) => (
            <Animated.View
              key={b.id}
              entering={FadeInDown.duration(300).delay(i * 50)}
            >
              <TouchableOpacity
                style={styles.bookmarkCard}
                onPress={() => router.push(`/modals/add-bookmark?id=${b.id}` as any)}
                activeOpacity={0.7}
              >
                <View style={styles.bookmarkRail} />
                <View style={styles.bookmarkIcon}>
                  <Ionicons name="star-outline" size={16} color={colors.warning} />
                </View>
                <View style={styles.bookmarkBody}>
                  <View style={styles.bookmarkHeader}>
                    <Text style={styles.bookmarkLabel} numberOfLines={1}>{b.label}</Text>
                    {b.notifyAt && (
                      <View style={styles.notifyPill}>
                        <Ionicons
                          name="notifications-outline"
                          size={12}
                          color={colors.accent}
                        />
                      </View>
                    )}
                  </View>
                  {b.note ? (
                    <Text style={styles.bookmarkNote} numberOfLines={2}>
                      {b.note}
                    </Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      )}

      <DayBookmarksSheet
        visible={showSheet}
        date={selectedDate}
        bookmarks={dayBookmarks}
        onClose={() => setShowSheet(false)}
      />
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  bookmarksSection: {
    marginBottom: spacing.md,
  },
  bookmarkCard: {
    position: 'relative',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing.md,
    paddingLeft: spacing.md + 5,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bookmarkRail: {
    position: 'absolute',
    left: 0,
    top: spacing.md,
    bottom: spacing.md,
    width: 3,
    borderRadius: 99,
    backgroundColor: colors.warning,
  },
  bookmarkIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.warning}18`,
    borderWidth: 1,
    borderColor: `${colors.warning}33`,
  },
  bookmarkBody: {
    flex: 1,
  },
  bookmarkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bookmarkLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  notifyPill: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.accent}14`,
    borderWidth: 1,
    borderColor: `${colors.accent}33`,
  },
  bookmarkNote: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    marginTop: 4,
  },
});
