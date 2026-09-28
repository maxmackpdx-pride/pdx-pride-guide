import type Database from 'better-sqlite3';
import { isHawksLockerSpecial, withHawksLockerSpecial } from './hawksLockerSpecial';

export const HAWKS_LOCKER_MIGRATION = 'hawks_locker_special_is_venue_offer_20260928_v1';

export function correctHawksLockerSpecial(sqlite: Database.Database, now = new Date()) {
  return sqlite.transaction(() => {
    if (sqlite.prepare('SELECT 1 FROM boot_migrations WHERE id = ?').get(HAWKS_LOCKER_MIGRATION)) return { hidden: 0, updated: 0 };
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
    const rows = sqlite.prepare("SELECT id, title, description, date_start, status FROM events WHERE lower(trim(venue_name)) IN ('hawks pdx', 'hawks')").all() as Array<{id: number; title: string; description: string | null; date_start: string; status: string}>;
    // Retain rows and references for recovery, but remove the offer from public events.
    const hide = sqlite.prepare("UPDATE events SET status='HIDDEN', is_claimable=0, updated_at=? WHERE id=?");
    const update = sqlite.prepare('UPDATE events SET description=?, updated_at=? WHERE id=?');
    let hidden = 0, updated = 0;
    for (const row of rows) {
      if (isHawksLockerSpecial(row.title)) {
        hidden += hide.run(now.toISOString(), row.id).changes;
      } else if (row.date_start.slice(0, 10) >= today && ['LIVE', 'HIDDEN'].includes(row.status)) {
        const description = withHawksLockerSpecial(row.description || '');
        if (description !== row.description) updated += update.run(description, now.toISOString(), row.id).changes;
      }
    }
    sqlite.prepare('INSERT INTO boot_migrations (id, applied_at) VALUES (?, ?)').run(HAWKS_LOCKER_MIGRATION, now.toISOString());
    console.info(`[boot] ${HAWKS_LOCKER_MIGRATION}: hidden ${hidden} standalone offers; updated ${updated} event descriptions`);
    return { hidden, updated };
  })();
}
