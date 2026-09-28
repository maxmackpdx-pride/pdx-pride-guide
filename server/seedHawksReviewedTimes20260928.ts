import { hawksReviewedTimes20260928 } from "./hawksReviewedTimes20260928";
import { correctHawksLockerSpecial } from './correctHawksLockerSpecial';
import type Database from "better-sqlite3";
import { hawksThroughApril2027, HAWKS_SOURCE } from "./hawksThroughApril2027";

export const HAWKS_REVIEWED_MIGRATION = "hawks_reviewed_246_times_2026_09_28_v1";
export function seedHawksReviewedTimes20260928(sqlite: Database.Database, now = new Date()) {
  const added = sqlite.transaction(() => {
    if (sqlite.prepare("SELECT 1 FROM boot_migrations WHERE id = ?").get(HAWKS_REVIEWED_MIGRATION)) return 0;
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
    const existing = sqlite.prepare("SELECT title, date_start FROM events WHERE lower(venue_name) IN ('hawks pdx', 'hawks')").all() as Array<{title: string; date_start: string}>;
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "").replace(/portland$/, "");
    const keys = new Set(existing.map(e => `${norm(e.title)}|${e.date_start.slice(0, 10)}`));
    const insert = sqlite.prepare(`INSERT INTO events (
      title, description, venue_name, address, lat, lng, date_start, date_end,
      day_of_week, age_requirement, event_types, admission, ticket_url,
      is_public, is_private, is_house_party, is_sex_positive, nudity_ok,
      poster_image_url, status, source, is_claimable, claimed_by, submitted_by,
      admin_notes, created_at, updated_at
    ) VALUES (@title, @description, 'Hawks PDX', '335 SE 99th Ave, Portland, OR 97216',
      45.520175147981, -122.562357520572, @dateStart, @dateEnd, @dayOfWeek,
      '18_PLUS', '[]', @admission, @source, 1, 0, 0, @sexPositive, @sexPositive, NULL,
      @status, 'admin_seeded', 1, NULL, NULL, @notes, @now, @now)`);
    let added = 0;
    for (const original of hawksThroughApril2027()) {
      const timing = hawksReviewedTimes20260928[original.title];
      if (original.dateStart.includes("T") || !timing) continue;
      const endDate = new Date(`${original.dateStart}T12:00:00Z`);
      endDate.setUTCDate(endDate.getUTCDate() + Number(timing.endDay));
      const event = { ...original, dateStart: `${original.dateStart}T${timing.startTime}`, dateEnd: `${endDate.toISOString().slice(0,10)}T${timing.endTime}`, description: original.description.replace(" Event time unconfirmed; contact Hawks before attending.", "") };
      const key = `${norm(event.title)}|${event.dateStart.slice(0, 10)}`;
      if (!event.dateStart.includes("T") || event.dateStart.slice(0, 10) < today || keys.has(key)) continue;
      added += insert.run({ ...event, source: HAWKS_SOURCE,
        status: event.dateStart.includes("T") ? "LIVE" : "HIDDEN",
        sexPositive: event.admission === "FREE" ? 0 : 1,
        notes: `Times explicitly approved by Tucker in review export 2026-09-28; default weekday posters requested. Expanded through 2027-04-30. Source: ${HAWKS_SOURCE}`,
        now: now.toISOString() }).changes;
      keys.add(key);
    }
    sqlite.prepare("INSERT INTO boot_migrations (id, applied_at) VALUES (?, ?)").run(HAWKS_REVIEWED_MIGRATION, now.toISOString());
    console.info(`[boot] ${HAWKS_REVIEWED_MIGRATION}: added ${added} unclaimed Hawks occurrences`);
    return added;
  })();
  // This correction must also run on installations where the original seed ran.
  correctHawksLockerSpecial(sqlite, now);
  return added;
}
