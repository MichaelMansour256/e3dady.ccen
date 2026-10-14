import PageHeader from "@/components/PageHeader";
import Image from "next/image";
import { getLocale } from "next-intl/server";
import { meetingConfig, siteConfig } from "@/config";

export default async function AboutPage() {
  const locale = await getLocale();
  const isAr = locale === "ar";
  const { about } = meetingConfig;
  const paragraphs = isAr ? about.paragraphs.ar : about.paragraphs.en;

  return (
    <div className="min-h-dvh page-gradient">
      <PageHeader title={isAr ? about.title.ar : about.title.en} icon="sparkles" />

      <div className="flex flex-col items-center gap-6 px-5 py-6 max-w-lg mx-auto">

        {/* Logo */}
        <div className="h-28 w-28 overflow-hidden rounded-full shadow-xl shadow-navy/10 ring-4 ring-coral/40">
          <Image src={siteConfig.assets.logo} alt={`${siteConfig.shortName} Logo`} width={112} height={112} className="h-full w-full object-cover" />
        </div>

        {/* Main description */}
        <div className={`w-full rounded-2xl border border-navy/10 bg-white p-5 shadow-sm ${isAr ? "text-right" : "text-left"}`}
          dir={isAr ? "rtl" : "ltr"}>
          {paragraphs.map((paragraph, i) => (
            <p key={i} className={`text-base leading-relaxed text-navy${i > 0 ? " mt-3" : ""}`}>
              {paragraph}
            </p>
          ))}
        </div>

        {/* Three pillars */}
        {about.pillars.map((pillar) => (
          <div key={pillar.title.en} dir={isAr ? "rtl" : "ltr"}
            className="w-full flex items-start gap-4 rounded-2xl border border-navy/10 bg-white p-5 shadow-sm">
            <span className="text-3xl shrink-0 mt-0.5">{pillar.icon}</span>
            <div>
              <p className="text-base font-bold text-navy mb-1">{isAr ? pillar.title.ar : pillar.title.en}</p>
              <p className="text-sm leading-relaxed text-navy/75">{isAr ? pillar.desc.ar : pillar.desc.en}</p>
            </div>
          </div>
        ))}

        {/* Church name footer */}
        <p className="text-xs text-navy/50 text-center pb-2">
          {siteConfig.church.nameAr} · {siteConfig.church.name}
        </p>
      </div>
    </div>
  );
}
