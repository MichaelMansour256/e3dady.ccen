import PageHeader from "@/components/PageHeader";
import SocialLinks from "@/components/SocialLinks";
import Link from "next/link";
import { meetingConfig, siteConfig } from "@/config";
import { useLocale, useTranslations } from "next-intl";

export default function ContactPage() {
  const locale = useLocale();
  const t = useTranslations("contact");
  const isAr = locale === "ar";

  return (
    <div className="min-h-dvh page-gradient">
      <PageHeader title={t("title")} icon="mail" />

      <div className="flex flex-col items-center gap-6 px-6 pt-8 text-center">
        {/* Church info */}
        <div className="w-full max-w-sm rounded-2xl border border-navy/10 bg-white p-6 shadow-sm">
          <p className="text-base font-semibold text-navy">{siteConfig.church.name}</p>
          <p className="mt-1 text-sm text-navy/70">{isAr ? meetingConfig.tagline.ar : meetingConfig.tagline.en}</p>
        </div>

        {/* Social links */}
        <div className="w-full max-w-sm rounded-2xl border border-navy/10 bg-white p-6 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-navy">{t("followUs")}</p>
          <SocialLinks />
        </div>

        {/* All links list */}
        <div className="w-full max-w-sm flex flex-col gap-2">
          {siteConfig.social.map(({ name, url }) => (
            <Link key={name} href={url} target="_blank" rel="noopener noreferrer"
              className="focus-ring pressable flex items-center justify-between rounded-2xl border border-navy/10 bg-white px-5 py-3 text-sm font-semibold text-navy shadow-sm transition hover:bg-cream active:scale-95">
              {name}
              <span className="text-navy/40">↗</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
