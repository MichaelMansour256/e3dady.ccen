import { NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { sendNotification } from "@/lib/onesignal";

/**
 * Immediate admin push — same sender the crons use.
 * Auth: x-admin-password header (same as all other /api/admin/* routes).
 * Body: { headingAr, headingEn, messageAr, messageEn, url?, image? }
 *
 * Response on success:
 *   { success: true, message: "Notification sent successfully", recipients: number }
 * Response when no subscribers:
 *   { success: false, message: "No subscribed devices are currently available." }
 * Response on other errors:
 *   { success: false, error: "...", details?: "..." }
 */
export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { headingAr, headingEn, messageAr, messageEn, url, image } = body;

    if (!headingAr || !headingEn || !messageAr || !messageEn) {
      return NextResponse.json(
        {
          error:
            "Missing required fields. Need: headingAr, headingEn, messageAr, messageEn (optional: url, image)",
        },
        { status: 400 }
      );
    }

    const result = await sendNotification({
      headingAr,
      headingEn,
      messageAr,
      messageEn,
      ...(url ? { url } : {}),
      ...(image ? { image } : {}),
    });

    return NextResponse.json({
      success: true,
      message: "Notification sent successfully",
      // OneSignal create-notification response: { id, external_id?, ... }.
      // Recipient count is not included in the create response; we report
      // the notification id so the admin can look it up if needed.
      notificationId: result.id,
    });
  } catch (error) {
    const msg = String(error);

    // sendNotification throws "No subscribed devices are currently
    // available." when the filters resolve to 0 recipients.
    if (msg.includes("No subscribed devices are currently available")) {
      console.warn("OneSignal send: no subscribers:", msg);
      return NextResponse.json(
        {
          success: false,
          message:
            "No subscribed devices are currently available. " +
            "Users may have unsubscribed, blocked push, or not yet subscribed.",
        },
        { status: 200 }
      );
    }

    // Real OneSignal or network error — log full details, return safe message.
    console.error("OneSignal send failed:", msg);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to send notification",
        details: msg,
      },
      { status: 500 }
    );
  }
}
