/**
 * /admin/attendance/dashboard — live attendance board.
 *
 * Shows the open meeting (or any meeting picked from the list) with totals,
 * search, present/absent filters and sorting, and keeps itself up to date.
 *
 * Live updates: the board polls the dashboard API — every 5s while the meeting is
 * open, every 20s otherwise — and refreshes immediately when the tab becomes
 * visible again or when the servant taps تحديث. Polling is deliberate: this
 * project's Supabase key is a server-side secret, so a browser Realtime
 * subscription would mean shipping that key to every phone (forbidden by the
 * security requirements). The poll pauses while the tab is hidden.
 */
"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Meeting, MeetingMemberRow, MeetingStats } from "@/lib/attendance";
import { useAttendanceApi } from "@/components/attendance/AdminAuthProvider";
import {
  Banner,
  Card,
  EmptyState,
  PresentPill,
  Spinner,
  StatCard,
  formatDateAr,
  formatTimeAr,
  inputClass,
  primaryBtn,
  subtleBtn,
  successBtn,
} from "@/components/attendance/ui";

interface DashboardPayload {
  meeting: Meeting | null;
  activeMeeting: Meeting | null;
  isActive?: boolean;
  stats: MeetingStats;
  members: MeetingMemberRow[];
}

interface MeetingOption extends Meeting {
  present: number;
  absent: number;
  rate: number;
}

type Filter = "all" | "present" | "absent";
type SortKey = "check_in_time" | "name" | "member_code";

const OPEN_POLL_MS = 5000;
const CLOSED_POLL_MS = 20000;

export default function AttendanceDashboardPage() {
  const { request, headers } = useAttendanceApi();

  const [meetingId, setMeetingId] = useState("");
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [meetings, setMeetings] = useState<MeetingOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missingSchema, setMissingSchema] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [exporting, setExporting] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("check_in_time");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const meetingIdRef = useRef("");
  useEffect(() => {
    meetingIdRef.current = meetingId;
  }, [meetingId]);

  const fetchDashboard = useCallback(
    async (id?: string) => {
      const target = id ?? meetingIdRef.current;
      const res = await request<DashboardPayload>(
        `/api/attendance/dashboard${target ? `?meetingId=${encodeURIComponent(target)}` : ""}`
      );
      if (res.ok && res.data) {
        setData(res.data);
        setError(null);
        setMissingSchema(false);
        setUpdatedAt(new Date());
        // First load with no explicit selection: follow the open meeting.
        if (!meetingIdRef.current && res.data.meeting) setMeetingId(res.data.meeting.id);
      } else {
        setError(res.error ?? "تعذّر تحميل لوحة الحضور");
        setMissingSchema(Boolean(res.missingSchema));
      }
      setLoading(false);
    },
    [request]
  );

  const fetchMeetings = useCallback(async () => {
    const res = await request<{ meetings: MeetingOption[] }>(
      "/api/attendance/meetings?withStats=1"
    );
    if (res.ok && res.data) setMeetings(res.data.meetings);
  }, [request]);

  useEffect(() => {
    void fetchMeetings();
  }, [fetchMeetings]);

  useEffect(() => {
    void fetchDashboard(meetingId);
  }, [fetchDashboard, meetingId]);

  // ── Live polling (paused while the tab is hidden) ──
  useEffect(() => {
    const interval = data?.isActive === false ? CLOSED_POLL_MS : OPEN_POLL_MS;
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      void fetchDashboard();
    };
    const timer = window.setInterval(tick, interval);
    const onVisible = () => {
      if (document.visibilityState === "visible") void fetchDashboard();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [data?.isActive, fetchDashboard]);
}