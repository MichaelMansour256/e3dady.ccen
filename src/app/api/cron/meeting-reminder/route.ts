import { NextResponse } from "next/server";
import { sendNotification } from "@/lib/onesignal";

export async function GET(req: Request) {
  // Verify this is called by Vercel Cron
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await sendNotification({
      headingAr: "تذكير باجتماع الغد ✝️",
      headingEn: "Meeting Tomorrow ✝️",
      messageAr: "اجتماع الجمعة غداً — الساعة ١٢:٣٠ — كنيسة المسيح عزبة النخل 🙏",
      messageEn: "Friday meeting is tomorrow at 12:30 PM — Christ Church Ezbet El Nakhl 🙏",
      url: "/ar/events",
    });
    return NextResponse.json({ success: true, result });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
