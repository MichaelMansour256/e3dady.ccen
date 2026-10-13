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

export class BibleRagError extends Error {
  constructor(
    message: string,
    public readonly status: 500 | 502 | 503 = 500,
  ) {
    super(message);
    this.name = "BibleRagError";
  }
}

const embeddingModel = process.env.OPENROUTER_EMBEDDING_MODEL ?? "openai/text-embedding-3-small";

export function normalizeArabic(value: string): string {
  return value
    .replace(/[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
}

const searchStopWords = new Set(["ايات", "آيات", "عن", "في", "من", "الى", "إلى", "ما", "هو", "هي"]);
const searchExpansions: Record<string, string[]> = {
  المحبه: ["محبه", "حب", "احب", "يحب", "المحبة"],
  التسامح: ["تسامح", "سامح", "يسامح", "اغفر", "غفران"],
  غفران: ["غفران", "اغفر", "سامح", "يسامح"],
  الاساءه: ["اساءه", "إساءة", "اغفر", "سامح"],
  الرجاء: ["رجاء", "يرجو", "رجاءنا", "اتكل"],
  السلام: ["سلام", "سالم", "اطمئن", "طمأنينة"],
  الاطمئنان: ["اطمئن", "طمأنينة", "سلام", "اتكل"],
  الضيقات: ["ضيق", "ضيقة", "خوف", "تعزية", "اتكل"],
  الايمان: ["ايمان", "إيمان", "آمن", "يؤمن", "ثقة"],
};

function lexicalQuery(value: string): string {
  const terms = normalizeArabic(value)
    .split(/\s+/)
    .filter((term) => term && !searchStopWords.has(term));
  const expanded = new Set<string>();
  for (const term of terms) {
    expanded.add(term);
    for (const synonym of searchExpansions[term] ?? []) expanded.add(normalizeArabic(synonym));
  }
  return [...expanded].join(" OR ");
}

function referenceQuery(value: string): { book: string; chapter: number; verse?: string } | null {
  const normalized = normalizeArabic(value);
  const match = normalized.match(/^(.*?)\s+(\d+)(?::(\d+))?$/);
  if (!match) return null;
  const aliases: Record<string, string> = {
    "كورنثوس الاولي": "1 كورنثوس",
    "كورنثوس الثانيه": "2 كورنثوس",
    "صموئيل الاول": "1 صموئيل",
    "صموئيل الثاني": "2 صموئيل",
    "الملوك الاول": "1 الملوك",
    "الملوك الثاني": "2 الملوك",
  };
  return {
    book: aliases[match[1]] ?? match[1],
    chapter: Number(match[2]),
    verse: match[3],
  };
}

async function retrieveLexicalSources(
  query: string,
  testamentFilter: TestamentFilter,
): Promise<BibleSource[]> {
  const reference = referenceQuery(query);
  if (reference) {
    let request = supabase
      .from("bible_verses")
      .select("id,book,book_en,chapter,verse,testament,text_ar")
      .ilike("book", `%${reference.book}%`)
      .eq("chapter", reference.chapter)
      .limit(10);
    if (reference.verse) request = request.eq("verse", reference.verse);
    if (testamentFilter !== "ALL") request = request.eq("testament", testamentFilter);
    const result = await request;
    if (result.error) throw new BibleRagError("تعذر تنفيذ البحث المرجعي في فهرس الكتاب المقدس.", 503);
    return (result.data ?? []).map((row) => ({ ...row, score: 1 })) as BibleSource[];
  }
  const terms = lexicalQuery(query)
    .split(" OR ")
    .filter((term, index, all) => term && all.indexOf(term) === index);
  const rows = new Map<string, BibleSource>();
  for (const term of terms) {
    let request = supabase
      .from("bible_verses")
      .select("id,book,book_en,chapter,verse,testament,text_ar,text_ar_plain")
      .ilike("text_ar_plain", `%${term}%`)
      .limit(10);
    if (testamentFilter !== "ALL") request = request.eq("testament", testamentFilter);
    const result = await request;
    if (result.error) throw new BibleRagError("تعذر تنفيذ البحث النصي في فهرس الكتاب المقدس.", 503);
    console.info("[bible/rag] lexical term lookup", {
      termFingerprint: queryFingerprint(term),
      resultCount: result.data?.length ?? 0,
      testamentFilter,
    });
    for (const row of result.data ?? []) {
      const existing = rows.get(row.id);
      rows.set(row.id, {
        id: row.id,
        book: row.book,
        book_en: row.book_en,
        chapter: row.chapter,
        verse: row.verse,
        testament: row.testament,
        text_ar: row.text_ar,
        score: (existing?.score ?? 0) + 1,
      });
    }
  }
  return [...rows.values()]
    .sort((left, right) => right.score - left.score)
    .slice(0, 5);
}

function queryFingerprint(query: string): string {
  let hash = 2166136261;
  for (const character of query) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

async function createEmbedding(query: string): Promise<number[] | null> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    console.warn("[bible/rag] OPENROUTER_API_KEY is not configured; using lexical retrieval only");
    return null;
  }
  const response = await fetch(`${process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1"}/embeddings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "",
      "X-Title": "E3dady Bible RAG",
    },
    body: JSON.stringify({
      model: embeddingModel,
      input: query,
    }),
  });
  if (!response.ok) {
    console.error("[bible/rag] embedding provider failed", { status: response.status, model: embeddingModel });
    throw new BibleRagError("تعذر إنشاء تمثيل البحث من مزود الذكاء الاصطناعي.", 502);
  }
  const data = (await response.json()) as { data?: Array<{ embedding: number[] }> };
  const vector = data.data?.[0]?.embedding;
  if (!vector?.length) {
    console.error("[bible/rag] embedding provider returned no vector", { model: embeddingModel });
    throw new BibleRagError("أعاد مزود الذكاء الاصطناعي تمثيلًا فارغًا.", 502);
  }
  console.info("[bible/rag] embedding created", {
    queryFingerprint: queryFingerprint(query),
    model: embeddingModel,
    dimensions: vector.length,
  });
  return vector;
}

export async function retrieveBibleSources(
  query: string,
  testamentFilter: TestamentFilter,
): Promise<BibleSource[]> {
  const normalizedQuery = lexicalQuery(query);
  const { count, error: healthError } = await supabase
    .from("bible_verses")
    .select("id", { count: "exact", head: true });
  if (healthError) {
    console.error("[bible/rag] unable to inspect Bible index", { message: healthError.message });
    throw new BibleRagError("تعذر الاتصال بفهرس الكتاب المقدس.", 503        );
  }
  if (referenceQuery(query)) {
    const sources = await retrieveLexicalSources(query, testamentFilter);
    console.info("[bible/rag] reference retrieval completed", {
      queryFingerprint: queryFingerprint(query),
      candidateCount: sources.length,
    });
    return sources;
  }
  const { count: vectorCount } = await supabase
    .from("bible_verses")
    .select("id", { count: "exact", head: true })
    .not("embedding", "is", null);
  const embedding = vectorCount ? await createEmbedding(query) : null;
  if (!vectorCount) {
    console.warn("[bible/rag] Bible index has no stored vectors; using normalized lexical retrieval");
  }
  console.info("[bible/rag] index health", {
    queryFingerprint: queryFingerprint(query),
    verseCount: count ?? 0,
    vectorCount: vectorCount ?? 0,
    embeddingModel,
    queryDimensions: embedding?.length ?? null,
  });
  if (!count) {
    throw new BibleRagError(
      "فهرس الكتاب المقدس فارغ. شغّل scripts/ingest_bible.py ثم أعد المحاولة.",
      503,
    );
  }
  const rpcArgs = {
    query_embedding: embedding,
    query_text: normalizedQuery,
    testament_filter: testamentFilter,
    match_count: 5,
    min_score: Number(process.env.BIBLE_RAG_MIN_SCORE ?? "0.22"),
  };
  const rpcResult = await supabase.rpc("search_bible_verses", rpcArgs);
  let data = rpcResult.data;
  const error = rpcResult.error;
  if (error) {
    console.error("[bible/rag] retrieval failed", { message: error.message });
    throw new BibleRagError("تعذر تنفيذ البحث في فهرس الكتاب المقدس.", 503);
  }
  // Older deployed SQL functions may still reject rows without vectors.
  // Retry lexical-only retrieval so exact Arabic terms remain searchable while
  // the vector index is being populated or regenerated.
  if (!data?.length && embedding) {
    console.warn("[bible/rag] dense retrieval returned no candidates; retrying lexical retrieval");
    const lexicalResult = await supabase.rpc("search_bible_verses", {
      ...rpcArgs,
      query_embedding: null,
    });
    if (lexicalResult.error) {
      console.error("[bible/rag] lexical retry failed", { message: lexicalResult.error.message });
    } else {
      data = lexicalResult.data;
    }
  }
  let sources = (data ?? []) as BibleSource[];
  if (!sources.length) {
    console.warn("[bible/rag] RPC returned no candidates; using direct normalized text fallback");
    sources = await retrieveLexicalSources(query, testamentFilter);
  }
  console.info("[bible/rag] retrieval completed", {
    queryFingerprint: queryFingerprint(query),
    candidateCount: sources.length,
    topScores: sources.slice(0, 5).map((source) => source.score),
    threshold: Number(process.env.BIBLE_RAG_MIN_SCORE ?? "0.22"),
  });
  return sources;
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
  if (!response.ok) {
    console.error("[bible/rag] answer provider failed", { status: response.status });
    throw new BibleRagError("تعذر إنشاء الملخص الاختياري.", 502);
  }
  const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content?.trim() || fallback;
}
