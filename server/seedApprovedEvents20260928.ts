import type Database from "better-sqlite3";
import { approvedEvents20260928 } from "./approvedEvents20260928";

export const APPROVED_EVENTS_MIGRATION = "tucker_approved_events_2026_09_28_v1";

/** Owner-reviewed additions only; never modify an existing or claimed listing. */
export function seedApprovedEvents20260928(sqlite: Database.Database, now = new Date()) {
  return sqlite.transaction(() => {
    if (sqlite.prepare("SELECT 1 FROM boot_migrations WHERE id = ?").get(APPROVED_EVENTS_MIGRATION)) return 0;
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const existing = sqlite.prepare("SELECT title, venue_name, date_start, ticket_url FROM events").all() as Array<{ title: string; venue_name: string; date_start: string; ticket_url: string | null }>;
    const insert = sqlite.prepare(`INSERT INTO events (
      title, description, venue_name, address, neighborhood, lat, lng,
      date_start, date_end, day_of_week, age_requirement, event_types,
      admission, ticket_url, is_public, is_private, is_house_party,
      is_sex_positive, nudity_ok, poster_image_url, status, source,
      is_claimable, claimed_by, submitted_by, admin_notes, created_at, updated_at
    ) VALUES (
      @title, @description, @venueName, @address, @neighborhood, @lat, @lng,
      @dateStart, @dateEnd, @dayOfWeek, @ageRequirement, @eventTypes,
      @admission, @ticketUrl, @isPublic, @isPrivate, @isHouseParty,
      @isSexPositive, @nudityOk, @posterImageUrl, 'LIVE', 'admin_seeded',
      1, NULL, NULL, @adminNotes, @now, @now
    )`);
    let added = 0;
    for (const draft of approvedEvents20260928) {
      if (draft.dateStart.slice(0, 10) < today) continue;
      const duplicate = existing.some(row => row.date_start.slice(0, 10) === draft.dateStart.slice(0, 10) && (
        (norm(row.venue_name) === norm(draft.venueName) && (
          norm(row.title) === norm(draft.title) || row.date_start.slice(0, 16) === draft.dateStart.slice(0, 16)
        )) || (row.ticket_url === draft.sourceUrl && norm(row.title) === norm(draft.title))
      ));
      if (duplicate) continue;
      added += insert.run({
        ...draft,
        isPublic: Number(draft.isPublic), isPrivate: Number(draft.isPrivate),
        isHouseParty: Number(draft.isHouseParty), isSexPositive: Number(draft.isSexPositive),
        nudityOk: Number(draft.nudityOk),
        adminNotes: `Tucker approved 2026-09-28. Source: ${draft.sourceUrl}`,
        now: now.toISOString(),
      }).changes;
      existing.push({ title: draft.title, venue_name: draft.venueName, date_start: draft.dateStart, ticket_url: draft.ticketUrl });
    }
    sqlite.prepare("INSERT INTO boot_migrations (id, applied_at) VALUES (?, ?)").run(APPROVED_EVENTS_MIGRATION, now.toISOString());
    console.info(`[boot] ${APPROVED_EVENTS_MIGRATION}: added ${added} approved unclaimed events`);
    return added;
  })();
}
