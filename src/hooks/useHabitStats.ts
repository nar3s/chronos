import { useMemo } from 'react';
import { useHabitStore } from '@/src/store/habitStore';
import {
  getToday,
  getWeekDates,
  getWeeksBack,
  calculateStreak,
  calculateBestStreak,
} from '@/src/utils/dates';
import type { Habit, HabitLog } from '@/src/domain/types/habit';

export interface HabitDayDetail {
  date: string;
  done: { id: string; label: string }[];
  missed: { id: string; label: string }[];
  activeCount: number;
}

export interface PerHabitStat {
  id: string;
  label: string;
  emoji: string;
  currentStreak: number;
  bestStreak: number;
  completionPct: number;
  thisWeek: boolean[];
}

function dayOf(iso: string): string {
  return iso.slice(0, 10);
}

function ratioToLevel(done: number, active: number): number {
  if (active <= 0 || done <= 0) return 0;
  return Math.min(4, Math.ceil((done / active) * 4));
}

function activeOn(habits: Habit[], date: string): Habit[] {
  return habits.filter((h) => dayOf(h.createdAt) <= date);
}

function doneOn(logs: HabitLog[], habits: Habit[], date: string): number {
  const ids = new Set(habits.map((h) => h.id));
  const seen = new Set<string>();
  for (const l of logs) {
    if (l.date === date && ids.has(l.habitId)) seen.add(l.habitId);
  }
  return seen.size;
}

/**
 * Derives all habit visualisations outside the Zustand selector (raw arrays in,
 * memoised data out) per the repo selector rule.
 */
export function useHabitStats(weeksBack = 15) {
  const habits = useHabitStore((s) => s.habits);
  const logs = useHabitStore((s) => s.logs);

  return useMemo(() => {
    const today = getToday();

    const weeks = getWeeksBack(weeksBack);
    const heatmap = weeks.map((week) =>
      week.map((date) => {
        if (date > today) return 0;
        const active = activeOn(habits, date).length;
        const done = doneOn(logs, habits, date);
        return ratioToLevel(done, active);
      })
    );
    const heatmapDays = weeks;

    const weekDates = getWeekDates();

    const perHabit: PerHabitStat[] = [...habits]
      .sort((a, b) => a.order - b.order)
      .map((h) => {
        const habitDates = [
          ...new Set(logs.filter((l) => l.habitId === h.id).map((l) => l.date)),
        ];
        const created = dayOf(h.createdAt);

        let den = 0;
        let num = 0;
        for (let i = 0; i < 30; i++) {
          const d = new Date(today + 'T00:00:00');
          d.setDate(d.getDate() - i);
          const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
            d.getDate()
          ).padStart(2, '0')}`;
          if (ds < created) continue;
          den++;
          if (habitDates.includes(ds)) num++;
        }

        return {
          id: h.id,
          label: h.label,
          emoji: h.emoji,
          currentStreak: calculateStreak(habitDates),
          bestStreak: calculateBestStreak(habitDates),
          completionPct: den > 0 ? Math.round((num / den) * 100) : 0,
          thisWeek: weekDates.map((d) => d <= today && habitDates.includes(d)),
        };
      });

    let win30Done = 0;
    let win30Active = 0;
    const perfectDates: string[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(today + 'T00:00:00');
      d.setDate(d.getDate() - i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      const active = activeOn(habits, ds).length;
      const done = doneOn(logs, habits, ds);
      win30Active += active;
      win30Done += done;
      if (active > 0 && done >= active) perfectDates.push(ds);
    }

    const todayActive = activeOn(habits, today).length;
    const todayDone = doneOn(logs, habits, today);

    const overall = {
      todayDone,
      todayTotal: todayActive,
      completionPct: win30Active > 0 ? Math.round((win30Done / win30Active) * 100) : 0,
      perfectDayStreak: calculateStreak(perfectDates),
    };

    return { heatmap, heatmapDays, perHabit, overall };
  }, [habits, logs, weeksBack]);
}

/** On-demand detail for a tapped heatmap day (done vs missed habits). */
export function getHabitDayDetail(
  habits: Habit[],
  logs: HabitLog[],
  date: string
): HabitDayDetail {
  const active = habits.filter((h) => h.createdAt.slice(0, 10) <= date);
  const doneIds = new Set(
    logs.filter((l) => l.date === date).map((l) => l.habitId)
  );
  const done = active
    .filter((h) => doneIds.has(h.id))
    .map((h) => ({ id: h.id, label: h.label }));
  const missed = active
    .filter((h) => !doneIds.has(h.id))
    .map((h) => ({ id: h.id, label: h.label }));
  return { date, done, missed, activeCount: active.length };
}
