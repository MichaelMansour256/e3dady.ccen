import { NextResponse } from "next/server";
import { generateGroundedAnswer, retrieveBibleSources, type TestamentFilter } from "@/lib/bible-rag";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { query?: unknown; testamentFilter?: unknown };
    const query = typeof body.query === "string" ? body.query.trim() : "";
    const testamentFilter = body.testamentFilter === "OT" || body.testamentFilter === "NT"
      ? body.testamentFilter
      : "ALL";
    if (!query || query.length > 500) {
      return NextResponse.json({ error: "يرجى إدخال سؤال من 1 إلى 500 حرفًا." }, { status: 400 });
    }
    const sources = await retrieveBibleSources(query, testamentFilter as TestamentFilter);
    const answer = await generateGroundedAnswer(query, sources);
    return NextResponse.json({
      answer,
      sources: sources.map(({ text_ar, ...source }) => ({ ...source, text: text_ar })),
    });
  } catch (error) {
    console.error("[bible/rag]", error);
    return NextResponse.json({ error: "تعذر البحث الآن. تأكد من إعداد فهرس الكتاب المقدس ثم حاول مرة أخرى." }, { status: 500 });
  }
}
