"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import PageHeader from "@/components/PageHeader";
import { Icon } from "@/components/Icon";
import Slideshow from "@/components/Slideshow";

type Photo = { id: string; url: string; width: number; height: number };
type Event = { name: string; path: string; photos: Photo[] };

export default function GalleryPage() {
  const t = useTranslations("gallery");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeEvent, setActiveEvent] = useState<string | null>(null); // null = all
  const [slideshow, setSlideshow] = useState<{ photos: Photo[]; index: number } | null>(null);

  useEffect(() => {
    fetch("/api/gallery")
      .then((r) => r.json())
      .then((data) => { setEvents(data); setLoading(false); });
  }, []);

  const allPhotos = events.flatMap((e) => e.photos);
  const displayedPhotos =
    activeEvent === null
      ? allPhotos
      : events.find((e) => e.path === activeEvent)?.photos ?? [];

  return (
    <div className="min-h-dvh page-gradient">
      <PageHeader title={t("title")} icon="share" />

      {/* Event filter tabs */}
      <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none">
        <button
          onClick={() => setActiveEvent(null)}
          className={`focus-ring shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
            activeEvent === null ? "bg-coral text-navy" : "border border-navy/10 bg-white text-navy/70 shadow-sm"
          }`}>
          {t("all")}
        </button>
        {events.map((e) => (
          <button key={e.path} onClick={() => setActiveEvent(e.path)}
            className={`focus-ring shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              activeEvent === e.path ? "bg-coral text-navy" : "border border-navy/10 bg-white text-navy/70 shadow-sm"
            }`}>
            {e.name}
          </button>
        ))}
      </div>

      {/* Slideshow all button */}
      {displayedPhotos.length > 0 && (
        <div className="px-4 pb-2">
          <button
            onClick={() => setSlideshow({ photos: displayedPhotos, index: 0 })}
            className="focus-ring pressable flex items-center gap-2 rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white">
            <Icon name="play" size={16} /> {t("playSlideshow")} ({displayedPhotos.length} {t("photos")})
          </button>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center pt-20 text-navy/60">{t("loading")}</div>
      ) : displayedPhotos.length === 0 ? (
        <div className="flex flex-col items-center pt-20 text-navy/50 gap-2">
          <Icon name="sparkles" size={44} className="text-coral" />
          <p className="text-sm">{t("empty")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-0.5 px-0.5">
          {displayedPhotos.map((photo, i) => (
            <button key={photo.id} onClick={() => setSlideshow({ photos: displayedPhotos, index: i })}
              className="relative aspect-square overflow-hidden bg-navy/5">
              <Image src={photo.url} alt="" fill className="object-cover transition hover:scale-105" sizes="33vw" />
            </button>
          ))}
        </div>
      )}

      {/* Slideshow overlay */}
      {slideshow && (
        <Slideshow
          photos={slideshow.photos}
          startIndex={slideshow.index}
          onClose={() => setSlideshow(null)}
        />
      )}
    </div>
  );
}
