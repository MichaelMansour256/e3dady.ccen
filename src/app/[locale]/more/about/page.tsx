import PageHeader from "@/components/PageHeader";
import Image from "next/image";
import { getLocale } from "next-intl/server";

export default async function AboutPage() {
  const locale = await getLocale();
  const isAr = locale === "ar";

  const pillars = isAr ? [
    { icon: "✝️", title: "إيمان", desc: "نقرب من ربنا، ونعرفه أكتر، ونفهم كلمته ونكتشف إزاي نعيشها." },
    { icon: "🤝", title: "أصحاب", desc: "نبني مجتمع حقيقي نقدر نكون فيه على طبيعتنا، ونفرح ونساعد بعض ونكبر سوا." },
    { icon: "🌱", title: "نمو", desc: "كل واحد فينا في رحلة، وهدفنا إننا نتقدم خطوة كل يوم في علاقتنا بربنا وبالناس حوالينا." },
  ] : [
    { icon: "✝️", title: "Faith", desc: "Drawing closer to God, knowing Him more, understanding His word and discovering how to live it out." },
    { icon: "🤝", title: "Friends", desc: "Building a real community where we can be ourselves, share joy, support each other and grow together." },
    { icon: "🌱", title: "Growth", desc: "Each of us is on a journey — our goal is to take one step forward every day in our relationship with God and the people around us." },
  ];

  return (
    <div className="min-h-dvh" style={{ background: "radial-gradient(ellipse at 50% 0%, #1a4db5 0%, #0f1f5c 70%)" }}>
      <PageHeader title={isAr ? "من نحن" : "About Us"} icon="ℹ️" />

      <div className="flex flex-col items-center gap-6 px-5 py-6 max-w-lg mx-auto">

        {/* Logo */}
        <div className="h-28 w-28 overflow-hidden rounded-full shadow-2xl shadow-blue-accent/30 ring-4 ring-blue-accent/40">
          <Image src="/logo.png" alt="E3dady Logo" width={112} height={112} className="h-full w-full object-cover" />
        </div>

        {/* Main description */}
        <div className={`w-full rounded-2xl border border-blue-mid/40 bg-blue-primary/30 p-5 backdrop-blur-sm ${isAr ? "text-right" : "text-left"}`}
          dir={isAr ? "rtl" : "ltr"}>
          {isAr ? (
            <>
              <p className="text-base leading-relaxed text-white/90">
                إحنا اجتماع إعدادي في كنيسة المسيح – عزبة النخل، بنجتمع علشان نكبر مع بعض في علاقتنا بربنا، نفهم كلمته أكتر، ونعيش إيماننا بشكل حقيقي في حياتنا اليومية.
              </p>
              <p className="mt-3 text-base leading-relaxed text-white/90">
                بالنسبالنا الاجتماع مش مجرد وقت بنقضيه كل أسبوع، لكنه مكان بنقابل فيه ربنا، وبنكوّن صداقات حقيقية، ونتعلم، ونخوض تجارب جديدة مع بعض.
              </p>
            </>
          ) : (
            <>
              <p className="text-base leading-relaxed text-white/90">
                We are a youth meeting at Christ Church – Ezbet El Nakhl. We gather to grow together in our relationship with God, understand His word more deeply, and live out our faith in our everyday lives.
              </p>
              <p className="mt-3 text-base leading-relaxed text-white/90">
                For us, this meeting is not just time we spend every week — it's a place where we encounter God, build real friendships, learn, and experience new things together.
              </p>
            </>
          )}
        </div>

        {/* Three pillars */}
        {pillars.map(({ icon, title, desc }) => (
          <div key={title} dir={isAr ? "rtl" : "ltr"}
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
