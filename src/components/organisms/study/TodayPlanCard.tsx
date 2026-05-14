import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Badge } from '@/src/components/atoms/Badge';
import { SectionHeader } from '@/src/components/molecules/SectionHeader';
import { colors } from '@/src/theme/colors';
import { minutesToHHMM } from '@/src/utils/formatters';
import { getTopicDisplay } from '@/src/domain/constants/topics';
import type { PlannedStudyItem } from '@/src/domain/types/studyPlan';

interface Props {
  items: PlannedStudyItem[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TodayPlanCard({ items, onToggle, onDelete }: Props) {
  if (items.length === 0) return null;

  const done = items.filter((i) => i.completed).length;

  return (
    <View>
      <SectionHeader title={`Today's Plan (${done}/${items.length})`} />
      <View style={styles.card}>
        {items.map((item, i) => {
          const topic = getTopicDisplay(item.topic);
          return (
            <View key={item.id} style={[styles.row, i > 0 && styles.rowBorder]}>
              <TouchableOpacity
                style={[styles.checkbox, item.completed && styles.checkboxDone]}
                onPress={() => onToggle(item.id)}
              >
                {item.completed && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
              <View style={styles.info}>
                <View style={styles.topRow}>
                  <Badge label={topic.label} color={topic.color} bg={`${topic.color}20`} />
                  <Text style={styles.time}>{minutesToHHMM(item.plannedMinutes)}</Text>
                </View>
                <Text
                  style={[styles.subtopic, item.completed && styles.subtopicDone]}
                  numberOfLines={1}
                >
                  {item.subtopic}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => onDelete(item.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.deleteText}>✕</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  time: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
    fontVariant: ['tabular-nums'],
  },
  subtopic: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    marginTop: 4,
  },
  subtopicDone: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  deleteBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(239,68,68,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    fontSize: 11,
    color: colors.danger,
    fontWeight: '600',
  },
});
