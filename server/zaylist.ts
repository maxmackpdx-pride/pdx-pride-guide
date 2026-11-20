import { ownedVenueMatch } from "./hostWorkspace";
import { createGuestListOperations, internationalPhone } from "./guestListOperations";
import { appleGuestPass, googleGuestPass, guestPassPdf, walletAvailability } from "./guestPass";
import { randomBytes } from "node:crypto";
import type Database from "better-sqlite3";
import type { Express, RequestHandler, Response } from "express";
import { hasPublicEventFlags } from "@shared/publicEventVisibility";
import type { Event } from "@shared/schema";
import { getEventChatWindow } from "@shared/eventChatWindow";
import { parsePacificDateTime } from "@shared/missedConnections";
import type { IStorage } from "./storage";

/**
 * Zay'list — the comp guest list for paid-ticket events (Tucker's spec,
 * Nov 19, 2026, asks 49–57). Promoters and venue owners allocate no-cover
 * spots: a configured pool with a hard cap, a random draw from RSVPs,
 * per-person allowances for staff / promoters / talent, full-access grants,
 * direct adds by email/phone search with an invite fallback, QR guest tokens
 * redeemed once at the door, and drink comps riding the same token.
 *
 * Data rule (ask 48): everything here is a named, retrievable record — one
 * row per fact — and every count a surface shows derives from these tables.
 *
 * Permission model (ask 54):
 * - team (event hosts, allowance holders, event talent, grant holders) can
 *   VIEW the list and SCAN at the door.
 * - editors (event owner, full-access holders, promoters) can EDIT the list.
 * - allocators (event owner, full-access holders) set the pool/cap/timing,
 *   allowances, grants, privileges and run draws.
 * - adding a name is bounded by the adder's own allowance unless the adder
 *   is an allocator, and always bounded by the pool.
 * - attaching drink comps is a PRIVILEGE assigned by an allocator.
 */

export type ZaylistRole = "staff" | "promoter" | "talent";
export type EntryState =
  | "pending"
  | "accepted"
  | "declined"
  | "gifted"
  | "redeemed"
  | "removed"
  | "expired";
export type EntrySource = "draw" | "direct" | "invite" | "gift";

