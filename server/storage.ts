Warning: truncated output (original token count: 175038)
Total output lines: 15733

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import {
  getEventTiming,
  isMissedConnectionPostable,
  isMissedConnectionLinkable,
  missedConnectionClosesAt,
  parsePacificDateTime,
} from "@shared/missedConnections";

import { EVENT_TALENT_ROLE_LABELS, isEventTalentRole, type EventTalentRole } from "@shared/eventTalent";
import { SYNC_WRITABLE_FIELDS } from "./ingest";
import { normalizeUsername, usernameChangeEligibility } from "@shared/username";
import { formatBoardRejectMessage, formatProfilePhotoRejectMessage } from "@shared/boardModeration";
import {
  filterHubFeedItems,
  filterHubFeedPinned,
  parseHubFeedTab,
  type HubFeedAuthor,
  type HubFeedEventEmbed,
  type HubFeedItem,
  type HubFeedResponse,
  type HubFeedTab,
  type HubFeedVoteValue,
} from "@shared/hubFeed";
import {
  events, submissions, gigPosts, promoters, moderationRequests, attendances, eventChatMessages, users, messages, missedConnections,
  giftingPosts, giftingInterests, giftingReports, sellzPosts, sellzInterests, sellzReports, sellzSaves,
  beachCheckins, beachCarpoolPosts, beachCarpoolRequests, riverBratsReports,
  feedbackReports, hostMessages, hubFeedPosts, eventHosts, eventTalent, businesses,
  businessClaims, businessSubmissions, businessBlocks, businessLogoRequests,
  type Event, type InsertEvent,
  type Submission, type InsertSubmission,
  type GigPost, type InsertGigPost,
  type Promoter, type InsertPromoter,
  type ModerationRequest, type InsertModerationRequest,
  type Attendance, type InsertAttendance, type AttendanceVisibility,
  type User, type Message,
  type MissedConnection, type InsertMissedConnection,
  type GiftingPost, type InsertGiftingPost, type GiftingInterest, type InsertGiftingInterest, type InsertGiftingReport,
  type SellzPost, type InsertSellzPost, type SellzInterest, type InsertSellzInterest, type InsertSellzReport,
  type BeachCheckin, type InsertBeachCheckin, type BeachCarpoolPost, type InsertBeachCarpoolPost,
  type BeachCarpoolRequest, type InsertBeachCarpoolRequest, type InsertRiverBratsReport,
  type FeedbackReport, type InsertFeedbackReport,
  type HostMessage, type InsertHostMessage,
  type HubFeedPost, type InsertHubFeedPost,
  type Business, type InsertBusiness,
  type BusinessClaim, type BusinessSubmission, type BusinessBlock, type BusinessLogoRequest,
} from "@shared/schema";
import crypto from "crypto";
import { buildSubmissionMergePatch } from "@shared/submissionMatch";
import { mergeMapCoordinates, eventMatchesBusiness } from "./venueCoordinates";
import { eventPath } from "@shared/eventSlug";
import { placePath } from "@shared/placeSlug";
import { resolveDirectoryLogo, directoryFallbackLogo } from "@shared/directoryLogos";
import { DEFAULT_NOTIFICATION_PREFS, parseNotificationPrefs, type NotificationPrefs } from "@shared/pushCategories";
import { schedulePushForMessage } from "./push/dispatch";
import { ensureAnalyticsTable, getProductExperienceMetrics, getTrafficMetrics, type ProductExperienceMetrics, type TrafficMetrics } from "./analytics";
import { ensureAdsTables, seedAdsIfNeeded } from "./ads";
import {
  pacificMidnightIso,
  pacificTodayDate,
  riverBratsChatClosesAtIso,
  riverBratsChatOpensAtIso,
  isRiverBratsChatOpen,
  riverBratsChatAccessFromDates,
  riverBratsArrivalPromptIso,
  beachVenueLabel,
  addCalendarDays,
  formatBeachGoingChip,
  pacificWeekdayCode,
} from "@shared/riverBrats";
import { getEventChatWindow, CHAT_RETENTION_DAYS } from "@shared/eventChatWindow";
import { BEACH_VERIFY_POINTS } from "@shared/nudeBeaches";
import { haversineMeters } from "@shared/geo";
import { isGuideSystemUsername } from "@shared/peopleHub";
import { ATTENDANCE_CHAT_HOURS } from "@shared/attendancePhrases";
import { DEFAULT_PROFILE_BANNER } from "@shared/profileTheme";
import { mergeTuckerHostedArchivePast } from "@shared/tuckerHostedArchive";
import { isPostEventWeekListingCapActive } from "@shared/eventWeek";
import {
  CLOSED_PERMANENT_VENUES,
  closedAtIso,
  isEventAfterVenueClose,
  matchClosedVenue,
} from "@shared/closedVenues";
import { listHousingPosts } from "./housing/store";
import { HOUSING_TYPE_LABEL, type HousingType } from "../shared/housing";
import { shouldCoalesceChange } from "../shared/changeCoalesce";

/** How a housing post announces itself in the hub feed. */
const HOUSING_FEED_ACTION: Record<HousingType, string> = {
  LOOKING: "Looking for housing on THE HAÜZ",
  OFFERING: "Has a room open on THE HAÜZ",
  FORMING: "Is forming a HAÜS",
  MANAGED: "New managed unit on THE HAÜZ",
};

/** getGigPosts LEFT JOINs users, so each row carries the poster's author
 * fields on top of the raw gig_posts columns. */
type GigPostWithAuthor = GigPost & {
  username: string | null;
  displayName: string | null;
  posterPhotoUrl: string | null;
  avatarChoice: number | null;
  posterAvatarRing: string | null;
};

export const DB_PATH = process.env.DATABASE_PATH || "data.db";
export const sqlite = new Database(DB_PATH);
const db = drizzle(sqlite);

ensureAnalyticsTable(sqlite);
ensureAdsTables(sqlite);

// Waypoint (Next page) likes — anonymous excitement counter per roadmap card.
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS waypoint_likes (
    waypoint_id TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0
  );
`);

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
    status TEXT NOT NULL DEFAULT 'HIDDEN',
    source TEXT NOT NULL DEFAULT 'admin_seeded',
    is_claimable INTEGER NOT NULL DEFAULT 0,
    claimed_by TEXT,
    submitted_by TEXT,
    admin_notes TEXT,
    created_at TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT ''
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
  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    used_at TEXT,
    created_at TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_tokens(user_id, used_at);
  CREATE INDEX IF NOT EXISTS idx_password_reset_expiry ON password_reset_tokens(expires_at);
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
  CREATE TABLE IF NOT EXISTS sellz_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    condition TEXT NOT NULL,
    price_cents INTEGER NOT NULL,
    negotiable INTEGER NOT NULL DEFAULT 0,
    neighborhood TEXT NOT NULL,
    pickup_preference TEXT NOT NULL,
    photo_urls TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    selected_interest_id INTEGER,
    expires_at TEXT NOT NULL,
    report_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT '',
    last_change_label TEXT,
    last_change_at TEXT
  );
  CREATE TABLE IF NOT EXISTS sellz_interests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    note TEXT NOT NULL,
    offer_cents INTEGER,
    status TEXT NOT NULL DEFAULT 'INTERESTED',
    created_at TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS sellz_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    reporter_user_id INTEGER NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    created_at TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS sellz_saves (
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT '',
    seen_updated_at TEXT,
    UNIQUE(post_id, user_id)
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
  CREATE TABLE IF NOT EXISTS owner_desk_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kind TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    body TEXT NOT NULL,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    page_url TEXT,
    severity TEXT,
    meta_json TEXT,
    status TEXT NOT NULL DEFAULT 'OPEN',
    created_at TEXT NOT NULL DEFAULT '',
    resolved_at TEXT
  );
  CREATE TABLE IF NOT EXISTS site_admin_grants (
    user_id INTEGER PRIMARY KEY,
    granted_by_user_id INTEGER,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS businesses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'bar',
    description TEXT NOT NULL,
    address TEXT,
    neighborhood TEXT,
    website TEXT,
    instagram TEXT,
    queer_owned INTEGER NOT NULL DEFAULT 0,
    queer_friendly INTEGER NOT NULL DEFAULT 1,
    image_url TEXT,
    lat REAL,
    lng REAL,
    active INTEGER NOT NULL DEFAULT 1,
    ingest_events INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT ''
  );
`);
try {
  const bcols = new Set(
    sqlite.prepare(`PRAGMA table_info(businesses)`).all().map((c: any) => c.name),
  );
  const businessAlters: Array<[string, string]> = [
    ["donate_url", "TEXT"],
    ["status", "TEXT NOT NULL DEFAULT 'OPEN'"],
    ["closed_at", "TEXT"],
    ["is_new", "INTEGER NOT NULL DEFAULT 0"],
    ["grand_opening_date", "TEXT"],
    ["hours", "TEXT"],
    ["phone", "TEXT"],
    ["locations", "TEXT"],
    ["owner_id", "INTEGER"],
    ["ingest_events", "INTEGER NOT NULL DEFAULT 1"],
  ];
  for (const [name, spec] of businessAlters) {
    if (!bcols.has(name)) sqlite.exec(`ALTER TABLE businesses ADD COLUMN ${name} ${spec}`);
  }
} catch (e) {
  console.error("[businesses] column migration failed:", e);
}

// HAUSING - THE HAÜZ. See shared/schema.ts for the annotated schema.
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS housing_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    headline TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    photo_urls TEXT NOT NULL DEFAULT '[]',
    areas TEXT NOT NULL DEFAULT '[]',
    tags TEXT NOT NULL DEFAULT '[]',
    budget TEXT,
    move_timeline TEXT,
    living_style TEXT NOT NULL DEFAULT '[]',
    open_to_haus INTEGER NOT NULL DEFAULT 0,
    rent TEXT,
    rent_note TEXT,
    deposit TEXT,
    move_in TEXT,
    room_note TEXT,
    beds REAL,
    baths REAL,
    parking TEXT,
    outdoor TEXT,
    culture TEXT NOT NULL DEFAULT '[]',
    access TEXT NOT NULL DEFAULT '[]',
    flavor TEXT,
    seeking INTEGER NOT NULL DEFAULT 0,
    is_full INTEGER NOT NULL DEFAULT 0,
    goals TEXT,
    around_post_id INTEGER,
    property_manager_id INTEGER,
    source_url TEXT,
    source_domain TEXT,
    badges TEXT NOT NULL DEFAULT '[]',
    last_seen_at TEXT,
    gone INTEGER NOT NULL DEFAULT 0,
    lat REAL,
    lng REAL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    hidden INTEGER NOT NULL DEFAULT 0,
    hidden_by_user_id INTEGER,
    report_count INTEGER NOT NULL DEFAULT 0,
    admin_notes TEXT,
    archived_workspace TEXT,
    created_at TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT '',
    last_change_label TEXT,
    last_change_at TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_housing_posts_type ON housing_posts(type, status);
  CREATE INDEX IF NOT EXISTS idx_housing_posts_user ON housing_posts(user_id);
  CREATE INDEX IF NOT EXISTS idx_housing_posts_around ON housing_posts(around_post_id);

  CREATE TABLE IF NOT EXISTS housing_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    kind TEXT NOT NULL DEFAULT 'MEMBER',
    user_id INTEGER,
    name TEXT NOT NULL DEFAULT '',
    photo_url TEXT,
    species TEXT,
    role TEXT NOT NULL DEFAULT 'MEMBER',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT ''
  );
  CREATE INDEX IF NOT EXISTS idx_housing_members_post ON housing_members(post_id);

  CREATE TABLE IF NOT EXISTS housing_saves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    seen_updated_at TEXT,
    created_at TEXT NOT NULL DEFAULT ''
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_housing_saves_uniq ON housing_saves(post_id, user_id);

  CREATE TABLE IF NOT EXISTS housing_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    requester_user_id INTEGER NOT NULL,
    recipient_user_id INTEGER NOT NULL,
    kind TEXT NOT NULL DEFAULT 'CHAT',
    status TEXT NOT NULL DEFAULT 'PENDING',
    thread_id TEXT,
    note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT '',
    resolved_at TEXT,
    nudge_sent_at TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_housing_requests_post ON housing_requests(post_id, status);
  CREATE INDEX IF NOT EXISTS idx_housing_requests_recipient ON housing_requests(recipient_user_id, status);

  CREATE TABLE IF NOT EXISTS housing_places (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    added_by_user_id INTEGER NOT NULL,
    url TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    rent TEXT,
    neighborhood TEXT,
    source_domain TEXT,
    thumb_url TEXT,
    status TEXT NOT NULL DEFAULT 'INTERESTED',
    is_target INTEGER NOT NULL DEFAULT 0,
    managed_post_id INTEGER,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT ''
  );
  CREATE INDEX IF NOT EXISTS idx_housing_places_post ON housing_places(post_id);

  CREATE TABLE IF NOT EXISTS housing_place_reactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    place_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    emoji TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT ''
  );
  CREATE INDEX IF NOT EXISTS idx_housing_place_reactions_place ON housing_place_reactions(place_id);

  CREATE TABLE IF NOT EXISTS housing_place_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    place_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT ''
  );
  CREATE INDEX IF NOT EXISTS idx_housing_place_comments_place ON housing_place_comments(place_id);

  CREATE TABLE IF NOT EXISTS housing_dates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    created_by_user_id INTEGER NOT NULL,
    kind TEXT NOT NULL DEFAULT 'OTHER',
    label TEXT NOT NULL,
    date_on TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    remind_at TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT ''
  );
  CREATE INDEX IF NOT EXISTS idx_housing_dates_post ON housing_dates(post_id);

  CREATE TABLE IF NOT EXISTS property_managers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    company TEXT,
    password_hash TEXT NOT NULL DEFAULT '',
    business_id INTEGER,
    site_url TEXT,
    site_domain TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    verified_at TEXT,
    membership_status TEXT NOT NULL DEFAULT 'trialing',
    first_month_free INTEGER NOT NULL DEFAULT 1,
    founding_partner INTEGER NOT NULL DEFAULT 0,
    membership_started_at TEXT,
    membership_renews_at TEXT,
    created_at TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS property_manager_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    company TEXT NOT NULL,
    site_url TEXT NOT NULL,
    domain_proof TEXT NOT NULL DEFAULT '',
    business_license TEXT NOT NULL DEFAULT '',
    directory_business_id INTEGER,
    note TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'PENDING',
    owner_notes TEXT,
    created_property_manager_id INTEGER,
    created_at TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS housing_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    reporter_user_id INTEGER NOT NULL,
    reason TEXT NOT NULL,
    detail TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'PENDING',
    admin_notes TEXT,
    created_at TEXT NOT NULL DEFAULT ''
  );
  CREATE INDEX IF NOT EXISTS idx_housing_reports_post ON housing_reports(post_id);
`);

// housing_posts.tags landed after the table shipped, so existing databases need
// the column added. CREATE TABLE IF NOT EXISTS above only covers fresh installs.
try { sqlite.exec(`ALTER TABLE housing_posts ADD COLUMN tags TEXT NOT NULL DEFAULT '[]'`); } catch {}
try { sqlite.exec(`ALTER TABLE housing_posts ADD COLUMN last_change_at TEXT`); } catch {}
try { sqlite.exec(`ALTER TABLE housing_requests ADD COLUMN nudge_sent_at TEXT`); } catch {}
try { sqlite.exec(`ALTER TABLE sellz_posts ADD COLUMN updated_at TEXT NOT NULL DEFAULT ''`); } catch {}
try { sqlite.exec(`ALTER TABLE sellz_posts ADD COLUMN last_change_label TEXT`); } catch {}
try { sqlite.exec(`ALTER TABLE sellz_posts ADD COLUMN last_change_at TEXT`); } catch {}
try { sqlite.exec(`ALTER TABLE sellz_saves ADD COLUMN seen_updated_at TEXT`); } catch {}

// events.updated_at: trust line + "last touched" for admin/edit/sync.
try { sqlite.exec(`ALTER TABLE events ADD COLUMN updated_at TEXT NOT NULL DEFAULT ''`); } catch {}
try {
  sqlite.exec(`UPDATE events SET updated_at = created_at WHERE updated_at IS NULL OR updated_at = ''`);
} catch {}

// events.locked_fields: JSON array of field names a human has edited by hand.
// A trusted-venue resync must never revert a human edit, and unclaimed events
// have no claimedBy to read, so the lock is recorded at the moment of the edit.
// See mergeDraftIntoEvent in server/ingest/index.ts.
try { sqlite.exec(`ALTER TABLE events ADD COLUMN locked_fields TEXT NOT NULL DEFAULT '[]'`); } catch {}

// Add is_new, hours, phone, owner_id, grand_opening_date, status, closed_at columns to businesses if not present
try { sqlite.exec(`ALTER TABLE businesses ADD COLUMN is_new INTEGER NOT NULL DEFAULT 0`); } catch {}
try { sqlite.exec(`ALTER TABLE businesses ADD COLUMN grand_opening_date TEXT`); } catch {}
try { sqlite.exec(`ALTER TABLE businesses ADD COLUMN hours TEXT`); } catch {}
try { sqlite.exec(`ALTER TABLE businesses ADD COLUMN phone TEXT`); } catch {}
try { sqlite.exec(`ALTER TABLE businesses ADD COLUMN locations TEXT`); } catch {}
try { sqlite.exec(`ALTER TABLE businesses ADD COLUMN owner_id INTEGER`); } catch {}
try { sqlite.exec(`ALTER TABLE businesses ADD COLUMN status TEXT NOT NULL DEFAULT 'OPEN'`); } catch {}
try { sqlite.exec(`ALTER TABLE businesses ADD COLUMN closed_at TEXT`); } catch {}

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
  if (!colNames.has("admin_notes")) addColumn(`ALTER TABLE gig_posts ADD COLUMN admin_notes TEXT`);

  // Gigs post live without admin approval - promote any legacy PENDING rows.
  try {
    sqlite.exec(`UPDATE gig_posts SET status = 'LIVE' WHERE UPPER(status) = 'PENDING'`);
  } catch {
    /* ignore */
  }

  const finalColumns = sqlite.prepare(`PRAGMA table_info(gig_posts)`).all() as Array<{ name: string }>;
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
    adminNotes: (row.admin_notes as string | null) ?? null,
    createdAt: row.created_at as string,
    userId: (row.user_id as number | null) ?? null,
    imageUrl: (row.image_url as string | null) ?? null,
    gigDate: (row.gig_date as string | null) ?? null,
    gigTime: (row.gig_time as string | null) ?? null,
    businessId: (row.business_id as number | null) ?? null,
  };
}

function insertGigPostCompat(payload: InsertGigPost & { status: string; createdAt: string }): GigPost {
  if (gigPostsLegacyCols) {
    const result = sqlite.prepare(`
      INSERT INTO gig_posts (
        type, role, post_type, title, name, contact_email, description,
        skills, compensation, location, is_remote, status, created_at, user_id,
        gig_date, gig_time, business_id
      ) VALUES (
        @postType, @role, @postType, @title, @name, @contactEmail, @description,
        @skills, @compensation, @location, @isRemote, @status, @createdAt, @userId,
        @gigDate, @gigTime, @businessId
      )
    `).run({
      postType: payload.postType,
      role: legacyGigRole(payload.postType || "POSTING_GIG"),
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
      gigDate: payload.gigDate ?? null,
      gigTime: payload.gigTime ?? null,
      businessId: payload.businessId ?? null,
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
try { sqlite.exec(`ALTER TABLE gig_posts ADD COLUMN business_id INTEGER`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN photo_url TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN google_id TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN avatar_ring TEXT DEFAULT 'none'`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN avatar_crop TEXT`); } catch(e) {}
try { sqlite.exec(`CREATE UNIQUE INDEX IF NOT EXISTS users_google_id_unique ON users(google_id)`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE attendances ADD COLUMN user_id INTEGER`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE attendances ADD COLUMN photo_url TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE attendances ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE attendances ADD COLUMN is_anonymous INTEGER NOT NULL DEFAULT 0`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE attendances ADD COLUMN visibility TEXT NOT NULL DEFAULT 'public'`); } catch(e) {}
try {
  // Backfill: legacy is_anonymous=1 → visibility anonymous; keep is_anonymous in sync going forward.
  sqlite.exec(`UPDATE attendances SET visibility = 'anonymous' WHERE COALESCE(is_anonymous, 0) = 1 AND COALESCE(visibility, 'public') = 'public'`);
} catch(e) {}
try { sqlite.exec(`ALTER TABLE attendances ADD COLUMN expires_at TEXT`); } catch(e) {}
try { sqlite.exec(`
  CREATE TABLE IF NOT EXISTS event_chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    body TEXT NOT NULL,
    is_anonymous INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT ''
  )
`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE messages ADD COLUMN context_type TEXT NOT NULL DEFAULT 'THREAD'`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE messages ADD COLUMN context_id INTEGER`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE messages ADD COLUMN context_label TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE messages ADD COLUMN deleted_by_from INTEGER NOT NULL DEFAULT 0`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE messages ADD COLUMN deleted_by_to INTEGER NOT NULL DEFAULT 0`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN promoter_status TEXT NOT NULL DEFAULT 'none'`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN sub_admin INTEGER NOT NULL DEFAULT 0`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN notification_prefs TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN pronouns TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN location TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN social_links TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN profile_embeds TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN profile_photos TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN talents TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN stand_for TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN affiliated_venue_ids TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN marquee TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN top8 TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN accent_color TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN banner TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN cover_image_url TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN cover_crop TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN pup TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN username_changed_at TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN community_standards_version TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN community_standards_agreed_at TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN community_standards_declined_at TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN suspend_reason_code TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN suspend_reason_label TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN suspend_note TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN suspend_until TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN suspended_at TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN suspended_by_user_id INTEGER`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN shadow_banned INTEGER NOT NULL DEFAULT 0`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN shadow_ban_reason_code TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN shadow_ban_reason_label TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN shadow_ban_note TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN shadow_ban_until TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN shadow_banned_at TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN shadow_banned_by_user_id INTEGER`); } catch(e) {}
try { sqlite.exec(`
  CREATE TABLE IF NOT EXISTS pack_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    linked_user_id INTEGER NOT NULL,
    relation TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT '',
    UNIQUE(user_id, linked_user_id, relation)
  )
`); } catch(e) {}
try { sqlite.exec(`
  CREATE TABLE IF NOT EXISTS profile_media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    kind TEXT NOT NULL,
    title TEXT NOT NULL,
    tag TEXT,
    cadence TEXT,
    blurb TEXT,
    cover_url TEXT,
    platform_links TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT ''
  )
`); } catch(e) {}
try { sqlite.exec(`
  CREATE TABLE IF NOT EXISTS profile_media_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    media_id INTEGER NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    label TEXT,
    title TEXT NOT NULL,
    meta TEXT,
    audio_url TEXT NOT NULL,
    is_embed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT ''
  )
`); } catch(e) {}
try { sqlite.exec(`CREATE INDEX IF NOT EXISTS profile_media_items_media_idx ON profile_media_items(media_id)`); } catch(e) {}
try { sqlite.exec(`
  CREATE TABLE IF NOT EXISTS follows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    follower_user_id INTEGER NOT NULL,
    following_user_id INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE(follower_user_id, following_user_id)
  )
`); } catch(e) {}
try { sqlite.exec(`CREATE INDEX IF NOT EXISTS follows_following_idx ON follows(following_user_id)`); } catch(e) {}
// Soft-launch: default everyone-follows-everyone; rows here mean "I unfollowed them".
try { sqlite.exec(`
  CREATE TABLE IF NOT EXISTS follow_blocks (
    blocker_user_id INTEGER NOT NULL,
    blocked_user_id INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (blocker_user_id, blocked_user_id)
  )
`); } catch(e) {}
try { sqlite.exec(`CREATE INDEX IF NOT EXISTS follow_blocks_blocked_idx ON follow_blocks(blocked_user_id)`); } catch(e) {}
try { sqlite.exec(`
  CREATE TABLE IF NOT EXISTS member_blocks (
    blocker_user_id INTEGER NOT NULL,
    blocked_user_id INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (blocker_user_id, blocked_user_id),
    CHECK (blocker_user_id <> blocked_user_id)
  )
`); } catch(e) {}
try { sqlite.exec(`CREATE INDEX IF NOT EXISTS member_blocks_blocked_idx ON member_blocks(blocked_user_id)`); } catch(e) {}
try { sqlite.exec(`
  CREATE TABLE IF NOT EXISTS business_follows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    follower_user_id INTEGER NOT NULL,
    business_id INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE(follower_user_id, business_id)
  )
`); } catch(e) {}
try { sqlite.exec(`CREATE INDEX IF NOT EXISTS business_follows_biz_idx ON business_follows(business_id)`); } catch(e) {}
try { sqlite.exec(`
  CREATE TABLE IF NOT EXISTS push_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    platform TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT '',
    last_used_at TEXT
  )
`); } catch(e) {}
try { sqlite.exec(`
  CREATE TABLE IF NOT EXISTS host_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT ''
  )
`); } catch(e) {}

function ensureHubFeedPostsSchema() {
  try {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS hub_feed_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        post_type TEXT NOT NULL,
        body TEXT,
        photo_url TEXT,
        audience TEXT NOT NULL DEFAULT 'ALL',
        event_id INTEGER,
        status TEXT NOT NULL DEFAULT 'LIVE',
        created_at TEXT NOT NULL DEFAULT ''
      )
    `);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS hub_feed_posts_user_idx ON hub_feed_posts(user_id)`);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS hub_feed_posts_created_idx ON hub_feed_posts(created_at)`);
    // "Post as" identity - added after launch, so backfill onto existing tables.
    const cols = new Set(
      (sqlite.prepare(`PRAGMA table_info(hub_feed_posts)`).all() as { name: string }[]).map((c) => c.name),
    );
    if (!cols.has("post_as")) {
      sqlite.exec(`ALTER TABLE hub_feed_posts ADD COLUMN post_as TEXT NOT NULL DEFAULT 'self'`);
    }
    if (!cols.has("business_id")) {
      sqlite.exec(`ALTER TABLE hub_feed_posts ADD COLUMN business_id INTEGER`);
    }
  } catch (e) {
    console.error("[hub_feed_posts] schema migration failed:", e);
  }
}
ensureHubFeedPostsSchema();

/** Public content kinds that can be liked on profile Updates / board cards. */
export const CONTENT_LIKE_TYPES = ["GIG", "GIFTING", "SPOTTED", "HUB"] as const;
export type ContentLikeType = (typeof CONTENT_LIKE_TYPES)[number];

function ensureContentLikesSchema() {
  try {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS content_likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content_type TEXT NOT NULL,
        content_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        value INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT '',
        UNIQUE(content_type, content_id, user_id)
      )
    `);
    const cols = new Set(
      (sqlite.prepare(`PRAGMA table_info(content_likes)`).all() as { name: string }[]).map((c) => c.name),
    );
    if (!cols.has("value")) {
      sqlite.exec(`ALTER TABLE content_likes ADD COLUMN value INTEGER NOT NULL DEFAULT 1`);
    }
    sqlite.exec(`CREATE INDEX IF NOT EXISTS content_likes_content_idx ON content_likes(content_type, content_id)`);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS content_likes_user_idx ON content_likes(user_id)`);
  } catch (e) {
    console.error("[content_likes] schema migration failed:", e);
  }
}
ensureContentLikesSchema();

function bulkContentLikeCounts(contentType: ContentLikeType, ids: number[]): Map<number, number> {
  const out = new Map<number, number>();
  if (!ids.length) return out;
  const unique = Array.from(new Set(ids.filter(id => Number.isFinite(id) && id > 0)));
  if (!unique.length) return out;
  const placeholders = unique.map(() => "?").join(",");
  const rows = sqlite.prepare(`
    SELECT content_id AS contentId, COUNT(*) AS cnt
    FROM content_likes
    WHERE content_type = ? AND value = 1 AND content_id IN (${placeholders})
    GROUP BY content_id
  `).all(contentType, ...unique) as Array<{ contentId: number; cnt: number }>;
  for (const row of rows) out.set(Number(row.contentId), Number(row.cnt) || 0);
  return out;
}

function hubPostVoteMeta(contentId: number, viewerUserId?: number): { score: number; viewerVote: HubFeedVoteValue } {
  ensureContentLikesSchema();
  const scoreRow = sqlite.prepare(`
    SELECT COALESCE(SUM(value), 0) AS score
    FROM content_likes
    WHERE content_type = 'HUB' AND content_id = ?
  `).get(contentId) as { score: number } | undefined;
  const viewerRow = viewerUserId == null
    ? null
    : sqlite.prepare(`
        SELECT value
        FROM content_likes
        WHERE content_type = 'HUB' AND content_id = ? AND user_id = ?
      `).get(contentId, viewerUserId) as { value: number } | undefined;
  const raw = Number(viewerRow?.value || 0);
  return {
    score: Number(scoreRow?.score || 0),
    viewerVote: raw === 1 ? 1 : raw === -1 ? -1 : 0,
  };
}

function hubPostKarmaForUser(userId: number): number {
  ensureContentLikesSchema();
  const row = sqlite.prepare(`
    SELECT COALESCE(SUM(v.value), 0) AS karma
    FROM content_likes v
    JOIN hub_feed_posts p ON p.id = v.content_id
    WHERE v.content_type = 'HUB'
      AND p.user_id = ?
      AND p.status = 'LIVE'
      AND p.audience = 'ALL'
  `).get(userId) as { karma: number } | undefined;
  return Number(row?.karma || 0);
}

function bulkSpottedReplyCounts(ids: number[]): Map<number, number> {
  const out = new Map<number, number>();
  if (!ids.length) return out;
  const unique = Array.from(new Set(ids.filter(id => Number.isFinite(id) && id > 0)));
  if (!unique.length) return out;
  const placeholders = unique.map(() => "?").join(",");
  const rows = sqlite.prepare(`
    SELECT missed_connection_id AS contentId, COUNT(*) AS cnt
    FROM missed_connection_threads
    WHERE missed_connection_id IN (${placeholders})
    GROUP BY missed_connection_id
  `).all(...unique) as Array<{ contentId: number; cnt: number }>;
  for (const row of rows) out.set(Number(row.contentId), Number(row.cnt) || 0);
  return out;
}

function bulkGiftingInterestCounts(ids: number[]): Map<number, number> {
  const out = new Map<number, number>();
  if (!ids.length) return out;
  const unique = Array.from(new Set(ids.filter(id => Number.isFinite(id) && id > 0)));
  if (!unique.length) return out;
  const placeholders = unique.map(() => "?").join(",");
  const rows = sqlite.prepare(`
    SELECT post_id AS contentId, COUNT(*) AS cnt
    FROM gifting_interests
    WHERE post_id IN (${placeholders}) AND status IN ('INTERESTED', 'SELECTED')
    GROUP BY post_id
  `).all(...unique) as Array<{ contentId: number; cnt: number }>;
  for (const row of rows) out.set(Number(row.contentId), Number(row.cnt) || 0);
  return out;
}

/** Public content kinds that can carry thread replies on profile Updates. */
export const CONTENT_REPLY_TYPES = ["GIG", "GIFTING", "SPOTTED", "HUB"] as const;
export type ContentReplyType = (typeof CONTENT_REPLY_TYPES)[number];
/** Types that store public reply bodies in content_replies (not private native flows). */
export const CONTENT_REPLY_THREAD_TYPES = ["GIG", "HUB"] as const;
export type ContentReplyThreadType = (typeof CONTENT_REPLY_THREAD_TYPES)[number];

function ensureContentRepliesSchema() {
  try {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS content_replies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content_type TEXT NOT NULL,
        content_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        body TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT ''
      )
    `);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS content_replies_content_idx ON content_replies(content_type, content_id)`);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS content_replies_user_idx ON content_replies(user_id)`);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS content_replies_created_idx ON content_replies(created_at)`);
  } catch (e) {
    console.error("[content_replies] schema migration failed:", e);
  }
}
ensureContentRepliesSchema();

/** DM message emoji reactions (long-press on bubbles). */
function ensureMessageReactionsSchema() {
  try {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS message_reactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        emoji TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT '',
        UNIQUE(message_id, user_id, emoji)
      )
    `);
    sqlite.exec(
      `CREATE INDEX IF NOT EXISTS message_reactions_message_idx ON message_reactions(message_id)`,
    );
    sqlite.exec(
      `CREATE INDEX IF NOT EXISTS message_reactions_user_idx ON message_reactions(user_id)`,
    );
  } catch (e) {
    console.error("[message_reactions] schema migration failed:", e);
  }
}
ensureMessageReactionsSchema();

const VALID_MESSAGE_REACTION_CODES = new Set([
  "thumbsup",
  "thumbsdown",
  "laugh",
  "cry",
  "heart",
  "heartbreak",
  "gay",
]);

/** Aggregate reaction chips for a set of DM message ids (viewer-aware). */
function bulkMessageReactionSummaries(
  messageIds: number[],
  viewerUserId: number,
): Map<number, Array<{ code: string; count: number; mine: boolean }>> {
  ensureMessageReactionsSchema();
  const out = new Map<number, Array<{ code: string; count: number; mine: boolean }>>();
  if (!messageIds.length) return out;
  const unique = Array.from(new Set(messageIds.filter((id) => Number.isFinite(id) && id > 0)));
  if (!unique.length) return out;
  const placeholders = unique.map(() => "?").join(",");
  const rows = sqlite
    .prepare(
      `
    SELECT message_id AS messageId, emoji AS code, COUNT(*) AS cnt,
           SUM(CASE WHEN user_id = ? THEN 1 ELSE 0 END) AS mineCnt
    FROM message_reactions
    WHERE message_id IN (${placeholders})
    GROUP BY message_id, emoji
    ORDER BY message_id ASC, MIN(created_at) ASC
  `,
    )
    .all(viewerUserId, ...unique) as Array<{
    messageId: number;
    code: string;
    cnt: number;
    mineCnt: number;
  }>;
  for (const row of rows) {
    const mid = Number(row.messageId);
    if (!VALID_MESSAGE_REACTION_CODES.has(String(row.code))) continue;
    const list = out.get(mid) || [];
    list.push({
      code: String(row.code),
      count: Number(row.cnt) || 0,
      mine: Number(row.mineCnt) > 0,
    });
    out.set(mid, list);
  }
  return out;
}

function bulkContentReplyCounts(contentType: ContentReplyThreadType, ids: number[]): Map<number, number> {
  const out = new Map<number, number>();
  if (!ids.length) return out;
  const unique = Array.from(new Set(ids.filter(id => Number.isFinite(id) && id > 0)));
  if (!unique.length) return out;
  const placeholders = unique.map(() => "?").join(",");
  const rows = sqlite.prepare(`
    SELECT content_id AS contentId, COUNT(*) AS cnt
    FROM content_replies
    WHERE content_type = ? AND content_id IN (${placeholders})
    GROUP BY content_id
  `).all(contentType, ...unique) as Array<{ contentId: number; cnt: number }>;
  for (const row of rows) out.set(Number(row.contentId), Number(row.cnt) || 0);
  return out;
}

/** True when the target board/hub post is public enough to engage (like / reply). */
function contentIsPubliclyEngagable(contentType: string, contentId: number): boolean {
  const type = String(contentType || "").toUpperCase();
  const id = Number(contentId);
  if (!Number.isFinite(id) || id <= 0) return false;
  if (type === "GIG") {
    const row = sqlite.prepare(`SELECT id, status FROM gig_posts WHERE id = ?`).get(id) as any;
    return !!row && String(row.status || "").toUpperCase() === "LIVE";
  }
  if (type === "GIFTING") {
    const row = sqlite.prepare(`SELECT id, status FROM gifting_posts WHERE id = ?`).get(id) as any;
    const status = String(row?.status || "").toUpperCase();
    return !!row && !["REMOVED", "REJECTED", "PENDING", "EXPIRED"].includes(status);
  }
  if (type === "SPOTTED") {
    const row = sqlite.prepare(`SELECT id, status FROM missed_connections WHERE id = ?`).get(id) as any;
    return !!row && String(row.status || "").toUpperCase() === "ACTIVE";
  }
  if (type === "HUB") {
    const row = sqlite.prepare(`SELECT id, status, audience FROM hub_feed_posts WHERE id = ?`).get(id) as any;
    return !!row && row.status === "LIVE" && String(row.audience || "ALL").toUpperCase() === "ALL";
  }
  return false;
}

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

function ensureBusinessClaimsSchema() {
  try {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS business_claims (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        business_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        claim_reason TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        admin_notes TEXT,
        created_at TEXT NOT NULL DEFAULT ''
      )
    `);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS business_claims_business_idx ON business_claims(business_id)`);
  } catch (e) {
    console.error("[business_claims] schema migration failed:", e);
  }
}
ensureBusinessClaimsSchema();

function ensureBusinessSubmissionsSchema() {
  try {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS business_submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'bar',
        description TEXT NOT NULL,
        address TEXT,
        neighborhood TEXT,
        hours TEXT,
        phone TEXT,
        website TEXT,
        instagram TEXT,
        logo_image_url TEXT,
        status TEXT NOT NULL DEFAULT 'PENDING',
        admin_notes TEXT,
        created_business_id INTEGER,
        created_at TEXT NOT NULL DEFAULT ''
      )
    `);
  } catch (e) {
    console.error("[business_submissions] schema migration failed:", e);
  }
}
ensureBusinessSubmissionsSchema();

