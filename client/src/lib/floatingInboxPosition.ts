const STORAGE_KEY = "pdx-floating-inbox-bottom";
const MIN_BOTTOM_PX = 24;
const DEFAULT_BOTTOM_PERCENT = 30;
const FAB_SIZE_PX = 60;

export function defaultFloatingInboxBottom(viewportHeight = window.innerHeight): number {
  return Math.round(viewportHeight * (DEFAULT_BOTTOM_PERCENT / 100));
}

export function maxFloatingInboxBottom(viewportHeight = window.innerHeight): number {
  return Math.max(MIN_BOTTOM_PX, viewportHeight - FAB_SIZE_PX - 96);
}

export function clampFloatingInboxBottom(
  value: number,
  viewportHeight = window.innerHeight,
): number {
  return Math.min(maxFloatingInboxBottom(viewportHeight), Math.max(MIN_BOTTOM_PX, Math.round(value)));
}

export function readFloatingInboxBottom(viewportHeight = window.innerHeight): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null) return clampFloatingInboxBottom(defaultFloatingInboxBottom(viewportHeight), viewportHeight);
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      return clampFloatingInboxBottom(defaultFloatingInboxBottom(viewportHeight), viewportHeight);
    }
    return clampFloatingInboxBottom(parsed, viewportHeight);
  } catch {
    return clampFloatingInboxBottom(defaultFloatingInboxBottom(viewportHeight), viewportHeight);
  }
}

export function writeFloatingInboxBottom(value: number, viewportHeight = window.innerHeight): number {
  const clamped = clampFloatingInboxBottom(value, viewportHeight);
  try {
    localStorage.setItem(STORAGE_KEY, String(clamped));
  } catch {
    // Ignore quota / private-mode failures.
  }
  return clamped;
}