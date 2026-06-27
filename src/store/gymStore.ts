import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { WorkoutSession, ExerciseEntry, SleepLog, BodyWeightEntry } from '@/src/domain/types/gym';
import { getToday, calculateStreak, getWeekDates } from '@/src/utils/dates';
import { zustandStorage } from '@/src/services/storage';

interface GymData {
  sessions: WorkoutSession[];
  sleepLogs: SleepLog[];
  bodyWeightEntries: BodyWeightEntry[];
}

interface GymState extends GymData {
  addSession: (session: WorkoutSession) => void;
  toggleExercise: (sessionId: string, exerciseName: string) => void;
  markSessionComplete: (sessionId: string, completed: boolean) => void;
  addExercise: (sessionId: string, exercise: ExerciseEntry) => void;
  removeExercise: (sessionId: string, exerciseName: string) => void;
  updateExercise: (sessionId: string, exerciseName: string, patch: Partial<ExerciseEntry>) => void;
  addSleepLog: (log: SleepLog) => void;
  addBodyWeight: (entry: BodyWeightEntry) => void;

  getTodaySession: () => WorkoutSession | null;
  getSessionByDate: (date: string) => WorkoutSession | null;
  getThisWeekGrid: () => { day: string; label: string; completed: boolean; isToday: boolean }[];
  getTodaySleepLog: () => SleepLog | null;
  getLatestBodyWeight: () => BodyWeightEntry | null;
  getBodyWeightTrend: () => number[];
  getGymStreak: () => number;
  getRecentSessions: (limit?: number) => WorkoutSession[];
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const useGymStore = create<GymState>()(
  persist(
    (set, get) => ({
      sessions: [],
      sleepLogs: [],
      bodyWeightEntries: [],

      addSession: (session) =>
        set((s) => ({
          sessions: s.sessions.some(
            (existing) => existing.id === session.id || existing.date === session.date
          )
            ? s.sessions
            : [...s.sessions, session],
        })),

      toggleExercise: (sessionId, exerciseName) =>
        set((s) => ({
          sessions: s.sessions.map((sess) => {
            if (sess.id !== sessionId) return sess;
            const exercises = sess.exercises.map((ex) =>
              ex.name === exerciseName ? { ...ex, done: !ex.done } : ex
            );
            const allDone = exercises.length > 0 && exercises.every((ex) => ex.done);
            return { ...sess, exercises, completed: allDone };
          }),
        })),

      addExercise: (sessionId, exercise) =>
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === sessionId
              ? { ...sess, exercises: [...sess.exercises, exercise] }
              : sess
          ),
        })),

      removeExercise: (sessionId, exerciseName) =>
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === sessionId
              ? { ...sess, exercises: sess.exercises.filter((ex) => ex.name !== exerciseName) }
              : sess
          ),
        })),

      updateExercise: (sessionId, exerciseName, patch) =>
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === sessionId
              ? {
                  ...sess,
                  exercises: sess.exercises.map((ex) =>
                    ex.name === exerciseName ? { ...ex, ...patch } : ex
                  ),
                }
              : sess
          ),
        })),

      markSessionComplete: (sessionId, completed) =>
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === sessionId ? { ...sess, completed } : sess
          ),
        })),

      addSleepLog: (log) =>
        set((s) => ({
          sleepLogs: [
            ...s.sleepLogs.filter((l) => l.date !== log.date),
            log,
          ],
        })),

      addBodyWeight: (entry) =>
        set((s) => ({
          bodyWeightEntries: [
            ...s.bodyWeightEntries.filter((e) => e.date !== entry.date),
            entry,
          ],
        })),

      getTodaySession: () => {
        const today = getToday();
        return get().sessions.find((s) => s.date === today) ?? null;
      },

      getSessionByDate: (date) => {
        return get().sessions.find((s) => s.date === date) ?? null;
      },

      getThisWeekGrid: () => {
        const weekDates = getWeekDates();
        const today = getToday();
        const sessions = get().sessions;
        return weekDates.map((date, i) => ({
          day: date,
          label: DAY_LABELS[i],
          completed: sessions.some((s) => s.date === date && s.completed),
          isToday: date === today,
        }));
      },

      getTodaySleepLog: () => {
        const today = getToday();
        return get().sleepLogs.find((l) => l.date === today) ?? null;
      },

      getLatestBodyWeight: () => {
        const entries = get().bodyWeightEntries;
        if (entries.length === 0) return null;
        return [...entries].sort((a, b) => b.date.localeCompare(a.date))[0];
      },

      getBodyWeightTrend: () => {
        return [...get().bodyWeightEntries]
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(-7)
          .map((e) => e.weightKg);
      },

      getGymStreak: () => {
        const completedDates = [
          ...new Set(
            get()
              .sessions.filter((s) => s.completed)
              .map((s) => s.date)
          ),
        ];
        return calculateStreak(completedDates);
      },

      getRecentSessions: (limit = 10) => {
        const today = getToday();
        return [...get().sessions]
          .filter((s) => s.date !== today)
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, limit);
      },
    }),
    {
      name: 'gym-store-v2',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state): GymData => ({
        sessions: state.sessions,
        sleepLogs: state.sleepLogs,
        bodyWeightEntries: state.bodyWeightEntries,
      }),
    }
  )
);
