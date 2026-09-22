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
