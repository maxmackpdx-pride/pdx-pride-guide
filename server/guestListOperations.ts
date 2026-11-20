import { randomBytes } from "node:crypto";
import type Database from "better-sqlite3";
import type { IStorage } from "./storage";
import type { ZaylistStore } from "./zaylist";
import type { Event } from "@shared/schema";
import { hasPublicEventFlags } from "@shared/publicEventVisibility";
import { pacificTodayDate, pacificCalendarDate, parsePacificDateTime } from "@shared/missedConnections";
import { sendGuestInvitation } from "./email";

export function internationalPhone(value: string) {
  if (!/^[+\d ().-]+$/.test(value)) return null;
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10 && !value.startsWith("+")) return `+1${digits}`;
  return /^[1-9]\d{7,14}$/.test(digits) && (value.startsWith("+") || digits.startsWith("1") && digits.length === 11)
    ? `+${digits}` : null;
}

type InviteDelivery = { entryId: number; contact: string; kind: "phone" | "email"; secret: string; attempts: number };
export function createGuestListOperations(db: Database.Database, store: ZaylistStore, storage: IStorage,
  visible: (event: Event) => boolean, allocator: (eventId: number, userId: number) => boolean,
  sendInvite = sendGuestInvitation) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS zaylist_draw_schedule_receipts (
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE, slot TEXT NOT NULL,
      draw_id INTEGER REFERENCES zaylist_draws(id), PRIMARY KEY(event_id,slot)
    );
    CREATE TABLE IF NOT EXISTS zaylist_invite_deliveries (
      entry_id INTEGER PRIMARY KEY REFERENCES zaylist_entries(id) ON DELETE CASCADE, secret TEXT NOT NULL UNIQUE,
      next_try INTEGER NOT NULL DEFAULT 0, attempts INTEGER NOT NULL DEFAULT 0, sent_at TEXT
    );
    CREATE TABLE IF NOT EXISTS zaylist_verified_phones (
      phone TEXT PRIMARY KEY, user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS zaylist_spot_notices (
      entry_id INTEGER PRIMARY KEY REFERENCES zaylist_entries(id) ON DELETE CASCADE
    );
  `);

  const available = (event: Event | undefined, now: number) =>
    event && event.status === "LIVE" && hasPublicEventFlags(event) && visible(event) &&
    (parsePacificDateTime(event.dateEnd || event.dateStart) ?? 0) >= now;

  function notifyEntry(entryId: number) {
    const entry = store.entry(entryId);
    if (!entry?.user_id || entry.user_id === entry.added_by || entry.state !== "pending") return;
    if (storage.isMemberInteractionBlocked(entry.user_id, entry.added_by)) return;
    const claimed = db.prepare("INSERT OR IGNORE INTO zaylist_spot_notices(entry_id) VALUES(?)").run(entry.id).changes;
    if (!claimed) return;
    const title = storage.getEvent(entry.event_id)?.title || "your event";
    storage.sendMessage(entry.added_by, entry.user_id, `A guest spot for ${title}`, "Your no-cover spot is ready. Accept, decline, or gift it from your Zay'list.", {
      threadId: `zaylist-entry-${entryId}`, contextType: "ZAYLIST_SPOT", contextId: entryId, contextLabel: title,
    });
  }
  function queueInvite(entryId: number) {
    db.prepare("INSERT OR IGNORE INTO zaylist_invite_deliveries(entry_id,secret) VALUES(?,?)").run(entryId, randomBytes(32).toString("base64url"));
  }
  function draw(eventId: number, by: number, count: number | null, now: number) {
    return db.transaction(() => {
      const result = store.runDraw(eventId, by, count, new Date(now).toISOString());
      if (result.ok) {
        const entries = db.prepare("SELECT id FROM zaylist_entries WHERE draw_id=?").all(result.drawId) as {id: number}[];
        entries.forEach(entry => notifyEntry(entry.id));
      }
      return result;
    })();
  }
  function dueDraws(now = Date.now()) {
    const today = pacificTodayDate(now);
    const configs = db.prepare("SELECT event_id AS id FROM zaylist_configs WHERE draw_days_before IS NOT NULL AND pool_size>0").all() as {id: number}[];
    for (const {id} of configs) {
      const event = storage.getEvent(id);
      const cfg = store.config(id);
      if (!event || !available(event, now) || !cfg?.updatedBy || cfg.drawDaysBefore == null || !allocator(id, cfg.updatedBy)) continue;
      if (!event.ticketUrl || event.admission === "FREE" || (parsePacificDateTime(event.dateStart) ?? 0) <= now) continue;
      const day = pacificCalendarDate(event.dateStart);
      if (!day || (Date.parse(day) - Date.parse(today)) / 86400000 > cfg.drawDaysBefore) continue;
      db.transaction(() => {
        const slot = cfg.dripPerDay ? today : "allocation";
        if (db.prepare("SELECT 1 FROM zaylist_draw_schedule_receipts WHERE event_id=? AND slot=?").get(id, slot)) return;
        const result = draw(id, cfg.updatedBy!, cfg.dripPerDay || null, now);
        if (!result.ok) return;
        db.prepare("INSERT INTO zaylist_draw_schedule_receipts VALUES(?,?,?)").run(id, slot, result.drawId);
      }).immediate();
    }
  }
  async function deliverInvites(now = Date.now()) {
    const rows = db.prepare(`SELECT d.entry_id AS entryId,d.secret,d.attempts,i.contact,i.contact_kind AS kind
      FROM zaylist_invite_deliveries d JOIN zaylist_invites i ON i.entry_id=d.entry_id
      JOIN zaylist_entries e ON e.id=d.entry_id WHERE d.sent_at IS NULL AND d.next_try<=? AND i.status='sent'
      AND e.user_id IS NULL AND e.state='pending' ORDER BY d.next_try,d.entry_id LIMIT 30`).all(now) as InviteDelivery[];
    for (const row of rows) {
      const entry = store.entry(row.entryId)!;
      if (!available(storage.getEvent(entry.event_id), now)) {
        db.prepare("UPDATE zaylist_invite_deliveries SET next_try=? WHERE entry_id=?").run(now + 86400000, row.entryId);
        continue;
      }
      const locked = db.prepare("UPDATE zaylist_invite_deliveries SET next_try=?,attempts=attempts+1 WHERE entry_id=? AND next_try<=? AND sent_at IS NULL")
        .run(now + 120000, row.entryId, now).changes;
      if (!locked) continue;
      let sent = false;
      try { sent = await sendInvite(row.kind, row.contact, row.secret, row.entryId); }
      catch { /* Retry using the same invitation. Never log the recipient or the link. */ }
      if (sent) db.prepare("UPDATE zaylist_invite_deliveries SET sent_at=CURRENT_TIMESTAMP WHERE entry_id=?").run(row.entryId);
      else db.prepare("UPDATE zaylist_invite_deliveries SET next_try=? WHERE entry_id=? AND sent_at IS NULL")
        .run(now + Math.min(6 * 3600000, 60000 * 2 ** Math.min(row.attempts, 8)), row.entryId);
    }
  }
  function claim(secret: string, user: { id: number; email: string }) {
    return db.transaction(() => {
      const invite = db.prepare(`SELECT i.id,i.contact,i.contact_kind AS kind,i.entry_id AS entryId,i.event_id AS eventId,i.status,i.claimed_by AS claimedBy
        FROM zaylist_invite_deliveries d JOIN zaylist_invites i ON i.entry_id=d.entry_id WHERE d.secret=?`).get(secret) as
        {id: number; contact: string; kind: string; entryId: number; eventId: number; status: string; claimedBy: number | null} | undefined;
      if (!invite || invite.kind === "email" && invite.contact.toLowerCase() !== user.email.toLowerCase()) return false;
      if (invite.status === "claimed") return invite.claimedBy === user.id;
      const entry = store.entry(invite.entryId);
      if (!entry || entry.state !== "pending" || entry.user_id != null || !available(storage.getEvent(invite.eventId), Date.now())) return false;
      if (storage.isMemberInteractionBlocked(user.id, entry.added_by)) return false;
      const existing = store.holderEntry(invite.eventId, user.id);
      if (existing) store.setState(invite.entryId, "removed");
      else db.prepare("UPDATE zaylist_entries SET user_id=?, updated_at=CURRENT_TIMESTAMP WHERE id=?").run(user.id, invite.entryId);
      db.prepare("UPDATE zaylist_invites SET status='claimed',claimed_by=?,claimed_at=CURRENT_TIMESTAMP WHERE id=?").run(user.id, invite.id);
      if (invite.kind === "phone") {
        const phone = internationalPhone(invite.contact);
        if (phone) db.prepare("INSERT OR REPLACE INTO zaylist_verified_phones(phone,user_id) VALUES(?,?)").run(phone,user.id);
      }
      if (!existing) notifyEntry(invite.entryId);
      return true;
    }).immediate();
  }
  return { notifyEntry, queueInvite, draw, dueDraws, deliverInvites, claim };
}
