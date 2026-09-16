import { NextResponse } from "next/server";
import { sendNotification } from "@/lib/onesignal";
import {
  getInvitations,
  nextFridayCairoISO,
} from "@/lib/invitations";
import { meetingConfig, siteConfig } from "@/config";
import { routing } from "@/i18n/routing";

export async function GET(req: Request) {
  // Verify this is called by Vercel Cron
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Smart meeting-eve reminder: look up the actual invitation image
    // uploaded for the next meeting day (Cairo). Falls back to generic text
    // when nothing was uploaded that week — never skips silently.
    const nextFriday = nextFridayCairoISO();
    const invitations = await getInvitations();
    const match = invitations.find((i) => i.date === nextFriday);

    const { schedule } = meetingConfig;
    const result = await sendNotification({
      headingAr: `دعوة اجتماع ${schedule.dayNameAr} ✝️`,
      headingEn: `${schedule.dayNameEn} Meeting Invitation ✝️`,
      messageAr: match
        ? `دعوة اجتماع ${schedule.dayNameAr} ${match.date} — الساعة ${schedule.timeLabelAr} — ${siteConfig.church.nameAr} 🙏`
        : `اجتماع ${schedule.dayNameAr} غداً — الساعة ${schedule.timeLabelAr} — ${siteConfig.church.nameAr} 🙏`,
      messageEn: match
        ? `${schedule.dayNameEn} meeting invitation ${match.date} — ${schedule.timeLabelEn} — ${siteConfig.church.name} 🙏`
        : `${schedule.dayNameEn} meeting is tomorrow at ${schedule.timeLabelEn} — ${siteConfig.church.name} 🙏`,
      url: `/${routing.defaultLocale}/events`,
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
