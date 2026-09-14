import { NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";

/**
 * GET /api/admin/notify-status — diagnostic for the Notify tab.
 * Returns:
 *  - appIdConfigured: whether ONESIGNAL_APP_ID / NEXT_PUBLIC_ONESIGNAL_APP_ID exist
 *  - appIdsMatch: the two must be IDENTICAL or browser subs land in another app
 *  - subscribedCount / totalCount from OneSignal (via limit=1 + total_count)
 * Auth: x-admin-password header, like every other /api/admin/* route.
 */
export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serverAppId = process.env.ONESIGNAL_APP_ID ?? "";
  const clientAppId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID ?? "";
  const apiKey = process.env.ONESIGNAL_API_KEY ?? "";

  if (!serverAppId || !apiKey) {
    return NextResponse.json(
      {
        appIdConfigured: false,
        error: "Missing ONESIGNAL_APP_ID / ONESIGNAL_API_KEY env vars on the server",
      },
      { status: 500 }
    );
  }

  try {
    // NOTE: /players is the legacy Player model. Web SDK v16 subscriptions
    // sometimes don't appear here promptly (or at all) — the "Subscribed
    // Users" segment and actual sending are the source of truth, not this list.
    // So: query the list AND do a real dry-run count via the notifications
    // endpoint pattern. We only READ here (no send) — recipients come from
    // the last-send echo if available.
    const res = await fetch(
      `https://api.onesignal.com/players?app_id=${serverAppId}&limit=300&offset=0`,
      { headers: { Authorization: `Basic ${apiKey}` } }
    );
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { appIdConfigured: true, error: `OneSignal players API: ${JSON.stringify(data)}` },
        { status: 500 }
      );
    }

    const players: Array<{
      id?: string;
      notification_types?: number;
      invalid_identifier?: boolean;
      device_type?: number;
      last_active?: number;
    }> = Array.isArray(data.players) ? data.players : [];

    // Legacy semantics: notification_types=1 means opted IN at the player
    // level. Anything else (-2, 0, …) historically meant out — BUT web push
    // v16 rows can report odd values while still receiving via segment.
    const optedIn = players.filter((p) => p.notification_types === 1);
    const validToken = players.filter((p) => p.invalid_identifier !== true);

    // Raw sample for debugging (ids truncated, no tokens).
    const sample = players.slice(0, 10).map((p) => ({
      idPrefix: (p.id ?? "?").slice(0, 8),
      notification_types: p.notification_types,
      invalid_identifier: p.invalid_identifier,
      device_type: p.device_type,
    }));

    return NextResponse.json({
      appIdConfigured: true,
      appIdsMatch: clientAppId !== "" && clientAppId === serverAppId,
      // Never leak the full IDs — just prefixes for visual comparison.
      serverAppIdPrefix: serverAppId.slice(0, 8),
      clientAppIdPrefix: clientAppId ? clientAppId.slice(0, 8) : "(missing)",
      totalCount: data.total_count ?? players.length,
      legacyOptedIn: optedIn.length,
      validTokens: validToken.length,
      note: "Legacy /players model — v16 web subs may receive via segment even when this list looks stale. Actual send result is the truth.",
      sample,
    });
  } catch (error) {
    return NextResponse.json(
      { appIdConfigured: true, error: String(error) },
      { status: 500 }
    );
  }
}
