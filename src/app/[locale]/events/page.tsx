"use client";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import PageHeader from "@/components/PageHeader";
import WeeklyMeetingCard from "@/components/WeeklyMeetingCard";

type SpecialEvent = {
  id: string;
  title: string;
  titleAr: string;
  date: string;
  time: string;
  description?: string;
  descriptionAr?: string;
};

function DateStrip({ events }: { events: SpecialEvent[] }) {
  const today = new Date();
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });

  const eventDates = new Set(events.map((e) => e.date));
  const isFriday = (d: Date) => d.getDay() === 5;

  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none">
      {days.map((d) => {
        const iso = d.toISOString().split("T")[0];
        const isToday = iso === today.toISOString().split("T")[0];
        const hasEvent = eventDates.has(iso);
        const friday = isFriday(d);

        return (
          <div key={iso}
            className={`flex shrink-0 flex-col items-center rounded-xl px-3 py-2 w-12 transition ${
              isToday ? "bg-blue-accent text-white" :
              friday ? "bg-blue-primary/60 text-white border border-blue-accent/40" :
              "bg-blue-primary/20 text-blue-light/60"
            }`}>
            <span className="text-xs">{d.toLocaleDateString("en", { weekday: "short" })}</span>
            <span className="text-base font-bold">{d.getDate()}</span>
            {(friday || hasEvent) && (
              <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${hasEvent ? "bg-yellow-400" : "bg-blue-accent/60"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function EventsPage() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [events, setEvents] = useState<SpecialEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((data) => { setEvents(Array.isArray(data) ? data : []); setLoading(false); });
  }, []);

  const upcoming = events.filter((e) => e.date >= new Date().toISOString().split("T")[0]);
  const past = events.filter((e) => e.date < new Date().toISOString().split("T")[0]);

  return (
    <div className="min-h-dvh" style={{ background: "radial-gradient(ellipse at 50% 0%, #1a4db5 0%, #0f1f5c 70%)" }}>
      <PageHeader title={isAr ? "الفعاليات" : "Events"} icon="📅" />

      {/* Weekly meeting countdown */}
      <div className="pt-4 pb-2">
        <WeeklyMeetingCard />
      </div>

      {/* Date strip */}
      <DateStrip events={events} />

      {loading ? (
        <div className="flex justify-center pt-10 text-blue-light/50 text-sm">Loading…</div>
      ) : (
        <div className="px-4 pb-4">
          {/* Upcoming special events */}
          {upcoming.length > 0 && (
            <section className="mb-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-blue-light/50">
                {isAr ? "فعاليات قادمة" : "Upcoming"}
              </p>
              <div className="flex flex-col gap-3">
                {upcoming.map((e) => (
                  <EventCard key={e.id} event={e} isAr={isAr} />
                ))}
              </div>
            </section>
          )}

          {/* Past special events */}
          {past.length > 0 && (
            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-blue-light/50">
                {isAr ? "فعاليات سابقة" : "Past Events"}
              </p>
              <div className="flex flex-col gap-3 opacity-60">
                {[...past].reverse().map((e) => (
                  <EventCard key={e.id} event={e} isAr={isAr} />
                ))}
              </div>
            </section>
          )}

          {upcoming.length === 0 && past.length === 0 && (
            <div className="flex flex-col items-center pt-8 text-blue-light/40 gap-2">
              <span className="text-4xl">📅</span>
              <p className="text-sm">{isAr ? "لا توجد فعاليات خاصة حالياً" : "No special events yet"}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EventCard({ event, isAr }: { event: SpecialEvent; isAr: boolean }) {
  const title = isAr ? event.titleAr : event.title;
  const desc = isAr ? event.descriptionAr : event.description;
  const date = new Date(event.date).toLocaleDateString(isAr ? "ar-EG" : "en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/5 p-4 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <span className="text-2xl mt-0.5">✨</span>
        <div className="flex-1">
          <p className="font-bold text-white">{title}</p>
          <p className="text-xs text-blue-light/60 mt-0.5">{date} · {event.time}</p>
          {desc && <p className="text-sm text-blue-light/80 mt-1">{desc}</p>}
        </div>
      </div>
    </div>
  );
}
