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
import { useReadLaterStore } from '@/src/store/readlaterStore';
import {
  cancelReadLaterNotification,
  ensureNotificationPermission,
  scheduleReadLaterNotification,
} from '@/src/services/notifications';
import { enrichReadLaterMeta } from '@/src/services/linkMeta';
import { getToday } from '@/src/utils/dates';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { CustomAlert } from '@/src/components/molecules/CustomAlert';
import { TimePickerSheet } from '@/src/components/molecules/TimePickerSheet';
import { DatePickerSheet } from '@/src/components/molecules/DatePickerSheet';
import { ConfirmationSheet } from '@/src/components/molecules/ConfirmationSheet';
import type { ReadLaterItem, ReadLaterType } from '@/src/domain/types/readlater';

const TYPE_OPTIONS: { value: ReadLaterType; label: string; color: string }[] = [
  { value: 'article', label: 'Article', color: colors.accent },
  { value: 'video', label: 'Video', color: colors.danger },
  { value: 'x', label: 'Post', color: colors.textPrimary },
  { value: 'other', label: 'Other', color: colors.textSecondary },
];

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function hostOf(url: string): string {
  return normalizeUrl(url)
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split(/[/?#]/)[0];
}

function detectType(url: string): ReadLaterType {
  const h = url.toLowerCase();
  if (h.includes('youtube.com') || h.includes('youtu.be')) return 'video';
  if (h.includes('x.com') || h.includes('twitter.com')) return 'x';
  if (!h.trim()) return 'article';
  return 'article';
}

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

export default function AddReadLaterModal() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const items = useReadLaterStore((s) => s.items);
  const addItem = useReadLaterStore((s) => s.addItem);
  const updateItem = useReadLaterStore((s) => s.updateItem);
  const removeItem = useReadLaterStore((s) => s.removeItem);

  const existing = id ? items.find((i) => i.id === id) : undefined;

  const [url, setUrl] = useState(existing?.url || '');
  const [title, setTitle] = useState(existing?.title || '');
  const [note, setNote] = useState(existing?.note || '');
  const [type, setType] = useState<ReadLaterType>(existing?.type || 'article');
  const [typeTouched, setTypeTouched] = useState(!!existing);
  const [isRead, setIsRead] = useState(!!existing?.isRead);

  const [targetDate, setTargetDate] = useState<string>(existing?.date || getToday());
  const [showDatePicker, setShowDatePicker] = useState(false);

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

  function handleUrlChange(val: string) {
    setUrl(val);
    if (!typeTouched) {
      setType(detectType(val));
    }
  }

  function getComputedDate(): Date {
    const [y, m, d] = targetDate.split('-').map(Number);
    return new Date(y, m - 1, d, time.getHours(), time.getMinutes());
  }

  async function handleSave() {
    if (!url.trim()) {
      setAlert({
        visible: true,
        title: 'Link Required',
        message: 'Please paste or type a link to save.',
      });
      return;
    }

    const itemId = existing?.id || Date.now().toString();
    const normalized = normalizeUrl(url);
    const finalTitle = title.trim() || hostOf(url);

    if (existing) {
      await cancelReadLaterNotification(itemId);
    }

    let notificationId: string | undefined;
    let notifyAt: string | undefined;

    // Don't schedule a reminder for something already read.
    if (remind && !isRead) {
      const reminderDate = getComputedDate();
      if (reminderDate < new Date()) {
        setAlert({
          visible: true,
          title: 'Invalid Time',
          message: 'The reminder time is in the past.',
        });
        return;
      }
      notifyAt = reminderDate.toISOString();
      notificationId = await scheduleReadLaterNotification({
        itemId,
        title: 'Read later',
        body: finalTitle,
        reminderDate,
      });
    }

    const item: ReadLaterItem = {
      id: itemId,
      url: normalized,
      title: finalTitle,
      note: note.trim() || undefined,
      type,
      date: targetDate,
      isRead,
      readAt: isRead ? existing?.readAt ?? new Date().toISOString() : undefined,
      notifyAt,
      notificationId,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };

    if (existing) {
      updateItem(existing.id, item);
    } else {
      addItem(item);
      // Background best-effort title/description fetch (no third-party service).
      void enrichReadLaterMeta(itemId, normalized);
    }

    router.back();
  }

  async function executeDelete() {
    if (!existing) return;
    await cancelReadLaterNotification(existing.id);
    removeItem(existing.id);
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
          <Text style={styles.kicker}>READ LATER</Text>
          <Text style={styles.title}>{existing ? 'Edit item' : 'Save a link'}</Text>
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
          <Text style={styles.fieldLabel}>Link</Text>
          <TextInput
            style={styles.input}
            placeholder="https://..."
            placeholderTextColor={colors.textMuted}
            value={url}
            onChangeText={handleUrlChange}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Optional — defaults to the site name"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Note</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Why you saved it..."
            placeholderTextColor={colors.textMuted}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Type</Text>
          <View style={styles.typeRow}>
            {TYPE_OPTIONS.map((opt) => {
              const active = type === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.chip,
                    active && { backgroundColor: `${opt.color}22`, borderColor: opt.color },
                  ]}
                  onPress={() => {
                    setType(opt.value);
                    setTypeTouched(true);
                  }}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[styles.chipText, active && { color: opt.color, fontWeight: '700' }]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {existing ? (
          <View style={styles.card}>
            <View style={styles.switchRow}>
              <View style={styles.switchCopy}>
                <Text style={styles.switchLabel}>Mark as read</Text>
                <Text style={styles.switchHint}>
                  {isRead ? 'Done — moved to read' : 'Still in your to-read list'}
                </Text>
              </View>
              <Toggle size="sm" value={isRead} onValueChange={setIsRead} />
            </View>
          </View>
        ) : null}

        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchCopy}>
              <Text style={styles.switchLabel}>Reminder</Text>
              <Text style={styles.switchHint}>
                {remind ? 'Notification enabled' : 'No notification scheduled'}
              </Text>
            </View>
            <Toggle
              size="sm"
              value={remind}
              onValueChange={setRemind}
              disabled={isRead}
            />
          </View>

          {remind && !isRead ? (
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
            style={[styles.btn, styles.saveBtn, !url.trim() && styles.btnDisabled]}
            onPress={handleSave}
            disabled={!url.trim()}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark" size={16} color="#fff" />
            <Text style={styles.saveBtnText}>{existing ? 'Save' : 'Save link'}</Text>
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
        title="Delete Item?"
        message="This saved link and its scheduled reminder will be removed."
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
  typeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: colors.cardElevated,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
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
