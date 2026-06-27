import React, { useEffect, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BottomSheet } from '@/src/components/molecules/BottomSheet';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

const ITEM_H = 42;
const VISIBLE = 5;
const DRUM_H = ITEM_H * VISIBLE;
const PAD = ITEM_H * 2; // centers first and last item

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

// Scroll drum

interface DrumProps {
  items: string[];
  initialIndex: number;
  onChange: (index: number) => void;
}

function ScrollDrum({ items, initialIndex, onChange }: DrumProps) {
  return (
    <View style={styles.drumWrapper}>
      {/* Fixed selection band around the center row */}
      <View style={styles.selectionBand} pointerEvents="none" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        contentOffset={{ x: 0, y: initialIndex * ITEM_H }}
        onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
          const y = e.nativeEvent.contentOffset.y;
          const index = Math.max(0, Math.min(Math.round(y / ITEM_H), items.length - 1));
          onChange(index);
        }}
        contentContainerStyle={{ paddingVertical: PAD }}
        scrollEventThrottle={16}
      >
        {items.map((item, i) => (
          <View key={i} style={styles.drumItem}>
            <Text style={styles.drumText}>{item}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// TimePickerSheet

interface Props {
  visible: boolean;
  title: string;
  value: Date;
  onCancel: () => void;
  onConfirm: (value: Date) => void;
}

function formatTimeDisplay(date: Date): string {
  const h = date.getHours();
  const m = String(date.getMinutes()).padStart(2, '0');
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${period}`;
}

function toDraft(date: Date) {
  const h = date.getHours();
  const rawMin = date.getMinutes();
  const snappedMin = Math.round(rawMin / 5) * 5 % 60;
  return {
    hourIndex: (h % 12 || 12) - 1,       // 0-11
    minuteIndex: snappedMin / 5,           // 0-11
    period: (h >= 12 ? 'PM' : 'AM') as 'AM' | 'PM',
  };
}

function toDate(base: Date, hourIndex: number, minuteIndex: number, period: 'AM' | 'PM'): Date {
  const d = new Date(base);
  const h12 = hourIndex + 1;
  let h24 = h12 % 12;
  if (period === 'PM') h24 += 12;
  d.setHours(h24, minuteIndex * 5, 0, 0);
  return d;
}

export function TimePickerSheet({ visible, title, value, onCancel, onConfirm }: Props) {
  const initial = toDraft(value);
  const [hourIndex, setHourIndex] = useState(initial.hourIndex);
  const [minuteIndex, setMinuteIndex] = useState(initial.minuteIndex);
  const [period, setPeriod] = useState<'AM' | 'PM'>(initial.period);
  // Incrementing sessionKey forces ScrollDrum to remount (and re-apply contentOffset)
  const [sessionKey, setSessionKey] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const draft = toDraft(value);
    setHourIndex(draft.hourIndex);
    setMinuteIndex(draft.minuteIndex);
    setPeriod(draft.period);
    setSessionKey((k) => k + 1);
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const preview = toDate(value, hourIndex, minuteIndex, period);

  return (
    <BottomSheet visible={visible} onClose={onCancel}>
      <View style={styles.body}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.preview}>{formatTimeDisplay(preview)}</Text>

          <View style={styles.controls}>
            <ScrollDrum
              key={`h-${sessionKey}`}
              items={HOURS}
              initialIndex={hourIndex}
              onChange={setHourIndex}
            />
            <Text style={styles.colon}>:</Text>
            <ScrollDrum
              key={`m-${sessionKey}`}
              items={MINUTES}
              initialIndex={minuteIndex}
              onChange={setMinuteIndex}
            />
            <View style={styles.periodColumn}>
              {(['AM', 'PM'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.periodBtn, period === p && styles.periodBtnActive]}
                  onPress={() => setPeriod(p)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel} activeOpacity={0.8}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => onConfirm(preview)}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  preview: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 4,
    marginBottom: 2,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.6,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  drumWrapper: {
    width: 64,
    height: DRUM_H,
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: colors.cardElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectionBand: {
    position: 'absolute',
    top: ITEM_H * 2,
    left: 0,
    right: 0,
    height: ITEM_H,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.accent + '70',
    zIndex: 1,
  },
  drumItem: {
    height: ITEM_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drumText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  colon: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: -6,
  },
  periodColumn: {
    gap: 6,
    marginLeft: 6,
  },
  periodBtn: {
    width: 48,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardElevated,
    alignItems: 'center',
  },
  periodBtnActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  periodText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  periodTextActive: {
    color: '#fff',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardElevated,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  confirmButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: colors.accent,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
