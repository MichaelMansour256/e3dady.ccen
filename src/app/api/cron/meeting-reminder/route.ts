import { NextResponse } from "next/server";
import { sendNotification } from "@/lib/onesignal";
import {
  getInvitations,
  nextFridayCairoISO,
} from "@/lib/invitations";

export async function GET(req: Request) {
  // Verify this is called by Vercel Cron
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // (2) Smart Thursday reminder: look up the actual invitation image
    // uploaded for next Friday (Cairo). Falls back to generic text when
    // nothing was uploaded that week — never skips silently.
    const nextFriday = nextFridayCairoISO();
    const invitations = await getInvitations();
    const match = invitations.find((i) => i.date === nextFriday);

    const result = await sendNotification({
      headingAr: "دعوة اجتماع الجمعة ✝️",
      headingEn: "Friday Meeting Invitation ✝️",
      messageAr: match
        ? `دعوة اجتماع الجمعة ${match.date} — الساعة ١٢:٣٠ — كنيسة المسيح عزبة النخل 🙏`
        : "اجتماع الجمعة غداً — الساعة ١٢:٣٠ — كنيسة المسيح عزبة النخل 🙏",
      messageEn: match
        ? `Friday meeting invitation ${match.date} — 12:30 PM — Christ Church Ezbet El Nakhl 🙏`
        : "Friday meeting is tomorrow at 12:30 PM — Christ Church Ezbet El Nakhl 🙏",
      url: "/ar/events",
      image: match?.url,
    });
    return NextResponse.json({
      success: true,
      nextFriday,
      usedImage: Boolean(match),
      result,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
