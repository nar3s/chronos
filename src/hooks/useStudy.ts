import { useStudyStore } from '@/src/store/studyStore';
import { daysBetween, getToday } from '@/src/utils/dates';
import { TOPICS } from '@/src/domain/constants/topics';

export function useStudy() {
  const store = useStudyStore();
  const todayMinutes = store.getTodayMinutes();
  const todaySessions = store.getTodaySessions();
  const heatmap = store.getWeekHeatmap();
  const checkpoint = store.getUpcomingCheckpoint();
  const studyStreak = store.getMorningBlockStreak();
  const recentSessions = store.getRecentSessions(50);
  const weeklyStats = store.getWeeklyStats();

  const daysUntilExam = checkpoint
    ? daysBetween(getToday(), checkpoint.date)
    : null;

  const topicsWithProgress = store.goals.map((g) => ({
    ...g,
    label: TOPICS[g.topicId]?.label ?? g.topicId,
    color: TOPICS[g.topicId]?.color ?? '#666',
    pct: Math.min(Math.round((g.loggedHours / g.targetHours) * 100), 100),
  }));

  const latestSession = todaySessions[0] ?? null;

  return {
    todayMinutes,
    todaySessions,
    todaySessionCount: todaySessions.length,
    heatmap,
    checkpoint,
    daysUntilExam,
    studyStreak,
    topicsWithProgress,
    latestSession,
    recentSessions,
    weeklyStats,
    addSession: store.addSession,
    updateSession: store.updateSession,
    removeSession: store.removeSession,
    goals: store.goals,
  };
}
