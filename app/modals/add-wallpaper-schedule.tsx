import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Toggle } from '@/src/components/atoms/Toggle';
import { TimePickerSheet } from '@/src/components/molecules/TimePickerSheet';
import { ConfirmationSheet } from '@/src/components/molecules/ConfirmationSheet';
import { useWallpaperStore } from '@/src/store/wallpaperStore';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import type {
  WallpaperTarget,
  ScheduleRepeat,
} from '@/src/domain/types/wallpaper';

function toUri(path: string): string {
  return /^(file|content):\/\//.test(path) ? path : `file://${path}`;
}

function dateToHHMM(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function hhmmTo12(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}

function hhmmToDate(time: string): Date {
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

const TARGETS: { value: WallpaperTarget; label: string }[] = [
  { value: 'home', label: 'Home' },
  { value: 'lock', label: 'Lock' },
  { value: 'both', label: 'Both' },
];

const REPEATS: { value: ScheduleRepeat; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'once', label: 'Once' },
  { value: 'weekdays', label: 'Weekdays' },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AddWallpaperScheduleModal() {
  const { id: editingId } = useLocalSearchParams<{ id?: string }>();

  const items = useWallpaperStore((s) => s.items);
  const schedules = useWallpaperStore((s) => s.schedules);
  const defaultWallpaperId = useWallpaperStore((s) => s.defaultWallpaperId);
  const addSchedule = useWallpaperStore((s) => s.addSchedule);
  const updateSchedule = useWallpaperStore((s) => s.updateSchedule);
  const removeSchedule = useWallpaperStore((s) => s.removeSchedule);

  const existing = useMemo(
    () => (editingId ? schedules.find((s) => s.id === editingId) ?? null : null),
    [editingId, schedules],
  );
  const isEditing = !!existing;

  const [wallpaperId, setWallpaperId] = useState<string | null>(
    existing?.wallpaperId ?? items[0]?.id ?? null,
  );
  const [time, setTime] = useState(existing?.time ?? '09:00');
  const [endEnabled, setEndEnabled] = useState(!!existing?.endTime);
  const [endTime, setEndTime] = useState(existing?.endTime ?? '12:00');
  const [target, setTarget] = useState<WallpaperTarget>(existing?.target ?? 'both');
  const [repeat, setRepeat] = useState<ScheduleRepeat>(existing?.repeat ?? 'daily');
  const [weekdays, setWeekdays] = useState<number[]>(
    existing?.weekdays?.length ? existing.weekdays : [1, 2, 3, 4, 5],
  );
  const [showStartTime, setShowStartTime] = useState(false);
  const [showEndTime, setShowEndTime] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);

  const defaultItem = items.find((i) => i.id === defaultWallpaperId) ?? null;
  const sameStartEnd = endEnabled && time === endTime;

  function toggleDay(d: number) {
    setWeekdays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );
  }

  const canSave =
    !!wallpaperId &&
    !sameStartEnd &&
    (repeat !== 'weekdays' || weekdays.length > 0);

  function handleSave() {
    if (!wallpaperId || !canSave) return;
    const payload = {
      wallpaperId,
      time,
      endTime: endEnabled ? endTime : undefined,
      target,
      repeat,
      weekdays: repeat === 'weekdays' ? weekdays : [],
    };
    if (isEditing && existing) {
      updateSchedule(existing.id, payload);
    } else {
      addSchedule(payload);
    }
    router.back();
  }

  function handleDelete() {
    if (!existing) return;
    removeSchedule(existing.id);
    router.back();
  }

  return (
    <>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.fieldLabel}>Wallpaper</Text>
        {items.length === 0 ? (
          <View style={styles.emptyImages}>
            <Ionicons name="images-outline" size={20} color={colors.textMuted} />
            <Text style={styles.emptyText}>
              Add an image to your library first, then create a schedule.
            </Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow}>
            {items.map((item) => {
              const selected = item.id === wallpaperId;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.imageTile, selected && styles.imageTileSelected]}
                  onPress={() => setWallpaperId(item.id)}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: toUri(item.localPath) }} style={styles.image} />
                  {selected ? (
                    <View style={styles.selectedBadge}>
                      <Ionicons name="checkmark" size={14} color={colors.textPrimary} />
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        <Text style={styles.fieldLabel}>Start time</Text>
        <TouchableOpacity style={styles.timeBtn} onPress={() => setShowStartTime(true)} activeOpacity={0.8}>
          <Ionicons name="time-outline" size={18} color={colors.accent} />
          <Text style={styles.timeText}>{hhmmTo12(time)}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.endRow}>
          <View style={styles.endCopy}>
            <Text style={[styles.fieldLabel, { marginTop: 0 }]}>End time</Text>
            <Text style={styles.endHint}>
              {endEnabled
                ? 'At end, the default wallpaper is restored.'
                : 'Off — wallpaper stays until something else changes it.'}
            </Text>
          </View>
          <Toggle value={endEnabled} onValueChange={setEndEnabled} size="sm" />
        </View>

        {endEnabled ? (
          <>
            <TouchableOpacity
              style={styles.timeBtn}
              onPress={() => setShowEndTime(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="time-outline" size={18} color={colors.accent} />
              <Text style={styles.timeText}>{hhmmTo12(endTime)}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>

            {sameStartEnd ? (
              <View style={styles.warning}>
                <Ionicons name="alert-circle-outline" size={14} color={colors.warning} />
                <Text style={styles.warningText}>Start and end can't be the same time.</Text>
              </View>
            ) : null}

            {!defaultItem ? (
              <View style={styles.warning}>
                <Ionicons name="alert-circle-outline" size={14} color={colors.warning} />
                <Text style={styles.warningText}>
                  No default wallpaper picked. Long-press an image in the library to mark it default,
                  or the end alarm will be skipped.
                </Text>
              </View>
            ) : (
              <View style={styles.defaultPreview}>
                <Image source={{ uri: toUri(defaultItem.localPath) }} style={styles.defaultThumb} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.defaultHint}>Reverts to</Text>
                  <Text style={styles.defaultName} numberOfLines={1}>{defaultItem.name}</Text>
                </View>
              </View>
            )}
          </>
        ) : null}

        <Text style={styles.fieldLabel}>Apply to</Text>
        <View style={styles.segment}>
          {TARGETS.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[styles.segItem, target === t.value && styles.segItemActive]}
              onPress={() => setTarget(t.value)}
              activeOpacity={0.8}
            >
              <Text style={[styles.segText, target === t.value && styles.segTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Repeat</Text>
        <View style={styles.segment}>
          {REPEATS.map((r) => (
            <TouchableOpacity
              key={r.value}
              style={[styles.segItem, repeat === r.value && styles.segItemActive]}
              onPress={() => setRepeat(r.value)}
              activeOpacity={0.8}
            >
              <Text style={[styles.segText, repeat === r.value && styles.segTextActive]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {repeat === 'weekdays' ? (
          <View style={styles.daysRow}>
            {DAYS.map((d, i) => {
              const on = weekdays.includes(i);
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.dayChip, on && styles.dayChipOn]}
                  onPress={() => toggleDay(i)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dayText, on && styles.dayTextOn]}>{d[0]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}

        <View style={styles.footer}>
          {isEditing ? (
            <TouchableOpacity
              style={[styles.btn, styles.deleteBtn]}
              onPress={() => setPendingDelete(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={15} color={colors.danger} />
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={[styles.btn, styles.saveBtn, !canSave && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!canSave}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark" size={18} color={colors.textPrimary} />
            <Text style={styles.saveText}>{isEditing ? 'Update' : 'Save schedule'}</Text>
          </TouchableOpacity>
        </View>

        <TimePickerSheet
          visible={showStartTime}
          title="Start time"
          value={hhmmToDate(time)}
          onCancel={() => setShowStartTime(false)}
          onConfirm={(d) => {
            setTime(dateToHHMM(d));
            setShowStartTime(false);
          }}
        />

        <TimePickerSheet
          visible={showEndTime}
          title="End time"
          value={hhmmToDate(endTime)}
          onCancel={() => setShowEndTime(false)}
          onConfirm={(d) => {
            setEndTime(dateToHHMM(d));
            setShowEndTime(false);
          }}
        />
      </ScrollView>

      <ConfirmationSheet
        visible={pendingDelete}
        title="Delete schedule?"
        message="This schedule will stop firing. Your wallpapers are not affected."
        confirmLabel="Delete"
        onCancel={() => setPendingDelete(false)}
        onConfirm={() => {
          setPendingDelete(false);
          handleDelete();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  imageRow: { flexDirection: 'row' },
  imageTile: {
    width: 70,
    height: 110,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  imageTileSelected: { borderColor: colors.accent },
  image: { width: '100%', height: '100%' },
  selectedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyImages: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  emptyText: {
    flex: 1,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  timeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
    paddingVertical: 14,
  },
  timeText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  endRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  endCopy: { flex: 1 },
  endHint: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: 10,
    backgroundColor: `${colors.warning}14`,
    borderWidth: 1,
    borderColor: `${colors.warning}40`,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: colors.warning,
    lineHeight: 16,
  },
  defaultPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  defaultThumb: {
    width: 28,
    height: 48,
    borderRadius: 6,
    backgroundColor: colors.cardElevated,
  },
  defaultHint: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  defaultName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 2,
  },
  segment: {
    flexDirection: 'row',
    gap: 8,
  },
  segItem: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 11,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segItemActive: {
    backgroundColor: `${colors.accent}1F`,
    borderColor: colors.accent,
  },
  segText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  segTextActive: { color: colors.accent },
  daysRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: spacing.md,
  },
  dayChip: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayChipOn: {
    backgroundColor: `${colors.accent}1F`,
    borderColor: colors.accent,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  dayTextOn: { color: colors.accent },
  footer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: spacing.xxl,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    paddingVertical: 14,
  },
  saveBtn: {
    flex: 2,
    backgroundColor: colors.accent,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: `${colors.danger}18`,
    borderWidth: 1,
    borderColor: `${colors.danger}44`,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.danger,
  },
});
