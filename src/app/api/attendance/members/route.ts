/**
 * /api/attendance/members — admin CRUD for members.
 *
 *   GET     list all members (optional ?search=), or ?nextCode=1 for the next
 *           suggested member code
 *   POST    create a member — the QR token is generated on the server
 *   PATCH   update name/code, activate/deactivate, or regenerate the QR token
 *   DELETE  remove a member (refused when attendance history exists)
 *
 * Auth: x-admin-password (src/lib/auth.ts → requireAdmin).
 */
import { NextResponse } from "next/server";
import {
  createMember,
  deleteMember,
  listMembers,
  nextMemberCode,
  regenerateMemberToken,
  toPublicMember,
  updateMember,
} from "@/lib/attendance";
import { badRequest, databaseError, readJson, requireAdmin } from "@/lib/attendance-api";
import { sanitizeDateOfBirth, sanitizeGrade, sanitizePhone } from "@/lib/member-fields";

export async function GET(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const { searchParams } = new URL(req.url);

  try {
    if (searchParams.get("nextCode")) {
      return NextResponse.json({ nextCode: await nextMemberCode() });
    }

    let members = await listMembers();

    const search = (searchParams.get("search") ?? "").toLowerCase().trim();
    if (search) {
      members = members.filter(
        (m) =>
          m.name.toLowerCase().includes(search) ||
          m.member_code.toLowerCase().includes(search) ||
          (m.phone ?? "").includes(search)
      );
    }

    // QR tokens never leave the server: the UI addresses codes by member id.
    return NextResponse.json(members.map(toPublicMember));
  } catch (err) {
    return databaseError("members.GET", err);
  }
}

export async function POST(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const body = await readJson<{
    name?: unknown;
    member_code?: unknown;
    phone?: unknown;
    date_of_birth?: unknown;
    grade?: unknown;
  }>(req);
  const name = typeof body.name === "string" ? body.name.trim() : "";
  let code = typeof body.member_code === "string" ? body.member_code.trim() : "";

  if (!name) return badRequest("name is required");
  if (name.length > 120) return badRequest("name is too long");
  if (!code) code = await nextMemberCode();
  if (code.length > 32) return badRequest("member_code is too long");
  const phone = sanitizePhone(body.phone);
  if (!phone.ok) return badRequest(phone.error);
  const dateOfBirth = sanitizeDateOfBirth(body.date_of_birth);
  if (!dateOfBirth.ok) return badRequest(dateOfBirth.error);
  const grade = sanitizeGrade(body.grade);
  if (!grade.ok) return badRequest(grade.error);

  try {
    const member = await createMember({ member_code: code, name, phone: phone.value, date_of_birth: dateOfBirth.value, grade: grade.value as "prep_1" | "prep_2" | "prep_3" | null });
    return NextResponse.json(toPublicMember(member), { status: 201 });
  } catch (err) {
    return databaseError("members.POST", err);
  }
}

export async function PATCH(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const body = await readJson<{
    id?: unknown;
    action?: unknown;
    name?: unknown;
    member_code?: unknown;
    phone?: unknown;
    date_of_birth?: unknown;
    grade?: unknown;
    active?: unknown;
  }>(req);

  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return badRequest("id is required");

  try {
    if (body.action === "regenerate") {
      // Previous QR stops working immediately. The new token is not echoed back:
      // the UI re-reads the QR through /api/attendance/qr.
      return NextResponse.json(toPublicMember(await regenerateMemberToken(id)));
    }

    if (body.action === "setActive") {
      if (typeof body.active !== "boolean") return badRequest("active must be a boolean");
      return NextResponse.json(toPublicMember(await updateMember(id, { active: body.active })));
    }

    const patch: { name?: string; member_code?: string; active?: boolean; phone?: string | null; date_of_birth?: string | null; grade?: "prep_1" | "prep_2" | "prep_3" | null } = {};
    if (typeof body.name === "string" && body.name.trim()) patch.name = body.name;
    if (typeof body.member_code === "string" && body.member_code.trim()) {
      patch.member_code = body.member_code;
    }
    if (typeof body.active === "boolean") patch.active = body.active;
    if ("phone" in body) {
      const phone = sanitizePhone(body.phone);
      if (!phone.ok) return badRequest(phone.error);
      patch.phone = phone.value;
    }
    if ("date_of_birth" in body) {
      const dateOfBirth = sanitizeDateOfBirth(body.date_of_birth);
      if (!dateOfBirth.ok) return badRequest(dateOfBirth.error);
      patch.date_of_birth = dateOfBirth.value;
    }
    if ("grade" in body) {
      const grade = sanitizeGrade(body.grade);
      if (!grade.ok) return badRequest(grade.error);
      patch.grade = grade.value as "prep_1" | "prep_2" | "prep_3" | null;
    }
    if (Object.keys(patch).length === 0) return badRequest("nothing to update");

    return NextResponse.json(toPublicMember(await updateMember(id, patch)));
  } catch (err) {
    return databaseError("members.PATCH", err);
  }
}

export async function DELETE(req: Request) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const body = await readJson<{ id?: unknown }>(req);
  const url = new URL(req.url);
  const id = typeof body.id === "string" ? body.id : (url.searchParams.get("id") ?? "");
  if (!id) return badRequest("id is required");

  try {
    await deleteMember(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    // 23503 → has attendance history → databaseError() returns a 409 with a
    // clear "deactivate instead" message.
    return databaseError("members.DELETE", err);
  }
}
