import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Switch, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useBookmarkStore } from '@/src/store/bookmarkStore';
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

function getBookmarkNotificationId(bookmarkId: string) {
  return `bookmark-${bookmarkId}`;
}

export default function AddBookmarkModal() {
  const { id, date } = useLocalSearchParams<{ id?: string; date?: string }>();
  const store = useBookmarkStore();
  
  const existing = id ? store.getBookmarkById(id) : undefined;
  
  const [targetDate, setTargetDate] = useState<string>(existing?.date || date || getToday());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [label, setLabel] = useState(existing?.label || '');
  const [note, setNote] = useState(existing?.note || '');
  const [recurrence, setRecurrence] = useState<RecurrenceType>(existing?.recurrence || 'none');
  
  const [remind, setRemind] = useState(!!existing?.notifyAt);
  
  const initialTime = existing?.notifyAt ? new Date(existing.notifyAt) : new Date(new Date().setHours(9, 0, 0, 0));
  const [time, setTime] = useState<Date>(initialTime);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [alert, setAlert] = useState<{ visible: boolean; title: string; message: string }>({ visible: false, title: '', message: '' });

  function formatTime(d: Date) {
    let h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
  }

  async function checkPermissions() {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus !== 'granted') {
        setAlert({ visible: true, title: "Permission Required", message: "Please enable notifications in settings to set reminders." });
        setRemind(false);
      }
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
      setAlert({ visible: true, title: "Error", message: "Please enter a label for this bookmark." });
      return;
    }

    const bookmarkId = existing?.id || Date.now().toString();
    const stableNotificationId = getBookmarkNotificationId(bookmarkId);

    if (existing?.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(existing.notificationId);
    } else if (existing) {
      await Notifications.cancelScheduledNotificationAsync(stableNotificationId);
    }

    let notificationId: string | undefined;
    let notifyAt: string | undefined;

    if (remind) {
      const reminderDate = getComputedDate();

      if (recurrence === 'none' && reminderDate < new Date()) {
        setAlert({ visible: true, title: "Invalid Time", message: "The reminder time is in the past." });
        return;
      }

      notifyAt = reminderDate.toISOString();

      let trigger: Notifications.NotificationTriggerInput;
      
      if (recurrence === 'none') {
        trigger = { 
          type: Notifications.SchedulableTriggerInputTypes.DATE, 
          date: reminderDate 
        };
      } else {
        const calTrigger: any = { repeats: true };
        if (recurrence === 'daily') {
          calTrigger.hour = reminderDate.getHours();
          calTrigger.minute = reminderDate.getMinutes();
        } else if (recurrence === 'weekly') {
          calTrigger.weekday = reminderDate.getDay() + 1;
          calTrigger.hour = reminderDate.getHours();
          calTrigger.minute = reminderDate.getMinutes();
        } else if (recurrence === 'monthly') {
          calTrigger.day = reminderDate.getDate();
          calTrigger.hour = reminderDate.getHours();
          calTrigger.minute = reminderDate.getMinutes();
        } else if (recurrence === 'yearly') {
          calTrigger.month = reminderDate.getMonth() + 1;
          calTrigger.day = reminderDate.getDate();
          calTrigger.hour = reminderDate.getHours();
          calTrigger.minute = reminderDate.getMinutes();
        }
        trigger = {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          ...calTrigger
        };
      }

      notificationId = await Notifications.scheduleNotificationAsync({
        identifier: stableNotificationId,
        content: {
          title: `📌 ${label}`,
          body: note || 'You have a bookmarked reminder for today.',
          data: { screen: 'journal' },
        },
        trigger,
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
      store.updateBookmark(existing.id, bookmark);
    } else {
      store.addBookmark(bookmark);
    }

    router.back();
  }

  async function executeDelete() {
    if (existing) {
      if (existing.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(existing.notificationId);
      } else {
        await Notifications.cancelScheduledNotificationAsync(getBookmarkNotificationId(existing.id));
      }
      store.removeBookmark(existing.id);
      router.back();
    }
  }

  return (
    <>
      <CustomAlert 
        visible={alert.visible} 
        title={alert.title} 
        message={alert.message} 
        onClose={() => setAlert({ ...alert, visible: false })} 
      />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.header}>
          <Text style={styles.label}>Target Date</Text>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(!showDatePicker)}>
            <Text style={styles.dateBtnText}>{targetDate}</Text>
          </TouchableOpacity>
        </View>

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

        <Text style={styles.label}>Label</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Car Insurance Renewal"
          placeholderTextColor={colors.textMuted}
          value={label}
          onChangeText={setLabel}
        />

        <Text style={styles.label}>Note (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Any specific details..."
          placeholderTextColor={colors.textMuted}
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Repeat</Text>
        <View style={styles.recurrenceRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {RECURRENCE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.chip, recurrence === opt.value && styles.chipActive]}
                onPress={() => setRecurrence(opt.value)}
              >
                <Text style={[styles.chipText, recurrence === opt.value && styles.chipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Push Notification</Text>
          <Switch
            value={remind}
            onValueChange={setRemind}
            trackColor={{ false: colors.border, true: `${colors.accent}90` }}
            thumbColor={remind ? colors.accent : '#888'}
          />
        </View>

        {remind && (
          <View style={styles.header}>
            <Text style={styles.label}>Reminder Time</Text>
            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowTimePicker(true)}>
              <Text style={styles.dateBtnText}>{formatTime(time)}</Text>
            </TouchableOpacity>
          </View>
        )}

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

        <View style={styles.footer}>
          {existing && (
            <TouchableOpacity style={[styles.btn, styles.deleteBtn]} onPress={() => setShowDeleteConfirm(true)}>
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.btn, styles.saveBtn]} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Save Bookmark</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ConfirmationSheet
        visible={showDeleteConfirm}
        title="Delete Bookmark?"
        message="Are you sure you want to delete this bookmark? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={executeDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
  },
  dateBtn: {
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  dateBtnText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    color: colors.textPrimary,
    fontSize: 16,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  recurrenceRow: {
    marginBottom: spacing.lg,
  },
  chip: {
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switchLabel: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  btn: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtn: {
    backgroundColor: colors.accent,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteBtn: {
    backgroundColor: 'rgba(239,68,68,0.15)',
  },
  deleteBtnText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '700',
  },
});
