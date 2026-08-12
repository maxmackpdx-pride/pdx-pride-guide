/**
 * Board icons, from the Zaylist icon system.
 *
 * Geometry is copied verbatim from the 32 icon set in the Foundation Library at
 * `public/design-system/assets/icons/`, which ships each icon on a 24 unit grid
 * with a 2.2 stroke and round caps and joins. The source files hardcode a stroke
 * colour; here it is `currentColor` so an icon takes the accent of the board it
 * sits in, which is the whole point of a one colour per board index.
 *
 * Icons are inlined rather than fetched: the index renders ten at once, and ten
 * network requests for 300 bytes each is worse than the bytes.
 *
 * Source file names are named per entry so an icon can be traced back and
 * re-synced if the set changes.
 */

const PATHS: Record<string, { src: string; d: React.ReactNode }> = {
  // 03-events
  happening: {
    src: "03-events",
    d: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </>
    ),
  },
  // 01-community
  spaces: {
    src: "01-community",
    d: (
      <>
        <path d="M10 8.6c-1.1-2.4-4.6-2.1-4.6.9 0 2 2.4 3.7 4.6 5.5 2.2-1.8 4.6-3.5 4.6-5.5 0-3-3.5-3.3-4.6-.9Z" />
        <path d="M17.2 12.2c-.9-1.9-3.7-1.7-3.7.7 0 1.6 1.9 3 3.7 4.4 1.8-1.4 3.7-2.8 3.7-4.4 0-2.4-2.8-2.6-3.7-.7Z" />
      </>
    ),
  },
  // 13-venue
  directory: {
    src: "13-venue",
    d: (
      <>
        <path d="M21 10c0 6-9 12-9 12S3 16 3 10a9 9 0 0 1 18 0Z" />
        <circle cx="12" cy="10" r="3" />
      </>
    ),
  },
  // 23-gigs
  gigz: {
    src: "23-gigs",
    d: (
      <>
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </>
    ),
  },
  // 20-boards
  market: {
    src: "20-boards",
    d: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </>
    ),
  },
  // 18-home
  hauz: {
    src: "18-home",
    d: (
      <>
        <path d="m3 10.5 9-7 9 7" />
        <path d="M5 9v11h14V9" />
        <path d="M10 20v-6h4v6" />
      </>
    ),
  },
  // 22-gifting
  gifz: {
    src: "22-gifting",
    d: (
      <>
        <rect x="3" y="8" width="18" height="4" rx="1" />
        <path d="M5 12v9h14v-9M12 8v13" />
        <path d="M12 8C12 5 10 3 7.5 4S8 8 12 8ZM12 8c0-3 2-5 4.5-4S16 8 12 8Z" />
      </>
    ),
  },
  // 19-navigate
  out: {
    src: "19-navigate",
    d: <path d="M22 2 15 22l-4-9-9-4Z" />,
  },
  "out/nudest": {
    src: "19-navigate",
    d: <path d="M22 2 15 22l-4-9-9-4Z" />,
  },
  // 24-missed-connection. The source fills both pupils with the board colour;
  // currentColor keeps that behaviour while following the accent.
  mizzed: {
    src: "24-missed-connection",
    d: (
      <>
        <ellipse cx="8" cy="12" rx="4" ry="5" />
        <circle cx="8.8" cy="12.3" r="1.7" fill="currentColor" stroke="none" />
        <ellipse cx="16" cy="12" rx="4" ry="5" />
        <circle cx="16.8" cy="12.3" r="1.7" fill="currentColor" stroke="none" />
      </>
    ),
  },
};

export default function ZBoardIcon({ path, size = 18 }: { path: string; size?: number }) {
  const icon = PATHS[path];
  if (!icon) return null;
  return (
    <svg
      className="z-index__icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      data-icon-source={icon.src}
    >
      {icon.d}
    </svg>
  );
}
