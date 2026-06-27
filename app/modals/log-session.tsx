import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStudyStore } from '@/src/store/studyStore';
import { useStudyPlanStore } from '@/src/store/studyPlanStore';
import { useSnapshotStore } from '@/src/store/snapshotStore';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { getToday } from '@/src/utils/dates';
import { DEFAULT_TOPICS } from '@/src/domain/constants/topics';
import { parseISO, format } from 'date-fns';

export default function LogSessionModal() {
  const {
    sessionId,
    date: initialDate,
    topic: initialTopic,
    subtopic: initialSubtopic,
    prefillMinutes,
  } = useLocalSearchParams<{
    sessionId?: string;
    date?: string;
    topic?: string;
    subtopic?: string;
    prefillMinutes?: string;
  }>();

  const addSession = useStudyStore((state) => state.addSession);
  const updateSession = useStudyStore((state) => state.updateSession);
  const sessions = useStudyStore((state) => state.sessions);
  const planItems = useStudyPlanStore((state) => state.items);
  const setPlanItems = useStudyPlanStore.setState;
  const snapshot = useSnapshotStore();

  const editingSession = useMemo(
    () => sessions.find((session) => session.id === sessionId),
    [sessionId, sessions]
  );

  const defaultIds = DEFAULT_TOPICS.map((item) => item.id);
  const customTopics = [
    ...new Set(
      sessions
        .map((session) => session.topic)
        .filter((item) => !defaultIds.includes(item))
    ),
  ];

  const [topic, setTopic] = useState(initialTopic ?? editingSession?.topic ?? '');
  const [customTopicInput, setCustomTopicInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [subtopic, setSubtopic] = useState(
    initialSubtopic ?? editingSession?.subtopic ?? ''
  );
  const [minutes, setMinutes] = useState(
    editingSession ? String(editingSession.durationMinutes) : prefillMinutes ?? ''
  );
  const [notes, setNotes] = useState(editingSession?.notes ?? '');

  const sessionDate = initialDate ?? editingSession?.date ?? getToday();
  const isDateLocked = !!initialDate;

  function handleSelectTopic(id: string) {
    setTopic(id);
    setShowCustomInput(false);
    setCustomTopicInput('');
  }

  function handleAddCustomTopic() {
    const trimmed = customTopicInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (!trimmed) return;
    setTopic(trimmed);
    setCustomTopicInput('');
    setShowCustomInput(false);
  }

  function handleSave() {
    const durationMinutes = parseInt(minutes, 10);
    if (!topic || !subtopic.trim() || Number.isNaN(durationMinutes) || durationMinutes <= 0) {
      return;
    }

    if (editingSession) {
      updateSession(editingSession.id, {
        topic,
        subtopic: subtopic.trim(),
        durationMinutes,
        notes: notes.trim() || undefined,
      });
    } else {
      addSession({
        id: Date.now().toString(),
        date: sessionDate,
        topic,
        subtopic: subtopic.trim(),
        durationMinutes,
        notes: notes.trim() || undefined,
      });

      if (sessionDate === getToday()) {
        const todaySnap = snapshot.getTodaySnapshot();
        if (!todaySnap?.morningBlockStarted) {
          const now = new Date();
          const hh = String(now.getHours()).padStart(2, '0');
          const mm = String(now.getMinutes()).padStart(2, '0');
          snapshot.updateSnapshot(sessionDate, {
            morningBlockStarted: true,
            morningBlockTime: `${hh}:${mm}`,
          });
        }
      }

      const planToComplete = planItems.find(
        (item) =>
          item.date === sessionDate &&
          item.topic === topic &&
          item.subtopic.toLowerCase() === subtopic.trim().toLowerCase() &&
          !item.completed
      );
      if (planToComplete) {
        setPlanItems({
          items: planItems.map((item) =>
            item.id === planToComplete.id ? { ...item, completed: true } : item
          ),
        });
      }
    }

    router.back();
  }

  const allTopics = [
    ...DEFAULT_TOPICS,
    ...customTopics.map((id) => ({
      id,
      label: id.replace(/-/g, ' '),
      color: colors.warning,
    })),
  ];

  const canSave = !!topic && !!subtopic.trim() && parseInt(minutes, 10) > 0;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerCard}>
          <Text style={styles.kicker}>STUDY SESSION</Text>
          <Text style={styles.modalTitle}>
            {editingSession ? 'Edit session' : 'Log session'}
          </Text>
          {isDateLocked ? (
            <View style={styles.lockedDateContainer}>
              <Ionicons name="lock-closed-outline" size={15} color={colors.textSecondary} />
              <Text style={styles.lockedDateText}>
                {format(parseISO(sessionDate), 'EEEE, MMMM d, yyyy')}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Topic</Text>
          <View style={styles.topicRow}>
            {allTopics.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.topicChip, topic === item.id && styles.topicChipActive]}
                onPress={() => handleSelectTopic(item.id)}
                activeOpacity={0.75}
              >
                <Text style={[styles.topicLabel, topic === item.id && styles.topicLabelActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.topicChip, styles.addTopicChip]}
              onPress={() => setShowCustomInput(true)}
              activeOpacity={0.75}
            >
              <Ionicons name="add" size={13} color={colors.accent} />
              <Text style={styles.addTopicText}>New</Text>
            </TouchableOpacity>
          </View>

          {showCustomInput ? (
            <View style={styles.customTopicRow}>
              <TextInput
                style={[styles.input, styles.customTopicInput]}
                value={customTopicInput}
                onChangeText={setCustomTopicInput}
                placeholder="e.g. Probability"
                placeholderTextColor={colors.textMuted}
                autoFocus
                autoCapitalize="words"
              />
              <TouchableOpacity
                style={[styles.customTopicBtn, !customTopicInput.trim() && styles.btnDisabled]}
                onPress={handleAddCustomTopic}
                disabled={!customTopicInput.trim()}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={15} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Subtopic</Text>
          <TextInput
            style={styles.input}
            value={subtopic}
            onChangeText={setSubtopic}
            placeholder="e.g. Epsilon-Delta Proofs"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Duration</Text>
          <TextInput
            style={styles.input}
            value={minutes}
            onChangeText={setMinutes}
            keyboardType="number-pad"
            placeholder="Minutes, e.g. 90"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Notes</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Key concepts, problems solved, pages covered..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, !canSave && styles.btnDisabled]}
          onPress={handleSave}
          disabled={!canSave}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark" size={16} color="#fff" />
          <Text style={styles.saveBtnText}>
            {editingSession ? 'Update Session' : 'Save Session'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.base, paddingBottom: spacing.xxxl },
  headerCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    letterSpacing: -0.3,
    textAlign: 'left',
  },
  lockedDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.cardElevated,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  lockedDateText: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  topicRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardElevated,
  },
  topicChipActive: {
    backgroundColor: `${colors.accent}24`,
    borderColor: colors.accent,
  },
  topicLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  topicLabelActive: {
    color: colors.accent,
  },
  addTopicChip: {
    borderStyle: 'dashed',
    borderColor: colors.accent,
  },
  addTopicText: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: '700',
  },
  customTopicRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  customTopicInput: {
    flex: 1,
  },
  customTopicBtn: {
    width: 42,
    backgroundColor: colors.accent,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: colors.cardElevated,
    borderRadius: 10,
    padding: spacing.md,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notesInput: {
    minHeight: 76,
    paddingTop: spacing.sm,
    textAlignVertical: 'top',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 13,
    marginTop: spacing.sm,
  },
  btnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
