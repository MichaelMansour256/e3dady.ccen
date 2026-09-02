"use client";
import { useState } from "react";
import { useLocale } from "next-intl";
import PageHeader from "@/components/PageHeader";

const GAMES = [
  {
    key: "verseUp",
    titleEn: "Verse Up Arena",
    titleAr: "ساحة الآيات",
    icon: "🎮",
    url: "https://verse-up-arena.vercel.app",
    descEn: "Bible verse challenge game",
    descAr: "تحدي آيات الكتاب المقدس",
  },
  {
    key: "holyWordle",
    titleEn: "HolyWordle",
    titleAr: "ووردل المقدس",
    icon: "🟩",
    url: null,
    descEn: "Coming soon",
    descAr: "قريباً",
  },
  {
    key: "crossword",
    titleEn: "Crossword",
    titleAr: "الكلمات المتقاطعة",
    icon: "🔤",
    url: null,
    descEn: "Coming soon",
    descAr: "قريباً",
  },
  {
    key: "whoAmI",
    titleEn: "Who Am I?",
    titleAr: "من أنا؟",
    icon: "🤔",
    url: null,
    descEn: "Coming soon",
    descAr: "قريباً",
  },
  {
    key: "emojiBible",
    titleEn: "Emoji Bible",
    titleAr: "إيموجي الكتاب المقدس",
    icon: "😇",
    url: null,
    descEn: "Coming soon",
    descAr: "قريباً",
  },
] as const;

export default function GamesPage() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [activeGame, setActiveGame] = useState<string | null>(null);

  const game = GAMES.find((g) => g.key === activeGame);

  // Full-screen iframe view
  if (activeGame && game?.url) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-black">
        {/* Top bar */}
        <div className="flex items-center gap-3 bg-blue-dark px-4 py-3 shrink-0">
          <button onClick={() => setActiveGame(null)}
            className="text-white/80 text-xl leading-none">‹</button>
          <span className="text-sm font-semibold text-white">
            {isAr ? game.titleAr : game.titleEn}
          </span>
        </div>
        <iframe
          src={game.url}
          className="flex-1 w-full border-none"
          allow="fullscreen"
          title={game.titleEn}
        />
      </div>
    );
  }

  return (
    <div className="min-h-dvh" style={{ background: "radial-gradient(ellipse at 50% 0%, #1a4db5 0%, #0f1f5c 70%)" }}>
      <PageHeader title={isAr ? "الألعاب" : "Games"} icon="🎮" />
      <div className="grid grid-cols-2 gap-4 p-4">
        {GAMES.map((game) => (
          <button key={game.key}
            onClick={() => game.url ? setActiveGame(game.key) : null}
            className={`flex flex-col items-center gap-3 rounded-2xl border p-6 text-center backdrop-blur-sm transition active:scale-95 ${
              game.url
                ? "border-blue-accent/40 bg-blue-primary/40 hover:bg-blue-mid/50 cursor-pointer"
                : "border-blue-mid/20 bg-blue-primary/20 opacity-50 cursor-not-allowed"
            }`}>
            <span className="text-4xl">{game.icon}</span>
            <div>
              <p className="text-sm font-semibold text-white">{isAr ? game.titleAr : game.titleEn}</p>
              <p className="text-xs text-blue-light/50 mt-0.5">{isAr ? game.descAr : game.descEn}</p>
            </div>
            {game.url && (
              <span className="rounded-full bg-blue-accent/20 px-2 py-0.5 text-xs text-blue-accent">
                {isAr ? "العب الآن" : "Play Now"}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
