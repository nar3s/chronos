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

export function TodaySessionsList({ sessions, onDelete }: Props) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  function handleConfirmDelete() {
    if (!onDelete || !pendingDeleteId) return;
    onDelete(pendingDeleteId);
    setPendingDeleteId(null);
  }

  if (sessions.length === 0) {
    return (
      <View>
        <SectionHeader title="Today's Sessions" />
        <View style={styles.card}>
          <Text style={styles.empty}>No sessions logged yet today</Text>
        </View>
      </View>
    );
  }

  return (
    <View>
      <SectionHeader title="Today's Sessions" />
      <View style={styles.card}>
        {sessions.map((session, index) => {
          const topic = getTopicDisplay(session.topic);
          return (
            <View key={session.id} style={[styles.row, index > 0 && styles.rowBorder]}>
              <View style={styles.topRow}>
                <Badge label={topic.label} color={topic.color} bg={`${topic.color}20`} />
                <Text style={styles.duration}>{minutesToHHMM(session.durationMinutes)}</Text>
              </View>
              <Text style={styles.subtopic}>{session.subtopic}</Text>
              {session.notes ? <Text style={styles.notes} numberOfLines={1}>{session.notes}</Text> : null}
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
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  empty: {
    fontSize: 14,
    color: colors.textMuted,
  },
  row: {
    paddingVertical: 10,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  duration: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
    fontVariant: ['tabular-nums'],
  },
  subtopic: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 8,
  },
  notes: {
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
