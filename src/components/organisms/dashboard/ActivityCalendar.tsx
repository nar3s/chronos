import React from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet } from 'react-native';
import { CalendarDayCell, EmptyCell } from '@/src/components/atoms/CalendarDayCell';
import { colors } from '@/src/theme/colors';
import type { DayActivity, DaySummary } from '@/src/hooks/useActivityCalendar';

interface Props {
  days: DayActivity[];
  startOffset: number;
  monthLabel: string;
  isCurrentMonth: boolean;
  selectedDate: string | null;
  daySummary: DaySummary | null;
  onPrev: () => void;
  onNext: () => void;
  onSelectDate: (date: string | null) => void;
}

const WEEK_HEADERS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

const LEGEND = [
  { color: colors.accent, label: 'Study' },
  { color: colors.success, label: 'Gym' },
  { color: colors.warning, label: 'Protein' },
  { color: colors.purple, label: 'Sleep' },
];

function formatSummaryDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function pplLabelShort(type: string): string {
  const map: Record<string, string> = { push: 'Push', pull: 'Pull', legs: 'Legs', rest: 'Rest' };
  return map[type] ?? type;
}

export function ActivityCalendar({
  days,
  startOffset,
  monthLabel,
  isCurrentMonth,
  selectedDate,
  daySummary,
  onPrev,
  onNext,
  onSelectDate,
}: Props) {
  const cells: (DayActivity | null)[] = [
    ...Array(startOffset).fill(null),
    ...days,
  ];
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const rows: (DayActivity | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  return (
    <View style={styles.container}>
      {/* Month header with arrows */}
      <View style={styles.monthRow}>
        <TouchableOpacity onPress={onPrev} style={styles.arrow} activeOpacity={0.6}>
          <Text style={styles.arrowText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <TouchableOpacity
          onPress={onNext}
          style={[styles.arrow, isCurrentMonth && styles.arrowDisabled]}
          activeOpacity={isCurrentMonth ? 1 : 0.6}
          disabled={isCurrentMonth}
        >
          <Text style={[styles.arrowText, isCurrentMonth && styles.arrowDisabledText]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Weekday headers */}
      <View style={styles.headerRow}>
        {WEEK_HEADERS.map((h) => (
          <View key={h} style={styles.headerCell}>
            <Text style={styles.headerText}>{h}</Text>
          </View>
        ))}
      </View>

      {/* Grid */}
      {rows.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((day, ci) =>
            day ? (
              <CalendarDayCell
                key={day.date}
                dayNum={day.dayNum}
                activeCount={day.activeCount}
                study={day.study}
                gym={day.gym}
                protein={day.protein}
                sleep={day.sleep}
                isToday={day.isToday}
                isFuture={day.isFuture}
                isSelected={selectedDate === day.date}
                onPress={() =>
                  onSelectDate(selectedDate === day.date ? null : day.date)
                }
              />
            ) : (
              <EmptyCell key={`e-${ri}-${ci}`} />
            )
          )}
        </View>
      ))}

      {/* Legend */}
      <View style={styles.legend}>
        {LEGEND.map((l) => (
          <View key={l.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: l.color }]} />
            <Text style={styles.legendText}>{l.label}</Text>
          </View>
        ))}
      </View>

      {/* Day Summary Popup */}
      <Modal
        visible={!!daySummary}
        transparent
        animationType="fade"
        onRequestClose={() => onSelectDate(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => onSelectDate(null)}>
          <Pressable style={styles.popup} onPress={(e) => e.stopPropagation()}>
            {daySummary && (
              <>
                <View style={styles.popupHeader}>
                  <Text style={styles.popupDate}>{formatSummaryDate(daySummary.date)}</Text>
                  <TouchableOpacity
                    onPress={() => onSelectDate(null)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.popupClose}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Study */}
                <View style={styles.popupSection}>
                  <View style={styles.popupDotRow}>
                    <View style={[styles.popupDot, { backgroundColor: colors.accent, opacity: daySummary.studySessions.length > 0 ? 1 : 0.3 }]} />
                    <Text style={daySummary.studySessions.length > 0 ? styles.popupLabel : styles.popupMuted}>
                      {daySummary.studySessions.length > 0
                        ? `Study — ${daySummary.studyTotal}`
                        : 'No study'}
                    </Text>
                  </View>
                  {daySummary.studySessions.map((s, i) => (
                    <Text key={i} style={styles.popupDetail}>
                      {s.topic} · {s.subtopic} ({s.minutes}m)
                    </Text>
                  ))}
                </View>

                {/* Gym */}
                <View style={styles.popupSection}>
                  <View style={styles.popupDotRow}>
                    <View style={[styles.popupDot, { backgroundColor: colors.success, opacity: daySummary.gymType ? 1 : 0.3 }]} />
                    <Text style={daySummary.gymType ? styles.popupLabel : styles.popupMuted}>
                      {daySummary.gymType
                        ? `${pplLabelShort(daySummary.gymType)} — ${daySummary.gymCompleted ? 'Completed ✓' : 'Incomplete'}`
                        : 'No workout'}
                    </Text>
                  </View>
                </View>

                {/* Protein */}
                <View style={styles.popupSection}>
                  <View style={styles.popupDotRow}>
                    <View style={[styles.popupDot, { backgroundColor: colors.warning, opacity: daySummary.proteinGrams ? 1 : 0.3 }]} />
                    <Text style={daySummary.proteinGrams ? styles.popupLabel : styles.popupMuted}>
                      {daySummary.proteinGrams
                        ? `${daySummary.proteinGrams}g / ${daySummary.proteinTarget}g protein`
                        : 'No protein logged'}
                    </Text>
                  </View>
                </View>

                {/* Sleep */}
                <View style={styles.popupSection}>
                  <View style={styles.popupDotRow}>
                    <View style={[styles.popupDot, { backgroundColor: colors.purple, opacity: daySummary.sleepDuration ? 1 : 0.3 }]} />
                    <Text style={daySummary.sleepDuration ? styles.popupLabel : styles.popupMuted}>
                      {daySummary.sleepDuration
                        ? `${Math.floor(daySummary.sleepDuration / 60)}h ${daySummary.sleepDuration % 60}m sleep (bed ${daySummary.sleepBedtime})`
                        : 'No sleep logged'}
                    </Text>
                  </View>
                </View>

                {/* Score */}
                <View style={styles.popupScore}>
                  <Text style={styles.popupScoreText}>
                    {[daySummary.studySessions.length > 0, daySummary.gymType && daySummary.gymCompleted, daySummary.proteinGrams, daySummary.sleepDuration].filter(Boolean).length}/4 domains active
                  </Text>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  arrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowDisabled: {
    opacity: 0.3,
  },
  arrowText: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: -2,
  },
  arrowDisabledText: {
    color: colors.textMuted,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  headerCell: {
    flex: 1,
    alignItems: 'center',
    margin: 2,
  },
  headerText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '500',
  },

  // Modal popup
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  popup: {
    backgroundColor: colors.cardElevated,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: '#333',
  },
  popupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  popupDate: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  popupClose: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: '600',
  },
  popupSection: {
    marginBottom: 12,
  },
  popupDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  popupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  popupLabel: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  popupMuted: {
    fontSize: 14,
    color: colors.textMuted,
  },
  popupDetail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 18,
    marginTop: 4,
  },
  popupScore: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
    alignItems: 'center',
  },
  popupScoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accent,
  },
});
