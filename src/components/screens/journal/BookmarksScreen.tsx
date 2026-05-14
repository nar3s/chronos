import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ScreenTemplate } from '@/src/components/templates/ScreenTemplate';
import { useBookmarkStore } from '@/src/store/bookmarkStore';
import { getToday } from '@/src/utils/dates';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { Bookmark } from '@/src/domain/types/bookmark';

function toLocalIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function BookmarksScreen() {
  const bookmarks = useBookmarkStore((s) => s.bookmarks);
  const today = getToday();

  const { upcoming, past } = useMemo(() => {
    const up: (Bookmark & { nextDate: string })[] = [];
    const pa: Bookmark[] = [];

    bookmarks.forEach((b) => {
      let nextDate = b.date;
      
      if (b.recurrence && b.recurrence !== 'none') {
        const dBase = new Date(b.date + 'T00:00:00');
        const dNow = new Date(today + 'T00:00:00');
        
        if (b.date < today) {
          if (b.recurrence === 'daily') {
            nextDate = today;
          } else if (b.recurrence === 'weekly') {
            // Find next day with same day of week
            const d = new Date(dNow);
            while (d.getDay() !== dBase.getDay()) {
              d.setDate(d.getDate() + 1);
            }
            nextDate = toLocalIsoDate(d);
          } else if (b.recurrence === 'monthly') {
            const d = new Date(dNow.getFullYear(), dNow.getMonth(), dBase.getDate());
            if (d < dNow) d.setMonth(d.getMonth() + 1);
            nextDate = toLocalIsoDate(d);
          } else if (b.recurrence === 'yearly') {
            const d = new Date(dNow.getFullYear(), dBase.getMonth(), dBase.getDate());
            if (d < dNow) d.setFullYear(d.getFullYear() + 1);
            nextDate = toLocalIsoDate(d);
          }
        }
        up.push({ ...b, nextDate });
      } else {
        if (b.date >= today) up.push({ ...b, nextDate: b.date });
        else pa.push(b);
      }
    });

    up.sort((a, b) => a.nextDate.localeCompare(b.nextDate));
    pa.sort((a, b) => b.date.localeCompare(a.date));

    return { upcoming: up, past: pa };
  }, [bookmarks, today]);

  function renderList(list: Bookmark[], emptyMessage: string) {
    if (list.length === 0) {
      return <Text style={styles.emptyText}>{emptyMessage}</Text>;
    }

    return list.map((b, i) => (
      <Animated.View key={b.id} entering={FadeInDown.duration(300).delay(i * 50)}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push(`/modals/add-bookmark?id=${b.id}` as any)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardDate}>
              {'nextDate' in b && b.nextDate !== b.date ? `${b.nextDate} (Repeats)` : b.date}
            </Text>
            {b.notifyAt && <Ionicons name="notifications" size={14} color={colors.accent} />}
          </View>
          <Text style={styles.cardLabel}>{b.label}</Text>
          {b.note && <Text style={styles.cardNote} numberOfLines={2}>{b.note}</Text>}
        </TouchableOpacity>
      </Animated.View>
    ));
  }

  return (
    <ScreenTemplate>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Bookmarks</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/modals/add-bookmark' as any)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.addBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Upcoming</Text>
      <View style={styles.section}>
        {renderList(upcoming, "No upcoming bookmarks")}
      </View>

      <Text style={styles.sectionTitle}>Past</Text>
      <View style={styles.section}>
        {renderList(past, "No past bookmarks")}
      </View>
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  section: {
    marginBottom: spacing.xl,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    fontStyle: 'italic',
    paddingVertical: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardDate: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '600',
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  cardNote: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
