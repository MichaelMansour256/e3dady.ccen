"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import PageHeader from "@/components/PageHeader";
import WeeklyMeetingCard from "@/components/WeeklyMeetingCard";
import { meetingConfig } from "@/config";
import { Icon } from "@/components/Icon";
import { setRsvp } from "@/lib/progress";
import { getProgress } from "@/lib/progress";
import ConfettiBurst from "@/components/ConfettiBurst";

type SpecialEvent = { id: string; title: string; titleAr: string; date: string; time: string; description?: string; descriptionAr?: string };
type Invitation = { date: string; url: string; publicId: string; width: number; height: number };

function latinDigits(value: string) {
  return value.replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

function UpcomingMeetingDays({ locale, onSelect }: {
  locale: string;
  onSelect: (date: string) => void;
}) {
  const today = new Date();
  const days: Date[] = [];
  const cursor = new Date(today);
  while (days.length < 3) {
    if (cursor.getDay() === meetingConfig.schedule.weekday && cursor >= today) days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none">
      {days.map((d) => {
        const iso = d.toISOString().slice(0, 10);
        const label = latinDigits(d.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { weekday: "short", day: "numeric", month: "short" }));
        return (
          <button key={iso} onClick={() => onSelect(iso)}
            className={`focus-ring pressable flex min-h-14 shrink-0 items-center gap-2 rounded-2xl px-4 text-sm font-bold ${days[0] === d ? "bg-yellow text-navy" : "bg-white text-navy/70 shadow-sm"}`}>
            <Icon name="calendar" size={18} /> {label}
          </button>
        );
      })}
    </div>
  );
}

