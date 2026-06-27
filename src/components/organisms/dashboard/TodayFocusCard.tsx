import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/src/theme/colors';

interface StudyFocus {
  subtopic: string;
  topic: string;
}

interface GymFocus {
  label: string;
  subtitle: string;
}

interface Props {
  study: StudyFocus;
  gym: GymFocus;
}

export function TodayFocusCard({ study, gym }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.card}>
        <Text style={styles.label}>MATH</Text>
        <Text style={styles.title} numberOfLines={2}>{study.subtopic}</Text>
        <Text style={styles.sub}>{study.topic}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>GYM</Text>
        <Text style={styles.title}>{gym.label}</Text>
        <Text style={styles.sub}>{gym.subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  card: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
