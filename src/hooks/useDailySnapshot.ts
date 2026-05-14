import { useSnapshotStore } from '@/src/store/snapshotStore';
import { useStudyStore } from '@/src/store/studyStore';
import { useGymStore } from '@/src/store/gymStore';
import { useNutritionStore } from '@/src/store/nutritionStore';
import { getTodayPPLDay } from '@/src/utils/ppl';
import { pplLabel, pplSubtitle, minutesToHHMM } from '@/src/utils/formatters';
import { formatDisplayDate, getToday } from '@/src/utils/dates';
import { TOPICS } from '@/src/domain/constants/topics';

export function useDailySnapshot() {
  const snapshot = useSnapshotStore();
  const study = useStudyStore();
  const gym = useGymStore();
  const nutrition = useNutritionStore();

  const todaySnapshot = snapshot.getTodaySnapshot();
  const morningStreak = snapshot.getMorningBlockStreak();
  const gymStreak = gym.getGymStreak();
  const todayNutrition = nutrition.getTodayLog();
  const todayStudyMinutes = study.getTodayMinutes();
  const todaySleepLog = gym.getTodaySleepLog();
  const todaySession = gym.getTodaySession();
  const pplDay = getTodayPPLDay();
  const todayStudySessions = study.getTodaySessions();
  const isRestDay = pplDay === 'rest';
  const isGymSkippedToday = !!todaySnapshot?.gymSkipped;
  const isGymDoneToday =
    isRestDay ||
    isGymSkippedToday ||
    !!todaySession?.completed ||
    !!todaySnapshot?.gymCompleted;
  const todayProteinGrams =
    todayNutrition?.proteinGrams ?? todaySnapshot?.proteinGrams ?? 0;

  const displayDate = formatDisplayDate(getToday());

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
    isGymDoneToday,
    todayProteinGrams,
    studyFocus,
    gymFocus,
    pplDay,
  };
}
