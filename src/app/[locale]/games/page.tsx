"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import PageHeader from "@/components/PageHeader";
import { Icon } from "@/components/Icon";
import ConfettiBurst from "@/components/ConfettiBurst";
import { awardActivity, getProgress } from "@/lib/progress";

const ARENA_ORIGIN = "https://verse-up-arena.vercel.app";
// The external game must explicitly send this contract; iframe lifecycle events
// are intentionally not treated as completion.
const ARENA_COMPLETION_TYPE = "verse-up-arena:round-completed";

export default function GamesPage() {
  const t = useTranslations("games");
  const [open, setOpen] = useState(false);
  const [confetti, setConfetti] = useState(0);
  const [iframeWindow, setIframeWindow] = useState<Window | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== ARENA_ORIGIN || event.source !== iframeWindow || !event.data || typeof event.data !== "object") return;
      const message = event.data as { type?: unknown; correct?: unknown; roundId?: unknown };
      if (message.type !== ARENA_COMPLETION_TYPE || message.correct !== true || typeof message.roundId !== "string" || !message.roundId.trim()) return;
      const before = getProgress();
      const after = awardActivity("arena-round", message.roundId, 25);
      if (after.xp !== before.xp) setConfetti((value) => value + 1);
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [iframeWindow, open]);

  if (open) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-navy">
        <ConfettiBurst trigger={confetti} />
        <div className="flex items-center gap-3 bg-blue-dark px-4 py-3 shrink-0">
          <button onClick={() => { setOpen(false); setIframeWindow(null); }} aria-label={t("back")} className="focus-ring flex h-11 w-11 items-center justify-center text-white/80"><Icon name="arrow" className="rotate-180" /></button>
          <span className="text-sm font-semibold text-white">Verse Up Arena</span>
        </div>
        <iframe
          src="https://verse-up-arena.vercel.app"
          className="flex-1 w-full border-none"
          allow="fullscreen"
          title="Verse Up Arena"
          ref={iframeRef}
          onLoad={() => setIframeWindow(iframeRef.current?.contentWindow ?? null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-dvh page-gradient">
      <PageHeader title={t("title")} icon="play" />

      <div className="flex flex-col items-center px-6 pt-8">
        <button onClick={() => setOpen(true)}
          className="w-full max-w-sm rounded-3xl border border-yellow-400/30 bg-blue-primary/40 p-6 text-center backdrop-blur-sm transition hover:bg-blue-mid/50 active:scale-95 shadow-xl shadow-yellow-400/10">
          <div className="relative mx-auto mb-4 h-48 w-48">
            <Image src="/verse-up-logo.png" alt="Verse Up Arena" fill className="object-contain drop-shadow-2xl" />
          </div>
          <p className="text-lg font-bold text-white">Verse Up Arena</p>
          <p className="mt-1 text-sm text-blue-light/60">
            {t("challenge")}
          </p>
          <span className="mt-4 inline-block rounded-full bg-yellow-400 px-6 py-2 text-sm font-bold text-blue-dark">
            {t("playNow")}
          </span>
        </button>
      </div>
    </div>
  );
}
