export interface PlannedStudyItem {
  id: string;
  date: string;           // YYYY-MM-DD
  topic: string;
  subtopic: string;       // what to study that day
  plannedMinutes: number;
  completed: boolean;
}
