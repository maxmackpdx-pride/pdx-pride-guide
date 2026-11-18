import type Database from "better-sqlite3";
import images from "./qCenterEventImages20261118.json";

// Exact occurrence images selected on Q Center's event pages, reviewed on Nov 17.
export const Q_CENTER_IMAGES_MIGRATION = "q_center_event_images_2026_11_18_v1";

/** Fill only matching, posterless QSearch records; preserve later human edits. */
export function seedQCenterEventImages20261118(db: Database.Database, now = new Date()) {
  return db.transaction(() => {
    if (db.prepare("SELECT 1 FROM boot_migrations WHERE id = ?").get(Q_CENTER_IMAGES_MIGRATION)) return 0;
    const select = db.prepare(`SELECT title, venue_name, date_start, status, source, poster_image_url,
      claimed_by, submitted_by, locked_fields FROM events WHERE id = ?`);
    const update = db.prepare("UPDATE events SET poster_image_url = ?, updated_at = ? WHERE id = ?");
    let changed = 0;
    for (const image of images) {
      const row = select.get(image.id) as {
        title: string; venue_name: string; date_start: string; status: string; source: string;
        poster_image_url: string | null; claimed_by: string | null; submitted_by: string | null;
        locked_fields: string | null;
      } | undefined;
      if (!row || row.title !== image.title || row.venue_name !== "Q Center" ||
          row.date_start.slice(0, 16) !== image.date.slice(0, 16) || row.status !== "LIVE" ||
          row.source !== "qsearch-3" || row.poster_image_url || row.claimed_by || row.submitted_by) continue;
      let locked: unknown;
      try { locked = JSON.parse(row.locked_fields || "[]"); } catch { continue; }
      if (!Array.isArray(locked) || locked.includes("posterImageUrl") || locked.includes("poster_image_url")) continue;
      changed += update.run(image.image, now.toISOString(), image.id).changes;
    }
    db.prepare("INSERT INTO boot_migrations (id, applied_at) VALUES (?, ?)")
      .run(Q_CENTER_IMAGES_MIGRATION, now.toISOString());
    return changed;
  })();
}
