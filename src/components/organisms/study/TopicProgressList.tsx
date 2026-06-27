import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProgressBar } from '@/src/components/atoms/ProgressBar';
import { colors } from '@/src/theme/colors';

interface TopicItem {
  topicId: string;
  label: string;
  color: string;
  pct: number;
}

interface Props {
  topics: TopicItem[];
}

export function TopicProgressList({ topics }: Props) {
  return (
    <>
      {topics.map((t) => (
        <View key={t.topicId} style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.name}>{t.label}</Text>
            <Text style={[styles.pct, { color: t.color }]}>{t.pct}%</Text>
          </View>
          <ProgressBar value={t.pct} max={100} color={t.color} />
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  name: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  pct: {
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});
