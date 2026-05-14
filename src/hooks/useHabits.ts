import { useHabitStore } from '@/src/store/habitStore';
import { getToday } from '@/src/utils/dates';

export function useHabits() {
  const habits = useHabitStore((s) => s.habits);
  const allLogs = useHabitStore((s) => s.logs);
  const toggleHabit = useHabitStore((s) => s.toggleHabit);
  const addHabit = useHabitStore((s) => s.addHabit);
  const removeHabit = useHabitStore((s) => s.removeHabit);
  const reorderHabits = useHabitStore((s) => s.reorderHabits);

  const today = getToday();
  const todayLogs = allLogs.filter((l) => l.date === today);
  const todayDone = todayLogs.length;
  const todayTotal = habits.length;

  const sortedHabits = [...habits].sort((a, b) => a.order - b.order);

  const habitsWithStatus = sortedHabits.map((h) => ({
    ...h,
    completedToday: todayLogs.some((l) => l.habitId === h.id),
    streak: useHabitStore.getState().getStreak(h.id),
  }));

  return {
    habits: habitsWithStatus,
    todayDone,
    todayTotal,
    toggleHabit,
    addHabit,
    removeHabit,
    reorderHabits,
  };
}
