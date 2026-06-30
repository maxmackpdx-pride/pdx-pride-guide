import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import {
  getEventTiming,
  isMissedConnectionPostable,
  isMissedConnectionLinkable,
  missedConnectionClosesAt,
} from "@shared/missedConnections";
import { EVENT_TALENT_ROLE_LABELS, isEventTalentRole, type EventTalentRole } from "@shared/eventTalent";
import {
  events, submissions, gigPosts, promoters, moderationRequests, attendances, users, messages, missedConnections,
  giftingPosts, giftingInterests, giftingReports, feedbackReports, hostMessages, eventHosts, eventTalent,
  type Event, type InsertEvent,
  type Submission, type InsertSubmission,
  type GigPost, type InsertGigPost,
  type Promoter, type InsertPromoter,
  type ModerationRequest, type InsertModerationRequest,
  type Attendance, type InsertAttendance,
  type User, type Message,
  type MissedConnection, type InsertMissedConnection,
  type GiftingPost, type InsertGiftingPost, type GiftingInterest, type InsertGiftingInterest, type InsertGiftingReport,
  type FeedbackReport, type InsertFeedbackReport,
  type HostMessage, type InsertHostMessage,
} from "@shared/schema";
import crypto from "crypto";

export const DB_PATH = process.env.DATABASE_PATH || "data.db";
export const sqlite = new Database(DB_PATH);
const db = drizzle(sqlite);

// Initialize tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    venue_name TEXT NOT NULL,
    address TEXT,
    neighborhood TEXT,
    lat REAL,
    lng REAL,
    date_start TEXT NOT NULL,
    date_end TEXT NOT NULL,
    day_of_week TEXT,
    age_requirement TEXT NOT NULL DEFAULT 'ALL_AGES',
    event_types TEXT NOT NULL DEFAULT '[]',
    admission TEXT NOT NULL DEFAULT 'FREE',
    ticket_url TEXT,
    is_public INTEGER NOT NULL DEFAULT 1,
    is_private INTEGER NOT NULL DEFAULT 0,
    is_house_party INTEGER NOT NULL DEFAULT 0,
    is_sex_positive INTEGER NOT NULL DEFAULT 0,
    nudity_ok INTEGER NOT NULL DEFAULT 0,
    poster_image_url TEXT,
    status TEXT NOT NULL DEFAULT 'LIVE',
    source TEXT NOT NULL DEFAULT 'admin_seeded',
    is_claimable INTEGER NOT NULL DEFAULT 0,
    claimed_by TEXT,
    submitted_by TEXT,
    admin_notes TEXT,
    created_at TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL DEFAULT 'NEW_EVENT',
    event_id INTEGER,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    venue_name TEXT NOT NULL,
    address TEXT,
    neighborhood TEXT,
    lat REAL,
    lng REAL,
    date_start TEXT NOT NULL,
    date_end TEXT NOT NULL,
    day_of_week TEXT,
    age_requirement TEXT NOT NULL DEFAULT 'ALL_AGES',
    event_types TEXT NOT NULL DEFAULT '[]',
    admission TEXT NOT NULL DEFAULT 'FREE',
    ticket_url TEXT,
    is_public INTEGER NOT NULL DEFAULT 1,
    is_private INTEGER NOT NULL DEFAULT 0,
    is_house_party INTEGER NOT NULL DEFAULT 0,
    is_sex_positive INTEGER NOT NULL DEFAULT 0,
    nudity_ok INTEGER NOT NULL DEFAULT 0,
    poster_image_url TEXT,
    submitter_name TEXT NOT NULL,
    submitter_email TEXT NOT NULL,
    submitter_org TEXT,
    claim_reason TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    admin_notes TEXT,
    approvals TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS gig_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_type TEXT NOT NULL DEFAULT 'POSTING_GIG',
    title TEXT NOT NULL,
    name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    description TEXT NOT NULL,
    skills TEXT,
    compensation TEXT,
    location TEXT,
    is_remote INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'PENDING',
    created_at TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS promoters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    org TEXT,
    password_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS moderation_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    event_id INTEGER NOT NULL,
    event_title TEXT NOT NULL,
    requester_name TEXT NOT NULL,
    requester_email TEXT NOT NULL,
    proof TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    admin_notes TEXT,
    created_at TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS attendances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    user_id INTEGER,
    handle TEXT NOT NULL,
    message TEXT NOT NULL,
    avatar_seed TEXT NOT NULL,
    photo_url TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    avatar_choice INTEGER DEFAULT 1,
    bio TEXT,
    photo_url TEXT,
    google_id TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_user_id INTEGER NOT NULL,
    to_user_id INTEGER NOT NULL,
    subject TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0,
    thread_id TEXT NOT NULL,
    context_type TEXT NOT NULL DEFAULT 'THREAD',
    context_id INTEGER,
    context_label TEXT,
    deleted_by_from INTEGER NOT NULL DEFAULT 0,
    deleted_by_to INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS missed_connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    day_of_week TEXT,
    venue_hint TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS gifting_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    post_type TEXT NOT NULL DEFAULT 'GIFT',
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    neighborhood TEXT NOT NULL,
    pickup_preference TEXT NOT NULL,
    photo_urls TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'OPEN',
    selected_interest_id INTEGER,
    renew_count INTEGER NOT NULL DEFAULT 0,
    expires_at TEXT NOT NULL,
    report_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS gifting_interests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    note TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'INTERESTED',
    created_at TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS gifting_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    reporter_user_id INTEGER NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    admin_notes TEXT,
    created_at TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS feedback_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_url TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'BUG',
    severity TEXT NOT NULL DEFAULT 'MEDIUM',
    message TEXT NOT NULL,
    steps TEXT,
    email TEXT,
    user_agent TEXT,
    status TEXT NOT NULL DEFAULT 'OPEN',
    created_at TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS site_admin_grants (
    user_id INTEGER PRIMARY KEY,
    granted_by_user_id INTEGER,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT ''
  );
`);

// Add new columns to gig_posts if not present (SQLite doesn't support IF NOT EXISTS on ALTER)
let gigPostsLegacyCols = false;

function ensureGigPostsSchema() {
  const table = sqlite.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'gig_posts'`).get();
  if (!table) return;

  const columns = sqlite.prepare(`PRAGMA table_info(gig_posts)`).all() as Array<{ name: string }>;
  const colNames = new Set(columns.map((c) => c.name));

  const addColumn = (sql: string) => {
    try { sqlite.exec(sql); } catch (e) { console.error("gig_posts migration failed:", sql, e); }
  };

  if (!colNames.has("post_type")) {
    addColumn(`ALTER TABLE gig_posts ADD COLUMN post_type TEXT NOT NULL DEFAULT 'POSTING_GIG'`);
  }
  if (colNames.has("type")) {
    addColumn(`UPDATE gig_posts SET post_type = COALESCE(NULLIF(type, ''), 'POSTING_GIG')`);
  }
  if (!colNames.has("contact_email")) addColumn(`ALTER TABLE gig_posts ADD COLUMN contact_email TEXT NOT NULL DEFAULT ''`);
  if (!colNames.has("skills")) addColumn(`ALTER TABLE gig_posts ADD COLUMN skills TEXT`);
  if (!colNames.has("compensation")) addColumn(`ALTER TABLE gig_posts ADD COLUMN compensation TEXT`);
  if (!colNames.has("location")) addColumn(`ALTER TABLE gig_posts ADD COLUMN location TEXT`);
  if (!colNames.has("is_remote")) addColumn(`ALTER TABLE gig_posts ADD COLUMN is_remote INTEGER DEFAULT 0`);

  const finalColumns = sqlite.prepare(`PRAGMA table_info(gig_posts)`).all() as Array<{ name: string }>;
  console.log("[gig_posts] schema columns:", finalColumns.map((c) => c.name).join(", "));
  gigPostsLegacyCols = finalColumns.some(c => c.name === "type") && finalColumns.some(c => c.name === "role");
}
ensureGigPostsSchema();

function legacyGigRole(postType: string) {
  return postType === "LOOKING_FOR_WORK" ? "Talent" : "Gig";
}

function mapMessageRow(row: Record<string, unknown>): any {
  return {
    ...row,
    id: row.id as number,
    fromUserId: (row.fromUserId ?? row.from_user_id) as number,
    toUserId: (row.toUserId ?? row.to_user_id) as number,
    subject: row.subject as string,
    body: row.body as string,
    isRead: Boolean(row.isRead ?? row.is_read),
    threadId: String(row.threadId ?? row.thread_id ?? ""),
    contextType: String(row.contextType ?? row.context_type ?? "THREAD"),
    contextId: (row.contextId ?? row.context_id ?? null) as number | null,
    contextLabel: (row.contextLabel ?? row.context_label ?? null) as string | null,
    deletedByFrom: Boolean(row.deletedByFrom ?? row.deleted_by_from),
    deletedByTo: Boolean(row.deletedByTo ?? row.deleted_by_to),
    createdAt: String(row.createdAt ?? row.created_at ?? ""),
  };
}

function mapGigPostRow(row: Record<string, unknown>): GigPost {
  return {
    id: row.id as number,
    postType: String(row.post_type ?? row.type ?? "POSTING_GIG"),
    title: row.title as string,
    name: row.name as string,
    contactEmail: row.contact_email as string,
    description: row.description as string,
    skills: (row.skills as string | null) ?? null,
    compensation: (row.compensation as string | null) ?? null,
    location: (row.location as string | null) ?? null,
    isRemote: Boolean(row.is_remote),
    status: row.status as string,
    createdAt: row.created_at as string,
    userId: (row.user_id as number | null) ?? null,
    imageUrl: (row.image_url as string | null) ?? null,
    gigDate: (row.gig_date as string | null) ?? null,
    gigTime: (row.gig_time as string | null) ?? null,
  };
}

function insertGigPostCompat(payload: InsertGigPost & { status: string; createdAt: string }): GigPost {
  if (gigPostsLegacyCols) {
    const result = sqlite.prepare(`
      INSERT INTO gig_posts (
        type, role, post_type, title, name, contact_email, description,
        skills, compensation, location, is_remote, status, created_at, user_id
      ) VALUES (
        @postType, @role, @postType, @title, @name, @contactEmail, @description,
        @skills, @compensation, @location, @isRemote, @status, @createdAt, @userId
      )
    `).run({
      postType: payload.postType,
      role: legacyGigRole(payload.postType),
      title: payload.title,
      name: payload.name,
      contactEmail: payload.contactEmail,
      description: payload.description,
      skills: payload.skills ?? null,
      compensation: payload.compensation ?? null,
      location: payload.location ?? null,
      isRemote: payload.isRemote ? 1 : 0,
      status: payload.status,
      createdAt: payload.createdAt,
      userId: payload.userId ?? null,
    });
    const row = sqlite.prepare(`SELECT * FROM gig_posts WHERE id = ?`).get(result.lastInsertRowid) as Record<string, unknown>;
    return mapGigPostRow(row);
  }
  return db.insert(gigPosts).values(payload as any).returning().get();
}

try { sqlite.exec(`ALTER TABLE gig_posts ADD COLUMN user_id INTEGER`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE gig_posts ADD COLUMN image_url TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE gig_posts ADD COLUMN gig_date TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE gig_posts ADD COLUMN gig_time TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN photo_url TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN google_id TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN avatar_ring TEXT DEFAULT 'none'`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN avatar_crop TEXT`); } catch(e) {}
try { sqlite.exec(`CREATE UNIQUE INDEX IF NOT EXISTS users_google_id_unique ON users(google_id)`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE attendances ADD COLUMN user_id INTEGER`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE attendances ADD COLUMN photo_url TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE attendances ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE messages ADD COLUMN context_type TEXT NOT NULL DEFAULT 'THREAD'`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE messages ADD COLUMN context_id INTEGER`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE messages ADD COLUMN context_label TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE messages ADD COLUMN deleted_by_from INTEGER NOT NULL DEFAULT 0`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE messages ADD COLUMN deleted_by_to INTEGER NOT NULL DEFAULT 0`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN promoter_status TEXT NOT NULL DEFAULT 'none'`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN sub_admin INTEGER NOT NULL DEFAULT 0`); } catch(e) {}
try { sqlite.exec(`
  CREATE TABLE IF NOT EXISTS host_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT ''
  )
`); } catch(e) {}

const MAX_EVENT_HOSTS = 3;

function ensureEventHostsSchema() {
  try {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS event_hosts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        role TEXT NOT NULL DEFAULT 'COHOST',
        added_by_user_id INTEGER,
        created_at TEXT NOT NULL DEFAULT '',
        UNIQUE(event_id, user_id)
      )
    `);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS event_hosts_event_idx ON event_hosts(event_id)`);
  } catch (e) {
    console.error("[event_hosts] schema migration failed:", e);
  }
}
ensureEventHostsSchema();

function ensureEventTalentSchema() {
  try {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS event_talent (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'LIVE',
        added_by_user_id INTEGER,
        created_at TEXT NOT NULL DEFAULT '',
        UNIQUE(event_id, user_id, role)
      )
    `);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS event_talent_event_idx ON event_talent(event_id)`);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS event_talent_status_idx ON event_talent(status)`);
  } catch (e) {
    console.error("[event_talent] schema migration failed:", e);
  }
}
ensureEventTalentSchema();

function ensureMissedConnectionsSchema() {
  try {
    const cols = sqlite.prepare(`PRAGMA table_info(missed_connections)`).all() as Array<{ name: string }>;
    const names = new Set(cols.map(c => c.name));
    if (!names.has("event_id")) sqlite.exec(`ALTER TABLE missed_connections ADD COLUMN event_id INTEGER`);
    if (!names.has("closes_at")) sqlite.exec(`ALTER TABLE missed_connections ADD COLUMN closes_at TEXT`);
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS missed_connection_threads (
        thread_id TEXT PRIMARY KEY,
        missed_connection_id INTEGER NOT NULL,
        poster_user_id INTEGER NOT NULL,
        replier_user_id INTEGER NOT NULL,
        poster_revealed INTEGER NOT NULL DEFAULT 0,
        replier_revealed INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT ''
      )
    `);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS missed_conn_event_idx ON missed_connections(event_id)`);
    sqlite.exec(`
      UPDATE missed_connections
      SET closes_at = datetime(created_at, '+7 days')
      WHERE closes_at IS NULL AND created_at != ''
    `);
  } catch (e) {
    console.error("[missed_connections] schema migration failed:", e);
  }
}
ensureMissedConnectionsSchema();

const LEGACY_PASSWORD_SALT = "pdxpride_salt";
const SCRYPT_HASH_PREFIX = "$scrypt$";

function legacyPasswordHash(pw: string) {
  return crypto.createHash("sha256").update(pw + LEGACY_PASSWORD_SALT).digest("hex");
}

export function isLegacyPasswordHash(stored: string) {
  return !stored.startsWith(SCRYPT_HASH_PREFIX);
}

