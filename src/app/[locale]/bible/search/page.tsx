import PageHeader from "@/components/PageHeader";
import BibleRagSearch from "@/components/bible/BibleRagSearch";

export default function BibleSearchPage() {
  return <div className="min-h-dvh page-gradient"><PageHeader title="البحث الموضوعي" icon="🔎" /><BibleRagSearch /></div>;
}
