import React, { useEffect, useState } from 'react';
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
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { useBookmarkStore } from '@/src/store/bookmarkStore';
import {
  cancelBookmarkNotification,
  ensureNotificationPermission,
  scheduleBookmarkNotification,
} from '@/src/services/notifications';
import { getToday } from '@/src/utils/dates';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { RecurrenceType } from '@/src/domain/types/bookmark';
import { CustomAlert } from '@/src/components/molecules/CustomAlert';
import { TimePickerSheet } from '@/src/components/molecules/TimePickerSheet';
import { DatePickerSheet } from '@/src/components/molecules/DatePickerSheet';
import { ConfirmationSheet } from '@/src/components/molecules/ConfirmationSheet';

const RECURRENCE_OPTIONS: { label: string; value: RecurrenceType }[] = [
  { label: 'None', value: 'none' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
];

function formatTime(d: Date) {
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function formatDateLabel(date: string) {
  return format(parseISO(date), 'EEEE, MMMM d, yyyy');
}

export default function AddBookmarkModal() {
  const { id, date } = useLocalSearchParams<{ id?: string; date?: string }>();
  const bookmarks = useBookmarkStore((s) => s.bookmarks);
  const addBookmark = useBookmarkStore((s) => s.addBookmark);
  const updateBookmark = useBookmarkStore((s) => s.updateBookmark);
  const removeBookmark = useBookmarkStore((s) => s.removeBookmark);

  const existing = id ? bookmarks.find((bookmark) => bookmark.id === id) : undefined;

  const [targetDate, setTargetDate] = useState<string>(existing?.date || date || getToday());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [label, setLabel] = useState(existing?.label || '');
  const [note, setNote] = useState(existing?.note || '');
  const [recurrence, setRecurrence] = useState<RecurrenceType>(existing?.recurrence || 'none');
  const [remind, setRemind] = useState(!!existing?.notifyAt);
  const initialTime = existing?.notifyAt
    ? new Date(existing.notifyAt)
    : new Date(new Date().setHours(9, 0, 0, 0));
  const [time, setTime] = useState<Date>(initialTime);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [alert, setAlert] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false,
    title: '',
    message: '',
  });

  async function checkPermissions() {
    const granted = await ensureNotificationPermission();
    if (!granted) {
      setAlert({
        visible: true,
        title: 'Permission Required',
        message: 'Please enable notifications in settings to set reminders.',
      });
      setRemind(false);
    }
  }

  useEffect(() => {
    if (remind) {
      checkPermissions();
    }
  }, [remind]);

  function getComputedDate(): Date {
    const [y, m, d] = targetDate.split('-').map(Number);
    return new Date(y, m - 1, d, time.getHours(), time.getMinutes());
  }

  async function handleSave() {
    if (!label.trim()) {
      setAlert({
        visible: true,
        title: 'Label Required',
        message: 'Please enter a label for this bookmark.',
      });
      return;
    }

    const bookmarkId = existing?.id || Date.now().toString();

    if (existing) {
      await cancelBookmarkNotification(bookmarkId);
    }

    let notificationId: string | undefined;
    let notifyAt: string | undefined;

    if (remind) {
      const reminderDate = getComputedDate();

      if (recurrence === 'none' && reminderDate < new Date()) {
        setAlert({
          visible: true,
          title: 'Invalid Time',
          message: 'The reminder time is in the past.',
        });
        return;
      }

      notifyAt = reminderDate.toISOString();

      notificationId = await scheduleBookmarkNotification({
        bookmarkId,
        title: label.trim(),
        body: note.trim() || 'You have a bookmarked reminder for today.',
        reminderDate,
        recurrence,
      });
    }

    const bookmark = {
      id: bookmarkId,
      date: targetDate,
      label: label.trim(),
      note: note.trim() || undefined,
      notifyAt,
      notificationId,
      recurrence,
    };

    if (existing) {
      updateBookmark(existing.id, bookmark);
    } else {
      addBookmark(bookmark);
    }

    router.back();
  }

  async function executeDelete() {
    if (!existing) return;
    await cancelBookmarkNotification(existing.id);
    removeBookmark(existing.id);
    router.back();
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert({ ...alert, visible: false })}
      />
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerCard}>
          <Text style={styles.kicker}>BOOKMARK</Text>
          <Text style={styles.title}>{existing ? 'Edit bookmark' : 'Add bookmark'}</Text>
          <TouchableOpacity
            style={styles.dateBtn}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.75}
          >
            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.dateBtnText}>{formatDateLabel(targetDate)}</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Label</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Car insurance renewal"
            placeholderTextColor={colors.textMuted}
            value={label}
            onChangeText={setLabel}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Note</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any specific details..."
            placeholderTextColor={colors.textMuted}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Repeat</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recurrenceContent}
          >
            {RECURRENCE_OPTIONS.map((opt) => {
              const active = recurrence === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setRecurrence(opt.value)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchCopy}>
              <Text style={styles.switchLabel}>Reminder</Text>
              <Text style={styles.switchHint}>
                {remind ? 'Notification enabled' : 'No notification scheduled'}
              </Text>
            </View>
            <Toggle size="sm" value={remind} onValueChange={setRemind} />
          </View>

          {remind ? (
            <TouchableOpacity
              style={styles.timeBtn}
              onPress={() => setShowTimePicker(true)}
              activeOpacity={0.75}
            >
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
              <View style={styles.timeCopy}>
                <Text style={styles.timeLabel}>Reminder time</Text>
                <Text style={styles.timeText}>{formatTime(time)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.footer}>
          {existing ? (
            <TouchableOpacity
              style={[styles.btn, styles.deleteBtn]}
              onPress={() => setShowDeleteConfirm(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={15} color={colors.danger} />
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={[styles.btn, styles.saveBtn, !label.trim() && styles.btnDisabled]}
            onPress={handleSave}
            disabled={!label.trim()}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark" size={16} color="#fff" />
            <Text style={styles.saveBtnText}>Save Bookmark</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <DatePickerSheet
        visible={showDatePicker}
        title="Select Date"
        value={targetDate}
        onCancel={() => setShowDatePicker(false)}
        onConfirm={(val) => {
          setTargetDate(val);
          setShowDatePicker(false);
        }}
      />

      <TimePickerSheet
        visible={showTimePicker}
        title="Reminder Time"
        value={time}
        onCancel={() => setShowTimePicker(false)}
        onConfirm={(val) => {
          setTime(val);
          setShowTimePicker(false);
        }}
      />

      <ConfirmationSheet
        visible={showDeleteConfirm}
        title="Delete Bookmark?"
        message="This bookmark and its scheduled reminder will be removed."
        confirmLabel="Delete"
        onConfirm={executeDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.base,
    paddingBottom: spacing.xxxl,
  },
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
  dateBtn: {
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
  dateBtnText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
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
  input: {
    backgroundColor: colors.cardElevated,
    borderRadius: 10,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 82,
    textAlignVertical: 'top',
  },
  recurrenceContent: {
    gap: 8,
    paddingRight: spacing.base,
  },
  chip: {
    backgroundColor: colors.cardElevated,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: `${colors.accent}24`,
    borderColor: colors.accent,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.accent,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  switchCopy: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  switchHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  timeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  timeCopy: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '700',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: spacing.sm,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
  },
  saveBtn: {
    backgroundColor: colors.accent,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  deleteBtn: {
    backgroundColor: `${colors.danger}18`,
    borderWidth: 1,
    borderColor: `${colors.danger}44`,
  },
  deleteBtnText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.4,
  },
});
