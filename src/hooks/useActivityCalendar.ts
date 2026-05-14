import { useState, useMemo, useCallback } from 'react';
import { useStudyStore } from '@/src/store/studyStore';
import { useGymStore } from '@/src/store/gymStore';
import { useNutritionStore } from '@/src/store/nutritionStore';
import { getToday } from '@/src/utils/dates';
import { minutesToHHMM } from '@/src/utils/formatters';
import { getTopicDisplay } from '@/src/domain/constants/topics';

export interface DayActivity {
  date: string;
  dayNum: number;
  study: boolean;
  gym: boolean;
  protein: boolean;
  sleep: boolean;
  activeCount: number;
  isToday: boolean;
  isFuture: boolean;
}

export interface DaySummary {
  date: string;
  studySessions: { topic: string; subtopic: string; minutes: number }[];
  studyTotal: string;
  gymType: string | null;
  gymCompleted: boolean;
  proteinGrams: number | null;
  proteinTarget: number | null;
  sleepDuration: number | null;
  sleepBedtime: string | null;
}

function getMonthDays(year: number, month: number): string[] {
  const days: string[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    days.push(`${year}-${mm}-${dd}`);
  }
  return days;
}

export function useActivityCalendar() {
  const studySessions = useStudyStore((s) => s.sessions);
  const gymSessions = useGymStore((s) => s.sessions);
  const sleepLogs = useGymStore((s) => s.sleepLogs);
  const nutritionLogs = useNutritionStore((s) => s.logs);

  const today = getToday();
  const now = new Date();

  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();

  const goNext = useCallback(() => {
    // Don't go past current month
    if (isCurrentMonth) return;
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
    setSelectedDate(null);
  }, [viewMonth, viewYear, isCurrentMonth]);

  const goPrev = useCallback(() => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
    setSelectedDate(null);
  }, [viewMonth]);

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const calendarData = useMemo(() => {
    const studyDates = new Set(studySessions.map((s) => s.date));
    const gymDates = new Set(
      gymSessions.filter((s) => s.completed).map((s) => s.date)
    );
    const sleepDates = new Set(sleepLogs.map((s) => s.date));
    const proteinDates = new Set(
      nutritionLogs
        .filter((l) => l.proteinGrams >= l.targetGrams * 0.8)
        .map((l) => l.date)
    );

    const monthDays = getMonthDays(viewYear, viewMonth);
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
    const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    const days: DayActivity[] = monthDays.map((date) => {
      const dayNum = parseInt(date.slice(-2), 10);
      const study = studyDates.has(date);
      const gym = gymDates.has(date);
      const protein = proteinDates.has(date);
      const sleep = sleepDates.has(date);
      const activeCount = [study, gym, protein, sleep].filter(Boolean).length;
      return {
        date,
        dayNum,
        study,
        gym,
        protein,
        sleep,
        activeCount,
        isToday: date === today,
        isFuture: date > today,
      };
    });

    return { days, startOffset };
  }, [studySessions, gymSessions, sleepLogs, nutritionLogs, today, viewYear, viewMonth]);

  // Compute day summary when a date is selected
  const daySummary: DaySummary | null = useMemo(() => {
    if (!selectedDate) return null;

    const dayStudy = studySessions.filter((s) => s.date === selectedDate);
    const dayGym = gymSessions.find((s) => s.date === selectedDate);
    const daySleep = sleepLogs.find((s) => s.date === selectedDate);
    const dayNutrition = nutritionLogs.find((l) => l.date === selectedDate);

    const totalMins = dayStudy.reduce((sum, s) => sum + s.durationMinutes, 0);

    return {
      date: selectedDate,
      studySessions: dayStudy.map((s) => ({
        topic: getTopicDisplay(s.topic).label,
        subtopic: s.subtopic,
        minutes: s.durationMinutes,
      })),
      studyTotal: minutesToHHMM(totalMins),
      gymType: dayGym?.type ?? null,
      gymCompleted: dayGym?.completed ?? false,
      proteinGrams: dayNutrition?.proteinGrams ?? null,
      proteinTarget: dayNutrition?.targetGrams ?? null,
      sleepDuration: daySleep?.durationMinutes ?? null,
      sleepBedtime: daySleep?.bedtime ?? null,
    };
  }, [selectedDate, studySessions, gymSessions, sleepLogs, nutritionLogs]);

  return {
    ...calendarData,
    monthLabel,
    isCurrentMonth,
    goNext,
    goPrev,
    selectedDate,
    setSelectedDate,
    daySummary,
  };
}
