import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ScreenTemplate } from '@/src/components/templates/ScreenTemplate';
import { useHabitStore } from '@/src/store/habitStore';
import { getToday } from '@/src/utils/dates';
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

const STATIC_ITEMS: MenuItem[] = [
  {
    id: 'insights',
    icon: 'sparkles-outline',
    label: 'AI Insights',
    description: 'Daily insight + reflections from your AI companion',
    color: colors.accent,
    route: '/more/insights',
  },
  {
    id: 'blocker',
    icon: 'shield-checkmark-outline',
    label: 'Distraction Blocker',
    description: 'Block apps after 9 PM until daily logs are done',
    color: colors.danger,
    route: '/more/blocker',
  },
  {
    id: 'screentime',
    icon: 'time-outline',
    label: 'Screen Time',
    description: 'Track today\'s app usage in foreground',
    color: colors.warning,
    route: '/more/screen-time',
  },
  {
    id: 'settings',
    icon: 'settings-outline',
    label: 'Settings',
    description: 'AI companion, goals, topics, workout cycle',
    color: colors.textSecondary,
    route: '/settings',
  },
];

const STAGGER = 80;

export function MoreScreen() {
  const habits = useHabitStore((s) => s.habits);
  const allLogs = useHabitStore((s) => s.logs);
  const today = getToday();
  const done = allLogs.filter((l) => l.date === today).length;
  const total = habits.length;
  const habitDesc = total > 0 ? `${done}/${total} done today` : 'Build daily habits and track streaks';

  const allItems: MenuItem[] = [
    {
      id: 'habits',
      icon: 'checkmark-circle-outline',
      label: 'Habits',
      description: habitDesc,
      color: colors.success,
      route: '/more/habits',
    },
    ...STATIC_ITEMS,
  ];

  return (
    <ScreenTemplate>
      <Animated.View entering={FadeInDown.duration(400).delay(0)} style={styles.header}>
        <Text style={styles.heading}>More</Text>
      </Animated.View>

      {allItems.map((item, i) => (
        <Animated.View
          key={item.id}
          entering={FadeInDown.duration(400).delay(STAGGER * (i + 1))}
        >
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(item.route as any)}
            activeOpacity={0.75}
          >
            <View style={[styles.iconBox, { backgroundColor: `${item.color}18` }]}>
              <Ionicons name={item.icon} size={22} color={item.color} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardLabel}>{item.label}</Text>
              <Text style={styles.cardDesc}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </Animated.View>
      ))}
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 8,
    marginBottom: spacing.lg,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.base,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1 },
  cardLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
});
