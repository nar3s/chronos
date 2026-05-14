import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StudySession, StudyGoal, ExamCheckpoint } from '@/src/domain/types/study';
import { getToday, getWeeksBack, calculateStreak } from '@/src/utils/dates';
import { zustandStorage } from '@/src/services/storage';
import { cancelMorningMissedAlert } from '@/src/services/notifications';
import { useSnapshotStore } from '@/src/store/snapshotStore';

interface StudyData {
  sessions: StudySession[];
  goals: StudyGoal[];
  checkpoints: ExamCheckpoint[];
}

interface StudyState extends StudyData {
  addSession: (session: StudySession) => void;
  updateSession: (id: string, patch: Partial<StudySession>) => void;
  removeSession: (id: string) => void;
  addGoal: (goal: StudyGoal) => void;
  updateGoal: (topicId: string, patch: Partial<StudyGoal>) => void;
  addCheckpoint: (checkpoint: ExamCheckpoint) => void;

  getTodaySessions: () => StudySession[];
  getTodayMinutes: () => number;
  getWeekHeatmap: () => number[][];
  getUpcomingCheckpoint: () => ExamCheckpoint | null;
  getMorningBlockStreak: () => number;
  getRecentSessions: (limit?: number) => StudySession[];
  getWeeklyStats: () => { totalMinutes: number; sessionCount: number; daysActive: number };
}

function minutesToHeatLevel(minutes: number): number {
  if (minutes === 0) return 0;
  if (minutes < 45) return 1;
  if (minutes < 75) return 2;
  if (minutes < 105) return 3;
  return 4;
}

function toLocalIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export const useStudyStore = create<StudyState>()(
  persist(
    (set, get) => ({
      sessions: [],
      goals: [],
      checkpoints: [],

      addSession: (session) => {
        set((s) => ({ sessions: [...s.sessions, session] }));
        if (session.date === getToday()) {
          cancelMorningMissedAlert().catch(() => {});
        }
      },

      updateSession: (id, patch) =>
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === id ? { ...sess, ...patch } : sess
          ),
        })),

      removeSession: (id) =>
        set((s) => {
          const target = s.sessions.find((sess) => sess.id === id);
          const nextSessions = s.sessions.filter((sess) => sess.id !== id);

          if (target?.date === getToday()) {
            const hasAnyTodaySessionsLeft = nextSessions.some((sess) => sess.date === target.date);
            if (!hasAnyTodaySessionsLeft) {
              useSnapshotStore.getState().updateSnapshot(target.date, {
                morningBlockStarted: false,
                morningBlockTime: undefined,
              });
            }
          }

          return { sessions: nextSessions };
        }),

      addGoal: (goal) =>
        set((s) => ({ goals: [...s.goals, goal] })),

      updateGoal: (topicId, patch) =>
        set((s) => ({
          goals: s.goals.map((g) =>
            g.topicId === topicId ? { ...g, ...patch } : g
          ),
        })),

      addCheckpoint: (checkpoint) =>
        set((s) => ({ checkpoints: [...s.checkpoints, checkpoint] })),

      getTodaySessions: () => {
        const today = getToday();
        return get().sessions.filter((s) => s.date === today);
      },

      getTodayMinutes: () => {
        const today = getToday();
        return get()
          .sessions.filter((s) => s.date === today)
          .reduce((sum, s) => sum + s.durationMinutes, 0);
      },

      getWeekHeatmap: () => {
        const weeks = getWeeksBack(4);
        const sessions = get().sessions;
        return weeks.map((week) =>
          week.map((date) => {
            const mins = sessions
              .filter((s) => s.date === date)
              .reduce((sum, s) => sum + s.durationMinutes, 0);
            return minutesToHeatLevel(mins);
          })
        );
      },

      getUpcomingCheckpoint: () => {
        const today = getToday();
        return (
          get()
            .checkpoints.filter((c) => c.status === 'upcoming' && c.date >= today)
            .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null
        );
      },

      getMorningBlockStreak: () => {
        const studyDates = [
          ...new Set(get().sessions.map((s) => s.date)),
        ];
        return calculateStreak(studyDates);
      },

      getRecentSessions: (limit = 10) => {
        const today = getToday();
        return [...get().sessions]
          .filter((s) => s.date !== today)
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, limit);
      },

      getWeeklyStats: () => {
        const today = getToday();
        const d = new Date(today + 'T00:00:00');
        const dayOfWeek = d.getDay();
        const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const monday = new Date(d);
        monday.setDate(d.getDate() - mondayOffset);
        const mondayStr = toLocalIsoDate(monday);

        const weekSessions = get().sessions.filter(
          (s) => s.date >= mondayStr && s.date <= today
        );
        const totalMinutes = weekSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
        const daysActive = new Set(weekSessions.map((s) => s.date)).size;
        return { totalMinutes, sessionCount: weekSessions.length, daysActive };
      },
    }),
    {
      name: 'study-store-v2',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state): StudyData => ({
        sessions: state.sessions,
        goals: state.goals,
        checkpoints: state.checkpoints,
      }),
    }
  )
);
