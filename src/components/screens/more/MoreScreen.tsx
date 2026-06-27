import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenTemplate } from '@/src/components/templates/ScreenTemplate';
import { useHabitStore } from '@/src/store/habitStore';
import { useReadLaterStore } from '@/src/store/readlaterStore';
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

interface Section {
  title: string;
  items: MenuItem[];
}

const STAGGER = 60;

// Two levels of organisation keep the More tab tidy as the app grows:
//  1. Top-level tools are grouped into the labeled sections below (2-col grid).
//  2. A category that would add several rows nests under one entry that opens
//     its own hub (e.g. Personalization -> PersonalizeScreen holds Wallpaper).
function buildSections(habitDesc: string, readLaterDesc: string): Section[] {
  return [
    {
      title: 'Track',
      items: [
        {
          id: 'habits',
          icon: 'checkmark-circle-outline',
          label: 'Habits',
          description: habitDesc,
          color: colors.success,
          route: '/more/habits',
        },
        {
          id: 'insights',
          icon: 'sparkles-outline',
          label: 'AI Insights',
          description: 'Daily insight & reflections',
          color: colors.accent,
          route: '/more/insights',
        },
        {
          id: 'readlater',
          icon: 'bookmarks-outline',
          label: 'Read Later',
          description: readLaterDesc,
          color: colors.purple,
          route: '/more/read-later',
        },
      ],
    },
    {
      title: 'Focus & limits',
      items: [
        {
          id: 'blocker',
          icon: 'shield-checkmark-outline',
          label: 'Blocker',
          description: 'Block apps after 9 PM',
          color: colors.danger,
          route: '/more/blocker',
        },
        {
          id: 'screentime',
          icon: 'time-outline',
          label: 'Screen Time',
          description: "Today's app usage",
          color: colors.warning,
          route: '/more/screen-time',
        },
        {
          id: 'schedule',
          icon: 'alarm-outline',
          label: 'Reminders',
          description: 'Study, gym, protein times',
          color: colors.purple,
          route: '/more/schedule',
        },
      ],
    },
    {
      title: 'Device',
      items: [
        {
          id: 'personalize',
          icon: 'color-palette-outline',
          label: 'Personalization',
          description: 'Wallpaper & device tweaks',
          color: colors.accent,
          route: '/more/personalize',
        },
        {
          id: 'settings',
          icon: 'settings-outline',
          label: 'Settings',
          description: 'AI, goals, topics, cycle',
          color: colors.textSecondary,
          route: '/settings',
        },
      ],
    },
  ];
}

export function MoreScreen() {
  const habits = useHabitStore((s) => s.habits);
  const allLogs = useHabitStore((s) => s.logs);
  const today = getToday();
  const done = allLogs.filter((l) => l.date === today).length;
  const total = habits.length;
  const habitDesc = total > 0 ? `${done}/${total} done today` : 'Daily habits & streaks';

  const readLaterItems = useReadLaterStore((s) => s.items);
  const unreadReadLater = readLaterItems.filter((i) => !i.isRead).length;
  const readLaterDesc =
    unreadReadLater > 0 ? `${unreadReadLater} to read` : 'Save links to read later';

  const sections = buildSections(habitDesc, readLaterDesc);
  let tileIndex = 0;

  return (
    <ScreenTemplate>
      <Animated.View entering={FadeInDown.duration(400)}>
        <LinearGradient
          colors={['#1a1f2e', '#15171f', '#101218']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <Text style={styles.fieldLabel}>Tools</Text>
          <Text style={styles.heading}>More</Text>
          <Text style={styles.heroSub}>Habits, focus controls, limits, and device tools.</Text>
          <View style={styles.heroDivider} />
          <View style={styles.heroStatRow}>
            <View>
              <Text style={styles.heroStatValue}>{total > 0 ? `${done}/${total}` : '0'}</Text>
              <Text style={styles.heroStatLabel}>habits done today</Text>
            </View>
            <View style={styles.heroIcon}>
              <Ionicons name="grid-outline" size={20} color={colors.accent} />
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.grid}>
            {section.items.map((item) => {
              const delay = STAGGER * (tileIndex + 1);
              tileIndex += 1;
              return (
                <View key={item.id} style={styles.cell}>
                  <Animated.View entering={FadeInDown.duration(400).delay(delay)}>
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
              );
            })}
          </View>
        </View>
      ))}
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
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
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  heroSub: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 4,
  },
  heroDivider: {
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.6,
    marginVertical: spacing.md,
  },
  heroStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.success,
    fontVariant: ['tabular-nums'],
  },
  heroStatLabel: {
    fontSize: 11,
    color: colors.textMuted,
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

  section: {
    marginBottom: spacing.base,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginLeft: 2,
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
