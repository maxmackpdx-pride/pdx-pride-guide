import { sqlite } from "./storage";

/**
 * A heart follows a card (updates reach the user) and collects it: hearted cards are pinned
 * on the user's Stacks board. One row per user and card; the snapshot keeps the pin readable
 * even if the card later changes.
 */
export const HEART_KINDS = ["event", "place", "resource", "outz", "board"] as const;
export type HeartKind = (typeof HEART_KINDS)[number];

export type HeartSnapshot = { title: string; subtitle?: string | null; image?: string | null; href: string; accent?: string | null };
export type HeartRow = HeartSnapshot & { kind: HeartKind; ref: string; createdAt: string };

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS card_hearts (
    user_id INTEGER NOT NULL,
    kind TEXT NOT NULL,
    ref TEXT NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    image TEXT,
    href TEXT NOT NULL,
    accent TEXT,
    created_at TEXT NOT NULL,
    PRIMARY KEY (user_id, kind, ref)
  );
  CREATE INDEX IF NOT EXISTS idx_card_hearts_user ON card_hearts(user_id, created_at DESC);
`);

export const isHeartKind = (value: unknown): value is HeartKind => HEART_KINDS.includes(value as HeartKind);

/** Safe in-site link only: stored hearts are rendered as links on the profile. */
export const safeHeartHref = (href: unknown) => typeof href === "string" && /^\/(?!\/)[^\s]*$/.test(href) ? href.slice(0, 300) : null;

export function addHeart(userId: number, kind: HeartKind, ref: string, snapshot: HeartSnapshot): HeartRow {
  const createdAt = new Date().toISOString();
  sqlite.prepare(`
    INSERT INTO card_hearts (user_id, kind, ref, title, subtitle, image, href, accent, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, kind, ref) DO UPDATE SET title = excluded.title, subtitle = excluded.subtitle,
      image = excluded.image, href = excluded.href, accent = excluded.accent
  `).run(userId, kind, ref, snapshot.title.slice(0, 160), snapshot.subtitle?.slice(0, 160) ?? null, snapshot.image ?? null, snapshot.href, snapshot.accent ?? null, createdAt);
  return { ...snapshot, kind, ref, createdAt };
}

export function removeHeart(userId: number, kind: HeartKind, ref: string): void {
  sqlite.prepare("DELETE FROM card_hearts WHERE user_id = ? AND kind = ? AND ref = ?").run(userId, kind, ref);
}

export function hasHeart(userId: number, kind: HeartKind, ref: string): boolean {
  return Boolean(sqlite.prepare("SELECT 1 FROM card_hearts WHERE user_id = ? AND kind = ? AND ref = ?").get(userId, kind, ref));
}

export function listHearts(userId: number): HeartRow[] {
  return sqlite.prepare(`
    SELECT kind, ref, title, subtitle, image, href, accent, created_at AS createdAt
    FROM card_hearts WHERE user_id = ? ORDER BY created_at DESC LIMIT 300
  `).all(userId) as HeartRow[];
}
