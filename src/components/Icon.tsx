type IconName =
  | "home"
  | "calendar"
  | "play"
  | "book"
  | "user"
  | "mail"
  | "flame"
  | "clock"
  | "arrow"
  | "share"
  | "check"
  | "sparkles"
  | "menu"
  | "x"
  | "camera"
  | "search"
  | "pause"
  | "refresh"
  | "download"
  | "printer";

const paths: Record<IconName, React.ReactNode> = {
  home: <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  calendar: <><rect x="3" y="4" width="18" height="17" rx="3" /><path d="M16 2v4M8 2v4M3 9h18" /></>,
  play: <path d="m8 5 11 7-11 7z" />,
  book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22z" /><path d="M4 5.5v14A2.5 2.5 0 0 1 6.5 17H20" /></>,
  user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 21a7 7 0 0 1 14 0" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></>,
  flame: <path d="M12 22c4.4 0 7-2.8 7-6.7 0-3.2-2-5.1-4.2-7.3.1 2.3-1 3.5-2.2 4.2.2-3.6-1.8-6.1-4.2-8.2.2 3.7-3.4 5.7-3.4 10.2C5 18.9 7.6 22 12 22Z" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  share: <><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8.2 10.8 7.6-4.6m-7.6 7 7.6 4.6" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  sparkles: <><path d="m12 3 1.4 4.6L18 9l-4.6 1.4L12 15l-1.4-4.6L6 9l4.6-1.4z" /><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7z" /></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  x: <path d="m6 6 12 12M18 6 6 18" />,
  camera: <><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
  pause: <><path d="M8 5v14M16 5v14" /></>,
  refresh: <path d="M20 11a8 8 0 0 0-14.8-4L3 10m0 0V4m0 6h6M4 13a8 8 0 0 0 14.8 4L21 14m0 0v6m0-6h-6" />,
  download: <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 20h16" />,
  printer: <><path d="M6 9V3h12v6M6 17H4a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-2" /><path d="M6 14h12v7H6z" /></>,
};

export function Icon({ name, size = 22, strokeWidth = 2, className = "" }: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size}
      fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      {paths[name]}
    </svg>
  );
}

export type { IconName };
