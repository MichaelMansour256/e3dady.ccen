"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import PageHeader from "@/components/PageHeader";
import { Icon } from "@/components/Icon";
import BibleReference from "@/components/BibleReference";

type Verse = {
  book: number;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
  name: string;
  note?: string;
};

export default function VerseOfWeekPage() {
  const locale = useLocale();
  const t = useTranslations("verse");
  const isAr = locale === "ar";
  const [verse, setVerse] = useState<Verse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/verse")
      .then((r) => r.json())
      .then((data) => { setVerse(data); setLoading(false); });
  }, []);

  return (
    <div className="min-h-dvh page-gradient">
      <PageHeader title={t("title")} icon="sparkles" />

      <div className="flex flex-col items-center px-5 pt-8 pb-6 max-w-lg mx-auto">
        {loading ? (
          <div className="flex flex-col items-center gap-3 pt-20 text-navy/60">
            <Icon name="sparkles" size={36} className="animate-pulse text-coral" />
            <p className="text-sm">{t("loading")}</p>
          </div>
        ) : !verse || !verse.text ? (
          <div className="flex flex-col items-center gap-3 pt-20 text-navy/50">
            <Icon name="book" size={44} className="text-coral" />
            <p className="text-sm">{t("empty")}</p>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-4">
            {/* Verse card — intentional dark hero surface (white on navy ≈ 14.5:1) */}
            <div className="relative w-full rounded-3xl border border-coral/20 bg-navy p-6 shadow-xl shadow-navy/20"
              dir="rtl">
              {/* Decorative quote mark */}
              <span className="absolute top-4 right-5 text-6xl text-coral/20 font-serif leading-none select-none">&quot;</span>

              <p className="text-xl leading-loose text-white font-medium tracking-wide">
                {verse.text}
              </p>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-bold text-coral">
                  <BibleReference
                    bookName={verse.bookName}
                    chapter={verse.chapter}
                    verse={verse.verse}
                  />
                </span>
                <span className="text-xs text-white/60">{t("translation")}</span>
              </div>
            </div>

            {/* Servant note */}
            {verse.note && (
              <div className="w-full rounded-2xl border border-navy/10 bg-butter p-4" dir="rtl">
                <p className="text-xs font-semibold text-navy/70 mb-1">💬 {t("note")}</p>
                <p className="text-sm leading-relaxed text-navy">{verse.note}</p>
              </div>
            )}

            {/* Week label */}
            <p className="text-center text-xs text-navy/50">
              {t("weekLabel")} {new Date().toLocaleDateString(isAr ? "ar-EG" : "en-US", { month: "long", year: "numeric" })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
