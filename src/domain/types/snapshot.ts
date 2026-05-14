export interface DailySnapshot {
  date: string;
  morningBlockStarted: boolean;
  morningBlockTime?: string;
  studyMinutes: number;
  gymCompleted: boolean;
  gymSkipped?: boolean;
  proteinGrams: number;
  sleepMinutes: number;
  intention?: string;
}
