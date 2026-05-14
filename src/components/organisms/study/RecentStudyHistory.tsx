import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Badge } from '@/src/components/atoms/Badge';
import { ConfirmationSheet } from '@/src/components/molecules/ConfirmationSheet';
import { SectionHeader } from '@/src/components/molecules/SectionHeader';
import { colors } from '@/src/theme/colors';
import { minutesToHHMM } from '@/src/utils/formatters';
import { getTopicDisplay } from '@/src/domain/constants/topics';
import type { StudySession } from '@/src/domain/types/study';

interface Props {
  sessions: StudySession[];
  onDelete?: (id: string) => void;
}

function formatHistoryDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
}

function groupByDate(sessions: StudySession[]): Map<string, StudySession[]> {
  const map = new Map<string, StudySession[]>();
  for (const session of sessions) {
    const items = map.get(session.date) ?? [];
    items.push(session);
    map.set(session.date, items);
  }
  return map;
}

export function RecentStudyHistory({ sessions, onDelete }: Props) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  function handleConfirmDelete() {
    if (!onDelete || !pendingDeleteId) return;
    onDelete(pendingDeleteId);
    setPendingDeleteId(null);
  }

  if (sessions.length === 0) return null;

  const grouped = groupByDate(sessions);

  return (
    <View>
      <SectionHeader title="Previous Study Logs" />
      {[...grouped.entries()].map(([date, daySessions]) => (
        <View key={date} style={styles.dateGroup}>
          <Text style={styles.dateLabel}>{formatHistoryDate(date)}</Text>
          {daySessions.map((session) => {
            const topic = getTopicDisplay(session.topic);
            return (
              <View key={session.id} style={styles.sessionRow}>
                <View style={styles.sessionTop}>
                  <Badge label={topic.label} color={topic.color} bg={`${topic.color}20`} />
                  <Text style={styles.sessionDuration}>{minutesToHHMM(session.durationMinutes)}</Text>
                </View>
                <Text style={styles.sessionSubtopic}>{session.subtopic}</Text>
                {session.notes ? <Text style={styles.sessionNotes} numberOfLines={1}>{session.notes}</Text> : null}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => router.push({ pathname: '/modals/log-session', params: { sessionId: session.id } })}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>
                  {onDelete ? (
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => setPendingDeleteId(session.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.deleteText}>Delete</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      ))}
      <ConfirmationSheet
        visible={pendingDeleteId !== null}
        title="Delete session?"
        message="This study session will be removed permanently."
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={handleConfirmDelete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  dateGroup: {
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
    marginTop: 4,
  },
  sessionRow: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
  },
  sessionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionDuration: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
    fontVariant: ['tabular-nums'],
  },
  sessionSubtopic: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    marginTop: 8,
  },
  sessionNotes: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  editBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.card,
  },
  editText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  deleteBtn: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'rgba(239,68,68,0.15)',
  },
  deleteText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.danger,
  },
});