export function hashPassword(pw: string) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(pw, salt, 64);
  return `${SCRYPT_HASH_PREFIX}${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(pw: string, stored: string) {
  if (stored.startsWith(SCRYPT_HASH_PREFIX)) {
    const payload = stored.slice(SCRYPT_HASH_PREFIX.length);
    const [saltHex, hashHex] = payload.split(":");
    if (!saltHex || !hashHex) return false;
    const derived = crypto.scryptSync(pw, Buffer.from(saltHex, "hex"), 64);
    const expected = Buffer.from(hashHex, "hex");
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  }
  const legacy = legacyPasswordHash(pw);
  if (legacy.length !== stored.length) return false;
  return crypto.timingSafeEqual(Buffer.from(legacy), Buffer.from(stored));
}

// Old fake event titles used to detect stale seed data
const OLD_SEED_TITLES = ["Queer Dance Party", "Leather Pride Social", "Drag Extravaganza", "Pride Brunch", "Kink & Community Fair", "Trans Joy Dance"];
const SEED_EVENT_TARGET = 46;

function seedData() {
  const existing = db.select().from(events).all();

  if (existing.length > 0) {
    const isProduction = process.env.NODE_ENV === "production";
    const allowReseed = process.env.ALLOW_SEED_RESEED === "true";
    const hasLegacySeed =
      OLD_SEED_TITLES.includes(existing[0].title) ||
      existing.some((e: any) => e.title === "Bearracuda Portland Pride Saturday" && e.address === "18 NW 3rd Ave, Portland, OR 97209");
    const needsDevRepair =
      !isProduction &&
      (existing[0].lat === null || existing[0].posterImageUrl === null || existing.length < SEED_EVENT_TARGET);
    const needsReseed =
      (hasLegacySeed && (!isProduction || allowReseed)) ||
      needsDevRepair;
    if (needsReseed) {
      // Only replace admin seed events — never wipe user gigs, claims, or submissions.
      sqlite.exec(`
        DELETE FROM attendances
        WHERE event_id IN (
          SELECT id FROM events
          WHERE source = 'admin_seeded' AND claimed_by IS NULL AND submitted_by IS NULL
        )
      `);
      sqlite.exec(`
        DELETE FROM events
        WHERE source = 'admin_seeded' AND claimed_by IS NULL AND submitted_by IS NULL
      `);
    } else {
      return;
    }
  }

  const now = new Date().toISOString();

  const seedEvents = [
    {
      title: "Portland Pride Waterfront Festival",
      description: "2026 theme 'Made with Pride' — celebrates creativity and entrepreneurship in Portland LGBTQ2SIA+ community. Live music (Lushious Massacr, DeJa Skye, Tenderoni), makers' market, food/drink vendors, nonprofit booths. $10 suggested donation.",
      venueName: "Tom McCall Waterfront Park",
      address: "98 SW Naito Pkwy, Portland, OR 97204",
      neighborhood: "Downtown",
      lat: 45.5201241, lng: -122.6727,
      dateStart: "2026-07-18T12:00:00", dateEnd: "2026-07-19T18:00:00",
      dayOfWeek: "SAT",
      ageRequirement: "ALL_AGES",
      eventTypes: JSON.stringify(["FESTIVAL", "OFFICIAL", "FAMILY"]),
      admission: "TICKETED",
      ticketUrl: "https://portlandpride.org/festival-1",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/portland-pride-waterfront.png",
      status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Portland Pride Parade",
      description: "Annual Pride parade ending at the Waterfront Festival. A Portland tradition celebrating the community.",
      venueName: "North Park Blocks to Naito Pkwy",
      address: "NW Park Ave & W Burnside St, Portland, OR 97209",
      neighborhood: "Downtown",
      lat: 45.523011535188, lng: -122.679071017042,
      dateStart: "2026-07-19T11:00:00", dateEnd: "2026-07-19T23:59:00",
      dayOfWeek: "SUN",
      ageRequirement: "ALL_AGES",
      eventTypes: JSON.stringify(["PARADE", "FREE", "OFFICIAL", "MARCH", "FAMILY"]),
      admission: "FREE",
      ticketUrl: "https://portlandpride.org/pride-parade-1",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/portland-pride-parade.png", status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "INFERNO PRIDE PORTLAND 2026",
      description: "Indoor + outdoor party with go-go dancers, DJ Lauren 6-8PM, DJ Wild Fire 8-10PM, games. $20 presale, $25 door.",
      venueName: "Formerly Opaline",
      address: "105 NW 3rd Ave, Portland, OR 97209",
      neighborhood: "Old Town",
      lat: 45.523910631013, lng: -122.673490367742,
      dateStart: "2026-07-18T18:00:00", dateEnd: "2026-07-18T22:00:00",
      dayOfWeek: "SAT",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["PARTY", "DANCE", "DJS"]),
      admission: "TICKETED",
      ticketUrl: "https://queersocialclub.com/events-portland/inferno-pride-a-hot-flash-production",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/inferno-pride-portland.png", status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Portland Pride Ride",
      description: "Casual bike ride celebrating LGBTQIA+ community. Helmets required. Ends at 503 Distilling (2671 NW Vaughn St) with parking lot party. Free, all ages.",
      venueName: "Trek Bicycle Portland Slabtown",
      address: "1560 NW 21st Ave, Portland, OR 97209",
      neighborhood: "Northwest District",
      lat: 45.533853999172, lng: -122.694620295627,
      dateStart: "2026-07-18T17:30:00", dateEnd: "2026-07-18T20:30:00",
      dayOfWeek: "SAT",
      ageRequirement: "ALL_AGES",
      eventTypes: JSON.stringify(["BIKE", "FREE", "OUTDOOR"]),
      admission: "FREE",
      ticketUrl: "https://www.eventbrite.com/e/portland-pride-ride-tickets-1986662549164",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/portland-pride-ride.jpg", status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Lez Out Pride Brunch",
      description: "Lesbian drag brunch hosted by Shandi Evans & Harlow Quinzel. DJ Dilemma, performers Fay Ludes, Venereal Denise, RIOT! $30 GA, $60 VIP includes brunch plate and raffle.",
      venueName: "Bullard Tavern",
      address: "813 SW Alder St, Portland, OR 97205",
      neighborhood: "Downtown",
      lat: 45.520354445654, lng: -122.680322721883,
      dateStart: "2026-07-18T12:00:00", dateEnd: "2026-07-18T16:00:00",
      dayOfWeek: "SAT",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["BRUNCH", "DRAG", "LESBIAN"]),
      admission: "TICKETED",
      ticketUrl: "https://www.sickening.events/e/lez-out-drag-brunch/tickets",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/lez-out-pride-brunch.jpg",
      status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "RADIANCE by Gaylabration",
      description: "Dance party with headliner Matt Suave, Poundstar, Mircat Dragonfae, Bro Hoe Sappho. Sponsor Q care+ highlighting PrEP/doxy-PEP.",
      venueName: "McMenamins Crystal Ballroom",
      address: "1332 W Burnside St, Portland, OR 97209",
      neighborhood: "Pearl District",
      lat: 45.5228, lng: -122.6851,
      dateStart: "2026-07-18T21:00:00", dateEnd: "2026-07-19T03:00:00",
      dayOfWeek: "SAT",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["PARTY", "DANCE PARTY", "DRAG"]),
      admission: "TICKETED",
      ticketUrl: "https://www.etix.com/ticket/p/48507801/radiance-portland-mcmenamins-crystal-ballroom-hotel-portlandor",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/radiance-gaylabration.jpg",
      status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Stank Yes Coach — PDX PRIDE",
      description: "Sports-themed party with DJs JUMPR, Bro Hoe, Lake Everett, Spencer Adam, Tucker Max. Leather community sponsors.",
      venueName: "Sanctuary Club",
      address: "33 NW 9th Ave, Portland, OR 97209",
      neighborhood: "Pearl District",
      lat: 45.523244045755, lng: -122.680179337043,
      dateStart: "2026-07-18T21:00:00", dateEnd: "2026-07-19T02:00:00",
      dayOfWeek: "SAT",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["PARTY", "SPORTS", "LEATHER"]),
      admission: "TICKETED",
      ticketUrl: "https://members.pdxsanctuary.com/events/93071",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: true, nudityOk: true,
      posterImageUrl: "/posters/stank-yes-coach.jpg",
      status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Certified Freak Block Party",
      description: "Drag queens, circus acrobats, avant-garde fashion, aura photos, tarot readings. Benefits Basic Rights Oregon. Suggested donation $20, VIP $50.",
      venueName: "Happylucky (Now Serving)",
      address: "330 SE 6th Ave, Portland, OR 97214",
      neighborhood: "Central Eastside",
      lat: 45.520548409717, lng: -122.65962726452,
      dateStart: "2026-07-18T18:00:00", dateEnd: "2026-07-19T00:00:00",
      dayOfWeek: "SAT",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["PARTY", "DRAG", "BLOCK-PARTY", "FUNDRAISER"]),
      admission: "TICKETED",
      ticketUrl: "https://events.humanitix.com/happylucky-presents-certified-freak-pride-2026",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/certified-freak-block-party.jpg",
      status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Horse Meat Disco TUFF",
      description: "Official Pride night celebrating underground dance floors & leather bars. DJ Nick Bertossi. Portion of proceeds to Portland Pride.",
      venueName: "Crystal Ballroom",
      address: "1332 W Burnside St, Portland, OR 97209",
      neighborhood: "Pearl District",
      lat: 45.5228, lng: -122.6851,
      dateStart: "2026-07-17T21:00:00", dateEnd: "2026-07-18T02:00:00",
      dayOfWeek: "FRI",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["PARTY", "DANCE PARTY", "LEATHER", "OFFICIAL"]),
      admission: "TICKETED",
      ticketUrl: "https://www.eventbrite.com/e/horse-meat-disco-tuff-pdx-pride-debut-registration-1989693920076",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/horse-meat-disco-tuff.jpg",
      status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Pride in Demand — Portland Queer Takeover — Night 1",
      description: "Night 1 of DotGay's Pride in Demand Portland Queer Takeover at Star Theater. Queer superhero theme. Friday July 17, 2026 at 9pm.",
      venueName: "Star Theater and Starlight Lounge",
      address: "13 NW 6th Ave, Portland, OR 97209",
      neighborhood: "Old Town",
      lat: 45.523204065035, lng: -122.676518408183,
      dateStart: "2026-07-17T21:00:00", dateEnd: "2026-07-17T23:59:00",
      dayOfWeek: "FRI",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["PARTY", "TAKEOVER", "MULTI-DAY"]),
      admission: "TICKETED",
      ticketUrl: "https://www.startheaterportland.com/tm-event/pride-in-demand-portland-queer-takeover/",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/pride-in-demand.jpg", status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Lumbertwink Plaid Patio Pride",
      description: "Pride Sunday afternoon patio party at Jackie's. Plaid-themed. DJs Not That Jennifer & Orographic. Sexy lumber go-gos, photo booth by Matty Hoffman. Discounted entry for plaid. 2 patios, 2 bars, air-conditioned indoors, VIP area. $18.69 (Plaid) / $29.45 (Non-Plaid).",
      venueName: "Jackie's",
      address: "930 SE Sandy Blvd, Portland, OR 97214",
      neighborhood: "SE Portland",
      lat: 45.5192, lng: -122.6478,
      dateStart: "2026-07-19T15:00:00", dateEnd: "2026-07-19T21:00:00",
      dayOfWeek: "SUN",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["PARTY", "OUTDOOR", "T-DANCE"]),
      admission: "TICKETED",
      ticketUrl: "https://sickening.events/e/lumberpride",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/lumbertwink-bearracuda.jpg",
      status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Gay Witch Appreciation Day + Pride at Seagrape",
      description: "Witch-themed Pride event at apothecary. All are welcome.",
      venueName: "Seagrape Apothecary",
      address: "2823 NE Sandy Blvd, Portland, OR 97232",
      neighborhood: "NE Portland",
      lat: 45.533, lng: -122.6327,
      dateStart: "2026-07-18T11:00:00", dateEnd: "2026-07-18T17:00:00",
      dayOfWeek: "SAT",
      ageRequirement: "ALL_AGES",
      eventTypes: JSON.stringify(["DAYTIME", "MARKET", "WITCH"]),
      admission: "TICKETED",
      ticketUrl: "https://www.eventbrite.com/e/gay-witch-appreciation-day-pride-at-seagrape-tickets-1988446704621",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/gay-witch-appreciation-day.jpg", status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Sasha Colby Pride Kick-Off",
      description: "Headline performance by drag queen Sasha Colby for Portland Pride Kick-Off.",
      venueName: "Star Theater",
      address: "13 NW 6th Ave, Portland, OR 97209",
      neighborhood: "Old Town",
      lat: 45.523204065035, lng: -122.676518408183,
      dateStart: "2026-07-16T20:00:00", dateEnd: "2026-07-16T23:59:00",
      dayOfWeek: "THU",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["DRAG", "HEADLINE", "KICKOFF"]),
      admission: "TICKETED",
      ticketUrl: "https://www.startheaterportland.com/tm-event/sasha-colby-pride-weekend-kickoff-drag-show/",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/sasha-colby-pride-kickoff.jpg",
      status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Treasure Trail Portland Pride",
      description: "Bearracuda's Pride Friday kick-off at Sanctuary. DJ TIGERBEATZ (Seattle), hosted by JP Hardy. Wristband color system at the door (red=top, blue=vers, green=bottom, white=side). Venmo tickets available with no surcharge.",
      venueName: "Sanctuary",
      address: "33 NW 9th Ave, Portland, OR 97209",
      neighborhood: "Pearl District",
      lat: 45.523244045755, lng: -122.680179337043,
      dateStart: "2026-07-17T20:00:00", dateEnd: "2026-07-18T02:00:00",
      dayOfWeek: "FRI",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["PARTY", "DANCE", "BEAR"]),
      admission: "TICKETED",
      ticketUrl: "https://bearracuda.com/events/treasurepdx/",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/treasure-trail-portland-pride.jpg", status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Bearracuda Pride Friday — Vaseline Alley",
      description: "Theme: VASELINE ALLEY. Harnesses, jockstraps, and fetish gear encouraged. DJs Matt Consola (PDX) + Cactuhead (UK). Hosted by Matt Bearracuda & JP Hardy. $28. Venmo tickets at will call.",
      venueName: "722 E Burnside",
      address: "722 E Burnside St, Portland, OR 97214",
      neighborhood: "Inner East",
      lat: 45.5234, lng: -122.6574,
      dateStart: "2026-07-17T21:00:00", dateEnd: "2026-07-18T03:00:00",
      dayOfWeek: "FRI",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["PARTY", "DANCE", "BEAR"]),
      admission: "TICKETED",
      ticketUrl: "https://bearracuda.com/events/portland-pridefriday/",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/bearracuda-pride-friday.jpg", status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Bearracuda Portland Pride Saturday",
      description: "Bearracuda's Pride Saturday night at Nova PDX. Final tier tickets. All admirers and respectful partygoers welcome.",
      venueName: "Nova PDX",
      address: "722 E Burnside St, Portland, OR 97214",
      neighborhood: "Inner East",
      lat: 45.5234, lng: -122.6574,
      dateStart: "2026-07-18T21:00:00", dateEnd: "2026-07-19T03:00:00",
      dayOfWeek: "SAT",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["PARTY", "DANCE", "BEAR"]),
      admission: "TICKETED",
      ticketUrl: "https://bearracuda.com/events/portland-pride-saturday/",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: true, nudityOk: true,
      posterImageUrl: "/posters/bearracuda-pride-saturday.jpg", status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Portland Pickles Pride Night",
      description: "Pride baseball game vs Gresham Greywolves at Walker Stadium. On-field activities, vendors. Family-friendly. From $12.",
      venueName: "Walker Stadium",
      address: "4727 SE 92nd Ave, Portland, OR 97266",
      neighborhood: "SE Portland",
      lat: 45.488275046554, lng: -122.568698568388,
      dateStart: "2026-07-16T19:05:00", dateEnd: "2026-07-16T22:00:00",
      dayOfWeek: "THU",
      ageRequirement: "ALL_AGES",
      eventTypes: JSON.stringify(["SPORTS", "FAMILY", "OUTDOOR"]),
      admission: "TICKETED",
      ticketUrl: "https://www.picklestickets.com/event/pickles-all-stars-vs-gresham-greywolves-presente-cflvs4",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/portland-pickles-pride-night.png", status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Ankeny Alley Pride Block Party",
      description: "Official PrideNW block party in Old Town's Ankeny Alley. Two days of outdoor celebration, local vendors, and community gathering. Free and all ages.",
      venueName: "Ankeny Alley",
      address: "SW Ankeny St, Portland, OR 97204",
      neighborhood: "Old Town",
      lat: 45.522552534626, lng: -122.673342518027,
      dateStart: "2026-07-18T13:00:00", dateEnd: "2026-07-18T18:00:00",
      dayOfWeek: "SAT",
      ageRequirement: "ALL_AGES",
      eventTypes: JSON.stringify(["BLOCK-PARTY", "OFFICIAL", "FREE", "OUTDOOR"]),
      admission: "FREE",
      ticketUrl: "https://portlandpride.org/2026-portland-pride-official-events",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/ankeny-alley-pride.jpg", status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Midtown Beer Garden Pride",
      description: "Official PrideNW outdoor beer garden open Thursday through Sunday. Community drinks and Pride energy just outside the main festival footprint.",
      venueName: "Midtown Beer Garden",
      address: "SW 3rd Ave & SW Morrison St, Portland, OR 97204",
      neighborhood: "Downtown",
      lat: 45.520091, lng: -122.677007,
      dateStart: "2026-07-17T17:00:00", dateEnd: "2026-07-20T20:00:00",
      dayOfWeek: "FRI",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["BAR", "OFFICIAL", "OUTDOOR", "MULTI-DAY"]),
      admission: "FREE",
      ticketUrl: "https://portlandpride.org/2026-portland-pride-official-events",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: null, status: "HIDDEN", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "NE Portland Pride & LGBTQ+ Resource Fair",
      description: "Community-organized Pride block on NE 30th Ave. Local vendors, LGBTQ+ resources, food, live entertainment. Free and family-friendly. Hosted by Take Two & Javier Puga-Phillips.",
      venueName: "NE 30th Ave",
      address: "NE 30th Ave between Killingsworth & Emerson, Portland, OR 97211",
      neighborhood: "NE Portland",
      lat: 45.5630, lng: -122.6457,
      dateStart: "2026-07-19T15:00:00", dateEnd: "2026-07-19T21:00:00",
      dayOfWeek: "SUN",
      ageRequirement: "ALL_AGES",
      eventTypes: JSON.stringify(["BLOCK-PARTY", "COMMUNITY", "FREE", "OUTDOOR", "FAMILY"]),
      admission: "FREE",
      ticketUrl: "https://www.eventbrite.com/e/portland-pride-ne-2026-tickets-1990118485964",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/ne-portland-pride-resource-fair.jpg", status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "The Sports Bra Pride Block Party",
      description: "5th Annual Pride Block Party. Live DJ sets, weightlifting competition, dance performances, games, food carts, cocktails, shave ice, kid-friendly activities. $25-35 (Equity: $15, Youth: $12, Under 5 free).",
      venueName: "The Sports Bra",
      address: "2512 NE Broadway, Portland, OR 97232",
      neighborhood: "NE Portland",
      lat: 45.5302, lng: -122.6502,
      dateStart: "2026-07-19T13:00:00", dateEnd: "2026-07-19T22:00:00",
      dayOfWeek: "SUN",
      ageRequirement: "ALL_AGES",
      eventTypes: JSON.stringify(["BLOCK-PARTY", "SPORTS", "COMMUNITY"]),
      admission: "TICKETED",
      ticketUrl: "https://www.eventbrite.com/e/the-sports-bra-pride-block-party-tickets-1990528264623",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/sports-bra-pride-block-party.jpg", status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Yes Sir Gay Dance Party",
      description: "Secret warehouse dance party. Gay underwear night featuring DJ Ottogyro. Location revealed to ticket holders only. 21+ only.",
      venueName: "REALM PDX",
      address: "615 SE Alder St, Portland, OR 97214",
      neighborhood: "SE Portland",
      lat: 45.51799282917, lng: -122.659516684784,
      dateStart: "2026-07-19T21:00:00", dateEnd: "2026-07-20T02:00:00",
      dayOfWeek: "SUN",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["PARTY", "DANCE PARTY", "WAREHOUSE"]),
      admission: "TICKETED",
      ticketUrl: "https://shotgun.live/en/events/yes-sir-portland-pride-2026",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: true, nudityOk: true,
      posterImageUrl: "/posters/yes-sir-gay-dance-party.jpg", status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Portland Pride Drag Brunch at Stag PDX",
      description: "All-ages drag brunch at Stag PDX in the Pearl District. Two-day run of performances, mimosas, and weekend Pride energy.",
      venueName: "Stag PDX",
      address: "317 NW Broadway, Portland, OR 97209",
      neighborhood: "Pearl District",
      lat: 45.525333665978, lng: -122.677601642236,
      dateStart: "2026-07-18T11:00:00", dateEnd: "2026-07-18T15:00:00",
      dayOfWeek: "SAT",
      ageRequirement: "ALL_AGES",
      eventTypes: JSON.stringify(["BRUNCH", "DRAG"]),
      admission: "TICKETED",
      ticketUrl: "https://www.eventbrite.com/e/portland-pride-drag-brunch-saturday-tickets-1989269042255",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/stag-pdx-drag-brunch-saturday.jpg", status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "BOYeurism: Pride Spectacular",
      description: "An explosive celebration of queerness from IZOHNNY — Isaiah Esquire & Johnny Nuriel, the Goliaths of Glam. Drag, burlesque, circus, and dance. Internationally acclaimed, unapologetically queer, fiercely inclusive. Featuring legendary icons.",
      venueName: "Alberta Rose Theatre",
      address: "3000 NE Alberta St, Portland, OR 97211",
      neighborhood: "Alberta Arts District",
      lat: 45.5581, lng: -122.6478,
      dateStart: "2026-07-18T20:00:00", dateEnd: "2026-07-18T23:00:00",
      dayOfWeek: "SAT",
      ageRequirement: "ALL_AGES",
      eventTypes: JSON.stringify(["DRAG", "BURLESQUE", "PERFORMANCE"]),
      admission: "TICKETED",
      ticketUrl: "https://albertarosetheatre.com/event/boyeurism-9/",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/boyeurism-pride-spectacular.jpg", status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Twirl! PDX Queer Disco — Pride Edition (HOLD)",
      description: "PDX Queer Disco Pride Edition at Green Anchors in St. Johns — an outdoor eco-park under the St. Johns Bridge. Disco, funk, and house sounds. Special guest performances. Food and craft vendors, outdoor space with Willamette River views.",
      venueName: "Green Anchors",
      address: "8940 N Bradford St, Portland, OR 97203",
      neighborhood: "St. Johns",
      lat: 45.5882, lng: -122.7478,
      dateStart: "2026-07-20T15:00:00", dateEnd: "2026-07-20T22:30:00",
      dayOfWeek: "MON",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["PARTY", "DANCE", "OUTDOOR"]),
      admission: "TICKETED",
      ticketUrl: "https://events.humanitix.com/twirl-pdx-queer-disco-pride-edition",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: null, status: "HIDDEN", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: "Hold: 2025 Humanitix link, no 2026 source confirmed", createdAt: now,
    },
    {
      title: "Chai & Roses Pride Party",
      description: "A Sunday tea dance for QTBIPOC & allies. DJs Suavecito (Reyna Tropical) + DJ Anjali. Performances by Blossom Drearie, Chiffon Cherie, Hibiscus Lust. MC Armaan Singh. Co-hosted with PDX Queer Asians.",
      venueName: "Holocene",
      address: "1001 SE Morrison St, Portland, OR 97214",
      neighborhood: "SE Portland",
      lat: 45.517263828809, lng: -122.65558925207,
      dateStart: "2026-07-19T19:00:00", dateEnd: "2026-07-19T23:00:00",
      dayOfWeek: "SUN",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["PARTY", "DANCE PARTY", "QTBIPOC"]),
      admission: "TICKETED",
      ticketUrl: "https://www.holocene.org/event/chai-roses-pride-party-a-sunday-tea-dance-for-qtbipoc-allies-21-2/holocene/portland/",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/chai-and-roses-pride-party.jpg", status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Darcelle XV Friday Night Show",
      description: "Portland's legendary drag cabaret, staging shows since 1967. Special Pride weekend performance. Doors 7pm, show 8pm. $32 cover. Book reservations early.",
      venueName: "Darcelle XV Showplace",
      address: "208 NW 3rd Ave, Portland, OR 97209",
      neighborhood: "Old Town",
      lat: 45.524649023488, lng: -122.673354790034,
      dateStart: "2026-07-17T19:00:00", dateEnd: "2026-07-17T23:00:00",
      dayOfWeek: "FRI",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["DRAG", "CABARET", "SHOW"]),
      admission: "TICKETED",
      ticketUrl: "https://www.darcellexv.com",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/darcelle-xv-friday.jpg", status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Darcelle XV Saturday Night Show",
      description: "Portland's legendary drag cabaret — special Pride Saturday performance. 90-minute drag show followed by The Men of Darcelle after 9:30pm. Doors 7pm, show 8pm. $32 cover. 21+.",
      venueName: "Darcelle XV Showplace",
      address: "208 NW 3rd Ave, Portland, OR 97209",
      neighborhood: "Old Town",
      lat: 45.524649023488, lng: -122.673354790034,
      dateStart: "2026-07-18T19:00:00", dateEnd: "2026-07-18T23:59:00",
      dayOfWeek: "SAT",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["DRAG", "CABARET", "SHOW"]),
      admission: "TICKETED",
      ticketUrl: "https://www.darcellexv.com",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/darcelle-xv-saturday.jpg", status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Darcelle XV Sunday Funday Drag Brunch",
      description: "Sunday Funday Drag Queen Brunch at Portland's legendary Darcelle XV Showplace. Hosted by Poison Waters, Alexis Campbell Starr & Cassie Nova. Plated brunch included. Doors 11:30am, show 12:30pm. $32. 21+.",
      venueName: "Darcelle XV Showplace",
      address: "208 NW 3rd Ave, Portland, OR 97209",
      neighborhood: "Old Town",
      lat: 45.524649023488, lng: -122.673354790034,
      dateStart: "2026-07-19T11:30:00", dateEnd: "2026-07-19T15:00:00",
      dayOfWeek: "SUN",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["BRUNCH", "DRAG", "CABARET"]),
      admission: "TICKETED",
      ticketUrl: "https://www.travelportland.com/event/6839b05cf06e831a6c746688/",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/darcelle-xv-sunday.jpg", status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "I Do at Darcelle's — Mass Wedding",
      description: "Free outdoor public event at the newly opened Darcelle XV Plaza. Celebrate love at Portland's new queer landmark. All are welcome. Free admission.",
      venueName: "Darcelle XV Plaza",
      address: "800 SW Harvey Milk St, Portland, OR 97205",
      neighborhood: "Downtown",
      lat: 45.5183, lng: -122.6796,
      dateStart: "2026-07-18T20:00:00", dateEnd: "2026-07-18T22:00:00",
      dayOfWeek: "SAT",
      ageRequirement: "ALL_AGES",
      eventTypes: JSON.stringify(["COMMUNITY", "FREE", "OUTDOOR", "FAMILY"]),
      admission: "FREE",
      ticketUrl: "https://downtownpdxactivations.com",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: null, status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Rose City Roller Derby: Blood, Sweat & Queers Pride 2026",
      description: "Pride 2026 roller derby at The Hangar at Oaks Amusement Park. Home team championship Pride Night. Local food carts, Plow Stop Bar with 2Towns Cider & Gigantic Brewing. ADA seating available. Parking $3-5.",
      venueName: "The Hangar at Oaks Amusement Park",
      address: "7805 SE Oaks Park Way, Portland, OR 97202",
      neighborhood: "SE Portland",
      lat: 45.469518272008, lng: -122.661643511279,
      dateStart: "2026-07-18T12:00:00", dateEnd: "2026-07-18T17:00:00",
      dayOfWeek: "SAT",
      ageRequirement: "ALL_AGES",
      eventTypes: JSON.stringify(["SPORTS", "FAMILY", "COMMUNITY"]),
      admission: "TICKETED",
      ticketUrl: "https://rosecityrollers.com/schedule/",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/rose-city-roller-derby.jpg", status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Hawks PDX Pride Weekend Placeholder",
      description: "Placeholder listing: Hawks PDX is expected to host Pride weekend programming because they typically do something every year, but specific 2026 event details have not been confirmed yet. Check Hawks PDX directly for the final schedule before attending.",
      venueName: "Hawks PDX",
      address: "335 SE 99th Ave, Portland, OR 97216",
      neighborhood: "SE Portland",
      lat: 45.520175147981, lng: -122.562357520572,
      dateStart: "2026-07-17T14:00:00", dateEnd: "2026-07-18T06:00:00",
      dayOfWeek: "FRI",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["COMMUNITY", "ALL-GENDER", "WELLNESS"]),
      admission: "FREE",
      ticketUrl: "https://hawkspdx.com/calendar-events",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/transocial-hawks.png", status: "HIDDEN", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: "Hidden: no 2026 Pride schedule on hawkspdx.com", createdAt: now,
    },
    {
      title: "Hawks PDX Pride Weekend Placeholder",
      description: "Placeholder listing: Hawks PDX is expected to host Pride weekend programming because they typically do something every year, but specific 2026 event details have not been confirmed yet. Check Hawks PDX directly for the final schedule before attending.",
      venueName: "Hawks PDX",
      address: "335 SE 99th Ave, Portland, OR 97216",
      neighborhood: "SE Portland",
      lat: 45.520175147981, lng: -122.562357520572,
      dateStart: "2026-07-18T10:00:00", dateEnd: "2026-07-19T06:00:00",
      dayOfWeek: "SAT",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["COMMUNITY", "TRANS", "WELLNESS"]),
      admission: "TICKETED",
      ticketUrl: "https://hawkspdx.com/calendar-events",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/transocial-hawks.png", status: "HIDDEN", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: "Hidden: no 2026 Pride schedule on hawkspdx.com", createdAt: now,
    },
    {
      title: "Hawks PDX Pride Weekend Placeholder",
      description: "Placeholder listing: Hawks PDX is expected to host Pride weekend programming because they typically do something every year, but specific 2026 event details have not been confirmed yet. Check Hawks PDX directly for the final schedule before attending.",
      venueName: "Hawks PDX",
      address: "335 SE 99th Ave, Portland, OR 97216",
      neighborhood: "SE Portland",
      lat: 45.520175147981, lng: -122.562357520572,
      dateStart: "2026-07-19T13:00:00", dateEnd: "2026-07-20T02:00:00",
      dayOfWeek: "SUN",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["COMMUNITY", "WELLNESS", "ALL-GENDER"]),
      admission: "TICKETED",
      ticketUrl: "https://hawkspdx.com/calendar-events",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/transocial-hawks.png", status: "HIDDEN", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: "Hidden: no 2026 Pride schedule on hawkspdx.com", createdAt: now,
    },
    {
      title: "Portland Trans Pride March",
      description: "Community-led Trans Pride march through downtown Portland. Rally at 2pm, march begins at 3:30pm. Free, all ages, masks encouraged. Organized by and for the trans community.",
      venueName: "North Park Blocks",
      address: "NW 8th Ave & W Burnside St, Portland, OR 97209",
      neighborhood: "Downtown",
      lat: 45.5228, lng: -122.6851,
      dateStart: "2026-07-19T14:00:00", dateEnd: "2026-07-19T17:30:00",
      dayOfWeek: "SUN",
      ageRequirement: "ALL_AGES",
      eventTypes: JSON.stringify(["MARCH", "COMMUNITY", "FREE", "TRANS", "OFFICIAL"]),
      admission: "FREE",
      ticketUrl: "https://portlandpride.org/2026-portland-pride-official-events/portland-trans-pride-march",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: null, status: "HIDDEN", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "A Spellman Spectacle: 30th Anniversary",
      description: "Sabrina the Teenage Witch 30th anniversary celebration with cast members Gordie and Harvey. Drag performances and nostalgia. Doors 7:30pm.",
      venueName: "The Get Down",
      address: "680 SE 6th Ave, Portland, OR 97214",
      neighborhood: "Central Eastside",
      lat: 45.518102119173, lng: -122.659642694029,
      dateStart: "2026-07-16T19:30:00", dateEnd: "2026-07-16T23:59:00",
      dayOfWeek: "THU",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["DRAG", "PERFORMANCE", "NOSTALGIA"]),
      admission: "TICKETED",
      ticketUrl: "https://ma.to/event/euphoria-spellman-spectacle-16-jul-2026",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/spellman-spectacle.webp", status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Let's Get Wild: A Pride Drag Show",
      description: "Pride drag show at Escape Bar & Grill. $15 advance tickets.",
      venueName: "Escape Bar & Grill",
      address: "9004 NE Sandy Blvd, Portland, OR 97220",
      neighborhood: "NE Portland",
      lat: 45.555896918159, lng: -122.569991983829,
      dateStart: "2026-07-17T21:00:00", dateEnd: "2026-07-18T00:00:00",
      dayOfWeek: "FRI",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["DRAG", "PARTY"]),
      admission: "TICKETED",
      ticketUrl: "https://www.eventbrite.com/e/lets-get-wild-a-pride-drag-show-tickets-1991640876475",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/lets-get-wild-pride-drag-show.jpg", status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "WRECKNO's Big Gay Soirée",
      description: "Late night queer dance party at REALM PDX featuring Wreckno and ONHELL. 18+.",
      venueName: "REALM PDX",
      address: "615 SE Alder St, Portland, OR 97214",
      neighborhood: "SE Portland",
      lat: 45.51799282917, lng: -122.659516684784,
      dateStart: "2026-07-17T22:00:00", dateEnd: "2026-07-18T04:00:00",
      dayOfWeek: "FRI",
      ageRequirement: "18_PLUS",
      eventTypes: JSON.stringify(["PARTY", "DANCE PARTY", "LATE-NIGHT"]),
      admission: "TICKETED",
      ticketUrl: "https://www.eventim.com/event/wrecknos-big-gay-soiree-realm-21801824/",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: null, status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Oregon Labor Pride Festival",
      description: "Labor union Pride festival and parade at Waterfront Park. Free and all ages.",
      venueName: "Tom McCall Waterfront Park",
      address: "98 SW Naito Pkwy, Portland, OR 97204",
      neighborhood: "Downtown",
      lat: 45.5201241, lng: -122.6727,
      dateStart: "2026-07-18T12:00:00", dateEnd: "2026-07-18T18:00:00",
      dayOfWeek: "SAT",
      ageRequirement: "ALL_AGES",
      eventTypes: JSON.stringify(["FESTIVAL", "COMMUNITY", "FREE", "FAMILY"]),
      admission: "FREE",
      ticketUrl: "https://www.mobilize.us/aflcio/event/952383/",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/oregon-labor-pride.png", status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "DIVAPALOOZA 5th Anniversary",
      description: "Queer nightlife party celebrating 5 years. DJs, drag, dancing. $10-25 sliding scale.",
      venueName: "Gay Blvd",
      address: "Portland, OR 97209",
      neighborhood: "Old Town",
      lat: 45.5253, lng: -122.6738,
      dateStart: "2026-07-18T22:00:00", dateEnd: "2026-07-19T04:00:00",
      dayOfWeek: "SAT",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["PARTY", "DANCE PARTY", "DRAG"]),
      admission: "TICKETED",
      ticketUrl: "https://www.eventbrite.com/e/divapalooza-pdx-pride-2026-tickets-1991334196186",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/divapalooza-5th-anniversary.jpg", status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "BAZ MOTO PRIDE BEYOND THE PARK",
      description: "Motorcycle-themed Pride event at the Midtown Beer Garden. 21+.",
      venueName: "Midtown Beer Garden",
      address: "431 SW Harvey Milk St, Portland, OR 97204",
      neighborhood: "Downtown",
      lat: 45.520091, lng: -122.677007,
      dateStart: "2026-07-19T19:00:00", dateEnd: "2026-07-19T22:00:00",
      dayOfWeek: "SUN",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["PARTY", "COMMUNITY", "LIVE MUSIC"]),
      admission: "TICKETED",
      ticketUrl: "https://www.bazmotomusic.com/event-details-registration/baz-moto-plays-portland-pride-at-the-midtown-beer-garden",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: null, status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Jewish Pride Greater PDX March",
      description: "9th year marching. Jewish community contingent in the Portland Pride Parade. All are welcome to march together.",
      venueName: "Portland Pride Parade",
      address: "NW Park Ave & W Burnside St, Portland, OR 97209",
      neighborhood: "Downtown",
      lat: 45.523011535188, lng: -122.679071017042,
      dateStart: "2026-07-19T11:00:00", dateEnd: "2026-07-19T13:00:00",
      dayOfWeek: "SUN",
      ageRequirement: "ALL_AGES",
      eventTypes: JSON.stringify(["MARCH", "COMMUNITY", "FREE", "FAMILY"]),
      admission: "FREE",
      ticketUrl: "https://jewishportland.org/pdxjewishpride",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/jewish-pride-pdx-march.png", status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Markets Made With Pride",
      description: "PrideNW artisan market during festival weekend. LGBTQ+ makers and artists in Ankeny Alley. Free, all ages.",
      venueName: "Ankeny Alley",
      address: "SW Ankeny St, Portland, OR 97204",
      neighborhood: "Old Town",
      lat: 45.522552534626, lng: -122.673342518027,
      dateStart: "2026-07-18T12:00:00", dateEnd: "2026-07-19T18:00:00",
      dayOfWeek: "SAT",
      ageRequirement: "ALL_AGES",
      eventTypes: JSON.stringify(["MARKET", "OFFICIAL", "FREE"]),
      admission: "FREE",
      ticketUrl: "https://portlandpride.org/2026-portland-pride-official-events",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/markets-made-with-pride.jpg", status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Pride in Demand — Portland Queer Takeover — Night 2",
      description: "Night 2 of the Pride in Demand takeover. Organized by DotGay. Queer superhero theme. Star Theater and Starlight Lounge.",
      venueName: "Star Theater and Starlight Lounge",
      address: "13 NW 6th Ave, Portland, OR 97209",
      neighborhood: "Old Town",
      lat: 45.523204065035, lng: -122.676518408183,
      dateStart: "2026-07-18T21:00:00", dateEnd: "2026-07-18T23:59:00",
      dayOfWeek: "SAT",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["PARTY", "TAKEOVER"]),
      admission: "TICKETED",
      ticketUrl: "https://www.startheaterportland.com/calendar/",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/pride-in-demand.jpg", status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Ankeny Alley Pride Block Party — Sunday",
      description: "Day 2 of the official PrideNW block party in Old Town's Ankeny Alley. Local vendors, community gathering. Free and all ages.",
      venueName: "Ankeny Alley",
      address: "SW Ankeny St, Portland, OR 97204",
      neighborhood: "Old Town",
      lat: 45.522552534626, lng: -122.673342518027,
      dateStart: "2026-07-19T13:00:00", dateEnd: "2026-07-19T18:00:00",
      dayOfWeek: "SUN",
      ageRequirement: "ALL_AGES",
      eventTypes: JSON.stringify(["BLOCK-PARTY", "OFFICIAL", "FREE", "OUTDOOR"]),
      admission: "FREE",
      ticketUrl: "https://portlandpride.org/2026-portland-pride-official-events",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/ankeny-alley-pride.jpg", status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Portland Pride Drag Brunch at Stag PDX — Sunday",
      description: "Day 2 of the all-ages drag brunch at Stag PDX in the Pearl District. Performances, mimosas, and Pride energy.",
      venueName: "Stag PDX",
      address: "317 NW Broadway, Portland, OR 97209",
      neighborhood: "Pearl District",
      lat: 45.525333665978, lng: -122.677601642236,
      dateStart: "2026-07-19T11:00:00", dateEnd: "2026-07-19T15:00:00",
      dayOfWeek: "SUN",
      ageRequirement: "ALL_AGES",
      eventTypes: JSON.stringify(["BRUNCH", "DRAG"]),
      admission: "TICKETED",
      ticketUrl: "https://www.eventbrite.com/e/portland-pride-drag-brunch-sunday-tickets-1989269916871",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/stag-pdx-drag-brunch-sunday.jpg", status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
  ];

  for (const e of seedEvents) {
    db.insert(events).values(e).run();
  }

  // Seed attendance entries for demo
  const bubbles = [
    "Hey, I'll be there!",
    "Hey, come say hi!",
    "Hey, I'm cute and slightly feral",
    "Hey, here for the queers and the chaos",
    "Hey, I'm friendly but bad at starting conversations",
    "Hey, let's be awkward together",
  ];
  const handles = ["queercat", "neonbabe", "velvethaze", "crushpunk", "stardust", "wildthing", "radtrans", "badfemme"];
  for (let eventId = 1; eventId <= 46; eventId++) {
    const count = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      db.insert(attendances).values({
        eventId,
        handle: handles[Math.floor(Math.random() * handles.length)],
        message: bubbles[Math.floor(Math.random() * bubbles.length)],
        avatarSeed: `seed${eventId}${i}`,
        createdAt: now,
      }).run();
    }
  }

  // Seed one real-looking gig (LOOKING_FOR_WORK only — let real users post gigs)
  insertGigPostCompat({
    postType: "LOOKING_FOR_WORK", title: "Sound Tech & DJ Available Pride Weekend",
    name: "DJ Queerwave", contactEmail: "djqueerwave@example.com",
    description: "Portland-based DJ and sound tech. Experienced in queer nightlife, house, and techno. Available July 16–19. Hit me up!",
    skills: "DJ, Sound Tech, Lighting", compensation: "Negotiable", location: "Portland, OR",
    isRemote: false, status: "LIVE", createdAt: now,
  });
}

function applyVerifiedEventOverrides() {
  const now = new Date().toISOString();
  const updateByTitle = sqlite.prepare(`
    UPDATE events SET
      title = COALESCE(@newTitle, title),
      description = COALESCE(@description, description),
      venue_name = COALESCE(@venueName, venue_name),
      address = COALESCE(@address, address),
      neighborhood = COALESCE(@neighborhood, neighborhood),
      lat = COALESCE(@lat, lat),
      lng = COALESCE(@lng, lng),
      date_start = COALESCE(@dateStart, date_start),
      date_end = COALESCE(@dateEnd, date_end),
      day_of_week = COALESCE(@dayOfWeek, day_of_week),
      age_requirement = COALESCE(@ageRequirement, age_requirement),
      event_types = COALESCE(@eventTypes, event_types),
      admission = COALESCE(@admission, admission),
      ticket_url = COALESCE(@ticketUrl, ticket_url),
      status = COALESCE(@status, status),
      admin_notes = COALESCE(@adminNotes, admin_notes)
    WHERE title = @title
  `);
  const updateByVenue = sqlite.prepare(`
    UPDATE events SET
      title = COALESCE(@newTitle, title),
      description = COALESCE(@description, description),
      admission = COALESCE(@admission, admission),
      event_types = COALESCE(@eventTypes, event_types),
      admin_notes = COALESCE(@adminNotes, admin_notes)
    WHERE venue_name = @venueName
  `);
  const runTitle = (title: string, patch: Record<string, any>) => updateByTitle.run({
    title,
    newTitle: null,
    description: null,
    venueName: null,
    address: null,
    neighborhood: null,
    lat: null,
    lng: null,
    dateStart: null,
    dateEnd: null,
    dayOfWeek: null,
    ageRequirement: null,
    eventTypes: null,
    admission: null,
    ticketUrl: null,
    status: null,
    adminNotes: null,
    ...patch,
  });

  runTitle("Portland Pride Waterfront Festival", {
    description: "Official PrideNW festival at Tom McCall Waterfront Park. 2026 theme: \"Made with Pride\" — celebrating creativity, entrepreneurship, and Pride's protest roots. Saturday noon-8pm and Sunday 11:30am-6pm. $10 suggested donation; no one turned away. Headliners announced so far: Lushious Massacr, DeJa Skye, Tenderoni. Features main stage and north stage, ASL interpreters, ADA viewing areas, accessible flooring, and VIP pass options.",
    dateStart: "2026-07-18T12:00:00",
    dateEnd: "2026-07-19T18:00:00",
    admission: "SUGGESTED_DONATION",
    eventTypes: JSON.stringify(["FESTIVAL", "OFFICIAL", "FAMILY", "ACCESSIBLE"]),
    adminNotes: "Per updated PrideNW details: performers include Lushious Massacr, DeJa Skye, Tenderoni; accessibility includes ASL, ADA viewing areas, accessible flooring.",
  });
  runTitle("Portland Pride Parade", {
    description: "Official PrideNW parade. Oregon's largest parade, drawing tens of thousands. Route starts at the North Park Blocks, winds through downtown, and ends at the festival at Tom McCall Waterfront Park.",
    dateStart: "2026-07-19T11:00:00",
    dateEnd: "2026-07-19T13:30:00",
    eventTypes: JSON.stringify(["PARADE", "FREE", "OFFICIAL", "MARCH", "FAMILY"]),
  });
  runTitle("Ankeny Alley Pride Block Party", {
    newTitle: "Old Town Block Party",
    description: "Official PrideNW Old Town activation. Unstoppable joy, radical love, and Pride weekend community energy in and around Ankeny Alley.",
    eventTypes: JSON.stringify(["BLOCK-PARTY", "OFFICIAL", "FREE", "OUTDOOR"]),
  });
  runTitle("Ankeny Alley Pride Block Party — Sunday", {
    newTitle: "Old Town Block Party — Sunday",
    description: "Official PrideNW Old Town activation. Unstoppable joy, radical love, and Pride weekend community energy in and around Ankeny Alley.",
    eventTypes: JSON.stringify(["BLOCK-PARTY", "OFFICIAL", "FREE", "OUTDOOR"]),
  });
  runTitle("Midtown Beer Garden Pride", {
    address: "431 SW Harvey Milk St, Portland, OR 97204",
    lat: 45.520416,
    lng: -122.678127,
    dateStart: "2026-07-17T17:00:00",
    dateEnd: "2026-07-20T20:00:00",
    dayOfWeek: "FRI",
    description: "Official PrideNW outdoor beer garden open across Pride weekend at 431 SW Harvey Milk St. Community drinks and Pride energy just outside the main festival footprint.",
  });
  runTitle("Markets Made With Pride", {
    newTitle: "LGBTQIA2S+ Maker's Market",
    description: "Official PrideNW maker's market within the Waterfront Festival at Tom McCall Waterfront Park, featuring photography, painting, jewelry, handmade crafts, and local queer makers.",
    venueName: "Maker's Market at Waterfront Festival",
    address: "98 SW Naito Pkwy, Portland, OR 97204",
    neighborhood: "Downtown",
    lat: 45.5201241,
    lng: -122.6727,
    eventTypes: JSON.stringify(["MARKET", "OFFICIAL", "FREE", "MAKERS"]),
  });
  runTitle("Portland Trans Pride March", {
    description: "Official PrideNW programming. Free, all ages, masks encouraged. Organized by and for the trans community.",
    status: "LIVE",
    ticketUrl: "https://portlandpride.org/2026-portland-pride-official-events/portland-trans-pride-march",
    eventTypes: JSON.stringify(["MARCH", "COMMUNITY", "FREE", "TRANS", "OFFICIAL"]),
  });
  runTitle("Dyke March Portland Pride", {
    ticketUrl: "https://portlandpride.org/2026-portland-pride-official-events/the-portland-dyke-march",
  });

  runTitle("Portland Pickles Pride Night", {
    description: "Pride baseball game vs. the Gresham Greywolves at Walker Stadium. On-field activities, vendors, and family-friendly Pride Night energy. From $12.",
  });
  runTitle("A Spellman Spectacle: 30th Anniversary", {
    description: "Sabrina the Teenage Witch 30th anniversary celebration featuring Gordie and Harvey, with drag performances and nostalgia. Doors 7:30pm.",
  });
  runTitle("Darcelle XV Sunday Funday Drag Brunch", {
    description: "Pride weekend drag brunch hosted by Poison Waters, Alexis Campbell Starr, and Cassie Nova. Plated brunch included. Doors 11:30am, show 12:30pm. $32 cover. 21+.",
    ageRequirement: "21_PLUS",
  });
  runTitle("Treasure Trail Portland Pride", {
    venueName: "Sanctuary Club",
    description: "Bearracuda's Pride Friday kick-off at Sanctuary Club. DJ TIGERBEATZ from Seattle, hosted by JP Hardy. Wristband color system at the door: red=top, blue=vers, green=bottom, white=side. Venmo tickets available with no surcharge.",
  });
  runTitle("Bearracuda Pride Friday — Vaseline Alley", {
    description: "Bearracuda Pride Friday at 722 E Burnside. Theme: VASELINE ALLEY. Harnesses and fetish gear encouraged.",
  });
  sqlite.prepare(`
    UPDATE events SET
      status = 'HIDDEN',
      admin_notes = 'Duplicate/old Friday listing. Confirmed 2026 Pride in Demand listing is Saturday July 18 at Star Theater.'
    WHERE title = 'Pride in Demand — Portland Queer Takeover'
      AND date_start = '2026-07-17T21:00:00'
  `).run();
  sqlite.prepare(`
    UPDATE events SET
      title = 'Pride in Demand — Portland Queer Takeover',
      description = 'DotGay''s Pride in Demand Portland Queer Takeover at Star Theater. Confirmed Saturday July 18, 2026 at 9pm. Ticket range reported at $31-$134. This is Night 2 of 2. Night 1 is Friday July 17, 2026 9:00 PM.',
      ticket_url = 'https://www.startheaterportland.com/tm-event/pride-in-demand-portland-queer-takeover/',
      event_types = '["PARTY","TAKEOVER","MULTI-DAY"]',
      status = 'LIVE'
    WHERE (title = 'Pride in Demand — Portland Queer Takeover — Night 2'
      OR title = 'Pride in Demand — Portland Queer Takeover')
      AND date_start = '2026-07-18T21:00:00'
  `).run();
  runTitle("Stank Yes Coach — PDX PRIDE", {
    description: "Yes Coach / Stank Pride party at Sanctuary Club. DJs: JUMPR, Bro Hoe, Lake Everett, Spencer Adam, and Tucker Max.",
  });
  runTitle("Gay Witch Appreciation Day + Pride at Seagrape", {
    description: "All-ages witch-themed Pride market and apothecary event at Seagrape, 11am-5pm. All are welcome.",
  });
  runTitle("Portland Pride Drag Brunch at Stag PDX", {
    description: "Portland Pride Drag Brunch at Stag PDX. Confirmed Saturday July 18, 2026 at 11am. Ticket range reported at $45-$150.",
    ageRequirement: "21_PLUS",
  });
  runTitle("Portland Pride Drag Brunch at Stag PDX — Sunday", {
    description: "Portland Pride Drag Brunch at Stag PDX. Confirmed Sunday July 19, 2026 at 11am. Ticket range reported at $40-$150.",
    ageRequirement: "21_PLUS",
  });
  runTitle("Rose City Roller Derby: Blood, Sweat & Queers Pride 2026", {
    description: "Rose City Roller Derby home team championship Pride Night at The Hangar at Oaks Amusement Park. Local food carts, Plow Stop Bar, and parking available for $3-$5.",
  });
  runTitle("Portland Pride Ride", {
    description: "Community Pride ride from Trek Bicycle Portland Slabtown. Helmets required. Ends at 503 Distilling, 2671 NW Vaughn St, with a parking lot party.",
  });
  runTitle("Certified Freak Block Party", {
    description: "Certified Freak Block Party at Happylucky / Now Serving. Benefits Basic Rights Oregon. Suggested $20 donation, VIP $50.",
  });
  runTitle("INFERNO PRIDE PORTLAND 2026", {
    description: "INFERNO PRIDE PORTLAND 2026 at Formerly Opaline. DJs Lauren 6-8pm and Wild Fire 8-10pm. $20 presale, $25 door.",
  });
  runTitle("BOYeurism: Pride Spectacular", {
    description: "BOYeurism Pride Spectacular at Alberta Rose Theatre. Created by IZOHNNY — Isaiah Esquire and Johnny Nuriel.",
  });
  runTitle("RADIANCE by Gaylabration", {
    description: "RADIANCE by Gaylabration at Crystal Ballroom. Headliner Matt Suave, with Poundstar, Mircat Dragonfae, and Bro Hoe Sappho. Sponsored by Q Care+.",
  });
  runTitle("DIVAPALOOZA 5th Anniversary", {
    description: "DIVAPALOOZA 5th Anniversary Pride party. Confirmed Saturday July 18, 2026, 10pm-4am. $10-$25 sliding scale.",
  });
  runTitle("Jewish Pride Greater PDX March", {
    description: "Jewish Pride Greater PDX March in the Portland Pride Parade. 9th year marching. All welcome.",
  });
  runTitle("The Sports Bra Pride Block Party", {
    description: "5th Annual Sports Bra Pride Block Party. Live DJ sets, weightlifting competition, dance performances, games, food carts, cocktails, shave ice, and kid-friendly activities. Ticket range reported at $0-$39.",
  });
  runTitle("Lumbertwink Plaid Patio Pride", {
    description: "Lumbertwink Plaid Patio Pride at Jackie's. DJs Not That Jennifer and Orographic, sexy lumber go-gos, photo booth by Matty Hoffman. $18.69 plaid / $29.45 non-plaid.",
  });
  runTitle("NE Portland Pride & LGBTQ+ Resource Fair", {
    description: "Free NE Portland Pride & LGBTQ+ Resource Fair hosted by Take Two and Javier Puga-Phillips on NE 30th Ave between Killingsworth and Emerson.",
  });
  runTitle("BAZ MOTO PRIDE BEYOND THE PARK", {
    address: "431 SW Harvey Milk St, Portland, OR 97204",
    lat: 45.520416,
    lng: -122.678127,
    description: "BAZ MOTO PRIDE BEYOND THE PARK at Midtown Beer Garden, 7-10pm.",
  });
  runTitle("Chai & Roses Pride Party", {
    description: "Sunday tea dance for QTBIPOC and allies at Holocene. DJs Suavecito and DJ Anjali. Performances by Blossom Drearie, Chiffon Cherie, and Hibiscus Lust. MC Armaan Singh.",
  });
  runTitle("Yes Sir Gay Dance Party", {
    description: "Secret warehouse gay underwear night at REALM PDX featuring DJ Ottogyro. Location details revealed to ticket holders only.",
  });
  runTitle("Twirl! PDX Queer Disco — Pride Edition (HOLD)", {
    newTitle: "Twirl! PDX Queer Disco — Pride Edition (2025 Hold)",
    description: "Hold listing only: this was a July 20, 2025 event. No 2026 date has been announced.",
    dateStart: "2025-07-20T15:00:00",
    dateEnd: "2025-07-20T22:30:00",
    dayOfWeek: "SUN",
    status: "HIDDEN",
    adminNotes: "Remove from 2026 public listings unless a 2026 date is announced.",
  });
  updateByVenue.run({
    venueName: "Hawks PDX",
    newTitle: "Hawks PDX Pride Weekend Placeholder",
    description: "TBD placeholder listing: Hawks PDX is expected to host Pride weekend programming because they typically do something every year, but their 2026 Pride calendar is still empty. Check Hawks PDX directly for the final schedule before attending.",
    admission: "TBD",
    eventTypes: JSON.stringify(["TBD", "VENUE", "COMMUNITY"]),
    adminNotes: "Updated source says Hawks PDX has no 2026 Pride updates yet; keep TBD.",
  });

  const dykeMarchExists = sqlite.prepare("SELECT id FROM events WHERE title = ?").get("Dyke March Portland Pride");
  if (!dykeMarchExists) {
    db.insert(events).values({
      title: "Dyke March Portland Pride",
      description: "Official PrideNW event. Downtown route details are expected closer to Pride; past timing suggests early evening. Check portlandpride.org for exact start and route before attending.",
      venueName: "Downtown Portland",
      address: "Downtown Portland, Portland, OR 97205",
      neighborhood: "Downtown",
      lat: 45.5202471, lng: -122.674194,
      dateStart: "2026-07-18T17:00:00", dateEnd: "2026-07-18T20:00:00",
      dayOfWeek: "SAT",
      ageRequirement: "ALL_AGES",
      eventTypes: JSON.stringify(["MARCH", "COMMUNITY", "FREE", "OFFICIAL"]),
      admission: "FREE",
      ticketUrl: "https://portlandpride.org/2026-portland-pride-official-events/the-portland-dyke-march",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: null, status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: "Added from updated official PrideNW event info; route/start should be checked closer to date.", createdAt: now,
    }).run();
  }
}

function applyEventDataAuditFixes() {
  sqlite.prepare(`
    UPDATE events SET
      status = 'HIDDEN',
      admin_notes = 'Hidden: no 2026 Pride schedule confirmed on hawkspdx.com'
    WHERE title = 'Hawks PDX Pride Weekend Placeholder'
  `).run();
  sqlite.prepare(`
    UPDATE events SET
      status = 'HIDDEN',
      admin_notes = 'Hidden: unverified TBD placeholder — no 2026 Pride details on steamportland.com'
    WHERE title = 'Steam Portland Pride Weekend TBD'
  `).run();
  sqlite.prepare(`
    UPDATE events SET
      status = 'HIDDEN',
      admin_notes = 'Hidden: incorrect stub — Fri is AWOO at 835 N Lombard, Sat is Under Gear; not verified Eagle Pup Night'
    WHERE title = 'Eagle Portland Pup Night Pride Edition TBD'
  `).run();
  sqlite.prepare(`
    UPDATE events SET
      date_start = '2026-07-18T20:00:00',
      description = 'BOYeurism Pride Spectacular at Alberta Rose Theatre. Doors 7pm, show 8pm. Created by IZOHNNY — Isaiah Esquire and Johnny Nuriel.'
    WHERE title = 'BOYeurism: Pride Spectacular'
  `).run();
  sqlite.prepare(`
    UPDATE events SET admission = 'TICKETED'
    WHERE title = 'Gay Witch Appreciation Day + Pride at Seagrape'
  `).run();
  sqlite.prepare(`
    UPDATE events SET poster_image_url = '/posters/stag-pdx-drag-brunch-saturday.jpg'
    WHERE title = 'Portland Pride Drag Brunch at Stag PDX'
  `).run();
  sqlite.prepare(`
    UPDATE events SET poster_image_url = '/posters/stag-pdx-drag-brunch-sunday.jpg'
    WHERE title = 'Portland Pride Drag Brunch at Stag PDX — Sunday'
  `).run();
  sqlite.prepare(`
    UPDATE events SET poster_image_url = '/posters/divapalooza-5th-anniversary.jpg'
    WHERE title = 'DIVAPALOOZA 5th Anniversary'
  `).run();
  sqlite.prepare(`
    UPDATE events SET
      title = 'Pride in Demand — Portland Queer Takeover — Night 1',
      description = 'Night 1 of DotGay''s Pride in Demand Portland Queer Takeover at Star Theater. Queer superhero theme. Friday July 17, 2026 at 9pm.',
      poster_image_url = '/posters/pride-in-demand.jpg',
      status = 'LIVE',
      date_start = '2026-07-17T21:00:00',
      date_end = '2026-07-17T23:59:00',
      day_of_week = 'FRI'
    WHERE title IN (
      'Pride in Demand — Friday Night',
      'Pride in Demand — Portland Queer Takeover'
    )
      AND date_start LIKE '2026-07-17%'
  `).run();
  sqlite.prepare(`
    UPDATE events SET
      title = 'Pride in Demand — Portland Queer Takeover — Night 2',
      description = 'Night 2 of DotGay''s Pride in Demand Portland Queer Takeover at Star Theater. Queer superhero theme. Saturday July 18, 2026 at 9pm.',
      poster_image_url = CASE
        WHEN poster_image_url IS NULL OR poster_image_url LIKE '/placeholders/%'
        THEN '/posters/pride-in-demand.jpg'
        ELSE poster_image_url
      END
    WHERE title IN (
      'Pride in Demand — Portland Queer Takeover',
      'Pride in Demand — Portland Queer Takeover — Night 2'
    )
      AND date_start LIKE '2026-07-18%'
  `).run();
  sqlite.prepare(`
    UPDATE events SET
      status = 'HIDDEN',
      admin_notes = 'Duplicate Night 1 row — consolidated to single Friday listing'
    WHERE title = 'Pride in Demand — Portland Queer Takeover — Night 1'
      AND id NOT IN (
        SELECT MIN(id) FROM events
        WHERE title = 'Pride in Demand — Portland Queer Takeover — Night 1'
          AND date_start LIKE '2026-07-17%'
      )
  `).run();
}

function runDismissStaleTestModerationRequests() {
  const result = sqlite.prepare(`
    UPDATE moderation_requests
    SET status = 'REJECTED',
        admin_notes = COALESCE(admin_notes, 'Dismissed stale test queue item')
    WHERE status = 'PENDING'
      AND (
        LOWER(requester_email) LIKE '%+test%'
        OR LOWER(requester_email) LIKE '%test@%'
        OR LOWER(proof) LIKE '%test request%'
        OR LOWER(proof) LIKE '%uat test%'
      )
  `).run();
  return result.changes;
}

function ensureBootMigrationsTable() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS boot_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `);
}

