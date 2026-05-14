import React, { useEffect, useState } from 'react';
import {
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';

const ITEM_H = 52;
const VISIBLE = 5;
const DRUM_H = ITEM_H * VISIBLE;
const PAD = ITEM_H * 2;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => String(currentYear + i - 1)); // -1 to show last year as well

function getDaysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

// ─── Scroll drum ───────────────────────────────────────────────────────────────

interface DrumProps {
  items: string[];
  initialIndex: number;
  onChange: (index: number) => void;
  width?: number;
}

function ScrollDrum({ items, initialIndex, onChange, width = 72 }: DrumProps) {
  return (
    <View style={[styles.drumWrapper, { width }]}>
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

// ─── DatePickerSheet ───────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  title: string;
  value: string; // YYYY-MM-DD
  onCancel: () => void;
  onConfirm: (value: string) => void;
}

export function DatePickerSheet({ visible, title, value, onCancel, onConfirm }: Props) {
  const initDate = value ? new Date(value) : new Date();
  
  const [yearIndex, setYearIndex] = useState(YEARS.indexOf(String(initDate.getFullYear())));
  const [monthIndex, setMonthIndex] = useState(initDate.getMonth());
  const [dayIndex, setDayIndex] = useState(initDate.getDate() - 1);
  const [sessionKey, setSessionKey] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const d = value ? new Date(value) : new Date();
    setYearIndex(Math.max(0, YEARS.indexOf(String(d.getFullYear()))));
    setMonthIndex(d.getMonth());
    setDayIndex(d.getDate() - 1);
    setSessionKey((k) => k + 1);
  }, [visible, value]);

  const selectedYear = parseInt(YEARS[yearIndex] || String(currentYear), 10);
  const daysInMonth = getDaysInMonth(selectedYear, monthIndex);
  
  // Cap day index if month changes to one with fewer days (e.g. Jan 31 -> Feb)
  const safeDayIndex = Math.min(dayIndex, daysInMonth - 1);
  const DAYS = Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, '0'));

  const previewDate = new Date(selectedYear, monthIndex, safeDayIndex + 1);
  const previewStr = `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(safeDayIndex + 1).padStart(2, '0')}`;
  const displayStr = previewDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.preview}>{displayStr}</Text>

          <View style={styles.controls}>
            <ScrollDrum
              key={`m-${sessionKey}`}
              items={MONTHS}
              initialIndex={monthIndex}
              onChange={setMonthIndex}
              width={90}
            />
            <ScrollDrum
              key={`d-${sessionKey}-${daysInMonth}`} // re-mount if days count changes so we don't scroll out of bounds
              items={DAYS}
              initialIndex={safeDayIndex}
              onChange={setDayIndex}
              width={72}
            />
            <ScrollDrum
              key={`y-${sessionKey}`}
              items={YEARS}
              initialIndex={yearIndex}
              onChange={setYearIndex}
              width={90}
            />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel} activeOpacity={0.8}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() => onConfirm(previewStr)}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,15,15,0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderColor: '#242424',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#3A3A3A',
    marginBottom: spacing.base,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  preview: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 6,
    marginBottom: 4,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: spacing.base,
  },
  drumWrapper: {
    height: DRUM_H,
    overflow: 'hidden',
    borderRadius: 14,
    backgroundColor: '#111111',
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
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  cancelButton: {
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
  confirmButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: colors.accent,
    paddingVertical: 13,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
