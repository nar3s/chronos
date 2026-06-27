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
import { Toggle } from '@/src/components/atoms/Toggle';
import { BottomSheet } from '@/src/components/molecules/BottomSheet';
import { ScreenHeader } from '@/src/components/molecules/ScreenHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ConfirmationSheet } from '@/src/components/molecules/ConfirmationSheet';
import { TimePickerSheet } from '@/src/components/molecules/TimePickerSheet';
import { useSettingsStore } from '@/src/store/settingsStore';
import {
  CustomReminder,
  DEFAULT_SCHEDULE_CONFIG,
  REMINDER_ICONS,
  REMINDER_TINTS,
  ReminderIcon,
  ScheduleConfig,
  parseHHmm,
  formatHHmm,
} from '@/src/domain/types/settings';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

function formatClockLabel(time: string): string {
  const { hour, minute } = parseHHmm(time);
  const period = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}:${String(minute).padStart(2, '0')} ${period}`;
}

function timeToDate(time: string): Date {
  const { hour, minute } = parseHHmm(time);
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

function makeNewReminder(): CustomReminder {
  return {
    id: `r-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    title: 'New reminder',
    body: 'Tap to customize this nudge.',
    time: '09:00',
    enabled: true,
    icon: 'notifications-outline',
    tint: REMINDER_TINTS[0],
  };
}

