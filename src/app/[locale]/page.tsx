import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import SocialLinks from "@/components/SocialLinks";

export default function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const t = useTranslations("home");
  const tNav = useTranslations("nav");

  const quickLinks = [
    { key: "events", href: "events", icon: "📅" },
    { key: "bible", href: "bible", icon: "📖" },
    { key: "games", href: "games", icon: "🎮" },
    { key: "more", href: "more", icon: "☰" },
  ] as const;

  return (
    <div className="flex min-h-dvh flex-col items-center"
      style={{ background: "radial-gradient(ellipse at 50% 30%, #1a4db5 0%, #0f1f5c 60%, #080f2e 100%)" }}>
      {/* Hero */}
      <div className="flex flex-col items-center px-6 pt-16 pb-8 text-center">
        <div className="mb-6 h-40 w-40 overflow-hidden rounded-full shadow-2xl shadow-blue-accent/30 ring-4 ring-blue-accent/40">
          <Image src="/logo.png" alt="E3dady Logo" width={160} height={160} className="h-full w-full object-cover" priority />
        </div>
        <h1 className="text-3xl font-bold text-white">{t("welcome")}</h1>
        <p className="mt-2 text-sm text-blue-light/80">{t("subtitle")}</p>
        <SocialLinks className="mt-4" />
      </div>

      {/* Quick nav grid */}
      <div className="grid w-full max-w-sm grid-cols-2 gap-4 px-6">
        {quickLinks.map(({ key, href, icon }) => (
          <Link key={key} href={href}
            className="flex flex-col items-center gap-2 rounded-2xl border border-blue-mid/40 bg-blue-primary/40 p-6 text-center backdrop-blur-sm transition hover:bg-blue-mid/50 active:scale-95">
            <span className="text-4xl">{icon}</span>
            <span className="text-sm font-semibold text-white">{tNav(key)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
