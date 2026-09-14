import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const HISTORY_FILE = join(process.cwd(), 'public', 'notifications-history.json');

export interface NotificationRecord {
  id: string;
  sentAt: string;
  headingAr: string;
  headingEn: string;
  messageAr: string;
  messageEn: string;
  url: string;
  image: string | null;
  onesignalId: string | null;
  status: 'sent' | 'failed_no_subscribers' | 'failed_error' | string;
  recipients: number | null;
  createdAt: string;
  error?: string;
}

function readHistory(): { notifications: NotificationRecord[] } {
  if (!existsSync(HISTORY_FILE)) {
    return { notifications: [] };
  }
  try {
    return JSON.parse(readFileSync(HISTORY_FILE, 'utf8'));
  } catch {
    return { notifications: [] };
  }
}

function writeHistory(data: { notifications: NotificationRecord[] }): void {
  writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Save a notification record to history.
 */
export function putNotificationRecord(record: Omit<NotificationRecord, 'createdAt'>): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const history = readHistory();
      const newRecord = { ...record, createdAt: new Date().toISOString() };
      history.notifications.unshift(newRecord);
      // Keep last 100 notifications max
      if (history.notifications.length > 100) {
        history.notifications = history.notifications.slice(0, 100);
      }
      writeHistory(history);
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Get all notification records, newest first.
 */
export function getNotificationHistory(): NotificationRecord[] {
  const history = readHistory();
  return [...history.notifications].sort(
    (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
  );
}

/**
 * Get a single notification record by ID.
 */
export function getNotificationById(id: string): NotificationRecord | null {
  const history = readHistory();
  return history.notifications.find(n => n.id === id) || null;
}

