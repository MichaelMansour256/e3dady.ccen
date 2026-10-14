"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import PageHeader from "@/components/PageHeader";
import { Icon } from "@/components/Icon";

type Prayer = { id: string; name: string; request: string; pray_count: number; created_at: string };

export default function PrayerWallPage() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = useTranslations("prayerWall");

  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [request, setRequest] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [prayedIds, setPrayedIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    const stored = window.localStorage.getItem("prayedIds");
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });

  useEffect(() => {
    fetch("/api/prayer")
      .then((r) => r.json())
      .then((data) => { setPrayers(Array.isArray(data) ? data : []); setLoading(false); });
    // Load prayed ids from localStorage
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!request.trim()) return;
    setSubmitting(true);
    await fetch("/api/prayer", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, request }),
    });
    setSubmitting(false);
    setSubmitted(true);
    setName("");
    setRequest("");
  }

  async function handlePray(id: string) {
    if (prayedIds.has(id)) return;
    const newIds = new Set(prayedIds).add(id);
    setPrayedIds(newIds);
    localStorage.setItem("prayedIds", JSON.stringify([...newIds]));
    const res = await fetch("/api/prayer/pray", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (data.pray_count !== undefined) {
      setPrayers((prev) => prev.map((p) => p.id === id ? { ...p, pray_count: data.pray_count } : p));
    }
  }

  return (
    <div className="min-h-dvh page-gradient">
      <PageHeader title={t("title")} icon="book" />

      <div className="flex flex-col gap-4 px-4 py-4 max-w-lg mx-auto">

        {/* Submit form */}
        {submitted ? (
          <div className="rounded-2xl border border-green-600/30 bg-mint p-5 text-center" dir="rtl">
            <Icon name="sparkles" className="mx-auto mb-2 text-coral" />
            <p className="font-semibold text-navy">{t("thanks")}</p>
            <p className="text-sm text-navy/70 mt-1">{t("pending")}</p>
            <button onClick={() => setSubmitted(false)}
              className="focus-ring mt-3 text-sm font-semibold text-coral underline">
              {t("addAnother")}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} dir="rtl"
            className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
            <p className="font-semibold text-navy mb-3">
              {t("share")}
            </p>
            <div className="flex flex-col gap-2">
              <input
                placeholder={t("namePlaceholder")}
                value={name} onChange={(e) => setName(e.target.value)}
                className="focus-ring w-full rounded-xl border border-navy/15 bg-cream px-4 py-2 text-navy placeholder-navy/40 outline-none focus:border-coral text-sm"
              />
              <textarea
                placeholder={t("requestPlaceholder")}
                value={request} onChange={(e) => setRequest(e.target.value)}
                rows={3}
                className="focus-ring w-full rounded-xl border border-navy/15 bg-cream px-4 py-2 text-navy placeholder-navy/40 outline-none focus:border-coral text-sm resize-none"
              />
              <button type="submit" disabled={submitting || !request.trim()}
                className="focus-ring pressable rounded-xl bg-coral py-2 text-sm font-semibold text-navy hover:brightness-95 disabled:opacity-50 transition">
                {submitting ? "…" : t("send")}
              </button>
            </div>
          </form>
        )}

        {/* Prayer cards */}
        {loading ? (
          <div className="flex justify-center pt-8 text-navy/60 text-sm">
            {t("loading")}
          </div>
        ) : prayers.length === 0 ? (
          <div className="flex flex-col items-center pt-8 gap-2 text-navy/50">
            <Icon name="book" size={36} className="text-coral" />
            <p className="text-sm">{t("empty")}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {prayers.map((prayer) => {
              const prayed = prayedIds.has(prayer.id);
              const date = new Date(prayer.created_at).toLocaleDateString(isAr ? "ar-EG" : "en-US", {
                month: "short", day: "numeric",
              });
              return (
                <div key={prayer.id} dir="rtl"
                  className="rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-sm font-semibold text-navy">{prayer.name}</p>
                      <p className="text-xs text-navy/50">{date}</p>
                    </div>
                    <button onClick={() => handlePray(prayer.id)}
                      className={`focus-ring flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition shrink-0 ${
                        prayed
                          ? "bg-coral/15 text-coral cursor-default"
                          : "bg-cream text-navy/70 hover:bg-coral/15 hover:text-coral"
                      }`}>
                      <Icon name="sparkles" size={14} /> {prayer.pray_count}
                    </button>
                  </div>
                  <p className="text-sm leading-relaxed text-navy/85">{prayer.request}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
