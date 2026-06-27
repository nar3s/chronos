import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import type { WallpaperItem } from '@/src/domain/types/wallpaper';

function toUri(path: string): string {
  return /^(file|content):\/\//.test(path) ? path : `file://${path}`;
}

interface Props {
  items: WallpaperItem[];
  defaultId: string | null;
  onAdd(): void;
  onApply(item: WallpaperItem): void;
  onDelete(item: WallpaperItem): void;
  onSetDefault(id: string | null): void;
}

export function WallpaperLibraryGrid({
  items,
  defaultId,
  onAdd,
  onApply,
  onDelete,
  onSetDefault,
}: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Library</Text>
        <Text style={styles.hint}>Long-press a tile to mark default</Text>
      </View>
      <View style={styles.grid}>
        <View style={styles.cell}>
          <TouchableOpacity style={[styles.tile, styles.addTile]} onPress={onAdd} activeOpacity={0.75}>
            <Ionicons name="add" size={24} color={colors.accent} />
            <Text style={styles.addText}>Add</Text>
          </TouchableOpacity>
        </View>

        {items.map((item) => {
          const isDefault = item.id === defaultId;
          return (
            <View key={item.id} style={styles.cell}>
              <TouchableOpacity
                style={[styles.tile, isDefault && styles.tileDefault]}
                onPress={() => onApply(item)}
                onLongPress={() => onSetDefault(isDefault ? null : item.id)}
                delayLongPress={350}
                activeOpacity={0.8}
              >
                <Image source={{ uri: toUri(item.localPath) }} style={styles.image} resizeMode="cover" />
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => onDelete(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={13} color={colors.textPrimary} />
                </TouchableOpacity>
                {isDefault ? (
                  <View style={styles.defaultBadge}>
                    <Ionicons name="star" size={11} color={colors.bg} />
                  </View>
                ) : null}
                <View style={styles.nameTag}>
                  <Text style={styles.nameText} numberOfLines={1}>
                    {isDefault ? `Default · ${item.name}` : item.name}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
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
  hint: {
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  tileDefault: {
    borderColor: colors.warning,
  },
  defaultBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  cell: {
    width: '33.333%',
    padding: 4,
  },
  tile: {
    width: '100%',
    aspectRatio: 0.5,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.cardElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addTile: {
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderColor: `${colors.accent}55`,
  },
  addText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.accent,
    marginTop: 4,
  },
  image: { width: '100%', height: '100%' },
  deleteBtn: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameTag: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  nameText: {
    fontSize: 10,
    color: colors.textPrimary,
    fontWeight: '600',
  },
});
