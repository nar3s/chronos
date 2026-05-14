export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Bookmark {
  id: string;
  date: string; // The base date/start date (YYYY-MM-DD)
  label: string;
  note?: string;
  notifyAt?: string; // ISO string 
  notificationId?: string;
  recurrence?: RecurrenceType;
}
