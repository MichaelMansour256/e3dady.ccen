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
    // Fetch up to 300 players so the counts are real, not a 1-row sample.
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
      notification_types?: number;
      device_type?: number;
      last_active?: number;
    }> = Array.isArray(data.players) ? data.players : [];
    const subscribedCount = players.filter(
      (p) => p.notification_types === 1
    ).length;

    return NextResponse.json({
      appIdConfigured: true,
      appIdsMatch: clientAppId !== "" && clientAppId === serverAppId,
      // Never leak the full IDs — just prefixes for visual comparison.
      serverAppIdPrefix: serverAppId.slice(0, 8),
      clientAppIdPrefix: clientAppId ? clientAppId.slice(0, 8) : "(missing)",
      totalCount: data.total_count ?? players.length,
      subscribed: subscribedCount,
      unsubscribed: players.length - subscribedCount,
    });
  } catch (error) {
    return NextResponse.json(
      { appIdConfigured: true, error: String(error) },
      { status: 500 }
    );
  }
}
