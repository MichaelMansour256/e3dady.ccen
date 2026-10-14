import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import PushBell from "@/components/PushBell";
import NotificationInboxLink from "@/components/NotificationInboxLink";
import SocialLinks from "@/components/SocialLinks";
import { Icon, type IconName } from "@/components/Icon";
import { moreMenuItems, isFeatureEnabled, features } from "@/config";

export default function MorePage() {
  const t = useTranslations("more");
  const locale = useLocale();

  const items = moreMenuItems.filter((item) => isFeatureEnabled(item.feature));
  const iconByKey: Record<string, IconName> = {
    about: "user", gallery: "sparkles", servants: "user", prayerWall: "book", contact: "mail",
  };

  return (
    <div className="min-h-dvh page-gradient">
      <PageHeader title={t("title")} icon="☰" />
      <div className="flex flex-col gap-2 p-4">
        {features.notifications && <NotificationInboxLink />}
        {features.notifications && <PushBell locale={locale} />}
        {items.map(({ key, href }) => (
          <Link key={key} href={`/${locale}${href}`}
            className="focus-ring pressable flex min-h-14 items-center gap-4 rounded-2xl border border-navy/10 bg-white p-4 shadow-sm">
            <Icon name={iconByKey[key] ?? "arrow"} className="text-coral" />
            <span className="text-base font-semibold text-navy">{t(key)}</span>
            <Icon name="arrow" className="ms-auto text-navy/40" />
          </Link>
        ))}
        <section className="mt-4 rounded-[28px] bg-butter p-5">
          <h2 className="mb-3 text-lg font-black text-navy">{locale === "ar" ? "تابعونا" : "Follow us"}</h2>
          <SocialLinks />
        </section>
        <Link href={`/${locale === "ar" ? "en" : "ar"}`} className="focus-ring mt-2 self-center rounded-full px-4 py-3 text-sm font-bold text-navy/65">
          {locale === "ar" ? "EN | عربي" : "EN | عربي"}
        </Link>
      </div>
    </div>
  );
}
