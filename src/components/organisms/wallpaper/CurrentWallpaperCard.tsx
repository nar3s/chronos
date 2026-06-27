import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import type { WallpaperItem } from '@/src/domain/types/wallpaper';

function toUri(path: string): string {
  return /^(file|content):\/\//.test(path) ? path : `file://${path}`;
}

interface Props {
  active: WallpaperItem | null;
  nextLabel: string | null;
  onChangeNow(): void;
}

export function CurrentWallpaperCard({ active, nextLabel, onChangeNow }: Props) {
  return (
    <LinearGradient
      colors={['#1a1f2e', '#15171f', '#101218']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.row}>
        <View style={styles.preview}>
          {active ? (
            <Image source={{ uri: toUri(active.localPath) }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="image-outline" size={26} color={colors.textMuted} />
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.label}>Current wallpaper</Text>
          <Text style={styles.name} numberOfLines={2}>
            {active ? active.name : 'Not set from Chronos'}
          </Text>
          {nextLabel ? (
            <View style={styles.nextRow}>
              <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
              <Text style={styles.next} numberOfLines={1}>
                {nextLabel}
              </Text>
            </View>
          ) : (
            <Text style={styles.nextMuted}>No schedule set</Text>
          )}

          <TouchableOpacity style={styles.btn} onPress={onChangeNow} activeOpacity={0.85}>
            <Ionicons name="color-wand-outline" size={16} color={colors.textPrimary} />
            <Text style={styles.btnText}>Change now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: spacing.base,
    marginBottom: spacing.base,
    borderWidth: 1,
    borderColor: `${colors.accent}1A`,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.base,
  },
  preview: {
    width: 96,
    aspectRatio: 0.5,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: { width: '100%', height: '100%' },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 5,
    letterSpacing: -0.2,
  },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  next: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
  },
  nextMuted: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 8,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 11,
    marginTop: spacing.base,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
