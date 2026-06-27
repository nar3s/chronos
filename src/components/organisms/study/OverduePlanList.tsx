import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Badge } from '@/src/components/atoms/Badge';
import { SectionHeader } from '@/src/components/molecules/SectionHeader';
import { colors } from '@/src/theme/colors';
import { getTopicDisplay } from '@/src/domain/constants/topics';
import type { PlannedStudyItem } from '@/src/domain/types/studyPlan';
import { router } from 'expo-router';
import { parseISO, format } from 'date-fns';

interface Props {
  items: PlannedStudyItem[];
}

function formatShortDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'MMM d, yyyy');
  } catch (e) {
    return dateStr;
  }
}

export function OverduePlanList({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <View style={{ marginBottom: 6 }}>
      <SectionHeader title="Overdue Items" />
      {items.map((item) => {
        const topic = getTopicDisplay(item.topic);
        return (
          <TouchableOpacity
            key={item.id}
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => {
              router.push({
                pathname: '/modals/log-session',
                params: {
                  date: item.date,
                  topic: item.topic,
                  subtopic: item.subtopic,
                },
              });
            }}
          >
            <View style={styles.iconContainer}>
              <Text style={styles.logIcon}>!</Text>
            </View>
            <View style={styles.info}>
              <View style={styles.topRow}>
                <Text style={styles.dateLabel}>{formatShortDate(item.date)}</Text>
                <Badge label={topic.label} color={topic.color} bg={`${topic.color}20`} />
              </View>
              <Text style={styles.subtopic} numberOfLines={1}>
                {item.subtopic}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  iconContainer: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: 'rgba(239,68,68,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logIcon: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '800',
  },
  info: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.danger,
  },
  subtopic: {
    fontSize: 13,
    color: colors.textPrimary,
    marginTop: 4,
  },
});