export default function EventsPage() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = useTranslations("events");
  const [events, setEvents] = useState<SpecialEvent[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [fullscreenImg, setFullscreenImg] = useState<string | null>(null);
  const [rsvped, setRsvped] = useState(false);
  const [confetti, setConfetti] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch("/api/events").then((r) => r.json()),
      fetch("/api/invitations").then((r) => r.json()),
    ]).then(([eventsData, invData]) => {
      setEvents(Array.isArray(eventsData) ? eventsData : []);
      setInvitations(Array.isArray(invData) ? invData : []);
      setLoading(false);
    });
  }, []);

  const today = new Date().toISOString().split("T")[0];
  const upcoming = events.filter((e) => e.date >= today);

  // getInvitations returns records newest first, based on their meeting date.
  const latestInvitation = invitations[0];
  const olderInvitations = invitations.slice(1);
  const rsvp = () => {
    const before = getProgress();
    setRsvped(true);
    const after = setRsvp(new Date().toISOString().slice(0, 10));
    if (after.xp !== before.xp) setConfetti((value) => value + 1);
  };

  return (
    <div className="app-shell min-h-dvh bg-cream pb-6 text-navy">
      <ConfettiBurst trigger={confetti} />
      <PageHeader title={t("title")} icon="calendar" />

      <div className="pt-4 pb-2">
        <WeeklyMeetingCard />
      </div>
      <section className="mx-4 rounded-[28px] bg-navy p-5 text-white">
        <div className="flex items-center justify-between"><div><p className="text-sm text-white/70">{t("meetingLine")}</p><h2 className="text-3xl font-black">{t("nextMeeting")}</h2></div><Icon name="calendar" className="text-yellow" size={32} /></div>
        <button onClick={rsvp} disabled={rsvped} className={`focus-ring pressable mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl font-black ${rsvped ? "bg-success text-navy" : "bg-coral text-white"}`}>
          {rsvped ? <Icon name="check" /> : null}{rsvped ? t("rsvpDone") : t("rsvp")}
        </button>
      </section>

      {/* Latest invitation */}
      {latestInvitation && (
        <button onClick={() => setFullscreenImg(latestInvitation.url)}
          className="mx-4 mb-2 flex w-[calc(100%-2rem)] justify-center overflow-hidden rounded-2xl border border-yellow-400/30 bg-black/10 shadow-lg shadow-yellow-400/10 active:scale-95 transition">
          <Image src={latestInvitation.url} alt={latestInvitation.date}
            width={latestInvitation.width} height={latestInvitation.height}
            className="h-auto w-full object-contain" sizes="(max-width: 640px) calc(100vw - 2rem), 600px" />
        </button>
      )}

      <UpcomingMeetingDays locale={locale} onSelect={() => undefined} />

      {olderInvitations.length > 0 && (
        <section className="px-4 pb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-blue-light/50">
            {t("olderInvitations")}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {olderInvitations.map((inv) => (
              <button key={inv.publicId} onClick={() => setFullscreenImg(inv.url)}
                className="focus-ring pressable relative aspect-[3/4] overflow-hidden rounded-2xl bg-white shadow-sm">
                <Image src={inv.url} alt={inv.date} width={inv.width} height={inv.height}
                  className="h-full w-full object-contain" sizes="(max-width: 640px) 45vw, 280px" />
                <div className="absolute bottom-0 left-0 right-0 bg-navy/85 py-2 text-center text-xs text-white">
                  {latinDigits(new Date(inv.date).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { day: "numeric", month: "long" }))}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-3 px-4 pt-4">{[1, 2].map((item) => <div key={item} className="h-48 animate-pulse rounded-2xl bg-navy/10" />)}</div>
      ) : (
        <div className="px-4 pb-4">
          {upcoming.length > 0 && (
            <section className="mb-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-blue-light/50">
                {t("upcomingEvents")}
              </p>
              <div className="flex flex-col gap-3">
                {upcoming.map((e) => <EventCard key={e.id} event={e} isAr={isAr} invitation={invitations.find((i) => i.date === e.date)} onInvitationTap={setFullscreenImg} />)}
              </div>
            </section>
          )}

          {upcoming.length === 0 && invitations.length === 0 && (
            <div className="flex flex-col items-center pt-8 text-blue-light/40 gap-2">
              <Icon name="calendar" size={40} />
              <p className="text-sm">{t("empty")}</p>
            </div>
          )}
        </div>
      )}

      {/* Fullscreen image viewer */}
      {fullscreenImg && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95"
          onClick={() => setFullscreenImg(null)}>
          <button aria-label={t("close")} onClick={() => setFullscreenImg(null)} className="focus-ring absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white"><Icon name="x" /></button>
          <Image src={fullscreenImg} alt="invitation" width={1200} height={1600}
            className="max-h-[90dvh] max-w-full object-contain rounded-xl" />
        </div>
      )}
    </div>
  );
}

function EventCard({ event, isAr, invitation, onInvitationTap }: {
  event: SpecialEvent; isAr: boolean;
  invitation?: Invitation;
  onInvitationTap: (url: string) => void;
}) {
  const title = isAr ? event.titleAr : event.title;
  const desc = isAr ? event.descriptionAr : event.description;
  const date = latinDigits(new Date(event.date).toLocaleDateString(isAr ? "ar-EG" : "en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  }));

  return (
    <div className="overflow-hidden rounded-[28px] border border-navy/10 bg-white shadow-sm">
      {invitation && (
        <button onClick={() => onInvitationTap(invitation.url)} className="w-full">
          <Image src={invitation.url} alt={invitation.date}
            width={invitation.width} height={invitation.height}
            className="h-auto w-full object-contain" />
        </button>
      )}
      <div className="flex items-start gap-3 p-4">
        <Icon name="sparkles" className="mt-0.5 text-coral" />
        <div className="flex-1">
          <p className="font-bold text-navy">{title}</p>
          <p className="mt-0.5 text-xs text-navy/60">{date} · {event.time}</p>
          {desc && <p className="mt-1 text-sm text-navy/70">{desc}</p>}
        </div>
      </div>
    </div>
  );
}
