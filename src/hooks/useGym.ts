import { useEffect, useRef, useState } from 'react';
import { useGymStore } from '@/src/store/gymStore';
import { useNutritionStore } from '@/src/store/nutritionStore';
import { getPPLDayForDate, getTodayPPLDay } from '@/src/utils/ppl';
import { getToday } from '@/src/utils/dates';
import { formatBedtime } from '@/src/utils/formatters';
import { EXERCISE_TEMPLATES } from '@/src/domain/constants/exercises';
import type { WorkoutSession, PPLDay, ExerciseEntry } from '@/src/domain/types/gym';

function buildExercises(sessions: WorkoutSession[], type: PPLDay, beforeDate: string): ExerciseEntry[] {
  const last = sessions
    .filter((s) => s.type === type && s.date < beforeDate)
    .sort((a, b) => b.date.localeCompare(a.date))[0];

  if (last) {
    return last.exercises.map((ex) => ({ ...ex, done: false }));
  }
  return EXERCISE_TEMPLATES[type as Exclude<PPLDay, 'rest'>].map((ex) => ({ ...ex }));
}

export function useGym() {
  const gym = useGymStore();
  const nutrition = useNutritionStore();
  const didAutoCreate = useRef(false);
  const [selectedDate, setSelectedDate] = useState(getToday());

  const today = getToday();
  const pplDay = getTodayPPLDay();
  const todaySession = gym.getTodaySession();
  const selectedPplDay = getPPLDayForDate(selectedDate);
  const selectedSession = gym.getSessionByDate(selectedDate);

  useEffect(() => {
    if (!todaySession && pplDay !== 'rest' && !didAutoCreate.current) {
      didAutoCreate.current = true;
      const exercises = buildExercises(gym.sessions, pplDay, today);
      gym.addSession({
        id: `w-${today}`,
        date: today,
        type: pplDay,
        exercises,
        completed: false,
      });
    }
  }, [today, todaySession, pplDay, gym]);

  useEffect(() => {
    if (selectedDate !== today && !selectedSession && selectedPplDay !== 'rest') {
      const exercises = buildExercises(gym.sessions, selectedPplDay, selectedDate);
      gym.addSession({
        id: `w-${selectedDate}`,
        date: selectedDate,
        type: selectedPplDay,
        exercises,
        completed: false,
      });
    }
  }, [selectedDate, selectedSession, selectedPplDay, today, gym]);

  const weekGrid = gym.getThisWeekGrid();
  const sleepLog = gym.getTodaySleepLog();
  const latestWeight = gym.getLatestBodyWeight();
  const weightTrend = gym.getBodyWeightTrend();
  const gymStreak = gym.getGymStreak();
  const todayNutrition = nutrition.getTodayLog();
  const recentSessions = gym.getRecentSessions(7);

  const sleepDisplay = sleepLog
    ? {
        duration: sleepLog.durationMinutes,
        bedtimeLabel: formatBedtime(sleepLog.bedtime),
        wakeLabel: formatBedtime(sleepLog.wakeTime),
        isLate: sleepLog.bedtime > '23:45',
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
    setSelectedDate,
    toggleExercise: gym.toggleExercise,
    markSessionComplete: gym.markSessionComplete,
    addSleepLog: gym.addSleepLog,
    addBodyWeight: gym.addBodyWeight,
  };
}
