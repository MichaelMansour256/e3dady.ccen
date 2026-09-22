import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client.
 *
 * Prefers SUPABASE_SERVICE_ROLE_KEY (a server-only secret) so attendance
 * writes and reads can never be performed with the publishable key — this is
 * what makes supabase-attendance-lockdown.sql possible: once that migration
 * revokes the public check-in RPC from anon/authenticated, the ONLY way to
 * record attendance is through this server (POST /api/attendance/checkin,
 * which requires the admin/servant password).
 *
 * Falls back to the publishable key when the secret is not configured yet
 * (legacy deployments keep working), logging a warning once per process.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (typeof window === "undefined" && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "[supabase] SUPABASE_SERVICE_ROLE_KEY is not set — server routes fall back to the " +
      "publishable key. Set it (Supabase dashboard → Project Settings → API) and apply " +
      "supabase-attendance-lockdown.sql to lock attendance down to staff-only."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
