import PageHeader from "@/components/PageHeader";
import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="min-h-dvh" style={{ background: "radial-gradient(ellipse at 50% 0%, #1a4db5 0%, #0f1f5c 70%)" }}>
      <PageHeader title="About Us" icon="ℹ️" />

      <div className="flex flex-col items-center gap-6 px-5 py-6 max-w-lg mx-auto">

        {/* Logo */}
        <div className="h-28 w-28 overflow-hidden rounded-full shadow-2xl shadow-blue-accent/30 ring-4 ring-blue-accent/40">
          <Image src="/logo.png" alt="E3dady Logo" width={112} height={112} className="h-full w-full object-cover" />
        </div>

        {/* Main description */}
        <div className="w-full rounded-2xl border border-blue-mid/40 bg-blue-primary/30 p-5 backdrop-blur-sm text-right" dir="rtl">
          <p className="text-base leading-relaxed text-white/90">
            إحنا اجتماع إعدادي في كنيسة المسيح – عزبة النخل، بنجتمع علشان نكبر مع بعض في علاقتنا بربنا، نفهم كلمته أكتر، ونعيش إيماننا بشكل حقيقي في حياتنا اليومية.
          </p>
          <p className="mt-3 text-base leading-relaxed text-white/90">
            بالنسبالنا الاجتماع مش مجرد وقت بنقضيه كل أسبوع، لكنه مكان بنقابل فيه ربنا، وبنكوّن صداقات حقيقية، ونتعلم، ونخوض تجارب جديدة مع بعض.
          </p>
        </div>

        {/* Three pillars */}
        {[
          {
            icon: "✝️",
            title: "إيمان",
            desc: "نقرب من ربنا، ونعرفه أكتر، ونفهم كلمته ونكتشف إزاي نعيشها.",
          },
          {
            icon: "🤝",
            title: "أصحاب",
            desc: "نبني مجتمع حقيقي نقدر نكون فيه على طبيعتنا، ونفرح ونساعد بعض ونكبر سوا.",
          },
          {
            icon: "🌱",
            title: "نمو",
            desc: "كل واحد فينا في رحلة، وهدفنا إننا نتقدم خطوة كل يوم في علاقتنا بربنا وبالناس حوالينا.",
          },
        ].map(({ icon, title, desc }) => (
          <div key={title} dir="rtl"
            className="w-full flex items-start gap-4 rounded-2xl border border-blue-mid/40 bg-blue-primary/30 p-5 backdrop-blur-sm">
            <span className="text-3xl shrink-0 mt-0.5">{icon}</span>
            <div>
              <p className="text-base font-bold text-white mb-1">{title}</p>
              <p className="text-sm leading-relaxed text-blue-light/80">{desc}</p>
            </div>
          </div>
        ))}

        {/* Church name footer */}
        <p className="text-xs text-blue-light/40 text-center pb-2">
          كنيسة المسيح – عزبة النخل · Christ Church – Ezbet El Nakhl
        </p>
      </div>
    </div>
  );
}