function ensureBusinessBlocksSchema() {
  try {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS business_blocks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        business_id INTEGER NOT NULL,
        blocked_user_id INTEGER NOT NULL,
        created_by_user_id INTEGER,
        created_at TEXT NOT NULL DEFAULT '',
        UNIQUE(business_id, blocked_user_id)
      )
    `);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS business_blocks_business_idx ON business_blocks(business_id)`);
  } catch (e) {
    console.error("[business_blocks] schema migration failed:", e);
  }
}
ensureBusinessBlocksSchema();

function ensureBusinessLogoRequestsSchema() {
  try {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS business_logo_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        business_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        image_url TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        admin_notes TEXT,
        created_at TEXT NOT NULL DEFAULT ''
      )
    `);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS business_logo_requests_business_idx ON business_logo_requests(business_id)`);
  } catch (e) {
    console.error("[business_logo_requests] schema migration failed:", e);
  }
}
ensureBusinessLogoRequestsSchema();

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
    // Talent self-tags go live without approval - clear legacy queue.
    sqlite.exec(`UPDATE event_talent SET status = 'LIVE' WHERE status = 'PENDING'`);
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
    if (!names.has("admin_notes")) sqlite.exec(`ALTER TABLE missed_connections ADD COLUMN admin_notes TEXT`);
    if (!names.has("admin_reviewed")) sqlite.exec(`ALTER TABLE missed_connections ADD COLUMN admin_reviewed INTEGER DEFAULT 0`);
    if (!names.has("beach_id")) sqlite.exec(`ALTER TABLE missed_connections ADD COLUMN beach_id TEXT`);
    // Spotted is public without approval - mark existing live posts reviewed so nothing sits in a fake queue.
    try {
      sqlite.exec(`UPDATE missed_connections SET admin_reviewed = 1 WHERE status = 'ACTIVE' AND (admin_reviewed IS NULL OR admin_reviewed = 0)`);
    } catch {
      /* ignore if column race on first boot */
    }
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
    sqlite.exec(`CREATE INDEX IF NOT EXISTS missed_conn_beach_idx ON missed_connections(beach_id)`);
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

function ensureRiverBratsSchema() {
  try {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS beach_checkins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        beach_id TEXT NOT NULL,
        arrival_hour INTEGER NOT NULL,
        note TEXT,
        calendar_date TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        report_count INTEGER NOT NULL DEFAULT 0,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT ''
      )
    `);
    sqlite.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS beach_checkin_user_day_idx
      ON beach_checkins(user_id, beach_id, calendar_date)
    `);
    try { sqlite.exec(`ALTER TABLE beach_checkins ADD COLUMN is_anonymous INTEGER NOT NULL DEFAULT 0`); } catch (e) {}
    // GPS presence: 'PLANNED' (picked an arrival hour) → 'HERE' (location-verified
    // on the beach). Raw coordinates are never persisted - only this state flag
    // and the verification timestamp.
    try { sqlite.exec(`ALTER TABLE beach_checkins ADD COLUMN presence TEXT NOT NULL DEFAULT 'PLANNED'`); } catch (e) {}
    try { sqlite.exec(`ALTER TABLE beach_checkins ADD COLUMN gps_verified_at TEXT`); } catch (e) {}
    try { sqlite.exec(`ALTER TABLE beach_checkins ADD COLUMN depart_hour INTEGER`); } catch (e) {}
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS scheduled_prompts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        kind TEXT NOT NULL,
        fire_at TEXT NOT NULL,
        beach_id TEXT,
        calendar_date TEXT,
        checkin_id INTEGER,
        status TEXT NOT NULL DEFAULT 'PENDING',
        created_at TEXT NOT NULL DEFAULT ''
      )
    `);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS scheduled_prompts_due_idx ON scheduled_prompts(status, fire_at)`);
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS beach_chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        beach_id TEXT NOT NULL,
        calendar_date TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        body TEXT NOT NULL,
        is_anonymous INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT ''
      )
    `);
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS beach_carpool_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        beach_id TEXT NOT NULL,
        post_type TEXT NOT NULL,
        departure_area TEXT NOT NULL,
        trip_date TEXT NOT NULL,
        leave_hour INTEGER NOT NULL,
        seats INTEGER,
        note TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'OPEN',
        report_count INTEGER NOT NULL DEFAULT 0,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT ''
      )
    `);
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS beach_carpool_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        note TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'INTERESTED',
        created_at TEXT NOT NULL DEFAULT ''
      )
    `);
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS river_brats_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        target_type TEXT NOT NULL,
        target_id INTEGER NOT NULL,
        reporter_user_id INTEGER NOT NULL,
        reason TEXT NOT NULL,
        note TEXT,
        status TEXT NOT NULL DEFAULT 'PENDING',
        admin_notes TEXT,
        created_at TEXT NOT NULL DEFAULT ''
      )
    `);
    sqlite.exec(`CREATE INDEX IF NOT EXISTS beach_carpool_beach_date_idx ON beach_carpool_posts(beach_id, trip_date)`);
    // Advance planning + return rides: direction column (TO_BEACH | FROM_BEACH).
    try {
      const cols = sqlite.prepare(`PRAGMA table_info(beach_carpool_posts)`).all() as Array<{ name: string }>;
      if (!cols.some(c => c.name === "direction")) {
        sqlite.exec(`ALTER TABLE beach_carpool_posts ADD COLUMN direction TEXT NOT NULL DEFAULT 'TO_BEACH'`);
      }
    } catch (e) {
      console.error("[river_brats] carpool direction migration failed:", e);
    }
  } catch (e) {
    console.error("[river_brats] schema migration failed:", e);
  }
}
ensureRiverBratsSchema();

