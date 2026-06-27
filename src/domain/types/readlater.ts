export type ReadLaterType = 'article' | 'video' | 'x' | 'other';

export interface ReadLaterItem {
  id: string;
  url: string;
  title: string;
  note?: string;            // user's own note
  description?: string;     // auto-fetched page summary (og:description / author)
  type: ReadLaterType;
  date: string;             // YYYY-MM-DD the item was saved / targeted for
  isRead: boolean;
  readAt?: string;          // ISO datetime when marked read
  notifyAt?: string;        // ISO datetime for the optional reminder
  notificationId?: string;  // expo-notifications id (prefix: readlater-${id})
  createdAt: string;        // ISO datetime
}
