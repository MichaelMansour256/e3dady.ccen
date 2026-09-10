import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import SocialLinks from "@/components/SocialLinks";

export default function HomePage() {
  const t = useTranslations("home");
  const tNav = useTranslations("nav");

  const quickLinks = [
    { key: "events", href: "events", icon: "📅" },
    { key: "bible",  href: "bible",  icon: "📖" },
    { key: "games",  href: "games",  icon: "🎮" },
    { key: "more",   href: "more",   icon: "☰"  },
  ] as const;

  return (
    <div className="relative flex min-h-dvh flex-col items-center overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 50% 20%, #1a4db5 0%, #0f1f5c 55%, #060d2e 100%)" }}>

      {/* Background glow blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="animate-pulse-glow absolute -top-20 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-blue-accent/20 blur-3xl" />
        <div className="animate-pulse-glow absolute top-40 -left-20 h-60 w-60 rounded-full bg-blue-primary/30 blur-3xl" style={{ animationDelay: "1s" }} />
        <div className="animate-pulse-glow absolute top-40 -right-20 h-60 w-60 rounded-full bg-blue-primary/30 blur-3xl" style={{ animationDelay: "2s" }} />
      </div>

      {/* Hero */}
      <div className="relative z-10 flex flex-col items-center px-6 pt-14 pb-6 text-center">

        {/* Logo — no circle crop, full logo with glow */}
        <div className="animate-fade-up relative mb-5">
          {/* Glow ring behind logo */}
          <div className="absolute inset-0 rounded-full bg-blue-accent/20 blur-2xl scale-110" />
          <Image
            src="/logo.png"
            alt="E3dady Logo"
            width={220}
            height={220}
            className="relative drop-shadow-2xl"
            priority
          />
        </div>

        {/* Text */}
        <div className="animate-fade-up-delay flex flex-col items-center gap-1">
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">
            {t("welcome")}
          </h1>
          <p className="text-sm text-blue-light/70 max-w-xs leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        {/* Divider */}
        <div className="animate-fade-up-delay my-4 flex items-center gap-3 w-48">
          <div className="h-px flex-1 bg-blue-accent/30" />
          <span className="text-blue-accent/60 text-xs">✝</span>
          <div className="h-px flex-1 bg-blue-accent/30" />
        </div>

        {/* Social links */}
        <div className="animate-fade-up-delay-2">
          <SocialLinks />
        </div>
      </div>

      {/* Quick nav grid */}
      <div className="animate-fade-up-delay-2 relative z-10 grid w-full max-w-sm grid-cols-2 gap-3 px-5 pb-4">
        {quickLinks.map(({ key, href, icon }) => (
          <Link key={key} href={href}
            className="group flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-5 text-center backdrop-blur-md transition hover:bg-white/10 hover:border-blue-accent/40 active:scale-95">
            <span className="text-4xl transition group-hover:scale-110">{icon}</span>
            <span className="text-sm font-semibold text-white/90">{tNav(key)}</span>
          </Link>
        ))}
      </div>

      {/* Bottom fade */}
      <div className="pointer-events-none absolute bottom-16 left-0 right-0 h-16 bg-gradient-to-t from-[#060d2e]/60 to-transparent" />
    </div>
  );
}
