"use client";
import { useEffect, useState } from "react";

function getNextFriday(): Date {
  const now = new Date();
  const next = new Date(now);
  const day = now.getDay();
  const daysUntilFriday = (5 - day + 7) % 7;
  next.setDate(now.getDate() + (daysUntilFriday === 0 ? 0 : daysUntilFriday));
  next.setHours(12, 30, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 7);
  return next;
}

export function useNextMeeting() {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isToday: false });
  const [nextDate, setNextDate] = useState<Date | null>(null);

  useEffect(() => {
    const update = () => {
      const next = getNextFriday();
      setNextDate(next);
      const diff = next.getTime() - Date.now();
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setCountdown({ days, hours, minutes, seconds, isToday: days === 0 });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return { countdown, nextDate };
}
