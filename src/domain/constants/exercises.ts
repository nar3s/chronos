import type { ExerciseEntry, PPLDay } from '../types/gym';

/** Default exercise templates for each PPL day. Used to auto-generate today's session. */
export const EXERCISE_TEMPLATES: Record<Exclude<PPLDay, 'rest'>, ExerciseEntry[]> = {
  push: [
    { name: 'Bench Press', sets: 4, reps: 8, done: false },
    { name: 'Incline DB Press', sets: 3, reps: 10, done: false },
    { name: 'OHP', sets: 3, reps: 8, done: false },
    { name: 'Lateral Raises', sets: 3, reps: 15, done: false },
    { name: 'Tricep Pushdown', sets: 3, reps: 12, done: false },
  ],
  pull: [
    { name: 'Deadlift', sets: 4, reps: 5, done: false },
    { name: 'Barbell Row', sets: 4, reps: 8, done: false },
    { name: 'Pull-ups', sets: 3, reps: 8, done: false },
    { name: 'Face Pulls', sets: 3, reps: 15, done: false },
    { name: 'Barbell Curl', sets: 3, reps: 10, done: false },
  ],
  legs: [
    { name: 'Squat', sets: 4, reps: 6, done: false },
    { name: 'Romanian Deadlift', sets: 3, reps: 10, done: false },
    { name: 'Leg Press', sets: 3, reps: 12, done: false },
    { name: 'Leg Curl', sets: 3, reps: 12, done: false },
    { name: 'Calf Raises', sets: 4, reps: 20, done: false },
  ],
};
