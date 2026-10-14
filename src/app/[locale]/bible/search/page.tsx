import PageHeader from "@/components/PageHeader";
import BibleRagSearch from "@/components/bible/BibleRagSearch";
import { useTranslations } from "next-intl";

export default function BibleSearchPage() {
  const t = useTranslations("search");
  return <div className="min-h-dvh page-gradient"><PageHeader title={t("title")} icon="search" /><BibleRagSearch /></div>;
}
