import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import type { ReadLaterItem, ReadLaterType } from '@/src/domain/types/readlater';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TYPE_META: Record<ReadLaterType, { icon: IoniconsName; color: string; label: string }> = {
  article: { icon: 'document-text-outline', color: colors.accent, label: 'Article' },
  video: { icon: 'logo-youtube', color: colors.danger, label: 'Video' },
  x: { icon: 'logo-twitter', color: colors.textPrimary, label: 'Post' },
  other: { icon: 'link-outline', color: colors.textSecondary, label: 'Link' },
};

function hostOf(url: string): string {
  return url
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split(/[/?#]/)[0];
}

interface Props {
  item: ReadLaterItem;
  onToggleRead: (id: string) => void;
  onOpen: (item: ReadLaterItem) => void;
  onEdit: (id: string) => void;
}

export function ReadLaterListItem({ item, onToggleRead, onOpen, onEdit }: Props) {
  const meta = TYPE_META[item.type];
  const host = hostOf(item.url);

  return (
    <View style={[styles.row, item.isRead && styles.rowRead]}>
      <TouchableOpacity
        style={[styles.checkbox, item.isRead && styles.checkboxOn]}
        onPress={() => onToggleRead(item.id)}
        activeOpacity={0.7}
        hitSlop={8}
      >
        {item.isRead ? (
          <Ionicons name="checkmark" size={14} color="#fff" />
        ) : null}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.body}
        onPress={() => onOpen(item)}
        activeOpacity={0.7}
      >
        <View style={styles.topLine}>
          <View style={[styles.typeChip, { backgroundColor: `${meta.color}1A` }]}>
            <Ionicons name={meta.icon} size={11} color={meta.color} />
            <Text style={[styles.typeChipText, { color: meta.color }]}>{meta.label}</Text>
          </View>
          {item.notifyAt ? (
            <View style={styles.notifyPill}>
              <Ionicons name="notifications-outline" size={11} color={colors.accent} />
            </View>
          ) : null}
        </View>

        <Text
          style={[styles.title, item.isRead && styles.titleRead]}
          numberOfLines={2}
        >
          {item.title}
        </Text>

        <Text style={styles.host} numberOfLines={1}>
          {host}
        </Text>

        {item.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        {item.note ? (
          <Text style={styles.note} numberOfLines={1}>
            {item.note}
          </Text>
        ) : null}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.editBtn}
        onPress={() => onEdit(item.id)}
        activeOpacity={0.7}
        hitSlop={8}
      >
        <Ionicons name="ellipsis-horizontal" size={18} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowRead: {
    opacity: 0.6,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    backgroundColor: colors.cardElevated,
  },
  checkboxOn: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
  },
  typeChipText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  notifyPill: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.accent}14`,
    borderWidth: 1,
    borderColor: `${colors.accent}33`,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 20,
  },
  titleRead: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  host: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  description: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  note: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
    fontStyle: 'italic',
  },
  editBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
