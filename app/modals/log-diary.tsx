import React, { useState } from 'react';
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
import { useDiaryStore } from '@/src/store/diaryStore';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { getToday } from '@/src/utils/dates';
import { format, parseISO } from 'date-fns';
import type { MoodType, TaskCategory } from '@/src/domain/types/diary';

const MOODS: { value: MoodType; label: string; color: string }[] = [
  { value: 'great', label: 'Great', color: colors.success },
  { value: 'good', label: 'Good', color: colors.accent },
  { value: 'okay', label: 'Okay', color: colors.warning },
  { value: 'rough', label: 'Rough', color: colors.danger },
];

const CATEGORIES: TaskCategory[] = ['study', 'gym', 'personal', 'work', 'other'];

const CATEGORY_COLORS: Record<TaskCategory, string> = {
  study: colors.accent,
  gym: colors.success,
  personal: colors.purple,
  work: colors.warning,
  other: colors.textMuted,
};

interface PendingTask {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
}

export default function LogDiaryModal() {
  const { date: dateParam } = useLocalSearchParams<{ date?: string }>();
  const date = dateParam ?? getToday();

  const existingEntry = useDiaryStore.getState().getEntryByDate(date);
  const existingTasks = useDiaryStore.getState().getTasksByDate(date);
  const upsertEntry = useDiaryStore((s) => s.upsertEntry);
  const addTask = useDiaryStore((s) => s.addTask);

  const legacyText: string | undefined = (existingEntry as any)?.text;
  const initialHighlights: string[] = existingEntry?.highlights?.length
    ? existingEntry.highlights
    : legacyText
    ? [legacyText]
    : [];

  const [mood, setMood] = useState<MoodType | null>(existingEntry?.mood ?? null);
  const [highlights, setHighlights] = useState<string[]>(initialHighlights);
  const [highlightInput, setHighlightInput] = useState('');
  const [takeaway, setTakeaway] = useState((existingEntry as any)?.takeaway ?? '');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskCategory, setTaskCategory] = useState<TaskCategory>('study');
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);

  const dateLabel = format(parseISO(date), 'EEEE, MMMM d, yyyy');
  const isEditing = !!existingEntry;

  function handleAddHighlight() {
    const val = highlightInput.trim();
    if (!val) return;
    setHighlights((prev) => [...prev, val]);
    setHighlightInput('');
  }

  function handleRemoveHighlight(index: number) {
    setHighlights((prev) => prev.filter((_, i) => i !== index));
  }

  function handleAddTask() {
    if (!taskTitle.trim()) return;
    setPendingTasks((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        category: taskCategory,
      },
    ]);
    setTaskTitle('');
    setTaskDesc('');
    setTaskCategory('study');
  }

  function handleRemovePending(id: string) {
    setPendingTasks((prev) => prev.filter((task) => task.id !== id));
  }

  function handleSave() {
    const allTasks: PendingTask[] = taskTitle.trim()
      ? [
          ...pendingTasks,
          {
            id: Date.now().toString(),
            title: taskTitle.trim(),
            description: taskDesc.trim(),
            category: taskCategory,
          },
        ]
      : pendingTasks;

    if (highlights.length > 0 || takeaway.trim() || mood) {
      upsertEntry({
        id: existingEntry?.id ?? Date.now().toString(),
        date,
        highlights,
        takeaway: takeaway.trim(),
        mood,
      });
    }

    allTasks.forEach((task) => {
      addTask({
        id: `${task.id}-task`,
        date,
        title: task.title,
        description: task.description || undefined,
        category: task.category,
      });
    });

    router.back();
  }

  const canSave = !!(
    highlights.length > 0 ||
    takeaway.trim() ||
    mood ||
    pendingTasks.length > 0 ||
    taskTitle.trim()
  );

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
          <Text style={styles.kicker}>JOURNAL ENTRY</Text>
          <Text style={styles.title}>{isEditing ? 'Edit entry' : 'Write entry'}</Text>
          <View style={styles.lockedDate}>
            <Ionicons name="lock-closed-outline" size={15} color={colors.textSecondary} />
            <Text style={styles.lockedDateText}>{dateLabel}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Mood</Text>
          <View style={styles.moodRow}>
            {MOODS.map((item) => {
              const active = mood === item.value;
              return (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.moodChip,
                    active && {
                      backgroundColor: `${item.color}22`,
                      borderColor: item.color,
                    },
                  ]}
                  onPress={() => setMood(active ? null : item.value)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.moodDot,
                      { backgroundColor: active ? item.color : colors.textMuted },
                    ]}
                  />
                  <Text
                    style={[
                      styles.moodLabel,
                      active && { color: item.color, fontWeight: '700' },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Highlights</Text>
          {highlights.map((highlight, index) => (
            <View key={`${highlight}-${index}`} style={styles.highlightRow}>
              <View style={styles.bullet} />
              <Text style={styles.highlightText}>{highlight}</Text>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => handleRemoveHighlight(index)}
                hitSlop={8}
              >
                <Ionicons name="close" size={14} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
          <View style={styles.addRow}>
            <TextInput
              style={[styles.input, styles.addInput]}
              value={highlightInput}
              onChangeText={setHighlightInput}
              placeholder="Add a moment, win or event..."
              placeholderTextColor={colors.textMuted}
              onSubmitEditing={handleAddHighlight}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[styles.addBtn, !highlightInput.trim() && styles.btnDisabled]}
              onPress={handleAddHighlight}
              disabled={!highlightInput.trim()}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Key Takeaway</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={takeaway}
            onChangeText={setTakeaway}
            placeholder="What's the one thing you're taking from today?"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Tasks Done</Text>
          {existingTasks.length > 0 ? (
            <View style={styles.existingTasksNote}>
              <Ionicons name="checkmark-circle-outline" size={15} color={colors.success} />
              <Text style={styles.existingTasksText}>
                {existingTasks.length} task{existingTasks.length > 1 ? 's' : ''} already logged
              </Text>
            </View>
          ) : null}

          {pendingTasks.map((task) => (
            <View key={task.id} style={styles.pendingTask}>
              <View style={styles.pendingTaskLeft}>
                <View
                  style={[
                    styles.categoryPill,
                    { backgroundColor: `${CATEGORY_COLORS[task.category]}22` },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryPillText,
                      { color: CATEGORY_COLORS[task.category] },
                    ]}
                  >
                    {task.category}
                  </Text>
                </View>
                <Text style={styles.pendingTitle}>{task.title}</Text>
                {task.description ? (
                  <Text style={styles.pendingDesc}>{task.description}</Text>
                ) : null}
              </View>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => handleRemovePending(task.id)}
                hitSlop={8}
              >
                <Ionicons name="close" size={14} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          ))}

          <TextInput
            style={styles.input}
            value={taskTitle}
            onChangeText={setTaskTitle}
            placeholder="Task title"
            placeholderTextColor={colors.textMuted}
          />
          <TextInput
            style={styles.input}
            value={taskDesc}
            onChangeText={setTaskDesc}
            placeholder="Description (optional)"
            placeholderTextColor={colors.textMuted}
          />
          <View style={styles.categoryRow}>
            {CATEGORIES.map((cat) => {
              const active = taskCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    active && {
                      backgroundColor: `${CATEGORY_COLORS[cat]}22`,
                      borderColor: CATEGORY_COLORS[cat],
                    },
                  ]}
                  onPress={() => setTaskCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      active && {
                        color: CATEGORY_COLORS[cat],
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity
            style={[styles.ghostBtn, !taskTitle.trim() && styles.btnDisabled]}
            onPress={handleAddTask}
            disabled={!taskTitle.trim()}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={15} color={colors.accent} />
            <Text style={styles.ghostBtnText}>Add task</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, !canSave && styles.btnDisabled]}
          onPress={handleSave}
          disabled={!canSave}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark" size={16} color="#fff" />
          <Text style={styles.saveBtnText}>Save</Text>
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
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: spacing.sm,
    textAlign: 'left',
  },
  lockedDate: {
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
  moodRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardElevated,
  },
  moodDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  moodLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardElevated,
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    flexShrink: 0,
  },
  highlightText: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  iconBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  addRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  addInput: {
    flex: 1,
  },
  addBtn: {
    width: 42,
    alignSelf: 'stretch',
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
    marginBottom: spacing.sm,
  },
  textArea: {
    minHeight: 76,
    paddingTop: spacing.sm,
    textAlignVertical: 'top',
    marginBottom: 0,
  },
  existingTasksNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${colors.success}12`,
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: `${colors.success}33`,
  },
  existingTasksText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  pendingTask: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.cardElevated,
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  pendingTaskLeft: {
    flex: 1,
    gap: 3,
  },
  pendingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  pendingDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 4,
  },
  categoryPillText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardElevated,
  },
  categoryChipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.cardElevated,
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghostBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
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
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
