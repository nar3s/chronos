import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Toggle } from '@/src/components/atoms/Toggle';
import { describeSchedule } from '@/src/hooks/useWallpaper';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import type { WallpaperItem, WallpaperSchedule } from '@/src/domain/types/wallpaper';

function toUri(path: string): string {
  return /^(file|content):\/\//.test(path) ? path : `file://${path}`;
}

const TARGET_LABEL: Record<string, string> = {
  home: 'Home',
  lock: 'Lock',
  both: 'Home + Lock',
};

interface Props {
  schedules: WallpaperSchedule[];
  items: WallpaperItem[];
  onAdd(): void;
  onEdit(id: string): void;
  onToggle(id: string): void;
  onDelete(id: string): void;
}

export function ScheduleList({ schedules, items, onAdd, onEdit, onToggle, onDelete }: Props) {
  const itemById = new Map(items.map((i) => [i.id, i]));

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Schedules</Text>
        <TouchableOpacity style={styles.addBtn} onPress={onAdd} activeOpacity={0.8}>
          <Ionicons name="add" size={16} color={colors.accent} />
          <Text style={styles.addText}>New</Text>
        </TouchableOpacity>
      </View>

      {schedules.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="time-outline" size={22} color={colors.textMuted} />
          <Text style={styles.emptyText}>No schedules yet. Add one to auto-change your wallpaper.</Text>
        </View>
      ) : (
        <View style={styles.card}>
          {schedules.map((s, i) => {
            const item = itemById.get(s.wallpaperId);
            const timeLabel = s.endTime ? `${s.time} – ${s.endTime}` : s.time;
            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.row, i > 0 && styles.rowBorder]}
                onPress={() => onEdit(s.id)}
                activeOpacity={0.7}
              >
                <View style={styles.thumb}>
                  {item ? (
                    <Image source={{ uri: toUri(item.localPath) }} style={styles.thumbImg} />
                  ) : (
                    <Ionicons name="image-outline" size={16} color={colors.textMuted} />
                  )}
                </View>
                <View style={styles.info}>
                  <Text style={styles.time}>{timeLabel}</Text>
                  <Text style={styles.sub} numberOfLines={1}>
                    {describeSchedule(s)} · {TARGET_LABEL[s.target]}
                  </Text>
                </View>
                <Toggle value={s.enabled} onValueChange={() => onToggle(s.id)} size="sm" />
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation?.();
                    onDelete(s.id);
                  }}
                  style={styles.delete}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  heading: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: `${colors.accent}14`,
    borderWidth: 1,
    borderColor: `${colors.accent}33`,
  },
  addText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
  },
  empty: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  thumb: {
    width: 32,
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImg: { width: '100%', height: '100%' },
  info: { flex: 1 },
  time: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  sub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  delete: { padding: 2 },
});