function ensureGiftingPostsSchema() {
  try {
    const cols = sqlite.prepare(`PRAGMA table_info(gifting_posts)`).all() as Array<{ name: string }>;
    const names = new Set(cols.map(c => c.name));
    if (!names.has("admin_notes")) sqlite.exec(`ALTER TABLE gifting_posts ADD COLUMN admin_notes TEXT`);
    // Gifting posts go live without admin approval - promote legacy PENDING rows.
    sqlite.exec(`UPDATE gifting_posts SET status = 'LOOKING' WHERE UPPER(status) = 'PENDING' AND UPPER(post_type) = 'ISO'`);
    sqlite.exec(`UPDATE gifting_posts SET status = 'OPEN' WHERE UPPER(status) = 'PENDING'`);
  } catch (e) {
    console.error("[gifting_posts] schema migration failed:", e);
  }
}
ensureGiftingPostsSchema();

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
      // Only replace admin seed events - never wipe user gigs, claims, or submissions.
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
      description: "2026 theme 'Made with Pride', celebrates creativity and entrepreneurship in Portland LGBTQ2SIA+ community. Live music (Lushious Massacr, DeJa Skye, Tenderoni), makers' market, food/drink vendors, nonprofit booths. $10 suggested donation.",
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
      title: "Stank Yes Coach - PDX PRIDE",
      description: "Sports-themed party with DJs JUMPR, Bro Hoe, Lake Everett, Spencer Stanks, Tucker Max. Leather community sponsors. Hosted by Tucker Max and Spencer Stanks.",
      venueName: "Sanctuary Club",
      address: "33 NW 9th Ave, Portland, OR 97209",
      neighborhood: "Pearl District",
      lat: 45.523244045755, lng: -122.680179337043,
      dateStart: "2026-07-18T21:00:00", dateEnd: "2026-07-19T02:00:00",
      dayOfWeek: "SAT",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["PARTY", "SPORTS", "LEATHER"]),
      admission: "DOOR_FEE",
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
      title: "Pride in Demand - Portland Queer Takeover - Night 1",
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
      description: "Pride Sunday patio party at Jackie's, 4–9pm (shifted from 3–8 for the World Cup). Plaid-themed. DJs Not That Jennifer & Orographic. Sexy lumber go-gos, photo booth by Matty Hoffman. Discounted entry for plaid. 2 patios, 2 bars, air-conditioned indoors, VIP area. $18.69 (Plaid) / $29.45 (Non-Plaid).",
      venueName: "Jackie's",
      address: "930 SE Sandy Blvd, Portland, OR 97214",
      neighborhood: "SE Portland",
      lat: 45.5192, lng: -122.6478,
      dateStart: "2026-07-19T16:00:00", dateEnd: "2026-07-19T21:00:00",
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
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: true, nudityOk: false,
      posterImageUrl: "/posters/treasure-trail-portland-pride.jpg", status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Bearracuda Pride Friday - Vaseline Alley",
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
      // Cap through Pride Sunday only - never expand onto Mon Jul 20.
      dateStart: "2026-07-17T17:00:00", dateEnd: "2026-07-19T20:00:00",
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
      description: "An explosive celebration of queerness from IZOHNNY, Isaiah Esquire & Johnny Nuriel, the Goliaths of Glam. Drag, burlesque, circus, and dance. Internationally acclaimed, unapologetically queer, fiercely inclusive. Featuring legendary icons.",
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
      description: "TGIF at Darcelle XV Showplace, glittery entertainment, fierce performances, and nonstop sparkle. Celebrating something special? Bachelor/bachelorette, birthday, or just making it through the week, do it here. Doors 7pm, show 8pm. Cover $32. Ages 21+. Reservations recommended via Darcelle XV.",
      venueName: "Darcelle XV Showplace",
      address: "208 NW 3rd Ave, Portland, OR 97209",
      neighborhood: "Old Town",
      lat: 45.524649023488, lng: -122.673354790034,
      dateStart: "2026-07-17T19:00:00", dateEnd: "2026-07-17T21:30:00",
      dayOfWeek: "FRI",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["DRAG", "CABARET", "SHOW"]),
      admission: "TICKETED",
      ticketUrl: "https://dcxv.empxv.com/reservations/",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/darcelle-xv-friday.jpg", status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Darcelle XV Saturday Night Show",
      description: "Saturday night glitter, glam, and unforgettable drag at Darcelle XV Showplace. Keep the party going with the Men of Darcelle after the main show. Doors 7pm, show 8pm. Cover $32. Men of Darcelle at 9:30pm, $10 cover after 9:30pm. Ages 21+. Reservations recommended.",
      venueName: "Darcelle XV Showplace",
      address: "208 NW 3rd Ave, Portland, OR 97209",
      neighborhood: "Old Town",
      lat: 45.524649023488, lng: -122.673354790034,
      dateStart: "2026-07-18T19:00:00", dateEnd: "2026-07-18T23:00:00",
      dayOfWeek: "SAT",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["DRAG", "CABARET", "SHOW"]),
      admission: "TICKETED",
      ticketUrl: "https://dcxv.empxv.com/reservations/",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/darcelle-xv-saturday.jpg", status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Darcelle XV Sunday Funday Drag Brunch",
      description: "Sunday brunch, fiercer. Weekly Sunday Funday Drag Brunch at Darcelle XV Showplace, fabulous performances, big laughs, and all the glam. Doors 11:30am, show 12:30pm. Cover $32. Ages 21+. Reservations recommended.",
      venueName: "Darcelle XV Showplace",
      address: "208 NW 3rd Ave, Portland, OR 97209",
      neighborhood: "Old Town",
      lat: 45.524649023488, lng: -122.673354790034,
      dateStart: "2026-07-19T11:30:00", dateEnd: "2026-07-19T14:00:00",
      dayOfWeek: "SUN",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["BRUNCH", "DRAG", "CABARET"]),
      admission: "TICKETED",
      ticketUrl: "https://dcxv.empxv.com/reservations/",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/darcelle-xv-sunday.jpg", status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "I Do at Darcelle's - Mass Wedding",
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
      title: "Pride in Demand - Portland Queer Takeover - Night 2",
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
      title: "Ankeny Alley Pride Block Party - Sunday",
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
      title: "Portland Pride Drag Brunch at Stag PDX - Sunday",
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
    {
      title: "Fresh Paint - Weekly Open-Call Drag Showcase",
      description: "Weekly Monday drag showcase at Badlands. Hosted by @theriodiehl, new talent plus a dance party after. Runs through Pride Month. No cover before 9PM.",
      venueName: "Badlands Portland",
      address: "110 NW Broadway, Portland, OR 97209",
      neighborhood: "Old Town",
      lat: 45.5236, lng: -122.6754,
      dateStart: "2026-07-06T21:00:00", dateEnd: "2026-07-07T02:00:00",
      dayOfWeek: "MON",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["DRAG", "PERFORMANCE", "NIGHTLIFE"]),
      admission: "DOOR_FEE",
      ticketUrl: "https://www.instagram.com/p/DaL3OlcSa2Z/",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "https://www.instagram.com/p/DaL3OlcSa2Z/",
      status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: "Pride Month Mon–Wed programming Jul 6–8, 2026. Last verified 2026-07-02.", createdAt: now,
    },
    {
      title: "Laugh Your Clothes Off",
      description: "Pride Month comedy night featuring queer comedians. Weekly Monday series at Eagle Portland.",
      venueName: "Eagle Portland",
      address: "835 N Lombard St, Portland, OR 97217",
      neighborhood: "N Portland",
      lat: 45.5803, lng: -122.6856,
      dateStart: "2026-07-06T19:30:00", dateEnd: "2026-07-06T22:00:00",
      dayOfWeek: "MON",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["COMEDY", "PERFORMANCE"]),
      admission: "TICKETED",
      ticketUrl: "https://www.eventbrite.com/e/laugh-your-clothes-off-june-tickets-1339444884159",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: null, status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: "Pride Month Mon–Wed programming Jul 6–8, 2026. Last verified 2026-07-02.", createdAt: now,
    },
    {
      title: "Drag Bingo Tuesday",
      description: "Weekly drag bingo at Space Room Lounge. Runs Tuesdays through July during Pride Month.",
      venueName: "Space Room Lounge",
      address: "4800 SE Hawthorne Blvd, Portland, OR 97215",
      neighborhood: "Hawthorne",
      lat: 45.5119, lng: -122.6125,
      dateStart: "2026-07-07T19:30:00", dateEnd: "2026-07-07T22:00:00",
      dayOfWeek: "TUE",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["DRAG", "SOCIAL"]),
      admission: "FREE",
      ticketUrl: "https://spaceroomlounge.com/events",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: null, status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: "Pride Month Mon–Wed programming Jul 6–8, 2026. Last verified 2026-07-02.", createdAt: now,
    },
    {
      title: "40+ Sapphic Singles at Escape Bar & Grill",
      description: "Sapphic and queer women 40+ singles mixer. Part of Pride Month programming at Escape Bar & Grill.",
      venueName: "Escape Bar & Grill",
      address: "9004 NE Sandy Blvd, Portland, OR 97220",
      neighborhood: "Hollywood District",
      lat: 45.5559, lng: -122.57,
      dateStart: "2026-07-07T19:00:00", dateEnd: "2026-07-07T22:00:00",
      dayOfWeek: "TUE",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["SOCIAL", "QTBIPOC"]),
      admission: "TICKETED",
      ticketUrl: "https://stayhappening.com/e/40-sapphic-singles-at-escape-bar-grill-E2IST7YF0Q1",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: null, status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: "Pride Month Mon–Wed programming Jul 6–8, 2026. Last verified 2026-07-02.", createdAt: now,
    },
    {
      title: "Queer Mountaineers Pride Party",
      description: "Queer community social and Pride celebration at Loyal Legion. All ages welcome.",
      venueName: "Loyal Legion",
      address: "707 SE 6th Ave, Portland, OR 97214",
      neighborhood: "Buckman",
      lat: 45.5172, lng: -122.6593,
      dateStart: "2026-07-08T19:00:00", dateEnd: "2026-07-08T22:00:00",
      dayOfWeek: "WED",
      ageRequirement: "ALL_AGES",
      eventTypes: JSON.stringify(["SOCIAL", "COMMUNITY"]),
      admission: "FREE",
      ticketUrl: "https://www.eventbrite.com/e/queer-mountaineers-pride-party-at-loyal-legion-tickets-1990675249258",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: null, status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: "Pride Month Mon–Wed programming Jul 6–8, 2026. Last verified 2026-07-02.", createdAt: now,
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

  // Seed one real-looking gig (LOOKING_FOR_WORK only - let real users post gigs)
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
      poster_image_url = COALESCE(@posterImageUrl, poster_image_url),
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
    posterImageUrl: null,
    status: null,
    adminNotes: null,
    ...patch,
  });

  runTitle("Portland Pride Waterfront Festival", {
    description: "Official PrideNW festival at Tom McCall Waterfront Park. 2026 theme: \"Made with Pride\", celebrating creativity, entrepreneurship, and Pride's protest roots. Saturday noon-8pm and Sunday 11:30am-6pm. $10 suggested donation; no one turned away. Headliners announced so far: Lushious Massacr, DeJa Skye, Tenderoni. Features main stage and north stage, ASL interpreters, ADA viewing areas, accessible flooring, and VIP pass options.",
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
  runTitle("Ankeny Alley Pride Block Party - Sunday", {
    newTitle: "Old Town Block Party - Sunday",
    description: "Official PrideNW Old Town activation. Unstoppable joy, radical love, and Pride weekend community energy in and around Ankeny Alley.",
    eventTypes: JSON.stringify(["BLOCK-PARTY", "OFFICIAL", "FREE", "OUTDOOR"]),
  });
  runTitle("Midtown Beer Garden Pride", {
    address: "431 SW Harvey Milk St, Portland, OR 97204",
    lat: 45.520416,
    lng: -122.678127,
    dateStart: "2026-07-17T17:00:00",
    dateEnd: "2026-07-19T20:00:00",
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
  runTitle("Darcelle XV Friday Night Show", {
    description: "TGIF at Darcelle XV Showplace, glittery entertainment, fierce performances, and nonstop sparkle. Doors 7pm, show 8pm. Cover $32. Ages 21+. Reservations recommended via Darcelle XV.",
    ticketUrl: "https://dcxv.empxv.com/reservations/",
    posterImageUrl: "/posters/darcelle-xv-friday.jpg",
    dateStart: "2026-07-17T19:00:00",
    dateEnd: "2026-07-17T21:30:00",
    ageRequirement: "21_PLUS",
  });
  runTitle("Darcelle XV Saturday Night Show", {
    description: "Saturday night glitter, glam, and unforgettable drag at Darcelle XV Showplace. Men of Darcelle after the main show. Doors 7pm, show 8pm. Cover $32. Men of Darcelle at 9:30pm, $10 after 9:30pm. Ages 21+.",
    ticketUrl: "https://dcxv.empxv.com/reservations/",
    posterImageUrl: "/posters/darcelle-xv-saturday.jpg",
    dateStart: "2026-07-18T19:00:00",
    dateEnd: "2026-07-18T23:00:00",
    ageRequirement: "21_PLUS",
  });
  runTitle("Darcelle XV Sunday Funday Drag Brunch", {
    description: "Sunday Funday Drag Brunch at Darcelle XV Showplace, fabulous performances, big laughs, and glam. Doors 11:30am, show 12:30pm. Cover $32. Ages 21+. Reservations recommended.",
    ticketUrl: "https://dcxv.empxv.com/reservations/",
    posterImageUrl: "/posters/darcelle-xv-sunday.jpg",
    dateStart: "2026-07-19T11:30:00",
    dateEnd: "2026-07-19T14:00:00",
    ageRequirement: "21_PLUS",
  });
  runTitle("Champagne's Catch A Rising Star", {
    description: "Tuesday open-mic / rising-star drag night at Darcelle XV Showplace featuring the CARS All-Stars. Hosted by Poison Waters and Cassie Nova. Doors 6pm, show 7pm. $5 cover. No reservations needed. Aspiring performers: email music.darcellexv@gmail.com by the prior Thursday. 21+.",
    ticketUrl: "https://darcellexv.com/event/champagnes-catch-a-rising-star-%f0%9f%8c%9f/2026-07-14/",
    posterImageUrl: "/posters/darcelle-xv-cars-rising-star.jpg",
    dateStart: "2026-07-14T18:00:00",
    dateEnd: "2026-07-14T20:30:00",
    ageRequirement: "21_PLUS",
  });
  runTitle("Treasure Trail Portland Pride", {
    venueName: "Sanctuary Club",
    description: "Bearracuda's Pride Friday kick-off at Sanctuary Club. DJ TIGERBEATZ from Seattle, hosted by JP Hardy. Wristband color system at the door: red=top, blue=vers, green=bottom, white=side. Venmo tickets available with no surcharge.",
  });
  runTitle("Bearracuda Pride Friday - Vaseline Alley", {
    description: "Bearracuda Pride Friday at 722 E Burnside. Theme: VASELINE ALLEY. Harnesses and fetish gear encouraged.",
  });
  sqlite.prepare(`
    UPDATE events SET
      status = 'HIDDEN',
      admin_notes = 'Duplicate/old Friday listing. Confirmed 2026 Pride in Demand listing is Saturday July 18 at Star Theater.'
    WHERE title = 'Pride in Demand - Portland Queer Takeover'
      AND date_start = '2026-07-17T21:00:00'
  `).run();
  sqlite.prepare(`
    UPDATE events SET
      title = 'Pride in Demand - Portland Queer Takeover',
      description = 'DotGay''s Pride in Demand Portland Queer Takeover at Star Theater. Confirmed Saturday July 18, 2026 at 9pm. Ticket range reported at $31-$134. This is Night 2 of 2. Night 1 is Friday July 17, 2026 9:00 PM.',
      ticket_url = 'https://www.startheaterportland.com/tm-event/pride-in-demand-portland-queer-takeover/',
      event_types = '["PARTY","TAKEOVER","MULTI-DAY"]',
      status = 'LIVE'
    WHERE (title = 'Pride in Demand - Portland Queer Takeover - Night 2'
      OR title = 'Pride in Demand - Portland Queer Takeover')
      AND date_start = '2026-07-18T21:00:00'
  `).run();
  runTitle("Stank Yes Coach - PDX PRIDE", {
    description: "Yes Coach / Stank Pride party at Sanctuary Club. Hosted by Tucker Max and Spencer Stanks. DJs: JUMPR, Bro Hoe, Lake Everett, Spencer Stanks, and Tucker Max.",
  });
  runTitle("Gay Witch Appreciation Day + Pride at Seagrape", {
    description: "All-ages witch-themed Pride market and apothecary event at Seagrape, 11am-5pm. All are welcome.",
  });
  runTitle("Portland Pride Drag Brunch at Stag PDX", {
    description: "Portland Pride Drag Brunch at Stag PDX. Confirmed Saturday July 18, 2026 at 11am. Ticket range reported at $45-$150.",
    ageRequirement: "21_PLUS",
  });
  runTitle("Portland Pride Drag Brunch at Stag PDX - Sunday", {
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
    description: "BOYeurism Pride Spectacular at Alberta Rose Theatre. Created by IZOHNNY, Isaiah Esquire and Johnny Nuriel.",
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
    description: "Lumbertwink Plaid Patio Pride at Jackie's, 4–9pm (shifted from 3–8 for the World Cup). DJs Not That Jennifer and Orographic, sexy lumber go-gos, photo booth by Matty Hoffman. $18.69 plaid / $29.45 non-plaid.",
    dateStart: "2026-07-19T16:00:00",
    dateEnd: "2026-07-19T21:00:00",
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
  runTitle("Twirl! PDX Queer Disco - Pride Edition (HOLD)", {
    newTitle: "Twirl! PDX Queer Disco - Pride Edition (2025 Hold)",
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

function removePrePrideWeekEvents() {
  sqlite.prepare(`
    UPDATE events SET
      status = 'HIDDEN',
      admin_notes = 'Hidden: pre-Pride Week listing - Portland Pride Week starts Jul 13, 2026'
    WHERE date_start < '2026-07-13'
      AND status = 'LIVE'
  `).run();
}

/** PDX PAH Barking Chain - July 2026 Happy Pahride newsletter (admin_seeded, claimable). */
function seedPdxPahJuly2026Events() {
  const now = new Date().toISOString();
  const exists = sqlite.prepare("SELECT id FROM events WHERE title = ? LIMIT 1");
  const insert = (row: Record<string, unknown>) => {
    if (exists.get(row.title)) return;
    db.insert(events).values({ ...row, createdAt: now } as any).run();
  };

  insert({
    title: "Bearly Awake: Morning Grounding & Meditation",
    description:
      "All-creature morning grounding, gentle movement, and meditation hour hosted by Alty Bear. Monthly on 3rd Wednesdays, this July session leads into Pride Weekend. Hosted by Portland Pets and Handlers (PDX PAH).",
    venueName: "Q Center",
    address: "4115 N Mississippi Ave, Portland, OR 97217",
    neighborhood: "N Portland",
    lat: 45.5652,
    lng: -122.676,
    dateStart: "2026-07-15T10:00:00",
    dateEnd: "2026-07-15T11:00:00",
    dayOfWeek: "WED",
    ageRequirement: "ALL_AGES",
    eventTypes: JSON.stringify(["SOCIAL", "COMMUNITY", "WELLNESS"]),
    admission: "FREE",
    ticketUrl: "https://www.instagram.com/pdxpahofficial/",
    isPublic: true,
    isPrivate: false,
    isHouseParty: false,
    isSexPositive: false,
    nudityOk: false,
    posterImageUrl: "/posters/pdxpah-bearly-awake.png",
    status: "LIVE",
    source: "admin_seeded",
    isClaimable: true,
    claimedBy: null,
    submittedBy: null,
    adminNotes: "From PDX PAH Barking Chain July 2026 newsletter.",
  });

  insert({
    title: "PDXPAH Social & AWOO: The Petplayers Social",
    description:
      "Friday Pride kickoff social at Eagle Portland. Strut, catch up with the crew, and ask for a welcome pet if you need a hand breaking into the space. Dance party from 9pm with rotating DJs, show tails only. Contact @PorkyGrinds or @DaddyBandit1989 on Telegram to volunteer as a welcome pet.",
    venueName: "Eagle Portland",
    address: "835 N Lombard St, Portland, OR 97217",
    neighborhood: "N Portland",
    lat: 45.5803,
    lng: -122.6856,
    dateStart: "2026-07-17T19:00:00",
    dateEnd: "2026-07-18T00:00:00",
    dayOfWeek: "FRI",
    ageRequirement: "21_PLUS",
    eventTypes: JSON.stringify(["SOCIAL", "PARTY", "LEATHER", "KINK", "DANCE"]),
    admission: "DOOR_FEE",
    ticketUrl: "https://www.instagram.com/pdxpahofficial/",
    isPublic: true,
    isPrivate: false,
    isHouseParty: false,
    isSexPositive: true,
    nudityOk: false,
    posterImageUrl: "/posters/pdxpah-eagle-july-schedule.png",
    status: "LIVE",
    source: "admin_seeded",
    isClaimable: true,
    claimedBy: null,
    submittedBy: null,
    adminNotes: "From PDX PAH Barking Chain July 2026 newsletter. Eagle lists 7/17 as AWOO.",
  });

  insert({
    title: "The Pahvillion - PDX PAH at Waterfront Pride Festival",
    description:
      "Hang with the puppies at Pride Weekend. PDX PAH hosts booths #7 and #8 at Tom McCall Waterfront Park with Portland Sisters of Perpetual Indulgence, Quirky Witches, Animal Expressants of a Different Breed, and elected officials. Snacks, drinks, headpats, and a cool-down from the heat. Henna and handcrafted dupatta sales from Amrapali Boutique on behalf of the Sisters.",
    venueName: "Tom McCall Waterfront Park, PDX PAH Booths 7 & 8",
    address: "98 SW Naito Pkwy, Portland, OR 97204",
    neighborhood: "Downtown",
    lat: 45.5201241,
    lng: -122.6727,
    dateStart: "2026-07-18T12:00:00",
    dateEnd: "2026-07-19T18:00:00",
    dayOfWeek: "SAT",
    ageRequirement: "ALL_AGES",
    eventTypes: JSON.stringify(["FESTIVAL", "COMMUNITY", "SOCIAL", "MULTI-DAY"]),
    admission: "FREE",
    ticketUrl: "https://www.instagram.com/pdxpahofficial/",
    isPublic: true,
    isPrivate: false,
    isHouseParty: false,
    isSexPositive: false,
    nudityOk: false,
    posterImageUrl: "/posters/pdxpah-happy-wrath.png",
    status: "LIVE",
    source: "admin_seeded",
    isClaimable: true,
    claimedBy: null,
    submittedBy: null,
    adminNotes: "From PDX PAH Barking Chain July 2026 newsletter. Booths open Sat–Sun festival hours.",
  });

  insert({
    title: "Portland Pets and Handlers in the Pahrade",
    description:
      "Join the pack for PDX PAH's annual Pride parade march. Wear your best, your worst, or your most expressive self. A float is available for anyone who has difficulty walking the route. Group photo tradition at 10:15am, rally point posted in the Bark Box Telegram channel once confirmed.",
    venueName: "Portland Pride Parade, PDX PAH contingent",
    address: "North Park Blocks to Naito Pkwy, Portland, OR 97209",
    neighborhood: "Downtown",
    lat: 45.523011535188,
    lng: -122.679071017042,
    dateStart: "2026-07-19T10:00:00",
    dateEnd: "2026-07-19T15:00:00",
    dayOfWeek: "SUN",
    ageRequirement: "ALL_AGES",
    eventTypes: JSON.stringify(["MARCH", "PARADE", "COMMUNITY", "LEATHER", "FREE"]),
    admission: "FREE",
    ticketUrl: "https://t.me/pdxpahbarkbox",
    isPublic: true,
    isPrivate: false,
    isHouseParty: false,
    isSexPositive: false,
    nudityOk: false,
    posterImageUrl: "/posters/pdxpah-happy-wrath.png",
    status: "LIVE",
    source: "admin_seeded",
    isClaimable: true,
    claimedBy: null,
    submittedBy: null,
    adminNotes: "From PDX PAH Barking Chain July 2026 newsletter. Rally location via Bark Box.",
  });

  insert({
    title: "Post Parade Pet Party: P4",
    description:
      "Post-parade pet party presented by Portland Pets and Handlers at CC Slaughters. Sunday night dance and social with DJ Ragnarock after the Pride parade.",
    venueName: "CC Slaughters",
    address: "219 NW Davis St, Portland, OR 97209",
    neighborhood: "Old Town",
    lat: 45.5236,
    lng: -122.6737,
    dateStart: "2026-07-19T17:00:00",
    dateEnd: "2026-07-20T02:00:00",
    dayOfWeek: "SUN",
    ageRequirement: "21_PLUS",
    eventTypes: JSON.stringify(["PARTY", "SOCIAL", "DANCE", "LEATHER", "KINK"]),
    admission: "DOOR_FEE",
    ticketUrl: "https://ccslaughterspdx.com",
    isPublic: true,
    isPrivate: false,
    isHouseParty: false,
    isSexPositive: true,
    nudityOk: false,
    posterImageUrl: "/posters/pdxpah-post-parade-p4.png",
    status: "LIVE",
    source: "admin_seeded",
    isClaimable: true,
    claimedBy: null,
    submittedBy: null,
    adminNotes: "From PDX PAH Barking Chain July 2026 newsletter. Feat. DJ Ragnarock.",
  });

  insert({
    title: "OSLC Info Session - So You Want to Be a Titleholder?",
    description:
      "Virtual info session for anyone curious about becoming an Oregon State Leather titleholder. July session via Google Meet, links on the OSLC calendar. Additional sessions run through July 19.",
    venueName: "Virtual (Google Meet)",
    address: null,
    neighborhood: "Portland",
    lat: null,
    lng: null,
    dateStart: "2026-07-15T19:00:00",
    dateEnd: "2026-07-15T20:30:00",
    dayOfWeek: "WED",
    ageRequirement: "21_PLUS",
    eventTypes: JSON.stringify(["EDUCATION", "LEATHER", "COMMUNITY"]),
    admission: "FREE",
    ticketUrl: "https://www.oslcontest.org/calendar",
    isPublic: true,
    isPrivate: false,
    isHouseParty: false,
    isSexPositive: false,
    nudityOk: false,
    posterImageUrl: "/posters/oslc-titleholder-info-sessions.png",
    status: "LIVE",
    source: "admin_seeded",
    isClaimable: true,
    claimedBy: null,
    submittedBy: null,
    adminNotes: "From PDX PAH Barking Chain July 2026 newsletter. Wed Jul 15 7pm session.",
  });

  // Oregon State Leather Contest (Aug 7–9) intentionally not seeded - post-Pride week cap.
}

/** Camp Bar PDX full Pride Week 2026 schedule (Mon Jul 13 – Sun Jul 19).
 * Venue matches the "Camp Bar PDX" directory listing so events sync to it.
 * One color poster per day, per the venue's provided art. */
function seedCampBarPrideWeek2026Events() {
  const now = new Date().toISOString();
  const exists = sqlite.prepare("SELECT id FROM events WHERE title = ? LIMIT 1");
  const CAMP = {
    venueName: "Camp Bar PDX",
    address: "1125 SW Harvey Milk St",
    neighborhood: "Downtown",
    lat: 45.5193,
    lng: -122.6775,
    ageRequirement: "21_PLUS",
    admission: "FREE",
    ticketUrl: "https://campbarpdx.com",
    isPublic: true,
    isPrivate: false,
    isHouseParty: false,
    isSexPositive: false,
    nudityOk: false,
    status: "LIVE",
    source: "admin_seeded",
    isClaimable: true,
    claimedBy: null,
    submittedBy: null,
  };
  const insert = (row: Record<string, unknown>) => {
    if (exists.get(row.title)) return;
    db.insert(events).values({ ...CAMP, ...row, createdAt: now } as any).run();
  };

  insert({
    title: "CAMP Monday Happy Hour",
    description:
      "Start the week strong at CAMP! Happy Hour 4–7 PM with killer drinks and the best crew in PDX. Low-key vibes, high queer joy. Come as you are, your new Monday tradition starts here.",
    dateStart: "2026-07-13T16:00:00",
    dateEnd: "2026-07-13T19:00:00",
    dayOfWeek: "MON",
    eventTypes: JSON.stringify(["SOCIAL", "HAPPY HOUR", "DRINKS"]),
    posterImageUrl: "/posters/camp/camp-mon-yellow.jpg",
    adminNotes: "Camp Bar PDX Pride Week schedule (venue-provided). Yellow poster.",
  });

  insert({
    title: "CAMP Tuesday Happy Hour",
    description:
      "Tuesday Happy Hour at CAMP! 4–7 PM. Shake off the day with drink specials, good music, and even better company. Your mid-week reset in the heart of Portland's queer scene.",
    dateStart: "2026-07-14T16:00:00",
    dateEnd: "2026-07-14T19:00:00",
    dayOfWeek: "TUE",
    eventTypes: JSON.stringify(["SOCIAL", "HAPPY HOUR", "DRINKS"]),
    posterImageUrl: "/posters/camp/camp-tue-orange.jpg",
    adminNotes: "Camp Bar PDX Pride Week schedule (venue-provided). Orange poster.",
  });

  insert({
    title: "CAMP Happy Hour + Karaoke",
    description:
      "Hump Day just got loud! Happy Hour 4–7 PM, then Karaoke 8 PM–Midnight. Dust off those pipes, bring your friends, and belt it out with the CAMP crew. Sign-ups start early.",
    dateStart: "2026-07-15T16:00:00",
    dateEnd: "2026-07-16T00:00:00",
    dayOfWeek: "WED",
    eventTypes: JSON.stringify(["SOCIAL", "KARAOKE", "HAPPY HOUR"]),
    posterImageUrl: "/posters/camp/camp-wed-green.jpg",
    adminNotes: "Camp Bar PDX Pride Week schedule (venue-provided). Green poster.",
  });

  insert({
    title: "CAMP Happy Hour + Drag Bingo",
    description:
      "Drag Bingo night is HERE! Happy Hour 4–7 PM followed by Drag Bingo with the fabulous Peachy Springs 7–9 PM. Prizes, laughs, fierce looks, and all the Camp energy.",
    dateStart: "2026-07-16T16:00:00",
    dateEnd: "2026-07-16T21:00:00",
    dayOfWeek: "THU",
    eventTypes: JSON.stringify(["DRAG", "BINGO", "HAPPY HOUR", "SOCIAL"]),
    posterImageUrl: "/posters/camp/camp-thu-blue.jpg",
    adminNotes: "Camp Bar PDX Pride Week schedule (venue-provided). Drag Bingo w/ Peachy Springs. Blue poster.",
  });

  insert({
    title: "CAMP Pride Pre-Party + RuPaul's Finale",
    description:
      "Friday night fever at CAMP! Happy Hour 4–7 PM, then Tuff Pride Horsemeat Disco Pre-Party 7–9 PM plus a live watch of RuPaul's Drag Race All Stars Finale 8–9 PM. Dance, cheer, and get the Pride weekend started right.",
    dateStart: "2026-07-17T16:00:00",
    dateEnd: "2026-07-17T21:00:00",
    dayOfWeek: "FRI",
    eventTypes: JSON.stringify(["PARTY", "DANCE", "DRAG", "VIEWING"]),
    posterImageUrl: "/posters/camp/camp-fri-purple.jpg",
    adminNotes: "Camp Bar PDX Pride Week schedule (venue-provided). Tuff Pride x Horsemeat Disco pre-party + RPDR finale. Purple poster.",
  });

  insert({
    title: "CAMP Gaylabration Pre-Party",
    description:
      "Saturday Gaylabration Pre-Party! Happy Hour all day plus the main Pre-Party 7–9 PM. High-energy Pride celebration, come dance, laugh, and be your fabulous self at CAMP.",
    dateStart: "2026-07-18T14:00:00",
    dateEnd: "2026-07-18T21:00:00",
    dayOfWeek: "SAT",
    eventTypes: JSON.stringify(["PARTY", "DANCE", "PRIDE"]),
    posterImageUrl: "/posters/camp/camp-sat-pink.jpg",
    adminNotes: "Camp Bar PDX Pride Week schedule (venue-provided). Gaylabration pre-party. Pink poster.",
  });

  insert({
    title: "CAMP Sunday: World Cup + Camp House Tea",
    description:
      "Sunday Funday Pride Edition! World Cup Final watch party 12–3 PM (with a special Madonna / Shakira halftime show), Live DJ 2–5 PM, and Camp House Tea Pride Edition 4–8 PM. Football, tea, music, and community, the perfect way to wrap the week.",
    dateStart: "2026-07-19T12:00:00",
    dateEnd: "2026-07-19T20:00:00",
    dayOfWeek: "SUN",
    eventTypes: JSON.stringify(["SPORTS", "TEA DANCE", "DJ", "SOCIAL"]),
    posterImageUrl: "/posters/camp/camp-sun-cyan.jpg",
    adminNotes: "Camp Bar PDX Pride Week schedule (venue-provided). World Cup Final + Camp House Tea. Cyan poster.",
  });
}

/** Missing Pride Week 2026 listings sourced from WW / PDX Pipeline (see missing-pride-events.json). */
function seedMissingWweekPrideEvents2026() {
  const now = new Date().toISOString();
  const exists = sqlite.prepare("SELECT id FROM events WHERE title = ? LIMIT 1");
  const insert = (row: Record<string, unknown>) => {
    if (exists.get(row.title as string)) return;
    db.insert(events).values({ ...row, createdAt: now } as any).run();
  };

  insert({
    title: "Forest Pub: Drag as a Doorway to the Forest",
    description:
      "World Forestry Center and McMenamins present a Pride Week kickoff blending drag performance with nature-focused storytelling, featuring Efemmera Gendera and Thespis D. Light of Drag Me Outside.",
    venueName: "McMenamins Mission Theater",
    address: "1624 NW Glisan St, Portland, OR 97209",
    neighborhood: "Northwest District",
    lat: 45.5262294,
    lng: -122.6881319,
    dateStart: "2026-07-13T19:00:00",
    dateEnd: "2026-07-13T20:30:00",
    dayOfWeek: "MON",
    ageRequirement: "21_PLUS",
    eventTypes: JSON.stringify(["DRAG", "PERFORMANCE", "COMMUNITY"]),
    admission: "TICKETED",
    ticketUrl: "https://worldforestry.org/event/forest-pub-july-2026/",
    isPublic: true,
    isPrivate: false,
    isHouseParty: false,
    isSexPositive: false,
    nudityOk: false,
    posterImageUrl: "https://www.pdxpipeline.com/wp-content/uploads/2026/06/forestpub-drag-1.jpg",
    status: "LIVE",
    source: "admin_seeded",
    isClaimable: true,
    claimedBy: null,
    submittedBy: null,
    adminNotes: "From WW/PDX Pipeline missing-events pass. Source id forest-pub-drag-2026-07-13.",
  });

  insert({
    title: "Betty's Pride Weekend Party (feat. Uffie)",
    description:
      "Quarterly queer dance party Betty's throws its Pride weekend edition headlined by singer-songwriter and rapper Uffie.",
    venueName: "White Owl Social Club",
    address: "1305 SE 8th Ave, Portland, OR 97214",
    neighborhood: "Central Eastside",
    lat: 45.5134484,
    lng: -122.6579941,
    dateStart: "2026-07-17T20:00:00",
    dateEnd: "2026-07-18T02:00:00",
    dayOfWeek: "FRI",
    ageRequirement: "21_PLUS",
    eventTypes: JSON.stringify(["PARTY", "DJ", "LIVE-MUSIC"]),
    admission: "TICKETED",
    ticketUrl: "https://www.instagram.com/betty_pdx",
    isPublic: true,
    isPrivate: false,
    isHouseParty: false,
    isSexPositive: false,
    nudityOk: false,
    posterImageUrl: null,
    status: "LIVE",
    source: "admin_seeded",
    isClaimable: true,
    claimedBy: null,
    submittedBy: null,
    adminNotes: "From WW missing-events pass. End time estimated (source had no end). Source id bettys-pride-uffie-2026-07-17.",
  });

  insert({
    title: "Poison Waters' Pride Drag Brunch",
    description:
      "Portland drag treasure Poison Waters hosts a Pride brunch in the Ritz-Carlton grand ballroom with a cast including Alexis Mateo, Angel Darko, Jay Colby and Kharisma. Plated entree, brunch spread and two cocktails included.",
    venueName: "The Ritz-Carlton, Portland",
    address: "900 SW Washington St, Portland, OR 97205",
    neighborhood: "Downtown",
    lat: 45.5207884,
    lng: -122.6811143,
    dateStart: "2026-07-18T12:00:00",
    dateEnd: "2026-07-18T15:00:00",
    dayOfWeek: "SAT",
    ageRequirement: "21_PLUS",
    eventTypes: JSON.stringify(["DRAG", "BRUNCH", "PERFORMANCE"]),
    admission: "TICKETED",
    ticketUrl: "https://www.poisonwaters.com/calendar.aspx",
    isPublic: true,
    isPrivate: false,
    isHouseParty: false,
    isSexPositive: false,
    nudityOk: false,
    posterImageUrl: null,
    status: "LIVE",
    source: "admin_seeded",
    isClaimable: true,
    claimedBy: null,
    submittedBy: null,
    adminNotes: "From WW missing-events pass. End time estimated (source had no end). Source id poison-waters-pride-brunch-2026-07-18.",
  });

  insert({
    title: "Purple Rain - Queer Pop-Up Strip Club",
    description:
      "Queer pop-up strip club Purple Rain turns Buckman queer bar Peacock PDX (former Crush Bar) into an all-gender pole-dancing palace for Pride weekend.",
    venueName: "Peacock PDX",
    address: "1400 SE Morrison St, Portland, OR 97214",
    neighborhood: "Buckman",
    lat: 45.5170824,
    lng: -122.6514493,
    dateStart: "2026-07-18T21:00:00",
    dateEnd: "2026-07-19T02:00:00",
    dayOfWeek: "SAT",
    ageRequirement: "21_PLUS",
    eventTypes: JSON.stringify(["PARTY", "PERFORMANCE", "BURLESQUE"]),
    admission: "TICKETED",
    ticketUrl: "https://www.instagram.com/the_gay_barn",
    isPublic: true,
    isPrivate: false,
    isHouseParty: false,
    isSexPositive: true,
    nudityOk: true,
    posterImageUrl: null,
    status: "LIVE",
    source: "admin_seeded",
    isClaimable: true,
    claimedBy: null,
    submittedBy: null,
    adminNotes: "From WW missing-events pass. End time estimated (source had no end). Source id purple-rain-peacock-2026-07-18.",
  });

  insert({
    title: "Jay Colby's Drag Brunch at Bar Cala",
    description:
      "Weekly favorite drag brunch where top drag talent entertain diners over Bar Cala's Mexican brunch menu in the Alberta neighborhood; runs Pride Sundays.",
    venueName: "Bar Cala",
    address: "2703 NE Alberta St, Portland, OR 97211",
    neighborhood: "Alberta Arts District",
    lat: 45.5592402,
    lng: -122.6376982,
    dateStart: "2026-07-19T11:00:00",
    dateEnd: "2026-07-19T14:00:00",
    dayOfWeek: "SUN",
    ageRequirement: "ALL_AGES",
    eventTypes: JSON.stringify(["DRAG", "BRUNCH", "PERFORMANCE"]),
    admission: "TICKETED",
    ticketUrl: "https://www.instagram.com/brunchportland",
    isPublic: true,
    isPrivate: false,
    isHouseParty: false,
    isSexPositive: false,
    nudityOk: false,
    posterImageUrl: null,
    status: "LIVE",
    source: "admin_seeded",
    isClaimable: true,
    claimedBy: null,
    submittedBy: null,
    adminNotes: "From WW missing-events pass. Source listed 13+; mapped to ALL_AGES. End estimated. Source id jay-colby-drag-brunch-bar-cala-2026-07-19.",
  });

  insert({
    title: 'TWIRL: A PDX Queer Disco (Pride "Fruity" edition)',
    description:
      "Queer daytime disco Twirl's Pride edition, OG Disco, Nu Disco, House, Funk & Boogie, relocated for Pride weekend to inner Southeast as a landing pad across the river from the downtown festival.",
    venueName: "Redd on Salmon",
    address: "831 SE Salmon St, Portland, OR 97214",
    neighborhood: "Central Eastside",
    lat: 45.5144461,
    lng: -122.657341,
    dateStart: "2026-07-19T15:00:00",
    dateEnd: "2026-07-19T22:00:00",
    dayOfWeek: "SUN",
    ageRequirement: "21_PLUS",
    eventTypes: JSON.stringify(["PARTY", "DJ", "OUTDOOR"]),
    admission: "TICKETED",
    ticketUrl: "https://queersocialclub.com/events-portland/32y5kydsacaknwdl3nd6dflyztxjrw-6t2gf-hcs8f",
    isPublic: true,
    isPrivate: false,
    isHouseParty: false,
    isSexPositive: false,
    nudityOk: false,
    posterImageUrl:
      "https://images.squarespace-cdn.com/content/v1/62155dfcfc6583248de4ebac/1782530156718-02KF8GP96UHJWV5TI606/27574864_534294933619413_4115096810127622144_n.jpg",
    status: "LIVE",
    source: "admin_seeded",
    isClaimable: true,
    claimedBy: null,
    submittedBy: null,
    adminNotes:
      'From WW/Queer Social Club missing-events pass. Distinct from hidden 2025 "Twirl! PDX Queer Disco, Pride Edition (HOLD)". Source id twirl-pdx-queer-disco-2026-07-19.',
  });
}

/** Verified-only events from the Checking-Portland pass (unverified rows deleted). */
function seedCheckingPortlandEventsJuly2026() {
  const now = new Date().toISOString();
  const exists = sqlite.prepare("SELECT id FROM events WHERE title = ? LIMIT 1");
  const insert = (row: Record<string, unknown>) => {
    if (exists.get(row.title as string)) return;
    db.insert(events).values({ ...row, createdAt: now } as any).run();
  };

  const base = {
    isPublic: true,
    isPrivate: false,
    isHouseParty: false,
    status: "LIVE",
    source: "admin_seeded",
    isClaimable: true,
    claimedBy: null,
    submittedBy: null,
  };

  insert({
    ...base,
    title: "Trans-UHH-Licious",
    description:
      "Weekly residency dedicated to the trans community at CC Slaughters, local and regional trans talent, hosted by Sheniqua Volt. DJ ROBB, then DJ Lyta Blunt (hip-hop) until late. Pride Week Thursday edition. No cover.",
    venueName: "CC Slaughters",
    address: "219 NW Davis St, Portland, OR 97209",
    neighborhood: "Old Town",
    lat: 45.5246801,
    lng: -122.6729454,
    dateStart: "2026-07-16T21:00:00",
    dateEnd: "2026-07-17T02:00:00",
    dayOfWeek: "THU",
    ageRequirement: "21_PLUS",
    eventTypes: JSON.stringify(["DRAG", "TRANS", "PERFORMANCE", "NIGHTLIFE"]),
    admission: "FREE",
    ticketUrl: "https://ccslaughterspdx.com/",
    isSexPositive: false,
    nudityOk: false,
    posterImageUrl: null,
    adminNotes: "Verified via ccslaughterspdx.com weeklys. FREE weekly residency (not a ticketed special).",
  });

  insert({
    ...base,
    title: "Lavender Rain: Pride Edition (Queer Strip Club Pop-Up)",
    description:
      "The Gay Barn's queer strip club pop-up at Peacock PDX for Pride Weekend. Sliding-scale tickets $17–$28 (door tickets also available). For dykes, lesbians, and dyke-adjacent queers 21+; respectful allies welcome. POC discount codes via TheGayBarn@proton.me.",
    venueName: "Peacock PDX",
    address: "1400 SE Morrison St, Portland, OR 97214",
    neighborhood: "SE Portland",
    lat: 45.5170824,
    lng: -122.6514493,
    dateStart: "2026-07-18T21:00:00",
    dateEnd: "2026-07-19T01:00:00",
    dayOfWeek: "SAT",
    ageRequirement: "21_PLUS",
    eventTypes: JSON.stringify(["PERFORMANCE", "PARTY", "BURLESQUE"]),
    admission: "TICKETED",
    ticketUrl: "https://forbiddentickets.com/events/the-gay-barn/2026-07-18-lavender-rain-pride-edition",
    isSexPositive: true,
    nudityOk: true,
    posterImageUrl:
      "https://forbiddentickets.com/media/pages/events/the-gay-barn/96a1607597/a0f76a30e9-1779389095/lavender-rain-july.png",
    adminNotes:
      "Verified Forbidden Tickets + Gay Barn flyer (2026-07-18 9pm–1am).",
  });
}

/** Hard-delete events and dependent rows (attendance, hosts, messages, etc.). */
function hardDeleteEventIds(ids: number[]) {
  if (!ids.length) return;
  const idPh = ids.map(() => "?").join(",");
  sqlite.prepare(`DELETE FROM attendances WHERE event_id IN (${idPh})`).run(...ids);
  sqlite.prepare(`DELETE FROM event_hosts WHERE event_id IN (${idPh})`).run(...ids);
  sqlite.prepare(`DELETE FROM event_talent WHERE event_id IN (${idPh})`).run(...ids);
  try {
    sqlite.prepare(`DELETE FROM host_messages WHERE event_id IN (${idPh})`).run(...ids);
  } catch { /* table may not exist in older DBs */ }
  try {
    sqlite.prepare(`UPDATE missed_connections SET event_id = NULL WHERE event_id IN (${idPh})`).run(...ids);
  } catch { /* ignore */ }
  try {
    sqlite.prepare(`UPDATE submissions SET event_id = NULL WHERE event_id IN (${idPh})`).run(...ids);
  } catch { /* ignore */ }
  sqlite.prepare(`DELETE FROM events WHERE id IN (${idPh})`).run(...ids);
}

/**
 * Until Jul 19 2026 6pm Pacific: no live listings after Pride Sunday.
 * Runs every boot so seeds cannot revive post-Pride nights early.
 * After the unlock, this is a no-op - post-Pride events stay.
 * Multi-day events that spill past Jul 19 are clipped (not deleted) while locked.
 */
function prunePostPrideWeekEvents() {
  if (!isPostEventWeekListingCapActive()) return;

  // Anything whose start calendar day is after Jul 19 is hard-deleted.
  const byStart = sqlite
    .prepare(`SELECT id FROM events WHERE date_start >= '2026-07-20'`)
    .all() as Array<{ id: number }>;
  hardDeleteEventIds(byStart.map(r => r.id));

  // Clip multi-day spans so they do not expand onto Mon Jul 20+ (e.g. Midtown).
  // Overnight parties that end before noon Mon can keep early-morning end times
  // under Jul 20T - but festival-style ends on Mon afternoon get cut to Jul 19.
  const spanRows = sqlite
    .prepare(`
      SELECT id, date_end FROM events
      WHERE date_start < '2026-07-20'
        AND date_end >= '2026-07-20T12:00:00'
    `)
    .all() as Array<{ id: number; date_end: string }>;

  for (const row of spanRows) {
    const endClock = row.date_end.includes("T") ? row.date_end.split("T")[1] : "23:59:59";
    const newEnd = `2026-07-19T${endClock}`;
    // Avoid inverted ranges (start later on Sun than clipped Mon-afternoon clock).
    const startRow = sqlite
      .prepare(`SELECT date_start AS dateStart FROM events WHERE id = ?`)
      .get(row.id) as { dateStart: string } | undefined;
    if (startRow?.dateStart) {
      const startMs = new Date(startRow.dateStart).getTime();
      const endMs = new Date(newEnd).getTime();
      if (Number.isFinite(startMs) && Number.isFinite(endMs) && endMs <= startMs) {
        sqlite.prepare(`UPDATE events SET date_end = ? WHERE id = ?`).run("2026-07-19T23:59:59", row.id);
        continue;
      }
    }
    sqlite.prepare(`UPDATE events SET date_end = ? WHERE id = ?`).run(newEnd, row.id);
  }

  // Any remaining LIVE row with a post-Pride start (race / re-seed) is removed.
  sqlite
    .prepare(
      `UPDATE events SET status = 'REMOVED', admin_notes = COALESCE(admin_notes || ' | ', '') || 'Auto-removed: after Pride week end 2026-07-19 (locked until Jul 19 6pm PT)' WHERE date_start >= '2026-07-20' AND status != 'REMOVED'`,
    )
    .run();
}

/** No-op: post-Pride restores are intentionally dead so events stop reappearing. */
function restorePrunedPrideEvents() {
  /* intentionally empty - restore used to re-insert OSLC (Aug) + Midtown Mon hours */
}

/** Hard-delete unverified Checking-Portland batch rows (and Purple Rain duplicate). */
function deleteUnverifiedCheckingPortlandEvents() {
  const titles = [
    "Scandals PDX Pride Karaoke",
    "CC Slaughters GLOW: Trans-Uhh-Licious",
    "CC Slaughters GLOW: RuPaul's Drag Race Viewing + Bolivia Carmichaels",
    "CC Slaughters GLOW: Birdcage Matinee",
    "Red Cap Garage Pride BBQ",
    "Lavender Rain Afterparty",
    "QTBIPOC Pride Picnic",
    "CC Slaughters GLOW: Parade Day Viewing + Bloody Mary Bar",
    "Gaylabration Pool Party",
    "Pride Tea Dance: Silver Foxes",
    "Purple Rain, Queer Pop-Up Strip Club",
  ];
  const placeholders = titles.map(() => "?").join(",");
  const idRows = sqlite
    .prepare(`SELECT id FROM events WHERE title IN (${placeholders})`)
    .all(...titles) as Array<{ id: number }>;
  hardDeleteEventIds(idRows.map((r) => r.id));
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
      admin_notes = 'Hidden: unverified TBD placeholder - no 2026 Pride details on steamportland.com'
    WHERE title = 'Steam Portland Pride Weekend TBD'
  `).run();
  sqlite.prepare(`
    UPDATE events SET
      status = 'HIDDEN',
      admin_notes = 'Hidden: incorrect stub - Fri is AWOO at 835 N Lombard, Sat is Under Gear; not verified Eagle Pup Night'
    WHERE title = 'Eagle Portland Pup Night Pride Edition TBD'
  `).run();
  sqlite.prepare(`
    UPDATE events SET
      date_start = '2026-07-18T20:00:00',
      description = 'BOYeurism Pride Spectacular at Alberta Rose Theatre. Doors 7pm, show 8pm. Created by IZOHNNY, Isaiah Esquire and Johnny Nuriel.'
    WHERE title = 'BOYeurism: Pride Spectacular'
  `).run();
  sqlite.prepare(`
    UPDATE events SET admission = 'TICKETED'
    WHERE title = 'Gay Witch Appreciation Day + Pride at Seagrape'
  `).run();
  sqlite.prepare(`
    UPDATE events SET admission = 'DOOR_FEE'
    WHERE title = 'Stank Yes Coach - PDX PRIDE' AND admission = 'TICKETED'
  `).run();
  sqlite.prepare(`
    UPDATE events SET poster_image_url = '/posters/stag-pdx-drag-brunch-saturday.jpg'
    WHERE title = 'Portland Pride Drag Brunch at Stag PDX'
  `).run();
  sqlite.prepare(`
    UPDATE events SET poster_image_url = '/posters/stag-pdx-drag-brunch-sunday.jpg'
    WHERE title = 'Portland Pride Drag Brunch at Stag PDX - Sunday'
  `).run();
  sqlite.prepare(`
    UPDATE events SET poster_image_url = '/posters/divapalooza-5th-anniversary.jpg'
    WHERE title = 'DIVAPALOOZA 5th Anniversary'
  `).run();
  sqlite.prepare(`
    UPDATE events SET
      title = 'Pride in Demand - Portland Queer Takeover - Night 1',
      description = 'Night 1 of DotGay''s Pride in Demand Portland Queer Takeover at Star Theater. Queer superhero theme. Friday July 17, 2026 at 9pm.',
      poster_image_url = '/posters/pride-in-demand.jpg',
      status = 'LIVE',
      date_start = '2026-07-17T21:00:00',
      date_end = '2026-07-17T23:59:00',
      day_of_week = 'FRI'
    WHERE title IN (
      'Pride in Demand, Friday Night',
      'Pride in Demand, Portland Queer Takeover'
    )
      AND date_start LIKE '2026-07-17%'
  `).run();
  sqlite.prepare(`
    UPDATE events SET
      title = 'Pride in Demand - Portland Queer Takeover - Night 2',
      description = 'Night 2 of DotGay''s Pride in Demand Portland Queer Takeover at Star Theater. Queer superhero theme. Saturday July 18, 2026 at 9pm.',
      poster_image_url = CASE
        WHEN poster_image_url IS NULL OR poster_image_url LIKE '/placeholders/%'
        THEN '/posters/pride-in-demand.jpg'
        ELSE poster_image_url
      END
    WHERE title IN (
      'Pride in Demand, Portland Queer Takeover',
      'Pride in Demand, Portland Queer Takeover, Night 2'
    )
      AND date_start LIKE '2026-07-18%'
  `).run();
  sqlite.prepare(`
    UPDATE events SET
      status = 'HIDDEN',
      admin_notes = 'Duplicate Night 1 row - consolidated to single Friday listing'
    WHERE title = 'Pride in Demand - Portland Queer Takeover - Night 1'
      AND id NOT IN (
        SELECT MIN(id) FROM events
        WHERE title = 'Pride in Demand - Portland Queer Takeover - Night 1'
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

function seedBusinessesDirectory() {
  const existing = db.select().from(businesses).all();
  if (existing.length > 0) return;
  const now = new Date().toISOString();
  const entries = [
    // ── Bars & Clubs ──────────────────────────────────────────────────────
    { name: "CC Slaughters", type: "bar", description: "Portland's beloved LGBTQ+ nightclub since 1981. Dance floor, drag shows, themed nights, and a welcoming crowd in the heart of Old Town.", address: "219 NW Davis St", neighborhood: "Old Town", website: "https://ccslaughterspdx.com", instagram: "@ccslaughterspdx", queerOwned: true, queerFriendly: true },
    { name: "Darcelle XV Showplace", type: "venue", description: "The oldest continuously operating drag venue in the United States, founded in 1967. A Portland institution and landmark of LGBTQ+ history.", address: "208 NW 3rd Ave", neighborhood: "Old Town", website: "https://darcellexv.com", instagram: "@darcellexvshowplace", queerOwned: true, queerFriendly: true },
    { name: "Stag PDX", type: "bar", description: "Gay bar and lounge on Broadway in Old Town. Part of Portland's historic Burnside Triangle nightlife district.", address: "317 NW Broadway", neighborhood: "Old Town", website: null, instagram: "@stagpdx", queerOwned: true, queerFriendly: true },
    { name: "Badlands", type: "bar", description: "High-energy queer dance bar known for a diverse crowd, strong drinks, and a packed floor on weekend nights.", address: "208 NW Davis St", neighborhood: "Old Town", website: null, instagram: "@badlandspdx", queerOwned: true, queerFriendly: true },
    { name: "Eagle Portland", type: "bar", description: "Leather and bear bar on N Lombard serving the leather, fetish, and bear community with themed nights and a no-frills vibe.", address: "835 N Lombard St", neighborhood: "N Portland", website: null, instagram: "@eagleportland", queerOwned: true, queerFriendly: true },
    { name: "The Nest Lounge", type: "bar", description: "A queer sanctuary on SE Belmont, relaxed, inclusive dive bar beloved for its welcoming atmosphere and community feel.", address: "2715 SE Belmont St", neighborhood: "SE Belmont", website: null, instagram: "@nestloungepdx", queerOwned: true, queerFriendly: true },
    { name: "Silverado", type: "bar", description: "Long-running gay bar and club in Old Town. A staple of Portland's queer nightlife scene.", address: "318 SW 3rd Ave", neighborhood: "Old Town", website: null, instagram: null, queerOwned: true, queerFriendly: true },
    // ── Restaurants ───────────────────────────────────────────────────────
    { name: "Kann", type: "restaurant", description: "James Beard Award–winning wood-fired Haitian restaurant by Chef Gregory Gourdet. One of Portland's most celebrated dining destinations.", address: "548 SE Ankeny St", neighborhood: "SE Portland", website: "https://kannrestaurant.com", instagram: "@kannrestaurant", queerOwned: true, queerFriendly: true },
    { name: "The Sports Bra", type: "restaurant", description: "The first sports bar dedicated exclusively to women's sports, founded by Jenny Nguyen. A national phenomenon rooted in Portland.", address: "623 NE 21st Ave", neighborhood: "NE Portland", website: "https://thesportsbrabar.com", instagram: "@thesportsbrabar", queerOwned: true, queerFriendly: true },
    { name: "Mis Tacones", type: "restaurant", description: "100% vegan Chicano & queer-owned taqueria in NE Portland. Offers trans people of color free meals upon request. Community cornerstone.", address: "1670 NE Killingsworth St", neighborhood: "NE Portland", website: "https://mistaconespdx.com", instagram: "@mistaconespdx", queerOwned: true, queerFriendly: true },
    { name: "Taqueria Los Puñales", type: "restaurant", description: "Queer-owned taqueria specializing in soul-satisfying guisados made with a variety of proteins. Beloved neighborhood spot.", address: null, neighborhood: "Portland", website: null, instagram: null, queerOwned: true, queerFriendly: true },
    { name: "Friendship Kitchen", type: "restaurant", description: "Wife-and-wife owned Vietnamese restaurant serving Impossible egg rolls, shaken beef or tofu, pho, and lemongrass chicken skewers.", address: null, neighborhood: "Portland", website: null, instagram: null, queerOwned: true, queerFriendly: true },
    { name: "Chelo", type: "restaurant", description: "Chef Luna Contreras's vegetable-driven multifaceted Mexican fare inspired by street food. Shrimp-and-huitlacoche quesadillas, local mushroom empanadas.", address: null, neighborhood: "Portland", website: null, instagram: "@cheloportland", queerOwned: true, queerFriendly: true },
    // ── Cafes & Coffee ────────────────────────────────────────────────────
    { name: "Either/Or", type: "cafe", description: "Coffee bar known for creative coffee cocktails and zero-proof mocktails. A queer-friendly neighborhood cafe on N Williams (no longer queer-owned after a change in ownership).", address: "4003 N Williams Ave", neighborhood: "N Portland", website: "https://eitherorpdx.com", instagram: "@eitherorpdx", queerOwned: false, queerFriendly: true },
    { name: "Tin Shed Garden Cafe", type: "cafe", description: "Eco-friendly, dog-friendly breakfast and brunch cafe run by Christie Griffin and Janette Kaden since 2002. Featured on Food Network and in the New York Times.", address: "1438 NE Alberta St", neighborhood: "NE Alberta", website: null, instagram: "@tinshedgardencafe", queerOwned: true, queerFriendly: true },
    { name: "Speed-o Cappuccino", type: "cafe", description: "LGBTQ+, sex worker, and Latinx-owned coffee cart with espresso drinks, a vegan burger, and fruit tamales. Cheeky, community-rooted, and iconic.", address: null, neighborhood: "Portland", website: null, instagram: "@speedocappuccino", queerOwned: true, queerFriendly: true },
    { name: "Coffee Beer", type: "cafe", description: "Queer-owned vegan coffee shop run by artist Phillip Stewart. Vegan handhelds like Phatt Dawgs and Higher Taste burritos. Home to senior pug mascot A$AP Douglas.", address: null, neighborhood: "Portland", website: null, instagram: null, queerOwned: true, queerFriendly: true },
    // ── Wine Bars ─────────────────────────────────────────────────────────
    { name: "Living Room Wines", type: "bar", description: "Queer-owned wine bar and bottle shop on N Lombard. Small plates, free wine tastings on Wednesdays, drag bingo, live music, and queer socials.", address: "4818 N Lombard St", neighborhood: "N Portland", website: "https://livingroomwinespdx.com", instagram: "@livingroomwinespdx", queerOwned: true, queerFriendly: true },
    { name: "Stem Wine Bar", type: "bar", description: "Queer-owned wine bar offering tastings, wine flights, and weekend tarot readings. A cozy, intimate spot from the team behind Friendship Kitchen.", address: null, neighborhood: "Portland", website: null, instagram: null, queerOwned: true, queerFriendly: true },
    // ── Shops & Services ──────────────────────────────────────────────────
    { name: "Roots & Crowns", type: "shop", description: "Queer-owned apothecary in Portland's Slabtown neighborhood offering all-natural skincare, perfume, herbal remedies, and self-care items.", address: null, neighborhood: "Slabtown", website: null, instagram: "@rootsandcrownspdx", queerOwned: true, queerFriendly: true },
    { name: "Gold+Grit Barber Co.", type: "service", description: "All-inclusive two-chair barbershop in Slabtown run by Alaina and Nate. Everyone welcome, every style celebrated.", address: null, neighborhood: "Slabtown", website: null, instagram: "@goldandgritbarber", queerOwned: true, queerFriendly: true },
    { name: "Arium Botanicals", type: "shop", description: "Queer, Latinx, and vegan-owned houseplant shop in Northeast Portland. A lush, welcoming plant oasis run by Tyler Rogers and Anthony Sanchez.", address: null, neighborhood: "NE Portland", website: null, instagram: "@ariumbotanicals", queerOwned: true, queerFriendly: true },
  ];
  for (const entry of entries) {
    db.insert(businesses).values({ ...entry, active: true, createdAt: now } as any).run();
  }
}

let _demoUserIdCache: number | null | undefined;
function getDemoUserId(): number | null {
  if (_demoUserIdCache !== undefined) return _demoUserIdCache;
  const row = sqlite.prepare(`SELECT id FROM users WHERE username = 'hausing_demo'`).get() as { id: number } | undefined;
  _demoUserIdCache = row ? row.id : null;
  return _demoUserIdCache;
}

/** Demo posts for the Gigs, MIZZED CONNECTION, and Gifting boards. Old
    created_at so they sit BELOW real user posts in every recency-ordered board. */
function seedDemoBoardsContent() {
  const now = new Date().toISOString();
  const demoId = getOrCreateDemoUser(now);
  if (!demoId) return;
  const OLD = "2020-01-01T00:00:00.000Z"; // sinks demos below user posts
  const FUTURE = "2027-12-31T00:00:00.000Z";

  // GIGS (3)
  sqlite.prepare(`DELETE FROM gig_posts WHERE user_id = ?`).run(demoId);
  const gig = sqlite.prepare(
    `INSERT INTO gig_posts (post_type, title, name, contact_email, description, skills, compensation, location, is_remote, status, user_id, created_at)
     VALUES (?, ?, ?, 'demo@zaylist.local', ?, ?, ?, ?, 0, 'LIVE', ?, ?)`,
  );
  gig.run("POSTING_GIG", "Drag host for a monthly queer trivia night", "Jordan", "Looking for a charismatic host to run our monthly LGBTQ+ trivia. Bring the chaos and the puns.", "hosting, mic work", "$150/night", "SE Portland", demoId, OLD);
  gig.run("POSTING_GIG", "Photographer for a Pride afterparty", "Sam", "Need a photographer for a 4-hour evening event. Low light, high energy, lots of joy to capture.", "photography, editing", "$300 flat", "Downtown Portland", demoId, OLD);
  gig.run("LOOKING_FOR_WORK", "Experienced barback looking for weekend shifts", "Alex", "Five years behind the bar, reliable and fast. Available Fri to Sun, queer-owned spots preferred.", "bartending, POS, restocking", "Open to offers", "Portland", demoId, OLD);

  // MISSED CONNECTIONS (4, funny)
  sqlite.prepare(`DELETE FROM missed_connections WHERE user_id = ?`).run(demoId);
  const mc = sqlite.prepare(
    `INSERT INTO missed_connections (user_id, title, body, venue_hint, status, created_at, closes_at)
     VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?)`,
  );
  // venue_hint uses real directory brand names so Place modal MIZZED CONNECTION tabs attach.
  mc.run(demoId, "You: reading Judith Butler between sets", "Me: pretending I was only here for the drink special just to keep talking to you. You left with the theory and my whole heart.", "Sanctuary Club", OLD, FUTURE);
  mc.run(demoId, "Cutie who caught my keys on the patio", "You had a mustache, a tote full of kale, and reflexes like a cat. I said thanks. I meant marry me.", "Eagle Portland", OLD, FUTURE);
  mc.run(demoId, "You let my dog say hi outside the bar", "Rufus liked you more than he likes me. Honestly, fair. Drink sometime? He insists on chaperoning.", "CC Slaughters", OLD, FUTURE);
  mc.run(demoId, "You complimented my carabiner at karaoke", "It is not even holding keys, it is purely decorative, and so are my intentions. Duet me sometime?", "Badlands", OLD, FUTURE);
  try {
    sqlite.prepare(`UPDATE missed_connections SET admin_reviewed = 1 WHERE user_id = ?`).run(demoId);
  } catch {
    /* column may not exist in older DBs */
  }

  // GIFTING (3)
  sqlite.prepare(`DELETE FROM gifting_posts WHERE user_id = ?`).run(demoId);
  const gift = sqlite.prepare(
    `INSERT INTO gifting_posts (user_id, post_type, title, description, category, neighborhood, pickup_preference, photo_urls, status, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'OPEN', ?, ?)`,
  );
  gift.run(demoId, "GIFT", "Free moving boxes (about 20)", "Broken down and clean, all sizes. Great for a move. Porch pickup, first come first served.", "Household", "SE Portland", "Porch pickup", JSON.stringify(["/hausing/demo/gift-boxes.jpg"]), FUTURE, OLD);
  gift.run(demoId, "GIFT", "Gently used Pride flags and bunting", "Left over from last year and still bright. Would love them to go to someone who will fly them proud.", "Decor", "NE Portland", "Meet up nearby", JSON.stringify(["/hausing/demo/gift-flags.jpg"]), FUTURE, OLD);
  gift.run(demoId, "ISO", "ISO: a working mini fridge for a new place", "Just moved into a studio and could really use a small fridge. Can pick up anywhere in town, happy to trade baked goods.", "Appliances", "N Portland", "Can pick up", JSON.stringify(["/hausing/demo/gift-fridge.jpg"]), FUTURE, OLD);

  // SELLZ (3). Marked demo in the card chrome, with product photography so
  // the market board shows its intended populated state.
  sqlite.prepare(`DELETE FROM sellz_posts WHERE user_id = ?`).run(demoId);
  const sellz = sqlite.prepare(
    `INSERT INTO sellz_posts (user_id, title, description, category, condition, price_cents, negotiable, neighborhood, pickup_preference, photo_urls, status, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)`,
  );
  sellz.run(demoId, "Black leather harness, size M", "Clean and well cared for. Adjustable straps, worn a handful of times, and ready for a new night out.", "Leather and gear", "Like new", 4500, 1, "Inner SE", "Public meetup", JSON.stringify(["/sellz/demo/leather-harness.webp"]), FUTURE, OLD);
  sellz.run(demoId, "Pair of solid wood bar stools", "Two matching counter-height stools with a few honest scuffs. Stable, comfortable, and perfect for a small kitchen or home bar.", "Furniture", "Good", 6000, 1, "North Portland", "Porch pickup", JSON.stringify(["/sellz/demo/walnut-stools.webp"]), FUTURE, OLD);
  sellz.run(demoId, "Queer zine bundle, 12 issues", "A mixed stack of art, culture, and nightlife zines. Selling together, not splitting the set. Great reading for the porch or a gift.", "Collectibles", "Good", 2500, 0, "Buckman", "Event handoff", JSON.stringify(["/sellz/demo/queer-zines.webp"]), FUTURE, OLD);
}

function getOrCreateDemoUser(now: string): number | null {
  const existing = sqlite
    .prepare(`SELECT id FROM users WHERE username = 'hausing_demo'`)
    .get() as { id: number } | undefined;
  if (existing) {
    sqlite
      .prepare(`UPDATE users SET display_name = 'Rowan', photo_url = '/hausing/demo/person-looking.jpg' WHERE id = ?`)
      .run(existing.id);
    return existing.id;
  }
  try {
    const info = sqlite
      .prepare(
        `INSERT INTO users (username, email, password_hash, display_name, photo_url, pronouns, location, status, created_at)
         VALUES ('hausing_demo', 'demo@zaylist.local', '', 'Rowan', '/hausing/demo/person-looking.jpg', 'they/them', 'Portland, OR', 'active', ?)`,
      )
      .run(now);
    return Number(info.lastInsertRowid);
  } catch {
    return null;
  }
}

function seedHousingDemoPosts() {
  const now = new Date().toISOString();
  const demoId = getOrCreateDemoUser(now);
  if (!demoId) return; // could not create the demo account

  // Remove any prior DEMO posts (including an earlier version attributed to the
  // site owner) so this reseeds cleanly under the demo account.
  const priorIds = sqlite
    .prepare(`SELECT id FROM housing_posts WHERE user_id = ? OR name LIKE 'DEMO%' OR headline LIKE 'DEMO %'`)
    .all(demoId) as Array<{ id: number }>;
  for (const row of priorIds) {
    sqlite.prepare(`DELETE FROM housing_members WHERE post_id = ?`).run(row.id);
    sqlite.prepare(`DELETE FROM housing_posts WHERE id = ?`).run(row.id);
  }

  // Demo verified property manager for the MANAGED listing (owned by the demo user).
  let pmId: number | null = null;
  try {
    const existingPm = sqlite
      .prepare(`SELECT id FROM property_managers WHERE email = 'demo-pm@zaylist.local'`)
      .get() as { id: number } | undefined;
    if (existingPm) {
      pmId = existingPm.id;
      sqlite.prepare(`UPDATE property_managers SET user_id = ? WHERE id = ?`).run(demoId, pmId);
    } else {
      const pmInfo = sqlite
        .prepare(
          `INSERT INTO property_managers
             (user_id, name, email, company, password_hash, site_url, site_domain,
              status, verified_at, membership_status, first_month_free, founding_partner, created_at)
           VALUES (?, 'Demo Property Management', 'demo-pm@zaylist.local', 'Demo Property Management',
              '', 'https://demorentals.com', 'demorentals.com',
              'active', ?, 'active', 1, 0, ?)`,
        )
        .run(demoId, now, now);
      pmId = Number(pmInfo.lastInsertRowid);
    }
  } catch {
    pmId = null;
  }

  const insertPost = sqlite.prepare(`
    INSERT INTO housing_posts (
      user_id, type, name, headline, body, photo_urls, areas, tags,
      budget, move_timeline, living_style, open_to_haus,
      rent, rent_note, deposit, move_in, room_note, beds, baths, parking, outdoor, culture, access,
      flavor, seeking, is_full, goals, around_post_id,
      property_manager_id, source_url, source_domain, badges, last_seen_at,
      status, created_at, updated_at
    ) VALUES (
      @userId, @type, @name, @headline, @body, @photos, @areas, '[]',
      @budget, @moveTimeline, '[]', @openToHaus,
      @rent, NULL, NULL, @moveIn, NULL, @beds, @baths, @parking, @outdoor, '[]', '[]',
      @flavor, @seeking, 0, @goals, NULL,
      @pmId, @sourceUrl, @sourceDomain, @badges, @lastSeen,
      'ACTIVE', @now, @now
    )
  `);
  const insertMember = sqlite.prepare(
    `INSERT INTO housing_members (post_id, kind, user_id, name, photo_url, species, role, sort_order, created_at)
     VALUES (?, ?, NULL, ?, ?, ?, 'MEMBER', ?, ?)`,
  );

  // OFFERING a Room
  const offering = insertPost.run({
    userId: demoId, type: "OFFERING", name: "Sunnyside",
    headline: "Sunny room in a queer household off SE Division",
    body: "Bright room in a chill, queer-run house. We share meals sometimes, keep things low-key, and love a good porch hang. Come as you are.",
    photos: JSON.stringify(["/hausing/demo/room-offering.jpg"]), areas: JSON.stringify(["Southeast"]),
    budget: null, moveTimeline: null, openToHaus: 0,
    rent: "$900/mo", moveIn: "Flexible", beds: 3, baths: 1, parking: "STREET_ONLY", outdoor: "SHARED_YARD",
    flavor: null, seeking: 0, goals: null, pmId: null, sourceUrl: null, sourceDomain: null,
    badges: "[]", lastSeen: null, now,
  });
  const offeringId = Number(offering.lastInsertRowid);
  insertMember.run(offeringId, "OFFPLATFORM", "Devon", "/hausing/demo/av-1.jpg", null, 0, now);
  insertMember.run(offeringId, "OFFPLATFORM", "Sam", "/hausing/demo/av-2.jpg", null, 1, now);
  insertMember.run(offeringId, "PET", "Maple", "/hausing/demo/pet-dog.jpg", "dog", 2, now);

  // LOOKING for Housing
  insertPost.run({
    userId: demoId, type: "LOOKING", name: "",
    headline: "Nurse moving to Portland in August, looking for a room",
    body: "Relocating for a hospital job and hoping to land somewhere queer and welcoming. Clean, easygoing, love to cook for a house. Open to forming a HAÜS if the people are right.",
    photos: JSON.stringify(["/hausing/demo/looking-bg.jpg"]), areas: JSON.stringify(["North", "Northeast"]),
    budget: "$850/mo", moveTimeline: "Aug 1, some flex", openToHaus: 1,
    rent: null, moveIn: null, beds: null, baths: null, parking: null, outdoor: null,
    flavor: null, seeking: 0, goals: null, pmId: null, sourceUrl: null, sourceDomain: null,
    badges: "[]", lastSeen: null, now,
  });

  // FORMING a HAÜS
  const forming = insertPost.run({
    userId: demoId, type: "FORMING", name: "Wildrose",
    headline: "Building a queer household, looking for 2 more",
    body: "Two of us ready to sign a lease together and find a bigger place as a household. Looking for two more people who want chosen family, not just roommates.",
    photos: JSON.stringify(["/hausing/demo/room-forming.jpg"]), areas: JSON.stringify(["Southeast", "Northeast"]),
    budget: null, moveTimeline: null, openToHaus: 0,
    rent: null, moveIn: null, beds: null, baths: null, parking: null, outdoor: null,
    flavor: "FIND_TOGETHER", seeking: 2, goals: "3–4 bed by September", pmId: null, sourceUrl: null, sourceDomain: null,
    badges: "[]", lastSeen: null, now,
  });
  const formingId = Number(forming.lastInsertRowid);
  insertMember.run(formingId, "OFFPLATFORM", "Rae", "/hausing/demo/av-3.jpg", null, 0, now);
  insertMember.run(formingId, "OFFPLATFORM", "Nico", "/hausing/demo/av-4.jpg", null, 1, now);
  insertMember.run(formingId, "PET", "Nugget", "/hausing/demo/pet-beagle.jpg", "dog", 2, now);

  // MANAGED Property
  insertPost.run({
    userId: demoId, type: "MANAGED", name: "Rose City Flats",
    headline: "1 bed / 1 bath in NE Portland, available now",
    body: "Updated one-bedroom near Alberta with a private patio. Managed by a verified, affirming property team. Tour and apply on our site.",
    photos: JSON.stringify(["/hausing/demo/unit-managed.jpg"]), areas: JSON.stringify(["Northeast"]),
    budget: null, moveTimeline: null, openToHaus: 0,
    rent: "$1,450/mo", moveIn: "Now", beds: 1, baths: 1, parking: "OFF_STREET", outdoor: "PATIO_BALCONY",
    flavor: null, seeking: 0, goals: null, pmId,
    sourceUrl: "https://demorentals.com/listings/rose-city-flats", sourceDomain: "demorentals.com",
    badges: JSON.stringify(["ACCESSIBLE"]), lastSeen: now, now,
  });
}

function runBootMigrationsOnce() {
  ensureBootMigrationsTable();
  seedData();
  migrateGuideAdminMessagesOnce();
  if (!hasBootMigration("seed_ads_v1")) {
    seedAdsIfNeeded(sqlite);
    recordBootMigration("seed_ads_v1");
  }
  if (!hasBootMigration("seed_housing_demo_v1")) {
    // superseded by v2 (demo user + cleanup); keep the flag recorded, do nothing
    recordBootMigration("seed_housing_demo_v1");
  }
  if (!hasBootMigration("seed_housing_demo_v2")) {
    // superseded by v3 (real names + DEMO sticker); record and skip
    recordBootMigration("seed_housing_demo_v2");
  }
  if (!hasBootMigration("seed_housing_demo_v3")) {
    try {
      seedHousingDemoPosts();
    } catch (err) {
      console.warn("[boot] seed_housing_demo_v3 skipped:", err instanceof Error ? err.message : err);
    }
    recordBootMigration("seed_housing_demo_v3");
  }
  if (!hasBootMigration("seed_demo_boards_v1")) {
    recordBootMigration("seed_demo_boards_v1"); // superseded by v2 (gifting photos)
  }
  if (!hasBootMigration("seed_demo_boards_v2")) {
    try {
      seedDemoBoardsContent();
    } catch (err) {
      console.warn("[boot] seed_demo_boards_v2 skipped:", err instanceof Error ? err.message : err);
    }
    recordBootMigration("seed_demo_boards_v2");
  }
  // Re-seed demo missed connections onto real directory brands so Place modal
  // MIZZED CONNECTION tabs attach (v2 used freeform "laundromat / MAX" hints).
  if (!hasBootMigration("seed_demo_boards_mc_venues_v1")) {
    try {
      seedDemoBoardsContent();
    } catch (err) {
      console.warn("[boot] seed_demo_boards_mc_venues_v1 skipped:", err instanceof Error ? err.message : err);
    }
    recordBootMigration("seed_demo_boards_mc_venues_v1");
  }
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
        admin_notes = 'Duplicate Night 1 row - consolidated to single Friday listing'
      WHERE title = 'Pride in Demand - Portland Queer Takeover - Night 1'
        AND id NOT IN (
          SELECT MIN(id) FROM events
          WHERE title = 'Pride in Demand - Portland Queer Takeover - Night 1'
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
  if (!hasBootMigration("seed_businesses_directory_v1")) {
    seedBusinessesDirectory();
    recordBootMigration("seed_businesses_directory_v1");
  }
  if (!hasBootMigration("seed_businesses_directory_v2")) {
    const now = new Date().toISOString();
    const additions = [
      { name: "Pizza Thief", type: "restaurant", description: "Queer-owned thin crust New York-style pizza.", address: "2610 NW Vaughn St", neighborhood: "NW Portland", website: "https://pizzathief.com", instagram: "@pizzathiefpdx", queerOwned: true, queerFriendly: true },
    ];
    for (const entry of additions) {
      db.insert(businesses).values({ ...entry, active: true, createdAt: now } as any).run();
    }
    recordBootMigration("seed_businesses_directory_v2");
  }
  if (!hasBootMigration("seed_businesses_directory_v3")) {
    const now = new Date().toISOString();
    // Remove Chelo - closed Dec 19, 2025 after owner's arrest
    sqlite.prepare(`DELETE FROM businesses WHERE name = 'Chelo'`).run();
    // Fix CC Slaughters instagram (new ownership changed handle)
    sqlite.prepare(`UPDATE businesses SET instagram = '@slaughterspdx', website = 'https://ccslaughterspdx.com' WHERE name = 'CC Slaughters'`).run();
    // Fix Badlands address
    sqlite.prepare(`UPDATE businesses SET address = '110 NW Broadway', website = 'https://badlandsportland.com' WHERE name = 'Badlands'`).run();
    // Fix Silverado address
    sqlite.prepare(`UPDATE businesses SET address = '610 NW Couch St' WHERE name = 'Silverado'`).run();
    // Fix Kann address
    sqlite.prepare(`UPDATE businesses SET address = '548 SE Ash St' WHERE name = 'Kann'`).run();
    // Fix Sports Bra address
    sqlite.prepare(`UPDATE businesses SET address = '2512 NE Broadway', website = 'https://thesportsbraofficial.com' WHERE name = 'The Sports Bra'`).run();
    // Fix Either/Or instagram
    sqlite.prepare(`UPDATE businesses SET instagram = '@eitherorcafe' WHERE name = 'Either/Or'`).run();
    // Fill missing addresses
    sqlite.prepare(`UPDATE businesses SET address = '3312 SE Belmont St', website = 'https://lospunales.com' WHERE name = 'Taqueria Los Puñales'`).run();
    sqlite.prepare(`UPDATE businesses SET address = '2333 NE Glisan St', website = 'https://friendshipkitchenpdx.com', instagram = '@friendshipkitchen' WHERE name = 'Friendship Kitchen'`).run();
    sqlite.prepare(`UPDATE businesses SET address = '1015 SE Stark St' WHERE name = 'Speed-o Cappuccino'`).run();
    sqlite.prepare(`UPDATE businesses SET address = '4142 SE 42nd Ave', website = 'https://coffeebeer.me', instagram = '@coffeebeerme' WHERE name = 'Coffee Beer'`).run();
    sqlite.prepare(`UPDATE businesses SET address = '3920 N Mississippi Ave', website = 'https://stemwinebarpdx.com' WHERE name = 'Stem Wine Bar'`).run();
    sqlite.prepare(`UPDATE businesses SET address = '1812 NW 24th Ave', website = 'https://rootsandcrowns.com' WHERE name = 'Roots & Crowns'`).run();
    sqlite.prepare(`UPDATE businesses SET address = '2574 NW Thurman St', website = 'https://goldandgritbarberco.com', instagram = '@goldandgritbarberco' WHERE name = 'Gold+Grit Barber Co.'`).run();
    // Add new businesses
    const newEntries = [
      { name: "Peacock PDX", type: "bar", description: "Inclusive queer bar with karaoke, trivia, drag shows, and astrology-themed comedy nights.", address: "1400 SE Morrison St", neighborhood: "SE Portland", website: "https://peacockpdx.com", instagram: "@peacock.pdx", queerOwned: true, queerFriendly: true },
      { name: "Scandals East", type: "bar", description: "Portland's iconic gay bar, open since 1978, reopened in NE Alberta in March 2026. All-ages, dinner service, drag.", address: "827 NE Alberta St", neighborhood: "NE Alberta", website: "https://scandalspdx.com", instagram: "@scandals_pdx", queerOwned: true, queerFriendly: true },
      { name: "Honeyed Words", type: "shop", description: "Queer bookstore inside Sonny's House focused on trans joy and LGBTQ+ literature. Events include cozy reading hours and story fests.", address: "2504 NE Sandy Blvd", neighborhood: "NE Portland", website: null, instagram: "@honeyedwordspdx", queerOwned: true, queerFriendly: true },
    ];
    for (const entry of newEntries) {
      db.insert(businesses).values({ ...entry, active: true, createdAt: now } as any).run();
    }
    recordBootMigration("seed_businesses_directory_v3");
  }
  if (!hasBootMigration("seed_businesses_directory_v4")) {
    const now = new Date().toISOString();
    db.insert(businesses).values({
      name: "Camp Bar PDX",
      type: "bar",
      description:
        "Modern inclusive gay bar in downtown Portland's Gayborhood, taking over the historic former Scandals space on Harvey Milk Street. Grand opening July 11, 2026.",
      address: "1125 SW Harvey Milk St",
      neighborhood: "Downtown",
      website: "https://campbarpdx.com",
      instagram: "@campbarpdx",
      queerOwned: true,
      queerFriendly: true,
      isNew: true,
      grandOpeningDate: "2026-07-11",
      active: true,
      createdAt: now,
    } as any).run();
    recordBootMigration("seed_businesses_directory_v4");
  }
  if (!hasBootMigration("seed_businesses_directory_v5")) {
    const now = new Date().toISOString();
    sqlite.prepare(`UPDATE businesses SET queer_owned = 1 WHERE name = 'Peacock PDX'`).run();
    db.insert(businesses).values({
      name: "Ring Ding Ding",
      type: "bar",
      description: "Queer-friendly bar in SE Portland with Thai-influenced cocktails, playful decor, late nights, and rotating guest chef pop-ups. Opened May 2026 in the former Libre space.",
      address: "2601 SE Clinton St",
      neighborhood: "SE Portland",
      website: null,
      instagram: null,
      queerOwned: false,
      queerFriendly: true,
      isNew: false,
      active: true,
      createdAt: now,
    } as any).run();
    recordBootMigration("seed_businesses_directory_v5");
  }
  if (!hasBootMigration("seed_businesses_directory_v6")) {
    const updates: Array<{ name: string; lat?: number; lng?: number; hours?: string; phone?: string; instagram?: string }> = [
      { name: "CC Slaughters",        lat: 45.5236, lng: -122.6737, hours: "Mon–Sun 2pm–2:30am", phone: "(503) 248-9135" },
      { name: "Darcelle XV Showplace",lat: 45.5238, lng: -122.6743, hours: "Tue 6–9pm, Fri 7–10pm, Sat 7pm–12am, Sun 11:30am–2:30pm", phone: "(503) 222-5338" },
      { name: "Stag PDX",             lat: 45.5240, lng: -122.6755, hours: "Mon–Fri 7pm–2:30am, Sat 4pm–2:30am, Sun 7pm–2:30am", phone: "(503) 894-9679" },
      { name: "Badlands",             lat: 45.5236, lng: -122.6754, hours: "Mon–Fri 4pm–2am, Sat–Sun 2pm–2am", phone: "(503) 972-7572" },
      { name: "Silverado",            lat: 45.5224, lng: -122.6748, phone: "(503) 224-4493" },
      { name: "Camp Bar PDX",         lat: 45.5193, lng: -122.6775, instagram: "@campbarpdx" },
      { name: "Scandals East",        lat: 45.5614, lng: -122.6527, hours: "Daily 4pm–midnight", phone: "(971) 275-6494" },
      { name: "Eagle Portland",       lat: 45.5803, lng: -122.6856, phone: "(503) 283-9734" },
      { name: "The Nest Lounge",      lat: 45.5165, lng: -122.6432, hours: "Mon–Sun 3pm–2:30am", phone: "(503) 764-9023" },
      { name: "Living Room Wines",    lat: 45.5805, lng: -122.6857, hours: "Mon–Thu 3–9pm, Fri–Sat 3–10pm, Sun 3–8pm" },
      { name: "Peacock PDX",          lat: 45.5169, lng: -122.6490, hours: "Mon–Thu 3pm–12am, Fri–Sat 3pm–2am, Sun 3pm–12am", phone: "(503) 946-8929" },
      { name: "Stem Wine Bar",        lat: 45.5638, lng: -122.6785, hours: "Tue–Thu 5–9pm, Fri 3–10pm, Sat 1–10pm, Sun 1–9pm", phone: "(971) 427-8085" },
      { name: "Kann",                 lat: 45.5218, lng: -122.6569, hours: "Wed 4–7pm, Thu–Sat 4–9:30pm, Sun 4–7pm" },
      { name: "The Sports Bra",       lat: 45.5374, lng: -122.6354, hours: "Daily 11am–12am" },
      { name: "Mis Tacones",          lat: 45.5574, lng: -122.6623, hours: "Mon–Wed 3–9pm, Thu 12–9pm, Fri 12–10pm, Sat 10am–10pm, Sun 10am–8pm", phone: "(503) 444-7972" },
      { name: "Taqueria Los Puñales", lat: 45.5165, lng: -122.6432 },
      { name: "Friendship Kitchen",   lat: 45.5274, lng: -122.6391 },
      { name: "Either/Or",            lat: 45.5627, lng: -122.6658, hours: "Mon–Sun 8am–2pm" },
      { name: "Tin Shed Garden Cafe", lat: 45.5588, lng: -122.6478, hours: "Mon–Fri 8am–2pm, Sat–Sun 7am–3pm", phone: "(503) 288-6966" },
      { name: "Speed-o Cappuccino",   lat: 45.5176, lng: -122.6510 },
      { name: "Coffee Beer",          lat: 45.5026, lng: -122.6225, hours: "Mon–Fri 8am–10pm, Sat–Sun 8am–8pm", phone: "(503) 946-8029" },
      { name: "Roots & Crowns",       lat: 45.5374, lng: -122.6949, hours: "Mon 11am–3pm, Wed–Fri 11am–3pm, Sat 9am–2pm" },
      { name: "Arium Botanicals",     lat: 45.5485, lng: -122.6597, phone: "(503) 719-4763" },
      { name: "Gold+Grit Barber Co.", lat: 45.5374, lng: -122.6987 },
      { name: "Pizza Thief",          lat: 45.5374, lng: -122.6987 },
      { name: "Ring Ding Ding",       lat: 45.5049, lng: -122.6432 },
      { name: "Honeyed Words",        lat: 45.5327, lng: -122.6318, hours: "Thu–Fri 12–5pm, Sat–Sun 10am–5pm" },
    ];
    for (const u of updates) {
      const parts: string[] = [];
      if (u.lat !== undefined) parts.push(`lat = ${u.lat}`, `lng = ${u.lng}`);
      if (u.hours) parts.push(`hours = '${u.hours.replace(/'/g, "''")}'`);
      if (u.phone) parts.push(`phone = '${u.phone}'`);
      if (u.instagram) parts.push(`instagram = '${u.instagram.replace(/'/g, "''")}'`);
      if (parts.length) {
        sqlite.prepare(`UPDATE businesses SET ${parts.join(", ")} WHERE name = ?`).run(u.name);
      }
    }
    recordBootMigration("seed_businesses_directory_v6");
  }
  if (!hasBootMigration("seed_businesses_directory_v7")) {
    const now = new Date().toISOString();
    const venues = [
      { name: "Holocene", type: "venue", description: "Beloved Portland nightclub and event space in SE. Regularly hosts LGBTQ+ nights, drag shows, and Pride events.", address: "1001 SE Morrison St", neighborhood: "SE Portland", lat: 45.5173, lng: -122.6556, queerOwned: false, queerFri…75038 tokens truncated…g_date,
      gigTime: row.gig_time,
      businessId: row.business_id ?? null,
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
  rejectGigPost(id, reasonCode, note) {
    ensureGigPostsSchema();
    const row = sqlite.prepare(`SELECT id, title, user_id, status FROM gig_posts WHERE id = ?`).get(id) as
      | { id: number; title: string; user_id: number | null; status: string }
      | undefined;
    if (!row) return { error: "Post not found" };
    if (row.status === "REJECTED") return { error: "Already rejected" };
    const adminNotes = formatBoardRejectMessage(reasonCode, note);
    sqlite.prepare(`UPDATE gig_posts SET status = 'REJECTED', admin_notes = ? WHERE id = ?`).run(adminNotes, id);
    if (row.user_id) {
      notifyBoardReject(row.user_id, "Gig Work", row.title, reasonCode, note, {
        contextType: "GIG",
        contextId: id,
        contextLabel: row.title,
      });
    }
    return { ok: true };
  },
  rejectGiftingPost(id, reasonCode, note) {
    ensureGiftingPostsSchema();
    const post = this.getGiftingPost(id);
    if (!post) return { error: "Post not found" };
    if (post.status === "REJECTED") return { error: "Already rejected" };
    const adminNotes = formatBoardRejectMessage(reasonCode, note);
    db.update(giftingPosts).set({ status: "REJECTED", adminNotes } as any).where(eq(giftingPosts.id, id)).run();
    const userId = Number(post.user_id ?? post.userId);
    if (userId) {
      notifyBoardReject(userId, "GIFTZ", post.title, reasonCode, note, {
        contextType: "GIFTING",
        contextId: id,
        contextLabel: post.title,
      });
    }
    return { ok: true };
  },
  rejectMissedConnection(id, reasonCode, note) {
    const row = db.select().from(missedConnections).where(eq(missedConnections.id, id)).get();
    if (!row) return { error: "Post not found" };
    if (row.status === "REJECTED") return { error: "Already rejected" };
    const adminNotes = formatBoardRejectMessage(reasonCode, note);
    db.update(missedConnections).set({ status: "REJECTED", adminNotes } as any).where(eq(missedConnections.id, id)).run();
    notifyBoardReject(row.userId, "MIZZED CONNECTION", row.title, reasonCode, note, {
      contextType: "MISSED_CONNECTION",
      contextId: id,
      contextLabel: row.title,
    });
    return { ok: true };
  },
  approveMissedConnection(id) {
    const row = sqlite.prepare(`SELECT id FROM missed_connections WHERE id = ?`).get(id);
    if (!row) return { error: "Not found" };
    sqlite.prepare(`UPDATE missed_connections SET admin_reviewed = 1 WHERE id = ?`).run(id);
    return { ok: true };
  },
  removeMissedConnectionAdmin(id) {
    const row = sqlite.prepare(`SELECT id FROM missed_connections WHERE id = ?`).get(id);
    if (!row) return { error: "Not found" };
    sqlite.prepare(`UPDATE missed_connections SET status = 'DELETED' WHERE id = ?`).run(id);
    return { ok: true };
  },
  getAdminMissedConnections() {
    archiveExpiredMissedConnections();
    return sqlite.prepare(`
      SELECT
        m.id,
        m.title,
        m.body,
        m.day_of_week AS dayOfWeek,
        m.venue_hint AS venueHint,
        m.event_id AS eventId,
        m.status,
        m.admin_notes AS adminNotes,
        m.admin_reviewed AS adminReviewed,
        m.created_at AS createdAt,
        m.closes_at AS closesAt,
        m.user_id AS userId,
        u.username,
        u.display_name AS displayName,
        u.photo_url AS posterPhotoUrl,
        u.avatar_choice AS avatarChoice,
        u.avatar_ring AS posterAvatarRing,
        e.title AS eventTitle,
        e.venue_name AS eventVenue
      FROM missed_connections m
      JOIN users u ON u.id = m.user_id
      LEFT JOIN events e ON e.id = m.event_id
      WHERE m.status = 'ACTIVE'
        AND (m.admin_reviewed IS NULL OR m.admin_reviewed = 0)
      ORDER BY m.created_at DESC
    `).all();
  },
  getRecentlyReviewedMissedConnections() {
    archiveExpiredMissedConnections();
    const cutoff = recentQueueCutoffIso();
    return sqlite.prepare(`
      SELECT
        m.id,
        m.title,
        m.body,
        m.day_of_week AS dayOfWeek,
        m.venue_hint AS venueHint,
        m.event_id AS eventId,
        m.status,
        m.admin_notes AS adminNotes,
        m.admin_reviewed AS adminReviewed,
        m.created_at AS createdAt,
        m.closes_at AS closesAt,
        m.user_id AS userId,
        u.username,
        u.display_name AS displayName,
        u.photo_url AS posterPhotoUrl,
        u.avatar_choice AS avatarChoice,
        u.avatar_ring AS posterAvatarRing,
        e.title AS eventTitle,
        e.venue_name AS eventVenue
      FROM missed_connections m
      JOIN users u ON u.id = m.user_id
      LEFT JOIN events e ON e.id = m.event_id
      WHERE m.created_at >= ?
        AND (
          m.admin_reviewed = 1
          OR m.status IN ('REJECTED', 'DELETED')
        )
      ORDER BY m.created_at DESC
      LIMIT 60
    `).all(cutoff);
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
  isPrimarySiteOwner(user) {
    return isPrimarySiteOwner(user);
  },
  isOwnerAdminPeer(user) {
    return isOwnerAdminPeer(user);
  },
  hasOwnerAdminAccess(user) {
    return hasOwnerAdminAccess(user);
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
  countAdminGiftingFlagged() {
    const terminal = new Set(["REJECTED", "REMOVED", "GIFTED", "FOUND", "EXPIRED"]);
    return storage.getGiftingPosts({ includeInactive: true })
      .filter((p: any) => !terminal.has(String(p.status || "").toUpperCase()) && Number(p.reportCount || 0) > 0)
      .length;
  },
  getAdminQueueBreakdown() {
    // Must match shared Admin · Queue buckets (QueueView mode="admin").
    // Logos are Owner desk only - not in shared total.
    // Guide-admin DMs are under Admin · Inbox (guideUnread), not total.
    const submissions = this.getSubmissions("PENDING")
      .filter((s) => s.type !== "PROMOTER_APPLICATION").length;
    const moderation = this.getModerationRequests("PENDING").length;
    const promoters = this.getPendingPromoterRequests().length;
    const giftingReports = this.getGiftingReports("PENDING").length;
    const giftingFlagged = this.countAdminGiftingFlagged();
    const businessClaims = this.getPendingBusinessClaims().length;
    const businessSubmissions = this.getPendingBusinessSubmissions().length;
    const logoRequests = this.getPendingBusinessLogoRequests().length;
    const missedConnections = this.getAdminMissedConnections().length;
    const riverBrats = this.getRiverBratsReports("PENDING").length;
    // Gig Work queue: posts held for review (pending / auto-held).
    const pendingGigs = this.getGigPosts().filter(
      (g) => String(g.status || "").toUpperCase() === "PENDING",
    ).length;
    const total =
      submissions
      + moderation
      + promoters
      + giftingReports
      + giftingFlagged
      + businessClaims
      + businessSubmissions
      + missedConnections
      + riverBrats
      + pendingGigs;
    return {
      total,
      submissions,
      moderation,
      promoters,
      businessClaims,
      businessSubmissions,
      /** Owner desk only - not part of shared `total`. */
      logoRequests,
      giftingReports,
      giftingFlagged,
      missedConnections,
      riverBrats,
      pendingGigs,
      guideUnread: storage.getGuideAdminUnreadCount(),
    };
  },
  getAdminPendingCount() {
    return storage.getAdminQueueBreakdown().total;
  },
  logAdminAction(input) {
    ensureAdminActionLogSchema();
    const action = String(input.action || "").trim().slice(0, 80);
    if (!action) return;
    try {
      sqlite.prepare(`
        INSERT INTO admin_action_log (
          actor_user_id, actor_username, action, target_type, target_id, target_label, detail, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        input.actorUserId ?? null,
        (input.actorUsername || null) && String(input.actorUsername).slice(0, 64),
        action,
        input.targetType ? String(input.targetType).slice(0, 40) : null,
        input.targetId != null ? String(input.targetId).slice(0, 80) : null,
        input.targetLabel ? String(input.targetLabel).slice(0, 200) : null,
        input.detail ? JSON.stringify(input.detail).slice(0, 4000) : null,
        new Date().toISOString(),
      );
    } catch (err) {
      console.warn("[admin_action_log] insert failed:", err);
    }
  },
  getAdminActionLog(limit = 80) {
    ensureAdminActionLogSchema();
    const take = Math.min(Math.max(Number(limit) || 80, 1), 200);
    const rows = sqlite.prepare(`
      SELECT id, actor_user_id AS actorUserId, actor_username AS actorUsername,
             action, target_type AS targetType, target_id AS targetId,
             target_label AS targetLabel, detail, created_at AS createdAt
      FROM admin_action_log
      ORDER BY id DESC
      LIMIT ?
    `).all(take) as Array<Record<string, unknown>>;
    return rows.map((r) => {
      let detail: Record<string, unknown> | null = null;
      if (r.detail) {
        try {
          detail = JSON.parse(String(r.detail));
        } catch {
          detail = { raw: String(r.detail) };
        }
      }
      return {
        id: Number(r.id),
        actorUserId: r.actorUserId != null ? Number(r.actorUserId) : null,
        actorUsername: (r.actorUsername as string) || null,
        action: String(r.action || ""),
        targetType: (r.targetType as string) || null,
        targetId: (r.targetId as string) || null,
        targetLabel: (r.targetLabel as string) || null,
        detail,
        createdAt: String(r.createdAt || ""),
      };
    });
  },
  /**
   * Unified admin search across users, live events, and pending queue subjects.
   * Powers hub global search → route into floating inbox or admin tabs.
   */
  adminGlobalSearch(rawQuery, limit = 20) {
    const q = String(rawQuery || "").trim().toLowerCase().replace(/^@+/, "");
    if (!q || q.length < 2) {
      return { users: [], events: [], queue: [] as Array<{ kind: string; id: number; title: string; meta: string }> };
    }
    const take = Math.min(Math.max(Number(limit) || 20, 1), 40);

    const allUsers = (storage.getAllUsers ? storage.getAllUsers() : []) as User[];
    const users = allUsers
      .filter((u) => {
        if (storage.isGuideAdminUserId(u.id)) return false;
        if (u.status !== "active") return false;
        const uname = String(u.username || "").toLowerCase();
        const email = String(u.email || "").toLowerCase();
        const display = String(u.displayName || "").toLowerCase();
        return uname.includes(q) || email.includes(q) || display.includes(q);
      })
      .slice(0, take)
      .map((u) => ({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        email: u.email,
        promoterStatus: (u as any).promoterStatus || "none",
      }));

    const events = (sqlite.prepare(`
      SELECT id, title, venue_name AS venueName, status, date_start AS dateStart
      FROM events
      WHERE status IN ('LIVE', 'HIDDEN')
        AND (
          LOWER(title) LIKE ?
          OR LOWER(COALESCE(venue_name, '')) LIKE ?
          OR CAST(id AS TEXT) = ?
        )
      ORDER BY
        CASE status WHEN 'LIVE' THEN 0 ELSE 1 END,
        date_start DESC
      LIMIT ?
    `).all(`%${q}%`, `%${q}%`, q, take) as Array<Record<string, unknown>>).map((e) => ({
      id: Number(e.id),
      title: String(e.title || ""),
      venueName: (e.venueName as string) || null,
      status: String(e.status || ""),
      dateStart: (e.dateStart as string) || null,
    }));

    const queue: Array<{ kind: string; id: number; title: string; meta: string }> = [];
    for (const s of storage.getSubmissions("PENDING").slice(0, 80)) {
      const hay = `${s.title} ${s.submitterEmail} ${s.venueName || ""}`.toLowerCase();
      if (!hay.includes(q)) continue;
      queue.push({
        kind: "submission",
        id: s.id,
        title: s.title || "Submission",
        meta: `${s.type} · ${s.submitterEmail || "unknown"}`,
      });
      if (queue.length >= take) break;
    }
    if (queue.length < take) {
      for (const p of storage.getPendingPromoterRequests().slice(0, 40)) {
        const hay = `${p.username || ""} ${p.displayName || ""} ${p.email || ""}`.toLowerCase();
        if (!hay.includes(q)) continue;
        queue.push({
          kind: "promoter",
          id: p.id,
          title: p.displayName || p.username || "Promoter request",
          meta: `@${p.username || "?"} · promoter request`,
        });
        if (queue.length >= take) break;
      }
    }

    return { users, events, queue };
  },
  markGuideAdminInboxRead() {
    const guide = resolveGuideAdminUser();
    if (!guide) return 0;
    const result = sqlite.prepare(`
      UPDATE messages SET is_read = 1
      WHERE to_user_id = ? AND is_read = 0 AND deleted_by_to = 0
    `).run(guide.id);
    return result.changes || 0;
  },
  softDeleteGuideAdminThread(threadId: string) {
    const guide = resolveGuideAdminUser();
    if (!guide) return 0;
    return storage.softDeleteThread(threadId, guide.id);
  },
  isSystemGuideAccount(user: { id?: number | null; username?: string | null; email?: string | null } | null | undefined): boolean {
    if (!user) return false;
    if (user.id != null && storage.isGuideAdminUserId(user.id)) return true;
    const uname = String(user.username || "").trim().toLowerCase().replace(/^@/, "");
    const email = String(user.email || "").trim().toLowerCase();
    if (email === GUIDE_ADMIN_EMAIL) return true;
    // prideguidepdx (live mailbox) + zaylist (reserved brand handle) + any GUIDE_SYSTEM_USERNAMES
    if (uname === GUIDE_ADMIN_USERNAME || isGuideSystemUsername(uname)) return true;
    return false;
  },
  hasSiteAdminGrant(userId) {
    return !!sqlite.prepare("SELECT 1 FROM site_admin_grants WHERE user_id = ?").get(userId);
  },
  userIsSiteAdmin(user) {
    if (!user) return false;
    if (user.subAdmin) return true;
    if (isEnvListedSiteAdmin(user)) return true;
    if (user.id != null && storage.hasSiteAdminGrant(user.id)) return true;
    // Owner peers (e.g. brohoejams) get full admin access without a separate grant.
    if (hasOwnerAdminAccess(user)) return true;
    return false;
  },
  countContentLikes(contentType, contentId) {
    ensureContentLikesSchema();
    const type = String(contentType || "").toUpperCase();
    if (!(CONTENT_LIKE_TYPES as readonly string[]).includes(type)) return 0;
    const row = sqlite.prepare(`
      SELECT COUNT(*) AS cnt FROM content_likes WHERE content_type = ? AND content_id = ? AND value = 1
    `).get(type, contentId) as { cnt: number } | undefined;
    return Number(row?.cnt) || 0;
  },
  hasContentLike(contentType, contentId, userId) {
    ensureContentLikesSchema();
    const type = String(contentType || "").toUpperCase();
    if (!(CONTENT_LIKE_TYPES as readonly string[]).includes(type)) return false;
    return !!sqlite.prepare(`
      SELECT 1 FROM content_likes WHERE content_type = ? AND content_id = ? AND user_id = ? AND value = 1
    `).get(type, contentId, userId);
  },
  toggleContentLike(contentType, contentId, userId) {
    ensureContentLikesSchema();
    const type = String(contentType || "").toUpperCase() as ContentLikeType;
    if (!(CONTENT_LIKE_TYPES as readonly string[]).includes(type)) {
      return { liked: false, likes: 0, error: "Invalid content type" };
    }
    const id = Number(contentId);
    if (!Number.isFinite(id) || id <= 0) {
      return { liked: false, likes: 0, error: "Invalid content id" };
    }

    if (!contentIsPubliclyEngagable(type, id)) {
      return { liked: false, likes: 0, error: "Not found" };
    }

    const existing = sqlite.prepare(`
      SELECT value FROM content_likes WHERE content_type = ? AND content_id = ? AND user_id = ?
    `).get(type, id, userId) as { value: number } | undefined;
    const already = existing?.value === 1;
    if (already) {
      sqlite.prepare(`
        DELETE FROM content_likes WHERE content_type = ? AND content_id = ? AND user_id = ?
      `).run(type, id, userId);
    } else {
      sqlite.prepare(`
        INSERT INTO content_likes (content_type, content_id, user_id, value, created_at)
        VALUES (?, ?, ?, 1, ?)
        ON CONFLICT(content_type, content_id, user_id)
        DO UPDATE SET value = 1, created_at = excluded.created_at
      `).run(type, id, userId, new Date().toISOString());
    }
    const likes = storage.countContentLikes(type, id);
    return { liked: !already, likes };
  },
  getHubPostVoteMeta(contentId, viewerUserId) {
    return hubPostVoteMeta(contentId, viewerUserId);
  },
  voteOnHubPost(contentId, userId, value) {
    ensureContentLikesSchema();
    const id = Number(contentId);
    if (!Number.isInteger(id) || id <= 0 || ![-1, 0, 1].includes(value)) {
      return { score: 0, viewerVote: 0, authorKarma: 0, error: "Invalid vote" };
    }
    if (!contentIsPubliclyEngagable("HUB", id)) {
      return { score: 0, viewerVote: 0, authorKarma: 0, error: "Not found" };
    }
    const stamp = new Date().toISOString();
    if (value === 0) {
      sqlite.prepare(`
        DELETE FROM content_likes
        WHERE content_type = 'HUB' AND content_id = ? AND user_id = ?
      `).run(id, userId);
    } else {
      sqlite.prepare(`
        INSERT INTO content_likes (content_type, content_id, user_id, value, created_at)
        VALUES ('HUB', ?, ?, ?, ?)
        ON CONFLICT(content_type, content_id, user_id)
        DO UPDATE SET value = excluded.value, created_at = excluded.created_at
      `).run(id, userId, value, stamp);
    }
    const post = sqlite.prepare(`SELECT user_id AS userId FROM hub_feed_posts WHERE id = ?`).get(id) as { userId: number };
    return {
      ...hubPostVoteMeta(id, userId),
      authorKarma: hubPostKarmaForUser(post.userId),
    };
  },
  getHubPostKarmaForUser(userId) {
    return hubPostKarmaForUser(userId);
  },
  countContentReplies(contentType, contentId) {
    ensureContentRepliesSchema();
    const type = String(contentType || "").toUpperCase();
    if (!(CONTENT_REPLY_THREAD_TYPES as readonly string[]).includes(type)) return 0;
    const id = Number(contentId);
    if (!Number.isFinite(id) || id <= 0) return 0;
    const row = sqlite.prepare(`
      SELECT COUNT(*) AS cnt FROM content_replies WHERE content_type = ? AND content_id = ?
    `).get(type, id) as { cnt: number } | undefined;
    return Number(row?.cnt) || 0;
  },
  listContentReplies(contentType, contentId, limit = 20) {
    ensureContentRepliesSchema();
    const type = String(contentType || "").toUpperCase();
    if (!(CONTENT_REPLY_THREAD_TYPES as readonly string[]).includes(type)) return [];
    const id = Number(contentId);
    if (!Number.isFinite(id) || id <= 0) return [];
    const take = Math.min(Math.max(Number(limit) || 20, 1), 50);
    const rows = sqlite.prepare(`
      SELECT r.id, r.body, r.created_at AS createdAt,
             u.username AS username,
             u.display_name AS displayName,
             u.photo_url AS photoUrl,
             u.avatar_choice AS avatarChoice,
             u.avatar_ring AS avatarRing
      FROM content_replies r
      JOIN users u ON u.id = r.user_id
      WHERE r.content_type = ? AND r.content_id = ?
        AND u.status = 'active'
      ORDER BY r.created_at DESC, r.id DESC
      LIMIT ?
    `).all(type, id, take) as Array<{
      id: number;
      body: string;
      createdAt: string;
      username: string;
      displayName: string | null;
      photoUrl: string | null;
      avatarChoice: number | null;
      avatarRing: string | null;
    }>;
    // Newest first in SQL; reverse so thread reads oldest → newest in the UI.
    return rows.reverse().map(r => ({
      id: r.id,
      body: r.body,
      createdAt: r.createdAt,
      author: {
        username: r.username,
        displayName: r.displayName ?? null,
        photoUrl: r.photoUrl ?? null,
        avatarChoice: r.avatarChoice ?? 1,
        avatarRing: r.avatarRing || "none",
      },
    }));
  },
  createContentReply(contentType, contentId, userId, body) {
    ensureContentRepliesSchema();
    const type = String(contentType || "").toUpperCase();
    if (!(CONTENT_REPLY_THREAD_TYPES as readonly string[]).includes(type)) {
      return { error: "Replies for this board use the native flow" };
    }
    const id = Number(contentId);
    if (!Number.isFinite(id) || id <= 0) return { error: "Invalid content id" };
    if (!contentIsPubliclyEngagable(type, id)) return { error: "Not found" };

    const text = String(body || "").trim().slice(0, 500);
    if (!text) return { error: "body required" };

    const author = storage.getUserById(userId);
    if (!author || author.status !== "active") return { error: "Not found" };

    const createdAt = new Date().toISOString();
    const result = sqlite.prepare(`
      INSERT INTO content_replies (content_type, content_id, user_id, body, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(type, id, userId, text, createdAt);
    const replyId = Number(result.lastInsertRowid);
    const replies = storage.countContentReplies(type, id);
    return {
      reply: {
        id: replyId,
        body: text,
        createdAt,
        author: {
          username: author.username,
          displayName: author.displayName ?? null,
          photoUrl: author.photoUrl ?? null,
          avatarChoice: author.avatarChoice ?? 1,
          avatarRing: author.avatarRing || "none",
        },
      },
      replies,
    };
  },
  getContentReplyMeta(contentType, contentId) {
    const type = String(contentType || "").toUpperCase();
    const id = Number(contentId);
    if (!(CONTENT_REPLY_TYPES as readonly string[]).includes(type)) {
      return { count: 0, mode: "thread" as const, nativeHref: null, error: "Invalid content type" };
    }
    if (!Number.isFinite(id) || id <= 0) {
      return { count: 0, mode: "thread" as const, nativeHref: null, error: "Invalid content id" };
    }
    if (!contentIsPubliclyEngagable(type, id)) {
      return { count: 0, mode: "thread" as const, nativeHref: null, error: "Not found" };
    }
    if (type === "GIG" || type === "HUB") {
      return {
        count: storage.countContentReplies(type, id),
        mode: "thread" as const,
        nativeHref: null,
      };
    }
    if (type === "SPOTTED") {
      // Private missed-connection DMs: count only, never bodies.
      const row = sqlite.prepare(`
        SELECT COUNT(*) AS cnt FROM missed_connection_threads WHERE missed_connection_id = ?
      `).get(id) as { cnt: number } | undefined;
      return {
        count: Number(row?.cnt) || 0,
        mode: "native" as const,
        nativeHref: "/spotted",
      };
    }
    // GIFTING: interest counts are not public reply bodies.
    const row = sqlite.prepare(`
      SELECT COUNT(*) AS cnt FROM gifting_interests
      WHERE post_id = ? AND status IN ('INTERESTED', 'SELECTED')
    `).get(id) as { cnt: number } | undefined;
    return {
      count: Number(row?.cnt) || 0,
      mode: "native" as const,
      nativeHref: `/gifting?post=${id}`,
    };
  },
  ensureSiteAdminGrant(userId, grantedByUserId, note = null, createdAt = new Date().toISOString()) {
    sqlite.prepare(`
      INSERT INTO site_admin_grants (user_id, granted_by_user_id, note, created_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id) DO NOTHING
    `).run(userId, grantedByUserId, note, createdAt);
  },
  listSiteAdmins() {
    ensureAdminActionLogSchema();
    const seen = new Set<number>();
    const admins: Array<{
      userId: number;
      username: string;
      email: string;
      displayName: string | null;
      photoUrl: string | null;
      avatarChoice: number;
      avatarRing: string;
      source: "env" | "granted";
      protected: boolean;
      grantedAt: string;
      grantedByUsername: string | null;
      note: string | null;
      lastActivityAt: string | null;
      lastActivityLabel: string | null;
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
        photoUrl: user.photoUrl ?? null,
        avatarChoice: user.avatarChoice ?? 1,
        avatarRing: user.avatarRing || "none",
        source: protectedAdmin ? "env" : source,
        protected: protectedAdmin,
        grantedAt: grantRow?.created_at || user.createdAt,
        grantedByUsername: grantedBy?.username || null,
        note: grantRow?.note || null,
        lastActivityAt: null,
        lastActivityLabel: null,
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

    // Last admin / promoter activity for the team roster (one line each).
    const humanize = (action: string) => {
      const map: Record<string, string> = {
        approve_submission: "Approved a submission",
        reject_submission: "Rejected a submission",
        approve_promoter: "Approved a promoter",
        deny_promoter: "Denied a promoter",
        approve_business_claim: "Approved a venue claim",
        deny_business_claim: "Denied a venue claim",
        approve_business_submission: "Approved a new venue",
        deny_business_submission: "Denied a new venue",
        approve_logo: "Approved a logo",
        deny_logo: "Denied a logo",
        queue_claim: "Claimed a queue item",
        queue_takeover: "Took over a queue item",
        queue_release: "Released a queue claim",
        assign_host: "Assigned an event host",
        guide_reply: "Replied as guide",
        admin_message: "Sent a guide message",
        resolve_moderation: "Resolved moderation",
        reject_gifting: "Rejected GIFTZ post",
        resolve_gifting_report: "Resolved GIFTZ report",
        gig_status: "Updated a gig",
        reject_gig: "Rejected a gig",
      };
      return map[action] || action.replace(/_/g, " ");
    };

    for (const admin of admins) {
      const candidates: Array<{ at: string; label: string }> = [];
      try {
        const action = sqlite.prepare(`
          SELECT action, created_at AS createdAt
          FROM admin_action_log
          WHERE actor_user_id = ?
          ORDER BY id DESC
          LIMIT 1
        `).get(admin.userId) as { action: string; createdAt: string } | undefined;
        if (action?.createdAt) {
          candidates.push({ at: action.createdAt, label: humanize(String(action.action || "")) });
        }
      } catch {
        /* log table may be empty on fresh DBs */
      }
      try {
        const claim = sqlite.prepare(`
          SELECT queue_kind AS queueKind, claimed_at AS claimedAt
          FROM admin_queue_claims
          WHERE assignee_user_id = ?
          ORDER BY claimed_at DESC
          LIMIT 1
        `).get(admin.userId) as { queueKind: string; claimedAt: string } | undefined;
        if (claim?.claimedAt) {
          candidates.push({
            at: claim.claimedAt,
            label: `Holding queue: ${String(claim.queueKind || "item").replace(/_/g, " ")}`,
          });
        }
      } catch {
        /* queue claims table may not exist yet */
      }
      try {
        const host = sqlite.prepare(`
          SELECT created_at AS createdAt
          FROM event_hosts
          WHERE user_id = ?
          ORDER BY created_at DESC
          LIMIT 1
        `).get(admin.userId) as { createdAt: string } | undefined;
        if (host?.createdAt) {
          candidates.push({ at: host.createdAt, label: "Event host credit" });
        }
      } catch {
        /* ignore */
      }
      candidates.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
      if (candidates[0]) {
        admin.lastActivityAt = candidates[0].at;
        admin.lastActivityLabel = candidates[0].label;
      }
    }

    return admins.sort((a, b) => a.username.localeCompare(b.username));
  },
  grantSiteAdminByIdentifier(identifier, grantedByUserId, note) {
    const raw = String(identifier || "").trim();
    if (!raw) return { error: "Username or email required" };
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw);
    const user = isEmail
      ? storage.getUserByEmail(raw.toLowerCase())
      : (sqlite.prepare(`
          SELECT * FROM users WHERE LOWER(username) = ? LIMIT 1
        `).get(raw.replace(/^@/, "").toLowerCase()) as User | undefined);
    if (!user) return { error: "No registered user found with that username or email. They need a site account first." };
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
    // Mirror set-sub-admin grant:false - GRANT SUB-ADMIN sets both the grant row and
    // subAdmin; leaving subAdmin true would keep userIsSiteAdmin / userIsAdminNow true.
    storage.updateUser(userId, { subAdmin: false });
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
        const target = String(req.proof || "").split(", ")[0].trim();
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
    getAttendances(eventId, viewerUserId) {
      expireStaleAttendances(eventId);
      return maskAttendances(viewerUserId, sqlite.prepare(`
      SELECT a.id, a.event_id, a.user_id AS userId, a.handle, a.message, a.avatar_seed AS avatarSeed,
             a.photo_url AS photoUrl, a.is_anonymous AS isAnonymous, a.visibility AS visibility,
             a.expires_at AS expiresAt,
             a.is_active, a.created_at, u.username, u.display_name AS displayName,
             u.photo_url AS userPhotoUrl, u.avatar_choice AS avatarChoice, u.avatar_ring AS avatarRing
      FROM attendances a
      LEFT JOIN users u ON u.id = a.user_id
      WHERE a.event_id = ? AND a.is_active = 1
      ORDER BY a.created_at DESC
      `).all(eventId) as any[]);
    },
  getAttendanceSummaries() {
    expireStaleAttendances();
    const rows = sqlite.prepare(`
      SELECT
        a.id,
        a.event_id AS eventId,
        a.user_id AS userId,
        a.handle,
        a.is_anonymous AS isAnonymous,
        a.visibility AS visibility,
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
      isAnonymous: number | boolean;
      visibility: string | null;
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
        // Public summaries have no viewer: never leak friends-only or anonymous identity.
        const vis = resolveAttendanceVisibility(row);
        const hideIdentity = vis === "anonymous" || vis === "friends" || Boolean(row.isAnonymous);
        map[row.eventId].preview.push({
          id: row.id,
          initials: hideIdentity ? "?" : attendanceInitials(row.handle),
          avatarSeed: hideIdentity ? `anon-${row.id}` : (row.avatarSeed || row.handle),
          userId: hideIdentity ? null : row.userId,
          avatarRing: hideIdentity ? null : row.avatarRing,
          avatarChoice: hideIdentity ? null : row.avatarChoice,
          photoUrl: hideIdentity ? null : row.photoUrl,
        });
      }
    }
    return map;
  },
  getAttendancesByUser(userId) {
    expireStaleAttendances();
    return sqlite.prepare(`
      SELECT
        a.id,
        a.event_id AS eventId,
        a.user_id AS userId,
        a.handle,
        a.message,
        a.avatar_seed AS avatarSeed,
        a.photo_url AS photoUrl,
        a.is_anonymous AS isAnonymous,
        a.visibility AS visibility,
        a.expires_at AS expiresAt,
        a.is_active AS isActive,
        a.created_at AS createdAt,
        e.title AS eventTitle,
        e.venue_name AS venueName,
        e.day_of_week AS dayOfWeek,
        e.date_start AS dateStart,
        e.date_end AS dateEnd
      FROM attendances a
      LEFT JOIN events e ON e.id = a.event_id
      WHERE a.user_id = ? AND a.is_active = 1
      ORDER BY e.date_start ASC
    `).all(userId) as any[];
  },
  upsertAttendance(eventId, user, message, visibilityArg: AttendanceVisibility | boolean | string = "public") {
    const handle = user.displayName || user.username;
    const createdAt = new Date().toISOString();
    // Align attendance (and thus roster + chat membership) with the event
    // chat window when the event has parsable dates; legacy +8h otherwise.
    const evt = storage.getEvent(eventId);
    const win = evt ? getEventChatWindow(evt.dateStart, evt.dateEnd) : null;
    const expiresAt = win ? new Date(win.closesAt).toISOString() : attendanceChatExpiresAt();
    const existing = sqlite.prepare(`SELECT * FROM attendances WHERE event_id = ? AND user_id = ?`).get(eventId, user.id) as Attendance | undefined;
    const visibility =
      typeof visibilityArg === "boolean"
        ? normalizeAttendanceVisibility(undefined, visibilityArg)
        : normalizeAttendanceVisibility(visibilityArg);
    const isAnonymous = visibility === "anonymous";
    const values = {
      eventId,
      userId: user.id,
      handle,
      message,
      avatarSeed: user.username,
      photoUrl: user.photoUrl || null,
      isAnonymous,
      visibility,
      expiresAt,
      isActive: true,
      createdAt,
    };
    if (existing) {
      db.update(attendances).set(values as any).where(eq(attendances.id, existing.id)).run();
      return db.select().from(attendances).where(eq(attendances.id, existing.id)).get()!;
    }
    return db.insert(attendances).values(values as any).returning().get();
  },
  getEventChatMessages(eventId, viewerUserId) {
    const evt = storage.getEvent(eventId);
    const win = evt ? getEventChatWindow(evt.dateStart, evt.dateEnd) : null;
    const isHost = storage.isUserEventHost(eventId, viewerUserId);
    const mine = getActiveAttendanceForUser(eventId, viewerUserId);
    const member = Boolean(mine) || isHost;
    const opensAt = win ? new Date(win.opensAt).toISOString() : null;
    const closesAt = win ? new Date(win.closesAt).toISOString() : (mine?.expiresAt ?? null);
    const windowState = win
      ? win.state
      : mine?.expiresAt && mine.expiresAt > new Date().toISOString()
        ? "OPEN"
        : "CLOSED";
    // Lazy scoped retention purge: once this room is past close + retention,
    // clear it on read even if the hourly sweep hasn't run.
    if (win && win.state === "CLOSED" && Date.now() > win.closesAt + CHAT_RETENTION_DAYS * 86_400_000) {
      sqlite.prepare(`DELETE FROM event_chat_messages WHERE event_id = ?`).run(eventId);
    }
    const pinned = storage.getHostMessages(eventId, 1)[0] ?? null;
    if (!member) {
      return { messages: [], expiresAt: closesAt, chatOpen: false, opensAt, windowState, isHost: false, pinned: null };
    }
    if (windowState !== "OPEN") {
      return { messages: [], expiresAt: closesAt, chatOpen: false, opensAt, windowState, isHost, pinned };
    }
    const rows = sqlite.prepare(`
      SELECT m.id, m.event_id AS eventId, m.user_id AS userId, m.body, m.is_anonymous AS isAnonymous,
             m.created_at AS createdAt, u.username, u.display_name AS displayName,
             u.photo_url AS photoUrl, u.avatar_choice AS avatarChoice, u.avatar_ring AS avatarRing
      FROM event_chat_messages m
      LEFT JOIN users u ON u.id = m.user_id
      WHERE m.event_id = ?
      ORDER BY m.created_at ASC
      LIMIT 200
    `).all(eventId) as any[];
    const messages = rows.map(row => {
      const isSelf = row.userId === viewerUserId;
      const anonymous = Boolean(row.isAnonymous);
      if (anonymous && !isSelf) {
        return {
          id: row.id,
          eventId: row.eventId,
          userId: null,
          body: row.body,
          isAnonymous: true,
          createdAt: row.createdAt,
          displayName: "Anonymous",
          username: "anonymous",
          photoUrl: null,
          avatarChoice: null,
          avatarRing: null,
          isMine: false,
        };
      }
      return {
        id: row.id,
        eventId: row.eventId,
        userId: row.userId,
        body: row.body,
        isAnonymous: anonymous,
        createdAt: row.createdAt,
        displayName: row.displayName || row.username,
        username: row.username,
        photoUrl: row.photoUrl,
        avatarChoice: row.avatarChoice,
        avatarRing: row.avatarRing,
        isMine: isSelf,
      };
    });
    return {
      messages,
      expiresAt: closesAt,
      chatOpen: true,
      opensAt,
      windowState,
      isHost,
      pinned,
    };
  },
  postEventChatMessage(eventId, userId, body) {
    const evt = storage.getEvent(eventId);
    const win = evt ? getEventChatWindow(evt.dateStart, evt.dateEnd) : null;
    const isHost = storage.isUserEventHost(eventId, userId);
    const mine = getActiveAttendanceForUser(eventId, userId);
    if (!mine && !isHost) throw new Error("Active check-in required");
    if (win) {
      if (win.state === "BEFORE") throw new Error("Event chat opens 48 hours before doors");
      if (win.state === "CLOSED") throw new Error("Event chat has closed");
    } else if (!mine || (mine.expiresAt && mine.expiresAt <= new Date().toISOString())) {
      throw new Error("Event chat has closed");
    }
    // Hosts can post without an attendance row; identity comes from their account.
    const hostUser = !mine ? storage.getUserById(userId) : null;
    const isAnonymous = Boolean(mine?.isAnonymous);
    const createdAt = new Date().toISOString();
    const row = db.insert(eventChatMessages).values({
      eventId,
      userId,
      body,
      isAnonymous,
      createdAt,
    } as any).returning().get();
    return {
      id: row.id,
      eventId: row.eventId,
      userId: row.userId,
      body: row.body,
      isAnonymous: Boolean(row.isAnonymous),
      createdAt: row.createdAt,
      isMine: true,
      displayName: isAnonymous
        ? "Anonymous"
        : (mine?.handle || hostUser?.displayName || hostUser?.username || "You"),
      username: isAnonymous ? "anonymous" : undefined,
    };
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
  createUser({
    username,
    email,
    passwordHash,
    displayName,
    googleId,
    communityStandardsVersion,
    communityStandardsAgreedAt,
  }: {
    username: string;
    email: string;
    passwordHash: string;
    displayName?: string;
    googleId?: string;
    communityStandardsVersion?: string | null;
    communityStandardsAgreedAt?: string | null;
  }) {
    const hashed = hashPassword(passwordHash);
    return db.insert(users).values({
      username, email, passwordHash: hashed,
      displayName: displayName || null,
      googleId: googleId || null,
      avatarChoice: 1,
      status: "active",
      communityStandardsVersion: communityStandardsVersion || null,
      communityStandardsAgreedAt: communityStandardsAgreedAt || null,
      createdAt: new Date().toISOString(),
    }).returning().get();
  },
  linkGoogleToUser(id, googleId) {
    db.update(users).set({ googleId }).where(eq(users.id, id)).run();
  },
  updateUser(id, data) {
    db.update(users).set(data).where(eq(users.id, id)).run();
  },
  setCommunityStandardsAgreement(userId, { agreed, version }) {
    const now = new Date().toISOString();
    if (agreed) {
      db.update(users)
        .set({
          communityStandardsVersion: version,
          communityStandardsAgreedAt: now,
          communityStandardsDeclinedAt: null,
        } as any)
        .where(eq(users.id, userId))
        .run();
    } else {
      db.update(users)
        .set({
          communityStandardsVersion: version,
          communityStandardsAgreedAt: null,
          communityStandardsDeclinedAt: now,
        } as any)
        .where(eq(users.id, userId))
        .run();
    }
  },
  clearExpiredAccountModeration(userId) {
    const user = storage.getUserById(userId);
    if (!user) return null;
    const now = Date.now();
    const patch: Record<string, unknown> = {};
    if (user.status === "suspended" && user.suspendUntil) {
      const t = Date.parse(user.suspendUntil);
      if (Number.isFinite(t) && t <= now) {
        patch.status = "active";
        patch.suspendReasonCode = null;
        patch.suspendReasonLabel = null;
        patch.suspendNote = null;
        patch.suspendUntil = null;
        patch.suspendedAt = null;
        patch.suspendedByUserId = null;
      }
    }
    if (user.shadowBanned && user.shadowBanUntil) {
      const t = Date.parse(user.shadowBanUntil);
      if (Number.isFinite(t) && t <= now) {
        patch.shadowBanned = false;
        patch.shadowBanReasonCode = null;
        patch.shadowBanReasonLabel = null;
        patch.shadowBanNote = null;
        patch.shadowBanUntil = null;
        patch.shadowBannedAt = null;
        patch.shadowBannedByUserId = null;
      }
    }
    if (Object.keys(patch).length === 0) return user;
    db.update(users).set(patch as any).where(eq(users.id, userId)).run();
    return storage.getUserById(userId) || null;
  },
  applyAccountModeration({
    targetUserId,
    actorUserId,
    action,
    reasonCode,
    reasonLabel,
    note,
    until,
  }) {
    const target = storage.getUserById(targetUserId);
    if (!target) return null;
    const now = new Date().toISOString();
    const noteTrim = (note || "").trim().slice(0, 500) || null;
    if (action === "suspend") {
      db.update(users)
        .set({
          status: "suspended",
          suspendReasonCode: reasonCode || "OTHER",
          suspendReasonLabel: reasonLabel || "Community standards",
          suspendNote: noteTrim,
          suspendUntil: until || null,
          suspendedAt: now,
          suspendedByUserId: actorUserId,
        } as any)
        .where(eq(users.id, targetUserId))
        .run();
    } else if (action === "unsuspend") {
      db.update(users)
        .set({
          status: "active",
          suspendReasonCode: null,
          suspendReasonLabel: null,
          suspendNote: null,
          suspendUntil: null,
          suspendedAt: null,
          suspendedByUserId: null,
        } as any)
        .where(eq(users.id, targetUserId))
        .run();
    } else if (action === "shadowban") {
      db.update(users)
        .set({
          shadowBanned: true,
          shadowBanReasonCode: reasonCode || "OTHER",
          shadowBanReasonLabel: reasonLabel || "Community standards",
          shadowBanNote: noteTrim,
          shadowBanUntil: until || null,
          shadowBannedAt: now,
          shadowBannedByUserId: actorUserId,
        } as any)
        .where(eq(users.id, targetUserId))
        .run();
    } else if (action === "unshadowban") {
      db.update(users)
        .set({
          shadowBanned: false,
          shadowBanReasonCode: null,
          shadowBanReasonLabel: null,
          shadowBanNote: null,
          shadowBanUntil: null,
          shadowBannedAt: null,
          shadowBannedByUserId: null,
        } as any)
        .where(eq(users.id, targetUserId))
        .run();
    } else if (action === "delete") {
      db.update(users)
        .set({
          status: "deleted",
          suspendReasonCode: reasonCode || "OTHER",
          suspendReasonLabel: reasonLabel || "Account removed",
          suspendNote: noteTrim,
          suspendUntil: null,
          suspendedAt: now,
          suspendedByUserId: actorUserId,
          // Scrub public surface
          photoUrl: null,
          bio: null,
          displayName: target.displayName ? "Removed account" : null,
        } as any)
        .where(eq(users.id, targetUserId))
        .run();
    }
    return storage.getUserById(targetUserId) || null;
  },
  changeUsername(userId, rawUsername) {
    const user = storage.getUserById(userId);
    if (!user) return { error: "User not found" };
    const clean = normalizeUsername(rawUsername);
    if (!clean) return { error: "Username must be 3 to 32 letters, numbers, or underscores" };
    if (clean === user.username) return { username: clean };
    const { canChange, nextChangeAt } = usernameChangeEligibility(user.usernameChangedAt);
    if (!canChange) {
      const when = nextChangeAt
        ? new Date(nextChangeAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
        : "later";
      return { error: `You can change your username again on ${when}` };
    }
    const existing = storage.getUserByUsername(clean);
    if (existing && existing.id !== userId) return { error: "Username already taken" };
    const now = new Date().toISOString();
    db.update(users).set({ username: clean, usernameChangedAt: now }).where(eq(users.id, userId)).run();
    return { username: clean };
  },
  updatePasswordHash(id, passwordHash) {
    db.update(users).set({ passwordHash }).where(eq(users.id, id)).run();
  },
  createPasswordResetToken(userId, tokenHash, expiresAt) {
    const now = new Date().toISOString();
    sqlite.prepare(`UPDATE password_reset_tokens SET used_at = ? WHERE user_id = ? AND used_at IS NULL`).run(now, userId);
    sqlite.prepare(`DELETE FROM password_reset_tokens WHERE expires_at < ?`).run(now);
    sqlite.prepare(`
      INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, created_at)
      VALUES (?, ?, ?, ?)
    `).run(userId, tokenHash, expiresAt, now);
  },
  resetPasswordWithToken(tokenHash, newPassword) {
    const now = new Date().toISOString();
    const apply = sqlite.transaction(() => {
      const token = sqlite.prepare(`
        SELECT id, user_id AS userId
        FROM password_reset_tokens
        WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?
        LIMIT 1
      `).get(tokenHash, now) as { id: number; userId: number } | undefined;
      if (!token) return false;
      sqlite.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).run(hashPassword(newPassword), token.userId);
      sqlite.prepare(`UPDATE password_reset_tokens SET used_at = ? WHERE user_id = ? AND used_at IS NULL`).run(now, token.userId);
      return true;
    });
    return apply();
  },
  resolvePromoterApplicationSubmissions(userId, outcome, adminName = "admin", reason = "") {
    const user = storage.getUserById(userId);
    if (!user?.email) return;
    const pendingApps = db.select().from(submissions).all()
      .filter((s: any) => s.submitterEmail === user.email
        && s.type === "PROMOTER_APPLICATION"
        && s.status === "PENDING");
    for (const sub of pendingApps) {
      if (outcome === "approved") {
        db.update(submissions).set({
          status: "APPROVED",
          approvals: JSON.stringify([adminName]),
        }).where(eq(submissions.id, sub.id)).run();
        // Promoter inbox notice is sent by setPromoterStatus - avoid a duplicate "event is live" message.
      } else {
        db.update(submissions).set({
          status: "REJECTED",
          adminNotes: reason || "Promoter request denied",
        }).where(eq(submissions.id, sub.id)).run();
      }
    }
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
        "Your promoter request wasn't approved right now. You can still claim existing listings, those go through the review queue.",
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
      const userSubs = db.select().from(submissions).all()
        .filter((s: any) => s.submitterEmail === u.email && s.status === "PENDING");
      const claimSub = userSubs
        .filter((s: any) => s.type === "CLAIM")
        .sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt))[0];
      const appSub = userSubs
        .filter((s: any) => s.type === "PROMOTER_APPLICATION")
        .sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt))[0];
      const detailSub = claimSub || appSub;
      const evt = claimSub?.eventId
        ? db.select().from(events).where(eq(events.id, claimSub.eventId)).get()
        : undefined;
      return {
        id: u.id,
        username: u.username,
        email: u.email,
        displayName: u.displayName,
        photoUrl: u.photoUrl ?? null,
        avatarChoice: u.avatarChoice ?? 1,
        avatarRing: u.avatarRing || "none",
        promoterStatus: u.promoterStatus,
        submissionId: detailSub?.id ?? null,
        eventId: claimSub?.eventId ?? null,
        claimReason: detailSub?.claimReason ?? appSub?.description ?? null,
        submitterOrg: detailSub?.submitterOrg ?? null,
        requestedAt: detailSub?.createdAt ?? u.createdAt,
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
  getFollowerUserIds(userId) {
    const rows = sqlite.prepare(`
      SELECT follower_user_id AS userId
      FROM follows
      WHERE following_user_id = ?
    `).all(userId) as { userId: number }[];
    return rows.map(r => Number(r.userId)).filter(id => id > 0);
  },
  getPastAttendeeUserIdsForHost(hostUserId) {
    const user = storage.getUserById(hostUserId);
    if (!user) return [];
    // Anyone who RSVP'd (active or past) to any event this user hosts/claimed/submitted.
    const rows = sqlite.prepare(`
      SELECT DISTINCT a.user_id AS userId
      FROM attendances a
      INNER JOIN events e ON e.id = a.event_id
      WHERE a.user_id IS NOT NULL
        AND a.user_id != ?
        AND (
          e.id IN (SELECT event_id FROM event_hosts WHERE user_id = ?)
          OR (e.claimed_by IS NOT NULL AND (
            LOWER(TRIM(e.claimed_by)) = LOWER(?)
            OR LOWER(TRIM(e.claimed_by)) = LOWER(?)
          ))
          OR (e.submitted_by IS NOT NULL AND (
            LOWER(TRIM(e.submitted_by)) = LOWER(?)
            OR LOWER(TRIM(e.submitted_by)) = LOWER(?)
          ))
        )
    `).all(
      hostUserId,
      hostUserId,
      user.username || "",
      user.email || "",
      user.username || "",
      user.email || "",
    ) as { userId: number }[];
    return rows.map(r => Number(r.userId)).filter(id => id > 0);
  },
  previewEventInviteAudience(eventId, hostUserId) {
    const past = new Set(storage.getPastAttendeeUserIdsForHost(hostUserId));
    past.delete(hostUserId);
    const followers = new Set(storage.getFollowerUserIds(hostUserId));
    followers.delete(hostUserId);
    const union = new Set<number>();
    Array.from(past).forEach(id => union.add(id));
    Array.from(followers).forEach(id => union.add(id));
    // Don't invite people who already RSVP'd this specific event (optional nicety)
    const already = sqlite.prepare(`
      SELECT DISTINCT user_id AS userId FROM attendances
      WHERE event_id = ? AND is_active = 1 AND user_id IS NOT NULL
    `).all(eventId) as { userId: number }[];
    for (const r of already) union.delete(Number(r.userId));
    return {
      pastAttendees: past.size,
      followers: followers.size,
      total: union.size,
    };
  },
  inviteAudienceToEvent(eventId, hostUserId, opts = {}) {
    const evt = storage.getEvent(eventId);
    if (!evt) return { sent: 0, pastAttendees: 0, followers: 0, skipped: 0 };
    const includePast = opts.includePastAttendees !== false;
    const includeFollowers = opts.includeFollowers !== false;
    const pastSet = new Set(includePast ? storage.getPastAttendeeUserIdsForHost(hostUserId) : []);
    const followerSet = new Set(includeFollowers ? storage.getFollowerUserIds(hostUserId) : []);
    pastSet.delete(hostUserId);
    followerSet.delete(hostUserId);

    const targets = new Set<number>();
    Array.from(pastSet).forEach(id => targets.add(id));
    Array.from(followerSet).forEach(id => targets.add(id));

    // Skip current active RSVPs on this event - they're already going.
    const already = sqlite.prepare(`
      SELECT DISTINCT user_id AS userId FROM attendances
      WHERE event_id = ? AND is_active = 1 AND user_id IS NOT NULL
    `).all(eventId) as { userId: number }[];
    let skipped = 0;
    for (const r of already) {
      const id = Number(r.userId);
      if (targets.delete(id)) skipped += 1;
    }

    const note = String(opts.message || "").trim().slice(0, 800);
    const defaultBody =
      `You're invited to ${evt.title} at ${evt.venueName}. Open this message to view the event and RSVP.`;
    const body = note
      ? `${note}\n\n- ${evt.title} · ${evt.venueName}`
      : defaultBody;
    const subject = `You're invited: ${evt.title}`;

    let sent = 0;
    for (const toUserId of Array.from(targets)) {
      storage.sendMessage(hostUserId, toUserId, subject, body, {
        contextType: "EVENT_INVITE",
        contextId: eventId,
        contextLabel: evt.title,
      });
      sent += 1;
    }
    return {
      sent,
      pastAttendees: pastSet.size,
      followers: followerSet.size,
      skipped,
    };
  },
  resolveUserByIdentifier(identifier) {
    const raw = String(identifier || "").trim().replace(/^@/, "");
    if (!raw) return undefined;
    const byEmail = storage.getUserByEmail(raw.toLowerCase());
    if (byEmail) return byEmail;
    const byUsername = storage.getUserByUsername(raw);
    if (byUsername) return byUsername;
    return sqlite.prepare(`SELECT * FROM users WHERE LOWER(username) = LOWER(?)`).get(raw) as User | undefined;
  },
  resolveEventPrimaryHostUser(eventId) {
    ensureEventHostsSchema();
    const hosts = storage.getEventHosts(eventId);
    for (const h of hosts) {
      const userId = Number(h.userId);
      if (userId > 0) {
        const user = storage.getUserById(userId);
        if (user) return user;
      }
    }
    const evt = storage.getEvent(eventId);
    if (!evt) return undefined;
    for (const key of [evt.claimedBy, evt.submittedBy]) {
      if (!key) continue;
      const user = storage.resolveUserByIdentifier(String(key));
      if (!user) continue;
      if (hosts.length === 0) {
        try {
          storage.setPrimaryEventHost(eventId, user.id, null);
        } catch (err) {
          console.error("[resolveEventPrimaryHostUser] host backfill failed:", err);
        }
      }
      return user;
    }
    return undefined;
  },
  resolveVenueOwnerUser(event) {
    const businesses = storage.getBusinesses().filter(b => b.active && b.ownerId);
    for (const biz of businesses) {
      if (!eventMatchesBusiness(event, biz)) continue;
      const ownerId = Number(biz.ownerId);
      if (!ownerId) continue;
      const user = storage.getUserById(ownerId);
      if (user) return { user, businessName: biz.name };
    }
    return undefined;
  },
  resolveEventMessageRecipient(eventId) {
    const evt = storage.getEvent(eventId);
    if (!evt) return undefined;

    const host = storage.resolveEventPrimaryHostUser(eventId);
    if (host) return { user: host, recipientType: "host" as const };

    const venueOwner = storage.resolveVenueOwnerUser(evt);
    if (venueOwner) {
      return {
        user: venueOwner.user,
        recipientType: "venue_owner" as const,
        venueName: venueOwner.businessName,
      };
    }

    return undefined;
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
    if (evt.claimedBy) {
      const claimedHost = storage.resolveUserByIdentifier(evt.claimedBy);
      if (claimedHost?.id === userId) return true;
    }
    if (evt.submittedBy) {
      const submittedHost = storage.resolveUserByIdentifier(evt.submittedBy);
      if (submittedHost?.id === userId) return true;
    }
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
  unassignEventHosts(eventId) {
    ensureEventHostsSchema();
    sqlite.prepare(`DELETE FROM event_hosts WHERE event_id = ?`).run(eventId);
    db.update(events).set({ claimedBy: null, isClaimable: true }).where(eq(events.id, eventId)).run();
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
    const uname = (username || "").trim().replace(/^@/, "");
    const em = (email || "").trim().toLowerCase();
    if (!uname && !em) return { error: "Username or email required" };
    let target: any;
    if (uname) {
      target = sqlite.prepare(`SELECT * FROM users WHERE LOWER(username) = LOWER(?)`).get(uname);
      if (!target) return { error: "No account found with that username" };
    } else {
      target = storage.getUserByEmail(em);
      if (!target) return { error: "No account found with that email" };
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
    if (existing?.status === "PENDING") {
      // Legacy pending rows: promote to live (no admin/host approval queue).
      sqlite.prepare(`UPDATE event_talent SET status = 'LIVE' WHERE id = ?`).run(existing.id);
      const talent = storage.getEventTalent(eventId, { includePending: true }).find((t: any) => t.id === existing.id);
      return { talent, needsAdmin: false, isHostSelf: storage.isUserEventHost(eventId, userId) };
    }
    const isHost = storage.isUserEventHost(eventId, userId);
    // Lineup self-tags go live immediately - no admin (or host) approval required.
    const status = "LIVE";
    const created = db.insert(eventTalent).values({
      eventId,
      userId,
      role,
      status,
      addedByUserId: userId,
      createdAt: new Date().toISOString(),
    } as any).returning().get();
    if (!isHost) {
      const roleLabel = EVENT_TALENT_ROLE_LABELS[role];
      const body = `${user.displayName || user.username} (@${user.username}) listed themselves as ${roleLabel} on "${evt.title}".`;
      const approverIds = storage.getEventTalentApproverUserIds(eventId);
      if (approverIds.length > 0) {
        for (const approverId of approverIds) {
          storage.sendMessage(
            userId,
            approverId,
            `Lineup update: ${roleLabel}`,
            body,
            { contextType: "EVENT_TALENT", contextId: eventId, contextLabel: evt.title },
          );
        }
      }
    }
    const talent = storage.getEventTalent(eventId, { includePending: true }).find((t: any) => t.id === created.id);
    return { talent, needsAdmin: false, isHostSelf: isHost };
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
    // Admin denials come from the shared guide profile so replies hit admin inbox.
    if (opts?.isAdmin) {
      notifyGuideInbox(
        row.userId,
        `Lineup request declined`,
        `Your ${row.role} listing request for "${evt?.title || "the event"}" was not approved.`,
        { contextType: "EVENT_TALENT", contextId: row.eventId, contextLabel: evt?.title || null },
      );
    } else {
      storage.sendMessage(
        approverUserId,
        row.userId,
        `Lineup request declined`,
        `Your ${row.role} listing request for "${evt?.title || "the event"}" was not approved.`,
        { contextType: "EVENT_TALENT", contextId: row.eventId, contextLabel: evt?.title || null },
      );
    }
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
    // Talent no longer requires admin approval - promote any legacy pending rows, then return none.
    try {
      sqlite.exec(`UPDATE event_talent SET status = 'LIVE' WHERE status = 'PENDING'`);
    } catch {
      /* ignore */
    }
    return [] as any[];
  },
  // Messages
  getInbox(userId) {
    return sqlite.prepare(`
      SELECT m.*,
             u.username AS from_username, u.display_name AS from_display_name,
             u.photo_url AS from_photo_url, u.avatar_choice AS from_avatar_choice,
             u.avatar_ring AS from_avatar_ring
      FROM messages m
      LEFT JOIN users u ON u.id = m.from_user_id
      INNER JOIN (
        SELECT thread_id, MAX(id) AS latest_id
        FROM messages
        WHERE to_user_id = ? AND deleted_by_to = 0
        GROUP BY thread_id
      ) latest ON m.id = latest.latest_id
      WHERE m.to_user_id = ? AND m.deleted_by_to = 0
        AND NOT EXISTS (
          SELECT 1 FROM member_blocks b
          WHERE (b.blocker_user_id = m.from_user_id AND b.blocked_user_id = m.to_user_id)
             OR (b.blocker_user_id = m.to_user_id AND b.blocked_user_id = m.from_user_id)
        )
      ORDER BY m.created_at DESC
    `).all(userId, userId).map(row => mapMessageRow(row as Record<string, unknown>)) as Message[];
  },
  getSentMessages(userId) {
    return sqlite.prepare(`
      SELECT m.*,
             u.username AS to_username, u.display_name AS to_display_name,
             u.photo_url AS to_photo_url, u.avatar_choice AS to_avatar_choice,
             u.avatar_ring AS to_avatar_ring
      FROM messages m
      LEFT JOIN users u ON u.id = m.to_user_id
      INNER JOIN (
        SELECT thread_id, MAX(id) AS latest_id
        FROM messages
        WHERE from_user_id = ? AND deleted_by_from = 0
        GROUP BY thread_id
      ) latest ON m.id = latest.latest_id
      WHERE m.from_user_id = ? AND m.deleted_by_from = 0
        AND NOT EXISTS (
          SELECT 1 FROM member_blocks b
          WHERE (b.blocker_user_id = m.from_user_id AND b.blocked_user_id = m.to_user_id)
             OR (b.blocker_user_id = m.to_user_id AND b.blocked_user_id = m.from_user_id)
        )
      ORDER BY m.created_at DESC
    `).all(userId, userId).map(row => mapMessageRow(row as Record<string, unknown>)) as Message[];
  },
  getUnreadCount(userId) {
    const row = sqlite.prepare(`
      SELECT COUNT(*) AS count FROM messages m
      WHERE m.to_user_id = ? AND m.is_read = 0 AND m.deleted_by_to = 0
        AND NOT EXISTS (
          SELECT 1 FROM member_blocks b
          WHERE (b.blocker_user_id = m.from_user_id AND b.blocked_user_id = m.to_user_id)
             OR (b.blocker_user_id = m.to_user_id AND b.blocked_user_id = m.from_user_id)
        )
    `).get(userId) as any;
    return row?.count || 0;
  },
  getMemberBlockStatus(viewerUserId, targetUserId) {
    const rows = sqlite.prepare(`
      SELECT blocker_user_id AS blockerUserId FROM member_blocks
      WHERE (blocker_user_id = ? AND blocked_user_id = ?)
         OR (blocker_user_id = ? AND blocked_user_id = ?)
    `).all(viewerUserId, targetUserId, targetUserId, viewerUserId) as Array<{ blockerUserId: number }>;
    const blockedByViewer = rows.some(row => row.blockerUserId === viewerUserId);
    const blockedViewer = rows.some(row => row.blockerUserId === targetUserId);
    return { blockedByViewer, blockedViewer, interactionBlocked: blockedByViewer || blockedViewer };
  },
  isMemberInteractionBlocked(firstUserId, secondUserId) {
    if (firstUserId === secondUserId) return false;
    return storage.getMemberBlockStatus(firstUserId, secondUserId).interactionBlocked;
  },
  blockMember(blockerUserId, blockedUserId) {
    if (blockerUserId === blockedUserId) throw Object.assign(new Error("You cannot block yourself"), { status: 400 });
    const now = new Date().toISOString();
    sqlite.transaction(() => {
      sqlite.prepare(`INSERT OR IGNORE INTO member_blocks (blocker_user_id, blocked_user_id, created_at) VALUES (?, ?, ?)`)
        .run(blockerUserId, blockedUserId, now);
      sqlite.prepare(`DELETE FROM follows WHERE (follower_user_id = ? AND following_user_id = ?) OR (follower_user_id = ? AND following_user_id = ?)`)
        .run(blockerUserId, blockedUserId, blockedUserId, blockerUserId);
      sqlite.prepare(`INSERT OR IGNORE INTO follow_blocks (blocker_user_id, blocked_user_id, created_at) VALUES (?, ?, ?)`)
        .run(blockerUserId, blockedUserId, now);
      sqlite.prepare(`INSERT OR IGNORE INTO follow_blocks (blocker_user_id, blocked_user_id, created_at) VALUES (?, ?, ?)`)
        .run(blockedUserId, blockerUserId, now);
    })();
  },
  unblockMember(blockerUserId, blockedUserId) {
    sqlite.prepare(`DELETE FROM member_blocks WHERE blocker_user_id = ? AND blocked_user_id = ?`).run(blockerUserId, blockedUserId);
  },
  getBlockedMembers(blockerUserId) {
    return sqlite.prepare(`
      SELECT u.id, u.username, u.display_name AS displayName, u.photo_url AS photoUrl
      FROM member_blocks b JOIN users u ON u.id = b.blocked_user_id
      WHERE b.blocker_user_id = ? ORDER BY b.created_at DESC
    `).all(blockerUserId) as Array<{ id: number; username: string; displayName: string | null; photoUrl: string | null }>;
  },
  sendMessage(fromUserId, toUserId, subject, body, opts) {
    if (storage.isMemberInteractionBlocked(fromUserId, toUserId)) {
      throw Object.assign(new Error("Member interaction blocked"), { status: 403, code: "MEMBER_BLOCKED" });
    }
    const threadId = opts?.threadId || `thread_${Date.now()}_${fromUserId}_${toUserId}`;
    const created = db.insert(messages).values({
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
    schedulePushForMessage(created);
    return created;
  },
  resolveGuideAdminUser() {
    return resolveGuideAdminUser();
  },
  isGuideAdminUserId(userId) {
    return isGuideAdminUserId(userId);
  },
  getGuideAdminInbox() {
    const guide = resolveGuideAdminUser();
    if (!guide) return [];
    return storage.getInbox(guide.id);
  },
  getGuideAdminSent() {
    const guide = resolveGuideAdminUser();
    if (!guide) return [];
    return storage.getSentMessages(guide.id);
  },
  getGuideAdminUnreadCount() {
    const guide = resolveGuideAdminUser();
    if (!guide) return 0;
    return storage.getUnreadCount(guide.id);
  },
  sendAsGuideAdmin(toUserId, subject, body, opts) {
    return sendAsGuideAdmin(toUserId, subject, body, opts);
  },
  notifyOwnerModeration(subject, body) {
    const owner = resolveSiteOwner();
    if (!owner) return;
    notifyGuideInbox(owner.id, subject, body, { contextType: "ADMIN_ALERT" });
  },
  sendPortfolioContactMessage({
    kind = "message",
    name,
    email,
    phone,
    message,
    businessName,
    lengthNeeded,
    sponsorshipType,
    size,
    hangingSpace,
    ceilingHeight,
    attachmentUrls,
    pageUrl,
  }) {
    const isSponsor = kind === "sponsor";
    const isOrder = kind === "order";
    const summary = isSponsor
      ? `${businessName || name}${sponsorshipType ? ` · ${sponsorshipType}` : ""}${lengthNeeded ? ` · ${lengthNeeded}` : ""}`
      : isOrder
        ? `${size || "size TBD"}${ceilingHeight ? ` · ceiling ${ceilingHeight}` : ""}${phone ? ` · ${phone}` : ""}`
        : (phone ? `Phone: ${phone}` : email);
    const deskKind = isSponsor ? "sponsor" : isOrder ? "order" : "contact";
    const title = isSponsor
      ? `Sponsorship pitch: ${businessName || name}`
      : isOrder
        ? `Disco body order: ${name}${size ? ` · ${size}` : ""}`
        : `Message from ${name}`;
    const bodyParts = [message];
    if (isOrder) {
      if (size) bodyParts.unshift(`Size: ${size}`);
      if (hangingSpace) bodyParts.push(`Hanging space: ${hangingSpace}`);
      if (ceilingHeight) bodyParts.push(`Ceiling height: ${ceilingHeight}`);
    }
    storage.createOwnerDeskItem({
      kind: deskKind,
      title,
      summary,
      body: bodyParts.join("\n\n"),
      contactName: name,
      contactEmail: email,
      contactPhone: phone || null,
      pageUrl: pageUrl || "/about",
      metaJson: {
        businessName: businessName || null,
        sponsorshipType: sponsorshipType || null,
        lengthNeeded: lengthNeeded || null,
        size: size || null,
        hangingSpace: hangingSpace || null,
        ceilingHeight: ceilingHeight || null,
        attachmentUrls: attachmentUrls || [],
      },
    });
    return true;
  },
  getNotificationPrefs(userId: number): NotificationPrefs {
    const row = sqlite.prepare(`SELECT notification_prefs, sub_admin, email, username FROM users WHERE id = ?`).get(userId) as {
      notification_prefs?: string | null;
      sub_admin?: number;
      email?: string | null;
      username?: string | null;
    } | undefined;
    if (!row) return { ...DEFAULT_NOTIFICATION_PREFS };
    let raw: unknown = null;
    if (row.notification_prefs) {
      try { raw = JSON.parse(row.notification_prefs); } catch { raw = null; }
    }
    const isAdmin = Boolean(row.sub_admin)
      || storage.isSiteOwnerUser(row)
      || storage.hasSiteAdminGrant(userId);
    return parseNotificationPrefs(raw, isAdmin);
  },
  setNotificationPrefs(userId: number, prefs: Partial<NotificationPrefs>, isAdmin = false) {
    const current = storage.getNotificationPrefs(userId);
    const next = { ...current, ...prefs };
    if (!isAdmin) next.admin = false;
    sqlite.prepare(`UPDATE users SET notification_prefs = ? WHERE id = ?`).run(JSON.stringify(next), userId);
    return next;
  },
  upsertPushSubscription(userId: number, data: {
    endpoint: string;
    p256dh: string;
    auth: string;
    userAgent?: string | null;
    platform?: string | null;
  }) {
    const now = new Date().toISOString();
    const existing = sqlite.prepare(`SELECT id FROM push_subscriptions WHERE endpoint = ?`).get(data.endpoint) as { id: number } | undefined;
    if (existing) {
      sqlite.prepare(`
        UPDATE push_subscriptions
        SET user_id = ?, p256dh = ?, auth = ?, user_agent = ?, platform = ?, active = 1, last_used_at = ?
        WHERE id = ?
      `).run(userId, data.p256dh, data.auth, data.userAgent || null, data.platform || null, now, existing.id);
      return sqlite.prepare(`SELECT * FROM push_subscriptions WHERE id = ?`).get(existing.id);
    }
    const inserted = sqlite.prepare(`
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent, platform, active, created_at, last_used_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(userId, data.endpoint, data.p256dh, data.auth, data.userAgent || null, data.platform || null, now, now);
    return sqlite.prepare(`SELECT * FROM push_subscriptions WHERE id = ?`).get(Number(inserted.lastInsertRowid));
  },
  deactivatePushSubscription(id: number) {
    sqlite.prepare(`UPDATE push_subscriptions SET active = 0 WHERE id = ?`).run(id);
  },
  deactivatePushSubscriptionByEndpoint(userId: number, endpoint: string) {
    sqlite.prepare(`UPDATE push_subscriptions SET active = 0 WHERE user_id = ? AND endpoint = ?`).run(userId, endpoint);
  },
  touchPushSubscription(id: number) {
    sqlite.prepare(`UPDATE push_subscriptions SET last_used_at = ? WHERE id = ?`).run(new Date().toISOString(), id);
  },
  getActivePushSubscriptions(userId: number) {
    return sqlite.prepare(`
      SELECT id, endpoint, p256dh, auth
      FROM push_subscriptions
      WHERE user_id = ? AND active = 1
    `).all(userId) as Array<{ id: number; endpoint: string; p256dh: string; auth: string }>;
  },
  countActivePushSubscriptions() {
    const row = sqlite.prepare(`SELECT COUNT(*) AS count FROM push_subscriptions WHERE active = 1`).get() as { count: number };
    return row?.count || 0;
  },
  getAllActivePushSubscriptions() {
    return sqlite.prepare(`
      SELECT id, user_id AS userId, endpoint, p256dh, auth
      FROM push_subscriptions
      WHERE active = 1
    `).all() as Array<{ id: number; userId: number; endpoint: string; p256dh: string; auth: string }>;
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
      SELECT m.*,
             u.username AS from_username, u.display_name AS from_display_name,
             u.photo_url AS from_photo_url, u.avatar_choice AS from_avatar_choice,
             u.avatar_ring AS from_avatar_ring
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
    return live.filter(evt => isMissedConnectionPostable(evt.dateStart, evt.dateEnd, { requireToday }).ok);
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
        postable: isMissedConnectionPostable(evt.dateStart, evt.dateEnd).ok,
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
        m.beach_id AS beachId,
        m.status,
        m.created_at AS createdAt,
        m.closes_at AS closesAt,
        m.user_id,
        e.title AS eventTitle,
        e.venue_name AS eventVenue,
        e.address AS eventAddress,
        e.day_of_week AS eventDay,
        e.date_start AS eventDateStart
      FROM missed_connections m
      LEFT JOIN events e ON e.id = m.event_id
      WHERE m.status = ?
      ORDER BY m.created_at DESC
    `).all(status) as any[];
    return rows.map(row => mapMissedConnectionRow(row, viewerUserId));
  },
  getMissedConnectionsByBeach(beachId: string, viewerUserId?: number) {
    archiveExpiredMissedConnections();
    const rows = sqlite.prepare(`
      SELECT
        m.id,
        m.title,
        m.body,
        m.day_of_week AS dayOfWeek,
        m.venue_hint AS venueHint,
        m.event_id AS eventId,
        m.beach_id AS beachId,
        m.status,
        m.created_at AS createdAt,
        m.closes_at AS closesAt,
        m.user_id,
        e.title AS eventTitle,
        e.venue_name AS eventVenue,
        e.address AS eventAddress,
        e.day_of_week AS eventDay,
        e.date_start AS eventDateStart
      FROM missed_connections m
      LEFT JOIN events e ON e.id = m.event_id
      WHERE m.status = 'ACTIVE' AND m.beach_id = ?
      ORDER BY m.created_at DESC
    `).all(beachId) as any[];
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
        m.beach_id AS beachId,
        m.status,
        m.created_at AS createdAt,
        m.closes_at AS closesAt,
        m.user_id,
        e.title AS eventTitle,
        e.venue_name AS eventVenue,
        e.address AS eventAddress,
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
        m.beach_id AS beachId,
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
    // Spotted posts go live immediately - no admin approval queue.
    const row = db.insert(missedConnections).values({
      ...data,
      status: "ACTIVE",
      createdAt,
    } as any).returning().get();
    if (row?.id) {
      try {
        sqlite.prepare(`UPDATE missed_connections SET admin_reviewed = 1 WHERE id = ?`).run(row.id);
      } catch {
        /* column may not exist on very old DBs until ensureMissedConnectionsSchema runs */
      }
    }
    return row;
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
    const counterpartyIds = new Set<number>();
    for (const row of thread) {
      if (row.from_user_id !== viewerUserId) counterpartyIds.add(Number(row.from_user_id));
      if (row.to_user_id !== viewerUserId) counterpartyIds.add(Number(row.to_user_id));
    }
    if ([...counterpartyIds].some(id => storage.isMemberInteractionBlocked(viewerUserId, id))) return [];
    const mcThread = storage.getMissedConnectionThread(threadId);
    const bothRevealed = !mcThread || Boolean(mcThread.poster_revealed && mcThread.replier_revealed);
    const mapped = thread.map(raw => {
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
    const reactionMap = bulkMessageReactionSummaries(
      mapped.map((m: any) => Number(m.id)).filter((id: number) => Number.isFinite(id) && id > 0),
      viewerUserId,
    );
    return mapped.map((m: any) => ({
      ...m,
      reactions: reactionMap.get(Number(m.id)) || [],
    }));
  },
  toggleMessageReaction(messageId, userId, emoji) {
    ensureMessageReactionsSchema();
    const id = Number(messageId);
    if (!Number.isFinite(id) || id <= 0) {
      return { reactions: [], error: "Invalid message" };
    }
    const code = String(emoji || "").trim().toLowerCase();
    if (!VALID_MESSAGE_REACTION_CODES.has(code)) {
      return { reactions: [], error: "Invalid reaction" };
    }
    const row = sqlite
      .prepare(
        `SELECT id, from_user_id AS fromUserId, to_user_id AS toUserId,
                deleted_by_from AS deletedByFrom, deleted_by_to AS deletedByTo
         FROM messages WHERE id = ?`,
      )
      .get(id) as
      | {
          id: number;
          fromUserId: number;
          toUserId: number;
          deletedByFrom: number;
          deletedByTo: number;
        }
      | undefined;
    if (!row) return { reactions: [], error: "Not found" };
    const isParticipant = row.fromUserId === userId || row.toUserId === userId;
    if (!isParticipant) return { reactions: [], error: "Not found" };
    // Soft-deleted for this viewer: treat as missing.
    if (row.fromUserId === userId && row.deletedByFrom) {
      return { reactions: [], error: "Not found" };
    }
    if (row.toUserId === userId && row.deletedByTo) {
      return { reactions: [], error: "Not found" };
    }

    const existing = sqlite
      .prepare(
        `SELECT id FROM message_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?`,
      )
      .get(id, userId, code);
    if (existing) {
      sqlite
        .prepare(`DELETE FROM message_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?`)
        .run(id, userId, code);
    } else {
      sqlite
        .prepare(
          `INSERT INTO message_reactions (message_id, user_id, emoji, created_at)
           VALUES (?, ?, ?, ?)`,
        )
        .run(id, userId, code, new Date().toISOString());
    }
    const reactions = bulkMessageReactionSummaries([id], userId).get(id) || [];
    return { reactions };
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
    // Gifting goes live immediately - never create as PENDING for admin review.
    const liveStatus = status === "PENDING" || !status
      ? (postType === "ISO" ? "LOOKING" : "OPEN")
      : status;
    return db.insert(giftingPosts).values({
      ...data,
      postType,
      status: liveStatus,
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
  updateGiftingPostStatus(id, status, adminNotes) {
    const patch: Record<string, unknown> = { status };
    if (adminNotes !== undefined) patch.adminNotes = adminNotes;
    db.update(giftingPosts).set(patch as any).where(eq(giftingPosts.id, id)).run();
  },
  resolveGiftingReport(id, adminNotes) {
    db.update(giftingReports).set({ status: "RESOLVED", adminNotes: adminNotes || null } as any).where(eq(giftingReports.id, id)).run();
  },
  expireGiftingPosts() {
    expireGiftingPosts();
  },
  // SELLZ marketplace
  getSellzPosts(opts = {}) {
    sqlite.prepare(`UPDATE sellz_posts SET status = 'EXPIRED' WHERE status = 'ACTIVE' AND expires_at < ?`).run(new Date().toISOString());
    const where: string[] = [];
    const params: any[] = [];
    if (!opts.includeInactive) where.push(`p.status IN ('ACTIVE','RESERVED')`);
    if (opts.userId) { where.push(`p.user_id = ?`); params.push(opts.userId); }
    return sqlite.prepare(`
      SELECT p.*, u.username, u.display_name AS displayName,
             u.photo_url AS posterPhotoUrl, u.avatar_choice AS avatarChoice,
             u.avatar_ring AS posterAvatarRing,
             (SELECT COUNT(*) FROM sellz_interests si WHERE si.post_id = p.id AND si.status IN ('INTERESTED','SELECTED')) AS interestCount
      FROM sellz_posts p JOIN users u ON u.id = p.user_id
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY p.created_at DESC
    `).all(...params).map((post: any) => ({
      ...post,
      photoUrls: safeJson(post.photo_urls || "[]"),
      interests: this.getSellzPost(post.id)?.interests || [],
    }));
  },
  getSellzPost(id) {
    const post = sqlite.prepare(`
      SELECT p.*, u.username, u.display_name AS displayName,
             u.photo_url AS posterPhotoUrl, u.avatar_choice AS avatarChoice,
             u.avatar_ring AS posterAvatarRing,
             (SELECT COUNT(*) FROM sellz_interests si WHERE si.post_id = p.id AND si.status IN ('INTERESTED','SELECTED')) AS interestCount
      FROM sellz_posts p JOIN users u ON u.id = p.user_id WHERE p.id = ?
    `).get(id) as any;
    if (!post) return undefined;
    const interests = sqlite.prepare(`
      SELECT si.*, u.username, u.display_name AS displayName, u.photo_url AS photoUrl,
             u.avatar_choice AS avatarChoice, u.avatar_ring AS avatarRing
      FROM sellz_interests si JOIN users u ON u.id = si.user_id
      WHERE si.post_id = ? AND si.status != 'WITHDRAWN' ORDER BY si.created_at ASC
    `).all(id);
    return { ...post, photoUrls: safeJson(post.photo_urls || "[]"), interests };
  },
  getSellzPostsByUser(userId) {
    return this.getSellzPosts({ includeInactive: true, userId }).filter((post: any) => post.status !== "REMOVED");
  },
  createSellzPost(data) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 86400000).toISOString();
    const result = sqlite.prepare(`
      INSERT INTO sellz_posts (user_id,title,description,category,condition,price_cents,negotiable,neighborhood,pickup_preference,photo_urls,status,expires_at,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,'ACTIVE',?,?)
    `).run(data.userId, data.title, data.description, data.category, data.condition, data.priceCents,
      data.negotiable ? 1 : 0, data.neighborhood, data.pickupPreference, data.photoUrls || "[]", expiresAt, now.toISOString());
    return this.getSellzPost(Number(result.lastInsertRowid));
  },
  updateSellzPost(id, userId, data) {
    const post = this.getSellzPost(id);
    if (!post || Number(post.user_id) !== userId) throw new Error("Not your listing");
    const now = new Date().toISOString();
    const prev = sqlite.prepare(`SELECT last_change_at, updated_at FROM sellz_posts WHERE id=?`).get(id) as { last_change_at?: string | null; updated_at?: string | null } | undefined;
    const coalesceFrom = prev?.last_change_at || prev?.updated_at || null;
    const label = Number(data.priceCents) !== Number(post.price_cents) ? "Price updated" : "Listing updated";
    const bumpAt = shouldCoalesceChange(coalesceFrom, Date.parse(now)) ? coalesceFrom : now;
    sqlite.prepare(`UPDATE sellz_posts SET title=?,description=?,category=?,condition=?,price_cents=?,negotiable=?,neighborhood=?,pickup_preference=?,updated_at=?,last_change_label=?,last_change_at=? WHERE id=?`)
      .run(data.title, data.description, data.category, data.condition, data.priceCents, data.negotiable ? 1 : 0, data.neighborhood, data.pickupPreference, now, label, bumpAt || now, id);
    return this.getSellzPost(id);
  },
  addSellzInterest(data) {
    const post = this.getSellzPost(data.postId);
    if (!post) throw new Error("Listing not found");
    if (Number(post.user_id) === data.userId) throw new Error("Cannot message your own listing");
    if (post.status !== "ACTIVE") throw new Error("This listing is not available");
    const existing = sqlite.prepare(`SELECT id FROM sellz_interests WHERE post_id=? AND user_id=? AND status!='WITHDRAWN'`).get(data.postId, data.userId);
    if (existing) throw new Error("You already contacted this seller");
    const result = sqlite.prepare(`INSERT INTO sellz_interests (post_id,user_id,note,offer_cents,status,created_at) VALUES (?,?,?,?,'INTERESTED',?)`)
      .run(data.postId, data.userId, String(data.note).slice(0, 500), data.offerCents ?? null, new Date().toISOString());
    return sqlite.prepare(`SELECT * FROM sellz_interests WHERE id=?`).get(Number(result.lastInsertRowid));
  },
  chooseSellzInterest(postId, interestId, ownerUserId) {
    const post = this.getSellzPost(postId);
    if (!post || Number(post.user_id) !== ownerUserId) throw new Error("Not your listing");
    const interest = sqlite.prepare(`SELECT * FROM sellz_interests WHERE id=? AND post_id=?`).get(interestId, postId) as any;
    if (!interest) throw new Error("Buyer response not found");
    sqlite.prepare(`UPDATE sellz_interests SET status='DECLINED' WHERE post_id=? AND id!=?`).run(postId, interestId);
    sqlite.prepare(`UPDATE sellz_interests SET status='SELECTED' WHERE id=?`).run(interestId);
    sqlite.prepare(`UPDATE sellz_posts SET status='RESERVED', selected_interest_id=? WHERE id=?`).run(interestId, postId);
    return interest;
  },
  setSellzStatus(postId, userId, status) {
    const post = this.getSellzPost(postId);
    if (!post || Number(post.user_id) !== userId) throw new Error("Not your listing");
    sqlite.prepare(`UPDATE sellz_posts SET status=?, selected_interest_id=CASE WHEN ?='ACTIVE' THEN NULL ELSE selected_interest_id END WHERE id=?`).run(status, status, postId);
  },
  renewSellzPost(postId, userId) {
    const post = this.getSellzPost(postId);
    if (!post || Number(post.user_id) !== userId) throw new Error("Not your listing");
    const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
    sqlite.prepare(`UPDATE sellz_posts SET status='ACTIVE', expires_at=?, selected_interest_id=NULL WHERE id=?`).run(expiresAt, postId);
  },
  deleteSellzPost(postId, userId) {
    const post = this.getSellzPost(postId);
    if (!post || Number(post.user_id) !== userId) throw new Error("Not your listing");
    sqlite.prepare(`UPDATE sellz_posts SET status='REMOVED' WHERE id=?`).run(postId);
  },
  reportSellzPost(data) {
    sqlite.prepare(`INSERT INTO sellz_reports (post_id,reporter_user_id,reason,status,created_at) VALUES (?,?,?,'PENDING',?)`)
      .run(data.postId, data.reporterUserId, data.reason, new Date().toISOString());
    sqlite.prepare(`UPDATE sellz_posts SET report_count=report_count+1 WHERE id=?`).run(data.postId);
  },
  toggleSellzSave(postId, userId) {
    const existing = sqlite.prepare(`SELECT 1 FROM sellz_saves WHERE post_id=? AND user_id=?`).get(postId, userId);
    if (existing) sqlite.prepare(`DELETE FROM sellz_saves WHERE post_id=? AND user_id=?`).run(postId, userId);
    else {
      const now = new Date().toISOString();
      sqlite.prepare(`INSERT INTO sellz_saves (post_id,user_id,created_at,seen_updated_at) VALUES (?,?,?,?)`).run(postId, userId, now, now);
    }
    return !existing;
  },
  markSellzSaveSeen(postId: number, userId: number) {
    const existing = sqlite.prepare(`SELECT 1 FROM sellz_saves WHERE post_id=? AND user_id=?`).get(postId, userId);
    if (!existing) return false;
    sqlite.prepare(`UPDATE sellz_saves SET seen_updated_at=? WHERE post_id=? AND user_id=?`).run(new Date().toISOString(), postId, userId);
    return true;
  },
  getSellzSavedIds(userId) {
    return sqlite.prepare(`SELECT post_id AS postId FROM sellz_saves WHERE user_id=? ORDER BY created_at DESC`).all(userId).map((row: any) => Number(row.postId));
  },
  createFeedbackReport(data) {
    const createdAt = new Date().toISOString();
    const category = String(data.category || "BUG").toUpperCase();
    const desk = storage.createOwnerDeskItem({
      kind: category === "BUG" ? "bug" : "feedback",
      title: category === "BUG" ? `Bug report: ${data.pageUrl}` : `Site feedback: ${data.pageUrl}`,
      summary: String(data.message || "").slice(0, 160),
      body: [
        data.message,
        data.steps ? `\n\nSteps to reproduce:\n${data.steps}` : null,
        data.userAgent ? `\n\nUser agent: ${data.userAgent}` : null,
      ].filter(Boolean).join(""),
      contactName: null,
      contactEmail: data.email || null,
      contactPhone: null,
      pageUrl: data.pageUrl,
      severity: data.severity || "MEDIUM",
      metaJson: { category, legacyFeedback: true },
    });
    return {
      id: desk.id,
      pageUrl: data.pageUrl,
      category,
      severity: data.severity || "MEDIUM",
      message: data.message,
      steps: data.steps || null,
      email: data.email || null,
      userAgent: data.userAgent || null,
      status: "OPEN",
      createdAt,
    } as FeedbackReport;
  },
  getFeedbackReports(status) {
    const rows = db.select().from(feedbackReports).all();
    if (status) return rows.filter(report => report.status === status);
    return rows;
  },
  resolveFeedbackReport(id) {
    db.update(feedbackReports).set({ status: "RESOLVED" } as any).where(eq(feedbackReports.id, id)).run();
  },
  createOwnerDeskItem(data) {
    const now = new Date().toISOString();
    const inserted = sqlite.prepare(`
      INSERT INTO owner_desk_items (
        kind, title, summary, body, contact_name, contact_email, contact_phone,
        page_url, severity, meta_json, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN', ?)
    `).run(
      data.kind,
      data.title,
      data.summary || null,
      data.body,
      data.contactName || null,
      data.contactEmail || null,
      data.contactPhone || null,
      data.pageUrl || null,
      data.severity || null,
      data.metaJson ? JSON.stringify(data.metaJson) : null,
      now,
    );
    return {
      id: Number(inserted.lastInsertRowid),
      kind: data.kind,
      title: data.title,
      status: "OPEN",
      createdAt: now,
    };
  },
  getOwnerDeskItems(status?: string) {
    const kindLabel = (kind: string) => {
      const labels: Record<string, string> = {
        contact: "Contact",
        sponsor: "Sponsorship",
        order: "Disco order",
        bug: "Bug report",
        feedback: "Feedback",
        keyholder: "Keyholder",
        escalation: "Escalation",
        suspend_appeal: "Suspension appeal",
        account_moderation: "Account moderation",
      };
      return labels[kind] || kind;
    };
    const mapDeskRow = (row: Record<string, unknown>) => {
      let meta: Record<string, unknown> = {};
      if (row.meta_json) {
        try { meta = JSON.parse(String(row.meta_json)); } catch { meta = {}; }
      }
      return {
        id: Number(row.id),
        source: "desk" as const,
        kind: String(row.kind),
        kindLabel: kindLabel(String(row.kind)),
        title: String(row.title),
        summary: String(row.summary || ""),
        body: String(row.body),
        contactName: row.contact_name ? String(row.contact_name) : null,
        contactEmail: row.contact_email ? String(row.contact_email) : null,
        contactPhone: row.contact_phone ? String(row.contact_phone) : null,
        pageUrl: row.page_url ? String(row.page_url) : null,
        severity: row.severity ? String(row.severity) : null,
        meta,
        status: String(row.status),
        createdAt: String(row.created_at),
        resolvedAt: row.resolved_at ? String(row.resolved_at) : null,
      };
    };
    const deskRows = (status
      ? sqlite.prepare(`SELECT * FROM owner_desk_items WHERE status = ? ORDER BY created_at DESC`).all(status)
      : sqlite.prepare(`SELECT * FROM owner_desk_items ORDER BY created_at DESC`).all()
    ).map(row => mapDeskRow(row as Record<string, unknown>));

    const legacyRows = storage.getFeedbackReports(status).map(report => ({
      id: report.id,
      source: "feedback" as const,
      kind: report.category === "BUG" ? "bug" : "feedback",
      kindLabel: kindLabel(report.category === "BUG" ? "bug" : "feedback"),
      title: report.category === "BUG" ? `Bug report: ${report.pageUrl}` : `Site feedback: ${report.pageUrl}`,
      summary: String(report.message || "").slice(0, 160),
      body: [
        report.message,
        report.steps ? `\n\nSteps to reproduce:\n${report.steps}` : null,
        report.userAgent ? `\n\nUser agent: ${report.userAgent}` : null,
      ].filter(Boolean).join(""),
      contactName: null,
      contactEmail: report.email || null,
      contactPhone: null,
      pageUrl: report.pageUrl,
      severity: report.severity || null,
      meta: { category: report.category, legacyFeedback: true },
      status: report.status,
      createdAt: report.createdAt,
      resolvedAt: report.status === "RESOLVED" ? report.createdAt : null,
    }));

    const deskIds = new Set(deskRows.map(r => `${r.kind}:${r.title}:${r.createdAt}`));
    const legacyOnly = legacyRows.filter(r => !deskIds.has(`${r.kind}:${r.title}:${r.createdAt}`));
    return [...deskRows, ...legacyOnly].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },
  getOwnerDeskCount() {
    // Contact/sponsor desk + logo requests (owner-only queue items).
    return storage.getOwnerDeskItems("OPEN").length
      + storage.getPendingBusinessLogoRequests().length;
  },
  getAdminMetrics() {
    const counts = getTableCounts();
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);
    const prevWeekStart = new Date(now);
    prevWeekStart.setDate(prevWeekStart.getDate() - 14);
    prevWeekStart.setHours(0, 0, 0, 0);

    const countSince = (table: string, sinceIso: string, extraWhere = "") => {
      const row = sqlite.prepare(
        `SELECT COUNT(*) AS count FROM ${table} WHERE created_at >= ?${extraWhere ? ` AND ${extraWhere}` : ""}`,
      ).get(sinceIso) as { count: number };
      return row?.count ?? 0;
    };
    const countBetween = (table: string, startIso: string, endIso: string, extraWhere = "") => {
      const row = sqlite.prepare(
        `SELECT COUNT(*) AS count FROM ${table} WHERE created_at >= ? AND created_at < ?${extraWhere ? ` AND ${extraWhere}` : ""}`,
      ).get(startIso, endIso) as { count: number };
      return row?.count ?? 0;
    };

    const dailyTrend14d = (table: string, extraWhere = "") => {
      const start = new Date(now);
      start.setDate(start.getDate() - 13);
      start.setHours(0, 0, 0, 0);
      const rows = sqlite.prepare(`
        SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS count
        FROM ${table}
        WHERE created_at >= ?${extraWhere ? ` AND ${extraWhere}` : ""}
        GROUP BY substr(created_at, 1, 10)
      `).all(start.toISOString()) as Array<{ day: string; count: number }>;
      const byDay = Object.fromEntries(rows.map(r => [r.day, r.count]));
      const series: number[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        series.push(byDay[key] ?? 0);
      }
      return series;
    };

    const memberGrowth12h = (() => {
      const bucketMs = 12 * 60 * 60 * 1000;
      const windowStart = new Date(now);
      windowStart.setDate(windowStart.getDate() - 14);
      windowStart.setHours(0, 0, 0, 0);
      const buckets: Array<{
        at: string;
        signups: number;
        rsvps: number;
        total: number;
        cumulativeSignups: number;
        cumulativeRsvps: number;
      }> = [];
      let cumulativeSignups = 0;
      let cumulativeRsvps = 0;
      for (let i = 0; i < 28; i++) {
        const bucketStart = new Date(windowStart.getTime() + i * bucketMs);
        if (bucketStart > now) break;
        const bucketEnd = new Date(bucketStart.getTime() + bucketMs);
        const endIso = bucketEnd > now ? now.toISOString() : bucketEnd.toISOString();
        const signups = countBetween("users", bucketStart.toISOString(), endIso);
        const rsvps = countBetween("attendances", bucketStart.toISOString(), endIso, "is_active = 1");
        cumulativeSignups += signups;
        cumulativeRsvps += rsvps;
        buckets.push({
          at: bucketStart.toISOString(),
          signups,
          rsvps,
          total: signups + rsvps,
          cumulativeSignups,
          cumulativeRsvps,
        });
      }
      return buckets;
    })();

    const liveEvents = storage.getEvents({ status: "LIVE" });
    const hiddenEvents = storage.getEvents({ status: "HIDDEN" });
    const unclaimedEvents = liveEvents.filter(e => e.isClaimable && !e.claimedBy).length;
    const claimedEvents = liveEvents.filter(e => !!e.claimedBy).length;
    const seededEvents = liveEvents.filter(e => e.source === "admin_seeded").length;
    const userSubmittedEvents = storage.countEventsBySource("user_submitted", "LIVE");

    const sourceRows = sqlite.prepare(`
      SELECT source, COUNT(*) AS count
      FROM events
      WHERE status = 'LIVE'
      GROUP BY source
      ORDER BY count DESC
    `).all() as Array<{ source: string; count: number }>;
    const sourceLabels: Record<string, string> = {
      admin_seeded: "Seeded",
      user_submitted: "Community",
    };
    const eventSources = sourceRows.map(row => ({
      label: sourceLabels[row.source] || row.source.replace(/_/g, " "),
      count: row.count,
    }));

    const directoryPlaces = storage.getBusinesses().length;
    const gigPosts = storage.getGigPosts("LIVE").length;
    const giftingPosts = storage.getGiftingPosts().length;
    const missedConnections = storage.getMissedConnections("ACTIVE").length;

    const contentBreakdown = [
      { label: "Events", count: liveEvents.length },
      { label: "Directory", count: directoryPlaces },
      { label: "GIFTZ", count: giftingPosts },
      { label: "GIGZ", count: gigPosts },
      { label: "MIZZED CONNECTION", count: missedConnections },
    ].sort((a, b) => b.count - a.count);

    const approvedPromoters = (sqlite.prepare(
      `SELECT COUNT(*) AS count FROM users WHERE promoter_status = 'approved'`,
    ).get() as { count: number })?.count ?? 0;

    return {
      generatedAt: now.toISOString(),
      users: counts.users ?? 0,
      newUsersToday: countSince("users", todayStart.toISOString()),
      newUsersThisWeek: countSince("users", weekStart.toISOString()),
      activeSessions: counts.express_sessions ?? 0,
      messages: storage.countActiveMessages(),
      liveEvents: liveEvents.length,
      hiddenEvents: hiddenEvents.length,
      userSubmittedEvents,
      seededEvents,
      attendances: counts.attendances ?? 0,
      attendancesThisWeek: countSince("attendances", weekStart.toISOString(), "is_active = 1"),
      pendingSubmissions: storage.getSubmissions("PENDING").length,
      pendingQueue: storage.getAdminPendingCount(),
      gigPosts,
      giftingPosts,
      missedConnections,
      directoryPlaces,
      unclaimedEvents,
      claimedEvents,
      approvedPromoters,
      pendingPromoterRequests: storage.getPendingPromoterRequests().length,
      signupsTrend14d: dailyTrend14d("users"),
      rsvpsTrend14d: dailyTrend14d("attendances", "is_active = 1"),
      memberGrowth12h,
      contentBreakdown,
      eventSources,
      conversions: {
        newSignupsThisWeek: countSince("users", weekStart.toISOString()),
        newSignupsPrevWeek: countBetween("users", prevWeekStart.toISOString(), weekStart.toISOString()),
        eventSubmissionsThisWeek: countSince("submissions", weekStart.toISOString(), "type IN ('NEW_EVENT', 'SUGGEST')"),
        eventSubmissionsPrevWeek: countBetween("submissions", prevWeekStart.toISOString(), weekStart.toISOString(), "type IN ('NEW_EVENT', 'SUGGEST')"),
        rsvpsThisWeek: countSince("attendances", weekStart.toISOString(), "is_active = 1"),
        rsvpsPrevWeek: countBetween("attendances", prevWeekStart.toISOString(), weekStart.toISOString(), "is_active = 1"),
      },
      traffic: getTrafficMetrics(sqlite, {
        source: "first_party",
        gaTrackingEnabled: false,
        gaReportingEnabled: false,
      }),
      productExperience: getProductExperienceMetrics(sqlite),
    };
  },
  resolveOwnerDeskItem(id, source = "desk") {
    const now = new Date().toISOString();
    if (source === "feedback") {
      storage.resolveFeedbackReport(id);
      return;
    }
    sqlite.prepare(`
      UPDATE owner_desk_items SET status = 'RESOLVED', resolved_at = ? WHERE id = ?
    `).run(now, id);
  },
  // Business directory
  getBusinesses(opts) {
    let rows = db.select().from(businesses).all().filter(b => b.active);
    if (opts?.type) rows = rows.filter(b => b.type === opts.type);
    if (opts?.neighborhood) rows = rows.filter(b => b.neighborhood === opts.neighborhood);
    if (opts?.queerOwned) rows = rows.filter(b => b.queerOwned);
    return rows;
  },
  searchGlobal(q) {
    const query = String(q || "").trim();
    if (query.length < 2) {
      return { q: query, events: [], places: [] };
    }
    const like = `%${query.replace(/[%_]/g, "")}%`;
    // LIVE events: title / venue / description
    const eventRows = sqlite.prepare(`
      SELECT id, title, venue_name AS venueName, day_of_week AS dayOfWeek, neighborhood
      FROM events
      WHERE status = 'LIVE'
        AND (
          title LIKE ? COLLATE NOCASE
          OR venue_name LIKE ? COLLATE NOCASE
          OR description LIKE ? COLLATE NOCASE
        )
      ORDER BY date_start ASC
      LIMIT 8
    `).all(like, like, like) as Array<{
      id: number;
      title: string;
      venueName: string;
      dayOfWeek: string | null;
      neighborhood: string | null;
    }>;
    // Active directory places: name / neighborhood / description
    const placeRows = sqlite.prepare(`
      SELECT id, name, neighborhood, type, description
      FROM businesses
      WHERE active = 1
        AND type != 'group'
        AND (
          name LIKE ? COLLATE NOCASE
          OR COALESCE(neighborhood, '') LIKE ? COLLATE NOCASE
          OR description LIKE ? COLLATE NOCASE
        )
      ORDER BY name COLLATE NOCASE ASC
      LIMIT 8
    `).all(like, like, like) as Array<{
      id: number;
      name: string;
      neighborhood: string | null;
      type: string;
      description: string;
    }>;
    return {
      q: query,
      events: eventRows.map((e) => ({
        id: e.id,
        title: e.title,
        subtitle: [e.venueName, e.dayOfWeek, e.neighborhood].filter(Boolean).join(" · "),
        href: eventPath(e.id, e.title, e.dayOfWeek),
      })),
      places: placeRows.map((p) => ({
        id: p.id,
        name: p.name,
        subtitle: [p.neighborhood, p.type].filter(Boolean).join(" · "),
        href: placePath(p.id, p.name),
      })),
    };
  },
  getBusiness(id) {
    return db.select().from(businesses).where(eq(businesses.id, id)).get();
  },
  createBusiness(data) {
    return db.insert(businesses).values({ ...data, createdAt: new Date().toISOString() }).returning().get();
  },
  updateBusiness(id, data) {
    db.update(businesses).set(data as any).where(eq(businesses.id, id)).run();
    return db.select().from(businesses).where(eq(businesses.id, id)).get();
  },
  toggleBusinessActive(id, active) {
    db.update(businesses).set({ active }).where(eq(businesses.id, id)).run();
  },
  getUserLinkedBusinesses(userId) {
    ensureEventHostsSchema();
    const user = db.select().from(users).where(eq(users.id, userId)).get();
    if (!user) return [];

    // All events this user is linked to: an event_hosts row, OR events.claimed_by = username,
    // OR events.submitted_by IN (email, username). Mirrors isUserEventHost's OR-logic, but
    // as a "give me all my events" query instead of a per-event check.
    const linkedEvents = sqlite.prepare(`
      SELECT DISTINCT e.id, e.venue_name AS venueName, e.address AS address, e.lat AS lat, e.lng AS lng
      FROM events e
      WHERE e.id IN (SELECT event_id FROM event_hosts WHERE user_id = ?)
         OR (e.claimed_by IS NOT NULL AND e.claimed_by = ?)
         OR (e.submitted_by IS NOT NULL AND (e.submitted_by = ? OR e.submitted_by = ?))
    `).all(userId, user.username, user.email, user.username) as Array<{
      id: number; venueName: string; address: string | null; lat: number | null; lng: number | null;
    }>;
    if (linkedEvents.length === 0) return [];

    const allBusinesses = storage.getBusinesses();
    const matched = new Map<number, { id: number; name: string; type: string; address: string | null }>();
    for (const evt of linkedEvents) {
      if (!evt.venueName) continue;
      for (const biz of allBusinesses) {
        if (matched.has(biz.id)) continue;
        if (eventMatchesBusiness(evt, biz)) {
          matched.set(biz.id, { id: biz.id, name: biz.name, type: biz.type, address: biz.address ?? null });
        }
      }
    }
    return Array.from(matched.values());
  },
  getUserOwnedBusinesses(userId) {
    return db.select().from(businesses).where(eq(businesses.ownerId, userId)).all().filter(b => b.active);
  },
  getAdminDirectoryBusinesses() {
    const rows = storage.getBusinesses()
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    return rows.map((biz) => {
      const owner = biz.ownerId ? storage.getUserById(biz.ownerId) : null;
      return {
        ...biz,
        ownerProfile: owner
          ? {
              id: owner.id,
              username: owner.username,
              displayName: owner.displayName ?? null,
              email: owner.email,
              photoUrl: owner.photoUrl ?? null,
              avatarChoice: owner.avatarChoice ?? 1,
              avatarRing: owner.avatarRing || "none",
            }
          : null,
      };
    });
  },
  assignBusinessOwner(businessId, userId) {
    const business = storage.getBusiness(businessId);
    if (!business) return { error: "Venue not found" };
    const user = storage.getUserById(userId);
    if (!user || user.status !== "active") return { error: "User not found" };
    db.update(businesses).set({ ownerId: userId } as any).where(eq(businesses.id, businessId)).run();
    const fresh = storage.getBusiness(businessId);
    return { ok: true, business: fresh };
  },
  clearBusinessOwner(businessId) {
    const business = storage.getBusiness(businessId);
    if (!business) return { error: "Venue not found" };
    db.update(businesses).set({ ownerId: null } as any).where(eq(businesses.id, businessId)).run();
    const fresh = storage.getBusiness(businessId);
    return { ok: true, business: fresh };
  },
  createBusinessClaim(businessId, userId, claimReason, opts) {
    ensureBusinessClaimsSchema();
    const business = storage.getBusiness(businessId);
    if (!business) return { error: "Business not found" };
    if (business.ownerId) return { error: "This venue already has an owner." };
    const existingPending = db.select().from(businessClaims)
      .where(eq(businessClaims.businessId, businessId)).all()
      .find(c => c.userId === userId && c.status === "PENDING");
    if (existingPending) return { error: "You already have a pending claim on this venue." };
    const adminNotes = opts?.mergePayload
      ? JSON.stringify({ mergePayload: opts.mergePayload })
      : null;
    const claim = db.insert(businessClaims).values({
      businessId, userId, claimReason, status: "PENDING", adminNotes, createdAt: new Date().toISOString(),
    }).returning().get();
    return { claim };
  },
  getPendingBusinessClaims() {
    const rows = db.select().from(businessClaims).where(eq(businessClaims.status, "PENDING")).all();
    return rows.map(claim => {
      const business = storage.getBusiness(claim.businessId);
      const user = db.select().from(users).where(eq(users.id, claim.userId)).get();
      return {
        ...claim,
        businessName: business?.name ?? "Unknown venue",
        username: user?.username ?? null,
        displayName: user?.displayName ?? null,
        email: user?.email ?? null,
      };
    });
  },
  getRecentResolvedBusinessClaims() {
    const cutoff = recentQueueCutoffIso();
    const rows = db.select().from(businessClaims).all()
      .filter((claim) => claim.status !== "PENDING" && claim.createdAt >= cutoff)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 60);
    return rows.map(claim => {
      const business = storage.getBusiness(claim.businessId);
      const user = db.select().from(users).where(eq(users.id, claim.userId)).get();
      return {
        ...claim,
        businessName: business?.name ?? "Unknown venue",
        username: user?.username ?? null,
        displayName: user?.displayName ?? null,
        email: user?.email ?? null,
      };
    });
  },
  approveBusinessClaim(id, adminName) {
    const claim = db.select().from(businessClaims).where(eq(businessClaims.id, id)).get();
    if (!claim) return { error: "Claim not found" };
    if (claim.status !== "PENDING") return { error: "Claim already resolved" };
    let mergePatch: Record<string, unknown> = {};
    if (claim.adminNotes) {
      try {
        const parsed = JSON.parse(claim.adminNotes);
        if (parsed?.mergePayload && typeof parsed.mergePayload === "object") {
          mergePatch = parsed.mergePayload;
        }
      } catch {
        // claimReason-only claims have no merge payload
      }
    }
    const ownerPatch: Record<string, unknown> = { ownerId: claim.userId, ...mergePatch };
    db.update(businesses).set(ownerPatch as any).where(eq(businesses.id, claim.businessId)).run();
    db.update(businessClaims).set({
      status: "APPROVED",
      adminNotes: `Approved by ${adminName}`,
    }).where(eq(businessClaims.id, id)).run();
    notifyGuideInbox(
      claim.userId,
      "Venue claim approved",
      "You're now the owner of your venue. Manage it from your Hub.",
      { contextType: "GUIDE_UPDATE" },
    );
    return { ok: true };
  },
  rejectBusinessClaim(id, reason) {
    db.update(businessClaims).set({
      status: "REJECTED",
      adminNotes: reason ?? null,
    }).where(eq(businessClaims.id, id)).run();
    const claim = db.select().from(businessClaims).where(eq(businessClaims.id, id)).get();
    if (claim) {
      notifyGuideInbox(
        claim.userId,
        "Venue claim update",
        "Your venue claim wasn't approved. Reach out via Contact if you think this was a mistake.",
        { contextType: "GUIDE_UPDATE" },
      );
    }
  },
  createBusinessSubmission(userId, data) {
    ensureBusinessSubmissionsSchema();
    return db.insert(businessSubmissions).values({
      userId,
      name: data.name,
      type: data.type || "bar",
      description: data.description,
      address: data.address ?? null,
      neighborhood: data.neighborhood ?? null,
      hours: data.hours ?? null,
      phone: data.phone ?? null,
      website: data.website ?? null,
      instagram: data.instagram ?? null,
      logoImageUrl: data.logoImageUrl ?? null,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    }).returning().get();
  },
  getPendingBusinessSubmissions() {
    return db.select().from(businessSubmissions).where(eq(businessSubmissions.status, "PENDING")).all();
  },
  getRecentResolvedBusinessSubmissions() {
    const cutoff = recentQueueCutoffIso();
    return db.select().from(businessSubmissions).all()
      .filter((sub) => sub.status !== "PENDING" && sub.createdAt >= cutoff)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 60);
  },
  approveBusinessSubmission(id, adminName, overrideImageUrl) {
    const sub = db.select().from(businessSubmissions).where(eq(businessSubmissions.id, id)).get();
    if (!sub) return { error: "Submission not found" };
    if (sub.status !== "PENDING") return { error: "Submission already resolved" };
    const business = db.insert(businesses).values({
      name: sub.name,
      type: sub.type,
      description: sub.description,
      address: sub.address,
      neighborhood: sub.neighborhood,
      hours: sub.hours,
      phone: sub.phone,
      website: sub.website,
      instagram: sub.instagram,
      imageUrl: overrideImageUrl ?? null,
      queerOwned: false,
      queerFriendly: true,
      active: true,
      isNew: false,
      ownerId: sub.userId,
      createdAt: new Date().toISOString(),
    }).returning().get();
    db.update(businessSubmissions).set({
      status: "APPROVED",
      adminNotes: `Approved by ${adminName}`,
      createdBusinessId: business.id,
    }).where(eq(businessSubmissions.id, id)).run();
    notifyGuideInbox(
      sub.userId,
      "New venue approved",
      `${sub.name} is now live in the directory, and you're its owner.`,
      { contextType: "GUIDE_UPDATE" },
    );
    return { business };
  },
  rejectBusinessSubmission(id, reason) {
    db.update(businessSubmissions).set({
      status: "REJECTED",
      adminNotes: reason ?? null,
    }).where(eq(businessSubmissions.id, id)).run();
    const sub = db.select().from(businessSubmissions).where(eq(businessSubmissions.id, id)).get();
    if (sub) {
      notifyGuideInbox(
        sub.userId,
        "New venue submission update",
        "Your new-business submission wasn't approved. Reach out via Contact for details.",
        { contextType: "GUIDE_UPDATE" },
      );
    }
  },
  getPromotersForBusiness(businessId) {
    const business = storage.getBusiness(businessId);
    if (!business) return [];
    const liveEvents = storage.getEvents({ status: "LIVE" });
    const userIds = new Set<number>();
    const results: { id: number; username: string; displayName: string | null }[] = [];
    for (const evt of liveEvents) {
      if (!eventMatchesBusiness(evt, business)) continue;
      const candidates: string[] = [];
      if (evt.claimedBy) candidates.push(evt.claimedBy);
      if (evt.submittedBy) candidates.push(evt.submittedBy);
      const hostRows = sqlite.prepare(`SELECT user_id AS userId FROM event_hosts WHERE event_id = ?`).all(evt.id) as { userId: number }[];
      for (const host of hostRows) {
        if (userIds.has(host.userId)) continue;
        const u = db.select().from(users).where(eq(users.id, host.userId)).get();
        if (u) { userIds.add(u.id); results.push({ id: u.id, username: u.username, displayName: u.displayName ?? null }); }
      }
      for (const identifier of candidates) {
        const u = db.select().from(users).where(eq(users.username, identifier)).get()
          ?? db.select().from(users).where(eq(users.email, identifier)).get();
        if (u && !userIds.has(u.id)) { userIds.add(u.id); results.push({ id: u.id, username: u.username, displayName: u.displayName ?? null }); }
      }
    }
    return results;
  },
  blockPromoterFromBusiness(businessId, blockedUserId, createdByUserId) {
    ensureBusinessBlocksSchema();
    const business = storage.getBusiness(businessId);
    if (!business) return { error: "Business not found" };
    try {
      sqlite.prepare(`
        INSERT INTO business_blocks (business_id, blocked_user_id, created_by_user_id, created_at)
        VALUES (?, ?, ?, ?)
      `).run(businessId, blockedUserId, createdByUserId, new Date().toISOString());
    } catch {
      return { error: "This promoter is already blocked." };
    }
    // Flag the blocked user's existing events at this venue for admin review.
    const blockedUser = db.select().from(users).where(eq(users.id, blockedUserId)).get();
    if (blockedUser) {
      const liveEvents = storage.getEvents({ status: "LIVE" });
      for (const evt of liveEvents) {
        if (!eventMatchesBusiness(evt, business)) continue;
        const isHost = storage.isUserEventHost(evt.id, blockedUserId)
          || evt.claimedBy === blockedUser.username
          || evt.submittedBy === blockedUser.email
          || evt.submittedBy === blockedUser.username;
        if (!isHost) continue;
        storage.createModerationRequest({
          type: "FLAGGED_BY_OWNER",
          eventId: evt.id,
          eventTitle: evt.title,
          requesterName: "Venue owner",
          requesterEmail: "",
          proof: `Venue owner blocked @${blockedUser.username} from ${business.name}, this existing listing needs review.`,
        } as any);
      }
    }
    return { ok: true };
  },
  unblockPromoterFromBusiness(businessId, blockedUserId) {
    sqlite.prepare(`DELETE FROM business_blocks WHERE business_id = ? AND blocked_user_id = ?`).run(businessId, blockedUserId);
  },
  isPromoterBlockedFromBusiness(businessId, userId) {
    return !!sqlite.prepare(`SELECT 1 FROM business_blocks WHERE business_id = ? AND blocked_user_id = ?`).get(businessId, userId);
  },
  getBlockedBusinessMatch(userId, venueLike) {
    const blockedBusinessIds = (sqlite.prepare(`SELECT business_id AS businessId FROM business_blocks WHERE blocked_user_id = ?`).all(userId) as Array<{ businessId: number }>).map(r => r.businessId);
    if (blockedBusinessIds.length === 0) return null;
    for (const businessId of blockedBusinessIds) {
      const business = storage.getBusiness(businessId);
      if (business && eventMatchesBusiness(venueLike, business)) return business;
    }
    return null;
  },
  getBusinessBlocks(businessId) {
    const rows = sqlite.prepare(`SELECT * FROM business_blocks WHERE business_id = ?`).all(businessId) as Array<{ blocked_user_id: number; created_at: string }>;
    return rows.map(row => {
      const u = db.select().from(users).where(eq(users.id, row.blocked_user_id)).get();
      return { userId: row.blocked_user_id, username: u?.username ?? null, displayName: u?.displayName ?? null, createdAt: row.created_at };
    });
  },
  createBusinessLogoRequest(businessId, userId, imageUrl) {
    ensureBusinessLogoRequestsSchema();
    return db.insert(businessLogoRequests).values({
      businessId, userId, imageUrl, status: "PENDING", createdAt: new Date().toISOString(),
    }).returning().get();
  },
  getPendingBusinessLogoRequests() {
    const rows = db.select().from(businessLogoRequests).where(eq(businessLogoRequests.status, "PENDING")).all();
    return rows.map(req => {
      const business = storage.getBusiness(req.businessId);
      return { ...req, businessName: business?.name ?? "Unknown venue" };
    });
  },
  getRecentResolvedBusinessLogoRequests() {
    const cutoff = recentQueueCutoffIso();
    const rows = db.select().from(businessLogoRequests).all()
      .filter((req) => req.status !== "PENDING" && req.createdAt >= cutoff)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 60);
    return rows.map(req => {
      const business = storage.getBusiness(req.businessId);
      return { ...req, businessName: business?.name ?? "Unknown venue" };
    });
  },
  approveBusinessLogoRequest(id, overrideImageUrl) {
    const req = db.select().from(businessLogoRequests).where(eq(businessLogoRequests.id, id)).get();
    if (!req) return { error: "Request not found" };
    if (req.status !== "PENDING") return { error: "Request already resolved" };
    db.update(businesses).set({ imageUrl: overrideImageUrl ?? req.imageUrl }).where(eq(businesses.id, req.businessId)).run();
    db.update(businessLogoRequests).set({ status: "APPROVED" }).where(eq(businessLogoRequests.id, id)).run();
    notifyGuideInbox(req.userId, "Logo updated", "Your venue's new logo is live in the directory.", { contextType: "GUIDE_UPDATE" });
    return { ok: true };
  },
  rejectBusinessLogoRequest(id, reason) {
    db.update(businessLogoRequests).set({ status: "REJECTED", adminNotes: reason ?? null }).where(eq(businessLogoRequests.id, id)).run();
    const req = db.select().from(businessLogoRequests).where(eq(businessLogoRequests.id, id)).get();
    if (req) notifyGuideInbox(req.userId, "Logo update", "Your submitted logo wasn't used. Reach out via Contact for details.", { contextType: "GUIDE_UPDATE" });
  },

  expireRiverBratsCheckins() {
    const now = new Date().toISOString();
    sqlite.prepare(`UPDATE beach_checkins SET is_active = 0 WHERE is_active = 1 AND expires_at <= ?`).run(now);
  },
  getBeachCheckins(beachId: string, calendarDate: string, viewerUserId?: number) {
    storage.expireRiverBratsCheckins();
    const rows = sqlite.prepare(`
      SELECT c.id, c.user_id AS userId, c.beach_id AS beachId, c.arrival_hour AS arrival_hour,
             c.depart_hour AS depart_hour, c.note, c.calendar_date AS calendarDate, c.is_anonymous AS isAnonymous,
             c.is_active AS isActive, c.expires_at AS expiresAt, c.created_at AS createdAt,
             c.presence, c.gps_verified_at AS gpsVerifiedAt,
             u.username, u.display_name AS displayName, u.avatar_choice AS avatarChoice, u.photo_url AS photoUrl
      FROM beach_checkins c
      JOIN users u ON u.id = c.user_id
      WHERE c.beach_id = ? AND c.calendar_date = ? AND c.is_active = 1
      ORDER BY c.arrival_hour ASC, c.created_at ASC
    `).all(beachId, calendarDate) as any[];
    const visibleRows = viewerUserId == null
      ? rows
      : rows.filter((r: any) => r.userId === viewerUserId || !storage.isMemberInteractionBlocked(viewerUserId, r.userId));
    const viewerCheckedIn = viewerUserId != null && visibleRows.some((r: any) => r.userId === viewerUserId);
    return visibleRows.map((r: any) => {
      const isSelf = viewerUserId != null && r.userId === viewerUserId;
      const isAnonymous = Boolean(r.isAnonymous);
      if (!viewerCheckedIn && !isSelf) {
        return {
          ...r,
          username: "anonymous",
          displayName: "Anonymous",
          photoUrl: null,
          avatarChoice: null,
          isAnonymous: true,
          masked: true,
        };
      }
      if (isAnonymous && !isSelf) {
        return {
          ...r,
          username: "anonymous",
          displayName: "Anonymous",
          photoUrl: null,
          avatarChoice: null,
          isAnonymous: true,
          masked: true,
        };
      }
      return { ...r, isAnonymous, masked: false, isMine: isSelf };
    });
  },
  getBeachCheckinByUser(beachId: string, userId: number, calendarDate: string) {
    storage.expireRiverBratsCheckins();
    return sqlite.prepare(`
      SELECT * FROM beach_checkins
      WHERE beach_id = ? AND user_id = ? AND calendar_date = ? AND is_active = 1
    `).get(beachId, userId, calendarDate) as BeachCheckin | undefined;
  },
  getBeachCheckinsByUser(userId: number) {
    storage.expireRiverBratsCheckins();
    const rows = sqlite.prepare(`
      SELECT id, beach_id AS beachId, calendar_date AS calendarDate,
             arrival_hour AS arrivalHour, depart_hour AS departHour,
             note, presence, is_anonymous AS isAnonymous
      FROM beach_checkins
      WHERE user_id = ? AND is_active = 1
      ORDER BY calendar_date ASC, arrival_hour ASC
    `).all(userId) as any[];
    return rows.map((r: any) => ({
      id: Number(r.id),
      beachId: String(r.beachId),
      calendarDate: String(r.calendarDate),
      arrivalHour: Number(r.arrivalHour),
      departHour: r.departHour == null ? null : Number(r.departHour),
      note: r.note ?? null,
      presence: String(r.presence || "PLANNED"),
      isAnonymous: Boolean(r.isAnonymous),
    }));
  },
  upsertBeachCheckin(data: InsertBeachCheckin & { isAnonymous?: boolean }) {
    const createdAt = new Date().toISOString();
    // Chat access: end of beach day + 12h (multi-day check-ins each set their own expires_at).
    const expiresAt = riverBratsChatClosesAtIso(data.calendarDate);
    const isAnonymous = Boolean(data.isAnonymous);
    const existing = sqlite.prepare(`
      SELECT id FROM beach_checkins WHERE user_id = ? AND beach_id = ? AND calendar_date = ?
    `).get(data.userId, data.beachId, data.calendarDate) as { id: number } | undefined;
    let saved: BeachCheckin;
    const departHour = data.departHour ?? null;
    if (existing) {
      // Re-picking an hour must not revoke GPS-verified presence, so
      // presence/gps_verified_at are deliberately absent from this SET.
      sqlite.prepare(`
        UPDATE beach_checkins
        SET arrival_hour = ?, depart_hour = ?, note = ?, is_anonymous = ?, is_active = 1, expires_at = ?, created_at = ?
        WHERE id = ?
      `).run(data.arrivalHour, departHour, data.note || null, isAnonymous ? 1 : 0, expiresAt, createdAt, existing.id);
      saved = db.select().from(beachCheckins).where(eq(beachCheckins.id, existing.id)).get()!;
    } else {
      saved = db.insert(beachCheckins).values({
        ...data,
        departHour,
        isAnonymous,
        isActive: true,
        reportCount: 0,
        expiresAt,
        createdAt,
      } as any).returning().get();
    }
    storage.scheduleBeachArrivalPrompt(saved);
    return saved;
  },
  deleteBeachCheckin(id: number, userId: number) {
    const row = db.select().from(beachCheckins).where(eq(beachCheckins.id, id)).get();
    if (!row || row.userId !== userId) return false;
    db.update(beachCheckins).set({ isActive: false } as any).where(eq(beachCheckins.id, id)).run();
    storage.cancelBeachArrivalPrompts(userId, row.beachId, row.calendarDate);
    return true;
  },
  verifyBeachPresence(userId: number, beachId: string, calendarDate: string, lat: number, lng: number) {
    // Coordinates are compared against the beach anchor and discarded -
    // never written to the database or logs.
    const mine = storage.getBeachCheckinByUser(beachId, userId, calendarDate);
    if (!mine) return { ok: false as const, error: "NO_CHECKIN" as const };
    const anchor = BEACH_VERIFY_POINTS[beachId as keyof typeof BEACH_VERIFY_POINTS];
    if (!anchor) return { ok: false as const, error: "NO_CHECKIN" as const };
    const distanceM = haversineMeters({ lat, lng }, anchor);
    if (distanceM > anchor.radiusM) {
      // Round so even the error response reveals nothing precise.
      return { ok: false as const, error: "TOO_FAR" as const, distanceM: Math.max(100, Math.round(distanceM / 100) * 100) };
    }
    const verifiedAt = new Date().toISOString();
    sqlite.prepare(`UPDATE beach_checkins SET presence = 'HERE', gps_verified_at = ? WHERE id = ?`).run(verifiedAt, mine.id);
    storage.cancelBeachArrivalPrompts(userId, beachId, calendarDate);
    return { ok: true as const, presence: "HERE" as const, gpsVerifiedAt: verifiedAt };
  },
  scheduleBeachArrivalPrompt(checkin: BeachCheckin) {
    const nowIso = new Date().toISOString();
    sqlite.prepare(`
      UPDATE scheduled_prompts SET status = 'CANCELLED'
      WHERE user_id = ? AND kind = 'BEACH_ARRIVAL' AND beach_id = ? AND calendar_date = ? AND status = 'PENDING'
    `).run(checkin.userId, checkin.beachId, checkin.calendarDate);
    if ((checkin as any).presence === "HERE") return;
    const fireAt = riverBratsArrivalPromptIso(checkin.calendarDate, checkin.arrivalHour);
    if (fireAt <= nowIso) return; // arriving now/past - no prompt needed
    sqlite.prepare(`
      INSERT INTO scheduled_prompts (user_id, kind, fire_at, beach_id, calendar_date, checkin_id, status, created_at)
      VALUES (?, 'BEACH_ARRIVAL', ?, ?, ?, ?, 'PENDING', ?)
    `).run(checkin.userId, fireAt, checkin.beachId, checkin.calendarDate, checkin.id, nowIso);
  },
  cancelBeachArrivalPrompts(userId: number, beachId: string, calendarDate: string) {
    sqlite.prepare(`
      UPDATE scheduled_prompts SET status = 'CANCELLED'
      WHERE user_id = ? AND kind = 'BEACH_ARRIVAL' AND beach_id = ? AND calendar_date = ? AND status = 'PENDING'
    `).run(userId, beachId, calendarDate);
  },
  markPromptSkipped(promptId: number) {
    sqlite.prepare(`UPDATE scheduled_prompts SET status = 'SKIPPED' WHERE id = ?`).run(promptId);
  },
  claimDuePrompts(nowIso: string, limit = 25) {
    // Single-process sqlite: select-then-mark inside one transaction is race-free.
    const claim = sqlite.transaction((iso: string) => {
      const due = sqlite.prepare(`
        SELECT * FROM scheduled_prompts
        WHERE status = 'PENDING' AND fire_at <= ?
        ORDER BY fire_at ASC
        LIMIT ?
      `).all(iso, limit) as any[];
      if (due.length) {
        const mark = sqlite.prepare(`UPDATE scheduled_prompts SET status = 'SENT' WHERE id = ?`);
        for (const row of due) mark.run(row.id);
      }
      return due;
    });
    return claim(nowIso);
  },
  purgeExpiredChatMessages(now = Date.now()) {
    // Hard-delete group chat content CHAT_RETENTION_DAYS after the chat closes.
    const retentionMs = CHAT_RETENTION_DAYS * 86_400_000;
    // Beach messages: drop rows whose day closed (+ linger) more than retention ago.
    const beachCutoff = pacificTodayDate(now - retentionMs - 12 * 60 * 60 * 1000);
    sqlite.prepare(`DELETE FROM beach_chat_messages WHERE calendar_date < ?`).run(beachCutoff);
    // Event rooms: window math lives in JS (Pacific-local text dates).
    const eventIds = sqlite.prepare(`SELECT DISTINCT event_id AS eventId FROM event_chat_messages`).all() as Array<{ eventId: number }>;
    for (const { eventId } of eventIds) {
      const evt = storage.getEvent(eventId);
      const win = evt ? getEventChatWindow(evt.dateStart, evt.dateEnd) : null;
      const closesAt = win ? win.closesAt : null;
      if (!evt || (closesAt != null && now > closesAt + retentionMs)) {
        sqlite.prepare(`DELETE FROM event_chat_messages WHERE event_id = ?`).run(eventId);
      }
    }
    // Hygiene: drop settled prompt rows after 30 days.
    const promptCutoff = new Date(now - 30 * 86_400_000).toISOString();
    sqlite.prepare(`DELETE FROM scheduled_prompts WHERE status != 'PENDING' AND created_at < ?`).run(promptCutoff);
  },
  getMyGroupChats(userId: number) {
    const now = Date.now();
    const nowIso = new Date(now).toISOString();
    const out: any[] = [];
    // Event rooms: active attendance, window not closed.
    const attRows = sqlite.prepare(`
      SELECT a.event_id AS eventId FROM attendances a
      WHERE a.user_id = ? AND a.is_active = 1
    `).all(userId) as Array<{ eventId: number }>;
    const hostRows = sqlite.prepare(`
      SELECT event_id AS eventId FROM event_hosts WHERE user_id = ?
    `).all(userId) as Array<{ eventId: number }>;
    const seen = new Set<number>();
    for (const { eventId } of [...attRows, ...hostRows]) {
      if (seen.has(eventId)) continue;
      seen.add(eventId);
      const evt = storage.getEvent(eventId);
      if (!evt || evt.status !== "LIVE") continue;
      const win = getEventChatWindow(evt.dateStart, evt.dateEnd, now);
      if (!win || win.state === "CLOSED") continue;
      out.push({
        kind: "EVENT",
        id: eventId,
        title: evt.title,
        state: win.state,
        opensAt: new Date(win.opensAt).toISOString(),
        closesAt: new Date(win.closesAt).toISOString(),
        href: `/events/${eventId}?chat=1`,
      });
    }
    // Beach rooms: one unified group chat per beach. Open the moment you check
    // in (non-anon); stays until 12h after the end of your last beach day.
    const beachRows = sqlite.prepare(`
      SELECT beach_id AS beachId, calendar_date AS calendarDate FROM beach_checkins
      WHERE user_id = ? AND is_active = 1
        AND COALESCE(is_anonymous, 0) = 0
    `).all(userId) as Array<{ beachId: string; calendarDate: string }>;
    const byBeach = new Map<string, string[]>();
    for (const { beachId, calendarDate } of beachRows) {
      const list = byBeach.get(beachId) || [];
      list.push(calendarDate);
      byBeach.set(beachId, list);
    }
    for (const [beachId, dates] of byBeach) {
      const access = riverBratsChatAccessFromDates(dates, now);
      if (!access.open || !access.closesAt) continue;
      // Prefer today's date in href, else earliest upcoming check-in day.
      const today = pacificTodayDate(now);
      const sorted = [...dates].sort();
      const hrefDate = sorted.find(d => d >= today) || sorted[sorted.length - 1];
      out.push({
        kind: "BEACH",
        id: beachId,
        title: beachVenueLabel(beachId as any),
        state: "OPEN" as const,
        opensAt: access.opensAt || nowIso,
        closesAt: access.closesAt,
        calendarDate: hrefDate,
        goingDates: sorted,
        href: `/nude-beaches?tab=${beachId}&chat=1&date=${hrefDate}`,
      });
    }
    out.sort((a, b) => String(a.closesAt).localeCompare(String(b.closesAt)));
    return out;
  },
  /** Active non-anon check-in dates for a user at a beach (still in access window). */
  getBeachChatDatesForUser(beachId: string, userId: number): string[] {
    storage.expireRiverBratsCheckins();
    const nowIso = new Date().toISOString();
    const rows = sqlite.prepare(`
      SELECT calendar_date AS calendarDate FROM beach_checkins
      WHERE beach_id = ? AND user_id = ? AND is_active = 1
        AND COALESCE(is_anonymous, 0) = 0
        AND (expires_at IS NULL OR expires_at > ?)
      ORDER BY calendar_date ASC
    `).all(beachId, userId, nowIso) as Array<{ calendarDate: string }>;
    return rows.map(r => String(r.calendarDate));
  },
  /**
   * Unified beach group chat: one room per beach for everyone currently checked in
   * (any day still in access window). Chat opens on check-in; access ends 12h after
   * the end of each person's last beach day.
   */
  getBeachChatMessages(beachId: string, calendarDate: string, viewerUserId: number) {
    storage.expireRiverBratsCheckins();
    const myDates = storage.getBeachChatDatesForUser(beachId, viewerUserId);
    const access = riverBratsChatAccessFromDates(myDates);
    // Anonymous / no check-in: locked (no message history for non-members)
    if (!myDates.length || !access.open) {
      return {
        messages: [],
        expiresAt: access.closesAt,
        opensAt: access.opensAt,
        chatOpen: false,
        members: [] as any[],
        goingDates: myDates,
      };
    }

    // Message history: recent days at this beach (unified room)
    const historyFrom = addCalendarDays(pacificTodayDate(), -14);
    const rows = sqlite.prepare(`
      SELECT m.id, m.beach_id AS beachId, m.calendar_date AS calendarDate, m.user_id AS userId,
             m.body, m.is_anonymous AS isAnonymous, m.created_at AS createdAt,
             u.username, u.display_name AS displayName, u.photo_url AS photoUrl,
             u.avatar_choice AS avatarChoice, u.avatar_ring AS avatarRing
      FROM beach_chat_messages m
      LEFT JOIN users u ON u.id = m.user_id
      WHERE m.beach_id = ? AND m.calendar_date >= ?
      ORDER BY m.created_at ASC
      LIMIT 300
    `).all(beachId, historyFrom) as any[];

    // Roster: all non-anon users with active access at this beach + their days
    const nowIso = new Date().toISOString();
    const rosterRows = sqlite.prepare(`
      SELECT c.user_id AS userId, c.calendar_date AS calendarDate,
             u.username, u.display_name AS displayName, u.photo_url AS photoUrl,
             u.avatar_choice AS avatarChoice, u.avatar_ring AS avatarRing
      FROM beach_checkins c
      JOIN users u ON u.id = c.user_id
      WHERE c.beach_id = ? AND c.is_active = 1
        AND COALESCE(c.is_anonymous, 0) = 0
        AND (c.expires_at IS NULL OR c.expires_at > ?)
      ORDER BY c.calendar_date ASC
    `).all(beachId, nowIso) as any[];
    const memberMap = new Map<number, {
      userId: number;
      username: string;
      displayName: string;
      photoUrl: string | null;
      avatarChoice: number | null;
      avatarRing: string | null;
      goingDates: string[];
    }>();
    for (const r of rosterRows) {
      const uid = Number(r.userId);
      let m = memberMap.get(uid);
      if (!m) {
        m = {
          userId: uid,
          username: r.username,
          displayName: r.displayName || r.username,
          photoUrl: r.photoUrl,
          avatarChoice: r.avatarChoice,
          avatarRing: r.avatarRing,
          goingDates: [],
        };
        memberMap.set(uid, m);
      }
      const d = String(r.calendarDate);
      if (!m.goingDates.includes(d)) m.goingDates.push(d);
    }
    const members = [...memberMap.values()].map(m => ({
      ...m,
      goingChips: m.goingDates.map(d => ({
        date: d,
        label: formatBeachGoingChip(d),
        dayCode: pacificWeekdayCode(d),
      })),
    }));
    const datesByUser = new Map([...memberMap.entries()].map(([id, m]) => [id, m.goingDates]));

    const visibleRows = rows.filter(row => row.userId === viewerUserId || !storage.isMemberInteractionBlocked(viewerUserId, row.userId));
    const messages = visibleRows.map(row => {
      const isSelf = row.userId === viewerUserId;
      const anonymous = Boolean(row.isAnonymous);
      const goingDates = datesByUser.get(Number(row.userId)) || [];
      const goingChips = goingDates.map(d => ({
        date: d,
        label: formatBeachGoingChip(d),
        dayCode: pacificWeekdayCode(d),
      }));
      if (anonymous && !isSelf) {
        return {
          id: row.id,
          body: row.body,
          isAnonymous: true,
          createdAt: row.createdAt,
          displayName: "Anonymous",
          username: "anonymous",
          photoUrl: null,
          avatarChoice: null,
          avatarRing: null,
          isMine: false,
          goingDates: [] as string[],
          goingChips: [] as typeof goingChips,
        };
      }
      return {
        id: row.id,
        body: row.body,
        isAnonymous: anonymous,
        createdAt: row.createdAt,
        displayName: row.displayName || row.username,
        username: row.username,
        photoUrl: row.photoUrl,
        avatarChoice: row.avatarChoice,
        avatarRing: row.avatarRing,
        isMine: isSelf,
        goingDates,
        goingChips,
      };
    });
    return {
      messages,
      expiresAt: access.closesAt,
      opensAt: access.opensAt,
      chatOpen: true,
      members: members.filter(member => !storage.isMemberInteractionBlocked(viewerUserId, member.userId)),
      goingDates: myDates,
    };
  },
  postBeachChatMessage(beachId: string, calendarDate: string, userId: number, body: string) {
    const myDates = storage.getBeachChatDatesForUser(beachId, userId);
    if (!myDates.length) throw new Error("Active check-in required");
    const access = riverBratsChatAccessFromDates(myDates);
    if (!access.open) throw new Error("Beach chat closed — check-in again for an upcoming day");
    // Stamp message with selected day if they're going that day, else earliest active day
    const stampDate = myDates.includes(calendarDate) ? calendarDate : myDates[0];
    const createdAt = new Date().toISOString();
    const row = sqlite.prepare(`
      INSERT INTO beach_chat_messages (beach_id, calendar_date, user_id, body, is_anonymous, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(beachId, stampDate, userId, body, 0, createdAt);
    const id = Number(row.lastInsertRowid);
    const user = storage.getUserById(userId);
    return {
      id,
      body,
      isAnonymous: false,
      createdAt,
      isMine: true,
      displayName: user?.displayName || user?.username || "You",
      username: user?.username,
      goingDates: myDates,
      goingChips: myDates.map(d => ({
        date: d,
        label: formatBeachGoingChip(d),
        dayCode: pacificWeekdayCode(d),
      })),
    };
  },

  expireBeachCarpoolPosts() {
    const now = new Date().toISOString();
    sqlite.prepare(`UPDATE beach_carpool_posts SET status = 'EXPIRED' WHERE status = 'OPEN' AND expires_at <= ?`).run(now);
  },
  getBeachCarpoolPosts(beachId: string, tripDate: string, viewerUserId?: number) {
    storage.expireBeachCarpoolPosts();
    const rows = sqlite.prepare(`
      SELECT p.*, u.username, u.display_name AS displayName, u.avatar_choice AS avatarChoice, u.photo_url AS photoUrl
      FROM beach_carpool_posts p
      JOIN users u ON u.id = p.user_id
      WHERE p.beach_id = ? AND p.trip_date = ? AND p.status = 'OPEN'
      ORDER BY p.leave_hour ASC, p.created_at DESC
    `).all(beachId, tripDate) as any[];
    const visibleRows = viewerUserId == null
      ? rows
      : rows.filter(row => row.user_id === viewerUserId || !storage.isMemberInteractionBlocked(viewerUserId, row.user_id));
    return visibleRows.map(row => ({
      ...row,
      direction: row.direction || "TO_BEACH",
      isMine: viewerUserId != null && row.user_id === viewerUserId,
      requestCount: Number((sqlite.prepare(`SELECT COUNT(*) AS c FROM beach_carpool_requests WHERE post_id = ? AND status = 'INTERESTED'`).get(row.id) as { c: number })?.c || 0),
    }));
  },
  getBeachCarpoolPost(id: number) {
    return sqlite.prepare(`SELECT * FROM beach_carpool_posts WHERE id = ?`).get(id) as any;
  },
  createBeachCarpoolPost(data: InsertBeachCarpoolPost) {
    const createdAt = new Date().toISOString();
    const expiresAt = pacificMidnightIso(data.tripDate);
    return db.insert(beachCarpoolPosts).values({
      ...data,
      direction: data.direction || "TO_BEACH",
      status: "OPEN",
      reportCount: 0,
      expiresAt,
      createdAt,
    } as any).returning().get();
  },
  deleteBeachCarpoolPost(id: number, userId: number) {
    const post = storage.getBeachCarpoolPost(id);
    if (!post || post.user_id !== userId) return false;
    db.update(beachCarpoolPosts).set({ status: "REMOVED" } as any).where(eq(beachCarpoolPosts.id, id)).run();
    return true;
  },
  requestBeachCarpool(postId: number, userId: number, note: string) {
    const post = storage.getBeachCarpoolPost(postId);
    if (!post || post.status !== "OPEN") throw new Error("Post not found");
    if (post.user_id === userId) throw new Error("Cannot request your own post");
    if (storage.isMemberInteractionBlocked(userId, post.user_id)) {
      throw Object.assign(new Error("Member interaction blocked"), { status: 403, code: "MEMBER_BLOCKED" });
    }
    const count = sqlite.prepare(`SELECT COUNT(*) AS c FROM beach_carpool_requests WHERE post_id = ? AND status = 'INTERESTED'`).get(postId) as { c: number };
    if (count.c >= 3) throw new Error("This ride already has 3 requests");
    const dup = sqlite.prepare(`SELECT id FROM beach_carpool_requests WHERE post_id = ? AND user_id = ? AND status = 'INTERESTED'`).get(postId, userId);
    if (dup) throw new Error("You already requested this ride");
    const createdAt = new Date().toISOString();
    return db.insert(beachCarpoolRequests).values({
      postId,
      userId,
      note,
      status: "INTERESTED",
      createdAt,
    } as any).returning().get();
  },
  selectBeachCarpoolRequest(postId: number, requestId: number, posterUserId: number) {
    const post = storage.getBeachCarpoolPost(postId);
    if (!post || post.user_id !== posterUserId) throw new Error("Not your post");
    const req = sqlite.prepare(`SELECT * FROM beach_carpool_requests WHERE id = ? AND post_id = ?`).get(requestId, postId) as any;
    if (!req || req.status !== "INTERESTED") throw new Error("Request not found");
    sqlite.prepare(`UPDATE beach_carpool_requests SET status = 'DECLINED' WHERE post_id = ? AND id != ? AND status = 'INTERESTED'`).run(postId, requestId);
    sqlite.prepare(`UPDATE beach_carpool_requests SET status = 'SELECTED' WHERE id = ?`).run(requestId);
    db.update(beachCarpoolPosts).set({ status: "FILLED" } as any).where(eq(beachCarpoolPosts.id, postId)).run();
    const msg = storage.sendMessage(posterUserId, req.user_id, `River Brats carpool: ${post.departure_area}`, req.note, {
      contextType: "BEACH_CARPOOL",
      contextId: postId,
      contextLabel: post.departure_area,
    });
    return msg;
  },
  getBeachCarpoolRequests(postId: number, posterUserId: number) {
    const post = storage.getBeachCarpoolPost(postId);
    if (!post || post.user_id !== posterUserId) throw new Error("Not your post");
    const rows = sqlite.prepare(`
      SELECT r.*, u.username, u.display_name AS displayName
      FROM beach_carpool_requests r
      JOIN users u ON u.id = r.user_id
      WHERE r.post_id = ? AND r.status = 'INTERESTED'
      ORDER BY r.created_at ASC
    `).all(postId) as any[];
    return rows.filter(row => !storage.isMemberInteractionBlocked(posterUserId, row.user_id));
  },

  reportRiverBrats(data: InsertRiverBratsReport) {
    db.insert(riverBratsReports).values({
      ...data,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    } as any).run();
    if (data.targetType === "CHECKIN") {
      sqlite.prepare(`UPDATE beach_checkins SET report_count = report_count + 1 WHERE id = ?`).run(data.targetId);
    } else if (data.targetType === "CARPOOL") {
      sqlite.prepare(`UPDATE beach_carpool_posts SET report_count = report_count + 1 WHERE id = ?`).run(data.targetId);
    }
  },
  getRiverBratsReports(status?: string) {
    const where = status ? `WHERE r.status = ?` : "";
    const params = status ? [status] : [];
    return sqlite.prepare(`
      SELECT r.*, u.username AS reporterUsername
      FROM river_brats_reports r
      JOIN users u ON u.id = r.reporter_user_id
      ${where}
      ORDER BY r.created_at DESC
    `).all(...params);
  },
  resolveRiverBratsReport(id: number, adminNotes?: string) {
    db.update(riverBratsReports).set({ status: "RESOLVED", adminNotes: adminNotes || null } as any).where(eq(riverBratsReports.id, id)).run();
  },

  canUserPostToHubFeed(userId, isAdmin = false) {
    if (isAdmin) return true;
    const user = storage.getUserById(userId);
    // Soft-launch: every active member can post (public by default).
    if (!user) return false;
    if (user.status && user.status !== "active") return false;
    return true;
  },
  getHostedLiveEventIds(userId) {
    return storage.getEvents({})
      .filter((evt) => evt.status === "LIVE" && storage.isUserEventHost(evt.id, userId))
      .map((evt) => evt.id);
  },
  createHubFeedPost(data) {
    ensureHubFeedPostsSchema();
    const now = new Date().toISOString();
    const result = db.insert(hubFeedPosts).values({
      ...data,
      status: "LIVE",
      createdAt: now,
    } as any).run();
    const id = Number(result.lastInsertRowid);
    return db.select().from(hubFeedPosts).where(eq(hubFeedPosts.id, id)).get() as HubFeedPost;
  },
  getHubFeedPostsByUser(userId, limit = 20) {
    ensureHubFeedPostsSchema();
    const rows = sqlite.prepare(`
      SELECT *
      FROM hub_feed_posts
      WHERE user_id = ? AND status = 'LIVE'
      ORDER BY created_at DESC
      LIMIT ?
    `).all(userId, Math.min(Math.max(limit, 1), 50)) as HubFeedPost[];
    return rows;
  },
  removeHubFeedPost(id, userId, opts = {}) {
    ensureHubFeedPostsSchema();
    const row = db.select().from(hubFeedPosts).where(eq(hubFeedPosts.id, id)).get();
    if (!row || row.status !== "LIVE") return { error: "Not found" };
    if (!opts.isAdmin && row.userId !== userId) return { error: "Not your post" };
    db.update(hubFeedPosts).set({ status: "REMOVED" } as any).where(eq(hubFeedPosts.id, id)).run();
    return { ok: true as const };
  },

  getHubFeed(opts = {}) {
    const tab = parseHubFeedTab(opts.tab);
    const limit = Math.min(Math.max(opts.limit ?? 30, 1), 50);
    const viewerUserId = opts.viewerUserId;
    const viewerIsAdmin = !!opts.viewerIsAdmin;
    const cursor = opts.cursor?.trim() || null;

    expireStaleAttendances();
    storage.expireRiverBratsCheckins();
    expireGiftingPosts();
    archiveExpiredMissedConnections();

    const goingCounts = storage.getAttendanceSummaries();
    const viewerRsvpEventIds = new Set<number>();
    const viewerBeachDays = new Set<string>();
    if (viewerUserId != null) {
      for (const row of sqlite.prepare(`
        SELECT event_id AS eventId FROM attendances WHERE user_id = ? AND is_active = 1
      `).all(viewerUserId) as { eventId: number }[]) {
        viewerRsvpEventIds.add(row.eventId);
      }
      for (const row of sqlite.prepare(`
        SELECT beach_id AS beachId, calendar_date AS calendarDate
        FROM beach_checkins WHERE user_id = ? AND is_active = 1
      `).all(viewerUserId) as { beachId: string; calendarDate: string }[]) {
        viewerBeachDays.add(`${row.beachId}:${row.calendarDate}`);
      }
    }

    const pinnedStankId = findSiteOwnerEventId();
    const pinnedGigId = findSiteAdminGigPostId();
    const businesses = storage.getBusinesses();
    const pinnedAll = buildHubFeedPinnedItems(goingCounts, businesses);
    const pinned = filterHubFeedPinned(pinnedAll, tab);

    const items: HubFeedItem[] = [];

    // Venue parties we listed on the guide + every user-submitted event.
    // Order by LISTING time (created_at), the same axis the feed sorts on, so
    // newly-listed events are always in the candidate set. (Ordering by the
    // future party date meant that once 80+ upcoming events existed, a new
    // near-date event never became a candidate and never showed in the feed.)
    // The venue/series condense pass collapses bulk seeds per venue, so a
    // larger candidate pool doesn't flood the feed.
    const recentEvents = sqlite.prepare(`
      SELECT id, title, description, venue_name AS venueName, day_of_week AS dayOfWeek,
             date_start AS dateStart, admission, created_at AS createdAt,
             poster_image_url AS posterImageUrl,
             claimed_by AS claimedBy, submitted_by AS submittedBy, source
      FROM events
      WHERE status = 'LIVE'
        AND (
          source = 'user_submitted'
          OR TRIM(COALESCE(submitted_by, '')) != ''
          OR TRIM(COALESCE(claimed_by, '')) != ''
          OR datetime(created_at) >= datetime('now', '-60 days')
          OR date(date_start) >= date('now', '-14 days')
        )
      ORDER BY datetime(COALESCE(created_at, date_start)) DESC
      LIMIT 200
    `).all() as any[];
    const rawEventItems: HubFeedItem[] = [];
    for (const evt of recentEvents) {
      if (pinnedStankId != null && evt.id === pinnedStankId) continue;
      const activityAt = hubFeedEventActivityAt(evt);
      if (!activityAt) continue;
      const poster = hubFeedEventPoster(evt, businesses);
      // Prefer venue voice for guide-listed parties so the card reads as a
      // venue status update; keep member poster on each row when known.
      const author = hubFeedEventAuthor(evt, businesses);
      const venueBiz = hubFeedResolveBusinessForEvent(evt, businesses);
      const isUserSubmitted =
        evt.source === "user_submitted" || !!(evt.submittedBy && String(evt.submittedBy).trim());
      const feedAuthor =
        !isUserSubmitted && venueBiz
          ? hubFeedVenueAuthor(String(evt.venueName || venueBiz.name), evt, businesses)
          : author;
      const action = isUserSubmitted
        ? "Submitted a new event"
        : feedAuthor.venueLogo
          ? "Listed a party"
          : "Posted a new event";
      rawEventItems.push({
        id: `event-${evt.id}`,
        kind: "event",
        badge: isUserSubmitted ? "Submitted" : "Event",
        action,
        text: evt.description?.slice(0, 280) || null,
        createdAt: activityAt,
        author: feedAuthor,
        event: hubFeedEventEmbed(evt, goingCounts[evt.id]?.count, poster),
        link: null,
      });
    }
    items.push(...condenseHubFeedEventItems(rawEventItems));

    const hostRows = sqlite.prepare(`
      SELECT hm.id, hm.body, hm.created_at AS createdAt, hm.event_id AS eventId,
             e.title, e.venue_name AS venueName, e.day_of_week AS dayOfWeek,
             e.date_start AS dateStart, e.admission, e.poster_image_url AS posterImageUrl,
             u.display_name AS displayName, u.username, u.photo_url AS photoUrl,
             u.avatar_choice AS avatarChoice, u.avatar_ring AS avatarRing
      FROM host_messages hm
      JOIN events e ON e.id = hm.event_id AND e.status = 'LIVE'
      JOIN users u ON u.id = hm.user_id
      ORDER BY hm.created_at DESC
      LIMIT 12
    `).all() as any[];
    for (const row of hostRows) {
      items.push({
        id: `event_update-${row.id}`,
        kind: "event_update",
        badge: "Update",
        action: "Posted a host update",
        text: row.body,
        createdAt: row.createdAt,
        author: hubFeedAuthorFromUser(row),
        event: hubFeedEventEmbed(row, goingCounts[row.eventId]?.count),
        link: null,
      });
    }

    const rsvpRows = sqlite.prepare(`
      SELECT a.id, a.message, a.is_anonymous AS isAnonymous, a.visibility AS visibility,
             a.created_at AS createdAt,
             a.user_id AS userId, a.event_id AS eventId,
             e.title, e.venue_name AS venueName, e.day_of_week AS dayOfWeek,
             e.date_start AS dateStart, e.admission, e.poster_image_url AS posterImageUrl,
             u.display_name AS displayName, u.username, u.photo_url AS photoUrl,
             u.avatar_choice AS avatarChoice, u.avatar_ring AS avatarRing
      FROM attendances a
      JOIN events e ON e.id = a.event_id AND e.status = 'LIVE'
      LEFT JOIN users u ON u.id = a.user_id
      WHERE a.is_active = 1
      ORDER BY a.created_at DESC
      LIMIT 25
    `).all() as any[];
    for (const row of rsvpRows) {
      if (!canViewerSeeHubFeedRsvp(row, viewerUserId, viewerIsAdmin)) continue;
      const viewerRsvped = viewerUserId != null && viewerRsvpEventIds.has(row.eventId);
      const masked = maskAttendanceRow(viewerUserId, viewerRsvped, row);
      const anonymous = Boolean(masked.isAnonymous || masked.masked);
      // Anonymous/masked RSVPs render as a nameless "Someone in the scene is
      // going" card - too vague to be worth a public feed slot. Only surface
      // RSVPs where a real name shows.
      if (anonymous) continue;
      items.push({
        id: `rsvp-${row.id}`,
        kind: "rsvp",
        badge: "RSVP",
        action: "Is going",
        text: masked.message || null,
        createdAt: row.createdAt,
        author: hubFeedAuthorFromUser(row, false),
        event: hubFeedEventEmbed(row, goingCounts[row.eventId]?.count),
        link: null,
      });
    }

    for (const post of storage.getGiftingPosts({ viewerUserId }).slice(0, 15)) {
      items.push({
        id: `gifting-${post.id}`,
        kind: "gifting",
        badge: post.postType === "ISO" ? "ISO" : "GIFTZ",
        action: post.postType === "ISO" ? "Posted an ISO on the free board" : "New gift on the free board",
        title: post.title,
        text: post.description || null,
        createdAt: post.createdAt || post.created_at,
        author: hubFeedAuthorFromUser({
          displayName: post.displayName,
          username: post.username,
          photoUrl: post.posterPhotoUrl,
          avatarChoice: post.avatarChoice,
          avatarRing: post.posterAvatarRing,
        }),
        // Deep-link opens the free board with this exact post expanded.
        link: `/gifting?post=${post.id}`,
        boardPostId: post.id,
      });
    }

    for (const post of storage.getSellzPosts().slice(0, 15)) {
      items.push({
        id: `sellz-${post.id}`,
        kind: "sellz",
        badge: "SELLZ",
        action: `Listed for $${(Number(post.price_cents || 0) / 100).toFixed(Number(post.price_cents || 0) % 100 ? 2 : 0)}`,
        title: post.title,
        text: post.description || null,
        createdAt: post.createdAt || post.created_at,
        author: hubFeedAuthorFromUser({ displayName: post.displayName, username: post.username, photoUrl: post.posterPhotoUrl, avatarChoice: post.avatarChoice, avatarRing: post.posterAvatarRing }),
        link: `/sellz?post=${post.id}`,
        boardPostId: post.id,
        photoUrl: post.photoUrls?.[0] || null,
      });
    }

    // HAUSING. Ordered by listing recency inside listHousingPosts, the same axis
    // the feed sorts on, so a new post is always a candidate.
    try {
      for (const post of listHousingPosts(sqlite, { viewerId: viewerUserId ?? null, limit: 12 })) {
        items.push({
          id: `housing-${post.id}`,
          kind: "housing",
          badge: HOUSING_TYPE_LABEL[post.type],
          action: HOUSING_FEED_ACTION[post.type],
          title: post.displayName || null,
          text: post.headline || null,
          createdAt: post.createdAt,
          author: hubFeedAuthorFromUser({
            displayName: post.author.displayName,
            username: post.author.username,
            photoUrl: post.author.photoUrl,
            avatarChoice: post.author.avatarChoice,
            avatarRing: post.author.avatarRing,
          }),
          link: `/hausing/${post.id}`,
          boardPostId: post.id,
          photoUrl: post.photos[0] || null,
        });
      }
    } catch {
      // A board that fails to read must never take the whole feed down.
    }

    for (const gig of storage.getGigPosts("LIVE").slice(0, 12)) {
      if (pinnedGigId != null && gig.id === pinnedGigId) continue;
      items.push({
        id: `gig-${gig.id}`,
        kind: "gig",
        badge: gig.postType === "LOOKING_FOR_WORK" ? "Looking" : "Gig",
        action: gig.postType === "LOOKING_FOR_WORK" ? "Posted on GIGZ" : "Posted a gig on GIGZ",
        title: gig.title,
        text: gig.description || null,
        createdAt: gig.createdAt,
        author: hubFeedAuthorFromUser({
          displayName: gig.displayName,
          username: gig.username,
          photoUrl: gig.posterPhotoUrl,
          avatarChoice: gig.avatarChoice,
          avatarRing: gig.posterAvatarRing,
        }),
        // Deep-link opens GIGZ with this exact post expanded.
        link: `/pride-work?post=${gig.id}`,
        boardPostId: gig.id,
      });
    }

    for (const row of storage.getMissedConnections("ACTIVE", viewerUserId).slice(0, 12)) {
      // Mirror the board's spottedKind()/spottedPlace() so the feed card and the
      // detail card that opens on tap read identically.
      const kind = row.eventId != null
        ? { label: "At an event", color: "#19e3ff" }
        : row.beachId === "rooster-rock"
          ? { label: "Rooster Rock", color: "#19e3ff" }
          : row.beachId === "sauvie-island"
            ? { label: "Sauvie Island", color: "#ff6600" }
            : row.beachId
              ? { label: "At the beach", color: "#ff6600" }
              : { label: "Around town", color: "#ff8c00" };
      const place = row.eventTitle
        ? (row.eventVenue ? `At ${row.eventTitle} · ${row.eventVenue}` : `At ${row.eventTitle}`)
        : row.beachId
          ? (row.venueHint || (row.beachId === "rooster-rock" ? "Rooster Rock" : "Sauvie Island"))
          : (row.venueHint ? `Around town · ${row.venueHint}` : "Around town");
      const subject = (row.title && String(row.title).trim())
        || (row.body ? String(row.body).trim().split(/\n/)[0].slice(0, 80) : "")
        || "Missed connection";
      items.push({
        id: `spotted-${row.id}`,
        kind: "spotted",
        badge: "MIZZED CONNECTION",
        action: "New missed connection",
        title: subject,
        text: row.body || "",
        place,
        createdAt: row.createdAt,
        // Missed connections are anonymous - the card renders without a person.
        author: { displayName: "MIZZED CONNECTION", anonymous: true },
        // No event embed: tapping opens the MIZZED CONNECTION detail card
        // (see `spotted`), it does not deep-link to an event.
        event: null,
        link: "/spotted",
        spotted: { id: row.id, kindLabel: kind.label, kindColor: kind.color },
      });
    }

    const checkinRows = sqlite.prepare(`
      SELECT c.id, c.beach_id AS beachId, c.note, c.is_anonymous AS isAnonymous,
             c.created_at AS createdAt, c.user_id AS userId, c.calendar_date AS calendarDate,
             u.display_name AS displayName, u.username, u.photo_url AS photoUrl,
             u.avatar_choice AS avatarChoice, u.avatar_ring AS avatarRing
      FROM beach_checkins c
      JOIN users u ON u.id = c.user_id
      WHERE c.is_active = 1
      ORDER BY c.created_at DESC
      LIMIT 12
    `).all() as any[];
    for (const row of checkinRows) {
      const beachKey = `${row.beachId}:${row.calendarDate}`;
      const viewerCheckedIn = viewerUserId != null && viewerBeachDays.has(beachKey);
      const isSelf = viewerUserId != null && row.userId === viewerUserId;
      const isAnonymous = Boolean(row.isAnonymous);
      const mask = isAnonymous || (!viewerCheckedIn && !isSelf);
      const beachLabel = beachVenueLabel(row.beachId);
      items.push({
        id: `checkin-${row.id}`,
        kind: "checkin",
        badge: "Check-in",
        action: `Checked in at ${beachLabel}`,
        text: mask ? null : (row.note || null),
        createdAt: row.createdAt,
        author: hubFeedAuthorFromUser(mask ? null : row, mask),
        beachId: row.beachId,
        beachLabel,
        link: `/nude-beaches?tab=${encodeURIComponent(row.beachId)}`,
      });
    }

    ensureHubFeedPostsSchema();
    const feedPostRows = sqlite.prepare(`
      SELECT p.id, p.user_id AS userId, p.post_type AS postType, p.body, p.photo_url AS photoUrl,
             p.audience, p.event_id AS eventId, p.post_as AS postAs, p.business_id AS businessId,
             p.status, p.created_at AS createdAt,
             u.display_name AS displayName, u.username, u.photo_url AS authorPhotoUrl,
             u.avatar_choice AS avatarChoice, u.avatar_ring AS avatarRing
      FROM hub_feed_posts p
      JOIN users u ON u.id = p.user_id
      WHERE p.status = 'LIVE'
      ORDER BY p.created_at DESC
      LIMIT 40
    `).all() as any[];
    const hostedCache = new Map<number, number[]>();
    for (const row of feedPostRows) {
      let hosted = hostedCache.get(row.userId);
      if (!hosted) {
        hosted = storage.getHostedLiveEventIds(row.userId);
        hostedCache.set(row.userId, hosted);
      }
      if (!canViewerSeeHubFeedPost(row, viewerUserId, viewerRsvpEventIds, viewerIsAdmin, hosted)) continue;
      items.push(hubFeedPostToItem(row, goingCounts, businesses, viewerUserId));
    }

    if (viewerUserId != null) {
      bumpSavedHubFeedItems(items, viewerUserId);
    }

    const sorted = items
      .filter((item) => item.createdAt)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

    const tabbed = filterHubFeedItems(sorted, tab);
    const paged = cursor
      ? tabbed.filter((item) => String(item.createdAt) < cursor)
      : tabbed;
    const slice = paged.slice(0, limit);
    const nextCursor = paged.length > limit ? slice[slice.length - 1]?.createdAt ?? null : null;

    return { items: slice, pinned, nextCursor };
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
    const user = storage.resolveUserByIdentifier(ownerKey);
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
  "hub_feed_posts",
  "event_hosts",
  "event_talent",
  "moderation_requests",
  "feedback_reports",
  "content_likes",
  "content_replies",
  "message_reactions",
  "express_sessions",
  "ads",
  "ad_events",
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
