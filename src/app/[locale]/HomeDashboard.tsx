"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import AdminLogo from "@/components/AdminLogo";
import { Icon } from "@/components/Icon";
import ConfettiBurst from "@/components/ConfettiBurst";
import { meetingConfig, siteConfig } from "@/config";
import { useNextMeeting } from "@/hooks/useNextMeeting";
import { getProgress, localDateKey, progressInLevel, progressLevel, recordActivity, setRsvp, type ProgressState } from "@/lib/progress";

type Verse = { text: string; bookName: string; chapter: number; verse: number } | null;

function greetingKey() {
  const hour = new Date().getHours();
  return hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
}

/** Convert Arabic numerals to Arabic-Indic (Hindi) digits ٠١٢٣٤٥٦٧٨٩. */
function toHindiDigits(n: number) {
  return String(n).replace(/\d/g, (d) => String.fromCharCode(0x0660 + Number(d)));
}

export default function HomeDashboard() {
  const locale = useLocale();
  const t = useTranslations("home");
  const isAr = locale === "ar";
  const { countdown, nextDate } = useNextMeeting();
  const [verse, setVerse] = useState<Verse>(null);
  const [progress, setProgress] = useState<ProgressState>(() => ({
    version: 2, xp: 0, streak: 0, lastActivity: null, rsvpDate: null, rewardedActivities: {},
  }));
  const [progressHydrated, setProgressHydrated] = useState(false);
  const [confetti, setConfetti] = useState(0);

  const meetingKey = nextDate ? localDateKey(nextDate) : "";
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setProgress(getProgress());
      setProgressHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    fetch("/api/verse").then((response) => response.json()).then((data: Verse) => {
      setVerse(data);
    }).catch(() => undefined);
  }, []);
  useEffect(() => {
    if (!progressHydrated || !verse?.text) return;
    queueMicrotask(() => setProgress(recordActivity(5)));
  }, [progressHydrated, verse]);
  const rsvped = meetingKey ? progress.rsvpDate === meetingKey : false;

  const dateLabel = useMemo(() => nextDate?.toLocaleDateString(isAr ? "ar-EG" : "en-US", {
    weekday: "long", month: "long", day: "numeric",
  }), [isAr, nextDate]);
  const timeLabel = isAr ? meetingConfig.schedule.timeLabelAr : meetingConfig.schedule.timeLabelEn;

  function rsvp() {
    if (!meetingKey) return;
    setProgress(setRsvp(meetingKey));
    setConfetti((value) => value + 1);
  }

  async function shareVerse() {
    if (!verse) return;
    const canvas = document.createElement("canvas");
    canvas.width = 1080; canvas.height = 1350;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.fillStyle = "#FADADD"; context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#12206B"; context.textAlign = "center";

    // Draw the e3dady logo at the top of the generated verse image.
    const logo = new Image();
    logo.src = "/e3dady-logo-vector.svg";
    await new Promise<void>((resolve) => {
      logo.onload = () => resolve();
      logo.onerror = () => resolve();
    });
    const logoSize = 560;
    context.drawImage(logo, (canvas.width - logoSize) / 2, 30, logoSize, logoSize);

    // "e3dady" word below the logo (English — left-to-right).
    context.font = "700 48px Cairo";
    context.direction = "ltr";
    context.fillText("E3dady", 540, 600);

    // Arabic verse text — RTL direction fixes punctuation placement.
    context.font = "500 42px Cairo";
    context.direction = "rtl";
    const words = verse.text.split(" ");
    let line = ""; let y = 690;
    for (const word of words) {
      const next = `${line} ${word}`.trim();
      if (context.measureText(next).width > 850) { context.fillText(line, 540, y); y += 70; line = word; }
      else line = next;
    }
    context.fillText(line, 540, y);
    context.font = "700 34px Cairo";
    context.fillText(
      `${verse.bookName} ${toHindiDigits(verse.chapter)}: ${toHindiDigits(verse.verse)}`,
      540,
      1150,
    );
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) return;
    const file = new File([blob], "e3dady-verse.png", { type: "image/png" });
    if (navigator.share && navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: t("verseTitle") });
    else {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a"); link.href = url; link.download = file.name; link.click(); URL.revokeObjectURL(url);
    }
  }

  return (
    <div className="app-shell min-h-dvh bg-cream px-4 pb-6 text-navy">
      <ConfettiBurst trigger={confetti} />
      <header className="flex items-center justify-between gap-3 px-1 pb-4 pt-7">
        <div className="flex items-center gap-3">
          <AdminLogo src={siteConfig.assets.logo} alt={siteConfig.shortName} shortName={siteConfig.shortName} />
          <div>
            <p className="text-xs font-bold text-navy/60">{t("meetingName")}</p>
            <h1 className="text-2xl font-black">{t(greetingKey())}</h1>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-yellow px-3 py-2 text-xs font-bold">
          <Icon name="flame" size={16} /> {t("streak", { count: progress.streak })}
        </div>
      </header>

      <section className="rounded-[28px] bg-navy p-5 text-white shadow-xl shadow-navy/20">
        <p className="text-sm font-bold text-white/70">{t("nextMeeting")}</p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <div><h2 className="text-2xl font-black">{dateLabel}</h2><p className="text-sm text-white/70">{timeLabel}</p></div>
          <Icon name="calendar" size={32} className="text-yellow" />
        </div>
        <div className="mt-5 grid grid-cols-4 gap-2" aria-live="off" aria-label={`${t("nextMeeting")}: ${dateLabel} ${timeLabel}`}>
          {[["days", countdown.days], ["hours", countdown.hours], ["minutes", countdown.minutes], ["seconds", countdown.seconds]].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-navy-2 p-2 text-center">
              <strong className="block text-2xl font-black text-yellow">{String(value).padStart(2, "0")}</strong>
              <span className="text-[11px] text-white/70">{label === "days" ? (isAr ? "يوم" : "Days") : label === "hours" ? (isAr ? "ساعة" : "Hours") : label === "minutes" ? (isAr ? "دقيقة" : "Mins") : (isAr ? "ثانية" : "Secs")}</span>
            </div>
          ))}
        </div>
        <button onClick={rsvp} disabled={rsvped} className={`focus-ring pressable mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl font-black ${rsvped ? "bg-success text-navy" : "bg-coral text-navy"}`}>
          {rsvped ? <Icon name="check" /> : null}{rsvped ? t("rsvpDone") : t("arriving")}
        </button>
      </section>

      {verse && <section className="mt-4 rounded-[28px] bg-pink p-5">
        <div className="flex items-center justify-between"><h2 className="text-lg font-black">{t("verseTitle")}</h2><Icon name="sparkles" /></div>
        <p className="mt-4 text-lg font-bold leading-loose">{verse.text}</p>
        <div className="mt-3 flex items-center justify-between gap-3 text-sm font-bold text-navy/65">
          <span>{verse.bookName} {toHindiDigits(verse.chapter)}: {toHindiDigits(verse.verse)}</span>
          <button onClick={shareVerse} className="focus-ring pressable flex min-h-11 items-center gap-2 rounded-xl bg-white/70 px-3"><Icon name="share" size={18} /> {t("shareVerse")}</button>
        </div>
      </section>}

      <section className="mt-4 rounded-[28px] bg-sky p-5">
        <div className="flex items-start justify-between"><div><h2 className="text-xl font-black">{t("arenaTitle")}</h2><p className="mt-1 text-sm text-navy/70">{t("arenaSubtitle")}</p></div><Icon name="play" size={30} /></div>
        <div className="mt-4 flex items-center justify-between text-sm font-bold"><span>{t("level", { level: progressLevel(progress.xp) })}</span><span>{t("xp", { current: progressInLevel(progress.xp) })}</span></div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/70"><div className="h-full rounded-full bg-navy" style={{ width: `${progressInLevel(progress.xp)}%` }} /></div>
        <Link href={`/${locale}/games`} className="focus-ring pressable mt-4 flex min-h-12 items-center justify-center rounded-2xl bg-navy font-black text-white">{t("playNow")}</Link>
      </section>
      <div className="flex justify-center pt-5"><Link href={`/${locale === "ar" ? "en" : "ar"}`} className="focus-ring rounded-full px-3 py-2 text-sm font-bold text-navy/60">{t("language")}</Link></div>
    </div>
  );
}