function hasBootMigration(id: string) {
  ensureBootMigrationsTable();
  return !!sqlite.prepare("SELECT 1 FROM boot_migrations WHERE id = ?").get(id);
}

function recordBootMigration(id: string) {
  sqlite.prepare("INSERT INTO boot_migrations (id, applied_at) VALUES (?, ?)").run(
    id,
    new Date().toISOString(),
  );
}

function runBootMigrationsOnce() {
  ensureBootMigrationsTable();
  seedData();
  if (!hasBootMigration("verified_event_overrides_v1")) {
    applyVerifiedEventOverrides();
    recordBootMigration("verified_event_overrides_v1");
  }
  if (!hasBootMigration("remove_gifting_seed_posts_v1")) {
    removeGiftingSeedPosts();
    recordBootMigration("remove_gifting_seed_posts_v1");
  }
  if (!hasBootMigration("event_data_audit_v1")) {
    applyEventDataAuditFixes();
    recordBootMigration("event_data_audit_v1");
  }
  if (!hasBootMigration("event_data_audit_v2")) {
    sqlite.prepare(`
      UPDATE events SET
        status = 'HIDDEN',
        admin_notes = 'Duplicate Night 1 row — consolidated to single Friday listing'
      WHERE title = 'Pride in Demand — Portland Queer Takeover — Night 1'
        AND id NOT IN (
          SELECT MIN(id) FROM events
          WHERE title = 'Pride in Demand — Portland Queer Takeover — Night 1'
            AND date_start LIKE '2026-07-17%'
        )
    `).run();
    recordBootMigration("event_data_audit_v2");
  }
  if (!hasBootMigration("sync_site_owner_portfolio_v1")) {
    syncSiteOwnerPortfolio();
    recordBootMigration("sync_site_owner_portfolio_v1");
  }
  if (!hasBootMigration("sync_site_owner_portfolio_v2")) {
    syncSiteOwnerPortfolio();
    recordBootMigration("sync_site_owner_portfolio_v2");
  }
  if (!hasBootMigration("release_site_owner_gifting_v1")) {
    const owner = resolveSiteOwner();
    if (owner) {
      releaseSiteOwnerPendingGifts(owner.id);
      for (const candidate of listSiteOwnerCandidates()) {
        releaseSiteOwnerPendingGifts(candidate.id);
      }
    }
    recordBootMigration("release_site_owner_gifting_v1");
  }
  if (!hasBootMigration("site_admin_grants_v1")) {
    seedSiteAdminGrantsFromEnv();
    recordBootMigration("site_admin_grants_v1");
  }
}

