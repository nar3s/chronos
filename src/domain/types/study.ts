export type StudyTopic = string;

export interface StudySession {
  id: string;
  date: string;
  topic: StudyTopic;
  subtopic: string;
  durationMinutes: number;
  startedOnTime?: boolean;
  notes?: string;
}

export interface StudyGoal {
  topicId: StudyTopic;
  targetHours: number;
  loggedHours: number;
}

export interface ExamCheckpoint {
  name: string;
  date: string;
  status: 'upcoming' | 'completed';
}
