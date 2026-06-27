import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '@/src/components/atoms/Badge';
import { ConfirmationSheet } from '@/src/components/molecules/ConfirmationSheet';
import { SectionHeader } from '@/src/components/molecules/SectionHeader';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
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
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Ionicons name="book-outline" size={18} color={colors.accent} />
          </View>
          <View style={styles.emptyBody}>
            <Text style={styles.emptyTitle}>No sessions logged yet</Text>
            <Text style={styles.empty}>Start with one focused block today.</Text>
          </View>
          <TouchableOpacity
            style={styles.emptyAction}
            onPress={() => router.push('/modals/log-session' as any)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={16} color={colors.accent} />
          </TouchableOpacity>
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
              <View style={[styles.accentRail, { backgroundColor: topic.color }]} />
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
                  <Ionicons name="create-outline" size={13} color={colors.textSecondary} />
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
                {onDelete ? (
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => setPendingDeleteId(session.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trash-outline" size={13} color={colors.danger} />
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
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.accent}18`,
    borderWidth: 1,
    borderColor: `${colors.accent}33`,
  },
  emptyBody: {
    flex: 1,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  emptyAction: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.accent}14`,
    borderWidth: 1,
    borderColor: `${colors.accent}33`,
  },
  empty: {
    fontSize: 14,
    color: colors.textMuted,
  },
  row: {
    position: 'relative',
    paddingVertical: 10,
    paddingLeft: 10,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  accentRail: {
    position: 'absolute',
    left: 0,
    top: 12,
    bottom: 12,
    width: 3,
    borderRadius: 99,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
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