function parseEnvAdminLists() {
  const emails = (process.env.ADMIN_USER_EMAILS || "hello.tuckercasey@gmail.com")
    .split(",")
    .map(value => value.trim().toLowerCase())
    .filter(Boolean);
  const usernames = (process.env.ADMIN_USERNAMES || "hello_tuckercasey,tucker_pdmax")
    .split(",")
    .map(value => value.trim().replace(/^@/, "").toLowerCase())
    .filter(Boolean);
  return { emails, usernames };
}

function isEnvListedSiteAdmin(user: { email?: string | null; username?: string | null }) {
  const { emails, usernames } = parseEnvAdminLists();
  const email = String(user.email || "").trim().toLowerCase();
  const username = String(user.username || "").trim().replace(/^@/, "").toLowerCase();
  return emails.includes(email) || usernames.includes(username);
}

function seedSiteAdminGrantsFromEnv() {
  const { emails, usernames } = parseEnvAdminLists();
  const now = new Date().toISOString();
  for (const email of emails) {
    const user = storage.getUserByEmail(email);
    if (user) storage.ensureSiteAdminGrant(user.id, null, "Owner admin (env)", now);
  }
  for (const username of usernames) {
    const user = storage.getUserByUsername(username);
    if (user) storage.ensureSiteAdminGrant(user.id, null, "Owner admin (env)", now);
  }
}

function archiveExpiredMissedConnections() {
  const now = new Date().toISOString();
  sqlite.prepare(`
    UPDATE missed_connections
    SET status = 'ARCHIVED'
    WHERE status = 'ACTIVE'
      AND closes_at IS NOT NULL
      AND datetime(closes_at) <= datetime(?)
  `).run(now);
}

function mapMissedConnectionRow(row: any, viewerUserId?: number) {
  const isMine = viewerUserId != null && row.user_id === viewerUserId;
  const { user_id: _uid, eventDateStart: _eds, ...publicRow } = row;
  return { ...publicRow, isMine, anonymous: !isMine };
}

function giftingExpiry(postType: string, from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + (postType === "ISO" ? 14 : 7));
  return d.toISOString();
}

function safeJson(value: string) {
  try {
    return JSON.parse(value || "[]");
  } catch {
    return [];
  }
}

function expireGiftingPosts() {
  sqlite.prepare(`
    UPDATE gifting_posts
    SET status = 'EXPIRED'
    WHERE status IN ('OPEN','THREE_INTERESTED','POSTER_CHOOSING','LOOKING','OFFER_PENDING','REOPENED')
      AND datetime(expires_at) <= datetime('now')
  `).run();
}

export const SITE_ADMIN_GIG_TITLE = "Site Admins Needed: PDX Pride Guide";
export const SITE_ADMIN_GIG_OWNER_USERNAME = "tucker_pdmax";
export const SITE_OWNER_EVENT_TITLE = "Stank Yes Coach — PDX PRIDE";
export const SITE_OWNER_EMAIL = (
  process.env.SITE_OWNER_EMAIL
  || process.env.ADMIN_USER_EMAILS?.split(",")[0]
  || "hello.tuckercasey@gmail.com"
).trim().toLowerCase();

type SiteOwnerRow = {
  id: number;
  email: string;
  displayName: string | null;
  username: string;
};

const SITE_ADMIN_GIG_DESCRIPTION = `PDX Pride Guide is looking for site admins to help during Pride season and beyond.

What you would help with:
• Review new event submissions and promoter claims before they go live
• Approve or hold gifting posts when first-time posters need a check
• Triage moderation requests and site feedback reports
• Keep event listings accurate during Pride weekend crunch
• Step in when something breaks or needs a human

Volunteer community labor for now. Remote OK. Training and admin access provided for the right person.

Reply to this post through the gig board (messages go to @tucker_pdmax). Include why you want to help and any relevant experience.`;

