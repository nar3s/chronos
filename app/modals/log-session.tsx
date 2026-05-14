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
import { useStudyStore } from '@/src/store/studyStore';
import { useStudyPlanStore } from '@/src/store/studyPlanStore';
import { useSnapshotStore } from '@/src/store/snapshotStore';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { getToday } from '@/src/utils/dates';
import { DEFAULT_TOPICS } from '@/src/domain/constants/topics';
import { parseISO, format } from 'date-fns';

export default function LogSessionModal() {
  const { sessionId, date: initialDate, topic: initialTopic, subtopic: initialSubtopic, prefillMinutes } = useLocalSearchParams<{
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

  const defaultIds = DEFAULT_TOPICS.map((topic) => topic.id);
  const customTopics = [
    ...new Set(sessions.map((session) => session.topic).filter((topic) => !defaultIds.includes(topic))),
  ];

  const [topic, setTopic] = useState(initialTopic ?? editingSession?.topic ?? '');
  const [customTopicInput, setCustomTopicInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [subtopic, setSubtopic] = useState(initialSubtopic ?? editingSession?.subtopic ?? '');
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
    if (!topic || !subtopic.trim() || Number.isNaN(durationMinutes) || durationMinutes <= 0) return;

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

      // Mark morning block started on first session of today
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

      // Auto-complete matching planned item
      const planToComplete = planItems.find(
        (i) => i.date === sessionDate && i.topic === topic && i.subtopic.toLowerCase() === subtopic.trim().toLowerCase() && !i.completed
      );
      if (planToComplete) {
        setPlanItems({
          items: planItems.map((i) =>
            i.id === planToComplete.id ? { ...i, completed: true } : i
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
        <Text style={styles.modalTitle}>{editingSession ? 'Edit Session' : 'Log Session'}</Text>

        {isDateLocked && (
          <>
            <Text style={styles.fieldLabel}>Date</Text>
            <View style={styles.lockedDateContainer}>
              <Text style={styles.lockedDateText}>
                {format(parseISO(sessionDate), 'EEEE, MMMM d, yyyy')}
              </Text>
              <Text style={styles.lockedIcon}>🔒</Text>
            </View>
          </>
        )}

        <Text style={styles.fieldLabel}>Topic</Text>
        <View style={styles.topicRow}>
          {allTopics.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.topicChip, topic === item.id && styles.topicChipActive]}
              onPress={() => handleSelectTopic(item.id)}
            >
              <Text style={[styles.topicLabel, topic === item.id && styles.topicLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.topicChip, styles.addTopicChip]}
            onPress={() => setShowCustomInput(true)}
          >
            <Text style={styles.addTopicText}>+ New</Text>
          </TouchableOpacity>
        </View>

        {showCustomInput && (
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
            >
              <Text style={styles.customTopicBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.fieldLabel}>Subtopic</Text>
        <TextInput
          style={styles.input}
          value={subtopic}
          onChangeText={setSubtopic}
          placeholder="e.g. Epsilon-Delta Proofs"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.fieldLabel}>Duration (minutes)</Text>
        <TextInput
          style={styles.input}
          value={minutes}
          onChangeText={setMinutes}
          keyboardType="number-pad"
          placeholder="e.g. 90"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.fieldLabel}>What did you study? (optional)</Text>
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

        <TouchableOpacity
          style={[styles.saveBtn, (!topic || !subtopic.trim()) && styles.btnDisabled]}
          onPress={handleSave}
          disabled={!topic || !subtopic.trim()}
        >
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
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  lockedDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardElevated,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  lockedDateText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  lockedIcon: {
    fontSize: 16,
    opacity: 0.5,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.base,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  topicRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  topicChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  topicChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  topicLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  topicLabelActive: { color: '#fff' },
  addTopicChip: {
    borderStyle: 'dashed',
    borderColor: colors.accent,
  },
  addTopicText: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: '600',
  },
  customTopicRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  customTopicInput: { flex: 1 },
  customTopicBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  customTopicBtnText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: spacing.base,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notesInput: {
    minHeight: 80,
    paddingTop: spacing.md,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  btnDisabled: { opacity: 0.4 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
