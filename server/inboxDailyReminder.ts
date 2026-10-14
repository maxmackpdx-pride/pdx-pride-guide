import type Database from 'better-sqlite3';
import { pacificDayStart } from './inboxReportingTime';

/** One reminder per account and Pacific day; empty inboxes never consume the day. */
export function createInboxDailyReminder(db: Database.Database) {
  db.exec(`CREATE TABLE IF NOT EXISTS inbox_daily_reminder (
    user_id INTEGER PRIMARY KEY, day TEXT NOT NULL
  )`);
  const claim = db.prepare(`INSERT INTO inbox_daily_reminder(user_id,day) VALUES(?,?)
    ON CONFLICT(user_id) DO UPDATE SET day=excluded.day WHERE inbox_daily_reminder.day < excluded.day`);
  return (userId: number, adminCount: number, ownerCount: number, primaryOwner: boolean, now = new Date()) => {
    const day = pacificDayStart(now).toISOString();
    const admin = Math.max(0, Math.floor(adminCount));
    const owner = primaryOwner ? Math.max(0, Math.floor(ownerCount)) : 0;
    if (!(admin + owner > 0)) return { show: false, day, adminCount: 0, ownerCount: 0 };
    return { show: claim.run(userId, day).changes === 1, day, adminCount: admin, ownerCount: owner };
  };
}
