import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ScreenTemplate } from '@/src/components/templates/ScreenTemplate';
import { ScreenHeader } from '@/src/components/molecules/ScreenHeader';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface MenuItem {
  id: string;
  icon: IoniconsName;
  label: string;
  description: string;
  color: string;
  route: string;
}

// Device personalization tools. Add future tweaks (themes, app icon, ringtone,
// etc.) here and they nest under the single More > Personalization entry.
const ITEMS: MenuItem[] = [
  {
    id: 'wallpaper',
    icon: 'image-outline',
    label: 'Wallpaper',
    description: 'Change now or schedule swaps',
    color: colors.accent,
    route: '/more/wallpaper',
  },
];

const STAGGER = 60;

export function PersonalizeScreen() {
  return (
    <ScreenTemplate>
      <ScreenHeader title="Personalization" />

      <Text style={styles.subtitle}>Make the device feel like yours.</Text>

      <View style={styles.grid}>
        {ITEMS.map((item, i) => (
          <View key={item.id} style={styles.cell}>
            <Animated.View entering={FadeInDown.duration(400).delay(STAGGER * (i + 1))}>
              <TouchableOpacity
                style={styles.tile}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.8}
              >
                <View style={[styles.iconBox, { backgroundColor: `${item.color}18` }]}>
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
                <View>
                  <Text style={styles.tileLabel} numberOfLines={1}>
                    {item.label}
                  </Text>
                  <Text style={styles.tileDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>
        ))}
      </View>
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  backBtn: { padding: 4, width: 30 },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.base,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  cell: {
    width: '50%',
    padding: 5,
  },
  tile: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.base,
    minHeight: 118,
    justifyContent: 'space-between',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  tileLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 3,
  },
  tileDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});
