"use client";

import { FormEvent, useState } from "react";

type Source = { book: string; chapter: number; verse: string; text: string; score: number };
const examples = ["آيات عن المحبة", "التسامح وغفران الإساءة", "السلام والاطمئنان في الضيقات"];

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
        <h2 className="text-2xl font-bold text-white">اسأل الكتاب المقدس</h2>
        <p className="mt-2 text-sm text-blue-light/70">ابحث عن آيات مرتبطة بموضوع أو مفهوم، بإجابات مستندة إلى النص.</p>
      </div>
      <form onSubmit={search} className="rounded-3xl border border-blue-accent/30 bg-blue-primary/40 p-3 shadow-xl">
        <textarea value={query} onChange={(event) => setQuery(event.target.value)} rows={2}
          placeholder="ما الذي تريد أن تعرفه عن المحبة أو الرجاء؟"
          className="w-full resize-none bg-transparent p-2 text-base text-white outline-none placeholder:text-blue-light/40" />
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
          <div className="flex gap-1 text-xs">
            {(["ALL", "OT", "NT"] as const).map((value) => (
              <button type="button" key={value} onClick={() => setFilter(value)}
                className={`rounded-full px-3 py-1.5 ${filter === value ? "bg-blue-accent text-white" : "bg-white/5 text-blue-light/70"}`}>
                {value === "ALL" ? "الكل" : value === "OT" ? "العهد القديم" : "العهد الجديد"}
              </button>
            ))}
          </div>
          <button disabled={loading || !query.trim()} className="rounded-full bg-blue-accent px-5 py-2 text-sm font-bold text-white disabled:opacity-40">
            {loading ? "جاري البحث…" : "ابحث"}
          </button>
        </div>
      </form>
      <div className="flex flex-wrap gap-2">
        {examples.map((example) => <button key={example} onClick={() => setQuery(example)}
          className="rounded-full border border-blue-mid/50 px-3 py-1.5 text-xs text-blue-light/80 transition hover:bg-blue-primary/60">{example}</button>)}
      </div>
      {loading && <div className="flex flex-col gap-3">{[1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-white/10" />)}</div>}
      {error && <p className="rounded-2xl border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-100">{error}</p>}
      {!loading && answer && <p className="rounded-2xl border border-blue-accent/20 bg-blue-primary/30 p-4 text-sm leading-8 text-white/90">{answer}</p>}
      {!loading && sources.length === 0 && answer && <p className="text-center text-sm text-blue-light/60">لم تظهر نتائج كافية. جرّب أحد الاقتراحات أعلاه.</p>}
      <div className="flex flex-col gap-4">
        {sources.map((source) => <article key={`${source.book}-${source.chapter}-${source.verse}`} className="rounded-3xl border border-blue-accent/25 bg-gradient-to-br from-blue-primary/60 to-blue-dark/80 p-5 shadow-lg">
          <div className="flex items-center justify-between gap-3">
            <strong className="text-blue-light">{source.book} {source.chapter}:{source.verse}</strong>
            <div className="flex gap-2">
              <button onClick={() => copy(source)} className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">نسخ</button>
              <button onClick={() => share(source)} className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">مشاركة</button>
            </div>
          </div>
          <blockquote className="mt-4 border-r-2 border-blue-accent/60 pr-4 text-lg leading-loose text-white">«{source.text}»</blockquote>
        </article>)}
      </div>
    </section>
  );
}