function toSiteOwnerRow(user: User | undefined): SiteOwnerRow | undefined {
  if (!user) return undefined;
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName ?? null,
    username: user.username,
  };
}

function listSiteOwnerCandidates(): SiteOwnerRow[] {
  const { emails, usernames } = parseEnvAdminLists();
  const seen = new Set<number>();
  const rows: SiteOwnerRow[] = [];
  const push = (user: User | undefined) => {
    const row = toSiteOwnerRow(user);
    if (!row || seen.has(row.id)) return;
    seen.add(row.id);
    rows.push(row);
  };
  for (const email of emails) {
    push(db.select().from(users).where(eq(users.email, email)).get());
  }
  for (const username of usernames) {
    push(db.select().from(users).where(eq(users.username, username)).get());
  }
  push(db.select().from(users).where(eq(users.username, SITE_ADMIN_GIG_OWNER_USERNAME)).get());
  return rows;
}

function resolveSiteOwner(): SiteOwnerRow | undefined {
  const candidates = listSiteOwnerCandidates();
  if (!candidates.length) return undefined;
  const byEmail = candidates.find(c => c.email.trim().toLowerCase() === SITE_OWNER_EMAIL);
  if (byEmail) return byEmail;
  const byUsername = candidates.find(c => c.username === SITE_ADMIN_GIG_OWNER_USERNAME);
  return byUsername || candidates[0];
}

function isSiteOwnerUser(user: { id?: number | null; email?: string | null; username?: string | null } | null | undefined): boolean {
  if (!user?.id) return false;
  return listSiteOwnerCandidates().some(candidate => candidate.id === user.id);
}

function ownerIdentitySets(candidates: SiteOwnerRow[]) {
  return {
    userIds: [...new Set(candidates.map(c => c.id))],
    emails: [...new Set(candidates.map(c => c.email.trim().toLowerCase()).filter(Boolean))],
    usernames: [...new Set(candidates.map(c => c.username.trim().toLowerCase()).filter(Boolean))],
  };
}

function findSiteAdminGigPostId(): number | undefined {
  const byTitle = sqlite.prepare(`SELECT id FROM gig_posts WHERE title = ? LIMIT 1`).get(SITE_ADMIN_GIG_TITLE) as { id: number } | undefined;
  if (byTitle) return byTitle.id;
  const byMarker = sqlite.prepare(`
    SELECT id FROM gig_posts
    WHERE description LIKE 'PDX Pride Guide is looking for site admins%'
    ORDER BY id ASC
    LIMIT 1
  `).get() as { id: number } | undefined;
  return byMarker?.id;
}

function linkSiteAdminGigPostToOwner(ownerId: number) {
  const gigId = findSiteAdminGigPostId();
  if (gigId == null) return;
  sqlite.prepare(`UPDATE gig_posts SET user_id = ? WHERE id = ?`).run(ownerId, gigId);
}

function findSiteOwnerEventId(): number | undefined {
  const exact = sqlite.prepare(`SELECT id FROM events WHERE title = ? LIMIT 1`).get(SITE_OWNER_EVENT_TITLE) as { id: number } | undefined;
  if (exact) return exact.id;
  const fuzzy = sqlite.prepare(`
    SELECT id FROM events
    WHERE title LIKE '%Yes Coach%'
    ORDER BY id ASC
    LIMIT 1
  `).get() as { id: number } | undefined;
  return fuzzy?.id;
}

/** Keep site owner portfolio limited to Yes Coach + the site-admin gig post. */
function syncSiteOwnerPortfolio() {
  ensureSiteAdminGigPost();
  ensureEventHostsSchema();
  const owner = resolveSiteOwner();
  if (!owner) return;

  const candidates = listSiteOwnerCandidates();
  const { userIds, emails, usernames } = ownerIdentitySets(candidates);

  const adminGigId = findSiteAdminGigPostId();
  if (adminGigId != null) {
    sqlite.prepare(`UPDATE gig_posts SET user_id = ? WHERE id = ?`).run(owner.id, adminGigId);
    for (const userId of userIds) {
      sqlite.prepare(`UPDATE gig_posts SET user_id = NULL WHERE user_id = ? AND id != ?`).run(userId, adminGigId);
    }
  } else {
    for (const userId of userIds) {
      sqlite.prepare(`UPDATE gig_posts SET user_id = NULL WHERE user_id = ?`).run(userId);
    }
  }

  const yesCoachId = findSiteOwnerEventId();
  if (yesCoachId == null) {
    console.warn("[site_owner] Yes Coach event not found — skipping event host sync");
  } else {
    sqlite.prepare(`DELETE FROM event_hosts WHERE event_id = ? AND role = 'PRIMARY'`).run(yesCoachId);
    const existingHost = sqlite.prepare(`SELECT id FROM event_hosts WHERE event_id = ? AND user_id = ?`).get(yesCoachId, owner.id);
    if (existingHost) {
      sqlite.prepare(`UPDATE event_hosts SET role = 'PRIMARY' WHERE event_id = ? AND user_id = ?`).run(yesCoachId, owner.id);
    } else {
      db.insert(eventHosts).values({
        eventId: yesCoachId,
        userId: owner.id,
        role: "PRIMARY",
        addedByUserId: null,
        createdAt: new Date().toISOString(),
      } as any).run();
    }
    db.update(events).set({ isClaimable: false, claimedBy: owner.username }).where(eq(events.id, yesCoachId)).run();

    for (const userId of userIds) {
      sqlite.prepare(`DELETE FROM event_hosts WHERE user_id = ? AND event_id != ?`).run(userId, yesCoachId);
      sqlite.prepare(`DELETE FROM event_talent WHERE user_id = ? AND event_id != ?`).run(userId, yesCoachId);
    }

    const clearClaimed = sqlite.prepare(`
      UPDATE events
      SET claimed_by = NULL
      WHERE id != ?
        AND claimed_by IS NOT NULL
        AND LOWER(TRIM(claimed_by)) = ?
    `);
    const clearSubmitted = sqlite.prepare(`
      UPDATE events
      SET submitted_by = NULL
      WHERE id != ?
        AND submitted_by IS NOT NULL
        AND LOWER(TRIM(submitted_by)) = ?
    `);
    for (const identity of [...usernames, ...emails]) {
      clearClaimed.run(yesCoachId, identity);
      clearSubmitted.run(yesCoachId, identity);
    }
  }

  const clearHistoricalSubmissions = sqlite.prepare(`
    DELETE FROM submissions
    WHERE LOWER(TRIM(submitter_email)) = ?
      AND status IN ('APPROVED', 'REJECTED')
  `);
  for (const email of emails) clearHistoricalSubmissions.run(email);

  releaseSiteOwnerPendingGifts(owner.id);
  for (const userId of userIds) {
    if (userId !== owner.id) releaseSiteOwnerPendingGifts(userId);
  }
}

function releaseSiteOwnerPendingGifts(userId: number) {
  sqlite.prepare(`
    UPDATE gifting_posts
    SET status = CASE WHEN post_type = 'ISO' THEN 'LOOKING' ELSE 'OPEN' END
    WHERE user_id = ? AND status = 'PENDING'
  `).run(userId);
}

function notifyGuideInbox(
  toUserId: number,
  subject: string,
  body: string,
  opts?: { contextType?: string; contextId?: number | null; contextLabel?: string | null },
) {
  const sender = resolveSiteOwner();
  if (!sender) return;
  storage.sendMessage(sender.id, toUserId, subject, body, {
    contextType: opts?.contextType || "GUIDE_UPDATE",
    contextId: opts?.contextId ?? null,
    contextLabel: opts?.contextLabel || null,
  });
}

function notifySubmissionOutcome(
  sub: { id: number; title: string; type: string; submitterEmail: string },
  approved: boolean,
  reason?: string,
) {
  const recipient = storage.getUserByEmail(sub.submitterEmail);
  if (!recipient) return;
  if (approved) {
    const body = sub.type === "CLAIM"
      ? `Your claim for "${sub.title}" was approved. Open your dashboard to manage the event and post host updates.`
      : `Your event "${sub.title}" is live on the Pride Guide. Open your dashboard to see it listed.`;
    notifyGuideInbox(recipient.id, `Approved: ${sub.title}`, body, {
      contextType: "SUBMISSION",
      contextId: sub.id,
      contextLabel: sub.title,
    });
    return;
  }
  const body = `Your submission "${sub.title}" was not approved.${reason ? `\n\nReason: ${reason}` : ""}\n\nYou can revise and submit again from the Promoters page.`;
  notifyGuideInbox(recipient.id, `Submission update: ${sub.title}`, body, {
    contextType: "SUBMISSION",
    contextId: sub.id,
    contextLabel: sub.title,
  });
}

function ensureSiteAdminGigPost() {
  ensureGigPostsSchema();
  const owner = resolveSiteOwner();
  const now = new Date().toISOString();
  const existingId = findSiteAdminGigPostId();
  const payload = {
    postType: "POSTING_GIG",
    title: SITE_ADMIN_GIG_TITLE,
    name: owner?.displayName || "Tucker",
    contactEmail: owner?.email || "hello@pdxprideguide.com",
    description: SITE_ADMIN_GIG_DESCRIPTION,
    skills: "Moderation, Event review, Community support, Detail-oriented",
    compensation: "Volunteer — community help",
    location: "Portland / Remote",
    isRemote: true,
    status: "LIVE",
    userId: owner?.id ?? null,
    createdAt: now,
  };

  if (existingId != null) {
    if (owner?.id != null) linkSiteAdminGigPostToOwner(owner.id);
    return;
  }
  insertGigPostCompat(payload);
  if (owner?.id != null) linkSiteAdminGigPostToOwner(owner.id);
}

function removeGiftingSeedPosts() {
  sqlite.prepare(`
    DELETE FROM gifting_posts
    WHERE title IN ('Extra rainbow string lights', 'Black mesh party top', 'ISO folding chair for parade day')
       OR user_id IN (SELECT id FROM users WHERE username = 'community_closet')
  `).run();
  sqlite.prepare(`
    DELETE FROM users
    WHERE username = 'community_closet'
      AND NOT EXISTS (SELECT 1 FROM gifting_posts WHERE user_id = users.id)
  `).run();
}

function attendanceInitials(handle: string): string {
  const clean = String(handle || "?").replace(/^@/, "").trim();
  if (!clean) return "?";
  const parts = clean.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return clean.slice(0, 2).toUpperCase();
}

function maskAttendances(viewerUserId: number | undefined, rows: any[]): any[] {
    const viewerRsvped = viewerUserId != null && rows.some((r: any) => r.user_id === viewerUserId);
    if (viewerRsvped) return rows;
    return rows.map((r: any) => ({
      id: r.id,
      event_id: r.event_id,
      handle: r.handle,
      message: r.message,
      avatar_seed: r.avatar_seed,
      photo_url: null,
      created_at: r.created_at,
      is_active: r.is_active,
      masked: true,
    }));
}

export interface IStorage {
  // Events
  getEvents(filters?: { status?: string; day?: string }): Event[];
  countEventsBySource(source: string, status?: string): number;
  getEvent(id: number): Event | undefined;
  getPendingClaimEventIds(): number[];
  createEvent(data: InsertEvent): Event;
  updateEventStatus(id: number, status: string): void;
  updateEvent(id: number, data: Partial<InsertEvent>): Event | undefined;
  toggleClaimable(id: number, isClaimable: boolean): void;
  // Submissions
  getSubmissions(status?: string): Submission[];
  getSubmission(id: number): Submission | undefined;
  createSubmission(data: InsertSubmission): Submission;
  approveSubmission(id: number, adminName: string): Submission | undefined;
  rejectSubmission(id: number, reason: string): void;
  // Gigs
  getGigPosts(status?: string): GigPost[];
  createGigPost(data: InsertGigPost): GigPost;
  getGigPostsByUser(userId: number): GigPost[];
  updateGigPost(id: number, userId: number, data: Partial<GigPost>): void;
  deleteGigPost(id: number, userId: number): void;
  adminUpdateGigStatus(id: number, status: string): void;
  adminUpdateGigPost(id: number, data: Partial<GigPost>): GigPost | undefined;
  ensureSiteAdminGigPost(): void;
  syncSiteOwnerPortfolio(): void;
  isSiteOwnerUser(user: { id?: number | null; email?: string | null; username?: string | null } | null | undefined): boolean;
  // Promoters
  getPromoterByEmail(email: string): Promoter | undefined;
  createPromoter(data: InsertPromoter): Promoter;
  // Moderation requests
  getModerationRequests(status?: string): ModerationRequest[];
  createModerationRequest(data: InsertModerationRequest): ModerationRequest;
  resolveModerationRequest(id: number, status: "APPROVED" | "REJECTED", adminNotes?: string): void;
  dismissStaleTestModerationRequests(): number;
  getAdminPendingCount(): number;
  hasSiteAdminGrant(userId: number): boolean;
  ensureSiteAdminGrant(userId: number, grantedByUserId: number | null, note?: string | null, createdAt?: string): void;
  listSiteAdmins(): Array<{
    userId: number;
    username: string;
    email: string;
    displayName: string | null;
    source: "env" | "granted";
    protected: boolean;
    grantedAt: string;
    grantedByUsername: string | null;
    note: string | null;
  }>;
  grantSiteAdminByIdentifier(identifier: string, grantedByUserId: number | null, note?: string): { admin?: any; error?: string };
  revokeSiteAdmin(userId: number): { ok?: boolean; error?: string };
  // Attendance
  getAttendances(eventId: number, viewerUserId?: number): any[];
  getAttendanceSummaries(): Record<number, { count: number; preview: Array<{ id: number; initials: string; avatarSeed: string }> }>;
  getAttendancesByUser(userId: number): any[];
  upsertAttendance(eventId: number, user: User, message: string): Attendance;
  removeAttendance(eventId: number, userId: number): void;
  // Users
  getUserById(id: number): User | undefined;
  getUserByEmail(email: string): User | undefined;
  getUserByUsername(username: string): User | undefined;
  getUserByGoogleId(googleId: string): User | undefined;
  createUser(data: { username: string; email: string; passwordHash: string; displayName?: string; googleId?: string }): User;
  linkGoogleToUser(id: number, googleId: string): void;
  updateUser(id: number, data: Partial<Pick<User, 'displayName' | 'avatarChoice' | 'avatarRing' | 'avatarCrop' | 'bio' | 'photoUrl' | 'promoterStatus' | 'subAdmin'>>): void;
  updatePasswordHash(id: number, passwordHash: string): void;
  setPromoterStatus(userId: number, status: string): void;
  getAllUsers(): User[];
  autoApproveSubmission(id: number, claimedByUsername: string): void;
  getPendingPromoterRequests(): any[];
  // Host messages
  getHostMessages(eventId: number, limit?: number): any[];
  createHostMessage(data: InsertHostMessage): HostMessage;
  notifyAttendeesOfHostUpdate(eventId: number, hostUserId: number, eventTitle: string, body: string): number;
  getEventHosts(eventId: number): any[];
  isUserEventHost(eventId: number, userId: number): boolean;
  setPrimaryEventHost(eventId: number, userId: number, addedByUserId: number | null): void;
  addEventCoHost(eventId: number, inviterUserId: number, username: string, email: string): { host?: any; error?: string };
  replaceEventPrimaryHost(eventId: number, newUserId: number): void;
  // Event talent
  getEventTalent(eventId: number, opts?: { includePending?: boolean }): any[];
  getEventTalentByUser(userId: number): Record<number, { roles: EventTalentRole[]; status: "LIVE" | "PENDING" }>;
  getEventTalentById(talentId: number): any | undefined;
  addEventTalentByHost(eventId: number, hostUserId: number, username: string, role: EventTalentRole, opts?: { isAdmin?: boolean }): { talent?: any; error?: string };
  requestEventTalentSelf(eventId: number, userId: number, role: EventTalentRole): { talent?: any; error?: string };
  approveEventTalent(talentId: number, approverUserId: number, opts?: { isAdmin?: boolean }): { talent?: any; error?: string };
  rejectEventTalent(talentId: number, approverUserId: number, opts?: { isAdmin?: boolean }): { ok?: boolean; error?: string };
  removeEventTalent(talentId: number, userId: number, opts?: { isAdmin?: boolean }): { ok?: boolean; error?: string };
  getPendingTalentForUnclaimedEvents(): any[];
  eventNeedsAdminTalentApproval(eventId: number): boolean;
  getEventTalentApproverUserIds(eventId: number): number[];
  canApproveEventTalent(talentId: number, userId: number, isAdmin?: boolean): boolean;
  // Messages
  getInbox(userId: number): Message[];
  getSentMessages(userId: number): Message[];
  getUnreadCount(userId: number): number;
  sendMessage(fromUserId: number, toUserId: number, subject: string, body: string, opts?: { threadId?: string; contextType?: string; contextId?: number | null; contextLabel?: string | null }): Message;
  markRead(messageId: number): void;
  markReadForUser(messageId: number, userId: number): boolean;
  getThread(threadId: string): Message[];
  softDeleteThread(threadId: string, userId: number): number;
  softDeleteTalentRequestThreads(talentId: number, userId: number): void;
  clearInboxFolder(userId: number, folder: "inbox" | "sent" | "all"): number;
  // Missed connections
  getMissedConnection(id: number): MissedConnection | undefined;
  getMissedConnections(status?: string, viewerUserId?: number): any[];
  getMissedConnectionsByEvent(eventId: number, viewerUserId?: number): any[];
  getMissedConnectionsByUser(userId: number): MissedConnection[];
  getPostableEventsForMissedConnections(requireToday?: boolean): Event[];
  getLinkableEventsForMissedConnections(): Array<{
    id: number;
    title: string;
    venueName: string;
    dayOfWeek: string | null;
    dateStart: string;
    dateEnd: string | null;
    postable: boolean;
    timing: "upcoming" | "live" | "past";
  }>;
  createMissedConnection(data: InsertMissedConnection & { closesAt?: string | null }): MissedConnection;
  updateMissedConnection(id: number, userId: number, data: Partial<MissedConnection>): MissedConnection | undefined;
  deleteMissedConnection(id: number, userId: number): void;
  archiveExpiredMissedConnections(): void;
  createMissedConnectionThread(threadId: string, missedConnectionId: number, posterUserId: number, replierUserId: number): void;
  getMissedConnectionThread(threadId: string): any | undefined;
  revealMissedConnectionIdentity(threadId: string, userId: number): any | undefined;
  getThreadForViewer(threadId: string, viewerUserId: number): any[];
  maskMessageParty(msg: any, viewerUserId: number, tab: "inbox" | "sent"): any;
  // Gifting
  getGiftingPosts(opts?: { includeInactive?: boolean; status?: string; userId?: number; viewerUserId?: number }): any[];
  deleteGiftingPost(id: number, userId: number, opts?: { isAdmin?: boolean }): void;
  getGiftingPost(id: number): any | undefined;
  getGiftingPostsByUser(userId: number): any[];
  createGiftingPost(data: InsertGiftingPost, status?: string): GiftingPost;
  addGiftingInterest(data: InsertGiftingInterest): GiftingInterest;
  chooseGiftingInterest(postId: number, interestId: number, ownerUserId: number): GiftingInterest | undefined;
  markGiftingResolved(postId: number, userId: number, status: "GIFTED" | "FOUND"): void;
  reopenGiftingPost(postId: number, userId: number): void;
  renewGiftingPost(postId: number, userId: number): void;
  reportGiftingPost(data: InsertGiftingReport): void;
  getGiftingReports(status?: string): any[];
  updateGiftingPostStatus(id: number, status: string, adminNotes?: string): void;
  resolveGiftingReport(id: number, adminNotes?: string): void;
  expireGiftingPosts(): void;
  // Soft launch feedback
  createFeedbackReport(data: InsertFeedbackReport): FeedbackReport;
  getFeedbackReports(status?: string): FeedbackReport[];
  resolveFeedbackReport(id: number): void;
}

