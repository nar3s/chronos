import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useGymStore } from '@/src/store/gymStore';
import { useNutritionStore } from '@/src/store/nutritionStore';
import { getPPLDayForDate, getTodayPPLDay } from '@/src/utils/ppl';
import { calculateStreak, getToday, getWeekDates } from '@/src/utils/dates';
import { formatBedtime } from '@/src/utils/formatters';
import { EXERCISE_TEMPLATES } from '@/src/domain/constants/exercises';
import type { WorkoutSession, PPLDay, ExerciseEntry } from '@/src/domain/types/gym';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function buildExercises(sessions: WorkoutSession[], type: PPLDay, beforeDate: string): ExerciseEntry[] {
  const last = sessions
    .filter((s) => s.type === type && s.date < beforeDate)
    .sort((a, b) => b.date.localeCompare(a.date))[0];

  if (last) {
    return last.exercises.map((ex) => ({ ...ex, done: false }));
  }
  return EXERCISE_TEMPLATES[type as Exclude<PPLDay, 'rest'>].map((ex) => ({ ...ex }));
}

function getBedtimeMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  const total = hours * 60 + minutes;
  return hours < 5 ? total + 24 * 60 : total;
}

export function useGym() {
  const sessions = useGymStore((s) => s.sessions);
  const sleepLogs = useGymStore((s) => s.sleepLogs);
  const bodyWeightEntries = useGymStore((s) => s.bodyWeightEntries);
  const addSession = useGymStore((s) => s.addSession);
  const toggleExercise = useGymStore((s) => s.toggleExercise);
  const markSessionComplete = useGymStore((s) => s.markSessionComplete);
  const addSleepLog = useGymStore((s) => s.addSleepLog);
  const addBodyWeight = useGymStore((s) => s.addBodyWeight);
  const nutritionLogs = useNutritionStore((s) => s.logs);
  const didAutoCreateForDate = useRef<string | null>(null);
  const [today, setToday] = useState(getToday());
  const previousToday = useRef(today);
  const [selectedDate, setSelectedDate] = useState(today);

  const pplDay = getTodayPPLDay();
  const todaySession = sessions.find((session) => session.date === today) ?? null;
  const selectedPplDay = getPPLDayForDate(selectedDate);
  const selectedSession = sessions.find((session) => session.date === selectedDate) ?? null;

  useEffect(() => {
    const refreshToday = () => setToday(getToday());
    const interval = setInterval(refreshToday, 60 * 1000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshToday();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (previousToday.current === today) return;

    setSelectedDate((current) => (current === previousToday.current ? today : current));
    previousToday.current = today;
  }, [today]);

  useEffect(() => {
    if (!todaySession && pplDay !== 'rest' && didAutoCreateForDate.current !== today) {
      didAutoCreateForDate.current = today;
      const exercises = buildExercises(sessions, pplDay, today);
      addSession({
        id: `w-${today}`,
        date: today,
        type: pplDay,
        exercises,
        completed: false,
      });
    }
  }, [today, todaySession, pplDay, sessions, addSession]);

  useEffect(() => {
    if (selectedDate !== today && !selectedSession && selectedPplDay !== 'rest') {
      const exercises = buildExercises(sessions, selectedPplDay, selectedDate);
      addSession({
        id: `w-${selectedDate}`,
        date: selectedDate,
        type: selectedPplDay,
        exercises,
        completed: false,
      });
    }
  }, [selectedDate, selectedSession, selectedPplDay, today, sessions, addSession]);

  const weekGrid = getWeekDates().map((date, i) => ({
    day: date,
    label: DAY_LABELS[i],
    completed: sessions.some((session) => session.date === date && session.completed),
    isToday: date === today,
  }));
  const sleepLog = sleepLogs.find((log) => log.date === today) ?? null;
  const latestWeight =
    bodyWeightEntries.length > 0
      ? [...bodyWeightEntries].sort((a, b) => b.date.localeCompare(a.date))[0]
      : null;
  const weightTrend = [...bodyWeightEntries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7)
    .map((entry) => entry.weightKg);
  const completedDates = [
    ...new Set(sessions.filter((session) => session.completed).map((session) => session.date)),
  ];
  const gymStreak = calculateStreak(completedDates);
  const todayNutrition = nutritionLogs.find((log) => log.date === today) ?? null;
  const recentSessions = [...sessions]
    .filter((session) => session.date !== today)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);
  const selectedPastSessions = [...sessions]
    .filter((session) => session.date < selectedDate)
    .sort((a, b) => b.date.localeCompare(a.date));
  const lastWeightsByExercise = selectedPastSessions.reduce<Record<string, number>>(
    (acc, session) => {
      session.exercises.forEach((exercise) => {
        if (exercise.weightKg && acc[exercise.name] === undefined) {
          acc[exercise.name] = exercise.weightKg;
        }
      });
      return acc;
    },
    {}
  );

  const sleepDisplay = sleepLog
    ? {
        duration: sleepLog.durationMinutes,
        bedtimeLabel: formatBedtime(sleepLog.bedtime),
        wakeLabel: formatBedtime(sleepLog.wakeTime),
        isLate: getBedtimeMinutes(sleepLog.bedtime) > getBedtimeMinutes('23:45'),
      }
    : null;

  return {
    todaySession: selectedDate === today ? todaySession : selectedSession,
    selectedDate,
    selectedPplDay,
    pplDay,
    weekGrid,
    sleepLog,
    sleepDisplay,
    latestWeight,
    weightTrend,
    gymStreak,
    todayNutrition,
    recentSessions,
    lastWeightsByExercise,
    setSelectedDate,
    toggleExercise,
    markSessionComplete,
    addSleepLog,
    addBodyWeight,
  };
}
