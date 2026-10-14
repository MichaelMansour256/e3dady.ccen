"use client";

import { FormEvent, useState } from "react";

type Source = { book: string; chapter: number; verse: string; text: string; score: number };
const examples = ["آيات عن المحبة", "التسامح وغفران الإساءة", "السلام والاطمئنان في الضيقات"];

function toEasternArabicNumerals(value: string | number): string {
  return String(value).replace(/\d/g, (digit) => "٠١٢٣٤٥٦٧٨٩"[Number(digit)]);
}

export default function BibleRagSearch() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"ALL" | "OT" | "NT">("ALL");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function search(event: FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setError(""); setAnswer(""); setSources([]);
    try {
      const response = await fetch("/api/bible/rag", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, testamentFilter: filter }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "تعذر البحث");
      setAnswer(data.answer); setSources(data.sources ?? []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر البحث الآن");
    } finally { setLoading(false); }
  }

  async function copy(source: Source) {
    await navigator.clipboard.writeText(`${source.book} ${source.chapter}:${source.verse}\n${source.text}`);
  }

  async function share(source: Source) {
    const text = `${source.book} ${source.chapter}:${source.verse}\n${source.text}`;
    if (navigator.share) await navigator.share({ title: "آية من الكتاب المقدس", text });
    else await navigator.clipboard.writeText(text);
  }

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-6" dir="rtl">
      <div>
        <h2 className="text-2xl font-bold text-navy">اسأل الكتاب المقدس</h2>
        <p className="mt-2 text-sm text-navy/70">ابحث عن آيات مرتبطة بموضوع أو مفهوم، بإجابات مستندة إلى النص.</p>
      </div>
      <form onSubmit={search} className="rounded-3xl border border-navy/10 bg-white p-3 shadow-sm">
        <textarea value={query} onChange={(event) => setQuery(event.target.value)} rows={2}
          placeholder="ما الذي تريد أن تعرفه عن المحبة أو الرجاء؟"
          className="w-full resize-none bg-transparent p-2 text-base text-navy outline-none placeholder:text-navy/40" />
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-navy/10 pt-3">
          <div className="flex gap-1 text-xs">
            {(["ALL", "OT", "NT"] as const).map((value) => (
              <button type="button" key={value} onClick={() => setFilter(value)}
                className={`rounded-full px-3 py-1.5 ${filter === value ? "bg-coral text-navy" : "bg-cream text-navy/70"}`}>
                {value === "ALL" ? "الكل" : value === "OT" ? "العهد القديم" : "العهد الجديد"}
              </button>
            ))}
          </div>
          <button disabled={loading || !query.trim()} className="rounded-full bg-coral px-5 py-2 text-sm font-bold text-navy disabled:opacity-40">
            {loading ? "جاري البحث…" : "ابحث"}
          </button>
        </div>
      </form>
      <div className="flex flex-wrap gap-2">
        {examples.map((example) => <button key={example} onClick={() => setQuery(example)}
          className="rounded-full border border-navy/15 bg-white px-3 py-1.5 text-xs text-navy/75 shadow-sm transition hover:bg-cream">{example}</button>)}
      </div>
      {loading && <div className="flex flex-col gap-3">{[1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-navy/10" />)}</div>}
      {error && <p className="rounded-2xl border border-red-600/30 bg-white p-4 text-sm text-red-700 shadow-sm">{error}</p>}
      {!loading && answer && <p className="rounded-2xl border border-coral/20 bg-coral/10 p-4 text-sm leading-8 text-navy">{answer}</p>}
      {!loading && sources.length === 0 && answer && <p className="text-center text-sm text-navy/60">لم تظهر نتائج كافية. جرّب أحد الاقتراحات أعلاه.</p>}
      <div className="flex flex-col gap-4">
        {sources.map((source) => <article key={`${source.book}-${source.chapter}-${source.verse}`} className="rounded-3xl border border-navy/10 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <strong className="text-coral">
              {toEasternArabicNumerals(source.book)} {toEasternArabicNumerals(source.chapter)}: {toEasternArabicNumerals(source.verse)}
            </strong>
            <div className="flex gap-2">
              <button onClick={() => copy(source)} className="rounded-full bg-cream px-3 py-1 text-xs text-navy/80">نسخ</button>
              <button onClick={() => share(source)} className="rounded-full bg-cream px-3 py-1 text-xs text-navy/80">مشاركة</button>
            </div>
          </div>
          <blockquote className="mt-4 border-r-2 border-coral/60 pr-4 text-lg leading-loose text-navy">«{source.text}»</blockquote>
        </article>)}
      </div>
    </section>
  );
}
