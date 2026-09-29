import type Database from "better-sqlite3";
import corrections from "./posterAudit20260928.json";

export const POSTER_AUDIT_MIGRATION = "tucker_poster_audit_2026_09_28_v1";
const excludedVenue = /sanctuary|eagle|badlands|peacock|peakcock/i;
const isDefault = (value: string | null) => !value || /^\/placeholders\/event-day-[a-z]+\.svg$/.test(value);

/** Owner-requested poster audit. Update only the exact records and images reviewed. */
export function seedPosterAudit20260928(sqlite: Database.Database, now = new Date()) {
  return sqlite.transaction(() => {
    if (sqlite.prepare("SELECT 1 FROM boot_migrations WHERE id = ?").get(POSTER_AUDIT_MIGRATION)) return 0;
    const select = sqlite.prepare("SELECT id, title, venue_name, date_start, poster_image_url, claimed_by, locked_fields FROM events WHERE id = ?");
    const update = sqlite.prepare("UPDATE events SET poster_image_url = ?, updated_at = ? WHERE id = ?");
    let changed = 0;
    for (const correction of corrections) {
      const row = select.get(correction.id) as {
        id: number; title: string; venue_name: string; date_start: string;
        poster_image_url: string | null; claimed_by: string | null; locked_fields: string | null;
      } | undefined;
      if (!row || excludedVenue.test(row.venue_name) || row.claimed_by) continue;
      if (row.title !== correction.title || row.venue_name !== correction.venueName || row.date_start.slice(0, 10) !== correction.date) continue;
      let locked: unknown;
      try { locked = JSON.parse(row.locked_fields || "[]"); } catch { continue; }
      if (!Array.isArray(locked) || locked.includes("posterImageUrl") || locked.includes("poster_image_url")) continue;
      // The API supplies weekday artwork for NULL/empty posters. Treat only those
      // representations as equivalent; never overwrite an intervening real image.
      if (row.poster_image_url !== correction.previousPoster && !(isDefault(row.poster_image_url) && isDefault(correction.previousPoster))) continue;
      changed += update.run(correction.posterImageUrl, now.toISOString(), row.id).changes;
    }
    sqlite.prepare("INSERT INTO boot_migrations (id, applied_at) VALUES (?, ?)").run(POSTER_AUDIT_MIGRATION, now.toISOString());
    console.info(`[boot] ${POSTER_AUDIT_MIGRATION}: corrected ${changed}/${corrections.length} reviewed posters`);
    return changed;
  })();
}
