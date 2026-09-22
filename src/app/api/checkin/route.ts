/**
 * POST /api/checkin — public QR check-in endpoint.
 *
 * Called automatically by /checkin/[token] (and by the admin scanner page).
 * No admin password: this is the one operation an unauthenticated visitor may
 * perform, and it can only ever do exactly this:
 *
 *   token → identify member → validate → find open meeting → insert once
 *
 * It never returns raw database errors, never exposes member lists, and cannot
 * read or change anything else. Duplicate scans are a normal answer
 * ("already_recorded"), not an error — see the UNIQUE(meeting_id, member_id)
 * constraint in supabase-attendance-migration.sql.
 *
 * Responses (always HTTP 200 for business outcomes):
 *   { ok: true,  status: "success" | "already_recorded", member, meeting,
 *     check_in_time, message }
 *   { ok: false, status: "invalid_token" | "inactive_member" |
 *                        "no_active_meeting", message }
 *   HTTP 400 malformed request • HTTP 503 database unavailable (no detail)
 */
import { NextResponse } from "next/server";
import { checkIn, isPlausibleQrToken, type CheckInStatus } from "@/lib/attendance";
import { readJson } from "@/lib/attendance-api";

const MESSAGES: Record<CheckInStatus, string> = {
  success: "تم تسجيل الحضور",
  already_recorded: "الحضور مسجل بالفعل",
  invalid_token: "QR Code غير صالح",
  inactive_member: "هذا العضو غير نشط",
  no_active_meeting: "لا يوجد اجتماع مفتوح حاليًا",
};

export async function POST(req: Request) {
  const body = await readJson<{ token?: unknown }>(req);
  const fromQuery = new URL(req.url).searchParams.get("token");
  const token =
    typeof body.token === "string" ? body.token : typeof fromQuery === "string" ? fromQuery : "";

  if (!isPlausibleQrToken(token)) {
    return NextResponse.json(
      { ok: false, status: "invalid_token", message: MESSAGES.invalid_token },
      { status: 400 }
    );
  }

  const result = await checkIn(token);

  if (result.infrastructureError) {
    // Technical cause is logged in src/lib/attendance.ts — never sent here.
    return NextResponse.json(
      {
        ok: false,
        status: "error",
        message: "تعذّر الاتصال بنظام الحضور. حاول مرة أخرى بعد قليل.",
      },
      { status: 503 }
    );
  }

  const ok = result.status === "success" || result.status === "already_recorded";

  return NextResponse.json(
    {
      ok,
      status: result.status,
      message: MESSAGES[result.status],
      member: result.member,
      meeting: result.meeting,
      check_in_time: result.check_in_time ?? null,
    },
    { status: 200 }
  );
}
