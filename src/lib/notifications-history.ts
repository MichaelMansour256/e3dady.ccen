// Notification history storage using Supabase
// Replaces the previous file-based storage (public/notifications-history.json)
// which doesn't work on Vercel/serverless (read-only filesystem)

import { supabase } from "./supabase";

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
  status: "sent" | "failed_no_subscribers" | "failed_error" | string;
  recipients: number | null;
  createdAt: string;
  error?: string;
}

/**
 * Save a notification record to Supabase.
 */
export async function putNotificationRecord(
  record: Omit<NotificationRecord, "createdAt">
): Promise<void> {
  const { error } = await supabase.from("notifications_history").insert({
    ...record,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Failed to save notification record to Supabase:", error);
    throw error;
  }
}

/**
 * Get all notification records, newest first.
 */
export async function getNotificationHistory(): Promise<NotificationRecord[]> {
  const { data, error } = await supabase
    .from("notifications_history")
    .select("*")
    .order("sent_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Failed to fetch notification history from Supabase:", error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    sentAt: row.sent_at,
    headingAr: row.heading_ar,
    headingEn: row.heading_en,
    messageAr: row.message_ar,
    messageEn: row.message_en,
    url: row.url,
    image: row.image,
    onesignalId: row.onesignal_id,
    status: row.status,
    recipients: row.recipients,
    createdAt: row.created_at,
    error: row.error,
  }));
}

/**
 * Get a single notification record by ID.
 */
export async function getNotificationById(
  id: string
): Promise<NotificationRecord | null> {
  const { data, error } = await supabase
    .from("notifications_history")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    sentAt: data.sent_at,
    headingAr: data.heading_ar,
    headingEn: data.heading_en,
    messageAr: data.message_ar,
    messageEn: data.message_en,
    url: data.url,
    image: data.image,
    onesignalId: data.onesignal_id,
    status: data.status,
    recipients: data.recipients,
    createdAt: data.created_at,
    error: data.error,
  };
}

