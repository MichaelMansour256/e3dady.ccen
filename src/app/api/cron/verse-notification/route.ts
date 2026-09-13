import { NextResponse } from "next/server";
import { sendNotification } from "@/lib/onesignal";
import { getVerseRef } from "@/lib/verse";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const ref = await getVerseRef();
    if (!ref) return NextResponse.json({ skipped: "No verse set" });

    const result = await sendNotification({
      headingAr: "✨ آية الأسبوع",
      headingEn: "✨ Verse of the Week",
      messageAr: `${ref.bookName} ${ref.chapter}:${ref.verse}`,
      messageEn: `${ref.bookName} ${ref.chapter}:${ref.verse}`,
      url: "/ar/bible/verse",
    });
    return NextResponse.json({ success: true, result });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
