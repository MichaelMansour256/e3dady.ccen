import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { Icon } from "@/components/Icon";
import { bibleSections, isFeatureEnabled } from "@/config";

export default function BiblePage() {
  const t = useTranslations("bible");
  const locale = useLocale();

  const sections = bibleSections.filter((s) => isFeatureEnabled(s.feature));

  return (
    <div className="min-h-dvh page-gradient">
      <PageHeader title={t("title")} icon="book" />
      <div className="flex flex-col gap-3 p-4">
        {sections.map(({ key, href, icon }) => (
          <Link key={key} href={`/${locale}${href}`}
            className="focus-ring pressable flex items-center gap-4 rounded-2xl border border-navy/10 bg-white p-5 shadow-sm transition hover:bg-cream active:scale-95">
            <Icon name={icon} size={28} className="text-coral" />
            <span className="text-base font-semibold text-navy">{t(key)}</span>
            <span className="ms-auto text-navy/40">›</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
