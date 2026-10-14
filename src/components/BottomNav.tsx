"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { bottomNavTabs, isFeatureEnabled } from "@/config";
import { Icon, type IconName } from "@/components/Icon";

/** Bottom tabs from the central navigation config (feature-gated). */
const tabs = bottomNavTabs.filter((t) => isFeatureEnabled(t.feature));
const iconByKey: Record<string, IconName> = {
  home: "home",
  events: "calendar",
  bible: "book",
  games: "play",
  more: "user",
};

export default function BottomNav({ locale }: { locale: string }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const activeKey = tabs.find(({ href }) =>
    href === "/"
      ? pathname === `/${locale}` || pathname === `/${locale}/`
      : pathname.startsWith(`/${locale}${href}`)
  )?.key ?? "home";
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-w-2xl border-t border-black/10 bg-white/95 px-2 shadow-[0_-8px_24px_rgba(18,32,107,0.1)] backdrop-blur-sm"
      style={{ paddingBottom: "env(safe-area-inset-bottom)", direction: locale === "ar" ? "rtl" : "ltr" }}>
      {tabs.map(({ key, href }) => {
        if (key === "games") return null;
        const fullHref = `/${locale}${href === "/" ? "" : href}`;
        const isActive = key === activeKey;
        return (
          <Link key={key} href={fullHref}
            aria-current={isActive ? "page" : undefined}
            className={`focus-ring flex min-h-16 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors ${
              isActive ? "font-bold text-coral" : "text-navy/55 hover:text-navy"
            }`}>
            <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${isActive ? "bg-coral/10 ring-2 ring-coral/40" : ""}`}>
              <Icon name={iconByKey[key]} />
            </span>
            <span>{t(key)}</span>
          </Link>
        );
      })}
      <Link
        href={`/${locale}/games`}
        aria-current={pathname.startsWith(`/${locale}/games`) ? "page" : undefined}
        className={`focus-ring flex min-h-16 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors ${
          pathname.startsWith(`/${locale}/games`)
            ? "font-bold text-coral"
            : "text-navy/55 hover:text-navy"
        }`}
      >
        <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${
          pathname.startsWith(`/${locale}/games`)
            ? "bg-coral/10 ring-2 ring-coral/40"
            : ""
        }`}>
          <Icon name="play" />
        </span>
        <span>{t("games")}</span>
      </Link>
    </nav>
  );
}
