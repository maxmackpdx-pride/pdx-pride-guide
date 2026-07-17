/** Recently viewed directory places (client-only, localStorage). */

const STORAGE_KEY = "pdx-directory-recent-v1";
export const DIRECTORY_RECENT_MAX = 8;

export type DirectoryRecentEntry = {
  id: number;
  name: string;
  type: string;
  /** Resolved logo URL at view time (may be empty). */
  logoUrl?: string | null;
  viewedAt: number;
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function readDirectoryRecent(): DirectoryRecentEntry[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (e): e is DirectoryRecentEntry =>
          e &&
          typeof e === "object" &&
          typeof e.id === "number" &&
          Number.isFinite(e.id) &&
          typeof e.name === "string" &&
          e.name.length > 0,
      )
      .slice(0, DIRECTORY_RECENT_MAX);
  } catch {
    return [];
  }
}

/** Most-recent first; de-dupes by id; caps at DIRECTORY_RECENT_MAX. */
export function pushDirectoryRecent(entry: {
  id: number;
  name: string;
  type: string;
  logoUrl?: string | null;
}): DirectoryRecentEntry[] {
  if (!canUseStorage() || !Number.isFinite(entry.id) || entry.id <= 0) {
    return readDirectoryRecent();
  }
  const next: DirectoryRecentEntry = {
    id: entry.id,
    name: entry.name.trim() || `Place ${entry.id}`,
    type: entry.type || "venue",
    logoUrl: entry.logoUrl || null,
    viewedAt: Date.now(),
  };
  const prev = readDirectoryRecent().filter(e => e.id !== next.id);
  const list = [next, ...prev].slice(0, DIRECTORY_RECENT_MAX);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* quota / private mode */
  }
  return list;
}

export function clearDirectoryRecent() {
  if (!canUseStorage()) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
