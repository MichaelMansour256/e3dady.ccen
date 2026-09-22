/**
 * /admin/attendance/scan — scan QR codes straight from a phone camera.
 *
 * The scan is automatic: as soon as a code is decoded the token goes to
 * /api/checkin and the result is shown (no second tap). The camera keeps running
 * for the next person in the queue; the same code is ignored for two seconds and
 * the database refuses duplicates anyway.
 *
 * If the camera is unavailable or denied, the manual field accepts the token or
 * the full check-in URL, so the servant is never stuck.
 */
"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Meeting } from "@/lib/attendance";
import { extractCheckinToken } from "@/lib/checkin-token";
import { useAttendanceApi } from "@/components/attendance/AdminAuthProvider";
import QrScanner from "@/components/attendance/Scanner";
import {
  Banner,
  Card,
  EmptyState,
  formatClockAr,
  inputClass,
  primaryBtn,
  subtleBtn,
} from "@/components/attendance/ui";

type ScanStatus =
  | "success"
  | "already_recorded"
  | "invalid_token"
  | "inactive_member"
  | "no_active_meeting"
  | "error";

interface CheckInResponse {
  ok: boolean;
  status: ScanStatus;
  message?: string;
  member?: { name: string; member_code: string };
  check_in_time?: string | null;
}

interface LogEntry {
  id: number;
  at: string;
  status: ScanStatus;
  name?: string;
  member_code?: string;
}

const TONES: Record<ScanStatus, "success" | "info" | "warning" | "error"> = {
  success: "success",
  already_recorded: "info",
  invalid_token: "error",
  inactive_member: "warning",
  no_active_meeting: "info",
  error: "error",
};

const ICONS: Record<ScanStatus, string> = {
  success: "✅",
  already_recorded: "🔁",
  invalid_token: "❌",
  inactive_member: "⚠️",
  no_active_meeting: "⏰",
  error: "❌",
};

export default function AttendanceScanPage() {
  const { request } = useAttendanceApi();

  const [loaded, setLoaded] = useState(false);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [stats, setStats] = useState<{ present: number; totalMembers: number } | null>(null);
  const [result, setResult] = useState<CheckInResponse | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [manual, setManual] = useState("");
  const [busy, setBusy] = useState(false);
  const logId = useRef(0);

  const refreshMeeting = useCallback(async () => {
    const res = await request<{
      meeting: Meeting | null;
      stats: { present: number; totalMembers: number };
    }>("/api/attendance/dashboard");
    if (res.ok && res.data) {
      setMeeting(res.data.meeting);
      setStats(res.data.stats);
    }
    setLoaded(true);
  }, [request]);

  useEffect(() => {
    void refreshMeeting();
  }, [refreshMeeting]);

  const submit = useCallback(
    async (token: string) => {
      if (!token || busy) return;
      setBusy(true);
      const res = await request<CheckInResponse>("/api/checkin", { json: { token } });
      const payload: CheckInResponse =
        res.data ??
        ({ ok: false, status: "error", message: res.error ?? "تعذّر تسجيل الحضور" } as CheckInResponse);

      setResult(payload);
      logId.current += 1;
      setLog((prev) =>
        [
          {
            id: logId.current,
            at: new Date().toISOString(),
            status: payload.status,
            name: payload.member?.name,
            member_code: payload.member?.member_code,
          },
          ...prev,
        ].slice(0, 12)
      );

      setBusy(false);
      if (payload.status === "success") void refreshMeeting();
    },
    [busy, request, refreshMeeting]
  );

  // Clear the result card after a few seconds so it never blocks the camera view.
  useEffect(() => {
    if (!result) return;
    const timer = window.setTimeout(() => setResult(null), 4000);
    return () => window.clearTimeout(timer);
  }, [result]);

  const submitManual = useCallback(() => {
    const token = extractCheckinToken(manual);
    if (!token) {
      setResult({ ok: false, status: "invalid_token", message: "QR Code غير صالح" });
      return;
    }
    setManual("");
    void submit(token);
  }, [manual, submit]);

  return (
    <>
      {loaded && (
        <Card className="mb-4">
          {meeting ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-white">{meeting.title}</p>
                <p className="text-xs text-blue-light/60">{meeting.meeting_date}</p>
              </div>
              <div className="text-xs text-blue-light/60">
                🟢 الحضور مفتوح
                {stats ? ` · ${stats.present} / ${stats.totalMembers} حاضر` : ""}
              </div>
            </div>
          ) : (
            <EmptyState
              icon="⏰"
              title="لا يوجد اجتماع مفتوح"
              hint="افتح اجتماعًا أولًا حتى يُسجَّل الحضور عند المسح."
              action={
                <Link href="/admin/attendance/meetings" className={primaryBtn}>
                  📅 إدارة الاجتماعات
                </Link>
              }
            />
          )}
        </Card>
      )}

      <Card title="📷 مسح رمز QR" className="mb-4">
        <QrScanner onToken={(token) => void submit(token)} paused={busy || Boolean(result)} />

        <div className="mt-4 border-t border-blue-mid/25 pt-4">
          <p className="mb-2 text-xs text-blue-light/60">
            إدخال يدوي (إذا لم تعمل الكاميرا) — الصق الرابط أو الرمز:
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder="https://…/checkin/xxxx أو الرمز نفسه"
              className={inputClass}
              dir="ltr"
              onKeyDown={(e) => {
                if (e.key === "Enter") submitManual();
              }}
            />
            <button type="button" onClick={submitManual} className={primaryBtn}>
              تسجيل
            </button>
          </div>
        </div>
      </Card>

      {result && (
        <div className="mb-4">
          <Banner tone={TONES[result.status]}>
            <div className="flex items-start gap-2">
              <span className="text-lg">{ICONS[result.status]}</span>
              <div>
                <p className="font-semibold">{result.message}</p>
                {result.member && (
                  <p className="mt-1 text-xs">
                    {result.member.name} · {result.member.member_code}
                    {result.check_in_time ? ` · ${formatClockAr(result.check_in_time)}` : ""}
                  </p>
                )}
              </div>
            </div>
          </Banner>
        </div>
      )}

      <Card
        title="🧾 آخر عمليات المسح"
        actions={
          log.length > 0 ? (
            <button type="button" onClick={() => setLog([])} className={subtleBtn}>
              تفريغ السجل
            </button>
          ) : undefined
        }
      >
        {log.length === 0 ? (
          <p className="py-4 text-center text-sm text-blue-light/50">لم يتم مسح أي رمز بعد</p>
        ) : (
          <ul className="divide-y divide-blue-mid/20">
            {log.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span className="truncate text-white">
                  {ICONS[entry.status]}{" "}
                  {entry.name ?? (entry.status === "invalid_token" ? "رمز غير صالح" : "—")}
                  {entry.member_code && (
                    <span className="ms-2 text-xs text-blue-light/50">{entry.member_code}</span>
                  )}
                </span>
                <span className="text-xs text-blue-light/50">{formatClockAr(entry.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

