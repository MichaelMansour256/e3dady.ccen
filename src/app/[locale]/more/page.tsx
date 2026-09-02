import { useTranslations } from "next-intl";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";

export default function MorePage() {
  const t = useTranslations("more");

  const items = [
    { key: "about", icon: "ℹ️", href: "more/about" },
    { key: "gallery", icon: "🖼️", href: "more/gallery" },
    { key: "servants", icon: "🙏", href: "more/servants" },
    { key: "prayerWall", icon: "✝️", href: "more/prayer-wall" },
    { key: "contact", icon: "📬", href: "more/contact" },
  ] as const;

  return (
    <div className="min-h-dvh" style={{ background: "radial-gradient(ellipse at 50% 0%, #1a4db5 0%, #0f1f5c 70%)" }}>
      <PageHeader title={t("title")} icon="☰" />
      <div className="flex flex-col gap-2 p-4">
        {items.map(({ key, icon, href }) => (
          <Link key={key} href={href}
            className="flex items-center gap-4 rounded-2xl border border-blue-mid/40 bg-blue-primary/40 p-4 backdrop-blur-sm transition hover:bg-blue-mid/50 active:scale-95">
            <span className="text-2xl">{icon}</span>
            <span className="text-base font-semibold text-white">{t(key)}</span>
            <span className="ms-auto text-blue-light/50">›</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
