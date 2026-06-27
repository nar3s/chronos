import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenTemplate } from '@/src/components/templates/ScreenTemplate';
import { ScreenHeader } from '@/src/components/molecules/ScreenHeader';
import { ReadLaterListItem } from '@/src/components/organisms/readlater/ReadLaterListItem';
import { useReadLaterStore } from '@/src/store/readlaterStore';
import { cancelReadLaterNotification } from '@/src/services/notifications';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import type { ReadLaterItem } from '@/src/domain/types/readlater';

type FilterKey = 'all' | 'unread' | 'read';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'read', label: 'Read' },
];

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function ReadLaterScreen() {
  const items = useReadLaterStore((s) => s.items);
  const toggleRead = useReadLaterStore((s) => s.toggleRead);
  const updateItem = useReadLaterStore((s) => s.updateItem);
  const [filter, setFilter] = useState<FilterKey>('all');

  const unreadCount = items.filter((i) => !i.isRead).length;

  const sorted = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const visible = sorted.filter((i) => {
    if (filter === 'unread') return !i.isRead;
    if (filter === 'read') return i.isRead;
    return true;
  });

  function handleOpen(item: ReadLaterItem) {
    const url = normalizeUrl(item.url);
    if (!url) return;
    Linking.openURL(url).catch(() => {});
  }

  function handleToggleRead(id: string) {
    const item = useReadLaterStore.getState().getItemById(id);
    // Becoming read -> drop any pending reminder so it can't fire later.
    if (item && !item.isRead && item.notificationId) {
      cancelReadLaterNotification(item.id).catch(() => {});
      updateItem(id, { notifyAt: undefined, notificationId: undefined });
    }
    toggleRead(id);
  }

  function handleEdit(id: string) {
    router.push(`/modals/add-read-later?id=${id}` as any);
  }

  return (
    <ScreenTemplate>
      <ScreenHeader
        title="Read Later"
        right={
          <TouchableOpacity
            onPress={() => router.push('/modals/add-read-later' as any)}
            style={styles.addBtn}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={22} color={colors.accent} />
          </TouchableOpacity>
        }
      />

      <Animated.View entering={FadeInDown.duration(400)}>
        <LinearGradient
          colors={['#1a1f2e', '#15171f', '#101218']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statBanner}
        >
          <Text style={styles.fieldLabel}>Saved</Text>
          <View style={styles.statRow}>
            <View>
              <Text style={styles.statValue}>{unreadCount}</Text>
              <Text style={styles.statLabel}>to read</Text>
            </View>
            <View style={styles.heroIcon}>
              <Ionicons name="bookmarks-outline" size={20} color={colors.accent} />
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.75}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {visible.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="bookmark-outline" size={28} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>
            {filter === 'read' ? 'Nothing read yet' : 'Nothing saved yet'}
          </Text>
          <Text style={styles.emptyHint}>
            {filter === 'read'
              ? 'Items you finish will show up here.'
              : 'Tap + to save a link to read later.'}
          </Text>
        </View>
      ) : (
        <Animated.View entering={FadeInDown.duration(400).delay(60)}>
          {visible.map((item) => (
            <ReadLaterListItem
              key={item.id}
              item={item}
              onToggleRead={handleToggleRead}
              onOpen={handleOpen}
              onEdit={handleEdit}
            />
          ))}
        </Animated.View>
      )}
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.accent}14`,
    borderWidth: 1,
    borderColor: `${colors.accent}33`,
  },
  statBanner: {
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: `${colors.accent}1A`,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.accent,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginTop: 2,
  },
  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardElevated,
  },
  filterChipActive: {
    backgroundColor: `${colors.accent}24`,
    borderColor: colors.accent,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.accent,
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
    gap: 8,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptyHint: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
