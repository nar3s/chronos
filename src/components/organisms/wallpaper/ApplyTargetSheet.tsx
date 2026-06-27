import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from '@/src/components/molecules/BottomSheet';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import type { WallpaperTarget } from '@/src/domain/types/wallpaper';

interface Props {
  visible: boolean;
  title?: string;
  onSelect(target: WallpaperTarget): void;
  onClose(): void;
}

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const OPTIONS: { target: WallpaperTarget; label: string; icon: IconName }[] = [
  { target: 'home', label: 'Home screen', icon: 'home-outline' },
  { target: 'lock', label: 'Lock screen', icon: 'lock-closed-outline' },
  { target: 'both', label: 'Both screens', icon: 'phone-portrait-outline' },
];

export function ApplyTargetSheet({ visible, title = 'Apply to', onSelect, onClose }: Props) {
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        {OPTIONS.map((o) => (
          <TouchableOpacity
            key={o.target}
            style={styles.row}
            onPress={() => onSelect(o.target)}
            activeOpacity={0.75}
          >
            <View style={styles.iconBox}>
              <Ionicons name={o.icon} size={18} color={colors.accent} />
            </View>
            <Text style={styles.rowLabel}>{o.label}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.accent}18`,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
