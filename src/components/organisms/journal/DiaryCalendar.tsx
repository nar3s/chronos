import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getToday } from '@/src/utils/dates';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import type { DiaryEntry, DoneTask, MoodType } from '@/src/domain/types/diary';
import type { Bookmark } from '@/src/domain/types/bookmark';

const WEEK_HEADERS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const MOOD_DOT_COLORS: Record<MoodType, string> = {
  great: colors.success,
  good: colors.accent,
  okay: colors.warning,
  rough: colors.danger,
};

interface Props {
  selectedDate: string;
  entries: DiaryEntry[];
  tasks: DoneTask[];
  bookmarks: Bookmark[];
  onSelectDate: (date: string) => void;
}

function getMonthDays(year: number, month: number): string[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => {
    const dd = String(i + 1).padStart(2, '0');
    const mm = String(month + 1).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  });
}

export function DiaryCalendar({
  selectedDate,
  entries,
  tasks,
  bookmarks,
  onSelectDate,
}: Props) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const today = getToday();

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const { entryMoodMap, datesWithContent, bookmarkedDates } = useMemo(() => {
    const moodMap = new Map<string, MoodType | null>();
    entries.forEach((entry) => moodMap.set(entry.date, entry.mood));

    const content = new Set<string>();
    entries.forEach((entry) => content.add(entry.date));
    tasks.forEach((task) => content.add(task.date));

    const marked = new Set<string>();
    bookmarks.forEach((bookmark) => marked.add(bookmark.date));

    return {
      entryMoodMap: moodMap,
      datesWithContent: content,
      bookmarkedDates: marked,
    };
  }, [entries, tasks, bookmarks]);

  const { days, startOffset } = useMemo(() => {
    const monthDays = getMonthDays(viewYear, viewMonth);
    const firstDow = new Date(viewYear, viewMonth, 1).getDay();
    return {
      days: monthDays,
      startOffset: firstDow === 0 ? 6 : firstDow - 1,
    };
  }, [viewYear, viewMonth]);

  const cells: (string | null)[] = [...Array(startOffset).fill(null), ...days];
  while (cells.length % 7 !== 0) cells.push(null);

  const rows: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  function goPrev() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function goNext() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  return (
    <LinearGradient
      colors={['#1a1f2e', '#15171f', '#101218']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.monthRow}>
        <TouchableOpacity onPress={goPrev} style={styles.arrow} activeOpacity={0.6}>
          <Ionicons name="chevron-back" size={16} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.monthCenter}>
          <Text style={styles.calendarLabel}>Calendar</Text>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
        </View>
        <TouchableOpacity onPress={goNext} style={styles.arrow} activeOpacity={0.6}>
          <Ionicons name="chevron-forward" size={16} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.headerRow}>
        {WEEK_HEADERS.map((header) => (
          <View key={header} style={styles.headerCell}>
            <Text style={styles.headerText}>{header}</Text>
          </View>
        ))}
      </View>

      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((date, cellIndex) => {
            if (!date) {
              return <View key={`e-${rowIndex}-${cellIndex}`} style={styles.cell} />;
            }

            const dayNum = parseInt(date.slice(-2), 10);
            const hasContent = datesWithContent.has(date);
            const mood = entryMoodMap.get(date) ?? null;
            const dotColor = mood ? MOOD_DOT_COLORS[mood] : colors.textMuted;
            const isToday = date === today;
            const isSelected = date === selectedDate;
            const isFuture = date > today;
            const isBookmarked = bookmarkedDates.has(date);

            return (
              <TouchableOpacity
                key={date}
                style={styles.cell}
                onPress={() => onSelectDate(date)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.dayNum,
                    isToday && !isSelected && styles.todayRing,
                    isSelected && styles.selectedFill,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isFuture && styles.futureText,
                      isToday && styles.todayText,
                      isSelected && styles.selectedText,
                    ]}
                  >
                    {dayNum}
                  </Text>
                  {isBookmarked ? (
                    <Ionicons
                      name="star"
                      size={10}
                      color={colors.warning}
                      style={styles.bookmarkStar}
                    />
                  ) : null}
                </View>
                {hasContent ? (
                  <View style={[styles.dot, { backgroundColor: dotColor }]} />
                ) : (
                  <View style={styles.dotSpacer} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: `${colors.accent}1A`,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  monthCenter: {
    alignItems: 'center',
  },
  calendarLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  headerCell: {
    flex: 1,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 1,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 1,
  },
  dayNum: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayRing: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  selectedFill: {
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: `${colors.accent}99`,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  todayText: {
    fontWeight: '700',
    color: colors.accent,
  },
  selectedText: {
    color: '#fff',
    fontWeight: '700',
  },
  futureText: {
    color: colors.textMuted,
    opacity: 0.4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  dotSpacer: {
    width: 4,
    height: 4,
    marginTop: 2,
  },
  bookmarkStar: {
    position: 'absolute',
    top: -2,
    right: -4,
  },
});
