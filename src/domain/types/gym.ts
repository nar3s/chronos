export type PPLDay = 'push' | 'pull' | 'legs' | 'rest';

export interface ExerciseEntry {
  name: string;
  sets: number;
  reps: number;
  weightKg?: number;
  done: boolean;
}

export interface WorkoutSession {
  id: string;
  date: string;
  type: PPLDay;
  exercises: ExerciseEntry[];
  completed: boolean;
}

export interface NutritionLog {
  date: string;
  proteinGrams: number;
  targetGrams: number;
}

export interface SleepLog {
  date: string;
  bedtime: string;
  wakeTime: string;
  durationMinutes: number;
}

export interface BodyWeightEntry {
  date: string;
  weightKg: number;
}
