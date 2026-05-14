export interface Habit {
  id: string;
  label: string;
  emoji: string;
  order: number;
  createdAt: string;
}

export interface HabitLog {
  habitId: string;
  date: string;
  completedAt: string;
}
