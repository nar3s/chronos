import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SectionHeader } from '@/src/components/molecules/SectionHeader';
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
  tasks: DoneTask[];
  onDelete: (id: string) => void;
}

export function DoneTasksList({ tasks, onDelete }: Props) {
  const [selected, setSelected] = useState<DoneTask | null>(null);

  if (tasks.length === 0) return null;

  return (
    <>
      <View>
        <SectionHeader title={`Tasks Done (${tasks.length})`} />
        <View style={styles.card}>
          {tasks.map((task, index) => (
            <TouchableOpacity
              key={task.id}
              style={[styles.taskRow, index > 0 && styles.taskBorder]}
              onPress={() => setSelected(task)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.accentRail,
                  { backgroundColor: CATEGORY_COLORS[task.category] },
                ]}
              />
              <View
                style={[
                  styles.taskIcon,
                  { backgroundColor: `${CATEGORY_COLORS[task.category]}18` },
                ]}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={16}
                  color={CATEGORY_COLORS[task.category]}
                />
              </View>
              <View style={styles.taskContent}>
                <View style={styles.taskTop}>
                  <View
                    style={[
                      styles.categoryChip,
                      { backgroundColor: `${CATEGORY_COLORS[task.category]}22` },
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
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Modal
        visible={!!selected}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setSelected(null)}>
          <Pressable style={styles.dialog} onPress={() => {}}>
            {selected ? (
              <>
                <View style={styles.dialogHeader}>
                  <View
                    style={[
                      styles.dialogCategoryChip,
                      { backgroundColor: `${CATEGORY_COLORS[selected.category]}22` },
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
                    <Ionicons name="close" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.dialogTitle}>{selected.title}</Text>

                {selected.description ? (
                  <Text style={styles.dialogDesc}>{selected.description}</Text>
                ) : null}

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => {
                    onDelete(selected.id);
                    setSelected(null);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.deleteBtnText}>Delete Task</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  taskRow: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 9,
    paddingLeft: 10,
  },
  taskIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  accentRail: {
    position: 'absolute',
    left: 0,
    top: 10,
    bottom: 10,
    width: 3,
    borderRadius: 99,
  },
  taskBorder: {
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
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
  },
  taskDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
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
    borderWidth: 1,
    borderColor: colors.border,
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
    borderRadius: 999,
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
    backgroundColor: `${colors.danger}18`,
    borderWidth: 1,
    borderColor: `${colors.danger}44`,
  },
  deleteBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.danger,
  },
});
