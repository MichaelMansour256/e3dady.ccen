/**
 * /admin/attendance/meetings — open/close meetings and manage their dates.
 *
 * Attendance sessions live in ONE table (meetings + attendance), so "starting the
 * meeting" is just opening the current row: while it is open, scans are recorded
 * for it; when it is closed, scanning stops recording for that meeting. Opening a
 * meeting closes any other open one, so there is never more than one live session.
 */
"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Meeting } from "@/lib/attendance";
import { useAttendanceApi } from "@/components/attendance/AdminAuthProvider";
import {
  Banner,
  Card,
  EmptyState,
  Spinner,
  dangerBtn,
  formatDateAr,
  formatWeekdayAr,
  inputClass,
  primaryBtn,
  subtleBtn,
  successBtn,
} from "@/components/attendance/ui";

interface MeetingRow extends Meeting {
  present: number;
  absent: number;
  rate: number;
}

const STATUS_LABEL: Record<string, string> = {
  scheduled: "⏳ لم يبدأ",
  active: "🟢 مفتوح",
  closed: "🔴 مغلق",
};

function todayIso(): string {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export default function AttendanceMeetingsPage() {
  const { request, headers } = useAttendanceApi();

  const [meetings, setMeetings] = useState<MeetingRow[]>([]);
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [missingSchema, setMissingSchema] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: "اجتماع الأحد",
    meeting_date: todayIso(),
    start_time: "",
    end_time: "",
    open: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await request<{ meetings: MeetingRow[]; activeMeeting: Meeting | null }>(
      "/api/attendance/meetings?withStats=1"
    );
    if (res.ok && res.data) {
      setMeetings(res.data.meetings);
      setActiveMeeting(res.data.activeMeeting);
      setError(null);
      setMissingSchema(false);
    } else {
      setError(res.error ?? "تعذّر تحميل الاجتماعات");
      setMissingSchema(Boolean(res.missingSchema));
    }
    setLoading(false);
  }, [request]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = useCallback(async () => {
    if (!form.title.trim() || !form.meeting_date) {
      setNotice("⚠️ أدخل عنوان الاجتماع والتاريخ");
      return;
    }
    const res = await request<Meeting>("/api/attendance/meetings", {
      json: {
        title: form.title,
        meeting_date: form.meeting_date,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        open: form.open,
      },
    });
    if (!res.ok) {
      setNotice(`⚠️ ${res.error ?? "فشل إنشاء الاجتماع"}`);
      return;
    }
    setNotice(
      form.open ? "✅ تم إنشاء الاجتماع وفتح الحضور" : "✅ تم إنشاء الاجتماع (غير مفتوح)"
    );
    setShowCreate(false);
    void load();
  }, [request, form, load]);

  const setStatus = useCallback(
    async (meeting: MeetingRow, action: "open" | "close") => {
      if (action === "close" && !window.confirm(`إغلاق الحضور في «${meeting.title}»؟`)) return;
      setBusyId(meeting.id);
      const res = await request<Meeting>("/api/attendance/meetings", {
        method: "PATCH",
        json: { id: meeting.id, action },
      });
      setBusyId(null);
      if (!res.ok) {
        setNotice(`⚠️ ${res.error ?? "فشل تحديث حالة الاجتماع"}`);
        return;
      }
      setNotice(
        action === "open"
          ? `🟢 تم فتح الحضور في «${meeting.title}» — المسح يعمل الآن`
          : `🔴 تم إغلاق الحضور في «${meeting.title}»`
      );
      void load();
    },
    [request, load]
  );

  const removeMeeting = useCallback(
    async (meeting: MeetingRow) => {
      const confirmed = window.confirm(
        `حذف «${meeting.title}» بتاريخ ${meeting.meeting_date}؟\n\nسيتم حذف سجل الحضور الخاص به أيضًا.`
      );
      if (!confirmed) return;
      const res = await request<{ ok: boolean }>(
        `/api/attendance/meetings?id=${encodeURIComponent(meeting.id)}`,
        { method: "DELETE" }
      );
      setNotice(res.ok ? "🗑️ تم حذف الاجتماع" : `⚠️ ${res.error ?? "فشل الحذف"}`);
      void load();
    },
    [request, load]
  );

  const exportExcel = useCallback(
    async (meeting: MeetingRow) => {
      const res = await fetch(
        `/api/attendance/export?meetingId=${encodeURIComponent(meeting.id)}`,
        { headers }
      );
      if (!res.ok) {
        setNotice("⚠️ تعذّر تصدير الملف");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `attendance-${meeting.meeting_date}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    },
    [headers]
  );

  const upcoming = useMemo(
    () => meetings.filter((m) => m.status === "scheduled").length,
    [meetings]
  );
