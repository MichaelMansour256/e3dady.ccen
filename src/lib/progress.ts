export type ProgressState = {
  xp: number;
  streak: number;
  lastActivity: string | null;
  rsvpDate: string | null;
};

const KEY = "e3dady-progress";
const initial: ProgressState = { xp: 0, streak: 0, lastActivity: null, rsvpDate: null };

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function getProgress(): ProgressState {
  if (typeof window === "undefined") return initial;
  try {
    return { ...initial, ...JSON.parse(window.localStorage.getItem(KEY) ?? "{}") };
  } catch {
    return initial;
  }
}

export function saveProgress(next: ProgressState) {
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("e3dady-progress"));
}

export function recordActivity(xp: number): ProgressState {
  const current = getProgress();
  const today = todayKey();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const next = {
    ...current,
    xp: current.xp + xp,
    streak: current.lastActivity === today ? current.streak : current.lastActivity === yesterday ? current.streak + 1 : 1,
    lastActivity: today,
  };
  saveProgress(next);
  return next;
}

export function setRsvp(date: string): ProgressState {
  const next = { ...getProgress(), rsvpDate: date };
  saveProgress(next);
  return recordActivity(10);
}

export function progressLevel(xp: number) {
  return Math.floor(xp / 100) + 1;
}

export function progressInLevel(xp: number) {
  return xp % 100;
}
