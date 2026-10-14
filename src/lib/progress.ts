export type ProgressState = {
  version: 2;
  xp: number;
  streak: number;
  lastActivity: string | null;
  rsvpDate: string | null;
  rewardedActivities: Record<string, true>;
};

export type ActivityType = "daily-verse" | "rsvp" | "arena-round";

const KEY = "e3dady-progress";
const initial: ProgressState = {
  version: 2,
  xp: 0,
  streak: 0,
  lastActivity: null,
  rsvpDate: null,
  rewardedActivities: {},
};

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function readStored(): Partial<ProgressState> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function getProgress(): ProgressState {
  const stored = readStored();
  if (!stored) return { ...initial, rewardedActivities: {} };
  return {
    ...initial,
    ...stored,
    version: 2,
    xp: typeof stored.xp === "number" && Number.isFinite(stored.xp) && stored.xp >= 0 ? stored.xp : 0,
    streak: typeof stored.streak === "number" && Number.isFinite(stored.streak) && stored.streak >= 0 ? stored.streak : 0,
    rewardedActivities: stored.rewardedActivities && typeof stored.rewardedActivities === "object"
      ? stored.rewardedActivities
      : {},
  };
}

export function saveProgress(next: ProgressState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("e3dady-progress"));
  } catch {
    // Progress is optional and must never break the app when storage is blocked.
  }
}

function updateStreak(current: ProgressState, today: string) {
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = localDateKey(yesterdayDate);
  if (current.lastActivity === today) return current.streak;
  return current.lastActivity === yesterday ? current.streak + 1 : 1;
}

export function awardActivity(type: ActivityType, activityKey: string, xp: number): ProgressState {
  const current = getProgress();
  const key = `${type}:${activityKey}`;
  if (current.rewardedActivities[key]) return current;
  const today = localDateKey();
  const next: ProgressState = {
    ...current,
    xp: current.xp + Math.max(0, xp),
    streak: updateStreak(current, today),
    lastActivity: today,
    rewardedActivities: { ...current.rewardedActivities, [key]: true },
  };
  saveProgress(next);
  return next;
}

export function recordActivity(xp: number) {
  return awardActivity("daily-verse", localDateKey(), xp);
}

export function setRsvp(date: string) {
  const rewarded = awardActivity("rsvp", date, 10);
  if (rewarded.rsvpDate === date) return rewarded;
  const next = { ...rewarded, rsvpDate: date };
  saveProgress(next);
  return next;
}

export function progressLevel(xp: number) {
  return Math.floor(xp / 100) + 1;
}

export function progressInLevel(xp: number) {
  return xp % 100;
}
