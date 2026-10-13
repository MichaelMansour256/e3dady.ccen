import { supabase } from "@/lib/supabase";

export type TestamentFilter = "OT" | "NT" | "ALL";

export type BibleSource = {
  id: string;
  book: string;
  book_en?: string | null;
  chapter: number;
  verse: string;
  testament: TestamentFilter;
  text_ar: string;
  score: number;
};

async function createEmbedding(query: string): Promise<number[] | null> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;
  const response = await fetch(`${process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1"}/embeddings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "",
      "X-Title": "E3dady Bible RAG",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_EMBEDDING_MODEL ?? "openai/text-embedding-3-small",
      input: query,
    }),
  });
  if (!response.ok) throw new Error(`Embedding request failed (${response.status})`);
  const data = (await response.json()) as { data?: Array<{ embedding: number[] }> };
  return data.data?.[0]?.embedding ?? null;
}

export async function retrieveBibleSources(
  query: string,
  testamentFilter: TestamentFilter,
): Promise<BibleSource[]> {
  const embedding = await createEmbedding(query);
  const { data, error } = await supabase.rpc("search_bible_verses", {
    query_embedding: embedding,
    query_text: query,
    testament_filter: testamentFilter,
    match_count: 5,
    min_score: Number(process.env.BIBLE_RAG_MIN_SCORE ?? "0.22"),
  });
  if (error) throw new Error(`Bible retrieval failed: ${error.message}`);
  return (data ?? []) as BibleSource[];
}

export async function generateGroundedAnswer(
  query: string,
  sources: BibleSource[],
): Promise<string> {
  const fallback = sources.length
    ? `إليك آيات مرتبطة بسؤالك «${query}». تأمل النصوص التالية وسياقها:`
    : "لم أعثر على آيات مطابقة بدرجة كافية. جرّب صياغة أخرى مثل «آيات عن المحبة».";
  const key = process.env.OPENROUTER_API_KEY;
  if (!key || !sources.length) return fallback;

  const context = sources
    .map((source) => `[${source.book} ${source.chapter}:${source.verse}] ${source.text_ar}`)
    .join("\n");
  const response = await fetch(`${process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1"}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "",
      "X-Title": "E3dady Bible RAG",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_CHAT_MODEL ?? "openai/gpt-4o-mini",
      temperature: 0.1,
      messages: [
        { role: "system", content: "أجب بالعربية وباختصار. استخدم النصوص المقدمة فقط، ولا تخترع آيات أو مراجع. اشرح الصلة بجملة واحدة، واترك الاقتباس الحرفي لبطاقات المصادر." },
        { role: "user", content: `السؤال: ${query}\nالنصوص المسموح بها:\n${context}` },
      ],
    }),
  });
  if (!response.ok) throw new Error(`Answer generation failed (${response.status})`);
  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content?.trim() || fallback;
}
