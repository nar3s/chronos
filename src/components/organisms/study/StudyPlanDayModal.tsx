import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { colors } from '@/src/theme/colors';
import { useStudyStore } from '@/src/store/studyStore';
import { useStudyPlanStore } from '@/src/store/studyPlanStore';
import { getTopicDisplay } from '@/src/domain/constants/topics';
import { Badge } from '@/src/components/atoms/Badge';
import { minutesToHHMM } from '@/src/utils/formatters';

interface Props {
  date: string | null;
  onClose: () => void;
}

export function StudyPlanDayModal({ date, onClose }: Props) {
  const planItems = useStudyPlanStore((s) => s.items);
  const sessions = useStudyStore((s) => s.sessions);

  const { plannedForDay, sessionsForDay, totalPlannedMinutes, totalActualMinutes, adherence } = useMemo(() => {
    if (!date) {
      return { plannedForDay: [], sessionsForDay: [], totalPlannedMinutes: 0, totalActualMinutes: 0, adherence: null };
    }

    const planned = planItems.filter((i) => i.date === date);
    const actual = sessions.filter((s) => s.date === date);

    const plannedMins = planned.reduce((acc, curr) => acc + curr.plannedMinutes, 0);
    const actualMins = actual.reduce((acc, curr) => acc + curr.durationMinutes, 0);

    const adherencePct = plannedMins > 0 ? Math.round((actualMins / plannedMins) * 100) : null;

    return {
      plannedForDay: planned,
      sessionsForDay: actual,
      totalPlannedMinutes: plannedMins,
      totalActualMinutes: actualMins,
      adherence: adherencePct,
    };
  }, [date, planItems, sessions]);

  if (!date) return null;

  const dateObj = new Date(date + 'T00:00:00');
  const dateLabel = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Modal
      visible={true}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          
          <View style={styles.header}>
            <Text style={styles.title}>{dateLabel}</Text>
            {adherence !== null && (
              <View style={[styles.adherenceBadge, { backgroundColor: adherence >= 80 ? colors.success : adherence >= 40 ? colors.warning : colors.danger }]}>
                <Text style={styles.adherenceText}>{adherence}% Adherence</Text>
              </View>
            )}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Planned</Text>
              <Text style={styles.statValue}>{minutesToHHMM(totalPlannedMinutes)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Actual</Text>
              <Text style={styles.statValue}>{minutesToHHMM(totalActualMinutes)}</Text>
            </View>
          </View>

          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
            {plannedForDay.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Planned Tasks</Text>
                {plannedForDay.map(item => {
                  const topic = getTopicDisplay(item.topic);
                  return (
                    <View key={item.id} style={styles.itemRow}>
                      <Badge label={topic.label} color={topic.color} bg={`${topic.color}20`} />
                      <View style={styles.itemInfo}>
                        <Text style={[styles.itemSubtopic, item.completed && styles.itemCompleted]}>{item.subtopic}</Text>
                        <Text style={styles.itemTime}>{minutesToHHMM(item.plannedMinutes)}</Text>
                      </View>
                      {item.completed ? <Text style={styles.checkIcon}>✓</Text> : <Text style={styles.missIcon}>✕</Text>}
                    </View>
                  );
                })}
              </View>
            )}

            {sessionsForDay.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Actual Logs</Text>
                {sessionsForDay.map(session => {
                  const topic = getTopicDisplay(session.topic);
                  return (
                    <View key={session.id} style={styles.itemRow}>
                      <Badge label={topic.label} color={topic.color} bg={`${topic.color}20`} />
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemSubtopic}>{session.subtopic}</Text>
                        <Text style={styles.itemTime}>{minutesToHHMM(session.durationMinutes)}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {plannedForDay.length === 0 && sessionsForDay.length === 0 && (
              <Text style={styles.emptyText}>Nothing planned or logged for this day.</Text>
            )}
          </ScrollView>

          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  adherenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
  },
  adherenceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.cardElevated,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  scrollArea: {
    maxHeight: 400,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardElevated,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    gap: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemSubtopic: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  itemCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  itemTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  checkIcon: {
    fontSize: 18,
    color: colors.success,
    fontWeight: '700',
  },
  missIcon: {
    fontSize: 16,
    color: colors.danger,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    padding: 20,
  },
  closeBtn: {
    backgroundColor: colors.cardElevated,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  closeBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
