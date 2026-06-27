import { useSnapshotStore } from '@/src/store/snapshotStore';
import { useStudyStore } from '@/src/store/studyStore';
import { useGymStore } from '@/src/store/gymStore';
import { useNutritionStore } from '@/src/store/nutritionStore';
import { getTodayPPLDay } from '@/src/utils/ppl';
import { pplLabel, pplSubtitle, minutesToHHMM } from '@/src/utils/formatters';
import { calculateStreak, formatDisplayDate, getToday } from '@/src/utils/dates';
import { TOPICS } from '@/src/domain/constants/topics';

export function useDailySnapshot() {
  const snapshots = useSnapshotStore((s) => s.snapshots);
  const studySessions = useStudyStore((s) => s.sessions);
  const gymSessions = useGymStore((s) => s.sessions);
  const sleepLogs = useGymStore((s) => s.sleepLogs);
  const nutritionLogs = useNutritionStore((s) => s.logs);

  const today = getToday();
  const todaySnapshot = snapshots.find((snapshot) => snapshot.date === today) ?? null;
  const morningStreak = calculateStreak(
    [
      ...new Set(
        snapshots
          .filter((snapshot) => snapshot.morningBlockStarted)
          .map((snapshot) => snapshot.date)
      ),
    ]
  );
  const gymStreak = calculateStreak(
    [
      ...new Set(
        gymSessions
          .filter((session) => session.completed)
          .map((session) => session.date)
      ),
    ]
  );
  const todayNutrition = nutritionLogs.find((log) => log.date === today) ?? null;
  const todayStudySessions = studySessions.filter((session) => session.date === today);
  const todayStudyMinutes = todayStudySessions.reduce(
    (sum, session) => sum + session.durationMinutes,
    0
  );
  const todaySleepLog = sleepLogs.find((log) => log.date === today) ?? null;
  const todaySession = gymSessions.find((session) => session.date === today) ?? null;
  const pplDay = getTodayPPLDay();
  const isRestDay = pplDay === 'rest';
  const isGymSkippedToday = !!todaySnapshot?.gymSkipped;
  const isStudySkippedToday = !!todaySnapshot?.studySkipped;
  const isProteinSkippedToday = !!todaySnapshot?.proteinSkipped;
  const isGymDoneToday =
    isRestDay ||
    isGymSkippedToday ||
    !!todaySession?.completed ||
    !!todaySnapshot?.gymCompleted;
  const todayProteinGrams =
    todayNutrition?.proteinGrams ?? todaySnapshot?.proteinGrams ?? 0;
  const isStudyDoneOrSkipped = todayStudyMinutes > 0 || isStudySkippedToday;
  const isProteinDoneOrSkipped =
    todayProteinGrams > 0 || isProteinSkippedToday;

  const displayDate = formatDisplayDate(today);

  const studyFocus = todayStudySessions[0]
    ? {
        subtopic: todayStudySessions[0].subtopic,
        topic: TOPICS[todayStudySessions[0].topic]?.label ?? todayStudySessions[0].topic,
      }
    : { subtopic: 'No session yet', topic: 'Start studying' };

  const gymFocus = {
    label: pplLabel(pplDay),
    subtitle: pplSubtitle(pplDay),
    type: pplDay,
  };

  return {
    displayDate,
    todaySnapshot,
    morningStreak,
    gymStreak,
    todayNutrition,
    todayStudyMinutes,
    todayStudyDisplay: minutesToHHMM(todayStudyMinutes),
    todaySleepLog,
    todaySession,
    isRestDay,
    isGymSkippedToday,
    isStudySkippedToday,
    isProteinSkippedToday,
    isGymDoneToday,
    isStudyDoneOrSkipped,
    isProteinDoneOrSkipped,
    todayProteinGrams,
    studyFocus,
    gymFocus,
    pplDay,
  };
}
