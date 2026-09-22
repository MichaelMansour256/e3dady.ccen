/**
 * Shared helpers for the attendance API routes.
 *
 * Every admin route starts with `requireAdmin(req)` and every write ends in the
 * same error mapping, so no route can accidentally leak a raw Postgres message
 * to the browser. Auth is the project's existing mechanism: the
 * `x-admin-password` header checked against ADMIN_PASSWORD (src/lib/auth.ts).
 */
import { NextResponse } from "next/server";
import { isAuthorized } from "./auth";
import { isMissingSchemaError } from "./attendance";

/** Returns a 401 response when the caller is not an authenticated admin. */
export function requireAdmin(req: Request): NextResponse | null {
  if (isAuthorized(req)) return null;
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/**
 * Staff check for operations that MODIFY data (attendance recording).
 *
 * Distinguishes the two failure modes required by the security model:
 *   • no `x-admin-password` header at all → 401 (unauthenticated visitor)
 *   • a header that does not match ADMIN_PASSWORD → 403 (not staff)
 *
 * The check runs on the server before any Supabase write; frontend state,
 * query parameters and QR contents are never trusted.
 */
export function requireStaff(req: Request): NextResponse | null {
  if (!req.headers.get("x-admin-password")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { error: "Forbidden — attendance can only be recorded by authorized staff" },
      { status: 403 }
    );
  }
  return null;
}

export const MISSING_SCHEMA_CODE = "missing_schema";
export const MISSING_SCHEMA_MESSAGE =
  "Attendance tables are missing. Run supabase-attendance-migration.sql in the Supabase SQL editor, then retry.";

export function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound(message = "Not found"): NextResponse {
  return NextResponse.json({ error: message }, { status: 404 });
}

/**
 * Map a thrown Supabase/Postgres error onto a safe HTTP response.
 * The technical detail is logged server-side only.
 */
export function databaseError(scope: string, error: unknown): NextResponse {
  const err = error as { code?: string; message?: string } | null;

  if (isMissingSchemaError(err)) {
    console.error(`[attendance:${scope}] schema missing:`, err?.message);
    return NextResponse.json(
      { error: MISSING_SCHEMA_MESSAGE, code: MISSING_SCHEMA_CODE },
      { status: 503 }
    );
  }

  if (err?.code === "23505") {
    // Unique violation: member_code already used, or a duplicate attendance row.
    console.error(`[attendance:${scope}] unique violation:`, err.message);
    return NextResponse.json(
      { error: "A record with the same unique value already exists", code: "conflict" },
      { status: 409 }
    );
  }

  if (err?.code === "23503") {
    console.error(`[attendance:${scope}] foreign key violation:`, err.message);
    return NextResponse.json(
      {
        error:
          "Cannot delete: attendance history references this record. Deactivate it instead.",
        code: "in_use",
      },
      { status: 409 }
    );
  }

  console.error(`[attendance:${scope}] database error:`, err);
  return NextResponse.json({ error: "Database error" }, { status: 500 });
}

/** Read a JSON body without throwing on malformed input. */
export async function readJson<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    return {} as T;
  }
}