export const storage: IStorage = {
  getEvents(filters) {
    const rows = db.select().from(events).all();
    return rows.filter(e => {
      if (filters?.status && filters.status !== "" && e.status !== filters.status) return false;
      if (filters?.day && e.dayOfWeek !== filters.day) return false;
      return true;
    });
  },
  countEventsBySource(source, status) {
    if (status) {
      const row = sqlite.prepare(`
        SELECT COUNT(*) AS count FROM events WHERE source = ? AND status = ?
      `).get(source, status) as { count: number };
      return row?.count ?? 0;
    }
    const row = sqlite.prepare(`
      SELECT COUNT(*) AS count FROM events WHERE source = ?
    `).get(source) as { count: number };
    return row?.count ?? 0;
  },
  getEvent(id) {
    return db.select().from(events).where(eq(events.id, id)).get();
  },
  getPendingClaimEventIds() {
    return sqlite.prepare(`
      SELECT DISTINCT event_id AS eventId
      FROM submissions
      WHERE type = 'CLAIM' AND status = 'PENDING' AND event_id IS NOT NULL
    `).all().map((row: any) => Number(row.eventId));
  },
  createEvent(data) {
    return db.insert(events).values({ ...data, createdAt: new Date().toISOString() }).returning().get();
  },
  updateEventStatus(id, status) {
    db.update(events).set({ status }).where(eq(events.id, id)).run();
  },
  updateEvent(id, data) {
    db.update(events).set(data as any).where(eq(events.id, id)).run();
    return db.select().from(events).where(eq(events.id, id)).get();
  },
  toggleClaimable(id, isClaimable) {
    db.update(events).set({ isClaimable }).where(eq(events.id, id)).run();
  },
  getSubmissions(status) {
    const rows = db.select().from(submissions).all();
    if (status) return rows.filter(s => s.status === status);
    return rows;
  },
  getSubmission(id) {
    return db.select().from(submissions).where(eq(submissions.id, id)).get();
  },
  createSubmission(data) {
    return db.insert(submissions).values({
      ...data,
      status: "PENDING",
      approvals: "[]",
      createdAt: new Date().toISOString(),
    }).returning().get();
  },
  getAllUsers() {
    return db.select().from(users).all();
  },
  autoApproveSubmission(id, claimedByUsername) {
    const sub = db.select().from(submissions).where(eq(submissions.id, id)).get();
    if (!sub || sub.type !== "NEW_EVENT") return;
    db.update(submissions).set({ status: "APPROVED", approvals: JSON.stringify([claimedByUsername]) }).where(eq(submissions.id, id)).run();
    db.insert(events).values({
      title: sub.title, description: sub.description,
      venueName: sub.venueName, address: sub.address,
      neighborhood: sub.neighborhood, lat: sub.lat, lng: sub.lng,
      dateStart: sub.dateStart, dateEnd: sub.dateEnd, dayOfWeek: sub.dayOfWeek,
      ageRequirement: sub.ageRequirement, eventTypes: sub.eventTypes,
      admission: sub.admission, ticketUrl: sub.ticketUrl,
      isPublic: sub.isPublic, isPrivate: sub.isPrivate,
      isHouseParty: sub.isHouseParty, isSexPositive: sub.isSexPositive,
      nudityOk: sub.nudityOk, posterImageUrl: sub.posterImageUrl,
      status: "LIVE", source: "user_submitted",
      isClaimable: false, claimedBy: claimedByUsername,
      submittedBy: sub.submitterEmail, adminNotes: null,
      createdAt: new Date().toISOString(),
    }).run();
  },
  approveSubmission(id, adminName) {
    const sub = db.select().from(submissions).where(eq(submissions.id, id)).get();
    if (!sub) return undefined;
    const approvalList = JSON.parse(sub.approvals || "[]");
    if (!approvalList.includes(adminName)) approvalList.push(adminName);
    const newStatus = approvalList.length >= 1 ? "APPROVED" : "PENDING";
    db.update(submissions).set({ approvals: JSON.stringify(approvalList), status: newStatus }).where(eq(submissions.id, id)).run();
    if (newStatus === "APPROVED") {
      if (sub.type === "CLAIM" && sub.eventId) {
        const user = db.select().from(users).where(eq(users.email, sub.submitterEmail)).get();
        db.update(events).set({
          isClaimable: false,
          claimedBy: user?.username || sub.submitterEmail,
          adminNotes: null,
        }).where(eq(events.id, sub.eventId)).run();
        if (user) {
          db.update(users).set({ promoterStatus: "approved" }).where(eq(users.id, user.id)).run();
          storage.setPrimaryEventHost(sub.eventId, user.id, null);
        }
      } else {
        const created = db.insert(events).values({
          title: sub.title, description: sub.description,
          venueName: sub.venueName, address: sub.address,
          neighborhood: sub.neighborhood, lat: sub.lat, lng: sub.lng,
          dateStart: sub.dateStart, dateEnd: sub.dateEnd, dayOfWeek: sub.dayOfWeek,
          ageRequirement: sub.ageRequirement, eventTypes: sub.eventTypes,
          admission: sub.admission, ticketUrl: sub.ticketUrl,
          isPublic: sub.isPublic, isPrivate: sub.isPrivate,
          isHouseParty: sub.isHouseParty, isSexPositive: sub.isSexPositive,
          nudityOk: sub.nudityOk, posterImageUrl: sub.posterImageUrl,
          status: "LIVE", source: "user_submitted",
          isClaimable: false, claimedBy: null,
          submittedBy: sub.submitterEmail, adminNotes: null,
          createdAt: new Date().toISOString(),
        }).returning().get();
        const submitter = db.select().from(users).where(eq(users.email, sub.submitterEmail)).get();
        if (submitter) storage.setPrimaryEventHost(created.id, submitter.id, null);
      }
      notifySubmissionOutcome(sub, true);
    }
    return db.select().from(submissions).where(eq(submissions.id, id)).get();
  },
  rejectSubmission(id, reason) {
    const sub = db.select().from(submissions).where(eq(submissions.id, id)).get();
    db.update(submissions).set({ status: "REJECTED", adminNotes: reason }).where(eq(submissions.id, id)).run();
    if (sub) notifySubmissionOutcome(sub, false, reason);
  },
  getGigPosts(status) {
    ensureGigPostsSchema();
    const rows = sqlite.prepare(`
      SELECT g.*,
             u.username,
             u.display_name AS displayName,
             u.photo_url AS posterPhotoUrl,
             u.avatar_choice AS avatarChoice,
             u.avatar_ring AS posterAvatarRing
      FROM gig_posts g
      LEFT JOIN users u ON u.id = g.user_id
      ORDER BY g.created_at DESC
    `).all().map((row: any) => ({
      id: row.id,
      postType: row.post_type,
      title: row.title,
      name: row.name,
      contactEmail: row.contact_email,
      description: row.description,
      skills: row.skills,
      compensation: row.compensation,
      location: row.location,
      isRemote: Boolean(row.is_remote),
      status: row.status,
      createdAt: row.created_at,
      userId: row.user_id,
      imageUrl: row.image_url,
      gigDate: row.gig_date,
      gigTime: row.gig_time,
      username: row.username,
      displayName: row.displayName,
      posterPhotoUrl: row.posterPhotoUrl,
      avatarChoice: row.avatarChoice,
      posterAvatarRing: row.posterAvatarRing,
    }));
    if (status) return rows.filter(g => g.status === status);
    return rows;
  },
  createGigPost(data) {
    return insertGigPostCompat({ ...data, status: "LIVE", createdAt: new Date().toISOString() });
  },
  getGigPostsByUser(userId) {
    return db.select().from(gigPosts).where(eq(gigPosts.userId, userId)).all();
  },
  updateGigPost(id, userId, data) {
    const params = {
      id,
      userId,
      title: data.title ?? null,
      description: data.description ?? null,
      skills: data.skills ?? null,
      compensation: data.compensation ?? null,
      location: data.location ?? null,
      gigDate: data.gigDate ?? null,
      gigTime: data.gigTime ?? null,
      imageUrl: data.imageUrl ?? null,
    };
    sqlite.prepare(`
      UPDATE gig_posts
      SET title = COALESCE(@title, title),
          description = COALESCE(@description, description),
          skills = COALESCE(@skills, skills),
          compensation = COALESCE(@compensation, compensation),
          location = COALESCE(@location, location),
          gig_date = COALESCE(@gigDate, gig_date),
          gig_time = COALESCE(@gigTime, gig_time),
          image_url = COALESCE(@imageUrl, image_url)
      WHERE id = @id AND user_id = @userId
    `).run(params);
  },
  deleteGigPost(id, userId) {
    sqlite.prepare(`DELETE FROM gig_posts WHERE id = ? AND user_id = ?`).run(id, userId);
  },
  adminUpdateGigStatus(id: number, status: string) {
    sqlite.prepare(`UPDATE gig_posts SET status = ? WHERE id = ?`).run(status, id);
  },
  adminUpdateGigPost(id, data) {
    const existing = sqlite.prepare(`SELECT id FROM gig_posts WHERE id = ?`).get(id);
    if (!existing) return undefined;
    const params = {
      id,
      postType: data.postType ?? null,
      title: data.title ?? null,
      name: data.name ?? null,
      contactEmail: data.contactEmail ?? null,
      description: data.description ?? null,
      skills: data.skills ?? null,
      compensation: data.compensation ?? null,
      location: data.location ?? null,
      isRemote: data.isRemote === undefined ? null : data.isRemote ? 1 : 0,
      status: data.status ?? null,
      gigDate: data.gigDate ?? null,
      gigTime: data.gigTime ?? null,
      imageUrl: data.imageUrl ?? null,
    };
    sqlite.prepare(`
      UPDATE gig_posts
      SET post_type = COALESCE(@postType, post_type),
          title = COALESCE(@title, title),
          name = COALESCE(@name, name),
          contact_email = COALESCE(@contactEmail, contact_email),
          description = COALESCE(@description, description),
          skills = COALESCE(@skills, skills),
          compensation = COALESCE(@compensation, compensation),
          location = COALESCE(@location, location),
          is_remote = COALESCE(@isRemote, is_remote),
          status = COALESCE(@status, status),
          gig_date = COALESCE(@gigDate, gig_date),
          gig_time = COALESCE(@gigTime, gig_time),
          image_url = COALESCE(@imageUrl, image_url)
      WHERE id = @id
    `).run(params);
    return storage.getGigPosts().find(g => g.id === id);
  },
  ensureSiteAdminGigPost() {
    ensureSiteAdminGigPost();
  },
  syncSiteOwnerPortfolio() {
    syncSiteOwnerPortfolio();
  },
  isSiteOwnerUser(user) {
    return isSiteOwnerUser(user);
  },
  getPromoterByEmail(email) {
    return db.select().from(promoters).where(eq(promoters.email, email)).get();
  },
  createPromoter(data) {
    const hashed = hashPassword(data.passwordHash);
    return db.insert(promoters).values({ ...data, passwordHash: hashed, createdAt: new Date().toISOString() }).returning().get();
  },
  getModerationRequests(status) {
    const rows = db.select().from(moderationRequests).all();
    if (status) return rows.filter(r => r.status === status);
    return rows;
  },
  createModerationRequest(data) {
    return db.insert(moderationRequests).values({ ...data, status: "PENDING", createdAt: new Date().toISOString() }).returning().get();
  },
  dismissStaleTestModerationRequests() {
    return runDismissStaleTestModerationRequests();
  },
  getAdminPendingCount() {
    const giftingPending = this.getGiftingPosts({ includeInactive: true })
      .filter((post: any) => post.status === "PENDING").length;
    return (
      this.getSubmissions("PENDING").length
      + this.getModerationRequests("PENDING").length
      + this.getPendingPromoterRequests().length
      + this.getPendingTalentForUnclaimedEvents().length
      + giftingPending
      + this.getGiftingReports("PENDING").length
      + this.getFeedbackReports("OPEN").length
    );
  },
  hasSiteAdminGrant(userId) {
    return !!sqlite.prepare("SELECT 1 FROM site_admin_grants WHERE user_id = ?").get(userId);
  },
  ensureSiteAdminGrant(userId, grantedByUserId, note = null, createdAt = new Date().toISOString()) {
    sqlite.prepare(`
      INSERT INTO site_admin_grants (user_id, granted_by_user_id, note, created_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id) DO NOTHING
    `).run(userId, grantedByUserId, note, createdAt);
  },
  listSiteAdmins() {
    const seen = new Set<number>();
    const admins: Array<{
      userId: number;
      username: string;
      email: string;
      displayName: string | null;
      source: "env" | "granted";
      protected: boolean;
      grantedAt: string;
      grantedByUsername: string | null;
      note: string | null;
    }> = [];
    const pushUser = (user: User, source: "env" | "granted", grantRow?: any) => {
      if (!user || seen.has(user.id)) return;
      seen.add(user.id);
      const protectedAdmin = isEnvListedSiteAdmin(user);
      const grantedBy = grantRow?.granted_by_user_id
        ? storage.getUserById(grantRow.granted_by_user_id)
        : null;
      admins.push({
        userId: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        source: protectedAdmin ? "env" : source,
        protected: protectedAdmin,
        grantedAt: grantRow?.created_at || user.createdAt,
        grantedByUsername: grantedBy?.username || null,
        note: grantRow?.note || null,
      });
    };
    const { emails, usernames } = parseEnvAdminLists();
    for (const email of emails) {
      pushUser(storage.getUserByEmail(email)!, "env");
    }
    for (const username of usernames) {
      pushUser(storage.getUserByUsername(username)!, "env");
    }
    const grantRows = sqlite.prepare(`
      SELECT g.user_id, g.granted_by_user_id, g.note, g.created_at
      FROM site_admin_grants g
      ORDER BY g.created_at ASC
    `).all() as any[];
    for (const row of grantRows) {
      const user = storage.getUserById(row.user_id);
      if (user) pushUser(user, "granted", row);
    }
    return admins.sort((a, b) => a.username.localeCompare(b.username));
  },
  grantSiteAdminByIdentifier(identifier, grantedByUserId, note) {
    const raw = String(identifier || "").trim();
    if (!raw) return { error: "Username or email required" };
    const normalized = raw.replace(/^@/, "").toLowerCase();
    const user = raw.includes("@")
      ? storage.getUserByEmail(normalized)
      : storage.getUserByUsername(normalized);
    if (!user) return { error: "No registered user found with that username or email" };
    if (isEnvListedSiteAdmin(user) || storage.hasSiteAdminGrant(user.id)) {
      return { error: "User is already a site admin" };
    }
    storage.ensureSiteAdminGrant(user.id, grantedByUserId, note || "Granted from admin dashboard");
    return { admin: storage.listSiteAdmins().find(a => a.userId === user.id) };
  },
  revokeSiteAdmin(userId) {
    const user = storage.getUserById(userId);
    if (!user) return { error: "User not found" };
    if (isEnvListedSiteAdmin(user)) return { error: "Owner admins configured in Railway env cannot be removed here" };
    if (!storage.hasSiteAdminGrant(userId)) return { error: "User is not a granted site admin" };
    sqlite.prepare("DELETE FROM site_admin_grants WHERE user_id = ?").run(userId);
    return { ok: true };
  },
  resolveModerationRequest(id, status, adminNotes) {
    const req = db.select().from(moderationRequests).where(eq(moderationRequests.id, id)).get();
    db.update(moderationRequests).set({ status, adminNotes: adminNotes || null }).where(eq(moderationRequests.id, id)).run();
    if (!req) return;
    if (status === "APPROVED") {
      if (req.type === "REMOVE") {
        db.update(events).set({ status: "REMOVED" }).where(eq(events.id, req.eventId)).run();
      }
      if (req.type === "TRANSFER") {
        const target = String(req.proof || "").split(" — ")[0].trim();
        const nextOwner = storage.getUserByUsername(target) || storage.getUserByEmail(target);
        if (nextOwner) {
          storage.replaceEventPrimaryHost(req.eventId, nextOwner.id);
        }
      }
      if (req.type === "FLAG") {
        const evt = db.select().from(events).where(eq(events.id, req.eventId)).get();
        if (evt) {
          db.update(events).set({
            adminNotes: [evt.adminNotes, `FLAG: ${req.proof}`].filter(Boolean).join(" | ").slice(0, 500),
          }).where(eq(events.id, req.eventId)).run();
        }
      }
      if (req.type === "CLAIM") {
        const evt = db.select().from(events).where(eq(events.id, req.eventId)).get();
        const user = storage.getUserByEmail(req.requesterEmail);
        if (evt && user) {
          db.update(events).set({
            isClaimable: false,
            claimedBy: user.username || req.requesterEmail,
            adminNotes: null,
          }).where(eq(events.id, req.eventId)).run();
          storage.setPrimaryEventHost(req.eventId, user.id, null);
          if (user.promoterStatus !== "approved") {
            db.update(users).set({ promoterStatus: "approved" }).where(eq(users.id, user.id)).run();
          }
          notifyGuideInbox(
            user.id,
            `Claim approved: ${evt.title}`,
            `Your claim for "${evt.title}" was approved. Open your dashboard to manage the event and post host updates.`,
            { contextType: "EVENT_CLAIM", contextId: evt.id, contextLabel: evt.title },
          );
        }
      }
    } else if (status === "REJECTED" && req.type === "CLAIM") {
      const user = storage.getUserByEmail(req.requesterEmail);
      if (user) {
        notifyGuideInbox(
          user.id,
          `Claim update: ${req.eventTitle || `Event #${req.eventId}`}`,
          `Your claim wasn't approved right now.${adminNotes ? `\n\nNote: ${adminNotes}` : ""}\n\nYou can submit again with more proof from the event page.`,
          { contextType: "EVENT_CLAIM", contextId: req.eventId, contextLabel: req.eventTitle || null },
        );
      }
    }
  },
    getAttendances(eventId, viewerUserId) {      return maskAttendances(viewerUserId, sqlite.prepare(`      SELECT a.*, u.username, u.display_name AS displayName, u.photo_url AS userPhotoUrl, u.avatar_choice AS avatarChoice, u.avatar_ring AS avatarRing
      FROM attendances a
      LEFT JOIN users u ON u.id = a.user_id
      WHERE a.event_id = ? AND a.is_active = 1
      ORDER BY a.created_at DESC
      `).all(eventId) as any[]);  },
  getAttendanceSummaries() {
    const rows = sqlite.prepare(`
      SELECT
        a.id,
        a.event_id AS eventId,
        a.user_id AS userId,
        a.handle,
        a.avatar_seed AS avatarSeed,
        u.avatar_ring AS avatarRing,
        u.avatar_choice AS avatarChoice,
        u.photo_url AS photoUrl
      FROM attendances a
      LEFT JOIN users u ON u.id = a.user_id
      WHERE a.is_active = 1
      ORDER BY a.created_at DESC
    `).all() as Array<{
      id: number;
      eventId: number;
      userId: number | null;
      handle: string;
      avatarSeed: string;
      avatarRing: string | null;
      avatarChoice: number | null;
      photoUrl: string | null;
    }>;
    const map: Record<number, { count: number; preview: Array<{ id: number; initials: string; avatarSeed: string; userId?: number | null; avatarRing?: string | null; avatarChoice?: number | null; photoUrl?: string | null }> }> = {};
    for (const row of rows) {
      if (!map[row.eventId]) map[row.eventId] = { count: 0, preview: [] };
      map[row.eventId].count += 1;
      if (map[row.eventId].preview.length < 8) {
        map[row.eventId].preview.push({
          id: row.id,
          initials: attendanceInitials(row.handle),
          avatarSeed: row.avatarSeed || row.handle,
        });
      }
    }
    return map;
  },
  getAttendancesByUser(userId) {
    return sqlite.prepare(`
      SELECT
        a.id,
        a.event_id AS eventId,
        a.user_id AS userId,
        a.handle,
        a.message,
        a.avatar_seed AS avatarSeed,
        a.photo_url AS photoUrl,
        a.is_active AS isActive,
        a.created_at AS createdAt,
        e.title AS eventTitle,
        e.venue_name AS venueName,
        e.date_start AS dateStart
      FROM attendances a
      LEFT JOIN events e ON e.id = a.event_id
      WHERE a.user_id = ? AND a.is_active = 1
      ORDER BY e.date_start ASC
    `).all(userId) as any[];
  },
  upsertAttendance(eventId, user, message) {
    const handle = user.displayName || user.username;
    const existing = sqlite.prepare(`SELECT * FROM attendances WHERE event_id = ? AND user_id = ?`).get(eventId, user.id) as Attendance | undefined;
    const values = {
      eventId,
      userId: user.id,
      handle,
      message,
      avatarSeed: user.username,
      photoUrl: user.photoUrl || null,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    if (existing) {
      db.update(attendances).set(values as any).where(eq(attendances.id, existing.id)).run();
      return db.select().from(attendances).where(eq(attendances.id, existing.id)).get()!;
    }
    return db.insert(attendances).values(values as any).returning().get();
  },
  removeAttendance(eventId, userId) {
    sqlite.prepare(`UPDATE attendances SET is_active = 0 WHERE event_id = ? AND user_id = ?`).run(eventId, userId);
  },
  // Users
  getUserById(id) {
    return db.select().from(users).where(eq(users.id, id)).get();
  },
  getUserByEmail(email) {
    return db.select().from(users).where(eq(users.email, email)).get();
  },
  getUserByUsername(username) {
    return db.select().from(users).where(eq(users.username, username)).get();
  },
  getUserByGoogleId(googleId) {
    return db.select().from(users).where(eq(users.googleId, googleId)).get();
  },
  createUser({ username, email, passwordHash, displayName, googleId }) {
    const hashed = hashPassword(passwordHash);
    return db.insert(users).values({
      username, email, passwordHash: hashed,
      displayName: displayName || null,
      googleId: googleId || null,
      avatarChoice: 1,
      status: "active",
      createdAt: new Date().toISOString(),
    }).returning().get();
  },
  linkGoogleToUser(id, googleId) {
    db.update(users).set({ googleId }).where(eq(users.id, id)).run();
  },
  updateUser(id, data) {
    db.update(users).set(data).where(eq(users.id, id)).run();
  },
  updatePasswordHash(id, passwordHash) {
    db.update(users).set({ passwordHash }).where(eq(users.id, id)).run();
  },
  setPromoterStatus(userId, status) {
    db.update(users).set({ promoterStatus: status }).where(eq(users.id, userId)).run();
    if (status === "approved") {
      notifyGuideInbox(
        userId,
        "Promoter access approved",
        "You can now submit new events from the Promoters page. Claims you make will also move through review.",
        { contextType: "PROMOTER" },
      );
    } else if (status === "rejected") {
      notifyGuideInbox(
        userId,
        "Promoter request update",
        "Your promoter request wasn't approved right now. You can still claim existing listings — those go through the review queue.",
        { contextType: "PROMOTER" },
      );
    }
  },
  getPendingPromoterRequests() {
    const pendingByStatus = db.select().from(users).all().filter((u: any) => u.promoterStatus === "pending");
    const seenIds = new Set(pendingByStatus.map((u: any) => u.id));
    const allUsers = [...pendingByStatus];

    const pendingClaimSubs = db.select().from(submissions).all()
      .filter((s: any) => s.type === "CLAIM" && s.status === "PENDING" && !!s.submitterEmail);
    for (const sub of pendingClaimSubs) {
      const u = db.select().from(users).where(eq(users.email, sub.submitterEmail!)).get();
      if (u && !seenIds.has(u.id) && u.promoterStatus !== "approved") {
        seenIds.add(u.id);
        allUsers.push(u);
      }
    }

    return allUsers.map((u: any) => {
      const claimSub = db.select().from(submissions).all()
        .filter((s: any) => s.submitterEmail === u.email && s.type === "CLAIM")
        .sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt))[0];
      const evt = claimSub?.eventId
        ? db.select().from(events).where(eq(events.id, claimSub.eventId)).get()
        : undefined;
      return {
        id: u.id,
        username: u.username,
        email: u.email,
        displayName: u.displayName,
        promoterStatus: u.promoterStatus,
        submissionId: claimSub?.id ?? null,
        eventId: claimSub?.eventId ?? null,
        claimReason: claimSub?.claimReason ?? null,
        submitterOrg: claimSub?.submitterOrg ?? null,
        requestedAt: claimSub?.createdAt ?? u.createdAt,
        eventTitle: evt?.title ?? null,
      };
    }).sort((a: any, b: any) => String(b.requestedAt).localeCompare(String(a.requestedAt)));
  },
  getHostMessages(eventId, limit = 2) {
    return sqlite.prepare(`
      SELECT hm.*, u.display_name AS displayName, u.username
      FROM host_messages hm
      LEFT JOIN users u ON u.id = hm.user_id
      WHERE hm.event_id = ?
      ORDER BY hm.created_at DESC
      LIMIT ?
    `).all(eventId, limit) as any[];
  },
  createHostMessage(data) {
    return db.insert(hostMessages).values({
      ...data,
      createdAt: new Date().toISOString(),
    }).returning().get();
  },
  notifyAttendeesOfHostUpdate(eventId, hostUserId, eventTitle, body) {
    const rows = sqlite.prepare(`
      SELECT DISTINCT user_id AS userId
      FROM attendances
      WHERE event_id = ? AND is_active = 1 AND user_id IS NOT NULL AND user_id != ?
    `).all(eventId, hostUserId) as { userId: number }[];
    let sent = 0;
    for (const row of rows) {
      storage.sendMessage(hostUserId, row.userId, `Host update: ${eventTitle}`, body, {
        contextType: "HOST_UPDATE",
        contextId: eventId,
        contextLabel: eventTitle,
      });
      sent += 1;
    }
    return sent;
  },
  getEventHosts(eventId) {
    ensureEventHostsSchema();
    return sqlite.prepare(`
      SELECT
        eh.user_id AS userId,
        eh.role,
        u.username,
        u.display_name AS displayName,
        u.photo_url AS photoUrl,
        u.avatar_choice AS avatarChoice,
        u.avatar_ring AS avatarRing
      FROM event_hosts eh
      LEFT JOIN users u ON u.id = eh.user_id
      WHERE eh.event_id = ?
      ORDER BY CASE eh.role WHEN 'PRIMARY' THEN 0 ELSE 1 END, eh.created_at ASC
    `).all(eventId) as any[];
  },
  isUserEventHost(eventId, userId) {
    ensureEventHostsSchema();
    const row = sqlite.prepare(`
      SELECT 1 AS ok FROM event_hosts WHERE event_id = ? AND user_id = ? LIMIT 1
    `).get(eventId, userId) as { ok: number } | undefined;
    if (row?.ok) return true;
    const evt = db.select().from(events).where(eq(events.id, eventId)).get();
    if (!evt) return false;
    const user = db.select().from(users).where(eq(users.id, userId)).get();
    if (!user) return false;
    if (evt.claimedBy && user.username === evt.claimedBy) return true;
    if (evt.submittedBy && (user.email === evt.submittedBy || user.username === evt.submittedBy)) return true;
    return false;
  },
  setPrimaryEventHost(eventId, userId, addedByUserId) {
    ensureEventHostsSchema();
    const user = db.select().from(users).where(eq(users.id, userId)).get();
    if (!user) return;
    sqlite.prepare(`DELETE FROM event_hosts WHERE event_id = ? AND role = 'PRIMARY'`).run(eventId);
    const existing = sqlite.prepare(`SELECT id FROM event_hosts WHERE event_id = ? AND user_id = ?`).get(eventId, userId);
    if (existing) {
      sqlite.prepare(`UPDATE event_hosts SET role = 'PRIMARY' WHERE event_id = ? AND user_id = ?`).run(eventId, userId);
    } else {
      db.insert(eventHosts).values({
        eventId,
        userId,
        role: "PRIMARY",
        addedByUserId: addedByUserId ?? null,
        createdAt: new Date().toISOString(),
      } as any).run();
    }
    db.update(events).set({ claimedBy: user.username, isClaimable: false }).where(eq(events.id, eventId)).run();
  },
  replaceEventPrimaryHost(eventId, newUserId) {
    sqlite.prepare(`DELETE FROM event_hosts WHERE event_id = ?`).run(eventId);
    storage.setPrimaryEventHost(eventId, newUserId, null);
  },
  addEventCoHost(eventId, inviterUserId, username, email) {
    ensureEventHostsSchema();
    if (!storage.isUserEventHost(eventId, inviterUserId)) {
      return { error: "Only event hosts can add co-hosts" };
    }
    const countRow = sqlite.prepare(`SELECT COUNT(*) AS count FROM event_hosts WHERE event_id = ?`).get(eventId) as { count: number };
    if (countRow.count >= MAX_EVENT_HOSTS) {
      return { error: `Maximum ${MAX_EVENT_HOSTS} hosts per event` };
    }
    const uname = username.trim();
    const em = email.trim().toLowerCase();
    if (!uname || !em) return { error: "Username and email required" };
    const target = storage.getUserByUsername(uname);
    if (!target) return { error: "No account found with that username" };
    if ((target.email || "").trim().toLowerCase() !== em) {
      return { error: "Email does not match that username" };
    }
    if (storage.isUserEventHost(eventId, target.id)) {
      return { error: "That person is already a host for this event" };
    }
    db.insert(eventHosts).values({
      eventId,
      userId: target.id,
      role: "COHOST",
      addedByUserId: inviterUserId,
      createdAt: new Date().toISOString(),
    } as any).run();
    storage.sendMessage(
      inviterUserId,
      target.id,
      `You're now a co-host`,
      `You were added as a co-host for an event. Check your dashboard for host tools.`,
      { contextType: "EVENT_HOST", contextId: eventId, contextLabel: db.select().from(events).where(eq(events.id, eventId)).get()?.title || "Event" },
    );
    const host = storage.getEventHosts(eventId).find((h: any) => h.userId === target.id);
    return { host };
  },
  getEventTalent(eventId, opts) {
    ensureEventTalentSchema();
    const statusFilter = opts?.includePending ? "" : `AND et.status = 'LIVE'`;
    return sqlite.prepare(`
      SELECT
        et.id,
        et.event_id AS eventId,
        et.user_id AS userId,
        et.role,
        et.status,
        et.added_by_user_id AS addedByUserId,
        et.created_at AS createdAt,
        u.username,
        u.display_name AS displayName,
        u.photo_url AS photoUrl,
        u.avatar_choice AS avatarChoice,
        u.avatar_ring AS avatarRing
      FROM event_talent et
      LEFT JOIN users u ON u.id = et.user_id
      WHERE et.event_id = ? ${statusFilter}
      ORDER BY et.role ASC, et.created_at ASC
    `).all(eventId) as any[];
  },
  getEventTalentByUser(userId) {
    ensureEventTalentSchema();
    const rows = sqlite.prepare(`
      SELECT event_id AS eventId, role, status
      FROM event_talent
      WHERE user_id = ? AND status IN ('LIVE', 'PENDING')
      ORDER BY event_id ASC, role ASC
    `).all(userId) as Array<{ eventId: number; role: string; status: string }>;
    const map: Record<number, { roles: EventTalentRole[]; status: "LIVE" | "PENDING" }> = {};
    for (const row of rows) {
      if (!isEventTalentRole(row.role)) continue;
      if (!map[row.eventId]) map[row.eventId] = { roles: [], status: "PENDING" };
      if (!map[row.eventId].roles.includes(row.role)) map[row.eventId].roles.push(row.role);
      if (row.status === "LIVE") map[row.eventId].status = "LIVE";
    }
    return map;
  },
  getEventTalentById(talentId) {
    ensureEventTalentSchema();
    return sqlite.prepare(`
      SELECT
        et.id,
        et.event_id AS eventId,
        et.user_id AS userId,
        et.role,
        et.status,
        et.added_by_user_id AS addedByUserId,
        et.created_at AS createdAt,
        e.title AS eventTitle,
        e.is_claimable AS isClaimable,
        u.username,
        u.display_name AS displayName
      FROM event_talent et
      LEFT JOIN events e ON e.id = et.event_id
      LEFT JOIN users u ON u.id = et.user_id
      WHERE et.id = ?
    `).get(talentId) as any | undefined;
  },
  getEventTalentApproverUserIds(eventId) {
    const ids: number[] = [];
    const addUserId = (userId?: number | null) => {
      if (userId && !ids.includes(userId)) ids.push(userId);
    };
    for (const host of storage.getEventHosts(eventId)) addUserId(host.userId);
    if (ids.length > 0) return ids;
    const evt = db.select().from(events).where(eq(events.id, eventId)).get();
    if (!evt) return [];
    if (evt.claimedBy) {
      const owner = storage.getUserByUsername(evt.claimedBy) || storage.getUserByEmail(evt.claimedBy);
      addUserId(owner?.id);
    }
    if (evt.submittedBy) {
      const submitter = storage.getUserByEmail(evt.submittedBy) || storage.getUserByUsername(evt.submittedBy);
      addUserId(submitter?.id);
    }
    return ids;
  },
  eventNeedsAdminTalentApproval(eventId) {
    const evt = db.select().from(events).where(eq(events.id, eventId)).get();
    if (!evt) return false;
    if (!evt.isClaimable) return false;
    return storage.getEventTalentApproverUserIds(eventId).length === 0;
  },
  canApproveEventTalent(talentId, userId, isAdmin = false) {
    const row = storage.getEventTalentById(talentId);
    if (!row || row.status !== "PENDING") return false;
    if (isAdmin && storage.eventNeedsAdminTalentApproval(row.eventId)) return true;
    if (storage.isUserEventHost(row.eventId, userId)) return true;
    return false;
  },
  addEventTalentByHost(eventId, hostUserId, username, role, opts) {
    ensureEventTalentSchema();
    if (!isEventTalentRole(role)) return { error: "Invalid talent role" };
    if (!opts?.isAdmin && !storage.isUserEventHost(eventId, hostUserId)) {
      return { error: "Only event hosts can add talent" };
    }
    const evt = db.select().from(events).where(eq(events.id, eventId)).get();
    if (!evt || evt.status !== "LIVE") return { error: "Event not found" };
    const uname = username.trim().replace(/^@/, "");
    if (!uname) return { error: "Username required" };
    const target = storage.getUserByUsername(uname);
    if (!target) return { error: "No account found with that username" };
    const existing = sqlite.prepare(`
      SELECT id FROM event_talent WHERE event_id = ? AND user_id = ? AND role = ? AND status IN ('LIVE', 'PENDING')
    `).get(eventId, target.id, role);
    if (existing) return { error: "That person is already listed for this role" };
    const created = db.insert(eventTalent).values({
      eventId,
      userId: target.id,
      role,
      status: "LIVE",
      addedByUserId: hostUserId,
      createdAt: new Date().toISOString(),
    } as any).returning().get();
    const talent = storage.getEventTalent(eventId, { includePending: true }).find((t: any) => t.id === created.id);
    storage.sendMessage(
      hostUserId,
      target.id,
      `You're on the lineup`,
      `You were tagged as ${role} for "${evt.title}".`,
      { contextType: "EVENT_TALENT", contextId: eventId, contextLabel: evt.title },
    );
    return { talent };
  },
  requestEventTalentSelf(eventId, userId, role) {
    ensureEventTalentSchema();
    if (!isEventTalentRole(role)) return { error: "Invalid talent role" };
    const evt = db.select().from(events).where(eq(events.id, eventId)).get();
    if (!evt || evt.status !== "LIVE") return { error: "Event not found" };
    const user = storage.getUserById(userId);
    if (!user) return { error: "Not authenticated" };
    const existing = sqlite.prepare(`
      SELECT id, status FROM event_talent WHERE event_id = ? AND user_id = ? AND role = ?
    `).get(eventId, userId, role) as { id: number; status: string } | undefined;
    if (existing?.status === "LIVE") return { error: "You're already on the lineup for this role" };
    if (existing?.status === "PENDING") return { error: "Your request is already pending approval" };
    const created = db.insert(eventTalent).values({
      eventId,
      userId,
      role,
      status: "PENDING",
      addedByUserId: userId,
      createdAt: new Date().toISOString(),
    } as any).returning().get();
    const roleLabel = EVENT_TALENT_ROLE_LABELS[role];
    const body = `${user.displayName || user.username} (@${user.username}) requested to be listed as ${roleLabel} for "${evt.title}". Approve to add them to the public lineup.`;
    const approverIds = storage.getEventTalentApproverUserIds(eventId);
    if (approverIds.length > 0) {
      for (const approverId of approverIds) {
        storage.sendMessage(
          userId,
          approverId,
          `Talent request: ${roleLabel}`,
          body,
          { contextType: "EVENT_TALENT_REQUEST", contextId: created.id, contextLabel: evt.title },
        );
      }
    }
    const talent = storage.getEventTalent(eventId, { includePending: true }).find((t: any) => t.id === created.id);
    return { talent, needsAdmin: storage.eventNeedsAdminTalentApproval(eventId) };
  },
  approveEventTalent(talentId, approverUserId, opts) {
    ensureEventTalentSchema();
    const row = storage.getEventTalentById(talentId);
    if (!row || row.status !== "PENDING") return { error: "Request not found or already resolved" };
    if (!storage.canApproveEventTalent(talentId, approverUserId, opts?.isAdmin)) {
      return { error: "Not authorized to approve this request" };
    }
    sqlite.prepare(`UPDATE event_talent SET status = 'LIVE', added_by_user_id = ? WHERE id = ?`).run(approverUserId, talentId);
    const evt = db.select().from(events).where(eq(events.id, row.eventId)).get();
    storage.sendMessage(
      approverUserId,
      row.userId,
      `Lineup approved: ${row.role}`,
      `You're now listed as ${row.role} on "${evt?.title || "the event"}".`,
      { contextType: "EVENT_TALENT", contextId: row.eventId, contextLabel: evt?.title || null },
    );
    const talent = storage.getEventTalentById(talentId);
    return { talent };
  },
  rejectEventTalent(talentId, approverUserId, opts) {
    ensureEventTalentSchema();
    const row = storage.getEventTalentById(talentId);
    if (!row || row.status !== "PENDING") return { error: "Request not found or already resolved" };
    if (!storage.canApproveEventTalent(talentId, approverUserId, opts?.isAdmin)) {
      return { error: "Not authorized to deny this request" };
    }
    sqlite.prepare(`DELETE FROM event_talent WHERE id = ?`).run(talentId);
    const evt = db.select().from(events).where(eq(events.id, row.eventId)).get();
    storage.sendMessage(
      approverUserId,
      row.userId,
      `Lineup request declined`,
      `Your ${row.role} listing request for "${evt?.title || "the event"}" was not approved.`,
      { contextType: "EVENT_TALENT", contextId: row.eventId, contextLabel: evt?.title || null },
    );
    return { ok: true };
  },
  removeEventTalent(talentId, userId, opts) {
    ensureEventTalentSchema();
    const row = storage.getEventTalentById(talentId);
    if (!row) return { error: "Not found" };
    const canManage = opts?.isAdmin || storage.isUserEventHost(row.eventId, userId);
    if (!canManage) return { error: "Not authorized" };
    sqlite.prepare(`DELETE FROM event_talent WHERE id = ?`).run(talentId);
    return { ok: true };
  },
  getPendingTalentForUnclaimedEvents() {
    ensureEventTalentSchema();
    return sqlite.prepare(`
      SELECT
        et.id,
        et.event_id AS eventId,
        et.user_id AS userId,
        et.role,
        et.status,
        et.created_at AS createdAt,
        e.title AS eventTitle,
        e.is_claimable AS isClaimable,
        u.username,
        u.display_name AS displayName
      FROM event_talent et
      JOIN events e ON e.id = et.event_id
      JOIN users u ON u.id = et.user_id
      WHERE et.status = 'PENDING' AND e.status = 'LIVE' AND e.is_claimable = 1
      ORDER BY et.created_at DESC
    `).all() as any[];
  },
  // Messages
  getInbox(userId) {
    return sqlite.prepare(`
      SELECT m.*, u.username AS from_username, u.display_name AS from_display_name
      FROM messages m
      LEFT JOIN users u ON u.id = m.from_user_id
      INNER JOIN (
        SELECT thread_id, MAX(id) AS latest_id
        FROM messages
        WHERE to_user_id = ? AND deleted_by_to = 0
        GROUP BY thread_id
      ) latest ON m.id = latest.latest_id
      WHERE m.to_user_id = ? AND m.deleted_by_to = 0
      ORDER BY m.created_at DESC
    `).all(userId, userId).map(row => mapMessageRow(row as Record<string, unknown>)) as Message[];
  },
  getSentMessages(userId) {
    return sqlite.prepare(`
      SELECT m.*, u.username AS to_username, u.display_name AS to_display_name
      FROM messages m
      LEFT JOIN users u ON u.id = m.to_user_id
      INNER JOIN (
        SELECT thread_id, MAX(id) AS latest_id
        FROM messages
        WHERE from_user_id = ? AND deleted_by_from = 0
        GROUP BY thread_id
      ) latest ON m.id = latest.latest_id
      WHERE m.from_user_id = ? AND m.deleted_by_from = 0
      ORDER BY m.created_at DESC
    `).all(userId, userId).map(row => mapMessageRow(row as Record<string, unknown>)) as Message[];
  },
  getUnreadCount(userId) {
    const row = sqlite.prepare(`SELECT COUNT(*) AS count FROM messages WHERE to_user_id = ? AND is_read = 0 AND deleted_by_to = 0`).get(userId) as any;
    return row?.count || 0;
  },
  sendMessage(fromUserId, toUserId, subject, body, opts) {
    const threadId = opts?.threadId || `thread_${Date.now()}_${fromUserId}_${toUserId}`;
    return db.insert(messages).values({
      fromUserId, toUserId, subject, body,
      isRead: false,
      threadId,
      contextType: opts?.contextType || "THREAD",
      contextId: opts?.contextId ?? null,
      contextLabel: opts?.contextLabel || null,
      deletedByFrom: false,
      deletedByTo: false,
      createdAt: new Date().toISOString(),
    } as any).returning().get();
  },
  markRead(messageId) {
    db.update(messages).set({ isRead: true }).where(eq(messages.id, messageId)).run();
  },
  markReadForUser(messageId, userId) {
    const row = db.select().from(messages).where(eq(messages.id, messageId)).get();
    if (!row || row.toUserId !== userId) return false;
    db.update(messages).set({ isRead: true }).where(eq(messages.id, messageId)).run();
    return true;
  },
  getThread(threadId) {
    return sqlite.prepare(`
      SELECT m.*, u.username AS from_username, u.display_name AS from_display_name
      FROM messages m
      LEFT JOIN users u ON u.id = m.from_user_id
      WHERE m.thread_id = ? ORDER BY m.created_at ASC
    `).all(threadId).map(row => mapMessageRow(row as Record<string, unknown>)) as Message[];
  },
  softDeleteThread(threadId, userId) {
    const tid = decodeURIComponent(String(threadId || "")).trim();
    if (!tid) return 0;
    const from = sqlite.prepare(`UPDATE messages SET deleted_by_from = 1 WHERE thread_id = ? AND from_user_id = ? AND deleted_by_from = 0`).run(tid, userId);
    const to = sqlite.prepare(`UPDATE messages SET deleted_by_to = 1 WHERE thread_id = ? AND to_user_id = ? AND deleted_by_to = 0`).run(tid, userId);
    return (from.changes || 0) + (to.changes || 0);
  },
  softDeleteTalentRequestThreads(talentId, userId) {
    sqlite.prepare(`
      UPDATE messages SET deleted_by_to = 1
      WHERE context_type = 'EVENT_TALENT_REQUEST' AND context_id = ? AND to_user_id = ?
    `).run(talentId, userId);
    sqlite.prepare(`
      UPDATE messages SET deleted_by_from = 1
      WHERE context_type = 'EVENT_TALENT_REQUEST' AND context_id = ? AND from_user_id = ?
    `).run(talentId, userId);
  },
  clearInboxFolder(userId, folder) {
    let total = 0;
    if (folder === "inbox" || folder === "all") {
      total += sqlite.prepare(`UPDATE messages SET deleted_by_to = 1 WHERE to_user_id = ? AND deleted_by_to = 0`).run(userId).changes || 0;
    }
    if (folder === "sent" || folder === "all") {
      total += sqlite.prepare(`UPDATE messages SET deleted_by_from = 1 WHERE from_user_id = ? AND deleted_by_from = 0`).run(userId).changes || 0;
    }
    return total;
  },
  archiveExpiredMissedConnections() {
    archiveExpiredMissedConnections();
  },
  getMissedConnection(id) {
    return db.select().from(missedConnections).where(eq(missedConnections.id, id)).get();
  },
  getPostableEventsForMissedConnections(requireToday = false) {
    const live = db.select().from(events).where(eq(events.status, "LIVE")).all();
    return live.filter(evt => isMissedConnectionPostable(evt.dateStart, { requireToday }).ok);
  },
  getLinkableEventsForMissedConnections() {
    const live = db.select().from(events).where(eq(events.status, "LIVE")).all();
    const timingRank = { live: 0, upcoming: 1, past: 2 } as const;
    return live
      .filter(evt => isMissedConnectionLinkable(evt.dateStart))
      .map(evt => ({
        id: evt.id,
        title: evt.title,
        venueName: evt.venueName,
        dayOfWeek: evt.dayOfWeek,
        dateStart: evt.dateStart,
        dateEnd: evt.dateEnd,
        postable: isMissedConnectionPostable(evt.dateStart).ok,
        timing: getEventTiming(evt.dateStart, evt.dateEnd),
      }))
      .sort((a, b) => {
        const byTiming = timingRank[a.timing] - timingRank[b.timing];
        if (byTiming !== 0) return byTiming;
        return String(a.dateStart).localeCompare(String(b.dateStart));
      });
  },
  getMissedConnections(status = "ACTIVE", viewerUserId?: number) {
    archiveExpiredMissedConnections();
    const rows = sqlite.prepare(`
      SELECT
        m.id,
        m.title,
        m.body,
        m.day_of_week AS dayOfWeek,
        m.venue_hint AS venueHint,
        m.event_id AS eventId,
        m.status,
        m.created_at AS createdAt,
        m.closes_at AS closesAt,
        m.user_id,
        e.title AS eventTitle,
        e.venue_name AS eventVenue,
        e.day_of_week AS eventDay,
        e.date_start AS eventDateStart
      FROM missed_connections m
      LEFT JOIN events e ON e.id = m.event_id
      WHERE m.status = ?
      ORDER BY m.created_at DESC
    `).all(status) as any[];
    return rows.map(row => mapMissedConnectionRow(row, viewerUserId));
  },
  getMissedConnectionsByEvent(eventId, viewerUserId?: number) {
    archiveExpiredMissedConnections();
    const rows = sqlite.prepare(`
      SELECT
        m.id,
        m.title,
        m.body,
        m.day_of_week AS dayOfWeek,
        m.venue_hint AS venueHint,
        m.event_id AS eventId,
        m.status,
        m.created_at AS createdAt,
        m.closes_at AS closesAt,
        m.user_id,
        e.title AS eventTitle,
        e.venue_name AS eventVenue,
        e.day_of_week AS eventDay,
        e.date_start AS eventDateStart
      FROM missed_connections m
      LEFT JOIN events e ON e.id = m.event_id
      WHERE m.status = 'ACTIVE' AND m.event_id = ?
      ORDER BY m.created_at DESC
    `).all(eventId) as any[];
    return rows.map(row => mapMissedConnectionRow(row, viewerUserId));
  },
  getMissedConnectionsByUser(userId) {
    archiveExpiredMissedConnections();
    const rows = sqlite.prepare(`
      SELECT
        m.id,
        m.title,
        m.body,
        m.day_of_week AS dayOfWeek,
        m.venue_hint AS venueHint,
        m.event_id AS eventId,
        m.status,
        m.created_at AS createdAt,
        m.closes_at AS closesAt,
        m.user_id,
        e.title AS eventTitle,
        e.venue_name AS eventVenue
      FROM missed_connections m
      LEFT JOIN events e ON e.id = m.event_id
      WHERE m.user_id = ? AND m.status != 'DELETED'
      ORDER BY m.created_at DESC
    `).all(userId) as any[];
    return rows.map(row => mapMissedConnectionRow(row, userId));
  },
  createMissedConnection(data) {
    const createdAt = new Date().toISOString();
    return db.insert(missedConnections).values({
      ...data,
      status: "ACTIVE",
      createdAt,
    } as any).returning().get();
  },
  createMissedConnectionThread(threadId, missedConnectionId, posterUserId, replierUserId) {
    sqlite.prepare(`
      INSERT OR IGNORE INTO missed_connection_threads
        (thread_id, missed_connection_id, poster_user_id, replier_user_id, poster_revealed, replier_revealed, created_at)
      VALUES (?, ?, ?, ?, 0, 0, ?)
    `).run(threadId, missedConnectionId, posterUserId, replierUserId, new Date().toISOString());
  },
  getMissedConnectionThread(threadId) {
    return sqlite.prepare(`SELECT * FROM missed_connection_threads WHERE thread_id = ?`).get(threadId) as any;
  },
  revealMissedConnectionIdentity(threadId, userId) {
    const row = storage.getMissedConnectionThread(threadId);
    if (!row) return undefined;
    if (row.poster_user_id === userId) {
      sqlite.prepare(`UPDATE missed_connection_threads SET poster_revealed = 1 WHERE thread_id = ?`).run(threadId);
    } else if (row.replier_user_id === userId) {
      sqlite.prepare(`UPDATE missed_connection_threads SET replier_revealed = 1 WHERE thread_id = ?`).run(threadId);
    } else {
      return undefined;
    }
    return storage.getMissedConnectionThread(threadId);
  },
  maskMessageParty(msg, viewerUserId, tab) {
    if (msg.contextType !== "MISSED_CONNECTION") return msg;
    const mcThread = storage.getMissedConnectionThread(msg.threadId);
    if (!mcThread) return msg;
    const bothRevealed = Boolean(mcThread.poster_revealed && mcThread.replier_revealed);
    if (bothRevealed) return msg;
    const copy = { ...msg };
    if (tab === "inbox" && msg.fromUserId !== viewerUserId) {
      copy.from_username = "Anonymous";
      copy.from_display_name = "Anonymous";
    }
    if (tab === "sent" && msg.toUserId !== viewerUserId) {
      copy.to_username = "Anonymous";
      copy.to_display_name = "Anonymous";
    }
    return copy;
  },
  getThreadForViewer(threadId, viewerUserId) {
    const thread = sqlite.prepare(`
      SELECT m.*, u.username AS from_username, u.display_name AS from_display_name,
             u.photo_url AS from_photo_url, u.avatar_choice AS from_avatar_choice, u.avatar_ring AS from_avatar_ring
      FROM messages m
      LEFT JOIN users u ON u.id = m.from_user_id
      WHERE m.thread_id = ? ORDER BY m.created_at ASC
    `).all(threadId) as any[];
    const mcThread = storage.getMissedConnectionThread(threadId);
    const bothRevealed = !mcThread || Boolean(mcThread.poster_revealed && mcThread.replier_revealed);
    return thread.map(raw => {
      const m = mapMessageRow(raw as Record<string, unknown>);
      if (m.contextType !== "MISSED_CONNECTION" || bothRevealed) return m;
      const isSelf = m.fromUserId === viewerUserId;
      return {
        ...m,
        from_username: isSelf ? "You" : "Anonymous",
        from_display_name: isSelf ? "You" : "Anonymous",
        from_photo_url: isSelf ? raw.from_photo_url : null,
        masked: !isSelf,
      };
    });
  },
  updateMissedConnection(id, userId, data) {
    const before = db.select().from(missedConnections).where(eq(missedConnections.id, id)).get();
    if (!before || before.userId !== userId) return undefined;
    db.update(missedConnections).set(data as any).where(eq(missedConnections.id, id)).run();
    return db.select().from(missedConnections).where(eq(missedConnections.id, id)).get();
  },
  deleteMissedConnection(id, userId) {
    sqlite.prepare(`UPDATE missed_connections SET status = 'DELETED' WHERE id = ? AND user_id = ?`).run(id, userId);
  },
  // Gifting
  getGiftingPosts(opts = {}) {
    expireGiftingPosts();
    const where: string[] = [];
    const params: any[] = [];
    if (!opts.includeInactive) {
      const activeStatuses = `'OPEN','THREE_INTERESTED','POSTER_CHOOSING','PICKUP_PENDING','REOPENED','LOOKING','OFFER_PENDING'`;
      if (opts.viewerUserId) {
        where.push(`(p.status IN (${activeStatuses}) OR (p.status = 'PENDING' AND p.user_id = ?))`);
        params.push(opts.viewerUserId);
      } else {
        where.push(`p.status IN (${activeStatuses})`);
      }
    }
    if (opts.status) {
      where.push(`p.status = ?`);
      params.push(opts.status);
    }
    if (opts.userId) {
      where.push(`p.user_id = ?`);
      params.push(opts.userId);
    }
    return sqlite.prepare(`
      SELECT p.*,
             u.username,
             u.display_name AS displayName,
             u.photo_url AS posterPhotoUrl,
             u.avatar_choice AS avatarChoice,
             u.avatar_ring AS posterAvatarRing,
             (SELECT COUNT(*) FROM gifting_interests gi WHERE gi.post_id = p.id AND gi.status IN ('INTERESTED','SELECTED')) AS interestCount
      FROM gifting_posts p
      JOIN users u ON u.id = p.user_id
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY p.created_at DESC
    `).all(...params).map((post: any) => ({
      ...post,
      photoUrls: safeJson(post.photo_urls || post.photoUrls || "[]"),
      interests: this.getGiftingPost(post.id)?.interests || [],
    }));
  },
  getGiftingPost(id) {
    expireGiftingPosts();
    const post = sqlite.prepare(`
      SELECT p.*,
             u.username,
             u.display_name AS displayName,
             u.photo_url AS posterPhotoUrl,
             u.avatar_choice AS avatarChoice,
             u.avatar_ring AS posterAvatarRing,
             (SELECT COUNT(*) FROM gifting_interests gi WHERE gi.post_id = p.id AND gi.status IN ('INTERESTED','SELECTED')) AS interestCount
      FROM gifting_posts p
      JOIN users u ON u.id = p.user_id
      WHERE p.id = ?
    `).get(id) as any;
    if (!post) return undefined;
    const interests = sqlite.prepare(`
      SELECT gi.*, u.username, u.display_name AS displayName, u.photo_url AS photoUrl, u.avatar_choice AS avatarChoice, u.avatar_ring AS avatarRing
      FROM gifting_interests gi
      JOIN users u ON u.id = gi.user_id
      WHERE gi.post_id = ? AND gi.status != 'WITHDRAWN'
      ORDER BY gi.created_at ASC
    `).all(id);
    return { ...post, photoUrls: safeJson(post.photo_urls || "[]"), interests };
  },
  getGiftingPostsByUser(userId) {
    return this.getGiftingPosts({ includeInactive: true, userId })
      .filter((post: any) => post.status !== "REMOVED");
  },
  deleteGiftingPost(id, userId, opts = {}) {
    const post = this.getGiftingPost(id);
    if (!post) throw new Error("Post not found");
    const ownerId = Number(post.user_id ?? post.userId);
    if (!opts.isAdmin && ownerId !== userId) throw new Error("Not allowed");
    db.update(giftingPosts).set({ status: "REMOVED" } as any).where(eq(giftingPosts.id, id)).run();
  },
  createGiftingPost(data, status) {
    const postType = data.postType === "ISO" ? "ISO" : "GIFT";
    return db.insert(giftingPosts).values({
      ...data,
      postType,
      status: status || (postType === "ISO" ? "LOOKING" : "OPEN"),
      photoUrls: data.photoUrls || "[]",
      expiresAt: giftingExpiry(postType),
      createdAt: new Date().toISOString(),
    } as any).returning().get();
  },
  addGiftingInterest(data) {
    const post = this.getGiftingPost(data.postId);
    if (!post) throw new Error("Post not found");
    if (post.user_id === data.userId || post.userId === data.userId) throw new Error("Cannot respond to your own post");
    const existing = sqlite.prepare(`SELECT * FROM gifting_interests WHERE post_id = ? AND user_id = ? AND status != 'WITHDRAWN'`).get(data.postId, data.userId);
    if (existing) throw new Error("You already responded to this post");
    if (post.post_type === "GIFT" || post.postType === "GIFT") {
      const count = Number(post.interestCount || 0);
      if (count >= 3) throw new Error("This gift already has 3 people interested.");
    }
    const interest = db.insert(giftingInterests).values({
      ...data,
      note: data.note.slice(0, 240),
      status: "INTERESTED",
      createdAt: new Date().toISOString(),
    } as any).returning().get();
    const nextCount = Number(post.interestCount || 0) + 1;
    if ((post.post_type === "GIFT" || post.postType === "GIFT") && nextCount >= 3) {
      db.update(giftingPosts).set({ status: "POSTER_CHOOSING" }).where(eq(giftingPosts.id, data.postId)).run();
    } else if (post.post_type === "ISO" || post.postType === "ISO") {
      db.update(giftingPosts).set({ status: "OFFER_PENDING" }).where(eq(giftingPosts.id, data.postId)).run();
    }
    return interest;
  },
  chooseGiftingInterest(postId, interestId, ownerUserId) {
    const post = this.getGiftingPost(postId);
    if (!post || Number(post.user_id) !== ownerUserId) return undefined;
    const interest = sqlite.prepare(`SELECT * FROM gifting_interests WHERE id = ? AND post_id = ?`).get(interestId, postId) as any;
    if (!interest) return undefined;
    sqlite.prepare(`UPDATE gifting_interests SET status = 'DECLINED' WHERE post_id = ? AND id != ?`).run(postId, interestId);
    sqlite.prepare(`UPDATE gifting_interests SET status = 'SELECTED' WHERE id = ?`).run(interestId);
    db.update(giftingPosts).set({ status: "PICKUP_PENDING", selectedInterestId: interestId } as any).where(eq(giftingPosts.id, postId)).run();
    return db.select().from(giftingInterests).where(eq(giftingInterests.id, interestId)).get();
  },
  markGiftingResolved(postId, userId, status) {
    const post = this.getGiftingPost(postId);
    if (!post || Number(post.user_id) !== userId) throw new Error("Not your post");
    db.update(giftingPosts).set({ status } as any).where(eq(giftingPosts.id, postId)).run();
  },
  reopenGiftingPost(postId, userId) {
    const post = this.getGiftingPost(postId);
    if (!post || Number(post.user_id) !== userId) throw new Error("Not your post");
    sqlite.prepare(`UPDATE gifting_interests SET status = 'DECLINED' WHERE post_id = ? AND status = 'SELECTED'`).run(postId);
    db.update(giftingPosts).set({
      status: post.post_type === "ISO" ? "LOOKING" : "REOPENED",
      selectedInterestId: null,
    } as any).where(eq(giftingPosts.id, postId)).run();
  },
  renewGiftingPost(postId, userId) {
    const post = this.getGiftingPost(postId);
    if (!post || Number(post.user_id) !== userId) throw new Error("Not your post");
    if (Number(post.renew_count || 0) >= 1) throw new Error("Posts can only be renewed once.");
    db.update(giftingPosts).set({
      status: post.post_type === "ISO" ? "LOOKING" : "OPEN",
      renewCount: Number(post.renew_count || 0) + 1,
      expiresAt: giftingExpiry(post.post_type),
    } as any).where(eq(giftingPosts.id, postId)).run();
  },
  reportGiftingPost(data) {
    db.insert(giftingReports).values({ ...data, status: "PENDING", createdAt: new Date().toISOString() } as any).run();
    sqlite.prepare(`UPDATE gifting_posts SET report_count = report_count + 1 WHERE id = ?`).run(data.postId);
  },
  getGiftingReports(status) {
    const where = status ? `WHERE gr.status = ?` : "";
    const params = status ? [status] : [];
    return sqlite.prepare(`
      SELECT gr.*, p.title AS postTitle, p.post_type AS postType, u.username AS reporterUsername
      FROM gifting_reports gr
      JOIN gifting_posts p ON p.id = gr.post_id
      JOIN users u ON u.id = gr.reporter_user_id
      ${where}
      ORDER BY gr.created_at DESC
    `).all(...params);
  },
  updateGiftingPostStatus(id, status) {
    db.update(giftingPosts).set({ status } as any).where(eq(giftingPosts.id, id)).run();
  },
  resolveGiftingReport(id, adminNotes) {
    db.update(giftingReports).set({ status: "RESOLVED", adminNotes: adminNotes || null } as any).where(eq(giftingReports.id, id)).run();
  },
  expireGiftingPosts() {
    expireGiftingPosts();
  },
  createFeedbackReport(data) {
    return db.insert(feedbackReports).values({
      ...data,
      createdAt: new Date().toISOString(),
    } as any).returning().get();
  },
  getFeedbackReports(status) {
    const rows = db.select().from(feedbackReports).all();
    if (status) return rows.filter(report => report.status === status);
    return rows;
  },
  resolveFeedbackReport(id) {
    db.update(feedbackReports).set({ status: "RESOLVED" } as any).where(eq(feedbackReports.id, id)).run();
  },
};

