import { NextResponse } from "next/server";
import { isAuthorized } from "@/lib/auth";
import { sendNotification } from "@/lib/onesignal";
import { putNotificationRecord } from "@/lib/notifications-history";

/**
 * Immediate admin push — same sender the crons use.
 * Auth: x-admin-password header (same as all other /api/admin/* routes).
 * Body: { headingAr, headingEn, messageAr, messageEn, url?, image? }
 *
 * Response on success:
 *   { success: true, message: "Notification sent successfully", notificationId: string }
 * Response when no subscribers:
 *   { success: false, message: "No subscribed devices are currently available." }
 * Response on other errors:
 *   { success: false, error: "...", details?: "..." }
 */
export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let parsedBody: {
    headingAr?: string;
    headingEn?: string;
    messageAr?: string;
    messageEn?: string;
    url?: string;
    image?: string;
  } = {};

  try {
    parsedBody = await req.json();
    const { headingAr, headingEn, messageAr, messageEn, url, image } = parsedBody;

    if (!headingAr || !headingEn || !messageAr || !messageEn) {
      return NextResponse.json(
        {
          error:
            "Missing required fields. Need: headingAr, headingEn, messageAr, messageEn (optional: url, image)",
        },
        { status: 400 }
      );
    }

    const sentAt = new Date().toISOString();
    const notifyId = crypto.randomUUID();
    const urlValue = url || "/ar";
    const imageValue = image || null;

    const result = await sendNotification({
      headingAr,
      headingEn,
      messageAr,
      messageEn,
      ...(url ? { url } : {}),
      ...(image ? { image } : {}),
    });

    // Save to notification history
    await putNotificationRecord({
      id: notifyId,
      sentAt,
      headingAr,
      headingEn,
      messageAr,
      messageEn,
      url: urlValue,
      image: imageValue,
      onesignalId: result.id || null,
      status: "sent",
      recipients: null, // OneSignal create response doesn't include count
    });

    return NextResponse.json({
      success: true,
      message: "Notification sent successfully",
      notificationId: notifyId,
    });
  } catch (error) {
    const msg = String(error);

    if (msg.includes("No subscribed devices are currently available")) {
      // Still save a record of the failed attempt
      const sentAt = new Date().toISOString();
      const notifyId = crypto.randomUUID();
      const savePromise = putNotificationRecord({
        id: notifyId,
        sentAt,
        headingAr: parsedBody.headingAr ?? "",
        headingEn: parsedBody.headingEn ?? "",
        messageAr: parsedBody.messageAr ?? "",
        messageEn: parsedBody.messageEn ?? "",
        url: parsedBody.url ?? "/ar",
        image: parsedBody.image ?? null,
        onesignalId: null,
        status: "failed_no_subscribers",
        recipients: null,
      });
      savePromise.catch(() => {
        /* Don't let history save failure mask the real error */
      });
      await savePromise;

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
