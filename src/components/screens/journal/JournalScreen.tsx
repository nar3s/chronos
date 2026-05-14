import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useBookmarkStore } from '@/src/store/bookmarkStore';
import { Ionicons } from '@expo/vector-icons';
import { ScreenTemplate } from '@/src/components/templates/ScreenTemplate';
import { DiaryCalendar } from '@/src/components/organisms/journal/DiaryCalendar';
import { DayEntryCard } from '@/src/components/organisms/journal/DayEntryCard';
import { DoneTasksList } from '@/src/components/organisms/journal/DoneTasksList';
import { DayBookmarksSheet } from '@/src/components/organisms/journal/DayBookmarksSheet';
import { getToday } from '@/src/utils/dates';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

export function JournalScreen() {
  const today = getToday();
  const [selectedDate, setSelectedDate] = useState(today);
  const [showSheet, setShowSheet] = useState(false);

  const buttonLabel = selectedDate === today ? '+ Write Today' : '+ Write Entry';

  const getBookmarksByDate = useBookmarkStore((s) => s.getBookmarksByDate);
  const dayBookmarks = getBookmarksByDate(selectedDate);
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
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Journal</Text>
          <TouchableOpacity onPress={() => router.push('/journal/bookmarks' as any)}>
            <Text style={styles.bookmarksLink}>Bookmarks →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.starBtn}
            onPress={handleStarPress}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={isBookmarked ? "star" : "star-outline"} 
              size={22} 
              color={isBookmarked ? colors.warning : colors.textMuted} 
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.writeBtn}
            onPress={() => router.push(`/modals/log-diary?date=${selectedDate}` as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.writeBtnText}>{buttonLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <DiaryCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      <DayEntryCard date={selectedDate} />

      <DoneTasksList date={selectedDate} />

      {dayBookmarks.length > 0 && (
        <View style={styles.bookmarksSection}>
          <Text style={styles.sectionTitle}>Bookmarks</Text>
          {dayBookmarks.map((b, i) => (
            <Animated.View key={b.id} entering={FadeInDown.duration(300).delay(i * 50)}>
              <TouchableOpacity
                style={styles.bookmarkCard}
                onPress={() => router.push(`/modals/add-bookmark?id=${b.id}` as any)}
                activeOpacity={0.7}
              >
                <View style={styles.bookmarkHeader}>
                  <Text style={styles.bookmarkLabel}>{b.label}</Text>
                  {b.notifyAt && <Ionicons name="notifications" size={14} color={colors.accent} />}
                </View>
                {b.note ? <Text style={styles.bookmarkNote} numberOfLines={2}>{b.note}</Text> : null}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    marginBottom: spacing.base,
  },
  headerLeft: {
    gap: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  bookmarksLink: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  starBtn: {
    padding: 4,
  },
  writeBtn: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  writeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  bookmarksSection: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  bookmarkCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bookmarkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  bookmarkLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  bookmarkNote: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
});
