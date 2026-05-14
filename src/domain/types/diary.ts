export type MoodType = 'great' | 'good' | 'okay' | 'rough';
export type TaskCategory = 'study' | 'gym' | 'personal' | 'work' | 'other';

export interface DiaryEntry {
  id: string;
  date: string;
  highlights: string[];
  takeaway: string;
  mood: MoodType | null;
}

export interface DoneTask {
  id: string;
  date: string;
  title: string;
  description?: string;
  category: TaskCategory;
}
