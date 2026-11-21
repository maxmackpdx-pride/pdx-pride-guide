/**
 * Afterz hours. The map window is 9 PM to 6 AM Pacific, matching the
 * availability block in the Afterz map seed and afterzClosesAt (6 AM).
 * Hosts can prepare invites in advance. Private gathering locations belong
 * in the accepted guest room.
 */
import { pacificTodayDate, parsePacificDateTime } from "./missedConnections";

export const AFTERZ_WINDOW = {
  startLocal: "21:00",
  endLocal: "06:00",
  timeZone: "America/Los_Angeles",
} as const;

export const AFTERZ_VIBE_LABELS: Record<string, string> = {
  social: "Hang out",
  chill: "Chill / relax",
  party: "The party continues",
};

export function afterzVibeLabel(vibe: string | null | undefined): string {
  if (!vibe) return AFTERZ_VIBE_LABELS.social;
  return AFTERZ_VIBE_LABELS[vibe] || vibe;
}

/** 6 AM Pacific on the current Afterz night: today if it is still before 6 AM, otherwise tomorrow. */
export function afterzClosesAt(now: number): number {
  const today = pacificTodayDate(now);
  const todayClose = parsePacificDateTime(today + "T06:00:00")!;
  if (now < todayClose) return todayClose;
  const tomorrow = new Date(Date.parse(today + "T12:00:00Z") + 86_400_000)
    .toISOString()
    .slice(0, 10);
  return parsePacificDateTime(tomorrow + "T06:00:00")!;
}

function previousPacificDate(isoDate: string): string {
  return new Date(Date.parse(isoDate + "T12:00:00Z") - 86_400_000)
    .toISOString()
    .slice(0, 10);
}

/** 9 PM Pacific on the evening that leads into `closesAt`. */
export function afterzOpensAt(now: number): number {
  const closesAt = afterzClosesAt(now);
  const closeDay = pacificTodayDate(closesAt - 1);
  return parsePacificDateTime(previousPacificDate(closeDay) + "T21:00:00")!;
}

export type AfterzWindowState = {
  open: boolean;
  startLocal: typeof AFTERZ_WINDOW.startLocal;
  endLocal: typeof AFTERZ_WINDOW.endLocal;
  timeZone: typeof AFTERZ_WINDOW.timeZone;
  opensAt: number;
  closesAt: number;
};

export function afterzWindowState(now: number): AfterzWindowState {
  const closesAt = afterzClosesAt(now);
  const opensAt = afterzOpensAt(now);
  return {
    open: now >= opensAt && now < closesAt,
    startLocal: AFTERZ_WINDOW.startLocal,
    endLocal: AFTERZ_WINDOW.endLocal,
    timeZone: AFTERZ_WINDOW.timeZone,
    opensAt,
    closesAt,
  };
}

export function isAfterzWindowOpen(now: number): boolean {
  return afterzWindowState(now).open;
}
