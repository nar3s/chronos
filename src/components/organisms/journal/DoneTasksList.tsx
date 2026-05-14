import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useDiaryStore } from '@/src/store/diaryStore';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import type { DoneTask, TaskCategory } from '@/src/domain/types/diary';

const CATEGORY_COLORS: Record<TaskCategory, string> = {
  study: colors.accent,
  gym: colors.success,
  personal: colors.purple,
  work: colors.warning,
  other: colors.textMuted,
};

interface Props {
  date: string;
}

export function DoneTasksList({ date }: Props) {
  const allTasks = useDiaryStore((s) => s.tasks);
  const tasks = allTasks.filter((t) => t.date === date);
  const removeTask = useDiaryStore((s) => s.removeTask);

  const [selected, setSelected] = useState<DoneTask | null>(null);

  if (tasks.length === 0) return null;

  return (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tasks Done</Text>
        {tasks.map((task) => (
          <TouchableOpacity
            key={task.id}
            style={styles.taskRow}
            onPress={() => setSelected(task)}
            activeOpacity={0.7}
          >
            <View style={styles.taskContent}>
              <View style={styles.taskTop}>
                <View
                  style={[
                    styles.categoryChip,
                    { backgroundColor: CATEGORY_COLORS[task.category] + '22' },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      { color: CATEGORY_COLORS[task.category] },
                    ]}
                  >
                    {task.category}
                  </Text>
                </View>
                <Text style={styles.taskTitle} numberOfLines={1}>
                  {task.title}
                </Text>
              </View>
              {task.description ? (
                <Text style={styles.taskDesc} numberOfLines={1}>
                  {task.description}
                </Text>
              ) : null}
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Modal
        visible={!!selected}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setSelected(null)}>
          <Pressable style={styles.dialog} onPress={() => {}}>
            {selected && (
              <>
                <View style={styles.dialogHeader}>
                  <View
                    style={[
                      styles.dialogCategoryChip,
                      { backgroundColor: CATEGORY_COLORS[selected.category] + '22' },
                    ]}
                  >
                    <View
                      style={[
                        styles.dialogCategoryDot,
                        { backgroundColor: CATEGORY_COLORS[selected.category] },
                      ]}
                    />
                    <Text
                      style={[
                        styles.dialogCategoryText,
                        { color: CATEGORY_COLORS[selected.category] },
                      ]}
                    >
                      {selected.category}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelected(null)} hitSlop={10}>
                    <Text style={styles.closeBtn}>✕</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.dialogTitle}>{selected.title}</Text>

                {selected.description ? (
                  <Text style={styles.dialogDesc}>{selected.description}</Text>
                ) : null}

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => {
                    removeTask(selected.id);
                    setSelected(null);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.deleteBtnText}>Delete Task</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.base,
    marginBottom: 12,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  taskContent: {
    flex: 1,
    gap: 4,
  },
  taskTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  categoryChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    flex: 1,
  },
  taskDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  chevron: {
    fontSize: 20,
    color: colors.textMuted,
    marginTop: -1,
  },

  // Modal
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  dialog: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.lg,
    width: '100%',
    gap: spacing.md,
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dialogCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  dialogCategoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dialogCategoryText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  closeBtn: {
    fontSize: 16,
    color: colors.textMuted,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 26,
  },
  dialogDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  deleteBtn: {
    marginTop: spacing.sm,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.danger + '18',
    borderWidth: 1,
    borderColor: colors.danger + '44',
  },
  deleteBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.danger,
  },
});
