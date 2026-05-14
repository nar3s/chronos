import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useDiaryStore } from '@/src/store/diaryStore';
import { useBookmarkStore } from '@/src/store/bookmarkStore';
import { getToday } from '@/src/utils/dates';
import { colors } from '@/src/theme/colors';
import type { MoodType } from '@/src/domain/types/diary';

const WEEK_HEADERS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const MOOD_DOT_COLORS: Record<MoodType, string> = {
  great: colors.success,
  good: colors.accent,
  okay: colors.warning,
  rough: colors.danger,
};

interface Props {
  selectedDate: string;
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

export function DiaryCalendar({ selectedDate, onSelectDate }: Props) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const entries = useDiaryStore((s) => s.entries);
  const tasks = useDiaryStore((s) => s.tasks);
  const bookmarks = useBookmarkStore((s) => s.bookmarks);
  const getBookmarksByDate = useBookmarkStore((s) => s.getBookmarksByDate);
  const today = getToday();

  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const { entryMoodMap, datesWithContent } = useMemo(() => {
    const moodMap = new Map<string, MoodType | null>();
    entries.forEach((e) => moodMap.set(e.date, e.mood));
    const content = new Set<string>();
    entries.forEach((e) => content.add(e.date));
    tasks.forEach((t) => content.add(t.date));
    return { entryMoodMap: moodMap, datesWithContent: content };
  }, [entries, tasks]);

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
    <View style={styles.container}>
      <View style={styles.monthRow}>
        <TouchableOpacity onPress={goPrev} style={styles.arrow} activeOpacity={0.6}>
          <Text style={styles.arrowText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <TouchableOpacity
          onPress={goNext}
          style={styles.arrow}
          activeOpacity={0.6}
        >
          <Text style={styles.arrowText}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.headerRow}>
        {WEEK_HEADERS.map((h) => (
          <View key={h} style={styles.headerCell}>
            <Text style={styles.headerText}>{h}</Text>
          </View>
        ))}
      </View>

      {rows.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((date, ci) => {
            if (!date) return <View key={`e-${ri}-${ci}`} style={styles.cell} />;

            const dayNum = parseInt(date.slice(-2), 10);
            const hasContent = datesWithContent.has(date);
            const mood = entryMoodMap.get(date) ?? null;
            const dotColor = mood ? MOOD_DOT_COLORS[mood] : colors.textMuted;
            const isToday = date === today;
            const isSelected = date === selectedDate;
            const isFuture = date > today;

            const isBookmarked = getBookmarksByDate(date).length > 0;

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
                  {isBookmarked && <Text style={styles.bookmarkStar}>★</Text>}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: -2,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  headerCell: {
    flex: 1,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
  },
  dayNum: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayRing: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  selectedFill: {
    backgroundColor: colors.accent,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textPrimary,
  },
  todayText: {
    fontWeight: '700',
    color: colors.accent,
  },
  selectedText: {
    color: '#fff',
    fontWeight: '600',
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
    fontSize: 10,
    color: colors.warning,
  },
});
