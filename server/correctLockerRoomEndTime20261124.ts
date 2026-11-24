import type Database from "better-sqlite3";

// Founder-directed correction (Tucker, Nov 24, 2026): "The Locker Room"
// (event 824, Eagle Portland, Fri Nov 27, 2026) was stored with a blank
// end time; the series runs 21:00 -> 02:00 (September edition 802 and the
// January edition 2393 both carry it). Two save paths failed on this
// record for two different reasons: the paired event-research API refuses
// because dateEnd sits in lockedFields (the auto-lock recorded when a
// human edited the record on Nov 16), and the Admin UI save was rejected
// by validateEventDates, which compared the form's naive end string
// against the stored offset-bearing start with new Date() — the server's
// UTC clock made 2:00 AM look earlier than the 9:00 PM Pacific start.
// The validator is fixed in server/routes.ts to compare Pacific wall
// time; this one-shot migration delivers the value itself, in the same
// pattern as seedQCenterEventImages20261118. locked_fields is left
// untouched on purpose: the lock only guards agent/sync overwrites, and
// with the validator fixed the record accepts normal owner saves again.
export const LOCKER_ROOM_END_TIME_MIGRATION = "locker_room_824_end_time_2026_11_24_v1";

const TARGET_ID = 824;
const TARGET_TITLE = "The Locker Room";
const TARGET_VENUE = "Eagle Portland";
const TARGET_START = "2026-11-27T21:00";
// Stored in the record's own representation: its dateStart carries the
// Pacific offset ("2026-11-27T21:00:00-08:00"), as does edition 802's end.
const TARGET_END = "2026-11-28T02:00:00-08:00";

/** Fill event 824's blank end time with the series' 02:00 close, once. */
export function correctLockerRoomEndTime20261124(db: Database.Database, now = new Date()) {
  return db.transaction(() => {
    if (db.prepare("SELECT 1 FROM boot_migrations WHERE id = ?").get(LOCKER_ROOM_END_TIME_MIGRATION)) return 0;
    const row = db.prepare(
      "SELECT title, venue_name, date_start, status, date_end FROM events WHERE id = ?",
    ).get(TARGET_ID) as {
      title: string; venue_name: string; date_start: string; status: string;
      date_end: string | null;
    } | undefined;
    let changed = 0;
    if (row && row.title === TARGET_TITLE && row.venue_name === TARGET_VENUE &&
        String(row.date_start || "").slice(0, 16) === TARGET_START && row.status === "LIVE" &&
        !String(row.date_end || "").trim()) {
      changed = db.prepare("UPDATE events SET date_end = ?, updated_at = ? WHERE id = ?")
        .run(TARGET_END, now.toISOString(), TARGET_ID).changes;
    }
    db.prepare("INSERT INTO boot_migrations (id, applied_at) VALUES (?, ?)")
      .run(LOCKER_ROOM_END_TIME_MIGRATION, now.toISOString());
    if (changed) console.info(`[boot] ${LOCKER_ROOM_END_TIME_MIGRATION}: event ${TARGET_ID} dateEnd set to ${TARGET_END}`);
    return changed;
  })();
}
