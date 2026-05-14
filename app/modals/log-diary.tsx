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

  // backward compat: old entries had `text` instead of `highlights`
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
    setPendingTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function handleSave() {
    // Auto-flush uncommitted task input so typing title + hitting Save works
    const allTasks: PendingTask[] = taskTitle.trim()
      ? [...pendingTasks, { id: Date.now().toString(), title: taskTitle.trim(), description: taskDesc.trim(), category: taskCategory }]
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
    for (const task of allTasks) {
      addTask({
        id: `${task.id}-task`,
        date,
        title: task.title,
        description: task.description || undefined,
        category: task.category,
      });
    }
    router.back();
  }

  const canSave = !!(highlights.length > 0 || takeaway.trim() || mood || pendingTasks.length > 0 || taskTitle.trim());

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
        <Text style={styles.title}>{isEditing ? 'Edit Entry' : 'Write Entry'}</Text>

        <View style={styles.lockedDate}>
          <Text style={styles.lockedDateText}>{dateLabel}</Text>
          <Text style={styles.lockIcon}>🔒</Text>
        </View>

        {/* Mood */}
        <Text style={styles.fieldLabel}>How was it?</Text>
        <View style={styles.moodRow}>
          {MOODS.map((m) => (
            <TouchableOpacity
              key={m.value}
              style={[
                styles.moodChip,
                mood === m.value && { backgroundColor: m.color + '22', borderColor: m.color },
              ]}
              onPress={() => setMood(mood === m.value ? null : m.value)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.moodLabel,
                  mood === m.value && { color: m.color, fontWeight: '700' },
                ]}
              >
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Highlights */}
        <Text style={styles.fieldLabel}>What happened today?</Text>
        {highlights.map((h, i) => (
          <View key={i} style={styles.highlightRow}>
            <View style={styles.bullet} />
            <Text style={styles.highlightText}>{h}</Text>
            <TouchableOpacity onPress={() => handleRemoveHighlight(i)} hitSlop={8}>
              <Text style={styles.removeBtn}>✕</Text>
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
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Takeaway */}
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

        {/* Tasks Done */}
        <Text style={styles.fieldLabel}>Tasks Done</Text>

        {existingTasks.length > 0 && (
          <View style={styles.existingTasksNote}>
            <Text style={styles.existingTasksText}>
              {existingTasks.length} task{existingTasks.length > 1 ? 's' : ''} already logged — add more below
            </Text>
          </View>
        )}

        {pendingTasks.map((task) => (
          <View key={task.id} style={styles.pendingTask}>
            <View style={styles.pendingTaskLeft}>
              <View
                style={[
                  styles.categoryPill,
                  { backgroundColor: CATEGORY_COLORS[task.category] + '22' },
                ]}
              >
                <Text style={[styles.categoryPillText, { color: CATEGORY_COLORS[task.category] }]}>
                  {task.category}
                </Text>
              </View>
              <View style={styles.pendingTaskText}>
                <Text style={styles.pendingTitle}>{task.title}</Text>
                {task.description ? (
                  <Text style={styles.pendingDesc}>{task.description}</Text>
                ) : null}
              </View>
            </View>
            <TouchableOpacity onPress={() => handleRemovePending(task.id)} hitSlop={8}>
              <Text style={styles.removeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.taskForm}>
          <TextInput
            style={styles.input}
            value={taskTitle}
            onChangeText={setTaskTitle}
            placeholder="Task title (required)"
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
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  taskCategory === cat && {
                    backgroundColor: CATEGORY_COLORS[cat] + '22',
                    borderColor: CATEGORY_COLORS[cat],
                  },
                ]}
                onPress={() => setTaskCategory(cat)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    taskCategory === cat && {
                      color: CATEGORY_COLORS[cat],
                      fontWeight: '700',
                    },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.addTaskBtn, !taskTitle.trim() && styles.btnDisabled]}
            onPress={handleAddTask}
            disabled={!taskTitle.trim()}
            activeOpacity={0.8}
          >
            <Text style={styles.addTaskBtnText}>+ Add Task</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, !canSave && styles.btnDisabled]}
          onPress={handleSave}
          disabled={!canSave}
          activeOpacity={0.8}
        >
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    letterSpacing: -0.3,
  },
  lockedDate: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardElevated,
    padding: spacing.base,
    borderRadius: 12,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  lockedDateText: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  lockIcon: {
    fontSize: 14,
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
  moodRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  moodChip: {
    paddingHorizontal: spacing.base,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  moodLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
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
  addRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  addInput: {
    flex: 1,
    marginBottom: 0,
  },
  addBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: spacing.base,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  textArea: {
    minHeight: 80,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },
  existingTasksNote: {
    backgroundColor: colors.cardElevated,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  existingTasksText: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  pendingTask: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  pendingTaskLeft: {
    flex: 1,
    gap: 4,
  },
  pendingTaskText: {
    gap: 2,
  },
  pendingTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  pendingDesc: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  categoryPillText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  removeBtn: {
    fontSize: 14,
    color: colors.textMuted,
    paddingTop: 2,
  },
  taskForm: {
    backgroundColor: colors.cardElevated,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
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
    backgroundColor: colors.card,
  },
  categoryChipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  addTaskBtn: {
    backgroundColor: colors.cardElevated,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  addTaskBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.base,
  },
  btnDisabled: { opacity: 0.4 },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
