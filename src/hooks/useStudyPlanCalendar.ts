import { useState, useMemo } from 'react';
import { useStudyPlanStore } from '@/src/store/studyPlanStore';
import { useStudyStore } from '@/src/store/studyStore';
import { getToday } from '@/src/utils/dates';

export interface PlanDayData {
  date: string;
  dayNum: number;
  isCurrentMonth: boolean;
  isFuture: boolean;
  isToday: boolean;
  plannedMinutes: number;
  actualMinutes: number;
  adherencePct: number | null;
}

export interface PlanMonthStats {
  plannedSessions: number;
  completedSessions: number;
  adherencePct: number;
}

export function useStudyPlanCalendar() {
  const today = getToday();
  const [ty, tm] = today.split('-').map(Number);
  const [viewYear, setViewYear] = useState(ty);
  const [viewMonth, setViewMonth] = useState(tm);

  const planItems = useStudyPlanStore((s) => s.items);
  const sessions = useStudyStore((s) => s.sessions);

  const yearMonth = `${viewYear}-${String(viewMonth).padStart(2, '0')}`;
  const currentYearMonth = `${ty}-${String(tm).padStart(2, '0')}`;
  const isCurrentMonth = yearMonth === currentYearMonth;

  const { days, stats } = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
    // Mon = 0 offset
    const firstDow = (new Date(viewYear, viewMonth - 1, 1).getDay() + 6) % 7;

    // date → total planned minutes
    const planMap = new Map<string, number>();
    planItems
      .filter((i) => i.date.startsWith(yearMonth))
      .forEach((i) => {
        planMap.set(i.date, (planMap.get(i.date) ?? 0) + i.plannedMinutes);
      });

    // date → total studied minutes
    const actualMap = new Map<string, number>();
    sessions
      .filter((s) => s.date.startsWith(yearMonth))
      .forEach((s) => {
        actualMap.set(s.date, (actualMap.get(s.date) ?? 0) + s.durationMinutes);
      });

    const days: PlanDayData[] = [];

    for (let i = 0; i < firstDow; i++) {
      days.push({ date: '', dayNum: 0, isCurrentMonth: false, isFuture: false, isToday: false, plannedMinutes: 0, actualMinutes: 0, adherencePct: null });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${yearMonth}-${String(d).padStart(2, '0')}`;
      const isFuture = dateStr > today;
      const isToday = dateStr === today;
      const planned = planMap.get(dateStr) ?? 0;
      const actual = actualMap.get(dateStr) ?? 0;
      const adherencePct = planned > 0 && !isFuture
        ? Math.round((actual / planned) * 100)
        : null;

      days.push({ date: dateStr, dayNum: d, isCurrentMonth: true, isFuture, isToday, plannedMinutes: planned, actualMinutes: actual, adherencePct });
    }

    // Month stats: session-count based
    const monthItems = planItems.filter((i) => i.date.startsWith(yearMonth));
    const plannedSessions = monthItems.length;
    const completedSessions = monthItems.filter((i) => i.completed).length;

    // Average adherence across past days that had a plan
    const pastWithPlan = days.filter((d) => d.isCurrentMonth && !d.isFuture && d.plannedMinutes > 0);
    const adherencePct =
      pastWithPlan.length > 0
        ? Math.round(
            pastWithPlan.reduce((sum, d) => sum + Math.min(d.adherencePct ?? 0, 100), 0) /
              pastWithPlan.length
          )
        : 0;

    return { days, stats: { plannedSessions, completedSessions, adherencePct } };
  }, [planItems, sessions, viewYear, viewMonth, yearMonth, today]);

  function goPrev() {
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function goNext() {
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  const monthLabel = new Date(viewYear, viewMonth - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return { days, stats, monthLabel, isCurrentMonth, goPrev, goNext };
}