try {
  const ownerRows = sqlite.prepare(`
    SELECT id, claimed_by AS claimedBy, submitted_by AS submittedBy
    FROM events
    WHERE (claimed_by IS NOT NULL AND TRIM(claimed_by) != '')
       OR (submitted_by IS NOT NULL AND TRIM(submitted_by) != '')
  `).all() as { id: number; claimedBy: string | null; submittedBy: string | null }[];
  for (const row of ownerRows) {
    const countRow = sqlite.prepare(`SELECT COUNT(*) AS count FROM event_hosts WHERE event_id = ?`).get(row.id) as { count: number };
    if (countRow.count > 0) continue;
    const ownerKey = row.claimedBy || row.submittedBy;
    if (!ownerKey) continue;
    const user = storage.getUserByUsername(ownerKey) || storage.getUserByEmail(ownerKey);
    if (user) storage.setPrimaryEventHost(row.id, user.id, null);
  }
} catch (e) {
  console.error("[event_hosts] backfill failed:", e);
}

const PERSISTENCE_TABLES = [
  "users",
  "messages",
  "submissions",
  "events",
  "gig_posts",
  "gifting_posts",
  "gifting_interests",
  "attendances",
  "missed_connections",
  "host_messages",
  "event_hosts",
  "event_talent",
  "moderation_requests",
  "feedback_reports",
  "express_sessions",
] as const;

export function getTableCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const table of PERSISTENCE_TABLES) {
    try {
      const row = sqlite.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as { count: number };
      counts[table] = row.count;
    } catch {
      counts[table] = 0;
    }
  }
  return counts;
}

runBootMigrationsOnce();
syncSiteOwnerPortfolio();
