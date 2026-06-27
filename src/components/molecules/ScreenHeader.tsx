import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

interface Props {
  title: string;
  /** Optional right-side action (e.g. an add or refresh button). */
  right?: React.ReactNode;
  /** Defaults to router.back(). */
  onBack?: () => void;
}

/**
 * The single back-navigation header for all drill-in (pushed) screens.
 * Top-left back arrow + centered title + optional right action. Slide-up modals
 * use the header's "Close" button instead (configured in app/_layout.tsx).
 */
export function ScreenHeader({ title, right, onBack }: Props) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={onBack ?? (() => router.back())}
        style={styles.leftSide}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
      </TouchableOpacity>

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      <View style={styles.rightSide}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    minHeight: 36,
  },
  leftSide: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSide: {
    minWidth: 36,
    height: 36,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
