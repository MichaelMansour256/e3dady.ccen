"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import PageHeader from "@/components/PageHeader";

export default function EventsPage() {
  const t = useTranslations("events");
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  return (
    <div className="min-h-dvh" style={{ background: "radial-gradient(ellipse at 50% 0%, #1a4db5 0%, #0f1f5c 70%)" }}>
      <PageHeader title={t("title")} icon="📅" />

      {/* Tabs */}
      <div className="flex gap-2 px-4 pt-4">
        {(["upcoming", "past"] as const).map((key) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
              tab === key ? "bg-blue-accent text-white" : "bg-blue-primary/40 text-blue-light/70"
            }`}>
            {t(key)}
          </button>
        ))}
      </div>

      {/* Placeholder content */}
      <div className="flex flex-col items-center justify-center gap-3 px-4 pt-16 text-center text-blue-light/50">
        <span className="text-5xl">📅</span>
        <p className="text-sm">{tab === "upcoming" ? t("upcoming") : t("past")}</p>
        <p className="text-xs">Coming soon…</p>
      </div>
    </div>
  );
}
