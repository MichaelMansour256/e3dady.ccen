import { useTranslations } from "next-intl";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";

export default function GamesPage() {
  const t = useTranslations("games");

  const games = [
    { key: "holyWordle", icon: "🟩", href: "games/holy-wordle" },
    { key: "crossword", icon: "🔤", href: "games/crossword" },
    { key: "whoAmI", icon: "🤔", href: "games/who-am-i" },
    { key: "emojiBible", icon: "😇", href: "games/emoji-bible" },
  ] as const;

  return (
    <div className="min-h-dvh" style={{ background: "radial-gradient(ellipse at 50% 0%, #1a4db5 0%, #0f1f5c 70%)" }}>
      <PageHeader title={t("title")} icon="🎮" />
      <div className="grid grid-cols-2 gap-4 p-4">
        {games.map(({ key, icon, href }) => (
          <Link key={key} href={href}
            className="flex flex-col items-center gap-3 rounded-2xl border border-blue-mid/40 bg-blue-primary/40 p-6 text-center backdrop-blur-sm transition hover:bg-blue-mid/50 active:scale-95">
            <span className="text-4xl">{icon}</span>
            <span className="text-sm font-semibold text-white">{t(key)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