export function ScheduleScreen() {
  const insets = useSafeAreaInsets();
  const scheduleConfig = useSettingsStore((s) => s.scheduleConfig);
  const setScheduleConfig = useSettingsStore((s) => s.setScheduleConfig);

  const [draft, setDraft] = useState<ScheduleConfig>(scheduleConfig);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBlockerHour, setEditingBlockerHour] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(scheduleConfig),
    [draft, scheduleConfig],
  );

  function patchReminder(id: string, patch: Partial<CustomReminder>) {
    setDraft((d) => ({
      ...d,
      reminders: d.reminders.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
  }

  function addReminder() {
    const reminder = makeNewReminder();
    setDraft((d) => ({ ...d, reminders: [...d.reminders, reminder] }));
    setEditingId(reminder.id);
  }

  function requestDelete(id: string) {
    setPendingDeleteId(id);
  }

  function confirmDelete() {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    setDraft((d) => ({
      ...d,
      reminders: d.reminders.filter((r) => r.id !== id),
    }));
  }

  const pendingDeleteReminder = pendingDeleteId
    ? draft.reminders.find((r) => r.id === pendingDeleteId) ?? null
    : null;

  function handleSave() {
    setScheduleConfig(draft);
    router.back();
  }

  function handleResetDefaults() {
    setDraft(DEFAULT_SCHEDULE_CONFIG);
  }

  const editingReminder = editingId
    ? draft.reminders.find((r) => r.id === editingId) ?? null
    : null;

  const blockerDate = (() => {
    const d = new Date();
    d.setHours(draft.blockerActiveFromHour, 0, 0, 0);
    return d;
  })();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader title="Schedule & reminders" />
        <View style={styles.introCard}>
          <Text style={styles.fieldLabel}>Schedule</Text>
          <Text style={styles.title}>Reminders</Text>
          <Text style={styles.subtitle}>
            Add as many reminders as you want. Tap one to edit its message, time and look.
          </Text>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>Your reminders</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={addReminder}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={14} color={colors.accent} />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        {draft.reminders.length === 0 ? (
          <View style={[styles.card, styles.emptyCard]}>
            <Ionicons
              name="notifications-off-outline"
              size={22}
              color={colors.textMuted}
            />
            <Text style={styles.emptyTitle}>No reminders yet</Text>
            <Text style={styles.emptySubtitle}>
              Add one to get nudges at the right time.
            </Text>
          </View>
        ) : null}

        {draft.reminders.map((reminder) => (
          <TouchableOpacity
            key={reminder.id}
            style={styles.card}
            onPress={() => setEditingId(reminder.id)}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <View
                style={[styles.iconBox, { backgroundColor: `${reminder.tint}18` }]}
              >
                <Ionicons name={reminder.icon} size={20} color={reminder.tint} />
              </View>
              <View style={styles.cardLabelBlock}>
                <Text style={styles.cardLabel} numberOfLines={1}>
                  {reminder.title}
                </Text>
                <Text style={styles.cardHint} numberOfLines={2}>
                  {reminder.body}
                </Text>
              </View>
              <Toggle
                size="sm"
                value={reminder.enabled}
                onValueChange={(v) => patchReminder(reminder.id, { enabled: v })}
              />
            </View>

            <View
              style={[
                styles.metaRow,
                !reminder.enabled && styles.metaRowDisabled,
              ]}
            >
              <View style={styles.metaItem}>
                <Ionicons
                  name="time-outline"
                  size={13}
                  color={colors.textMuted}
                />
                <Text style={styles.metaValue}>
                  {formatClockLabel(reminder.time)}
                </Text>
              </View>
              {reminder.dismissIf === 'studyLogged' ? (
                <View style={styles.smartTag}>
                  <Ionicons
                    name="sparkles-outline"
                    size={11}
                    color={colors.accent}
                  />
                  <Text style={styles.smartTagText}>
                    Auto-skips if studied
                  </Text>
                </View>
              ) : null}
              <View style={{ flex: 1 }} />
              <TouchableOpacity
                hitSlop={10}
                onPress={() => requestDelete(reminder.id)}
              >
                <Ionicons
                  name="trash-outline"
                  size={15}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionHeader}>Distraction blocker</Text>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View
              style={[styles.iconBox, { backgroundColor: `${colors.danger}18` }]}
            >
              <Ionicons name="moon-outline" size={20} color={colors.danger} />
            </View>
            <View style={styles.cardLabelBlock}>
              <Text style={styles.cardLabel}>Active from</Text>
              <Text style={styles.cardHint}>
                Hour after which pending logs trigger app blocking.
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.metaRow}
            onPress={() => setEditingBlockerHour(true)}
            activeOpacity={0.7}
          >
            <View style={styles.metaItem}>
              <Ionicons
                name="time-outline"
                size={13}
                color={colors.textMuted}
              />
              <Text style={styles.metaValue}>
                {formatClockLabel(
                  `${String(draft.blockerActiveFromHour).padStart(2, '0')}:00`,
                )}
              </Text>
            </View>
            <View style={{ flex: 1 }} />
            <Ionicons
              name="chevron-forward"
              size={15}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.resetBtn}
          onPress={handleResetDefaults}
          activeOpacity={0.7}
        >
          <Text style={styles.resetText}>Reset to defaults</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, !isDirty && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!isDirty}
          activeOpacity={0.85}
        >
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ReminderEditorSheet
        reminder={editingReminder}
        onClose={() => setEditingId(null)}
        onChange={(patch) => editingReminder && patchReminder(editingReminder.id, patch)}
      />

      <TimePickerSheet
        visible={editingBlockerHour}
        title="Blocker activates at"
        value={blockerDate}
        onCancel={() => setEditingBlockerHour(false)}
        onConfirm={(date) => {
          setDraft((d) => ({ ...d, blockerActiveFromHour: date.getHours() }));
          setEditingBlockerHour(false);
        }}
      />

      <ConfirmationSheet
        visible={pendingDeleteReminder !== null}
        title="Delete reminder?"
        message={
          pendingDeleteReminder
            ? `"${pendingDeleteReminder.title}" will be removed.`
            : ''
        }
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </View>
  );
}


interface ReminderEditorProps {
  reminder: CustomReminder | null;
  onClose: () => void;
  onChange: (patch: Partial<CustomReminder>) => void;
}