const LIVE_STATES = ["pending", "accepted", "redeemed"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function newGuestToken() {
  return randomBytes(24).toString("base64url");
}

export function createZaylistStore(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS zaylist_configs (
      event_id INTEGER PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
      pool_size INTEGER NOT NULL DEFAULT 0 CHECK(pool_size>=0),
      max_cap INTEGER NOT NULL DEFAULT 0 CHECK(max_cap>=0),
      draw_days_before INTEGER, drip_per_day INTEGER,
      updated_by INTEGER REFERENCES users(id),
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS zaylist_allowances (
      id INTEGER PRIMARY KEY,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK(role IN ('staff','promoter','talent')),
      spots INTEGER NOT NULL CHECK(spots>=0),
      assigned_by INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(event_id,user_id)
    );
    CREATE TABLE IF NOT EXISTS zaylist_access_grants (
      id INTEGER PRIMARY KEY,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      granted_by INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, revoked_at TEXT
    );
    CREATE TABLE IF NOT EXISTS zaylist_privileges (
      id INTEGER PRIMARY KEY,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      kind TEXT NOT NULL DEFAULT 'drink',
      granted_by INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, revoked_at TEXT
    );
    CREATE TABLE IF NOT EXISTS zaylist_draws (
      id INTEGER PRIMARY KEY,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      run_by INTEGER NOT NULL REFERENCES users(id),
      eligible INTEGER NOT NULL, requested INTEGER NOT NULL, awarded INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS zaylist_entries (
      id INTEGER PRIMARY KEY,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      contact TEXT,
      state TEXT NOT NULL DEFAULT 'pending'
        CHECK(state IN ('pending','accepted','declined','gifted','redeemed','removed','expired')),
      source TEXT NOT NULL CHECK(source IN ('draw','direct','invite','gift')),
      added_by INTEGER NOT NULL REFERENCES users(id),
      authority_user_id INTEGER NOT NULL REFERENCES users(id),
      draw_id INTEGER REFERENCES zaylist_draws(id),
      gifted_from INTEGER REFERENCES zaylist_entries(id),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      accepted_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_zaylist_entries_event ON zaylist_entries(event_id,state);
    CREATE INDEX IF NOT EXISTS idx_zaylist_entries_user ON zaylist_entries(user_id);
    CREATE TABLE IF NOT EXISTS zaylist_invites (
      id INTEGER PRIMARY KEY,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      entry_id INTEGER NOT NULL REFERENCES zaylist_entries(id) ON DELETE CASCADE,
      contact TEXT NOT NULL,
      contact_kind TEXT NOT NULL CHECK(contact_kind IN ('email','phone')),
      invited_by INTEGER NOT NULL REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'sent' CHECK(status IN ('sent','claimed')),
      claimed_by INTEGER REFERENCES users(id), claimed_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS zaylist_tokens (
      id INTEGER PRIMARY KEY,
      entry_id INTEGER NOT NULL REFERENCES zaylist_entries(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, revoked_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_zaylist_tokens_entry ON zaylist_tokens(entry_id);
    CREATE TABLE IF NOT EXISTS zaylist_saved_messages (
      id INTEGER PRIMARY KEY,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      label TEXT NOT NULL DEFAULT '', body TEXT NOT NULL,
      created_by INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS zaylist_event_messages (
      event_id INTEGER PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
      general_body TEXT NOT NULL DEFAULT '',
      talent_message_id INTEGER REFERENCES zaylist_saved_messages(id),
      updated_by INTEGER REFERENCES users(id),
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS zaylist_broadcasts (
      id INTEGER PRIMARY KEY,
      event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      sender_id INTEGER NOT NULL REFERENCES users(id),
      body TEXT NOT NULL, audience TEXT NOT NULL DEFAULT 'accepted',
      recipient_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS zaylist_drink_grants (
      id INTEGER PRIMARY KEY,
      entry_id INTEGER NOT NULL REFERENCES zaylist_entries(id) ON DELETE CASCADE,
      kind TEXT NOT NULL CHECK(kind IN ('comp','discount')),
      total INTEGER NOT NULL CHECK(total>=1), percent INTEGER,
      granted_by INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, revoked_at TEXT
    );
    CREATE TABLE IF NOT EXISTS zaylist_redemptions (
      id INTEGER PRIMARY KEY,
      entry_id INTEGER NOT NULL REFERENCES zaylist_entries(id) ON DELETE CASCADE,
      event_id INTEGER NOT NULL,
      kind TEXT NOT NULL CHECK(kind IN ('entry','drink')),
      drink_grant_id INTEGER REFERENCES zaylist_drink_grants(id),
      scanned_by INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS zaylist_entry_redeemed_once
      ON zaylist_redemptions(entry_id) WHERE kind='entry';
  `);

  const livePh = LIVE_STATES.map(() => "?").join(",");
  type EntryRow = {
    id: number;
    event_id: number;
    user_id: number | null;
    contact: string | null;
    state: EntryState;
    source: EntrySource;
    added_by: number;
    authority_user_id: number;
    draw_id: number | null;
    gifted_from: number | null;
    created_at: string;
    accepted_at: string | null;
  };
  const getEntry = db.prepare("SELECT * FROM zaylist_entries WHERE id=?");
  const liveCountStmt = db.prepare(
    `SELECT COUNT(*) AS n FROM zaylist_entries WHERE event_id=? AND state IN (${livePh})`,
  );
  const holderStmt = db.prepare(
    `SELECT id FROM zaylist_entries WHERE event_id=? AND user_id=? AND state IN (${livePh})`,
  );
  const authorityUsedStmt = db.prepare(
    `SELECT COUNT(*) AS n FROM zaylist_entries WHERE event_id=? AND authority_user_id=? AND state IN (${livePh})`,
  );

  function config(eventId: number) {
    return db
      .prepare(
        `SELECT event_id AS eventId, pool_size AS poolSize, max_cap AS maxCap,
        draw_days_before AS drawDaysBefore, drip_per_day AS dripPerDay,
        updated_by AS updatedBy, updated_at AS updatedAt
        FROM zaylist_configs WHERE event_id=?`,
      )
      .get(eventId) as
      | {
          eventId: number;
          poolSize: number;
          maxCap: number;
          drawDaysBefore: number | null;
          dripPerDay: number | null;
          updatedBy: number | null;
          updatedAt: string;
        }
      | undefined;
  }

  function liveCount(eventId: number) {
    return (liveCountStmt.get(eventId, ...LIVE_STATES) as { n: number }).n;
  }

  function holderEntry(eventId: number, userId: number) {
    return holderStmt.get(eventId, userId, ...LIVE_STATES) as
      | { id: number }
      | undefined;
  }

  function authorityUsed(eventId: number, authorityUserId: number) {
    return (
      authorityUsedStmt.get(eventId, authorityUserId, ...LIVE_STATES) as {
        n: number;
      }
    ).n;
  }

  function issueToken(entryId: number) {
    const token = newGuestToken();
    db.prepare(
      "INSERT INTO zaylist_tokens(entry_id,token) VALUES(?,?)",
    ).run(entryId, token);
    return token;
  }

  function activeToken(entryId: number) {
    return db
      .prepare(
        "SELECT token FROM zaylist_tokens WHERE entry_id=? AND revoked_at IS NULL ORDER BY id DESC",
      )
      .get(entryId) as { token: string } | undefined;
  }

  function revokeTokens(entryId: number) {
    db.prepare(
      "UPDATE zaylist_tokens SET revoked_at=CURRENT_TIMESTAMP WHERE entry_id=? AND revoked_at IS NULL",
    ).run(entryId);
  }

  function entryByToken(token: string) {
    const row = db
      .prepare(
        `SELECT e.* FROM zaylist_tokens t JOIN zaylist_entries e ON e.id=t.entry_id
        WHERE t.token=? AND t.revoked_at IS NULL`,
      )
      .get(token) as EntryRow | undefined;
    return row;
  }

  /** Insert a live entry, enforcing pool, one-per-person and (for
   *  allowance-bound adders) the adder's remaining allowance, in one
   *  transaction. `poolBound` is false only for gifts, which move a spot
   *  that already counted against the pool. */
  function insertEntry(input: {
    eventId: number;
    userId: number | null;
    contact: string | null;
    source: EntrySource;
    addedBy: number;
    authorityUserId: number;
    allowance: number | null;
    drawId?: number | null;
    giftedFrom?: number | null;
    poolBound?: boolean;
  }): { ok: true; id: number } | { ok: false; error: string } {
    return db.transaction(() => {
      const cfg = config(input.eventId);
      if (!cfg || cfg.poolSize <= 0)
        return { ok: false as const, error: "no-pool" };
      if (input.poolBound !== false && liveCount(input.eventId) >= cfg.poolSize)
        return { ok: false as const, error: "pool-full" };
      if (!input.userId && input.contact && db.prepare(`SELECT 1 FROM zaylist_entries WHERE event_id=? AND user_id IS NULL AND contact=? AND state IN (${livePh})`).get(input.eventId,input.contact,...LIVE_STATES))
        return { ok: false as const, error: "already-on-list" };
      if (input.userId && holderEntry(input.eventId, input.userId))
        return { ok: false as const, error: "already-on-list" };
      if (
        input.allowance !== null &&
        authorityUsed(input.eventId, input.authorityUserId) >= input.allowance
      )
        return { ok: false as const, error: "allowance-exhausted" };
      const info = db
        .prepare(
          `INSERT INTO zaylist_entries(event_id,user_id,contact,source,added_by,authority_user_id,draw_id,gifted_from)
          VALUES(?,?,?,?,?,?,?,?)`,
        )
        .run(
          input.eventId,
          input.userId,
          input.contact,
          input.source,
          input.addedBy,
          input.authorityUserId,
          input.drawId ?? null,
          input.giftedFrom ?? null,
        );
      return { ok: true as const, id: Number(info.lastInsertRowid) };
    })();
  }

  return {
    config,
    setConfig(
      eventId: number,
      by: number,
      fields: {
        poolSize: number;
        maxCap: number;
        drawDaysBefore: number | null;
        dripPerDay: number | null;
      },
    ) {
      db.prepare(
        `INSERT INTO zaylist_configs(event_id,pool_size,max_cap,draw_days_before,drip_per_day,updated_by,updated_at)
        VALUES(?,?,?,?,?,?,CURRENT_TIMESTAMP)
        ON CONFLICT(event_id) DO UPDATE SET pool_size=excluded.pool_size, max_cap=excluded.max_cap,
          draw_days_before=excluded.draw_days_before, drip_per_day=excluded.drip_per_day,
          updated_by=excluded.updated_by, updated_at=CURRENT_TIMESTAMP`,
      ).run(
        eventId,
        fields.poolSize,
        fields.maxCap,
        fields.drawDaysBefore,
        fields.dripPerDay,
        by,
      );
      return config(eventId);
    },
    liveCount,
    holderEntry,
    authorityUsed,
    entry(id: number) {
      return getEntry.get(id) as EntryRow | undefined;
    },
    entries(eventId: number) {
      return db
        .prepare(
          `SELECT e.id, e.user_id AS userId, e.contact, e.state, e.source,
          e.added_by AS addedBy, e.authority_user_id AS authorityUserId,
          e.draw_id AS drawId, e.gifted_from AS giftedFrom,
          e.created_at AS createdAt, e.accepted_at AS acceptedAt,
          u.username, u.display_name AS displayName
          FROM zaylist_entries e LEFT JOIN users u ON u.id=e.user_id
          WHERE e.event_id=? ORDER BY e.id`,
        )
        .all(eventId);
    },
    myEntries(userId: number) {
      return db
        .prepare(
          `SELECT e.id, e.event_id AS eventId, e.state, e.source, e.contact,
          e.created_at AS createdAt, e.accepted_at AS acceptedAt, ev.title AS eventTitle
          FROM zaylist_entries e JOIN events ev ON ev.id=e.event_id
          WHERE e.user_id=? ORDER BY e.id DESC`,
        )
        .all(userId);
    },
    counts(eventId: number) {
      const by = (state: EntryState) =>
        (
          db
            .prepare(
              "SELECT COUNT(*) AS n FROM zaylist_entries WHERE event_id=? AND state=?",
            )
            .get(eventId, state) as { n: number }
        ).n;
      const drinks = db
        .prepare(
          `SELECT COALESCE(SUM(g.total),0) AS granted FROM zaylist_drink_grants g
          JOIN zaylist_entries e ON e.id=g.entry_id
          WHERE e.event_id=? AND g.revoked_at IS NULL AND e.state IN (${livePh})`,
        )
        .get(eventId, ...LIVE_STATES) as { granted: number };
      const drinksUsed = db
        .prepare(
          "SELECT COUNT(*) AS n FROM zaylist_redemptions WHERE event_id=? AND kind='drink'",
        )
        .get(eventId) as { n: number };
      const cfg = config(eventId);
      return {
        poolSize: cfg?.poolSize ?? 0,
        maxCap: cfg?.maxCap ?? 0,
        pending: by("pending"),
        accepted: by("accepted"),
        arrived: by("redeemed"),
        declined: by("declined"),
        drinksOutstanding: Math.max(0, drinks.granted - drinksUsed.n),
      };
    },
    allowance(eventId: number, userId: number) {
      return db
        .prepare(
          `SELECT id, role, spots, assigned_by AS assignedBy FROM zaylist_allowances
          WHERE event_id=? AND user_id=?`,
        )
        .get(eventId, userId) as
        | { id: number; role: ZaylistRole; spots: number; assignedBy: number }
        | undefined;
    },
    allowances(eventId: number) {
      return db
        .prepare(
          `SELECT a.user_id AS userId, a.role, a.spots, a.assigned_by AS assignedBy,
          u.username, u.display_name AS displayName,
          EXISTS(SELECT 1 FROM zaylist_privileges p WHERE p.event_id=a.event_id AND p.user_id=a.user_id AND p.revoked_at IS NULL AND p.kind='drink') AS drinkPrivilege
          FROM zaylist_allowances a JOIN users u ON u.id=a.user_id
          WHERE a.event_id=? ORDER BY a.id`,
        )
        .all(eventId);
    },
    setAllowance(
      eventId: number,
      userId: number,
      role: ZaylistRole,
      spots: number,
      assignedBy: number,
    ) {
      db.prepare(
        `INSERT INTO zaylist_allowances(event_id,user_id,role,spots,assigned_by) VALUES(?,?,?,?,?)
        ON CONFLICT(event_id,user_id) DO UPDATE SET role=excluded.role, spots=excluded.spots,
          assigned_by=excluded.assigned_by`,
      ).run(eventId, userId, role, spots, assignedBy);
    },
    removeAllowance(eventId: number, userId: number) {
      db.prepare(
        "DELETE FROM zaylist_allowances WHERE event_id=? AND user_id=?",
      ).run(eventId, userId);
    },
    hasFullAccess(eventId: number, userId: number) {
      return !!db
        .prepare(
          "SELECT 1 FROM zaylist_access_grants WHERE event_id=? AND user_id=? AND revoked_at IS NULL",
        )
        .get(eventId, userId);
    },
    grants(eventId: number) {
      return db
        .prepare(
          `SELECT g.user_id AS userId, g.granted_by AS grantedBy, g.created_at AS createdAt,
          u.username, u.display_name AS displayName
          FROM zaylist_access_grants g JOIN users u ON u.id=g.user_id
          WHERE g.event_id=? AND g.revoked_at IS NULL ORDER BY g.id`,
        )
        .all(eventId);
    },
    grantAccess(eventId: number, userId: number, grantedBy: number) {
      db.prepare(
        "INSERT INTO zaylist_access_grants(event_id,user_id,granted_by) VALUES(?,?,?)",
      ).run(eventId, userId, grantedBy);
    },
    revokeAccess(eventId: number, userId: number) {
      db.prepare(
        "UPDATE zaylist_access_grants SET revoked_at=CURRENT_TIMESTAMP WHERE event_id=? AND user_id=? AND revoked_at IS NULL",
      ).run(eventId, userId);
    },
    hasDrinkPrivilege(eventId: number, userId: number) {
      return !!db
        .prepare(
          "SELECT 1 FROM zaylist_privileges WHERE event_id=? AND user_id=? AND kind='drink' AND revoked_at IS NULL",
        )
        .get(eventId, userId);
    },
    setDrinkPrivilege(eventId: number, userId: number, grantedBy: number) {
      db.prepare(
        "INSERT INTO zaylist_privileges(event_id,user_id,kind,granted_by) VALUES(?,?,'drink',?)",
      ).run(eventId, userId, grantedBy);
    },
    revokeDrinkPrivilege(eventId: number, userId: number) {
      db.prepare(
        "UPDATE zaylist_privileges SET revoked_at=CURRENT_TIMESTAMP WHERE event_id=? AND user_id=? AND kind='drink' AND revoked_at IS NULL",
      ).run(eventId, userId);
    },
    isTalent(eventId: number, userId: number) {
      return !!db
        .prepare(
          "SELECT 1 FROM event_talent WHERE event_id=? AND user_id=? AND status='LIVE'",
        )
        .get(eventId, userId);
    },
    addSpot: insertEntry,
    runDraw(eventId: number, runBy: number, requested: number | null, nowIso: string) {
      return db.transaction(() => {
        const cfg = config(eventId);
        if (!cfg || cfg.poolSize <= 0)
          return { ok: false as const, error: "no-pool" };
        const remaining = cfg.poolSize - liveCount(eventId);
        if (remaining <= 0) return { ok: false as const, error: "pool-full" };
        const eligible = (
          db
            .prepare(
              `SELECT COUNT(DISTINCT a.user_id) AS n FROM attendances a JOIN users u ON u.id=a.user_id
              WHERE a.event_id=? AND a.is_active=1 AND (a.expires_at IS NULL OR a.expires_at>?)
              AND u.status='active' AND a.user_id IS NOT NULL
              AND NOT EXISTS (SELECT 1 FROM zaylist_entries e WHERE e.event_id=a.event_id
                AND e.user_id=a.user_id AND (e.state IN (${livePh}) OR e.state='declined'))`,
            )
            .get(eventId, nowIso, ...LIVE_STATES) as { n: number }
        ).n;
        const want = Math.min(requested ?? remaining, remaining, eligible);
        const drawInfo = db
          .prepare(
            "INSERT INTO zaylist_draws(event_id,run_by,eligible,requested,awarded) VALUES(?,?,?,?,?)",
          )
          .run(eventId, runBy, eligible, requested ?? remaining, want);
        const drawId = Number(drawInfo.lastInsertRowid);
        if (want > 0) {
          const winners = db
            .prepare(
              `SELECT DISTINCT a.user_id AS userId FROM attendances a JOIN users u ON u.id=a.user_id
              WHERE a.event_id=? AND a.is_active=1 AND (a.expires_at IS NULL OR a.expires_at>?)
              AND u.status='active' AND a.user_id IS NOT NULL
              AND NOT EXISTS (SELECT 1 FROM zaylist_entries e WHERE e.event_id=a.event_id
                AND e.user_id=a.user_id AND (e.state IN (${livePh}) OR e.state='declined'))
              ORDER BY RANDOM() LIMIT ?`,
            )
            .all(eventId, nowIso, ...LIVE_STATES, want) as { userId: number }[];
          const insert = db.prepare(
            `INSERT INTO zaylist_entries(event_id,user_id,source,added_by,authority_user_id,draw_id)
            VALUES(:event,:user,'draw',:by,:by,:draw)`,
          );
          for (const w of winners)
            insert.run({
              event: eventId,
              user: w.userId,
              by: runBy,
              draw: drawId,
            });
        }
        return { ok: true as const, drawId, eligible, awarded: want };
      })();
    },
    setState(id: number, state: EntryState) {
      db.prepare(
        "UPDATE zaylist_entries SET state=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
      ).run(state, id);
    },
    accept(id: number) {
      return db.transaction(() => {
        const row = getEntry.get(id) as EntryRow | undefined;
        if (!row || row.state !== "pending") return null;
        db.prepare(
          "UPDATE zaylist_entries SET state='accepted', accepted_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE id=?",
        ).run(id);
        revokeTokens(id);
        return issueToken(id);
      })();
    },
    issueToken,
    activeToken,
    revokeTokens,
    entryByToken,
    regenerateToken(id: number) {
      return db.transaction(() => {
        revokeTokens(id);
        return issueToken(id);
      })();
    },
    gift(
      entry: EntryRow,
      target: { userId: number | null; contact: string | null },
      giftedBy: number,
    ): { ok: true; id: number } | { ok: false; error: string } {
      return db.transaction(() => {
        if (target.userId ? holderEntry(entry.event_id, target.userId) : db.prepare(`SELECT 1 FROM zaylist_entries
          WHERE event_id=? AND user_id IS NULL AND contact=? AND state IN (${livePh})`).get(entry.event_id,target.contact,...LIVE_STATES))
          return { ok: false as const, error: "already-on-list" };
        db.prepare(
          "UPDATE zaylist_entries SET state='gifted', updated_at=CURRENT_TIMESTAMP WHERE id=?",
        ).run(entry.id);
        revokeTokens(entry.id);
        const info = db
          .prepare(
            `INSERT INTO zaylist_entries(event_id,user_id,contact,source,added_by,authority_user_id,gifted_from)
            VALUES(?,?,?,?,?,?,?)`,
          )
          .run(
            entry.event_id,
            target.userId,
            target.contact,
            target.userId ? "gift" : "invite",
            giftedBy,
            entry.authority_user_id,
            entry.id,
          );
        const newId = Number(info.lastInsertRowid);
        // Drink comps ride the spot, not the person: they move to the new entry.
        db.prepare(
          "UPDATE zaylist_drink_grants SET entry_id=? WHERE entry_id=?",
        ).run(newId, entry.id);
        return { ok: true as const, id: newId };
      })();
    },
    addInvite(
      eventId: number,
      entryId: number,
      contact: string,
      kind: "email" | "phone",
      invitedBy: number,
    ) {
      db.prepare(
        "INSERT INTO zaylist_invites(event_id,entry_id,contact,contact_kind,invited_by) VALUES(?,?,?,?,?)",
      ).run(eventId, entryId, contact, kind, invitedBy);
    },
    claimInvites(userId: number, email: string) {
      return db.transaction(() => {
        const rows = db
          .prepare(
            `SELECT i.id, i.entry_id AS entryId FROM zaylist_invites i
            JOIN zaylist_entries e ON e.id=i.entry_id
            WHERE i.status='sent' AND i.contact_kind='email' AND lower(i.contact)=lower(?)
            AND e.user_id IS NULL AND e.state='pending'`,
          )
          .all(email) as { id: number; entryId: number }[];
        for (const row of rows) {
          db.prepare(
            "UPDATE zaylist_entries SET user_id=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
          ).run(userId, row.entryId);
          db.prepare(
            "UPDATE zaylist_invites SET status='claimed', claimed_by=?, claimed_at=CURRENT_TIMESTAMP WHERE id=?",
          ).run(userId, row.id);
        }
        return rows.length;
      })();
    },
    claimableInvites(email: string) {
      return db
        .prepare(
          `SELECT i.id, i.event_id AS eventId, i.entry_id AS entryId, ev.title AS eventTitle
          FROM zaylist_invites i JOIN zaylist_entries e ON e.id=i.entry_id
          JOIN events ev ON ev.id=i.event_id
          WHERE i.status='sent' AND i.contact_kind='email' AND lower(i.contact)=lower(?)
          AND e.user_id IS NULL AND e.state='pending'`,
        )
        .all(email);
    },
    messages(eventId: number) {
      return db
        .prepare(
          `SELECT event_id AS eventId, general_body AS generalBody,
          talent_message_id AS talentMessageId, updated_by AS updatedBy
          FROM zaylist_event_messages WHERE event_id=?`,
        )
        .get(eventId) as
        | {
            eventId: number;
            generalBody: string;
            talentMessageId: number | null;
            updatedBy: number | null;
          }
        | undefined;
    },
    setMessages(
      eventId: number,
      by: number,
      fields: { generalBody?: string; talentMessageId?: number | null },
    ) {
      const current = db
        .prepare("SELECT * FROM zaylist_event_messages WHERE event_id=?")
        .get(eventId) as
        | { general_body: string; talent_message_id: number | null }
        | undefined;
      db.prepare(
        `INSERT INTO zaylist_event_messages(event_id,general_body,talent_message_id,updated_by,updated_at)
        VALUES(?,?,?,?,CURRENT_TIMESTAMP)
        ON CONFLICT(event_id) DO UPDATE SET general_body=excluded.general_body,
          talent_message_id=excluded.talent_message_id, updated_by=excluded.updated_by,
          updated_at=CURRENT_TIMESTAMP`,
      ).run(
        eventId,
        fields.generalBody ?? current?.general_body ?? "",
        fields.talentMessageId !== undefined
          ? fields.talentMessageId
          : (current?.talent_message_id ?? null),
        by,
      );
    },
    savedMessages(eventId: number) {
      return db
        .prepare(
          `SELECT id, label, body, created_by AS createdBy, created_at AS createdAt
          FROM zaylist_saved_messages WHERE event_id=? ORDER BY id`,
        )
        .all(eventId);
    },
    addSavedMessage(eventId: number, by: number, label: string, body: string) {
      const info = db
        .prepare(
          "INSERT INTO zaylist_saved_messages(event_id,label,body,created_by) VALUES(?,?,?,?)",
        )
        .run(eventId, label, body, by);
      return Number(info.lastInsertRowid);
    },
    savedMessage(id: number) {
      return db
        .prepare(
          "SELECT id, event_id AS eventId, label, body FROM zaylist_saved_messages WHERE id=?",
        )
        .get(id) as
        | { id: number; eventId: number; label: string; body: string }
        | undefined;
    },
    deleteSavedMessage(id: number) {
      db.prepare(
        "UPDATE zaylist_event_messages SET talent_message_id=NULL WHERE talent_message_id=?",
      ).run(id);
      db.prepare("DELETE FROM zaylist_saved_messages WHERE id=?").run(id);
    },
    addBroadcast(eventId: number, senderId: number, body: string) {
      const recipients = (
        db
          .prepare(
            `SELECT COUNT(*) AS n FROM zaylist_entries WHERE event_id=? AND state IN ('accepted','redeemed')`,
          )
          .get(eventId) as { n: number }
      ).n;
      const info = db
        .prepare(
          "INSERT INTO zaylist_broadcasts(event_id,sender_id,body,recipient_count) VALUES(?,?,?,?)",
        )
        .run(eventId, senderId, body, recipients);
      return { id: Number(info.lastInsertRowid), recipientCount: recipients };
    },
    broadcasts(eventId: number) {
      return db
        .prepare(
          `SELECT id, sender_id AS senderId, body, audience, recipient_count AS recipientCount,
          created_at AS createdAt FROM zaylist_broadcasts WHERE event_id=? ORDER BY id DESC`,
        )
        .all(eventId);
    },
    attachDrink(
      entryId: number,
      by: number,
      kind: "comp" | "discount",
      total: number,
      percent: number | null,
    ) {
      const info = db
        .prepare(
          "INSERT INTO zaylist_drink_grants(entry_id,kind,total,percent,granted_by) VALUES(?,?,?,?,?)",
        )
        .run(entryId, kind, total, percent, by);
      return Number(info.lastInsertRowid);
    },
    drinksFor(entryId: number) {
      return db
        .prepare(
          `SELECT g.id, g.kind, g.total, g.percent, g.granted_by AS grantedBy,
          g.created_at AS createdAt, g.revoked_at AS revokedAt,
          (SELECT COUNT(*) FROM zaylist_redemptions r WHERE r.drink_grant_id=g.id AND r.kind='drink') AS used
          FROM zaylist_drink_grants g WHERE g.entry_id=? ORDER BY g.id`,
        )
        .all(entryId) as {
        id: number;
        kind: string;
        total: number;
        percent: number | null;
        grantedBy: number;
        createdAt: string;
        revokedAt: string | null;
        used: number;
      }[];
    },
    revokeDrink(id: number) {
      db.prepare(
        "UPDATE zaylist_drink_grants SET revoked_at=CURRENT_TIMESTAMP WHERE id=? AND revoked_at IS NULL",
      ).run(id);
    },
    entryRedemption(entryId: number) {
      return db
        .prepare(
          `SELECT r.id, r.scanned_by AS scannedBy, r.created_at AS createdAt, u.username AS scanner
          FROM zaylist_redemptions r JOIN users u ON u.id=r.scanned_by
          WHERE r.entry_id=? AND r.kind='entry'`,
        )
        .get(entryId) as
        | { id: number; scannedBy: number; createdAt: string; scanner: string }
        | undefined;
    },
    scanEntry(entry: EntryRow, scannedBy: number) {
      return db.transaction(() => {
        const prior = db
          .prepare(
            `SELECT r.scanned_by AS scannedBy, r.created_at AS createdAt, u.username AS scanner
            FROM zaylist_redemptions r JOIN users u ON u.id=r.scanned_by
            WHERE r.entry_id=? AND r.kind='entry'`,
          )
          .get(entry.id) as
          | { scannedBy: number; createdAt: string; scanner: string }
          | undefined;
        if (prior)
          return {
            result: "already-in" as const,
            firstScan: { by: prior.scanner, at: prior.createdAt },
          };
        db.prepare(
          "INSERT INTO zaylist_redemptions(entry_id,event_id,kind,scanned_by) VALUES(?,?,'entry',?)",
        ).run(entry.id, entry.event_id, scannedBy);
        db.prepare(
          "UPDATE zaylist_entries SET state='redeemed', updated_at=CURRENT_TIMESTAMP WHERE id=?",
        ).run(entry.id);
        return { result: "admitted" as const };
      })();
    },
    scanDrink(entry: EntryRow, scannedBy: number, drinkGrantId?: number) {
      return db.transaction(() => {
        const grants = (
          db
            .prepare(
              `SELECT g.id, g.kind, g.total, g.percent, g.granted_by AS grantedBy,
              g.created_at AS createdAt, g.revoked_at AS revokedAt,
              (SELECT COUNT(*) FROM zaylist_redemptions r WHERE r.drink_grant_id=g.id AND r.kind='drink') AS used
              FROM zaylist_drink_grants g WHERE g.entry_id=? ORDER BY g.id`,
            )
            .all(entry.id) as {
            id: number;
            kind: string;
            total: number;
            percent: number | null;
            grantedBy: number;
            createdAt: string;
            revokedAt: string | null;
            used: number;
          }[]
        ).filter((g) => !g.revokedAt && g.used < g.total);
        const grant = drinkGrantId
          ? grants.find((g) => g.id === drinkGrantId)
          : grants[0];
        if (!grant) return { ok: false as const, error: "no-drinks" };
        db.prepare(
          "INSERT INTO zaylist_redemptions(entry_id,event_id,kind,drink_grant_id,scanned_by) VALUES(?,?,'drink',?,?)",
        ).run(entry.id, entry.event_id, grant.id, scannedBy);
        return {
          ok: true as const,
          drinkGrantId: grant.id,
          kind: grant.kind,
          remaining: grant.total - grant.used - 1,
        };
      })();
    },
    expirePending(eventId: number) {
      const info = db
        .prepare(
          "UPDATE zaylist_entries SET state='expired', updated_at=CURRENT_TIMESTAMP WHERE event_id=? AND state='pending'",
        )
        .run(eventId);
      return info.changes;
    },
    draws(eventId: number) {
      return db
        .prepare(
          `SELECT id, run_by AS runBy, eligible, requested, awarded, created_at AS createdAt
          FROM zaylist_draws WHERE event_id=? ORDER BY id DESC`,
        )
        .all(eventId);
    },
  };
}

export type ZaylistStore = ReturnType<typeof createZaylistStore>;

/** Event chat membership in this codebase is an active attendance row (or
 *  being a host) — see storage.getEventChatMessages. Accepting a Zay'list
 *  spot therefore ensures the guest's attendance, aligned to the chat
 *  window exactly the way storage.upsertAttendance aligns it. */
export function ensureEventChatMembership(
  db: Database.Database,
  event: Pick<Event, "id" | "dateStart" | "dateEnd">,
  userId: number,
) {
  const user = db
    .prepare("SELECT username, display_name, photo_url FROM users WHERE id=?")
    .get(userId) as
    | { username: string; display_name: string | null; photo_url: string | null }
    | undefined;
  if (!user) return;
  const win = getEventChatWindow(event.dateStart, event.dateEnd);
  const fallbackEnd =
    (parsePacificDateTime(event.dateEnd || event.dateStart) ?? Date.now()) +
    8 * 60 * 60 * 1000;
  const expiresAt = new Date(win ? win.closesAt : fallbackEnd).toISOString();
  const existing = db
    .prepare("SELECT id FROM attendances WHERE event_id=? AND user_id=?")
    .get(event.id, userId) as { id: number } | undefined;
  if (existing) {
    db.prepare(
      "UPDATE attendances SET is_active=1, expires_at=? WHERE id=?",
    ).run(expiresAt, existing.id);
    return;
  }
  db.prepare(
    `INSERT INTO attendances(event_id,user_id,handle,message,avatar_seed,photo_url,
      is_anonymous,visibility,expires_at,is_active,created_at)
    VALUES(?,?,?,?,?,?,0,'public',?,1,?)`,
  ).run(
    event.id,
    userId,
    user.display_name || user.username,
    "",
    user.username,
    user.photo_url ?? null,
    expiresAt,
    new Date().toISOString(),
  );
}

export type ZaylistAccess = {
  userId: number;
  isHost: boolean;
  isOwner: boolean;
  fullAccess: boolean;
  promoter: boolean;
  talent: boolean;
  team: boolean;
  editor: boolean;
  allocator: boolean;
  allowance: { role: ZaylistRole; spots: number } | undefined;
  canGrantDrinks: boolean;
};

export function registerZaylist(
  app: Express,
  db: Database.Database,
  storage: IStorage,
  requireAuth: RequestHandler,
  visible: (event: Pick<Event, "dateStart">) => boolean,
  moderate: (
    res: Response,
    board: string,
    fields: Record<string, string>,
  ) => boolean,
) {
  const store = createZaylistStore(db);

  function activeViewer(req: { session?: { userId?: number } }) {
    const id = req.session?.userId;
    if (!id) return undefined;
    const user = storage.getUserById(id);
    return user && user.status === "active" ? user : undefined;
  }

  function accessFor(eventId: number, userId: number): ZaylistAccess {
    const isHost = storage.isUserEventHost(eventId, userId);
    const primaries = db
      .prepare(
        "SELECT user_id AS userId FROM event_hosts WHERE event_id=? AND role='PRIMARY'",
      )
      .all(eventId) as { userId: number }[];
    const event = storage.getEvent(eventId);
    const ownsVenue = !!event && storage.getUserOwnedBusinesses(userId).some(place => ownedVenueMatch(event,place));
    const isOwner = ownsVenue || primaries.some(r => r.userId === userId) ||
      (isHost && primaries.length === 0 && !!event?.claimedBy && storage.resolveUserByIdentifier(event.claimedBy)?.id === userId);
    const fullAccess = store.hasFullAccess(eventId, userId);
    const allowance = store.allowance(eventId, userId);
    const talent =
      store.isTalent(eventId, userId) || allowance?.role === "talent";
    const promoter = allowance?.role === "promoter" || (isHost && !isOwner);
    const team = isOwner || isHost || fullAccess || !!allowance || talent;
    const editor = isOwner || fullAccess || promoter;
    const allocator = isOwner || fullAccess;
    return {
      userId,
      isHost,
      isOwner,
      fullAccess,
      promoter,
      talent,
      team,
      editor,
      allocator,
      allowance: allowance
        ? { role: allowance.role, spots: allowance.spots }
        : undefined,
      canGrantDrinks:
        allocator || store.hasDrinkPrivilege(eventId, userId),
    };
  }

  const operations = createGuestListOperations(db, store, storage, visible, (id, userId) => accessFor(id, userId).allocator);

  const eventPath = "/api/events/:id/zaylist";
  const scope: RequestHandler = (req, res, next) => {
    const id = Number(req.params.id);
    const event =
      Number.isSafeInteger(id) && id > 0 ? storage.getEvent(id) : null;
    if (
      !event ||
      event.status !== "LIVE" ||
      !hasPublicEventFlags(event) ||
      !visible(event)
    ) {
      res.status(404).json({ error: "Event unavailable" });
      return;
    }
    res.setHeader("Cache-Control", "private, no-store");
    res.locals.event = event;
    next();
  };

  const entryScope: RequestHandler = (req, res, next) => {
    const id = Number(req.params.entryId);
    const entry =
      Number.isSafeInteger(id) && id > 0 ? store.entry(id) : undefined;
    if (!entry) {
      res.status(404).json({ error: "Zay'list entry unavailable" });
      return;
    }
    res.setHeader("Cache-Control", "private, no-store");
    res.locals.entry = entry;
    next();
  };

  const viewerGuard: RequestHandler = (req, res, next) => {
    const viewer = activeViewer(req);
    if (!viewer) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    res.locals.viewer = viewer;
    next();
  };

  function spotError(res: Response, error: string) {
    const messages: Record<string, string> = {
      "no-pool": "The Zay'list pool is not open for this event",
      "pool-full": "The Zay'list pool is full",
      "already-on-list": "That person is already on this Zay'list",
      "allowance-exhausted": "No spots left in your Zay'list allowance",
    };
    res.status(409).json({ error: messages[error] ?? "Could not add that spot" });
  }

  function resolveContact(contact: string) {
    const trimmed = contact.trim();
    if (EMAIL_RE.test(trimmed)) {
      const email = trimmed.toLowerCase();
      const user = db
        .prepare(
          "SELECT id FROM users WHERE lower(email)=? AND status='active'",
        )
        .get(email) as { id: number } | undefined;
      return user
        ? { userId: user.id, contact: email, kind: "email" as const }
        : { userId: null, contact: email, kind: "email" as const };
    }
    const phone = internationalPhone(trimmed);
    if (phone) {
      const match = db.prepare("SELECT u.id FROM zaylist_verified_phones p JOIN users u ON u.id=p.user_id WHERE p.phone=? AND u.status='active'").get(phone) as {id: number} | undefined;
      return { userId: match?.id ?? null, contact: phone, kind: "phone" as const };
    }
    return null;
  }

  function resolveTarget(body: Record<string, unknown>) {
    if (Number.isSafeInteger(body.userId) && (body.userId as number) > 0) {
      const user = storage.getUserById(body.userId as number);
      if (!user || user.status !== "active") return undefined;
      return {
        userId: user.id,
        contact: null as string | null,
        kind: null as "email" | "phone" | null,
      };
    }
    if (typeof body.contact === "string") {
      const resolved = resolveContact(body.contact);
      if (resolved)
        return {
          userId: resolved.userId,
          contact: resolved.contact,
          kind: resolved.kind,
        };
    }
    return null;
  }

  function serializeDrinks(entryId: number) {
    return store.drinksFor(entryId).map((g) => ({
      id: g.id,
      kind: g.kind,
      total: g.total,
      percent: g.percent,
      used: g.used,
      remaining: Math.max(0, g.total - g.used),
      revoked: !!g.revokedAt,
      grantedBy: g.grantedBy,
    }));
  }

  // ---- Team view of the list (Event Mode reads the same payload) ----
  app.get(eventPath, requireAuth, viewerGuard, scope, (req, res) => {
    const viewer = res.locals.viewer;
    const event = res.locals.event as Event;
    const access = accessFor(event.id, viewer.id);
    if (!access.team) {
      const mine = store.holderEntry(event.id, viewer.id);
      if (!mine) {
        res.status(403).json({ error: "You are not on this event's team" });
        return;
      }
      const entry = store.entry(mine.id)!;
      res.json({
        guest: true,
        entry: {
          id: entry.id,
          state: entry.state,
          source: entry.source,
          token:
            entry.state === "accepted" || entry.state === "redeemed"
              ? (store.activeToken(entry.id)?.token ?? null)
              : null,
          drinks: serializeDrinks(entry.id),
        },
        permissions: { team: false, editor: false, allocator: false },
      });
      return;
    }
    const entries = (
      store.entries(event.id) as {
        id: number;
        userId: number | null;
        state: EntryState;
      }[]
    ).map((row) => ({
      ...row,
      important: row.userId ? store.isTalent(event.id, row.userId) : false,
      drinks: serializeDrinks(row.id),
    }));
    res.json({
      config: store.config(event.id) ?? null,
      counts: store.counts(event.id),
      entries,
      allowances: access.editor ? store.allowances(event.id) : undefined,
      grants: access.allocator ? store.grants(event.id) : undefined,
      draws: access.editor ? store.draws(event.id) : undefined,
      permissions: {
        team: access.team,
        editor: access.editor,
        allocator: access.allocator,
        isOwner: access.isOwner,
        canGrantDrinks: access.canGrantDrinks,
        allowance: access.allowance
          ? {
              role: access.allowance.role,
              spots: access.allowance.spots,
              used: store.authorityUsed(event.id, viewer.id),
            }
          : null,
      },
    });
  });

  // ---- Allocation config: owner / full-access ----
  app.put(eventPath + "/config", requireAuth, viewerGuard, scope, (req, res) => {
    const viewer = res.locals.viewer;
    const event = res.locals.event as Event;
    if (!accessFor(event.id, viewer.id).allocator) {
      res.status(403).json({ error: "Only the owner or a full-access holder can set the pool" });
      return;
    }
    const { poolSize, maxCap, drawDaysBefore, dripPerDay } = req.body ?? {};
    const optInt = (v: unknown) =>
      v === null || v === undefined
        ? null
        : Number.isInteger(v) && (v as number) >= 0
          ? (v as number)
          : undefined;
    const days = optInt(drawDaysBefore);
    const drip = optInt(dripPerDay);
    if (
      !Number.isInteger(poolSize) ||
      poolSize < 0 ||
      !Number.isInteger(maxCap) ||
      maxCap < 0 ||
      days === undefined ||
      drip === undefined
    ) {
      res.status(400).json({ error: "Enter a pool size and a max cap" });
      return;
    }
    if (poolSize && (!event.ticketUrl || event.admission === "FREE")) {
      res.status(400).json({ error: "A no-cover pool requires a paid event with a ticket link" });
      return;
    }
    if (poolSize < store.liveCount(event.id)) {
      res.status(409).json({ error: "Release existing spots before reducing the pool below its commitments" });
      return;
    }
    if (poolSize > maxCap) {
      res.status(400).json({ error: "The pool cannot exceed the max cap" });
      return;
    }
    res.json(
      store.setConfig(event.id, viewer.id, {
        poolSize,
        maxCap,
        drawDaysBefore: days,
        dripPerDay: drip,
      }),
    );
  });

  // ---- Random draw from RSVPs: owner / full-access ----
  app.post(eventPath + "/draw", requireAuth, viewerGuard, scope, (req, res) => {
    const viewer = res.locals.viewer;
    const event = res.locals.event as Event;
    if (!accessFor(event.id, viewer.id).allocator) {
      res.status(403).json({ error: "Only the owner or a full-access holder can run the draw" });
      return;
    }
    const count = req.body?.count;
    if (
      count !== undefined &&
      count !== null &&
      (!Number.isInteger(count) || count < 1)
    ) {
      res.status(400).json({ error: "Enter how many spots to draw" });
      return;
    }
    const result = operations.draw(
      event.id,
      viewer.id,
      count ?? null,
      Date.now(),
    );
    if (!result.ok) {
      spotError(res, result.error);
      return;
    }
    res.status(201).json({ ...result, counts: store.counts(event.id) });
  });

  // ---- Expire unconfirmed spots (returns them to the pool) ----
  app.post(eventPath + "/expire", requireAuth, viewerGuard, scope, (req, res) => {
    const viewer = res.locals.viewer;
    const event = res.locals.event as Event;
    if (!accessFor(event.id, viewer.id).allocator) {
      res.status(403).json({ error: "Only the owner or a full-access holder can expire spots" });
      return;
    }
    res.json({ expired: store.expirePending(event.id) });
  });

  // ---- People search for direct adds ----
  app.get(eventPath + "/search", requireAuth, viewerGuard, scope, (req, res) => {
    const viewer = res.locals.viewer;
    const event = res.locals.event as Event;
    const access = accessFor(event.id, viewer.id);
    if (!access.editor && !access.allowance) {
      res.status(403).json({ error: "You cannot add people to this Zay'list" });
      return;
    }
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (q.length < 2) {
      res.json({ results: [] });
      return;
    }
    const like = `%${q.replace(/[\\%_]/g, char => "\\" + char)}%`;
    const phone = internationalPhone(q);
    const results = db.prepare(`SELECT u.id,u.username,u.display_name AS displayName
      FROM users u WHERE u.status='active' AND (lower(u.email)=lower(?) OR u.username LIKE ? ESCAPE '\\'
      OR u.display_name LIKE ? ESCAPE '\\' OR EXISTS(SELECT 1 FROM zaylist_verified_phones p WHERE p.user_id=u.id AND p.phone=?))
      AND NOT EXISTS(SELECT 1 FROM member_blocks b WHERE (b.blocker_user_id=? AND b.blocked_user_id=u.id)
        OR (b.blocked_user_id=? AND b.blocker_user_id=u.id)) ORDER BY u.username LIMIT 10`).all(q, like, like, phone, viewer.id, viewer.id);
    res.json({ results });
  });

  // ---- Direct add (by user, by email, or by phone) ----
  app.post(eventPath + "/entries", requireAuth, viewerGuard, scope, (req, res) => {
    const viewer = res.locals.viewer;
    const event = res.locals.event as Event;
    const access = accessFor(event.id, viewer.id);
    if (!access.editor && !access.allowance) {
      res.status(403).json({ error: "You cannot add people to this Zay'list" });
      return;
    }
    const target = resolveTarget(req.body ?? {});
    if (target === undefined) {
      res.status(404).json({ error: "Member unavailable" });
      return;
    }
    if (!target) {
      res.status(400).json({ error: "Give a member, an email, or a phone number" });
      return;
    }
    if (target.userId && storage.isMemberInteractionBlocked(viewer.id, target.userId)) return res.status(404).json({error:"Member unavailable"});
    const result = db.transaction(() => {
      const result = store.addSpot({
      eventId: event.id,
      userId: target.userId,
      contact: target.contact,
      source: target.userId ? "direct" : "invite",
      addedBy: viewer.id,
      authorityUserId: viewer.id,
      allowance: access.allocator ? null : (access.allowance?.spots ?? 0),
    });
      if (result.ok) {
        if (!target.userId && target.contact && target.kind) {
          store.addInvite(event.id, result.id, target.contact, target.kind, viewer.id);
          operations.queueInvite(result.id);
        } else operations.notifyEntry(result.id);
      }
      return result;
    }).immediate();
    if (!result.ok) return spotError(res, result.error);
    res.status(201).json({ entry: store.entry(result.id) });
  });

  // ---- Remove a name: editors anywhere, allowance holders for their own ----
  app.delete(
    eventPath + "/entries/:entryId",
    requireAuth,
    viewerGuard,
    scope,
    entryScope,
    (req, res) => {
      const viewer = res.locals.viewer;
      const event = res.locals.event as Event;
      const entry = res.locals.entry;
      if (entry.event_id !== event.id) {
        res.status(404).json({ error: "Zay'list entry unavailable" });
        return;
      }
      const access = accessFor(event.id, viewer.id);
      if (!access.editor && entry.added_by !== viewer.id) {
        res.status(403).json({ error: "You cannot remove this name" });
        return;
      }
      if (!LIVE_STATES.includes(entry.state)) {
        res.status(409).json({ error: "That spot is already settled" });
        return;
      }
      store.setState(entry.id, "removed");
      store.revokeTokens(entry.id);
      res.json({ ok: true });
    },
  );

  // ---- Allowances: owner / full-access assign per-person quotas ----
  const userParam = (req: { params: Record<string, string | string[]> }) => {
    const raw = req.params.userId;
    const id = Number(Array.isArray(raw) ? raw[0] : raw);
    if (!Number.isSafeInteger(id) || id <= 0) return undefined;
    const user = storage.getUserById(id);
    return user && user.status === "active" ? user : undefined;
  };
  app.put(
    eventPath + "/allowances/:userId",
    requireAuth,
    viewerGuard,
    scope,
    (req, res) => {
      const viewer = res.locals.viewer;
      const event = res.locals.event as Event;
      if (!accessFor(event.id, viewer.id).allocator) {
        res.status(403).json({ error: "Only the owner or a full-access holder can assign allowances" });
        return;
      }
      const target = userParam(req);
      const { role, spots } = req.body ?? {};
      if (
        !target ||
        !["staff", "promoter", "talent"].includes(role) ||
        !Number.isInteger(spots) ||
        spots < 0 ||
        spots > 10000
      ) {
        res.status(400).json({ error: "Give a team member, a role, and a spot count" });
        return;
      }
      store.setAllowance(event.id, target.id, role, spots, viewer.id);
      res.json({ ok: true });
    },
  );
  app.delete(
    eventPath + "/allowances/:userId",
    requireAuth,
    viewerGuard,
    scope,
    (req, res) => {
      const viewer = res.locals.viewer;
      const event = res.locals.event as Event;
      if (!accessFor(event.id, viewer.id).allocator) {
        res.status(403).json({ error: "Only the owner or a full-access holder can assign allowances" });
        return;
      }
      const target = userParam(req);
      if (!target) {
        res.status(404).json({ error: "Member unavailable" });
        return;
      }
      store.removeAllowance(event.id, target.id);
      res.json({ ok: true });
    },
  );

  // ---- Full-access grants: owner only ----
  app.put(eventPath + "/grants/:userId", requireAuth, viewerGuard, scope, (req, res) => {
    const viewer = res.locals.viewer;
    const event = res.locals.event as Event;
    if (!accessFor(event.id, viewer.id).isOwner) {
      res.status(403).json({ error: "Only the owner can grant full Zay'list access" });
      return;
    }
    const target = userParam(req);
    if (!target) {
      res.status(404).json({ error: "Member unavailable" });
      return;
    }
    if (!store.hasFullAccess(event.id, target.id))
      store.grantAccess(event.id, target.id, viewer.id);
    res.json({ ok: true });
  });
  app.delete(eventPath + "/grants/:userId", requireAuth, viewerGuard, scope, (req, res) => {
    const viewer = res.locals.viewer;
    const event = res.locals.event as Event;
    if (!accessFor(event.id, viewer.id).isOwner) {
      res.status(403).json({ error: "Only the owner can grant full Zay'list access" });
      return;
    }
    const target = userParam(req);
    if (!target) {
      res.status(404).json({ error: "Member unavailable" });
      return;
    }
    store.revokeAccess(event.id, target.id);
    res.json({ ok: true });
  });

  // ---- Drink-comp privilege: assigned by owner / full-access ----
  app.put(
    eventPath + "/privileges/:userId",
    requireAuth,
    viewerGuard,
    scope,
    (req, res) => {
      const viewer = res.locals.viewer;
      const event = res.locals.event as Event;
      if (!accessFor(event.id, viewer.id).allocator) {
        res.status(403).json({ error: "Only the owner or a full-access holder can assign the drink privilege" });
        return;
      }
      const target = userParam(req);
      if (!target) {
        res.status(404).json({ error: "Member unavailable" });
        return;
      }
      if (!store.hasDrinkPrivilege(event.id, target.id))
        store.setDrinkPrivilege(event.id, target.id, viewer.id);
      res.json({ ok: true });
    },
  );
  app.delete(
    eventPath + "/privileges/:userId",
    requireAuth,
    viewerGuard,
    scope,
    (req, res) => {
      const viewer = res.locals.viewer;
      const event = res.locals.event as Event;
      if (!accessFor(event.id, viewer.id).allocator) {
        res.status(403).json({ error: "Only the owner or a full-access holder can assign the drink privilege" });
        return;
      }
      const target = userParam(req);
      if (!target) {
        res.status(404).json({ error: "Member unavailable" });
        return;
      }
      store.revokeDrinkPrivilege(event.id, target.id);
      res.json({ ok: true });
    },
  );

  // ---- Messages: general acceptance message + saved talent messages ----
  app.get(eventPath + "/messages", requireAuth, viewerGuard, scope, (req, res) => {
    const viewer = res.locals.viewer;
    const event = res.locals.event as Event;
    if (!accessFor(event.id, viewer.id).team) {
      res.status(403).json({ error: "You are not on this event's team" });
      return;
    }
    const current = store.messages(event.id);
    res.json({
      generalBody: current?.generalBody ?? "",
      talentMessageId: current?.talentMessageId ?? null,
      savedMessages: store.savedMessages(event.id),
    });
  });
  app.put(eventPath + "/messages", requireAuth, viewerGuard, scope, (req, res) => {
    const viewer = res.locals.viewer;
    const event = res.locals.event as Event;
    if (!accessFor(event.id, viewer.id).editor) {
      res.status(403).json({ error: "Only editors can set Zay'list messages" });
      return;
    }
    const generalBody =
      typeof req.body?.generalBody === "string"
        ? req.body.generalBody.trim()
        : undefined;
    if (generalBody !== undefined && generalBody.length > 2000) {
      res.status(400).json({ error: "Keep the message under 2,000 characters" });
      return;
    }
    let talentMessageId: number | null | undefined;
    if (req.body && "talentMessageId" in req.body) {
      const raw: unknown = req.body.talentMessageId;
      if (raw !== null && raw !== undefined && !Number.isSafeInteger(raw)) {
        res.status(400).json({ error: "That saved message is not on this event" });
        return;
      }
      talentMessageId = (raw as number | null | undefined) ?? null;
      if (talentMessageId !== null) {
        const saved = store.savedMessage(talentMessageId);
        if (!saved || saved.eventId !== event.id) {
          res.status(400).json({ error: "That saved message is not on this event" });
          return;
        }
      }
    }
    if (generalBody && moderate(res, "Zay'list message", { body: generalBody }))
      return;
    store.setMessages(event.id, viewer.id, { generalBody, talentMessageId });
    res.json({ ok: true });
  });
  app.post(eventPath + "/saved-messages", requireAuth, viewerGuard, scope, (req, res) => {
    const viewer = res.locals.viewer;
    const event = res.locals.event as Event;
    if (!accessFor(event.id, viewer.id).editor) {
      res.status(403).json({ error: "Only editors can save Zay'list messages" });
      return;
    }
    const label =
      typeof req.body?.label === "string" ? req.body.label.trim() : "";
    const body =
      typeof req.body?.body === "string" ? req.body.body.trim() : "";
    if (!body || body.length > 2000 || label.length > 80) {
      res.status(400).json({ error: "Enter a message of up to 2,000 characters" });
      return;
    }
    if (moderate(res, "Zay'list message", { body })) return;
    res.status(201).json({ id: store.addSavedMessage(event.id, viewer.id, label, body) });
  });
  app.delete(
    eventPath + "/saved-messages/:msgId",
    requireAuth,
    viewerGuard,
    scope,
    (req, res) => {
      const viewer = res.locals.viewer;
      const event = res.locals.event as Event;
      if (!accessFor(event.id, viewer.id).editor) {
        res.status(403).json({ error: "Only editors can save Zay'list messages" });
        return;
      }
      const saved = store.savedMessage(Number(req.params.msgId));
      if (!saved || saved.eventId !== event.id) {
        res.status(404).json({ error: "Saved message unavailable" });
        return;
      }
      store.deleteSavedMessage(saved.id);
      res.json({ ok: true });
    },
  );

  // ---- Mass message to the list's VIPs (accepted guests): a record ----
  app.post(eventPath + "/broadcasts", requireAuth, viewerGuard, scope, (req, res) => {
    const viewer = res.locals.viewer;
    const event = res.locals.event as Event;
    if (!accessFor(event.id, viewer.id).editor) {
      res.status(403).json({ error: "Only editors can message the list" });
      return;
    }
    const body =
      typeof req.body?.body === "string" ? req.body.body.trim() : "";
    if (!body || body.length > 2000) {
      res.status(400).json({ error: "Enter a message of up to 2,000 characters" });
      return;
    }
    if (moderate(res, "Zay'list message", { body })) return;
    const record = db.transaction(() => {
      const record = store.addBroadcast(event.id, viewer.id, body);
      const recipients = db.prepare(`SELECT DISTINCT e.user_id AS id FROM zaylist_entries e JOIN users u ON u.id=e.user_id
        WHERE e.event_id=? AND e.state IN ('accepted','redeemed') AND u.status='active' AND u.id!=?`).all(event.id, viewer.id) as {id: number}[];
      let delivered = 0;
      for (const person of recipients) {
        if (storage.isMemberInteractionBlocked(person.id, viewer.id)) continue;
        storage.sendMessage(viewer.id, person.id, event.title, body, {
          contextType: "HOST_UPDATE", contextId: event.id, contextLabel: event.title, threadId: `zaylist-updates-${event.id}-${person.id}`,
        });
        delivered++;
      }
      db.prepare("UPDATE zaylist_broadcasts SET recipient_count=? WHERE id=?").run(delivered,record.id);
      return { id: record.id, recipientCount: delivered };
    }).immediate();
    res.status(201).json({ ...record, delivery: "inbox" });
  });
  app.get(eventPath + "/broadcasts", requireAuth, viewerGuard, scope, (req, res) => {
    const viewer = res.locals.viewer;
    const event = res.locals.event as Event;
    if (!accessFor(event.id, viewer.id).editor) {
      res.status(403).json({ error: "Only editors can message the list" });
      return;
    }
    res.json({ broadcasts: store.broadcasts(event.id) });
  });

  // ---- Guest actions on an entry (holder only) ----
  const holderOnly: RequestHandler = (req, res, next) => {
    if (res.locals.entry.user_id !== res.locals.viewer.id) {
      res.status(403).json({ error: "This spot is not yours" });
      return;
    }
    next();
  };
  const entryPath = "/api/zaylist/entries/:entryId";

  app.post(entryPath + "/accept", requireAuth, viewerGuard, entryScope, holderOnly, (req, res) => {
    const entry = res.locals.entry;
    const token = store.accept(entry.id);
    if (!token) {
      res.status(409).json({ error: "This spot is no longer pending" });
      return;
    }
    const event = storage.getEvent(entry.event_id);
    if (event) ensureEventChatMembership(db, event, res.locals.viewer.id);
    const messages = store.messages(entry.event_id);
    const isTalent = store.isTalent(entry.event_id, res.locals.viewer.id);
    const talentBody =
      isTalent && messages?.talentMessageId
        ? (store.savedMessage(messages.talentMessageId)?.body ?? null)
        : null;
    res.json({
      token,
      message: messages?.generalBody || null,
      talentMessage: talentBody,
    });
  });

  app.post(entryPath + "/decline", requireAuth, viewerGuard, entryScope, holderOnly, (req, res) => {
    const entry = res.locals.entry;
    if (entry.state !== "pending" && entry.state !== "accepted") {
      res.status(409).json({ error: "This spot is already settled" });
      return;
    }
    store.setState(entry.id, "declined");
    store.revokeTokens(entry.id);
    res.json({ ok: true });
  });

  app.post(entryPath + "/gift", requireAuth, viewerGuard, entryScope, holderOnly, (req, res) => {
    const entry = res.locals.entry;
    if (entry.state !== "pending" && entry.state !== "accepted") {
      res.status(409).json({ error: "Only a live spot can be gifted" });
      return;
    }
    const target = resolveTarget(req.body ?? {});
    if (target === undefined) {
      res.status(404).json({ error: "Member unavailable" });
      return;
    }
    if (!target) {
      res.status(400).json({ error: "Give a member, an email, or a phone number" });
      return;
    }
    if (target.userId === res.locals.viewer.id) {
      res.status(400).json({ error: "You cannot gift a spot to yourself" });
      return;
    }
    if (target.userId && storage.isMemberInteractionBlocked(res.locals.viewer.id, target.userId)) return res.status(404).json({error:"Member unavailable"});
    const result = db.transaction(() => {
      const result = store.gift(
      entry,
      { userId: target.userId, contact: target.contact },
      res.locals.viewer.id,
    );
      if (result.ok) {
        if (!target.userId && target.contact && target.kind) {
          store.addInvite(entry.event_id, result.id, target.contact, target.kind, res.locals.viewer.id);
          operations.queueInvite(result.id);
        } else operations.notifyEntry(result.id);
      }
      return result;
    }).immediate();
    if (!result.ok) return spotError(res, result.error);
    res.status(201).json({ entry: store.entry(result.id) });
  });

  app.post(
    entryPath + "/token/regenerate",
    requireAuth,
    viewerGuard,
    entryScope,
    (req, res) => {
      const viewer = res.locals.viewer;
      const entry = res.locals.entry;
      const isHolder = entry.user_id === viewer.id;
      if (
        !isHolder &&
        !accessFor(entry.event_id, viewer.id).editor
      ) {
        res.status(403).json({ error: "You cannot regenerate this code" });
        return;
      }
      if (entry.state !== "accepted" && entry.state !== "redeemed") {
        res.status(409).json({ error: "Only an accepted spot has a code" });
        return;
      }
      res.json({ token: store.regenerateToken(entry.id) });
    },
  );

  app.get(entryPath + "/pass", requireAuth, viewerGuard, entryScope, holderOnly, (req, res) => {
    const entry = res.locals.entry;
    const event = storage.getEvent(entry.event_id);
    res.json({
      entryId: entry.id,
      wallets: walletAvailability(),
      state: entry.state,
      event: event
        ? { id: event.id, title: event.title, dateStart: event.dateStart, venueName: event.venueName }
        : null,
      token:
        entry.state === "accepted" || entry.state === "redeemed"
          ? (store.activeToken(entry.id)?.token ?? null)
          : null,
      drinks: serializeDrinks(entry.id),
    });
  });

  app.get(entryPath + "/pass/:format", requireAuth, viewerGuard, entryScope, holderOnly, async (req, res) => {
    const entry = res.locals.entry;
    const token = store.activeToken(entry.id)?.token;
    const event = storage.getEvent(entry.event_id);
    if (!event || !token || !["accepted", "redeemed"].includes(entry.state)) {
      return res.status(409).json({ error: "This entry has no active pass" });
    }
    const pass = { entryId: entry.id, token, title: event.title, venue: event.venueName || "", dateStart: event.dateStart };
    const wallets = walletAvailability();
    res.setHeader("Referrer-Policy", "no-referrer");
    switch (req.params.format) {
      case "pdf": return res.attachment("zaylist-guest-pass.pdf").type("application/pdf").send(await guestPassPdf(pass));
      case "apple":
        if (wallets.apple) return res.attachment("zaylist.pkpass").type("application/vnd.apple.pkpass").send(await appleGuestPass(pass));
        break;
      case "google":
        if (wallets.google) return res.redirect(303, googleGuestPass(pass));
        break;
      default: return res.sendStatus(404);
    }
    return res.status(503).json({ error: "This wallet issuer is not configured" });
  });

  // ---- Drink comps on a guest's code: privilege-gated ----
  app.post(entryPath + "/drinks", requireAuth, viewerGuard, entryScope, (req, res) => {
    const viewer = res.locals.viewer;
    const entry = res.locals.entry;
    if (!accessFor(entry.event_id, viewer.id).canGrantDrinks) {
      res.status(403).json({ error: "You do not hold the drink-comp privilege for this event" });
      return;
    }
    if (!LIVE_STATES.includes(entry.state)) {
      res.status(409).json({ error: "Drinks attach to a live spot on the list" });
      return;
    }
    const { kind, total, percent } = req.body ?? {};
    if (
      !["comp", "discount"].includes(kind) ||
      !Number.isInteger(total) ||
      total < 1 ||
      total > 100 ||
      (kind === "discount" &&
        (!Number.isInteger(percent) || percent < 1 || percent > 100))
    ) {
      res.status(400).json({ error: "Give a comp or discount, a count, and a percent for discounts" });
      return;
    }
    const id = store.attachDrink(
      entry.id,
      viewer.id,
      kind,
      total,
      kind === "discount" ? percent : null,
    );
    res.status(201).json({ id, drinks: serializeDrinks(entry.id) });
  });
  app.delete("/api/zaylist/drinks/:drinkId", requireAuth, viewerGuard, (req, res) => {
    const viewer = res.locals.viewer;
    const id = Number(req.params.drinkId);
    const grant = Number.isSafeInteger(id)
      ? (db
          .prepare(
            `SELECT g.id, g.entry_id AS entryId, g.granted_by AS grantedBy, e.event_id AS eventId
            FROM zaylist_drink_grants g JOIN zaylist_entries e ON e.id=g.entry_id WHERE g.id=?`,
          )
          .get(id) as
          | { id: number; entryId: number; grantedBy: number; eventId: number }
          | undefined)
      : undefined;
    if (!grant) {
      res.status(404).json({ error: "Drink comp unavailable" });
      return;
    }
    if (
      grant.grantedBy !== viewer.id &&
      !accessFor(grant.eventId, viewer.id).canGrantDrinks
    ) {
      res.status(403).json({ error: "You cannot revoke this drink comp" });
      return;
    }
    store.revokeDrink(grant.id);
    res.json({ ok: true });
  });

  // ---- The door: scanning (whole team) ----
  function scanAccess(req: { body?: { token?: unknown; eventId?: unknown } }, res: Response) {
    const viewer = res.locals.viewer;
    const token = typeof req.body?.token === "string" ? req.body.token.trim() : "";
    const entry = token ? store.entryByToken(token) : undefined;
    if (!entry || (req.body?.eventId !== undefined && req.body.eventId !== entry.event_id)) {
      res.status(404).json({ error: "Code not recognized for this event" });
      return undefined;
    }
    if (!accessFor(entry.event_id, viewer.id).team) {
      res.status(403).json({ error: "You are not on this event's team" });
      return undefined;
    }
    return { viewer, entry };
  }
  app.post("/api/zaylist/scan", requireAuth, viewerGuard, (req, res) => {
    const found = scanAccess(req, res);
    if (!found) return;
    const { viewer, entry } = found;
    if (entry.state === "pending") {
      res.status(409).json({ error: "This guest has not accepted their spot yet" });
      return;
    }
    if (entry.state !== "accepted" && entry.state !== "redeemed") {
      res.status(409).json({ error: "This spot is no longer valid" });
      return;
    }
    const result = store.scanEntry(entry, viewer.id);
    const guest = entry.user_id
      ? db
          .prepare("SELECT username, display_name AS displayName FROM users WHERE id=?")
          .get(entry.user_id)
      : { username: entry.contact, displayName: entry.contact };
    res.json({ ...result, guest });
  });
  app.post("/api/zaylist/scan/drink", requireAuth, viewerGuard, (req, res) => {
    const found = scanAccess(req, res);
    if (!found) return;
    const { viewer, entry } = found;
    if (entry.state !== "accepted" && entry.state !== "redeemed") {
      res.status(409).json({ error: "Drinks ride an accepted spot" });
      return;
    }
    const drinkGrantId = Number.isInteger(req.body?.drinkGrantId)
      ? req.body.drinkGrantId
      : undefined;
    const result = store.scanDrink(entry, viewer.id, drinkGrantId);
    if (!result.ok) {
      res.status(409).json({ error: "No drinks left on this code" });
      return;
    }
    res.json(result);
  });

  // ---- The guest's inbox surface + invite claiming ----
  app.get("/api/me/zaylist", requireAuth, viewerGuard, (req, res) => {
    const viewer = res.locals.viewer;
    res.setHeader("Cache-Control", "private, no-store");
    res.json({
      entries: store.myEntries(viewer.id),
      claimable: store.claimableInvites(viewer.email).length,
    });
  });
  app.post("/api/zaylist/invites/claim", requireAuth, viewerGuard, (req, res) => {
    const viewer = res.locals.viewer;
    const secret = req.body?.token;
    if (typeof secret === "string") {
      if (secret.length !== 43 || !operations.claim(secret,viewer)) return res.status(409).json({error:"This invitation is unavailable for this account"});
      return res.json({ claimed: 1 });
    }
    const matches = store.claimableInvites(viewer.email) as {entryId: number}[];
    for (const invite of matches) operations.queueInvite(invite.entryId);
    res.json({ claimed: 0, verificationRequested: !!matches.length });
  });

  return { store, accessFor, operations };
}
