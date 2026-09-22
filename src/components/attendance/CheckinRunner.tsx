/**
 * Public check-in runner.
 *
 * Rendered by /checkin/[token]. The page itself is a server component that only
 * *reads* the URL — recording the attendance happens here, once, through
 * POST /api/checkin. That keeps GET safe: link prefetchers, WhatsApp/Telegram
 * previews and browser back-buttons can never create an attendance row.
 *
 * Mobile first: one request, big text, no interaction required, and a clear
 * success / duplicate / error state.
 */
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatDateAr, formatTimeAr } from "./ui";

interface CheckInResponse {
  ok: boolean;
  status:
    | "success"
    | "already_recorded"
    | "invalid_token"
    | "inactive_member"
    | "no_active_meeting"
    | "error";
  message?: string;
  member?: { name: string; member_code: string };
  meeting?: { id?: string; title: string; meeting_date: string };
  check_in_time?: string | null;
}

type State =
  | { kind: "loading" }
  | { kind: "result"; data: CheckInResponse }
  | { kind: "network" };

/** Header line (emoji + title) for each outcome. */
const HEADLINES: Record<CheckInResponse["status"], string> = {
  success: "✅ تم تسجيل الحضور",
  already_recorded: "ℹ️ الحضور مسجل بالفعل",
  invalid_token: "❌ QR Code غير صالح",
  inactive_member: "⚠️ هذا العضو غير نشط",
  no_active_meeting: "ℹ️ لا يوجد اجتماع مفتوح حاليًا",
  error: "❌ تعذّر تسجيل الحضور",
};

const SUBTITLES: Partial<Record<CheckInResponse["status"], string>> = {
  invalid_token: "الرمز المستخدم غير صالح أو غير مسجل. من فضلك تواصل مع الخادم.",
  inactive_member: "تواصل مع الإدارة إذا كنت تعتقد أن هذه رسالة بالخطأ.",
  no_active_meeting: "لا يوجد اجتماع جارٍ الآن. جرّب مرة أخرى أثناء الاجتماع.",
  error: "تحقّق من اتصالك بالإنترنت وحاول مرة أخرى.",
};

export default function CheckinRunner({ token }: { token: string }) {
  const [state, setState] = useState<State>({ kind: "loading" });
  const submitted = useRef(false);

  const submit = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
        cache: "no-store",
      });
      const data = (await res.json()) as CheckInResponse;

      // A failed request with no structured body (e.g. 503 without JSON) is
      // treated as a connection problem, never as a raw error dump.
      if (!data || typeof data.status !== "string") {
        setState({ kind: "network" });
        return;
      }
      setState({ kind: "result", data });
    } catch {
      setState({ kind: "network" });
    }
  }, [token]);

  // Fire exactly once per mount (StrictMode remounts in dev are harmless: the
  // database's UNIQUE(meeting_id, member_id) makes a second call a no-op).
  useEffect(() => {
    if (submitted.current) return;
    submitted.current = true;
    void submit();
  }, [submit]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-5 py-8">
      <div className="w-full max-w-sm rounded-3xl border border-blue-mid/40 bg-blue-primary/30 p-7 text-center shadow-xl backdrop-blur-sm">
        {state.kind === "loading" && (
          <>
            <div className="mb-4 text-5xl" aria-hidden>
              ⏳
            </div>
            <h1 className="text-xl font-bold text-white">جارٍ تسجيل الحضور…</h1>
            <p className="mt-2 text-sm text-blue-light/60">لا تغلق الصفحة</p>
          </>
        )}

        {state.kind === "network" && (
          <>
            <div className="mb-4 text-5xl" aria-hidden>
              📶
            </div>
            <h1 className="text-xl font-bold text-white">❌ تعذّر الاتصال</h1>
            <p className="mt-2 text-sm text-blue-light/60">
              تحقّق من اتصالك بالإنترنت وحاول مرة أخرى.
            </p>
            <button
              type="button"
              onClick={() => void submit()}
              className="mt-6 w-full rounded-2xl bg-blue-accent px-4 py-3 font-semibold text-white transition hover:bg-blue-mid"
            >
              إعادة المحاولة
            </button>
          </>
        )}

        {state.kind === "result" && (
          <>
            <h1 className="text-xl font-bold leading-relaxed text-white">
              {HEADLINES[state.data.status] ?? "ℹ️" }
            </h1>

            {state.data.member && (
              <p className="mt-5 text-2xl font-bold text-white">{state.data.member.name}</p>
            )}
            {state.data.member && (
              <p className="mt-1 text-xs tracking-widest text-blue-light/50">
                {state.data.member.member_code}
              </p>
            )}

            {state.data.meeting && (state.data.status === "success" || state.data.status === "already_recorded") && (
              <div className="mt-5 border-t border-blue-mid/25 pt-4">
                <p className="text-lg font-semibold text-white">{state.data.meeting.title}</p>
                <p className="mt-1 text-sm text-blue-light/70">
                  {formatDateAr(state.data.meeting.meeting_date)}
                </p>
                <p className="mt-2 text-sm text-blue-light/60">
                  وقت التسجيل:{" "}
                  <span className="font-semibold text-blue-light">
                    {formatTimeAr(state.data.check_in_time)}
                  </span>
                </p>
              </div>
            )}

            {SUBTITLES[state.data.status] && (
              <p className="mt-4 text-sm text-blue-light/60">{SUBTITLES[state.data.status]}</p>
            )}

            {(state.data.status === "success" || state.data.status === "already_recorded") && (
              <p className="mt-5 text-xs text-blue-light/40">يمكنك إغلاق هذه الصفحة</p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
