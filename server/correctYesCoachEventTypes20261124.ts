import type Database from "better-sqlite3";

// Founder-directed correction (Tucker, Nov 24, 2026): his own event
// "Yes Coach: 3-Year Anniversary" (id 2022, Sanctuary Club, Nov 29) must
// carry the KINK event type. The paired event-research API refuses every
// change to this record (409 "claimed or human-submitted event requires
// review") and the admin edit form does not expose eventTypes, so a
// one-shot boot migration is the durable route — the same pattern as
// seedQCenterEventImages20261118. Scoped to exactly one record and one
// field, with the usual identity guards; it also skips the record if
// eventTypes ever becomes a locked field. Unlike the bulk fills, this
// intentionally applies to a claimed record: the claim is the founder's
// own and the founder directed the fix.
export const YES_COACH_EVENT_TYPES_MIGRATION = "yes_coach_2022_event_types_kink_2026_11_24_v1";

const TARGET_ID = 2022;
const TARGET_TITLE = "Yes Coach: 3-Year Anniversary";
const TARGET_VENUE = "Sanctuary Club";
const TARGET_START = "2026-11-29T18:00";
const TAG = "KINK";

/** Add KINK to event 2022's eventTypes once; preserve any types already set. */
export function correctYesCoachEventTypes20261124(db: Database.Database, now = new Date()) {
  return db.transaction(() => {
    if (db.prepare("SELECT 1 FROM boot_migrations WHERE id = ?").get(YES_COACH_EVENT_TYPES_MIGRATION)) return 0;
    const row = db.prepare(
      "SELECT title, venue_name, date_start, status, event_types, locked_fields FROM events WHERE id = ?",
    ).get(TARGET_ID) as {
      title: string; venue_name: string; date_start: string; status: string;
      event_types: string | null; locked_fields: string | null;
    } | undefined;
    let changed = 0;
    if (row && row.title === TARGET_TITLE && row.venue_name === TARGET_VENUE &&
        String(row.date_start || "").slice(0, 16) === TARGET_START && row.status === "LIVE") {
      let locked: unknown;
      try { locked = JSON.parse(row.locked_fields || "[]"); } catch { locked = null; }
      let types: unknown;
      try { types = JSON.parse(row.event_types || "[]"); } catch { types = null; }
      if (Array.isArray(locked) && !locked.includes("eventTypes") && !locked.includes("event_types") &&
          Array.isArray(types) && !types.includes(TAG)) {
        const next = JSON.stringify([...types.map(item => String(item)), TAG]);
        changed = db.prepare("UPDATE events SET event_types = ?, updated_at = ? WHERE id = ?")
          .run(next, now.toISOString(), TARGET_ID).changes;
      }
    }
    db.prepare("INSERT INTO boot_migrations (id, applied_at) VALUES (?, ?)")
      .run(YES_COACH_EVENT_TYPES_MIGRATION, now.toISOString());
    if (changed) console.info(`[boot] ${YES_COACH_EVENT_TYPES_MIGRATION}: event ${TARGET_ID} eventTypes now include ${TAG}`);
    return changed;
  })();
}
