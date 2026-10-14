import { Icon, type IconName } from "@/components/Icon";

const iconMap: Record<string, IconName> = {
  "📅": "calendar", "📖": "book", "🎮": "play", "🔎": "sparkles",
  "✨": "sparkles", "🗂️": "book", "📚": "book", "🖼️": "sparkles",
  "📬": "mail", "✝️": "book", "🔔": "mail", "☰": "menu", "🙏": "user",
  calendar: "calendar", book: "book", play: "play", search: "search",
  sparkles: "sparkles", menu: "menu", user: "user", share: "share", mail: "mail",
};

export default function PageHeader({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="app-shell flex items-center gap-3 border-b border-navy/10 px-4 py-5">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pink text-coral">
        <Icon name={iconMap[icon] ?? "sparkles"} />
      </span>
      <h1 className="text-xl font-black text-navy">{title}</h1>
    </div>
  );
}
