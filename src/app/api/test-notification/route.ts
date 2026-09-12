import { NextResponse } from "next/server";
import { sendNotification } from "@/lib/onesignal";

export async function POST(req: Request) {
  // Authenticate the request - you can remove this for simple testing
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { headingAr, headingEn, messageAr, messageEn, url = "/" } = body;

    if (!headingAr || !headingEn || !messageAr || !messageEn) {
      return NextResponse.json(
        {
          error: "Missing required fields. Need: headingAr, headingEn, messageAr, messageEn, and optional url",
          example: {
            headingAr: "اختبار إشعار",
            headingEn: "Test Notification",
            messageAr: "هذه رسالة اختبار",
            messageEn: "This is a test message",
            url: "/events",
          },
        },
        { status: 400 }
      );
    }

    const result = await sendNotification({
      headingAr,
      headingEn,
      messageAr,
      messageEn,
      url,
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to send notification", details: String(error) },
      { status: 500 }
    );
  }
}