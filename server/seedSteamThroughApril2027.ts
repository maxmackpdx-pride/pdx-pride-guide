import type Database from "better-sqlite3";
import { steamThroughApril2027, STEAM_SOURCE } from "./steamThroughApril2027";

export const STEAM_APRIL_MIGRATION = "steam_recurring_through_april_2027_v1";
export function seedSteamThroughApril2027(sqlite: Database.Database, now = new Date()) {
  return sqlite.transaction(() => {
    if (sqlite.prepare("SELECT 1 FROM boot_migrations WHERE id = ?").get(STEAM_APRIL_MIGRATION)) return 0;
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
    const existing = sqlite.prepare("SELECT title, date_start FROM events WHERE lower(venue_name) IN ('steam portland', 'steam')").all() as Array<{title: string; date_start: string}>;
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "").replace(/portland$/, "");
    const keys = new Set(existing.map(e => `${norm(e.title)}|${e.date_start.slice(0, 10)}`));
    const insert = sqlite.prepare(`INSERT INTO events (
      title, description, venue_name, address, lat, lng, date_start, date_end,
      day_of_week, age_requirement, event_types, admission, ticket_url,
      is_public, is_private, is_house_party, is_sex_positive, nudity_ok,
      poster_image_url, status, source, is_claimable, claimed_by, submitted_by,
      admin_notes, created_at, updated_at
    ) VALUES (@title, @description, 'Steam Portland', '2885 NE Sandy Blvd, Portland, OR 97232',
      45.529740871515, -122.635809981186, @dateStart, @dateEnd, @dayOfWeek,
      '18_PLUS', '[]', 'DOOR_FEE', @source, 1, 0, 0, 1, 1, @posterImageUrl,
      'LIVE', 'admin_seeded', 1, NULL, NULL, @notes, @now, @now)`);
    let added = 0;
    for (const event of steamThroughApril2027()) {
      const key = `${norm(event.title)}|${event.dateStart.slice(0, 10)}`;
      if (event.dateStart.slice(0, 10) < today || keys.has(key)) continue;
      added += insert.run({ ...event, source: STEAM_SOURCE,
        notes: `Tucker supplied recurring flyers 2026-09-28; expanded through 2027-04-30. November Sin City exception confirmed by Tucker. Source: ${STEAM_SOURCE}`,
        now: now.toISOString() }).changes;
      keys.add(key);
    }
    sqlite.prepare("INSERT INTO boot_migrations (id, applied_at) VALUES (?, ?)").run(STEAM_APRIL_MIGRATION, now.toISOString());
    console.info(`[boot] ${STEAM_APRIL_MIGRATION}: added ${added} unclaimed Steam occurrences`);
    return added;
  })();
}
