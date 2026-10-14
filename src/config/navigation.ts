import type { FeatureKey } from "./features";
import type { IconName } from "@/components/Icon";

/**
 * Central navigation configuration.
 *
 * `key` is the next-intl translation key inside the namespace the rendering
 * component uses (`nav`, `more`, `bible`), so labels keep coming from
 * `messages/{locale}.json` while the structure lives here.
 */
export interface NavItem {
  /** Translation key, e.g. `events` → `nav.events`, `gallery` → `more.gallery`. */
  key: string;
  /** Path relative to the locale root: "/" or "/more/gallery". */
  href: string;
  /** Named icon rendered by the shared SVG icon system. */
  icon: IconName;
  /** Feature gate — the item is hidden when the feature is disabled. */
  feature?: FeatureKey;
}

/** Bottom navigation tabs. */
export const bottomNavTabs: NavItem[] = [
  { key: "home", href: "/", icon: "home" },
  { key: "events", href: "/events", icon: "calendar", feature: "events" },
  { key: "bible", href: "/bible", icon: "book", feature: "bible" },
  { key: "games", href: "/games", icon: "play", feature: "games" },
  { key: "more", href: "/more", icon: "menu" },
];

/** Home page quick-access grid — the bottom tabs minus "home". */
export const homeQuickLinks: NavItem[] = bottomNavTabs.filter(
  (t) => t.key !== "home"
);

/** Items listed on the "More" page (keys from the `more` namespace). */
export const moreMenuItems: NavItem[] = [
  { key: "about", href: "/more/about", icon: "user", feature: "about" },
  { key: "gallery", href: "/more/gallery", icon: "sparkles", feature: "gallery" },
  { key: "servants", href: "/more/servants", icon: "user", feature: "servants" },
  { key: "prayerWall", href: "/more/prayer-wall", icon: "book", feature: "prayerWall" },
  { key: "contact", href: "/more/contact", icon: "mail", feature: "contact" },
];

/** Sections listed on the "Bible" page (keys from the `bible` namespace). */
export const bibleSections: NavItem[] = [
  { key: "search", href: "/bible/search", icon: "search", feature: "bible" },
  { key: "verseOfWeek", href: "/bible/verse", icon: "sparkles", feature: "bible" },
  { key: "studies", href: "/bible/studies", icon: "book", feature: "bible" },
  { key: "resources", href: "/bible/resources", icon: "book", feature: "bible" },
];
