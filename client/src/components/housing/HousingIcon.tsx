/**
 * HAUSING line icons. 24px grid, 2.2 stroke, round caps and joins, currentColor.
 *
 * Ported from docs/design-handoff-hausing/haus-ui.jsx, which shipped these as raw
 * strings through dangerouslySetInnerHTML. Here they are real JSX so the set is
 * typed and cannot inject markup.
 */
import type { ReactNode } from "react";

export type HousingIconName =
  | "message"
  | "share"
  | "favorite"
  | "home"
  | "events"
  | "venue"
  | "verified"
  | "community"
  | "connection"
  | "add"
  | "search"
  | "boards"
  | "safety"
  | "navigate"
  | "close"
  | "profile"
  | "alerts"
  | "paw";

const PATHS: Record<HousingIconName, ReactNode> = {
  message: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  share: (
    <>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 4M15.4 6.5 8.6 10.5" />
    </>
  ),
  favorite: <path d="M12 21s-7-4.5-9.5-9C.8 8.3 3 4 7 4c2.2 0 3.8 1.3 5 3 1.2-1.7 2.8-3 5-3 4 0 6.2 4.3 4.5 8 -2.5 4.5-9.5 9-9.5 9Z" />,
  home: (
    <>
      <path d="m3 10.5 9-7 9 7" />
      <path d="M5 9v11h14V9" />
      <path d="M10 20v-6h4v6" />
    </>
  ),
  events: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  venue: (
    <>
      <path d="M21 10c0 6-9 12-9 12S3 16 3 10a9 9 0 0 1 18 0Z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  verified: (
    <>
      <path d="M4 5h16v6c0 6-8 9-8 9s-8-3-8-9Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  community: (
    <>
      <path d="M10 8.6c-1.1-2.4-4.6-2.1-4.6.9 0 2 2.4 3.7 4.6 5.5 2.2-1.8 4.6-3.5 4.6-5.5 0-3-3.5-3.3-4.6-.9Z" />
      <path d="M17.2 12.2c-.9-1.9-3.7-1.7-3.7.7 0 1.6 1.9 3 3.7 4.4 1.8-1.4 3.7-2.8 3.7-4.4 0-2.4-2.8-2.6-3.7-.7Z" />
    </>
  ),
  connection: (
    <>
      <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.4" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.5-1.4" />
    </>
  ),
  add: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  boards: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </>
  ),
  safety: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  navigate: <path d="M22 2 15 22l-4-9-9-4Z" />,
  close: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </>
  ),
  alerts: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </>
  ),
  paw: (
    <>
      <path d="M12 13.5c-2.3 0-4.2 1.7-4.2 3.6 0 1.6 1.5 2.2 4.2 2.2s4.2-.6 4.2-2.2c0-1.9-1.9-3.6-4.2-3.6Z" />
      <ellipse cx="6.4" cy="11" rx="1.5" ry="1.9" />
      <ellipse cx="9.8" cy="8.2" rx="1.5" ry="1.9" />
      <ellipse cx="14.2" cy="8.2" rx="1.5" ry="1.9" />
      <ellipse cx="17.6" cy="11" rx="1.5" ry="1.9" />
    </>
  ),
};

export function HousingIcon({ name, size = 14 }: { name: HousingIconName; size?: number }) {
  return (
    <svg
      className="hz-ico"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}

export default HousingIcon;
