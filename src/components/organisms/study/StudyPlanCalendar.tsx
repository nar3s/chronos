import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { PlanDayData, PlanMonthStats } from '@/src/hooks/useStudyPlanCalendar';
import { colors } from '@/src/theme/colors';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface Props {
  days: PlanDayData[];
  stats: PlanMonthStats;
  monthLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onDayPress: (date: string) => void;
}

function cellBg(pct: number | null, planned: number, isFuture: boolean): string {
  if (planned === 0 || isFuture || pct === null) return 'transparent';
  if (pct >= 80) return 'rgba(34,197,94,0.22)';
  if (pct >= 40) return 'rgba(245,158,11,0.22)';
  return 'rgba(239,68,68,0.18)';
}

function cellBorderColor(pct: number | null, planned: number, isFuture: boolean, isToday: boolean): string {
  if (isToday) return colors.accent;
  if (planned === 0) return 'transparent';
  if (isFuture) return `${colors.accent}55`;
  if (pct === null) return 'transparent';
  if (pct >= 80) return `${colors.success}80`;
  if (pct >= 40) return `${colors.warning}80`;
  return `${colors.danger}80`;
}

function adherenceColor(pct: number): string {
  if (pct >= 80) return colors.success;
  if (pct >= 40) return colors.warning;
  return colors.danger;
}

export function StudyPlanCalendar({ days, stats, monthLabel, onPrev, onNext, onDayPress }: Props) {
  return (
    <View style={styles.card}>
      {/* Month navigation */}
      <View style={styles.navRow}>
        <TouchableOpacity onPress={onPrev} hitSlop={12}>
          <Text style={styles.navArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <TouchableOpacity onPress={onNext} hitSlop={12}>
          <Text style={styles.navArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {stats.plannedSessions === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No plan for this month</Text>
          <Text style={styles.emptyText}>Use the 📋 Plan button to import a study schedule</Text>
        </View>
      ) : (
        <>
          {/* Summary stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>
                {stats.completedSessions}/{stats.plannedSessions}
              </Text>
              <Text style={styles.statLabel}>sessions done</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: adherenceColor(stats.adherencePct) }]}>
                {stats.adherencePct}%
              </Text>
              <Text style={styles.statLabel}>adherence</Text>
            </View>
          </View>

          {/* Day-of-week header */}
          <View style={styles.dayHeaderRow}>
            {DAY_LABELS.map((d) => (
              <Text key={d} style={styles.dayHeaderText}>{d}</Text>
            ))}
          </View>

      {/* Calendar grid */}
      <View style={styles.grid}>
        {days.map((day, i) => {
          if (!day.isCurrentMonth) {
            return <View key={i} style={styles.blankCell} />;
          }

          const bg = cellBg(day.adherencePct, day.plannedMinutes, day.isFuture);
          const border = cellBorderColor(day.adherencePct, day.plannedMinutes, day.isFuture, day.isToday);
          const hasBorder = border !== 'transparent';

          return (
            <TouchableOpacity
              key={i}
              style={[
                styles.cell,
                {
                  backgroundColor: bg,
                  borderColor: border,
                  borderWidth: hasBorder ? 1 : 0,
                },
              ]}
              onPress={() => onDayPress(day.date)}
              activeOpacity={0.7}
            >
              <Text style={[styles.dayNum, day.isFuture && !day.isToday && styles.dimText]}>
                {day.dayNum}
              </Text>

              {/* Future days with a plan: show planned minutes */}
              {day.plannedMinutes > 0 && day.isFuture && (
                <Text style={styles.futurePlan}>{day.plannedMinutes}m</Text>
              )}

              {/* Past days with a plan: show adherence % */}
              {day.adherencePct !== null && day.plannedMinutes > 0 && (
                <Text style={[styles.pctText, { color: adherenceColor(day.adherencePct) }]}>
                  {day.adherencePct}%
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {[
          { bg: 'rgba(34,197,94,0.22)', border: `${colors.success}80`, label: '≥80%' },
          { bg: 'rgba(245,158,11,0.22)', border: `${colors.warning}80`, label: '40–79%' },
          { bg: 'rgba(239,68,68,0.18)', border: `${colors.danger}80`, label: '<40%' },
          { bg: 'transparent', border: `${colors.accent}55`, label: 'Planned' },
        ].map((item) => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.bg, borderColor: item.border, borderWidth: 1 }]} />
            <Text style={styles.legendText}>{item.label}</Text>
          </View>
        ))}
      </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  navArrow: {
    fontSize: 22,
    color: colors.accent,
    fontWeight: '600',
    paddingHorizontal: 6,
  },
  navDisabled: { color: colors.textMuted },
  monthLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.cardElevated,
    borderRadius: 10,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 20,
  },
  statItem: { alignItems: 'center' },
  statNum: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
  dayHeaderRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 9,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%` as unknown as number,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    paddingVertical: 1,
  },
  blankCell: {
    width: `${100 / 7}%` as unknown as number,
    aspectRatio: 1,
  },
  dayNum: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  dimText: { color: colors.textMuted },
  futurePlan: {
    fontSize: 8,
    color: colors.accent,
    fontWeight: '600',
    marginTop: 1,
  },
  pctText: {
    fontSize: 8,
    fontWeight: '700',
    marginTop: 1,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 10,
    color: colors.textMuted,
  },
});