function ReminderEditorSheet({ reminder, onClose, onChange }: ReminderEditorProps) {
  const [pickingTime, setPickingTime] = useState(false);
  const visible = reminder !== null;

  if (!reminder) return null;

  return (
    <>
      <BottomSheet visible={visible} onClose={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.sheet}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.sheetTitle}>Edit reminder</Text>

              <Text style={styles.editorLabel}>Title</Text>
              <TextInput
                value={reminder.title}
                onChangeText={(v) => onChange({ title: v })}
                style={styles.input}
                placeholder="e.g. Evening walk"
                placeholderTextColor={colors.textMuted}
                maxLength={50}
              />

              <Text style={styles.editorLabel}>Message</Text>
              <TextInput
                value={reminder.body}
                onChangeText={(v) => onChange({ body: v })}
                style={[styles.input, styles.textArea]}
                placeholder="Body text shown in the notification"
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={140}
                textAlignVertical="top"
              />

              <Text style={styles.editorLabel}>Time</Text>
              <TouchableOpacity
                style={styles.timeBtn}
                onPress={() => setPickingTime(true)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={styles.timeBtnText}>
                  {formatClockLabel(reminder.time)}
                </Text>
                <View style={{ flex: 1 }} />
                <Ionicons
                  name="chevron-forward"
                  size={15}
                  color={colors.textMuted}
                />
              </TouchableOpacity>

              <Text style={styles.editorLabel}>Icon</Text>
              <View style={styles.iconGrid}>
                {REMINDER_ICONS.map((icon) => {
                  const active = icon === reminder.icon;
                  return (
                    <TouchableOpacity
                      key={icon}
                      style={[
                        styles.iconPick,
                        active && {
                          backgroundColor: `${reminder.tint}22`,
                          borderColor: reminder.tint,
                        },
                      ]}
                      onPress={() => onChange({ icon })}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={icon as ReminderIcon}
                        size={18}
                        color={active ? reminder.tint : colors.textSecondary}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.editorLabel}>Color</Text>
              <View style={styles.tintRow}>
                {REMINDER_TINTS.map((tint) => {
                  const active = tint === reminder.tint;
                  return (
                    <TouchableOpacity
                      key={tint}
                      style={[
                        styles.tintSwatch,
                        { backgroundColor: tint },
                        active && styles.tintSwatchActive,
                      ]}
                      onPress={() => onChange({ tint })}
                      activeOpacity={0.7}
                    >
                      {active ? (
                        <Ionicons name="checkmark" size={14} color="#fff" />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={styles.doneBtn}
                onPress={onClose}
                activeOpacity={0.85}
              >
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </BottomSheet>

      <TimePickerSheet
        visible={pickingTime}
        title={reminder.title}
        value={timeToDate(reminder.time)}
        onCancel={() => setPickingTime(false)}
        onConfirm={(date) => {
          onChange({ time: formatHHmm(date.getHours(), date.getMinutes()) });
          setPickingTime(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl + 80 },
  introCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    marginTop: spacing.base,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginTop: spacing.base,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: `${colors.accent}14`,
    borderWidth: 1,
    borderColor: `${colors.accent}33`,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyCard: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.lg,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabelBlock: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  cardHint: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  metaRowDisabled: {
    opacity: 0.45,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  smartTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: `${colors.accent}14`,
    borderWidth: 1,
    borderColor: `${colors.accent}33`,
  },
  smartTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.accent,
    letterSpacing: 0.2,
  },
  resetBtn: {
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingVertical: spacing.sm,
  },
  resetText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.base,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardElevated,
    paddingVertical: 13,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  saveBtn: {
    flex: 2,
    borderRadius: 12,
    backgroundColor: colors.accent,
    paddingVertical: 13,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  // editor sheet content padding (BottomSheet provides outer chrome)
  sheet: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    maxHeight: 560,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  editorLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.cardElevated,
    borderRadius: 10,
    padding: spacing.md,
    fontSize: 14,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  timeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.cardElevated,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconPick: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tintRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  tintSwatch: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tintSwatchActive: {
    borderColor: '#fff',
  },
  doneBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
