import Image from "next/image";
import PageHeader from "@/components/PageHeader";

const SERVANTS = [
  { file: "alfy mikhael.jpg",   name: "Alfy Mikhael",   nameAr: "ألفي ميخائيل" },
  { file: "ehab youssef.jpg",   name: "Ehab Youssef",   nameAr: "إيهاب يوسف" },
  { file: "heba kameel.jpg",    name: "Heba Kameel",    nameAr: "هبة كميل" },
  { file: "manar khalaf.jpg",   name: "Manar Khalaf",   nameAr: "منار خلف" },
  { file: "martina adel.jpg",   name: "Martina Adel",   nameAr: "مارتينا عادل" },
  { file: "michael mansour.jpg",name: "Michael Mansour",nameAr: "ميخائيل منصور" },
  { file: "michael nabil.jpg",  name: "Michael Nabil",  nameAr: "ميخائيل نبيل" },
  { file: "pierre mousa.jpeg",  name: "Pierre Mousa",   nameAr: "بيير موسى" },
  { file: "randa wagih.jpg",    name: "Randa Wagih",    nameAr: "راندا وجيه" },
  { file: "youssef nabil.jpg",  name: "Youssef Nabil",  nameAr: "يوسف نبيل" },
];

export default function ServantsPage() {
  return (
    <div className="min-h-dvh" style={{ background: "radial-gradient(ellipse at 50% 0%, #1a4db5 0%, #0f1f5c 70%)" }}>
      <PageHeader title="الخدام" icon="🙏" />

      <div className="grid grid-cols-2 gap-4 p-4">
        {SERVANTS.map(({ file, nameAr }) => (
          <div key={file}
            className="flex flex-col items-center gap-3 rounded-2xl border border-blue-mid/40 bg-blue-primary/30 p-4 backdrop-blur-sm">
            <div className="relative h-24 w-24 overflow-hidden rounded-full ring-2 ring-blue-accent/40 shadow-lg shadow-blue-accent/20">
              <Image
                src={`/servants images/${file}`}
                alt={nameAr}
                fill
                className="object-cover"
                sizes="96px"
              />
            </div>
            <p className="text-sm font-semibold text-white text-center">{nameAr}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
