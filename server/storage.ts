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
} from "@shared/hubFeed";
import {
  events, submissions, gigPosts, promoters, moderationRequests, attendances, eventChatMessages, users, messages, missedConnections,
  giftingPosts, giftingInterests, giftingReports,
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
    created_at TEXT NOT NULL DEFAULT ''
  );
`);

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
    last_change_label TEXT
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
    resolved_at TEXT
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

// events.updated_at: trust line + "last touched" for admin/edit/sync.
try { sqlite.exec(`ALTER TABLE events ADD COLUMN updated_at TEXT NOT NULL DEFAULT ''`); } catch {}
try {
  sqlite.exec(`UPDATE events SET updated_at = created_at WHERE updated_at IS NULL OR updated_at = ''`);
} catch {}

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
        skills, compensation, location, is_remote, status, created_at, user_id, business_id
      ) VALUES (
        @postType, @role, @postType, @title, @name, @contactEmail, @description,
        @skills, @compensation, @location, @isRemote, @status, @createdAt, @userId, @businessId
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
        created_at TEXT NOT NULL DEFAULT '',
        UNIQUE(content_type, content_id, user_id)
      )
    `);
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
    WHERE content_type = ? AND content_id IN (${placeholders})
    GROUP BY content_id
  `).all(contentType, ...unique) as Array<{ contentId: number; cnt: number }>;
  for (const row of rows) out.set(Number(row.contentId), Number(row.cnt) || 0);
  return out;
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

/** Demo posts for the Gigs, Mizzed Connection, and Gifting boards. Old
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
  // venue_hint uses real directory brand names so Place modal Mizzed Connection tabs attach.
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
  // Mizzed Connection tabs attach (v2 used freeform "laundromat / MAX" hints).
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
      { name: "Holocene", type: "venue", description: "Beloved Portland nightclub and event space in SE. Regularly hosts LGBTQ+ nights, drag shows, and Pride events.", address: "1001 SE Morrison St", neighborhood: "SE Portland", lat: 45.5173, lng: -122.6556, queerOwned: false, queerFriendly: true },
      { name: "Alberta Rose Theatre", type: "venue", description: "Historic 300-seat theater on Alberta hosting music, burlesque, comedy, and community events with a strong queer presence.", address: "3000 NE Alberta St", neighborhood: "Alberta Arts District", lat: 45.5581, lng: -122.6478, queerOwned: false, queerFriendly: true },
      { name: "Jackie's", type: "bar", description: "Laid-back queer-friendly bar on SE Sandy. Regular host of LGBTQ+ community nights and Pride events.", address: "930 SE Sandy Blvd", neighborhood: "SE Portland", lat: 45.5192, lng: -122.6478, queerOwned: false, queerFriendly: true },
      { name: "Sanctuary Club", type: "venue", description: "LGBTQ+-centered event space and club in the Pearl. Hosts drag, dance parties, and community gatherings.", address: "33 NW 9th Ave", neighborhood: "Pearl District", lat: 45.5232, lng: -122.6802, queerOwned: false, queerFriendly: true },
      { name: "Seagrape Apothecary", type: "shop", description: "Herb-forward apothecary and wellness shop on NE Sandy. Holistic remedies, tinctures, and botanical goods in a welcoming space.", address: "2823 NE Sandy Blvd", neighborhood: "NE Portland", lat: 45.5330, lng: -122.6327, queerOwned: false, queerFriendly: true },
      { name: "REALM PDX", type: "venue", description: "SE Portland event space and club hosting LGBTQ+ dance nights, kink-positive events, and community parties.", address: "615 SE Alder St", neighborhood: "SE Portland", lat: 45.5180, lng: -122.6595, queerOwned: false, queerFriendly: true },
      { name: "Nova PDX", type: "venue", description: "Inner East music and event venue. Queer-welcoming space hosting Pride events and community nights.", address: "722 E Burnside St", neighborhood: "Inner East", lat: 45.5234, lng: -122.6574, queerOwned: false, queerFriendly: true },
      { name: "Star Theater", type: "venue", description: "Old Town concert venue and nightclub. Hosts drag shows, LGBTQ+ parties, and music events throughout Pride season.", address: "13 NW 6th Ave", neighborhood: "Old Town", lat: 45.5232, lng: -122.6765, queerOwned: false, queerFriendly: true },
      { name: "The Get Down", type: "venue", description: "Central Eastside venue and bar hosting a rotating lineup of queer nights, drag, dancing, and community events.", address: "680 SE 6th Ave", neighborhood: "Central Eastside", lat: 45.5181, lng: -122.6596, queerOwned: false, queerFriendly: true },
      { name: "Happylucky No. 1", type: "bar", description: "Central Eastside bar and gathering spot. Queer-friendly with a cozy neighborhood vibe and community programming.", address: "330 SE 6th Ave", neighborhood: "Central Eastside", lat: 45.5205, lng: -122.6596, queerOwned: false, queerFriendly: true },
      { name: "Escape Bar & Grill", type: "bar", description: "NE Portland bar and grill hosting community events including LGBTQ+ nights and Pride programming.", address: "9004 NE Sandy Blvd", neighborhood: "NE Portland", lat: 45.5559, lng: -122.5700, queerOwned: false, queerFriendly: true },
    ];
    for (const v of venues) {
      db.insert(businesses).values({ ...v, active: true, isNew: false, createdAt: now } as any).run();
    }
    recordBootMigration("seed_businesses_directory_v7");
  }
  try {
    const bcols = new Set(sqlite.prepare(`PRAGMA table_info(businesses)`).all().map((c: any) => c.name));
    if (!bcols.has("donate_url")) sqlite.exec(`ALTER TABLE businesses ADD COLUMN donate_url TEXT`);
  } catch (e) { console.error("[businesses] donate_url migration failed:", e); }
  if (!hasBootMigration("seed_businesses_directory_v8")) {
    const now = new Date().toISOString();
    db.insert(businesses).values({
      name: "The Lodge Bar and Grill",
      type: "bar",
      description:
        "Neighborhood dive bar and grill on SE Powell with comfort-food hits, eggs benedict, fries, poutine, and collard greens, plus a heated enclosed dog-friendly patio, karaoke Saturdays, pool, darts, and pinball.",
      address: "6605 SE Powell Blvd",
      neighborhood: "SE Portland",
      website: "https://thelodgebarandgrill.shop/",
      instagram: "@lodgebarandgrill",
      queerOwned: false,
      queerFriendly: true,
      lat: 45.4977,
      lng: -122.5955,
      hours: "Sun 9am–2am, Mon–Thu 11am–2am, Fri 11am–2:30am, Sat 9am–2:30am",
      phone: "(503) 788-9677",
      active: true,
      isNew: false,
      createdAt: now,
    } as any).run();
    recordBootMigration("seed_businesses_directory_v8");
  }
  if (!hasBootMigration("seed_businesses_directory_v9_gay_pages_process_prism")) {
    const now = new Date().toISOString();
    const wave: Array<Record<string, unknown>> = [
      {
        name: "Process",
        type: "bar",
        description:
          "Underground bar and event space inside the Watershed on SE Milwaukie. Seasonal craft cocktails, strong NA options, and a sound-treated room with a 4-point Danley system. Safer-space community guidelines; hosts ticketed and free nights all week.",
        address: "5040 SE Milwaukie Ave",
        neighborhood: "SE Portland",
        website: "https://www.processpdx.club",
        instagram: "@process.pdx",
        lat: 45.4869,
        lng: -122.6484,
        queerOwned: false,
        queerFriendly: true,
        isNew: false,
      },
      {
        name: "Prism Health",
        type: "healthcare",
        description:
          "Portland LGBTQ+ community health clinic offering primary care, HIV and STI services, gender-affirming care, behavioral health, and specialty programs for queer and trans communities across the metro.",
        address: "2236 SE Belmont St",
        neighborhood: "SE Portland",
        website: "https://www.prismhealth.org",
        instagram: "@prismhealth",
        phone: "(503) 445-7699",
        lat: 45.5165,
        lng: -122.6430,
        queerOwned: false,
        queerFriendly: true,
        isNew: false,
      },
      {
        name: "The Automatic Bar",
        type: "bar",
        description:
          "Neighborhood bar on SE Division with a full bar, snacks, and a welcoming queer-friendly room in the Richmond / Clinton pocket.",
        address: "3652 SE Division St",
        neighborhood: "SE Portland",
        website: "https://www.theautomaticbarpdx.com/",
        phone: "(503) 206-5371",
        lat: 45.5047,
        lng: -122.6265,
        queerOwned: false,
        queerFriendly: true,
        isNew: false,
      },
      {
        name: "Montavilla Station",
        type: "bar",
        description:
          "Friendly Montavilla tavern with karaoke, live music, pool, pub food, and late hours. A neighborhood hang listed in the PDX Gay Pages bars directory.",
        address: "417 SE 80th Ave",
        neighborhood: "Montavilla",
        website: "https://montavillastation.com/",
        phone: "(503) 252-3240",
        hours: "Daily 11am–2am",
        lat: 45.5195,
        lng: -122.5820,
        queerOwned: false,
        queerFriendly: true,
        isNew: false,
      },
      {
        name: "Covert Café",
        type: "bar",
        description:
          "Intimate Montavilla live-music bar with comedy, community nights, and a small-room calendar built around local artists.",
        address: "803 SE 82nd Ave",
        neighborhood: "Montavilla",
        website: "https://www.thecovertcafe.com/",
        instagram: "@covertcafepdx",
        phone: "(503) 254-8277",
        lat: 45.5170,
        lng: -122.5785,
        queerOwned: false,
        queerFriendly: true,
        isNew: false,
      },
      {
        name: "Hunny Beez",
        type: "restaurant",
        description:
          "American Filipino fusion restaurant and bar near PSU with adobo wings, brunch, happy hour, and late weekend nights.",
        address: "1434 SW Park Ave",
        neighborhood: "Downtown",
        website: "https://hunnybeezpdx.com/",
        instagram: "@hunnybeezpdx",
        phone: "(971) 404-6845",
        hours: "Mon–Wed 11am–10pm, Thu 11am–12am, Fri 11am–2am, Sat 10am–2am, Sun 10am–7pm",
        lat: 45.5128,
        lng: -122.6845,
        queerOwned: false,
        queerFriendly: true,
        isNew: false,
      },
      {
        name: "Q Restaurant & Bar",
        type: "restaurant",
        description:
          "Family-owned downtown restaurant with imaginative Pacific Northwest cuisine, lunch and dinner service, and a modern queer-friendly dining room.",
        address: "828 SW 2nd Ave",
        neighborhood: "Downtown",
        website: "https://q-portland.com/",
        instagram: "@q_portland",
        phone: "(503) 850-8915",
        hours: "Tue–Fri lunch and dinner, Sat dinner, closed Sun–Mon",
        lat: 45.5175,
        lng: -122.6765,
        queerOwned: false,
        queerFriendly: true,
        isNew: false,
      },
      {
        name: "GiGi's Cafe",
        type: "cafe",
        description:
          "Hillsdale neighborhood cafe known for waffles, brunch plates, and a friendly daytime room open daily.",
        address: "6320 SW Capitol Hwy",
        neighborhood: "SW Portland",
        website: "https://gigiscafepdx.com/",
        instagram: "@gigiscafepdx",
        phone: "(503) 977-2233",
        hours: "Daily 8am–3pm",
        lat: 45.4805,
        lng: -122.7035,
        queerOwned: false,
        queerFriendly: true,
        isNew: false,
      },
      {
        name: "Backstory Books & Yarn",
        type: "shop",
        description:
          "Independent woman-owned bookstore and yarn shop on Hawthorne Boulevard with trade programs and community browsing.",
        address: "3129 SE Hawthorne Blvd",
        neighborhood: "SE Hawthorne",
        website: "https://www.backstorybooksandyarn.com/",
        instagram: "@BackstoryPDX",
        phone: "(971) 282-3332",
        lat: 45.5122,
        lng: -122.6325,
        queerOwned: false,
        queerFriendly: true,
        isNew: false,
      },
      {
        name: "Bridge City Mentors",
        type: "nonprofit",
        description:
          "Black and LGBTQ-affiliated mentoring and advocacy organization supporting individuals and communities across the Portland metro since 2016.",
        address: "2636 NE Sandy Blvd Suite E",
        neighborhood: "NE Portland",
        website: "https://bridgecitymentors.com/",
        instagram: "@bridgecitymentors",
        phone: "(503) 473-3306",
        lat: 45.5345,
        lng: -122.6385,
        queerOwned: true,
        queerFriendly: true,
        isNew: false,
      },
      {
        name: "Rebel Heart Therapy",
        type: "healthcare",
        description:
          "Queer-staffed, identity-forward therapy practice for LGBTQIA+, poly, kinky, neurodivergent, and nonconforming people in Portland.",
        address: "1111 NE MLK Blvd",
        neighborhood: "NE Portland",
        website: "https://www.rebelheartpdx.com/",
        instagram: "@rebelheartpdx",
        lat: 45.5310,
        lng: -122.6615,
        queerOwned: true,
        queerFriendly: true,
        isNew: false,
      },
      {
        name: "Full Spectrum Therapy",
        type: "healthcare",
        description:
          "Portland group therapy practice with clinicians dedicated to LGBTQ+ affirming care, gender-competent counseling, and community support.",
        address: "1219 SE Lafayette St",
        neighborhood: "SE Portland",
        website: "https://www.fullspectrumpdx.com/",
        instagram: "@fullspectrumtherapy",
        phone: "(503) 765-5733",
        lat: 45.5065,
        lng: -122.6535,
        queerOwned: false,
        queerFriendly: true,
        isNew: false,
      },
      {
        name: "Sprout Therapy PDX",
        type: "healthcare",
        description:
          "Inclusive counseling for individuals, kids, families, and relationships of any kind, with Portland offices and Oregon telehealth. LGBTQ+ welcoming and insurance-friendly.",
        address: "6011 NE Oregon St",
        neighborhood: "NE Portland",
        website: "https://sprouttherapypdx.com/",
        instagram: "@sprouttherapypdx",
        lat: 45.5275,
        lng: -122.6015,
        queerOwned: false,
        queerFriendly: true,
        isNew: false,
      },
      {
        name: "The Center for Couples & Sex Therapy",
        type: "healthcare",
        description:
          "Sex-positive, gender-affirming therapy for individuals and partners covering desire, communication, identity, and relationship care in Portland and online.",
        address: "2923 NE Broadway St",
        neighborhood: "NE Portland",
        website: "https://www.thecenterportland.com/",
        instagram: "@thecenterportland",
        phone: "(503) 941-0856",
        lat: 45.5350,
        lng: -122.6355,
        queerOwned: false,
        queerFriendly: true,
        isNew: false,
      },
    ];
    for (const entry of wave) {
      const exists = sqlite.prepare(`SELECT id FROM businesses WHERE lower(name) = lower(?)`).get(entry.name as string);
      if (exists) continue;
      db.insert(businesses).values({ ...entry, active: true, createdAt: now } as any).run();
    }
    recordBootMigration("seed_businesses_directory_v9_gay_pages_process_prism");
  }
  if (!hasBootMigration("seed_businesses_directory_v10_sold_by_scott")) {
    const now = new Date().toISOString();
    const exists = sqlite.prepare(`SELECT id FROM businesses WHERE lower(name) = lower(?)`).get("Sold By Scott");
    if (!exists) {
      db.insert(businesses).values({
        name: "Sold By Scott",
        type: "realestate",
        description:
          "Bay Area and Pacific Northwest queer-friendly real estate team. Scott Edelman (scotte@soldxscott.com, 415-481-2962) and Scott Gunner Friesen (scottf@soldxscott.com, 415-961-0281). The one real estate listing in Zaylist.",
        address: null,
        neighborhood: "Portland / Bay Area",
        website: "https://soldxscott.com",
        instagram: null,
        phone: "(415) 481-2962",
        hours: null,
        lat: null,
        lng: null,
        queerOwned: false,
        queerFriendly: true,
        isNew: false,
        active: true,
        createdAt: now,
      } as any).run();
    }
    // Ensure Bridge City Mentors stays nonprofit (correct pin + rainbow treatment).
    sqlite.prepare(`UPDATE businesses SET type = 'nonprofit', queer_owned = 1, queer_friendly = 1 WHERE lower(name) = 'bridge city mentors'`).run();
    recordBootMigration("seed_businesses_directory_v10_sold_by_scott");
  }
  if (!hasBootMigration("seed_businesses_directory_v11_type_accents")) {
    // Reclassify Sold By Scott under realestate (green→white neon) if an older seed used service.
    sqlite.prepare(`UPDATE businesses SET type = 'realestate' WHERE lower(name) = 'sold by scott'`).run();
    recordBootMigration("seed_businesses_directory_v11_type_accents");
  }
  /**
   * Crush Bar permanently closed 2025-01-01 — same address as Peacock PDX (successor).
   * Keep a CLOSED inactive row for historical venue linkage; never QSearch-scrape @crushbarpdx.
   * Peacock remains the live directory + year-round ingest slot.
   */
  if (!hasBootMigration("crush_bar_closed_permanent_2025_01_01_v1")) {
    try {
      sqlite.exec(`ALTER TABLE businesses ADD COLUMN status TEXT NOT NULL DEFAULT 'OPEN'`);
    } catch { /* already present */ }
    try {
      sqlite.exec(`ALTER TABLE businesses ADD COLUMN closed_at TEXT`);
    } catch { /* already present */ }

    const now = new Date().toISOString();
    const existingCrush = sqlite
      .prepare(`SELECT id FROM businesses WHERE lower(name) IN ('crush bar', 'crush bar pdx', 'crush') LIMIT 1`)
      .get() as { id: number } | undefined;
    if (existingCrush) {
      sqlite
        .prepare(
          `UPDATE businesses
           SET status = 'CLOSED', closed_at = '2025-01-01', active = 0,
               description = COALESCE(NULLIF(trim(description), ''),
                 'Former Buckman queer bar at 1400 SE Morrison. Permanently closed 2025-01-01; space reopened as Peacock PDX. Kept for historical event linkage only — do not scrape.'),
               address = COALESCE(address, '1400 SE Morrison St'),
               neighborhood = COALESCE(neighborhood, 'SE Portland')
           WHERE id = ?`,
        )
        .run(existingCrush.id);
    } else {
      db.insert(businesses)
        .values({
          name: "Crush Bar",
          type: "bar",
          description:
            "Former Buckman queer bar at 1400 SE Morrison. Permanently closed 2025-01-01; space reopened as Peacock PDX. Kept for historical event linkage only — do not scrape.",
          address: "1400 SE Morrison St",
          neighborhood: "SE Portland",
          website: null,
          instagram: null,
          queerOwned: true,
          queerFriendly: true,
          lat: 45.5169,
          lng: -122.6490,
          active: false,
          status: "CLOSED",
          closedAt: "2025-01-01",
          isNew: false,
          createdAt: now,
        } as any)
        .run();
    }
    // Ensure successor Peacock is OPEN/active for discovery + directory ingest
    sqlite
      .prepare(
        `UPDATE businesses
         SET status = 'OPEN', closed_at = NULL, active = 1,
             website = COALESCE(website, 'https://peacockpdx.com'),
             instagram = COALESCE(instagram, '@peacock.pdx')
         WHERE lower(name) IN ('peacock pdx', 'peacock')`,
      )
      .run();
    recordBootMigration("crush_bar_closed_permanent_2025_01_01_v1");
  }
  /**
   * Expand closed-venue directory seeds + soft-hide LIVE post-close events at blacklisted venues.
   * List lives in shared/closedVenues.ts (also used by QSearch relevance).
   */
  if (!hasBootMigration("closed_venues_blacklist_v1")) {
    try {
      sqlite.exec(`ALTER TABLE businesses ADD COLUMN status TEXT NOT NULL DEFAULT 'OPEN'`);
    } catch { /* already present */ }
    try {
      sqlite.exec(`ALTER TABLE businesses ADD COLUMN closed_at TEXT`);
    } catch { /* already present */ }

    const now = new Date().toISOString();

    for (const entry of CLOSED_PERMANENT_VENUES) {
      if (!entry.seedDirectory) continue;
      const closedAt = closedAtIso(entry);
      const existing = sqlite
        .prepare(`SELECT id FROM businesses WHERE lower(name) = lower(?) LIMIT 1`)
        .get(entry.label) as { id: number } | undefined;
      if (existing) {
        sqlite
          .prepare(
            `UPDATE businesses
             SET status = 'CLOSED', closed_at = ?, active = 0,
                 description = CASE
                   WHEN description IS NULL OR trim(description) = '' THEN ?
                   ELSE description
                 END,
                 address = COALESCE(address, ?),
                 neighborhood = COALESCE(neighborhood, ?)
             WHERE id = ?`,
          )
          .run(
            closedAt,
            `${entry.label} permanently closed ${closedAt}. ${entry.note} Historical linkage only — do not scrape.`,
            entry.address || null,
            entry.neighborhood || null,
            existing.id,
          );
      } else {
        db.insert(businesses)
          .values({
            name: entry.label,
            type: "bar",
            description: `${entry.label} permanently closed ${closedAt}. ${entry.note} Historical linkage only — do not scrape.`,
            address: entry.address || null,
            neighborhood: entry.neighborhood || null,
            website: null,
            instagram: null,
            queerOwned: true,
            queerFriendly: true,
            active: false,
            status: "CLOSED",
            closedAt,
            isNew: false,
            createdAt: now,
          } as any)
          .run();
      }
    }

    // Soft-hide LIVE events at blacklisted venues with start on/after close (no historical purge)
    const live = sqlite
      .prepare(`SELECT id, title, venue_name AS venueName, address, date_start AS dateStart FROM events WHERE status = 'LIVE'`)
      .all() as Array<{ id: number; title: string; venueName: string; address: string | null; dateStart: string }>;
    let hidden = 0;
    for (const row of live) {
      const hit = matchClosedVenue({ venueName: row.venueName, address: row.address, title: row.title });
      if (!hit) continue;
      if (!isEventAfterVenueClose(row.dateStart, hit.entry.closedAt)) continue;
      sqlite
        .prepare(
          `UPDATE events SET status = 'HIDDEN',
             admin_notes = COALESCE(admin_notes || ' | ', '') || ?
           WHERE id = ? AND status = 'LIVE'`,
        )
        .run(`closed_venues_blacklist_v1: ${hit.reason}`, row.id);
      hidden++;
    }
    if (hidden > 0) {
      console.info(`[boot] closed_venues_blacklist_v1: soft-hid ${hidden} LIVE post-close events`);
    }

    // Peacock / Scandals East stay open
    sqlite
      .prepare(
        `UPDATE businesses SET status = 'OPEN', closed_at = NULL, active = 1
         WHERE lower(name) IN ('peacock pdx', 'peacock', 'scandals east')`,
      )
      .run();

    recordBootMigration("closed_venues_blacklist_v1");
  }
  /**
   * Soft-hide garbage non-queer + dupe LIVE rows from Meta/Grok audit (2026-07-25 export).
   * Keep oldest of each dupe group; hide beer runs as non-queer.
   */
  if (!hasBootMigration("cleanup_prod_garbage_dupes_2026_07_25_v1")) {
    const garbage = [376, 377, 365, 368, 381]; // StrongFirst, Survival, Loowit×2, Leikam beer run
    const dupes = [355, 316, 356, 357, 358, 386]; // newer of each dupe group
    const ids = [...garbage, ...dupes];
    const stmt = sqlite.prepare(
      `UPDATE events SET status = 'HIDDEN',
         admin_notes = COALESCE(admin_notes || ' | ', '') || ?
       WHERE id = ? AND status = 'LIVE'`,
    );
    let n = 0;
    for (const id of ids) {
      const r = stmt.run("cleanup_prod_garbage_dupes_2026_07_25_v1", id);
      n += r.changes;
    }
    if (n > 0) console.info(`[boot] cleanup_prod_garbage_dupes: soft-hid ${n} LIVE rows`);
    recordBootMigration("cleanup_prod_garbage_dupes_2026_07_25_v1");
  }
  /** Badlands ticketUrl was worker calendar API — rewrite to public calendar page. */
  if (!hasBootMigration("badlands_ticket_url_hygiene_v1")) {
    const r = sqlite
      .prepare(
        `UPDATE events
         SET ticket_url = 'https://www.badlandsportland.com/calendar',
             admin_notes = COALESCE(admin_notes || ' | ', '') || 'badlands_ticket_url_hygiene_v1'
         WHERE status = 'LIVE'
           AND lower(venue_name) LIKE '%badlands%'
           AND ticket_url IS NOT NULL
           AND (
             ticket_url LIKE '%workers.dev%'
             OR ticket_url LIKE '%/api/calendar%'
             OR ticket_url LIKE '%/api/drive%'
           )`,
      )
      .run();
    if (r.changes > 0) {
      console.info(`[boot] badlands_ticket_url_hygiene_v1: rewrote ${r.changes} ticket URLs`);
    }
    recordBootMigration("badlands_ticket_url_hygiene_v1");
  }
  /** Seed verified year-round Eventbrite listings into Review queue (once). */
  if (!hasBootMigration("seed_missing_yearround_review_v1")) {
    // Dynamic import is ESM-safe and avoids a storage↔qsearch circular init.
    // Record after the attempt so a failed import can still retry next boot.
    void import("./qsearch/seedMissingYearround")
      .then(({ seedMissingYearroundToReview }) => {
        try {
          const result = seedMissingYearroundToReview();
          console.info(
            `[boot] seed_missing_yearround_review_v1: seeded=${result.seeded} skipBoard=${result.skippedBoard} skipPending=${result.skippedPending} path=${result.path}`,
          );
        } catch (e) {
          console.warn("[boot] seed_missing_yearround_review_v1 failed:", e);
        }
        recordBootMigration("seed_missing_yearround_review_v1");
      })
      .catch((e) => {
        console.warn("[boot] seed_missing_yearround_review_v1 failed:", e);
        recordBootMigration("seed_missing_yearround_review_v1");
      });
  }
  if (!hasBootMigration("seed_plus_psychiatry_v1")) {
    const now = new Date().toISOString();
    const exists = sqlite
      .prepare(`SELECT id FROM businesses WHERE lower(name) IN ('plus psychiatry', '+psychiatry', 'pluspsychiatry') LIMIT 1`)
      .get() as { id: number } | undefined;
    if (!exists) {
      db.insert(businesses).values({
        name: "Plus Psychiatry",
        type: "healthcare",
        description:
          "LGBTQIA2S+ affirming psychiatric care with Jermiah Floyd, PMHNP-BC. Trauma-informed, person-centered psychotherapy and medication management in Portland, in-person and telehealth.",
        address: "1110 SE Alder St Suite 301",
        neighborhood: "SE Portland",
        website: "https://www.pluspsychiatry.com",
        instagram: null,
        phone: "(541) 414-4277",
        hours: null,
        lat: 45.5176,
        lng: -122.6545,
        queerOwned: true,
        queerFriendly: true,
        isNew: false,
        active: true,
        createdAt: now,
      } as any).run();
    }
    recordBootMigration("seed_plus_psychiatry_v1");
  }
  // Grand openings: ONLY verified doors-open dates - never "just added to directory".
  // Clear bad is_new flags from seed/add waves (Hawks, underU, Meet Rack, therapy, etc.).
  if (!hasBootMigration("grand_opening_verified_dates_v1")) {
    try {
      sqlite.prepare(`UPDATE businesses SET is_new = 0, grand_opening_date = NULL`).run();
      // Camp Bar PDX - verified grand opening Sat Jul 11, 2026 (KOIN / OregonLive / IG).
      sqlite
        .prepare(
          `UPDATE businesses
           SET is_new = 1, grand_opening_date = '2026-07-11',
               description = 'Modern inclusive gay bar in downtown Portland''s Gayborhood, taking over the historic former Scandals space on Harvey Milk Street. Grand opening July 11, 2026.'
           WHERE lower(name) IN ('camp bar pdx', 'camp bar', 'camp')`,
        )
        .run();
      recordBootMigration("grand_opening_verified_dates_v1");
    } catch (e) {
      console.warn("[businesses] grand opening verified dates migration failed:", e);
    }
  }
  // Expire is_new when verified opening day is older than 60 days.
  try {
    const rows = sqlite
      .prepare(`SELECT id, grand_opening_date FROM businesses WHERE is_new = 1 AND grand_opening_date IS NOT NULL`)
      .all() as Array<{ id: number; grand_opening_date: string }>;
    const now = Date.now();
    const windowMs = 60 * 24 * 60 * 60 * 1000;
    for (const row of rows) {
      const iso = /^\d{4}-\d{2}-\d{2}$/.test(row.grand_opening_date)
        ? `${row.grand_opening_date}T12:00:00-07:00`
        : row.grand_opening_date;
      const t = Date.parse(iso);
      if (!Number.isFinite(t)) continue;
      if (now - t >= windowMs) {
        sqlite.prepare(`UPDATE businesses SET is_new = 0 WHERE id = ?`).run(row.id);
      }
    }
  } catch (e) {
    console.warn("[businesses] grand opening expiry cleanup failed:", e);
  }
  if (!hasBootMigration("seed_business_bowery_bagels_v1")) {
    const now = new Date().toISOString();
    db.insert(businesses).values({
      name: "Bowery Bagels",
      type: "cafe",
      description:
        "Portland's premier New York-style handcrafted kosher bagels-boiled & baked fresh daily, with delicious schmears, sandwiches, vegan options, and Stumptown coffee. Active Pride participant with rainbow schmear specials.",
      address: "310 NW Broadway",
      neighborhood: "Old Town Chinatown",
      website: "https://www.bowerybagels.com/",
      instagram: "@bowerybagels",
      queerOwned: false,
      queerFriendly: true,
      lat: 45.5257,
      lng: -122.6758,
      hours: "Old Town: Mon–Fri 7am–1pm, Sat–Sun 8am–2pm (PSU location also available)",
      phone: "(503) 227-6674",
      active: true,
      isNew: false,
      createdAt: now,
    } as any).run();
    recordBootMigration("seed_business_bowery_bagels_v1");
  }
    if (!hasBootMigration("seed_nonprofits_directory_v9")) {
    const now = new Date().toISOString();
    const orgs = [
      { name: "Cascade AIDS Project (CAP) & Our House", type: "nonprofit", description: "The Northwest's leading HIV services org since 1983, prevention, testing, supportive housing, and LGBTQ+ health care, plus Our House residential care for people living with HIV.", website: "https://www.capnw.org/", donateUrl: "https://www.capnw.org/donate", neighborhood: "Old Town" },
      { name: "Pride Northwest", type: "nonprofit", description: "The organizers of Portland Pride. Year-round programs celebrating and supporting the LGBTQ2SIA+ community, including Trans Unity and Pride Days of Service.", website: "https://www.pridenw.org/", donateUrl: "https://www.pridenw.org/donate" },
      { name: "Basic Rights Oregon", type: "nonprofit", description: "Oregon's statewide LGBTQ2SIA+ advocacy organization, political, legal, and grassroots work to ensure all Oregonians experience equality.", website: "https://www.basicrights.org/", donateUrl: "https://www.basicrights.org/donate" },
      { name: "New Avenues for Youth / SMYRC", type: "nonprofit", description: "SMYRC, a program of New Avenues for Youth, has served LGBTQIA2S+ youth ages 13–24 since 1998, a drop-in space with food, clothing, gender-affirming garments, counseling, and community events.", website: "https://newavenues.org/smyrc/", donateUrl: "https://newavenues.org/donate/give-lgbtqia2s/", address: "1220 SW Columbia St", neighborhood: "Downtown" },
      { name: "Outside In", type: "nonprofit", description: "Health care and social services for young people experiencing homelessness since 1968, including the QueerZone drop-in, an LGBTQ-affirming clinic with gender-affirming care, meals, showers, and housing help.", website: "https://outsidein.org/", donateUrl: "https://outsidein.org/about-us/donate-now/", address: "1132 SW 13th Ave", neighborhood: "Downtown" },
      { name: "The Marie Equi Center", type: "nonprofit", description: "Trauma-informed, culturally affirming health and social services for trans, queer, intersex, and gender-diverse communities, peer support, harm reduction, and housing advocacy from their Brooklyn service center.", website: "https://www.marieequi.center/", donateUrl: "https://www.marieequi.center/donate", neighborhood: "SE Portland" },
      { name: "WERQ Together", type: "nonprofit", description: "Trans-led org providing relocation assistance, emergency shelter, peer support, and economic justice for two-spirit, trans, non-binary, and gender non-conforming people in Oregon.", website: "https://werqt.org/", donateUrl: "https://werqt.org/donate" },
      { name: "Portland Gay Men's Chorus", type: "nonprofit", description: "One of the oldest LGBTQ+ choruses in the country, singing for Portland since 1980, concerts, community performances, and queer joy in four-part harmony.", website: "https://www.pdxgmc.org/", donateUrl: "https://www.pdxgmc.org/support/donate/", imageUrl: "https://www.pdxgmc.org/wp-content/uploads/2017/04/PGMC-Logo.png" },
    ];
    for (const o of orgs) {
      db.insert(businesses).values({ queerOwned: true, queerFriendly: true, active: true, isNew: false, createdAt: now, ...o } as any).run();
    }
    recordBootMigration("seed_nonprofits_directory_v9");
  }
    if (!hasBootMigration("seed_underu4men_v10")) {
    const now = new Date().toISOString();
    db.insert(businesses).values({
      name: "underU4men",
      type: "shop",
      description: "Men's underwear, swimwear, gymwear, and apothecary boutique, a longtime queer Portland staple, now at its new downtown home on SW Morrison.",
      address: "1013 SW Morrison St",
      neighborhood: "Downtown",
      website: "https://shop.underu4men.com",
      phone: "(503) 274-2555",
      hours: "Mon–Sat 10am–7pm, Sun 11am–6pm",
      queerOwned: true,
      queerFriendly: true,
      active: true,
      isNew: false,
      createdAt: now,
    } as any).run();
    recordBootMigration("seed_underu4men_v10");
  }
  if (!hasBootMigration("seed_meetrack_directory_v11")) {
    const now = new Date().toISOString();
    const exists = sqlite
      .prepare(`SELECT id FROM businesses WHERE name = ? LIMIT 1`)
      .get("The Meet Rack at Darkroom") as { id: number } | undefined;
    if (!exists) {
      db.insert(businesses).values({
        name: "The Meet Rack at Darkroom",
        type: "venue",
        description:
          "Portland's private event club for men, hosted at Darkroom. Regular in-person events at the intersection of community, social life, kink, body positivity, and mutual respect. Details and calendar at meetrack.org.",
        address: null,
        neighborhood: "Portland",
        website: "https://meetrack.org",
        instagram: null,
        queerOwned: false,
        queerFriendly: true,
        isNew: false,
        active: true,
        createdAt: now,
      } as any).run();
    }
    recordBootMigration("seed_meetrack_directory_v11");
  }
  if (!hasBootMigration("sync_event_map_coordinates_v1")) {
    const directoryRows = db.select().from(businesses).all().filter(b => b.active);
    const missing = sqlite.prepare(`
      SELECT id, venue_name AS venueName, address, lat, lng
      FROM events
      WHERE status = 'LIVE' AND (lat IS NULL OR lng IS NULL)
    `).all() as Array<{ id: number; venueName: string; address: string | null; lat: number | null; lng: number | null }>;
    for (const row of missing) {
      const merged = mergeMapCoordinates(row, directoryRows);
      if (merged.lat != null && merged.lng != null) {
        sqlite.prepare(`UPDATE events SET lat = ?, lng = ? WHERE id = ?`).run(merged.lat, merged.lng, row.id);
      }
    }
    recordBootMigration("sync_event_map_coordinates_v1");
  }

  // Squarespace (and similar) sometimes ship map pins outside PDX (Hawks → NYC).
  // Rewrite LIVE pins that fall outside greater Portland using directory match.
  if (!hasBootMigration("fix_out_of_metro_event_coords_v1")) {
    const directoryRows = db.select().from(businesses).all().filter(b => b.active);
    const rows = sqlite.prepare(`
      SELECT id, venue_name AS venueName, address, lat, lng
      FROM events
      WHERE status = 'LIVE' AND lat IS NOT NULL AND lng IS NOT NULL
        AND NOT (lat >= 45.0 AND lat <= 46.1 AND lng >= -123.8 AND lng <= -121.5)
    `).all() as Array<{ id: number; venueName: string; address: string | null; lat: number | null; lng: number | null }>;
    for (const row of rows) {
      const merged = mergeMapCoordinates(
        { venueName: row.venueName, address: row.address, lat: null, lng: null },
        directoryRows,
      );
      if (merged.lat != null && merged.lng != null) {
        sqlite.prepare(`UPDATE events SET lat = ?, lng = ? WHERE id = ?`).run(merged.lat, merged.lng, row.id);
      }
    }
    recordBootMigration("fix_out_of_metro_event_coords_v1");
  }

  // Fix brohoejams talent row: the DJ credit on yes_coach event has tucker's user_id instead of brohoejams'
  if (!hasBootMigration("fix_brohoejams_talent_v1")) {
    const tucker = sqlite.prepare(`SELECT id FROM users WHERE LOWER(username) = 'tucker_pdmax'`).get() as { id: number } | undefined;
    const brohoe = sqlite.prepare(`SELECT id FROM users WHERE LOWER(username) = 'brohoejams'`).get() as { id: number } | undefined;
    const yesCoachEvt = sqlite.prepare(`SELECT id FROM events WHERE LOWER(title) LIKE '%yes coach%' LIMIT 1`).get() as { id: number } | undefined;
    if (tucker && brohoe && yesCoachEvt) {
      sqlite.prepare(`UPDATE event_talent SET user_id = ? WHERE event_id = ? AND user_id = ?`).run(brohoe.id, yesCoachEvt.id, tucker.id);
    }
    if (brohoe) {
      const bh = sqlite.prepare(`SELECT display_name FROM users WHERE id = ?`).get(brohoe.id) as { display_name: string | null } | undefined;
      if (!bh?.display_name) {
        sqlite.prepare(`UPDATE users SET display_name = 'Bro Hoe' WHERE id = ?`).run(brohoe.id);
      }
    }
    recordBootMigration("fix_brohoejams_talent_v1");
  }

  // Force brohoejams display name to "Bro Hoe" regardless of prior value
  if (!hasBootMigration("fix_brohoejams_displayname_v2")) {
    const brohoe = sqlite.prepare(`SELECT id FROM users WHERE LOWER(username) = 'brohoejams'`).get() as { id: number } | undefined;
    if (brohoe) {
      sqlite.prepare(`UPDATE users SET display_name = 'Bro Hoe' WHERE id = ?`).run(brohoe.id);
    }
    recordBootMigration("fix_brohoejams_displayname_v2");
  }

  // Sanctuary events were never free - door fee / ticketed only.
  if (!hasBootMigration("sanctuary_never_free_v1")) {
    sqlite.prepare(`
      UPDATE events
      SET admission = 'DOOR_FEE'
      WHERE status = 'LIVE'
        AND UPPER(COALESCE(admission, '')) IN ('FREE', '')
        AND (
          LOWER(venue_name) LIKE '%sanctuary%'
          OR LOWER(title) LIKE '%yes coach%'
          OR LOWER(title) LIKE '%stank%'
        )
    `).run();
    recordBootMigration("sanctuary_never_free_v1");
  }

  // Year-round trusted club pulls often leave admission UNKNOWN (thin feed text).
  // Re-tag from title+description when clear; else door fee for known club venues.
  if (!hasBootMigration("retag_unknown_admission_v1")) {
    // Explicit free / no cover
    sqlite.prepare(`
      UPDATE events
      SET admission = 'FREE'
      WHERE status IN ('LIVE', 'HIDDEN')
        AND UPPER(COALESCE(admission, 'UNKNOWN')) IN ('UNKNOWN', '')
        AND (
          LOWER(title || ' ' || COALESCE(description, '')) LIKE '%no cover%'
          OR LOWER(title || ' ' || COALESCE(description, '')) LIKE '%free entry%'
          OR LOWER(title || ' ' || COALESCE(description, '')) LIKE '%free admission%'
          OR LOWER(title || ' ' || COALESCE(description, '')) LIKE '%free show%'
        )
    `).run();
    // Ticket language or Eventbrite ticket URL
    sqlite.prepare(`
      UPDATE events
      SET admission = 'TICKETED'
      WHERE status IN ('LIVE', 'HIDDEN')
        AND UPPER(COALESCE(admission, 'UNKNOWN')) IN ('UNKNOWN', '')
        AND (
          LOWER(COALESCE(ticket_url, '')) LIKE '%eventbrite.com/e/%'
          OR LOWER(COALESCE(ticket_url, '')) LIKE '%ticketmaster%'
          OR LOWER(title || ' ' || COALESCE(description, '')) LIKE '%ticket%'
          OR LOWER(title || ' ' || COALESCE(description, '')) LIKE '%get tix%'
          OR LOWER(title || ' ' || COALESCE(description, '')) LIKE '%buy tickets%'
        )
    `).run();
    // Cover / door fee signals
    sqlite.prepare(`
      UPDATE events
      SET admission = 'DOOR_FEE'
      WHERE status IN ('LIVE', 'HIDDEN')
        AND UPPER(COALESCE(admission, 'UNKNOWN')) IN ('UNKNOWN', '')
        AND (
          LOWER(title || ' ' || COALESCE(description, '')) LIKE '%cover%'
          OR LOWER(title || ' ' || COALESCE(description, '')) LIKE '%door fee%'
          OR LOWER(title || ' ' || COALESCE(description, '')) LIKE '%at the door%'
        )
    `).run();
    // Club weeklies from Trusted adapters with no text signal → DOOR_FEE (not FREE)
    sqlite.prepare(`
      UPDATE events
      SET admission = 'DOOR_FEE'
      WHERE status IN ('LIVE', 'HIDDEN')
        AND UPPER(COALESCE(admission, 'UNKNOWN')) IN ('UNKNOWN', '')
        AND (
          LOWER(venue_name) LIKE '%badlands%'
          OR LOWER(venue_name) LIKE '%hawks%'
          OR LOWER(venue_name) LIKE '%darcelle%'
          OR LOWER(venue_name) LIKE '%eagle%'
          OR LOWER(venue_name) LIKE '%sanctuary%'
          OR LOWER(venue_name) LIKE '%cc slaughter%'
          OR LOWER(venue_name) LIKE '%camp bar%'
          OR LOWER(venue_name) LIKE '%stag%'
        )
    `).run();
    recordBootMigration("retag_unknown_admission_v1");
  }

  // Clubs & Groups directory section (claimable like other businesses).
  if (!hasBootMigration("seed_directory_clubs_groups_v1")) {
    const now = new Date().toISOString();
    const clubs = [
      {
        name: "The Imperial Sovereign Rose Court of Oregon",
        type: "group",
        description:
          "Portland's Imperial Sovereign Rose Court - the oldest continuously operating court system organization in the world. Coronations, fundraisers, and community service for LGBTQ+ causes across Oregon.",
        address: "Portland, OR",
        neighborhood: "Portland",
        website: "https://rosecourt.org",
        instagram: "@rosecourtpdx",
        queerOwned: true,
        queerFriendly: true,
      },
      {
        name: "Pink Ponies",
        type: "group",
        description:
          "Portland queer social and party collective - Western nights, fundraisers, and scene-building collabs (including Yes Coach × Pink Ponies). Community first, boots optional.",
        address: "Portland, OR",
        neighborhood: "Portland",
        website: null,
        instagram: "@pinkponiespdx",
        queerOwned: true,
        queerFriendly: true,
      },
    ];
    for (const entry of clubs) {
      const exists = sqlite.prepare(
        `SELECT id FROM businesses WHERE LOWER(name) = LOWER(?) LIMIT 1`,
      ).get(entry.name) as { id: number } | undefined;
      if (!exists) {
        db.insert(businesses).values({ ...entry, active: true, createdAt: now } as any).run();
      }
    }
    recordBootMigration("seed_directory_clubs_groups_v1");
  }

  // Flyer-confirmed live events: add @brohoejams as DJ + COHOST (idempotent).
  // Archive nights (Locker Room series, Stank 2025, Cozy, Camp Honey, Hyde, Overtime)
  // are credited via mergeTuckerHostedArchivePast - not rows in event_*.
  if (!hasBootMigration("credit_brohoejams_flyer_events_v1")) {
    ensureEventHostsSchema();
    ensureEventTalentSchema();
    const brohoe = sqlite.prepare(`SELECT id FROM users WHERE LOWER(username) = 'brohoejams'`).get() as { id: number } | undefined;
    const tucker = sqlite.prepare(`SELECT id FROM users WHERE LOWER(username) = 'tucker_pdmax'`).get() as { id: number } | undefined;
    if (brohoe) {
      const now = new Date().toISOString();
      const liveMatches = sqlite.prepare(`
        SELECT id, title FROM events
        WHERE status = 'LIVE'
          AND (
            (LOWER(title) LIKE '%stank%' AND (LOWER(title) LIKE '%coach%' OR LOWER(title) LIKE '%yes%'))
            OR LOWER(title) LIKE '%locker room%'
            OR LOWER(title) LIKE '%camp honey%'
            OR (LOWER(title) = 'cozy' OR LOWER(title) LIKE 'cozy %' OR LOWER(title) LIKE '% cozy')
            OR (LOWER(title) LIKE '%hyde%' AND LOWER(title) NOT LIKE '%hyde park%')
            OR LOWER(title) LIKE '%overtime%'
          )
      `).all() as Array<{ id: number; title: string }>;
      for (const evt of liveMatches) {
        const hostExists = sqlite.prepare(
          `SELECT id FROM event_hosts WHERE event_id = ? AND user_id = ?`,
        ).get(evt.id, brohoe.id);
        if (!hostExists) {
          const hostCount = (sqlite.prepare(
            `SELECT COUNT(*) AS c FROM event_hosts WHERE event_id = ?`,
          ).get(evt.id) as { c: number }).c;
          if (hostCount < 3) {
            sqlite.prepare(`
              INSERT INTO event_hosts (event_id, user_id, role, added_by_user_id, created_at)
              VALUES (?, ?, 'COHOST', ?, ?)
            `).run(evt.id, brohoe.id, tucker?.id ?? null, now);
          }
        }
        const talentExists = sqlite.prepare(
          `SELECT id FROM event_talent WHERE event_id = ? AND user_id = ? AND role = 'DJ' AND status IN ('LIVE', 'PENDING')`,
        ).get(evt.id, brohoe.id);
        if (!talentExists) {
          sqlite.prepare(`
            INSERT INTO event_talent (event_id, user_id, role, status, added_by_user_id, created_at)
            VALUES (?, ?, 'DJ', 'LIVE', ?, ?)
          `).run(evt.id, brohoe.id, tucker?.id ?? null, now);
        }
      }
    }
    recordBootMigration("credit_brohoejams_flyer_events_v1");
  }

  // syncOwnerDisplayName mistakenly renamed granted admins to Tucker_PDmaX - undo + fix Sugar Pill.
  if (!hasBootMigration("fix_owner_displayname_clobber_v1")) {
    const ownerDisplay = (
      process.env.OWNER_DISPLAY_NAME || "Tucker_PDmaX"
    ).trim();
    const owner = resolveSiteOwner();
    if (owner) {
      sqlite.prepare(`
        UPDATE users SET display_name = NULL
        WHERE display_name = ? AND id != ?
      `).run(ownerDisplay, owner.id);
    }
    const heygirl = sqlite.prepare(`
      SELECT id FROM users
      WHERE LOWER(username) = 'heygirl' OR LOWER(email) = 'heygirl@sugarpillpdx.com'
      LIMIT 1
    `).get() as { id: number } | undefined;
    if (heygirl) {
      sqlite.prepare(`UPDATE users SET display_name = 'Sugar Pill' WHERE id = ?`).run(heygirl.id);
    }
    recordBootMigration("fix_owner_displayname_clobber_v1");
  }

  // v1 migration could run then syncOwnerDisplayName re-clobbered env-listed admins on login.
  if (!hasBootMigration("fix_heygirl_displayname_v2")) {
    const owner = resolveSiteOwner();
    const ownerDisplay = (process.env.OWNER_DISPLAY_NAME || "Tucker_PDmaX").trim();
    if (owner) {
      sqlite.prepare(`
        UPDATE users SET display_name = NULL
        WHERE display_name = ? AND id != ?
      `).run(ownerDisplay, owner.id);
    }
    sqlite.prepare(`
      UPDATE users SET display_name = 'Sugar Pill'
      WHERE id = 15
         OR LOWER(username) = 'heygirl'
         OR LOWER(email) = 'heygirl@sugarpillpdx.com'
    `).run();
    recordBootMigration("fix_heygirl_displayname_v2");
  }
  if (!hasBootMigration("remove_pre_pride_week_events_v1")) {
    removePrePrideWeekEvents();
    recordBootMigration("remove_pre_pride_week_events_v1");
  }
  if (!hasBootMigration("sanctuary_sex_positive_v1")) {
    sqlite.prepare(`
      UPDATE events
      SET is_sex_positive = 1
      WHERE LOWER(TRIM(venue_name)) LIKE '%sanctuary%'
    `).run();
    recordBootMigration("sanctuary_sex_positive_v1");
  }
  if (!hasBootMigration("seed_pdxpah_events_v1")) {
    seedPdxPahJuly2026Events();
    recordBootMigration("seed_pdxpah_events_v1");
  }
  if (!hasBootMigration("seed_camp_bar_pride_week_2026_v1")) {
    seedCampBarPrideWeek2026Events();
    recordBootMigration("seed_camp_bar_pride_week_2026_v1");
  }
  if (!hasBootMigration("lumbertwink_world_cup_time_v1")) {
    // 3–8pm → 4–9pm for World Cup (confirmed Jul 2026)
    sqlite.prepare(`
      UPDATE events SET
        date_start = '2026-07-19T16:00:00',
        date_end = '2026-07-19T21:00:00',
        description = 'Lumbertwink Plaid Patio Pride at Jackie''s, 4–9pm (shifted from 3–8 for the World Cup). DJs Not That Jennifer and Orographic, sexy lumber go-gos, photo booth by Matty Hoffman. $18.69 plaid / $29.45 non-plaid.',
        admin_notes = COALESCE(admin_notes, 'Time shifted 3–8 → 4–9 for World Cup')
      WHERE title = 'Lumbertwink Plaid Patio Pride'
    `).run();
    recordBootMigration("lumbertwink_world_cup_time_v1");
  }
  if (!hasBootMigration("seed_missing_wweek_pride_events_v1")) {
    seedMissingWweekPrideEvents2026();
    recordBootMigration("seed_missing_wweek_pride_events_v1");
  }
  if (!hasBootMigration("seed_checking_portland_events_july_2026_v1")) {
    seedCheckingPortlandEventsJuly2026();
    recordBootMigration("seed_checking_portland_events_july_2026_v1");
  }
  if (!hasBootMigration("delete_unverified_checking_portland_events_v1")) {
    deleteUnverifiedCheckingPortlandEvents();
    recordBootMigration("delete_unverified_checking_portland_events_v1");
  }
  if (!hasBootMigration("hide_unverified_checking_portland_events_v1")) {
    // Scandals downtown closed; unverified GLOW/specials stay hidden.
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
    ];
    const hide = sqlite.prepare(`
      UPDATE events SET
        status = 'HIDDEN',
        admin_notes = COALESCE(admin_notes || ' | ', '') || 'Hidden: Checking-Portland-events-July-2026 batch unverified (Scandals address wrong; do not show until confirmed).'
      WHERE title = ?
    `);
    for (const title of titles) hide.run(title);
    recordBootMigration("hide_unverified_checking_portland_events_v1");
  }
  if (!hasBootMigration("verify_checking_portland_events_v2")) {
    // Restore only source-verified listings from that batch; rest stay HIDDEN.
    sqlite.prepare(`
      UPDATE events SET
        title = 'Trans-UHH-Licious',
        description = 'Weekly residency dedicated to the trans community at CC Slaughters, local and regional trans talent, hosted by Sheniqua Volt. DJ ROBB, then DJ Lyta Blunt (hip-hop) until late. Pride Week Thursday edition. No cover.',
        venue_name = 'CC Slaughters',
        address = '219 NW Davis St, Portland, OR 97209',
        neighborhood = 'Old Town',
        date_start = '2026-07-16T21:00:00',
        date_end = '2026-07-17T02:00:00',
        day_of_week = 'THU',
        age_requirement = '21_PLUS',
        admission = 'FREE',
        ticket_url = 'https://ccslaughterspdx.com/',
        event_types = '["DRAG","TRANS","PERFORMANCE","NIGHTLIFE"]',
        is_sex_positive = 0,
        nudity_ok = 0,
        status = 'LIVE',
        admin_notes = 'Verified via ccslaughterspdx.com weeklys + Queer Social Club. FREE weekly residency (not a ticketed special).'
      WHERE title IN ('Trans-UHH-Licious', 'CC Slaughters GLOW: Trans-Uhh-Licious')
    `).run();
    sqlite.prepare(`
      UPDATE events SET
        title = 'Lavender Rain: Pride Edition (Queer Strip Club Pop-Up)',
        description = 'The Gay Barn''s queer strip club pop-up at Peacock PDX for Pride Weekend. Sliding-scale tickets $17–$28 (door tickets also available). For dykes, lesbians, and dyke-adjacent queers 21+; respectful allies welcome. POC discount codes via TheGayBarn@proton.me.',
        venue_name = 'Peacock PDX',
        address = '1400 SE Morrison St, Portland, OR 97214',
        neighborhood = 'SE Portland',
        date_start = '2026-07-18T21:00:00',
        date_end = '2026-07-19T01:00:00',
        day_of_week = 'SAT',
        age_requirement = '21_PLUS',
        admission = 'TICKETED',
        ticket_url = 'https://forbiddentickets.com/events/the-gay-barn/2026-07-18-lavender-rain-pride-edition',
        poster_image_url = 'https://forbiddentickets.com/media/pages/events/the-gay-barn/96a1607597/a0f76a30e9-1779389095/lavender-rain-july.png',
        event_types = '["PERFORMANCE","PARTY","BURLESQUE"]',
        is_sex_positive = 1,
        nudity_ok = 1,
        status = 'LIVE',
        admin_notes = 'Verified Forbidden Tickets + Gay Barn flyer. WW misnamed as Purple Rain.'
      WHERE title LIKE 'Lavender Rain%'
    `).run();
    sqlite.prepare(`
      UPDATE events SET
        status = 'HIDDEN',
        admin_notes = COALESCE(admin_notes || ' | ', '') || 'Hidden as duplicate of Lavender Rain Pride Edition (Gay Barn / Peacock Jul 18) - WW used Purple Rain name.'
      WHERE title LIKE 'Purple Rain%'
    `).run();
    recordBootMigration("verify_checking_portland_events_v2");
  }
  if (!hasBootMigration("cc_slaughters_glow_pride_2026_v1")) {
    // Official CC Slaughters "GLOW Pride 2026" poster (Jul 16–19). One shared
    // poster for the whole run, repeated across each day's event.
    const now = new Date().toISOString();
    const POSTER = "/posters/cc-slaughters-glow-2026.jpg";
    const DJ_LINE =
      "Feat. DJ Robb, DJ Mawmie, Lyta Blunt, Chelsea Starr, DJ Ragnarok, and special guest DJ Pup Sam.";
    // Thursday (Trans-UHH-Licious) already exists - align it to the poster and
    // attach the shared GLOW artwork.
    sqlite.prepare(`
      UPDATE events SET
        poster_image_url = ?,
        admission = 'TICKETED',
        description = 'GLOW Pride 2026 edition of Trans-Uhh-Licious at CC Slaughters - the residency dedicated to the trans community, hosted by Sheniqua Volt with DJ Robb. Live show 9–11pm. $10 cover. 21+.',
        admin_notes = COALESCE(admin_notes || ' | ', '') || 'Updated from official CC Slaughters GLOW Pride 2026 poster: $10 cover, DJ Robb, poster attached.'
      WHERE title = 'Trans-UHH-Licious' AND venue_name = 'CC Slaughters'
    `).run(POSTER);
    const glowBase = {
      venueName: "CC Slaughters",
      address: "219 NW Davis St, Portland, OR 97209",
      neighborhood: "Old Town",
      lat: 45.5246801,
      lng: -122.6729454,
      ticketUrl: "https://ccslaughterspdx.com/",
      posterImageUrl: POSTER,
      ageRequirement: "21_PLUS",
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
      createdAt: now,
    };
    const glowEvents = [
      {
        title: "CC Slaughters GLOW: Pride Weekend Kick-Off Party",
        description:
          "Pride Weekend Kick-Off Party at CC Slaughters for GLOW Pride 2026, hosted by Bolivia Carmichaels with live DJs (9pm–2am). Earlier in the Rainbow Room: The Queens Keys (7–9pm) and a RuPaul's Drag Race All Stars viewing (8–9pm). $15 cover beginning at 8pm. 21+. " +
          DJ_LINE,
        dateStart: "2026-07-17T21:00:00",
        dateEnd: "2026-07-18T02:00:00",
        dayOfWeek: "FRI",
        admission: "TICKETED",
        eventTypes: JSON.stringify(["DRAG", "DANCE", "NIGHTLIFE", "PERFORMANCE"]),
        adminNotes: "From official CC Slaughters GLOW Pride 2026 poster (Jul 16–19).",
      },
      {
        title: "CC Slaughters GLOW: Pride Party",
        description:
          "The GLOW Pride Party at CC Slaughters - glow with pride and dance your queer ass off. Hosted by Bolivia Carmichaels with live DJs and glow party favors (9pm–2am). Earlier: a Gay Cinema Matinee (3–9pm) screening The Birdcage, Fire Island, and To Wong Foo. $20 cover beginning at 8pm. 21+. " +
          DJ_LINE,
        dateStart: "2026-07-18T21:00:00",
        dateEnd: "2026-07-19T02:00:00",
        dayOfWeek: "SAT",
        admission: "TICKETED",
        eventTypes: JSON.stringify(["DANCE", "DRAG", "NIGHTLIFE"]),
        adminNotes: "From official CC Slaughters GLOW Pride 2026 poster (Jul 16–19).",
      },
      {
        title: "CC Slaughters GLOW: Parade Day Party",
        description:
          "GLOW Pride 2026 parade day at CC Slaughters - front-row NW Pride Parade viewing, a self-serve bloody mary bar, live DJs, and a puppy mosh. No cover. 21+. " +
          DJ_LINE,
        dateStart: "2026-07-19T10:00:00",
        dateEnd: "2026-07-20T02:00:00",
        dayOfWeek: "SUN",
        admission: "FREE",
        eventTypes: JSON.stringify(["PARTY", "DJ", "SOCIAL"]),
        adminNotes: "From official CC Slaughters GLOW Pride 2026 poster (Jul 16–19).",
      },
    ];
    const glowExists = sqlite.prepare("SELECT id FROM events WHERE title = ? LIMIT 1");
    for (const ev of glowEvents) {
      if (glowExists.get(ev.title)) continue;
      db.insert(events).values({ ...glowBase, ...ev } as any).run();
    }
    recordBootMigration("cc_slaughters_glow_pride_2026_v1");
  }
  if (!hasBootMigration("cc_slaughters_glow_pride_2026_v2")) {
    // Per the poster, each listing is its own event. Break the Friday and
    // Saturday add-ons out of the party descriptions into standalone events.
    const now = new Date().toISOString();
    const POSTER = "/posters/cc-slaughters-glow-2026.jpg";
    const DJ_LINE =
      "Feat. DJ Robb, DJ Mawmie, Lyta Blunt, Chelsea Starr, DJ Ragnarok, and special guest DJ Pup Sam.";
    // Trim the now-standalone sub-events out of the two party descriptions.
    sqlite.prepare(`
      UPDATE events SET description = ?
      WHERE title = 'CC Slaughters GLOW: Pride Weekend Kick-Off Party'
    `).run(
      "Pride Weekend Kick-Off Party at CC Slaughters for GLOW Pride 2026, hosted by Bolivia Carmichaels with live DJs (9pm–2am). $15 cover beginning at 8pm. 21+. " +
        DJ_LINE,
    );
    sqlite.prepare(`
      UPDATE events SET description = ?
      WHERE title = 'CC Slaughters GLOW: Pride Party'
    `).run(
      "The GLOW Pride Party at CC Slaughters - glow with pride and dance your queer ass off. Hosted by Bolivia Carmichaels with live DJs and glow party favors (9pm–2am). $20 cover beginning at 8pm. 21+. " +
        DJ_LINE,
    );
    const glowBase = {
      venueName: "CC Slaughters",
      address: "219 NW Davis St, Portland, OR 97209",
      neighborhood: "Old Town",
      lat: 45.5246801,
      lng: -122.6729454,
      ticketUrl: "https://ccslaughterspdx.com/",
      posterImageUrl: POSTER,
      ageRequirement: "21_PLUS",
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
      createdAt: now,
    };
    const subEvents = [
      {
        title: "CC Slaughters GLOW: The Queens Keys",
        description:
          "The Queens Keys in the Rainbow Room at CC Slaughters, part of GLOW Pride 2026. 7–9pm. 21+.",
        dateStart: "2026-07-17T19:00:00",
        dateEnd: "2026-07-17T21:00:00",
        dayOfWeek: "FRI",
        admission: "FREE",
        eventTypes: JSON.stringify(["PERFORMANCE", "DRAG", "NIGHTLIFE"]),
        adminNotes: "From official CC Slaughters GLOW Pride 2026 poster (Jul 16–19).",
      },
      {
        title: "CC Slaughters GLOW: RuPaul's Drag Race All Stars Viewing",
        description:
          "RuPaul's Drag Race All Stars viewing party at CC Slaughters, part of GLOW Pride 2026. 8–9pm. 21+.",
        dateStart: "2026-07-17T20:00:00",
        dateEnd: "2026-07-17T21:00:00",
        dayOfWeek: "FRI",
        admission: "FREE",
        eventTypes: JSON.stringify(["SOCIAL", "DRAG"]),
        adminNotes: "From official CC Slaughters GLOW Pride 2026 poster (Jul 16–19).",
      },
      {
        title: "CC Slaughters GLOW: Gay Cinema Matinee",
        description:
          "Gay Cinema Matinee at CC Slaughters for GLOW Pride 2026 - a triple bill of The Birdcage, Fire Island, and To Wong Foo. 3–9pm. 21+.",
        dateStart: "2026-07-18T15:00:00",
        dateEnd: "2026-07-18T21:00:00",
        dayOfWeek: "SAT",
        admission: "FREE",
        eventTypes: JSON.stringify(["FILM", "SOCIAL"]),
        adminNotes: "From official CC Slaughters GLOW Pride 2026 poster (Jul 16–19).",
      },
    ];
    const glowExists = sqlite.prepare("SELECT id FROM events WHERE title = ? LIMIT 1");
    for (const ev of subEvents) {
      if (glowExists.get(ev.title)) continue;
      db.insert(events).values({ ...glowBase, ...ev } as any).run();
    }
    recordBootMigration("cc_slaughters_glow_pride_2026_v2");
  }
  if (!hasBootMigration("seed_fridays_are_a_drag_pride_2026_v1")) {
    const exists = sqlite.prepare("SELECT id FROM events WHERE title = ? LIMIT 1").get(
      "Fridays Are A DRAG, Pride Weekend",
    );
    if (!exists) {
      const now = new Date().toISOString();
      db.insert(events).values({
        title: "Fridays Are A DRAG - Pride Weekend",
        description:
          "Portland Pride Weekend edition of Fridays Are A DRAG at Badlands. Drag showtime 9:30pm with hot gogos, then Friday night dance party with Haute Toddy. Cast: Jay Colby, Mija (LA), Glenn Coco (Seattle), April Rition (Dallas), Seven (PDX), Harlow (PDX). No cover before 9pm. 21+.",
        venueName: "Badlands",
        address: "110 NW Broadway, Portland, OR 97209",
        neighborhood: "Old Town",
        lat: 45.5239294,
        lng: -122.677178,
        dateStart: "2026-07-17T21:30:00",
        dateEnd: "2026-07-18T02:00:00",
        dayOfWeek: "FRI",
        ageRequirement: "21_PLUS",
        eventTypes: JSON.stringify(["DRAG", "PERFORMANCE", "NIGHTLIFE", "PARTY"]),
        admission: "DOOR_FEE",
        ticketUrl: "https://www.instagram.com/p/DZ_oQ3jPygT/",
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
        adminNotes:
          "Verified Jay Colby IG post DZ_oQ3jPygT + Badlands (110 NW Broadway). Pride weekend Fri Jul 17 2026.",
        createdAt: now,
      } as any).run();
    }
    recordBootMigration("seed_fridays_are_a_drag_pride_2026_v1");
  }
  if (!hasBootMigration("lavender_rain_forbidden_tickets_v3")) {
    sqlite.prepare(`
      UPDATE events SET
        title = 'Lavender Rain: Pride Edition (Queer Strip Club Pop-Up)',
        description = 'The Gay Barn''s queer strip club pop-up at Peacock PDX for Pride Weekend. Sliding-scale tickets $17–$28 (door tickets also available). For dykes, lesbians, and dyke-adjacent queers 21+; respectful allies welcome. POC discount codes via TheGayBarn@proton.me.',
        date_start = '2026-07-18T21:00:00',
        date_end = '2026-07-19T01:00:00',
        admission = 'TICKETED',
        ticket_url = 'https://forbiddentickets.com/events/the-gay-barn/2026-07-18-lavender-rain-pride-edition',
        poster_image_url = 'https://forbiddentickets.com/media/pages/events/the-gay-barn/96a1607597/a0f76a30e9-1779389095/lavender-rain-july.png',
        is_sex_positive = 1,
        nudity_ok = 1,
        status = 'LIVE',
        admin_notes = 'Verified Forbidden Tickets (The Gay Barn) 2026-07-18 9pm–1am. Flyer hosted on Forbidden Tickets CDN.'
      WHERE title LIKE 'Lavender Rain%'
    `).run();
    sqlite.prepare(`
      UPDATE events SET status = 'HIDDEN',
        admin_notes = COALESCE(admin_notes || ' | ', '') || 'Superseded by Lavender Rain Pride Edition ticket listing.'
      WHERE title LIKE 'Purple Rain%'
    `).run();
    recordBootMigration("lavender_rain_forbidden_tickets_v3");
  }
  if (!hasBootMigration("badlands_pride_week_calendar_2026_v1")) {
    // Official Badlands calendar feed: https://www.badlandsportland.com/calendar
    // Source: badlands-events.badlandsportland.workers.dev/api/calendar?from=2026-07-13&to=2026-07-19
    const venue = {
      venueName: "Badlands",
      address: "110 NW Broadway, Portland, OR 97209",
      neighborhood: "Old Town",
      lat: 45.5239294,
      lng: -122.677178,
    };
    const now = new Date().toISOString();
    const dowFromLocal = (dateStart: string) =>
      ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][new Date(`${dateStart.slice(0, 10)}T12:00:00`).getDay()];
    const upsert = (row: {
      title: string;
      description: string;
      dateStart: string;
      dateEnd: string;
      eventTypes: string[];
      admission: string;
      ticketUrl: string;
      posterImageUrl: string;
      ageRequirement?: string;
    }) => {
      const existing = sqlite
        .prepare("SELECT id FROM events WHERE title = ? AND date_start = ? LIMIT 1")
        .get(row.title, row.dateStart) as { id: number } | undefined;
      if (existing) {
        sqlite
          .prepare(
            `UPDATE events SET
              description = ?,
              ticket_url = ?,
              poster_image_url = ?,
              date_end = ?,
              admission = ?,
              age_requirement = ?,
              event_types = ?,
              venue_name = ?,
              address = ?,
              neighborhood = ?,
              lat = ?,
              lng = ?,
              status = 'LIVE',
              admin_notes = COALESCE(admin_notes || ' | ', '') || 'Synced from badlandsportland.com/calendar Pride week 2026-07-13..19'
            WHERE id = ?`,
          )
          .run(
            row.description,
            row.ticketUrl,
            row.posterImageUrl,
            row.dateEnd,
            row.admission,
            row.ageRequirement || "21_PLUS",
            JSON.stringify(row.eventTypes),
            venue.venueName,
            venue.address,
            venue.neighborhood,
            venue.lat,
            venue.lng,
            existing.id,
          );
        return;
      }
      // Match known alternate title for Fridays Are A DRAG
      if (row.title.includes("Fridays Are A DRAG") || row.title.includes("Fridays Are A Drag")) {
        const fri = sqlite
          .prepare(
            "SELECT id FROM events WHERE title LIKE 'Fridays Are A DRAG%' AND date_start LIKE '2026-07-17%' LIMIT 1",
          )
          .get() as { id: number } | undefined;
        if (fri) {
          sqlite
            .prepare(
              `UPDATE events SET
                title = ?, description = ?, ticket_url = ?, poster_image_url = ?,
                date_start = ?, date_end = ?, admission = ?, status = 'LIVE',
                venue_name = ?, address = ?,
                admin_notes = COALESCE(admin_notes || ' | ', '') || 'Synced from badlandsportland.com/calendar'
              WHERE id = ?`,
            )
            .run(
              row.title,
              row.description,
              row.ticketUrl,
              row.posterImageUrl,
              row.dateStart,
              row.dateEnd,
              row.admission,
              venue.venueName,
              venue.address,
              fri.id,
            );
          return;
        }
      }
      if (row.title.startsWith("Y2GAY")) {
        const y2 = sqlite
          .prepare("SELECT id FROM events WHERE title LIKE 'Y2GAY%' AND date_start LIKE '2026-07-16%' LIMIT 1")
          .get() as { id: number } | undefined;
        if (y2) {
          sqlite
            .prepare(
              `UPDATE events SET
                title = ?, description = ?, ticket_url = ?, poster_image_url = ?,
                date_start = ?, date_end = ?, admission = ?, status = 'LIVE',
                venue_name = ?, address = ?,
                admin_notes = COALESCE(admin_notes || ' | ', '') || 'Synced from badlandsportland.com/calendar'
              WHERE id = ?`,
            )
            .run(
              row.title,
              row.description,
              row.ticketUrl,
              row.posterImageUrl,
              row.dateStart,
              row.dateEnd,
              row.admission,
              venue.venueName,
              venue.address,
              y2.id,
            );
          return;
        }
      }
      db.insert(events)
        .values({
          title: row.title,
          description: row.description,
          ...venue,
          dateStart: row.dateStart,
          dateEnd: row.dateEnd,
          dayOfWeek: dowFromLocal(row.dateStart),
          ageRequirement: row.ageRequirement || "21_PLUS",
          eventTypes: JSON.stringify(row.eventTypes),
          admission: row.admission,
          ticketUrl: row.ticketUrl,
          isPublic: true,
          isPrivate: false,
          isHouseParty: false,
          isSexPositive: false,
          nudityOk: false,
          posterImageUrl: row.posterImageUrl,
          status: "LIVE",
          source: "admin_seeded",
          isClaimable: true,
          claimedBy: null,
          submittedBy: null,
          adminNotes: "Seeded from official Badlands calendar API (Pride week Jul 13–19 2026).",
          createdAt: now,
        } as any)
        .run();
    };

    const cal = "https://www.badlandsportland.com/calendar";

    const rows: Array<Parameters<typeof upsert>[0]> = [
      {
        title: "Musical Mondays at Badlands",
        description:
          "Musical Mondays at Badlands, songs from stage and screen on Broadway St, hosted by Quesa D'Mondays and Dieter Davis. 9pm–2am. 21+.",
        dateStart: "2026-07-13T21:00:00",
        dateEnd: "2026-07-14T02:00:00",
        eventTypes: ["DRAG", "PERFORMANCE", "MUSIC"],
        admission: "DOOR_FEE",
        ticketUrl: cal,
        posterImageUrl: "/posters/badlands-musical-mondays.png",
      },
      {
        title: "Fresh Paint at Badlands",
        description:
          "An open-call drag show where anything can (and often does) happen. Hosted by Rio Diehl Volt, Portland entertainers get their wings. 10pm–2am. 21+.",
        dateStart: "2026-07-13T22:00:00",
        dateEnd: "2026-07-14T02:00:00",
        eventTypes: ["DRAG", "PERFORMANCE", "OPEN_MIC"],
        admission: "DOOR_FEE",
        ticketUrl: "https://instagram.com/freshpaintportland",
        posterImageUrl: "/posters/badlands-fresh-paint.jpg",
      },
      {
        title: "Karaoke at Badlands - Tuesday",
        description: "Karaoke at Badlands. 9pm–2am. 21+. Official Badlands calendar listing for Pride week.",
        dateStart: "2026-07-14T21:00:00",
        dateEnd: "2026-07-15T02:00:00",
        eventTypes: ["KARAOKE", "NIGHTLIFE"],
        admission: "DOOR_FEE",
        ticketUrl: cal,
        posterImageUrl: "/posters/badlands-karaoke.jpg",
      },
      {
        title: "Request Night at Badlands",
        description: "Request Night at Badlands. 10pm–2am. 21+. Official Badlands calendar listing for Pride week.",
        dateStart: "2026-07-14T22:00:00",
        dateEnd: "2026-07-15T02:00:00",
        eventTypes: ["DANCE", "NIGHTLIFE", "PARTY"],
        admission: "DOOR_FEE",
        ticketUrl: cal,
        posterImageUrl: "/posters/badlands-request-night.jpg",
      },
      {
        title: "Karaoke at Badlands - Wednesday",
        description: "Karaoke at Badlands. 9:30pm–2am. 21+. Official Badlands calendar listing for Pride week.",
        dateStart: "2026-07-15T21:30:00",
        dateEnd: "2026-07-16T02:00:00",
        eventTypes: ["KARAOKE", "NIGHTLIFE"],
        admission: "DOOR_FEE",
        ticketUrl: cal,
        posterImageUrl: "/posters/badlands-karaoke.jpg",
      },
      {
        title: "Woman Crush Wednesdays PRIDE",
        description:
          "Woman Crush Wednesdays PRIDE at Badlands, a night for the girlies in all of us. Harlow Quinzel hosts a femmetastic drag show; 55x DJs the afterparty for the girls, gays, and theys. 10pm–2am. 21+.",
        dateStart: "2026-07-15T22:00:00",
        dateEnd: "2026-07-16T02:00:00",
        eventTypes: ["DRAG", "DANCE", "PARTY", "NIGHTLIFE"],
        admission: "DOOR_FEE",
        ticketUrl: cal,
        posterImageUrl: "/posters/badlands-wcw-pride.jpg",
      },
      {
        title: "Trivia at Badlands",
        description: "Trivia at Badlands. 7pm–9pm. Official Badlands calendar listing for Pride week. 21+.",
        dateStart: "2026-07-16T19:00:00",
        dateEnd: "2026-07-16T21:00:00",
        eventTypes: ["TRIVIA", "COMMUNITY"],
        admission: "DOOR_FEE",
        ticketUrl: cal,
        posterImageUrl: "/posters/badlands-trivia.jpg",
      },
      {
        title: "Y2GAY Pride Edition",
        description:
          "Y2GAY Pride Edition at Badlands, Y2K nostalgia meets Pride. Official Badlands calendar listing. 10pm–2am. 21+.",
        dateStart: "2026-07-16T22:00:00",
        dateEnd: "2026-07-17T02:00:00",
        eventTypes: ["PARTY", "DANCE", "DRAG", "PRIDE"],
        admission: "TICKETED",
        ticketUrl: "https://ma.to/event/y2gay-pride-edition-16-july-2026",
        posterImageUrl: "/posters/badlands-y2gay-pride.jpg",
      },
      {
        title: "Thirsty Thursdays at Badlands",
        description: "Thirsty Thursdays at Badlands. 10pm–2am. 21+. Official Badlands calendar listing for Pride week.",
        dateStart: "2026-07-16T22:00:00",
        dateEnd: "2026-07-17T02:00:00",
        eventTypes: ["PARTY", "DANCE", "NIGHTLIFE"],
        admission: "DOOR_FEE",
        ticketUrl: cal,
        posterImageUrl: "/posters/badlands-thirsty-thursdays.jpg",
      },
      {
        title: "RuPaul's Drag Race All-Stars 11 + Untucked",
        description:
          "Watch party: RuPaul's Drag Race All-Stars 11 + Untucked at Badlands. 7:30pm–9:30pm. Official Badlands calendar listing. 21+.",
        dateStart: "2026-07-17T19:30:00",
        dateEnd: "2026-07-17T21:30:00",
        eventTypes: ["WATCH_PARTY", "DRAG", "COMMUNITY"],
        admission: "DOOR_FEE",
        ticketUrl: cal,
        posterImageUrl: "/posters/badlands-rupauls-all-stars.jpg",
      },
      {
        title: "Fridays Are A DRAG - Pride Weekend",
        description:
          "Fridays Are A Drag PRIDE with Jay Colby at Badlands (official calendar). Showcase of Portland drag excellence into the Friday dance party with hot gogos and Haute Toddy. Showtime 9:30pm. 21+.",
        dateStart: "2026-07-17T21:30:00",
        dateEnd: "2026-07-18T02:15:00",
        eventTypes: ["DRAG", "PERFORMANCE", "NIGHTLIFE", "PARTY"],
        admission: "DOOR_FEE",
        ticketUrl: cal,
        posterImageUrl: "/posters/badlands-fridays-are-a-drag-pride.jpg",
      },
      {
        title: "PRIDE Saturday Dance Party at Badlands",
        description:
          "PRIDE Saturday Dance Party at Badlands with Jules Liesl and DJ Cisco. 9pm–2:15am. Official Badlands calendar listing. 21+.",
        dateStart: "2026-07-18T21:00:00",
        dateEnd: "2026-07-19T02:15:00",
        eventTypes: ["PARTY", "DANCE", "PRIDE", "NIGHTLIFE"],
        admission: "DOOR_FEE",
        ticketUrl: cal,
        posterImageUrl: "/posters/badlands-pride-saturday-dance.jpg",
      },
      {
        title: "Industry Night at Badlands",
        description: "Industry Night at Badlands. 8:30pm–2am. Official Badlands calendar listing for Pride week. 21+.",
        dateStart: "2026-07-19T20:30:00",
        dateEnd: "2026-07-20T02:00:00",
        eventTypes: ["PARTY", "NIGHTLIFE"],
        admission: "DOOR_FEE",
        ticketUrl: cal,
        posterImageUrl: "/posters/badlands-industry-night.jpg",
      },
      {
        title: "Noche Kaliente at Badlands",
        description: "Noche Kaliente at Badlands. 10pm–2am. Official Badlands calendar listing for Pride week. 21+.",
        dateStart: "2026-07-19T22:00:00",
        dateEnd: "2026-07-20T02:00:00",
        eventTypes: ["PARTY", "DANCE", "NIGHTLIFE"],
        admission: "DOOR_FEE",
        ticketUrl: cal,
        posterImageUrl: "/posters/badlands-noche-kaliente.jpg",
      },
    ];
    for (const row of rows) upsert(row);
    recordBootMigration("badlands_pride_week_calendar_2026_v1");
  }
  // FetLife Pride Week gap fill (Jul 13–19 2026): venue munches + STFU + PLA booth.
  // Scrubbed from FetLife via logged-in Chrome; STFU cross-checked with The Den / Eventim.
  if (!hasBootMigration("seed_fetlife_pride_week_gaps_2026_v1")) {
    const now = new Date().toISOString();
    const insertIfMissing = (row: {
      title: string;
      description: string;
      venueName: string;
      address: string;
      neighborhood: string;
      lat: number | null;
      lng: number | null;
      dateStart: string;
      dateEnd: string;
      dayOfWeek: string;
      ageRequirement: string;
      eventTypes: string[];
      admission: string;
      ticketUrl: string;
      isSexPositive: boolean;
      nudityOk: boolean;
      posterImageUrl: string | null;
      adminNotes: string;
    }) => {
      const exists = sqlite
        .prepare("SELECT id FROM events WHERE title = ? AND date_start LIKE ? LIMIT 1")
        .get(row.title, `${row.dateStart.slice(0, 10)}%`);
      if (exists) return;
      db.insert(events).values({
        title: row.title,
        description: row.description,
        venueName: row.venueName,
        address: row.address,
        neighborhood: row.neighborhood,
        lat: row.lat,
        lng: row.lng,
        dateStart: row.dateStart,
        dateEnd: row.dateEnd,
        dayOfWeek: row.dayOfWeek,
        ageRequirement: row.ageRequirement,
        eventTypes: JSON.stringify(row.eventTypes),
        admission: row.admission,
        ticketUrl: row.ticketUrl,
        isPublic: true,
        isPrivate: false,
        isHouseParty: false,
        isSexPositive: row.isSexPositive,
        nudityOk: row.nudityOk,
        posterImageUrl: row.posterImageUrl,
        status: "LIVE",
        source: "admin_seeded",
        isClaimable: true,
        claimedBy: null,
        submittedBy: null,
        adminNotes: row.adminNotes,
        createdAt: now,
      } as any).run();
    };

    insertIfMissing({
      title: "Eastsiders Munch",
      description:
        "Laid-back kink community munch for folks on the far east side of the PDX metro. Good food and conversation at Spinella's Off the Wall in Gresham, they usually aren't busy Tuesday evenings, so the group tends to take over. Ask for the Eastsiders table if you're not sure which group is ours. Vanilla dress code: no obvious collars, leashes, or fetishwear (day collars / discrete gear OK). ~6:30–8:30pm or until close.",
      venueName: "Spinella's Off the Wall",
      address: "436 N Main Ave, Gresham, OR 97030",
      neighborhood: "Gresham",
      lat: 45.4992,
      lng: -122.4305,
      dateStart: "2026-07-14T18:30:00",
      dateEnd: "2026-07-14T20:30:00",
      dayOfWeek: "TUE",
      ageRequirement: "ALL_AGES",
      eventTypes: ["SOCIAL", "KINK"],
      admission: "FREE",
      ticketUrl: "https://fetlife.com/events/2026/07/14/eastsiders-munch-sfuqa8",
      isSexPositive: false,
      nudityOk: false,
      posterImageUrl: null,
      adminNotes:
        "FetLife Eastsiders Munch (miss_spunky). Venue https://www.spinellasoffthewall.com/ · 436 N Main Ave Gresham. Vanilla dress code at restaurant.",
    });

    insertIfMissing({
      title: "PDX Nerd Munch",
      description:
        "Kinky nerds unite, weekly board-game munch at Lucky Labrador Beer Hall on NW Quimby. Meet around 5:30 for food and drinks, games from ~6:00, official end 8:00pm (people often stay until Lucky Lab closes ~9:30, or head to Sanctuary for Game Bang). Look for the pile of board games on a long table. Food available for purchase. Streetwear / Portland vanilla dress. Free entry.",
      venueName: "Lucky Labrador Beer Hall (NW Quimby)",
      address: "1945 NW Quimby St, Portland, OR 97209",
      neighborhood: "NW Portland",
      lat: 45.5345,
      lng: -122.6902,
      dateStart: "2026-07-15T17:30:00",
      dateEnd: "2026-07-15T20:00:00",
      dayOfWeek: "WED",
      ageRequirement: "ALL_AGES",
      eventTypes: ["SOCIAL", "KINK"],
      admission: "FREE",
      ticketUrl: "https://fetlife.com/events/2026/07/15/pdx-nerd-munch-y0ozd3",
      isSexPositive: false,
      nudityOk: false,
      posterImageUrl: null,
      adminNotes:
        "FetLife PDX Nerd Munch (Chantilly-Lace). Lucky Lab 1945 NW Quimby. FetLife group https://fetlife.com/groups/233694.",
    });

    insertIfMissing({
      title: "STFU at The Den!",
      description:
        "Pride Week edition of STFU, the infamous FemDom BDSM play party (formerly 50 Shades of STFU), hosted by Mistress Viola. Pop-up takeover of The Den (SE Industrial): play stations, equipment, multi-domme foot worship/massage, hard point for suspension, vendors, full bar, snacks, security + dungeon monitors. Explicitly Pride Week–framed and LGBTQIA+/queer inclusive for femme/them dommes and submissives who love femdom. 21+ · ADA accessible · sliding-scale tickets $15–45 · dress code enforced (subs/men: no plain street clothes). Consent-forward house rules; no phones in club.",
      venueName: "The Den PDX",
      address: "116 SE Yamhill St, Portland, OR 97214",
      neighborhood: "SE Industrial",
      lat: 45.5157,
      lng: -122.6635,
      dateStart: "2026-07-16T20:00:00",
      dateEnd: "2026-07-17T01:00:00",
      dayOfWeek: "THU",
      ageRequirement: "21_PLUS",
      eventTypes: ["KINK", "SEX_POSITIVE", "NIGHTLIFE", "PARTY", "SOCIAL"],
      admission: "TICKETED",
      ticketUrl: "https://wl.eventim.us/event/stfu/693171?afflky=TheDenPDX",
      isSexPositive: true,
      nudityOk: true,
      posterImageUrl: "/posters/stfu-the-den-pride-2026.jpg",
      adminNotes:
        "FetLife https://fetlife.com/events/2026/07/16/stfu-at-the-den-hjhyfx + The Den https://www.thedenpdx.com/events/stfu (Thu Jul 16 8pm–1am). Flyer from The Den Squarespace.",
    });

    insertIfMissing({
      title: "PLA @ Portland Pride Waterfront Festival (Saturday)",
      description:
        "Portland Leather Alliance hosts a community presence at the official Portland Pride Waterfront Festival. Meet PLA, learn about kink education, classes, workshops, and membership, consent-forward, KECC-aligned educators. Festival is donation-based ($10 suggested by Pride Northwest; no one turned away). Free to visit the PLA booth/space during Saturday festival hours. More PLA events: forbiddentickets.com/events/portland-leather-alliance · portlandleather.org.",
      venueName: "Tom McCall Waterfront Park",
      address: "Naito Pkwy, Portland, OR 97204",
      neighborhood: "Waterfront",
      lat: 45.5126,
      lng: -122.675,
      dateStart: "2026-07-18T12:00:00",
      dateEnd: "2026-07-18T20:00:00",
      dayOfWeek: "SAT",
      ageRequirement: "ALL_AGES",
      eventTypes: ["SOCIAL", "EDUCATION", "KINK", "FAIR"],
      admission: "FREE",
      ticketUrl: "https://fetlife.com/events/2026/07/18/pla-portland-pride-waterfront-festival-saturday-ts12wf",
      isSexPositive: false,
      nudityOk: false,
      posterImageUrl: "/posters/portland-pride-waterfront.png",
      adminNotes:
        "FetLife PLA listing (The-PLA). Distinct from general Waterfront Festival listing, leather/kink education org presence. education@portlandleather.org.",
    });

    recordBootMigration("seed_fetlife_pride_week_gaps_2026_v1");
  }
  // Hawks PDX Pride week (Jul 13–19 2026) - weekly programming from hawkspdx.com/hawks-events.
  // Replaces HIDDEN weekend placeholders with real LIVE listings + official flyers.
  if (!hasBootMigration("seed_hawks_pride_week_2026_v1")) {
    const now = new Date().toISOString();
    const venue = {
      venueName: "Hawks PDX",
      address: "335 SE 99th Ave, Portland, OR 97216",
      neighborhood: "SE Portland",
      lat: 45.520175147981,
      lng: -122.562357520572,
    };
    const insertIfMissing = (row: {
      title: string;
      description: string;
      dateStart: string;
      dateEnd: string;
      dayOfWeek: string;
      ageRequirement: string;
      eventTypes: string[];
      admission: string;
      ticketUrl: string;
      isSexPositive: boolean;
      nudityOk: boolean;
      posterImageUrl: string | null;
      adminNotes: string;
    }) => {
      const exists = sqlite
        .prepare("SELECT id FROM events WHERE title = ? AND date_start LIKE ? LIMIT 1")
        .get(row.title, `${row.dateStart.slice(0, 10)}%`);
      if (exists) return;
      db.insert(events)
        .values({
          title: row.title,
          description: row.description,
          ...venue,
          dateStart: row.dateStart,
          dateEnd: row.dateEnd,
          dayOfWeek: row.dayOfWeek,
          ageRequirement: row.ageRequirement,
          eventTypes: JSON.stringify(row.eventTypes),
          admission: row.admission,
          ticketUrl: row.ticketUrl,
          isPublic: true,
          isPrivate: false,
          isHouseParty: false,
          isSexPositive: row.isSexPositive,
          nudityOk: row.nudityOk,
          posterImageUrl: row.posterImageUrl,
          status: "LIVE",
          source: "admin_seeded",
          isClaimable: true,
          claimedBy: null,
          submittedBy: null,
          adminNotes: row.adminNotes,
          createdAt: now,
        } as any)
        .run();
    };

    // Keep old TBD weekend placeholders off public listings
    sqlite
      .prepare(
        `UPDATE events SET status = 'HIDDEN',
          admin_notes = COALESCE(admin_notes || ' | ', '') || 'Superseded by seed_hawks_pride_week_2026_v1 real weekly listings'
        WHERE title = 'Hawks PDX Pride Weekend Placeholder'`,
      )
      .run();

    insertIfMissing({
      title: "Jock Mondays! at Hawks",
      description:
        "Step into your jock and step into community. Mondays at Hawks are all about sporty vibes, playful energy, and showing up just as you are. Wear a jockstrap and get $5 off your visit (not valid with Happy Hour locker pricing). Open til 2AM. Sex-positive spa, body-positive, nudity-friendly space.",
      dateStart: "2026-07-13T10:00:00",
      dateEnd: "2026-07-14T02:00:00",
      dayOfWeek: "MON",
      ageRequirement: "18_PLUS",
      eventTypes: ["SOCIAL", "NIGHTLIFE", "SEX_POSITIVE", "NUDITY_OK"],
      admission: "DOOR_FEE",
      ticketUrl:
        "https://hawkspdx.com/hawks-events/jockmonday-94yem-3nfnt-55wgd-2mxrd-exng5-x9g72-h4stw-6e4tn-nlpws-w8a7t-zl7sz-hfxg9-9tc75-zxwdd-gk2hg-j3nfk-gltr7-r3b8m",
      isSexPositive: true,
      nudityOk: true,
      posterImageUrl: "/posters/hawks-jock-mondays.png",
      adminNotes:
        "hawkspdx.com/hawks-events Jock Mondays Pride week 2026-07-13. Locker/door fee; jock $5 off. Open til 2AM.",
    });

    insertIfMissing({
      title: "OMEN Wednesdays! (M4M) at Hawks",
      description:
        "Wednesdays at Hawks feature OMEN Nights for men and men-identifying guests, plus Sexy Senior Social from 10 AM–4 PM for members 65+. Discounts available for both events. Sex-positive spa with lockers, hot tub, and play-friendly community vibes.",
      dateStart: "2026-07-15T15:00:00",
      dateEnd: "2026-07-16T08:00:00",
      dayOfWeek: "WED",
      ageRequirement: "18_PLUS",
      eventTypes: ["SOCIAL", "NIGHTLIFE", "SEX_POSITIVE", "NUDITY_OK", "M4M"],
      admission: "DOOR_FEE",
      ticketUrl:
        "https://hawkspdx.com/hawks-events/omenwednesday-acby8-5j7ts-bt222-p4cb7-zjfpt-84c7m-sbpkd-xh42n-d5dnl-4prxn-lhkla-wzp4y-4hy57-twrmm-ryr56-w2pry-yfrej-92btf-zk2yn-rhh3x-zzbn2-82l88-jjzls-d45b2-a6pal-4fe9f-eb5be-jhd9w",
      isSexPositive: true,
      nudityOk: true,
      posterImageUrl: "/posters/hawks-omen-wednesdays.png",
      adminNotes:
        "hawkspdx.com/hawks-events OMEN Wednesdays (M4M) 2026-07-15. Sexy Senior Social 10am–4pm for 65+ members; OMEN evening for men / men-identifying.",
    });

    insertIfMissing({
      title: "Sapphic Takeover Thursday! Women's Day at Hawks",
      description:
        "A dedicated Sapphic-centered day at Hawks for women, trans, nonbinary, and gender-expansive folks across the Sapphic spectrum, spa, hot tub, connect, touch, be sensual, be playful. Spearheaded with PNW Poly Sapphics. Space shifts to all-women's day from 10am; PNW Poly Sapphic group concentrates around 6:30pm, but you're welcome anytime day and night. Sex-positive, body-positive.",
      dateStart: "2026-07-16T10:00:00",
      dateEnd: "2026-07-17T08:00:00",
      dayOfWeek: "THU",
      ageRequirement: "18_PLUS",
      eventTypes: ["SOCIAL", "SEX_POSITIVE", "NUDITY_OK", "WELLNESS", "COMMUNITY"],
      admission: "DOOR_FEE",
      ticketUrl:
        "https://hawkspdx.com/hawks-events/2026/4/15/sapphic-takeover-thursday-woomens-day-at-hawks-3xg6b-ln269-m5a29-rjtcg-f38rl",
      isSexPositive: true,
      nudityOk: true,
      posterImageUrl: "/posters/hawks-sapphic-takeover.png",
      adminNotes:
        "hawkspdx.com/hawks-events Sapphic Takeover Thursday 2026-07-16. PNW Poly Sapphics ~6:30pm concentration; all-day welcome from 10am.",
    });

    insertIfMissing({
      title: "Gender Glow Fridays with Karaoke at Hawks",
      description:
        "Friday Mixxxers are all-gender nights celebrating the full LGBTQIA2S+ spectrum, blacklight, glow sticks, draw on each other with glow pens, plus karaoke. Whether you're queer or questioning, come connect, explore, and celebrate community in a welcoming, body-positive, sex-positive spa space.",
      dateStart: "2026-07-17T10:00:00",
      dateEnd: "2026-07-18T08:00:00",
      dayOfWeek: "FRI",
      ageRequirement: "18_PLUS",
      eventTypes: ["SOCIAL", "KARAOKE", "NIGHTLIFE", "SEX_POSITIVE", "NUDITY_OK", "ALL-GENDER"],
      admission: "DOOR_FEE",
      ticketUrl:
        "https://hawkspdx.com/hawks-events/mixxxerfriday-xzaex-t7b7g-g5t6k-ty2nj-x5h7k-ekayd-3dfyx-x9rgm-rjk6s-3bxmn-c6a76-jjdbj-zayn9-pxy6j-8ydy6-frjak-kyyj3-7pttm-xwy2j-nwfx8-wk92m-d4z26",
      isSexPositive: true,
      nudityOk: true,
      posterImageUrl: "/posters/hawks-gender-glow-fridays.png",
      adminNotes:
        "hawkspdx.com/hawks-events Gender Glow Fridays + Karaoke 2026-07-17. Blacklight / glow sticks / glow pens; all-gender Mixxxer Friday.",
    });

    insertIfMissing({
      title: "Bi Sundays & Nude Yoga at Hawks",
      description:
        "Sundays at Hawks are all-gender and body-positive, friendly vibes through the day, a restorative 4 PM Nude Yoga class in the courtyard, then Bi Night as the evening heats up. Come unwind, reconnect, and enjoy a little post-weekend aftercare. Sex-positive spa; nudity OK.",
      dateStart: "2026-07-19T10:00:00",
      dateEnd: "2026-07-20T08:00:00",
      dayOfWeek: "SUN",
      ageRequirement: "18_PLUS",
      eventTypes: ["SOCIAL", "WELLNESS", "SEX_POSITIVE", "NUDITY_OK", "ALL-GENDER", "BI"],
      admission: "DOOR_FEE",
      ticketUrl:
        "https://hawkspdx.com/hawks-events/bisundays-acby8-5j7ts-bt222-5es84-nxbk5-mg3wy-zk6mg-p8dpd-whn6d-et6tn-g85je-d2xhj-ekefc",
      isSexPositive: true,
      nudityOk: true,
      posterImageUrl: "/posters/hawks-bi-sundays.png",
      adminNotes:
        "hawkspdx.com/hawks-events Bi Sundays & Nude Yoga 2026-07-19. Nude yoga 4pm courtyard; Bi Night evening.",
    });

    recordBootMigration("seed_hawks_pride_week_2026_v1");
  }
  // Hawks PDX directory listing + neon logo path (venue cyan pack).
  if (!hasBootMigration("seed_hawks_directory_v12")) {
    const now = new Date().toISOString();
    const logo = "/directory-logos/Hawks_PDX.png";
    const exists = sqlite
      .prepare(`SELECT id FROM businesses WHERE name = ? OR name = ? LIMIT 1`)
      .get("Hawks PDX", "Hawks") as { id: number } | undefined;
    if (!exists) {
      db.insert(businesses)
        .values({
          name: "Hawks PDX",
          type: "venue",
          description:
            "Portland's LGBTQ+ community spa and social space in SE, hot tub, sauna, lockers, themed nights (Jock Mondays, OMEN Wednesdays, Sapphic Takeover, Gender Glow Fridays, Bi Sundays & Nude Yoga), and body-positive, sex-positive hospitality.",
          address: "335 SE 99th Ave, Portland, OR 97216",
          neighborhood: "SE Portland",
          website: "https://hawkspdx.com/",
          instagram: "@hawkspdx",
          queerOwned: true,
          queerFriendly: true,
          imageUrl: logo,
          lat: 45.520175147981,
          lng: -122.562357520572,
          isNew: false,
          active: true,
          hours: "Mon–Thu 10am–2am, Fri 10am–6am, Sat 10am–6am, Sun 10am–4am",
          phone: "(503) 946-8659",
          createdAt: now,
        } as any)
        .run();
    } else {
      sqlite
        .prepare(
          `UPDATE businesses SET
            type = 'venue',
            description = COALESCE(NULLIF(description, ''), ?),
            address = COALESCE(NULLIF(address, ''), ?),
            neighborhood = COALESCE(NULLIF(neighborhood, ''), 'SE Portland'),
            website = COALESCE(NULLIF(website, ''), 'https://hawkspdx.com/'),
            instagram = COALESCE(NULLIF(instagram, ''), '@hawkspdx'),
            image_url = ?,
            lat = COALESCE(lat, ?),
            lng = COALESCE(lng, ?),
            phone = COALESCE(NULLIF(phone, ''), '(503) 946-8659'),
            hours = COALESCE(NULLIF(hours, ''), ?),
            active = 1,
            queer_friendly = 1
          WHERE id = ?`,
        )
        .run(
          "Portland's LGBTQ+ community spa and social space in SE, hot tub, sauna, lockers, themed nights, and body-positive hospitality.",
          "335 SE 99th Ave, Portland, OR 97216",
          logo,
          45.520175147981,
          -122.562357520572,
          "Mon–Thu 10am–2am, Fri 10am–6am, Sat 10am–6am, Sun 10am–4am",
          exists.id,
        );
    }
    recordBootMigration("seed_hawks_directory_v12");
  }
  if (!hasBootMigration("prune_post_pride_week_v1")) {
    prunePostPrideWeekEvents();
    recordBootMigration("prune_post_pride_week_v1");
  }
  // Keep migration id for install history, but never re-seed post-Pride events.
  if (!hasBootMigration("restore_pruned_pride_events_v1")) {
    recordBootMigration("restore_pruned_pride_events_v1");
  }

  // Permanent: wipe post-Jul-19 listings on every boot (seeds keep trying to revive them).
  prunePostPrideWeekEvents();
  if (!hasBootMigration("prune_post_pride_week_permanent_v2")) {
    // One-shot title wipe for known revivals (OSLC Aug contest).
    const oscl = sqlite
      .prepare(
        `SELECT id FROM events WHERE title = 'Oregon State Leather Contest 2026' OR title LIKE 'Oregon State Leather%'`,
      )
      .all() as Array<{ id: number }>;
    hardDeleteEventIds(oscl.map(r => r.id));
    sqlite
      .prepare(
        `UPDATE events SET date_end = '2026-07-19T20:00:00' WHERE title = 'Midtown Beer Garden Pride' AND date_end >= '2026-07-20'`,
      )
      .run();
    recordBootMigration("prune_post_pride_week_permanent_v2");
  }
  // Iced Tea Pride closing party: flyer + merc tickets confirm 3pm–10pm (was wrongly 9pm–10pm).
  // Source: icedteapdx IG https://www.instagram.com/p/DaZjSntlIFV/ + merctickets.com/events/185486634
  if (!hasBootMigration("fix_iced_tea_pride_2026_time_v1")) {
    sqlite.prepare(`
      UPDATE events SET
        date_start = '2026-07-19T15:00:00',
        date_end = '2026-07-19T22:00:00',
        day_of_week = 'SUN',
        description = '3rd annual Pride Closing Party tea dance at White Owl Social Club. Sunday July 19, 3pm–10pm. DJs: Tripwire, JRX, Bro Hoe. Featuring multiple DJ sets and entertainment including Angel Darko, gogo dancing, and more. 21+.',
        ticket_url = 'https://www.merctickets.com/events/185486634/iced-tea-dance-pride-2026',
        admission = 'TICKETED',
        event_types = '["DANCE","PARTY","TEA DANCE","SOCIAL"]',
        lat = 45.5134484,
        lng = -122.6579941,
        neighborhood = 'SE Portland',
        admin_notes = COALESCE(admin_notes || ' | ', '') || 'Verified icedteapdx flyer + merc tickets: Sun Jul 19 3pm–10pm White Owl (not 9pm). 2026-07-12.'
      WHERE title = 'Iced Tea'
        AND date_start LIKE '2026-07-19%'
    `).run();
    recordBootMigration("fix_iced_tea_pride_2026_time_v1");
  }

  // Locker Room series: drop Jan/Feb/Jul/Sep (any year) and June 2026 from live events.
  // Archive dates are filtered in shared/tuckerHostedArchive.ts - this cleans any seeded/live rows.
  if (!hasBootMigration("scrub_locker_room_excluded_months_v1")) {
    sqlite.prepare(`
      DELETE FROM events
      WHERE LOWER(title) LIKE '%locker room%'
        AND (
          substr(date_start, 6, 2) IN ('01', '02', '07', '09')
          OR date_start LIKE '2026-06%'
        )
    `).run();
    recordBootMigration("scrub_locker_room_excluded_months_v1");
  }

  // Catalog cleanup: LIVE exact title+start duplicates + leftover Midtown HIDDEN twin.
  if (!hasBootMigration("dedupe_pid_night1_midtown_hidden_v1")) {
    // Pride in Demand Night 1: two LIVE rows same title + start (admin_seeded + user_submitted).
    // Keep the lowest id; hide the rest with a clear note.
    const pidKeeper = sqlite
      .prepare(
        `SELECT MIN(id) AS id FROM events
         WHERE status = 'LIVE'
           AND title = 'Pride in Demand - Portland Queer Takeover - Night 1'
           AND substr(date_start, 1, 16) = '2026-07-17T21:00'`,
      )
      .get() as { id: number | null } | undefined;
    if (pidKeeper?.id != null) {
      sqlite
        .prepare(
          `UPDATE events
           SET status = 'HIDDEN',
               admin_notes = COALESCE(admin_notes || ' | ', '') ||
                 'Hidden: duplicate LIVE Pride in Demand Night 1 - keeper id ' || ?
           WHERE status = 'LIVE'
             AND title = 'Pride in Demand - Portland Queer Takeover - Night 1'
             AND substr(date_start, 1, 16) = '2026-07-17T21:00'
             AND id != ?`,
        )
        .run(String(pidKeeper.id), pidKeeper.id);
      // Clarify the keeper note (was mixed "old Friday" / "consolidated" copy).
      sqlite
        .prepare(
          `UPDATE events
           SET admin_notes = COALESCE(NULLIF(trim(admin_notes), '') || ' | ', '') ||
             'Canonical LIVE Pride in Demand Night 1 (Fri Jul 17). Twin LIVE rows deduped 2026-07-14.'
           WHERE id = ?`,
        )
        .run(pidKeeper.id);
    }

    // Midtown: LIVE multi-day listing is the public one; older HIDDEN twin is a leftover.
    sqlite
      .prepare(
        `UPDATE events
         SET admin_notes = COALESCE(NULLIF(trim(admin_notes), '') || ' | ', '') ||
           'Duplicate leftover of LIVE Midtown Beer Garden Pride multi-day listing - not a missing public event.'
         WHERE status = 'HIDDEN' AND title = 'Midtown Beer Garden Pride'`,
      )
      .run();

    // If any extra LIVE Midtown rows ever exist, keep the lowest LIVE id only.
    const midtownKeeper = sqlite
      .prepare(
        `SELECT MIN(id) AS id FROM events WHERE status = 'LIVE' AND title = 'Midtown Beer Garden Pride'`,
      )
      .get() as { id: number | null } | undefined;
    if (midtownKeeper?.id != null) {
      sqlite
        .prepare(
          `UPDATE events
           SET status = 'HIDDEN',
               admin_notes = COALESCE(admin_notes || ' | ', '') ||
                 'Hidden: duplicate Midtown Beer Garden Pride - LIVE keeper id ' || ?
           WHERE status = 'LIVE'
             AND title = 'Midtown Beer Garden Pride'
             AND id != ?`,
        )
        .run(String(midtownKeeper.id), midtownKeeper.id);
    }

    recordBootMigration("dedupe_pid_night1_midtown_hidden_v1");
  }

  // Community correction: Either/Or was sold; no longer queer-owned (still queer-friendly).
  if (!hasBootMigration("either_or_not_queer_owned_v1")) {
    sqlite
      .prepare(
        `UPDATE businesses
         SET queer_owned = 0,
             queer_friendly = 1,
             description = 'Coffee bar known for creative coffee cocktails and zero-proof mocktails. A queer-friendly neighborhood cafe on N Williams (no longer queer-owned after a change in ownership).'
         WHERE name = 'Either/Or'`,
      )
      .run();
    recordBootMigration("either_or_not_queer_owned_v1");
  }

  // Sanctuary Club: ensure website so QSearch host-match + publish link work (ICS often TBA LOCATION).
  if (!hasBootMigration("sanctuary_club_website_v1")) {
    sqlite
      .prepare(
        `UPDATE businesses
         SET website = COALESCE(NULLIF(TRIM(website), ''), 'https://www.pdxsanctuary.com/'),
             address = COALESCE(NULLIF(TRIM(address), ''), '33 NW 9th Ave')
         WHERE name = 'Sanctuary Club' OR name LIKE 'Sanctuary%'`,
      )
      .run();
    recordBootMigration("sanctuary_club_website_v1");
  }

  // Triangle Recreation Camp (Camp TRC) — LGBTQ+ campground outside Portland, important to locals.
  if (!hasBootMigration("seed_camp_trc_directory_v1")) {
    const exists = sqlite
      .prepare(
        `SELECT id FROM businesses WHERE lower(name) LIKE '%triangle recreation camp%' OR lower(name) = 'camp trc' OR website LIKE '%camptrc.org%' LIMIT 1`,
      )
      .get() as { id?: number } | undefined;
    if (!exists?.id) {
      const now = new Date().toISOString();
      db.insert(businesses)
        .values({
          name: "Triangle Recreation Camp",
          type: "campground",
          description:
            "Camp TRC — the Northwest's premier LGBTQ+ owned and operated recreational campground (est. 1975). 80 acres of trails, river, tent sites, and RVs in the Cascade foothills near Granite Falls, WA (about 4 hours from Portland). 21+ only; open mid-April through early October. Theme weekends, day use, and overnight camping.",
          address: "47715 Mountain Loop Highway, Granite Falls, WA 98252",
          neighborhood: "Granite Falls, WA",
          website: "https://camptrc.org/",
          instagram: null,
          hours: "Seasonal mid-April through early October · reservations recommended",
          phone: null,
          queerOwned: true,
          queerFriendly: true,
          lat: 48.0745268,
          lng: -121.5901687,
          imageUrl: "/directory-logos/Triangle_Recreation_Camp.png",
          active: true,
          isNew: true,
          createdAt: now,
        } as any)
        .run();
    } else {
      sqlite
        .prepare(
          `UPDATE businesses SET type = 'campground',
             website = COALESCE(NULLIF(TRIM(website), ''), 'https://camptrc.org/'),
             address = COALESCE(NULLIF(TRIM(address), ''), '47715 Mountain Loop Highway, Granite Falls, WA 98252'),
             imageUrl = COALESCE(NULLIF(TRIM(imageUrl), ''), '/directory-logos/Triangle_Recreation_Camp.png')
           WHERE id = ?`,
        )
        .run(exists.id);
    }
    recordBootMigration("seed_camp_trc_directory_v1");
  }

  // Bearracuda: nightlife brand / promoter as directory group (events at partner venues).
  if (!hasBootMigration("seed_bearracuda_group_v1")) {
    const exists = sqlite
      .prepare(`SELECT id FROM businesses WHERE name = 'Bearracuda' LIMIT 1`)
      .get() as { id?: number } | undefined;
    if (!exists?.id) {
      db.insert(businesses)
        .values({
          name: "Bearracuda",
          type: "group",
          description:
            "Multi-city bear dance party / nightlife brand. Portland + Seattle events only on Zaylist (hosts at Nova, Sanctuary, and partner venues). National calendar also runs SF/LA — those cities are filtered out of QSearch.",
          address: null,
          neighborhood: "Portland / Seattle",
          website: "https://bearracuda.com",
          instagram: "@bearracudapdx",
          queerOwned: true,
          queerFriendly: true,
          active: true,
          isNew: false,
          createdAt: new Date().toISOString(),
        } as any)
        .run();
    }
    recordBootMigration("seed_bearracuda_group_v1");
  }

  // Active Clubs & Groups from directory audit (data/directory-active-groups.json).
  // Idempotent upsert by name; type=group with white→gold card accent.
  if (!hasBootMigration("seed_active_groups_directory_v2")) {
    const now = new Date().toISOString();
    type GroupSeed = {
      name: string;
      description: string;
      address?: string | null;
      neighborhood?: string | null;
      website?: string | null;
      instagram?: string | null;
    };
    const groups: GroupSeed[] = [
      {
        name: "Pink Ponies",
        description:
          "Queer-identifying Burning Man camp + Portland party collective (501(c)(3)). Ethical creative expression, sex positivity, gender fluidity, radical inclusion. Also known as Burning Man Pink Ponies.",
        address: "904 NW Couch St, Portland, OR 97209",
        neighborhood: "NW Portland",
        website: "https://events.humanitix.com/host/pink-ponies",
        instagram: "@burningmanpinkponies",
      },
      {
        name: "PDX PAH - Portland Pets & Handlers",
        description:
          "Human-pet play community in Portland: education, socials, and monthly mosh (often at Eagle Portland). Welcomes pets, pups, handlers, and the curious — all shapes, sizes, colors, genders, orientations.",
        address: "Eagle Portland, 3444 N Williams Ave",
        neighborhood: "North Portland",
        website: "https://www.pdxpah.com",
        instagram: "@pdxpah",
      },
      {
        name: "Oregon State Leather Contest",
        description:
          "Largest leather title contest in Oregon since 1997 (formerly Blackout Leather Productions; renamed 2021). Celebrates BDSM, Leather, Pup/Pet, Mx. Draws contestants from Oregon + SW Washington. Often partners with Badlands and other clubs.",
        address: "Portland, OR",
        neighborhood: "Portland",
        website: null,
        instagram: "@oregonstateleather",
      },
      {
        name: "Portland Leather Alliance",
        description:
          "All-volunteer 501(c)3 (est. 1998) — education and awareness for alternative lifestyles. Largest membership-based BDSM org in Portland Metro + SW Washington. Consent in Kink, KinkFest, Black and Blue.",
        address: "4110 SE Hawthorne Blvd #611, Portland OR 97214",
        neighborhood: "SE Portland",
        website: "http://www.portlandleather.org",
        instagram: null,
      },
      {
        name: "Bad Girls PDX",
        description:
          "Kinky women's group — BDSM Safety & Etiquette class + new member orientation (often at Q Center).",
        address: "Q Center, 4115 N Mississippi Ave, Portland OR 97217",
        neighborhood: "N Portland",
        website: "http://www.pdxbadgirls.net",
        instagram: "@pdxbadgirls",
      },
      {
        name: "Black & Beyond the Binary Collective",
        description:
          "Leadership, healing, and safety for Black-African transgender, queer, nonbinary, two-spirit, intersex (TQN2SI+) Oregonians. Community at SE Uplift / Tabor Commons and citywide.",
        address: "5633 SE Division St, Portland OR 97206",
        neighborhood: "SE Portland",
        website: "https://www.blackbeyondthebinary.org",
        instagram: "@blackandbeyondthebinary",
      },
      {
        name: "Brown Girl Rise",
        description:
          "501(c)(3) radical sisterhood of girls and non-binary youth of the global majority — camps, menstrual kit actions, zine workshops, connection to body, community, land, and creativity.",
        address: "7707 SE 70th Ave, Portland OR 97206",
        neighborhood: "SE Portland",
        website: "https://browngirlriseportland.org",
        instagram: "@browngirlrise",
      },
      {
        name: "TranzGuys PDX",
        description:
          "Inclusive peer-support / discussion / social group for AFAB folks who identify as trans, MTO, genderfluid, transman, genderqueer, boi, FTM, male, butch, two-spirit, and more. 3rd Sunday 6–8pm at Q Center.",
        address: "Q Center, Portland, OR",
        neighborhood: "N Portland",
        website: null,
        instagram: "@tranzguyspdx",
      },
      {
        name: "Ori Gallery",
        description:
          "QTBIPOC art gallery and workshop space — art + activism, fundraisers for Black and trans causes.",
        address: "Portland, OR",
        neighborhood: "Portland",
        website: "https://www.origallery.org",
        instagram: "@origallery_pdx",
      },
      {
        name: "Portland Frontrunners",
        description:
          "Running/walking club for LGBTQIA+ and friends. Weekly runs + annual Portland Pride Run & Walk and Bridge to Bridge.",
        address: "Portland, OR",
        neighborhood: "Portland",
        website: "https://www.meetup.com/Portland-Frontrunners/",
        instagram: "@portlandfrontrunners",
      },
      {
        name: "Lavender League",
        description:
          "Portland soccer league for queer women and nonbinary or trans people (200+ members).",
        address: "Portland, OR",
        neighborhood: "Portland",
        website: null,
        instagram: "@lavenderleaguepdx",
      },
      {
        name: "PDX Gaymers",
        description: "Queer gamers — screenings, board games, socials.",
        address: "Portland, OR",
        neighborhood: "Portland",
        website: "https://www.meetup.com/PDX-Gaymers/",
        instagram: "@pdxgaymers",
      },
      {
        name: "Sankofa Collective",
        description:
          "Formerly Portland African-American/Black PFLAG — health and well-being for gay, lesbian, bisexual, and transgender persons, their families and friends.",
        address: "Portland, OR",
        neighborhood: "Portland",
        website: null,
        instagram: null,
      },
      {
        name: "Bearracuda",
        description:
          "Multi-city bear dance party brand. Zaylist shows Portland + Seattle only (events at partner venues like Nova PDX and Sanctuary). SF/LA and other tour cities are filtered out of QSearch.",
        address: null,
        neighborhood: "Portland / Seattle",
        website: "https://bearracuda.com",
        instagram: "@bearracudapdx",
      },
      {
        name: "The Imperial Sovereign Rose Court of Oregon",
        description:
          "Portland's Imperial Sovereign Rose Court — oldest continuously operating court system organization in the world. Coronations, fundraisers, community service for LGBTQ+ causes across Oregon.",
        address: "Portland, OR",
        neighborhood: "Portland",
        website: "https://rosecourt.org",
        instagram: "@rosecourtpdx",
      },
    ];

    for (const g of groups) {
      const row = sqlite
        .prepare(`SELECT id FROM businesses WHERE LOWER(name) = LOWER(?) LIMIT 1`)
        .get(g.name) as { id?: number } | undefined;
      if (row?.id) {
        sqlite
          .prepare(
            `UPDATE businesses SET
               type = 'group',
               description = COALESCE(NULLIF(TRIM(description), ''), ?),
               address = COALESCE(NULLIF(TRIM(address), ''), ?),
               neighborhood = COALESCE(NULLIF(TRIM(neighborhood), ''), ?),
               website = COALESCE(NULLIF(TRIM(website), ''), ?),
               instagram = COALESCE(NULLIF(TRIM(instagram), ''), ?),
               queer_owned = 1,
               queer_friendly = 1,
               active = 1
             WHERE id = ?`,
          )
          .run(
            g.description,
            g.address ?? null,
            g.neighborhood ?? null,
            g.website ?? null,
            g.instagram ?? null,
            row.id,
          );
      } else {
        db.insert(businesses)
          .values({
            name: g.name,
            type: "group",
            description: g.description,
            address: g.address ?? null,
            neighborhood: g.neighborhood ?? null,
            website: g.website ?? null,
            instagram: g.instagram ?? null,
            queerOwned: true,
            queerFriendly: true,
            active: true,
            isNew: false,
            createdAt: now,
          } as any)
          .run();
      }
    }
    // Soft-deactivate known closed groups if present
    for (const closed of ["Darklady Productions", "Oregon Bears", "Collar Guard"]) {
      try {
        sqlite
          .prepare(
            `UPDATE businesses SET active = 0 WHERE LOWER(name) = LOWER(?) AND type = 'group'`,
          )
          .run(closed);
      } catch {
        /* ignore */
      }
    }
    recordBootMigration("seed_active_groups_directory_v2");
  }

  /**
   * Yes Coach Productions — Tucker's party collective (yescoachparties.com).
   * Must exist as its own directory group so Yes Coach / Coach's Pet nights
   * attach here, not Portland Leather Alliance (PLA was false-matching "play").
   */
  if (!hasBootMigration("seed_yes_coach_productions_directory_v1")) {
    const now = new Date().toISOString();
    const name = "Yes Coach Productions";
    const description =
      "Portland athletic-fetish and gear-party collective run by Tucker Max (Tucker_PDmaX). Yes Coach nights, collabs (Stank, Pink Ponies), and community play at Sanctuary and partner venues. Consent-forward. Not a leather club — party brand.";
    const website = "https://yescoachparties.com";
    const instagram = "@Tucker_PDmaX";
    const imageUrl = "/directory-logos/Yes_Coach_Productions.png";
    const existing = sqlite
      .prepare(`SELECT id FROM businesses WHERE LOWER(name) = LOWER(?) LIMIT 1`)
      .get(name) as { id?: number } | undefined;
    if (existing?.id) {
      sqlite
        .prepare(
          `UPDATE businesses SET
             type = 'group',
             description = ?,
             website = ?,
             instagram = ?,
             image_url = COALESCE(NULLIF(TRIM(image_url), ''), ?),
             neighborhood = COALESCE(NULLIF(TRIM(neighborhood), ''), 'Portland'),
             queer_owned = 1,
             queer_friendly = 1,
             active = 1
           WHERE id = ?`,
        )
        .run(description, website, instagram, imageUrl, existing.id);
    } else {
      db.insert(businesses)
        .values({
          name,
          type: "group",
          description,
          address: null,
          neighborhood: "Portland",
          website,
          instagram,
          imageUrl,
          queerOwned: true,
          queerFriendly: true,
          active: true,
          isNew: true,
          createdAt: now,
        } as any)
        .run();
    }
    recordBootMigration("seed_yes_coach_productions_directory_v1");
  }

  // Neon Yes Coach logo for directory listing (after group seed may already have run).
  if (!hasBootMigration("yes_coach_directory_logo_v1")) {
    const imageUrl = "/directory-logos/Yes_Coach_Productions.png";
    sqlite
      .prepare(
        `UPDATE businesses SET image_url = ?
         WHERE LOWER(name) = LOWER('Yes Coach Productions')`,
      )
      .run(imageUrl);
    recordBootMigration("yes_coach_directory_logo_v1");
  }

  // Yes Coach is based at Sanctuary Club; keep its directory pin/location
  // aligned with the venue instead of the generic Portland group fallback.
  if (!hasBootMigration("yes_coach_sanctuary_location_v1")) {
    sqlite
      .prepare(
        `UPDATE businesses SET
           address = '33 NW 9th Ave, Portland, OR 97209',
           neighborhood = 'Pearl District',
           lat = 45.523244045755,
           lng = -122.680179337043
         WHERE LOWER(name) = LOWER('Yes Coach Productions')`,
      )
      .run();
    recordBootMigration("yes_coach_sanctuary_location_v1");
  }

  // Directory-wide verified data refresh (official business/org sources,
  // July 2026). Avoid filling optional fields unless the source is clear.
  if (!hasBootMigration("directory_verified_details_2026_07_v1")) {
    sqlite
      .prepare(
        `UPDATE businesses SET website = 'https://yescoachparty.com'
         WHERE LOWER(name) = LOWER('Yes Coach Productions')`,
      )
      .run();
    sqlite
      .prepare(
        `UPDATE businesses SET
           website = 'https://www.blackbeyondthebinarycollective.org/'
         WHERE LOWER(name) = LOWER('Black & Beyond the Binary Collective')`,
      )
      .run();
    sqlite
      .prepare(
        `UPDATE businesses SET
           address = '4038 N Mississippi Ave, Portland, OR 97217',
           neighborhood = 'Mississippi',
           website = 'https://oriartgallery.org/',
           hours = 'Thu–Sun 12–5pm',
           lat = 45.5527108,
           lng = -122.6753325
         WHERE LOWER(name) = LOWER('Ori Gallery')`,
      )
      .run();
    sqlite
      .prepare(
        `UPDATE businesses SET
           address = '2046 NE Martin Luther King Jr Blvd, Portland, OR 97212',
           neighborhood = 'Eliot',
           website = 'https://ariumbotanicals.com/',
           hours = 'Daily 11am–6pm',
           phone = '(503) 719-4763',
           lat = 45.5377231,
           lng = -122.6612012
         WHERE LOWER(name) = LOWER('Arium Botanicals')`,
      )
      .run();
    sqlite
      .prepare(
        `UPDATE businesses SET
           address = '2610 NW Vaughn St, Portland, OR 97210',
           neighborhood = 'Slabtown',
           website = 'https://pizzathief.com/',
           hours = 'Daily 11:30am–9pm',
           phone = '(503) 719-7778',
           lat = 45.5366907,
           lng = -122.7053269
         WHERE LOWER(name) = LOWER('Pizza Thief')`,
      )
      .run();
    sqlite
      .prepare(
        `UPDATE businesses SET
           name = 'Greenhouse Hair Collective',
           description = 'LGBTQIA-owned, gender-inclusive Slabtown hair collective (formerly Gold+Grit Barber Co.) offering barbering, styling, and gender-affirming transformations by appointment.',
           address = '2668 NW Vaughn St, Portland, OR 97210',
           neighborhood = 'Slabtown',
           website = 'https://www.greenhousepdx.com/',
           instagram = NULL,
           hours = 'By appointment',
           lat = 45.5366774,
           lng = -122.7063224
         WHERE LOWER(name) = LOWER('Gold+Grit Barber Co.')`,
      )
      .run();
    sqlite
      .prepare(
        `UPDATE businesses SET
           address = 'Eagle Portland, 835 N Lombard St, Portland, OR 97217',
           neighborhood = 'North Portland',
           lat = 45.5803,
           lng = -122.6856
         WHERE LOWER(name) = LOWER('PDX PAH - Portland Pets & Handlers')`,
      )
      .run();
    recordBootMigration("directory_verified_details_2026_07_v1");
  }

  /**
   * Coach's Pet — Yes Coach production night at Sanctuary Club.
   * Venue = Sanctuary (place card); brand aliases + host claim = Yes Coach.
   */
  if (!hasBootMigration("seed_coaches_pet_yes_coach_sanctuary_v1")) {
    try {
      const now = new Date().toISOString();
      const title = "Coach's Pet — Yes Coach";
      const existing = sqlite
        .prepare(
          `SELECT id FROM events
           WHERE LOWER(title) LIKE '%coach%pet%'
              OR LOWER(title) = LOWER(?)
           ORDER BY id ASC LIMIT 1`,
        )
        .get(title) as { id?: number } | undefined;

      const description =
        "Yes Coach Productions pet-play / gear night at Sanctuary Club. Hosted by Tucker Max (Yes Coach). Consent-forward athletic-fetish scene — collars, handlers, pups, and gear welcome. Not a PLA event.";
      const venueName = "Sanctuary Club";
      const address = "33 NW 9th Ave, Portland, OR 97209";
      const neighborhood = "Pearl District";
      const lat = 45.523244045755;
      const lng = -122.680179337043;
      // Next Saturday doors after STANK Pride weekend (seed; admin can move).
      const dateStart = "2026-08-08T21:00:00";
      const dateEnd = "2026-08-09T02:00:00";
      const dayOfWeek = "SAT";
      const eventTypes = JSON.stringify(["PARTY", "LEATHER", "SPORTS"]);
      const ticketUrl = "https://members.pdxsanctuary.com/";
      const owner = resolveSiteOwner();
      const claimedBy = owner?.username || null;

      if (existing?.id) {
        sqlite
          .prepare(
            `UPDATE events SET
               title = ?,
               description = ?,
               venue_name = ?,
               address = ?,
               neighborhood = ?,
               lat = ?,
               lng = ?,
               age_requirement = '21_PLUS',
               event_types = ?,
               admission = 'DOOR_FEE',
               ticket_url = COALESCE(NULLIF(TRIM(ticket_url), ''), ?),
               is_public = 1,
               is_sex_positive = 1,
               status = 'LIVE',
               claimed_by = COALESCE(claimed_by, ?),
               is_claimable = 0,
               admin_notes = COALESCE(admin_notes, 'Yes Coach Productions @ Sanctuary — Coach''s Pet'),
               updated_at = ?
             WHERE id = ?`,
          )
          .run(
            title,
            description,
            venueName,
            address,
            neighborhood,
            lat,
            lng,
            eventTypes,
            ticketUrl,
            claimedBy,
            now,
            existing.id,
          );
      } else {
        db.insert(events)
          .values({
            title,
            description,
            venueName,
            address,
            neighborhood,
            lat,
            lng,
            dateStart,
            dateEnd,
            dayOfWeek,
            ageRequirement: "21_PLUS",
            eventTypes,
            admission: "DOOR_FEE",
            ticketUrl,
            isPublic: true,
            isPrivate: false,
            isHouseParty: false,
            isSexPositive: true,
            nudityOk: false,
            posterImageUrl: "/posters/stank-yes-coach.jpg",
            status: "LIVE",
            source: "admin_seeded",
            isClaimable: false,
            claimedBy,
            submittedBy: null,
            adminNotes: "Yes Coach Productions @ Sanctuary — Coach's Pet",
            createdAt: now,
          } as any)
          .run();
      }

      // Primary host: site owner (Tucker / Yes Coach)
      if (owner) {
        ensureEventHostsSchema();
        const row = sqlite
          .prepare(
            `SELECT id FROM events
             WHERE LOWER(title) LIKE '%coach%pet%' OR LOWER(title) = LOWER(?)
             ORDER BY id DESC LIMIT 1`,
          )
          .get(title) as { id?: number } | undefined;
        if (row?.id) {
          const hostExists = sqlite
            .prepare(`SELECT id FROM event_hosts WHERE event_id = ? AND user_id = ?`)
            .get(row.id, owner.id);
          if (hostExists) {
            sqlite
              .prepare(`UPDATE event_hosts SET role = 'PRIMARY' WHERE event_id = ? AND user_id = ?`)
              .run(row.id, owner.id);
          } else {
            db.insert(eventHosts)
              .values({
                eventId: row.id,
                userId: owner.id,
                role: "PRIMARY",
                addedByUserId: null,
                createdAt: now,
              } as any)
              .run();
          }
          db.update(events)
            .set({ claimedBy: owner.username, isClaimable: false })
            .where(eq(events.id, row.id))
            .run();
        }
      }
    } catch (err) {
      console.warn(
        "[boot] seed_coaches_pet_yes_coach_sanctuary_v1 skipped:",
        err instanceof Error ? err.message : err,
      );
    }
    recordBootMigration("seed_coaches_pet_yes_coach_sanctuary_v1");
  }

  // Pink Ponies — gold/white neon conversion of official mark for directory pack.
  if (!hasBootMigration("pink_ponies_directory_logo_v1")) {
    const imageUrl = "/directory-logos/Pink_Ponies.png";
    sqlite
      .prepare(
        `UPDATE businesses SET image_url = ?
         WHERE LOWER(name) = LOWER('Pink Ponies')`,
      )
      .run(imageUrl);
    recordBootMigration("pink_ponies_directory_logo_v1");
  }

  /**
   * Adult shops with multi-location cards + red-glow neon logos:
   * Fantasy Land (Foster), Taboo Video (all metro), Mr. Peeps (all metro).
   * Multiple addresses live on one directory card via description + hours.
   */
  if (!hasBootMigration("seed_adult_shops_multi_location_v1")) {
    const now = new Date().toISOString();
    type ShopSeed = {
      name: string;
      description: string;
      address: string;
      neighborhood: string;
      website: string | null;
      instagram: string | null;
      phone: string | null;
      hours: string | null;
      imageUrl: string;
      lat: number;
      lng: number;
    };
    const shops: ShopSeed[] = [
      {
        name: "Fantasy Land",
        description:
          "Fantasy Land on SE Foster (Fantasy on Foster / Fantasyland) — 24-hour adult shop. Toys, video, and a queer-friendly floor. One location on Foster Road — not the multi-store FANTASY (Fantasy for Adults Only) chain.",
        address: "5228 SE Foster Rd, Portland, OR 97206",
        neighborhood: "Foster / SE Portland",
        website: null,
        instagram: null,
        phone: "(503) 775-0094",
        hours: "Open 24 hours daily",
        imageUrl: "/directory-logos/Fantasy_Land.png",
        lat: 45.4945,
        lng: -122.6085,
      },
      {
        name: "Taboo Video",
        description:
          "All-inclusive adult retail (Taboo / Taboo Video). Multiple locations on one listing:\n• Broadway / Pearl — 311 NW Broadway, Portland, OR 97209 · (503) 227-3443\n• SE 82nd — 2330 SE 82nd Ave, Portland, OR 97216 · (503) 206-4708 · 24 hours\n• MLK — 237 SE MLK Jr Blvd, Portland, OR 97214 · (503) 239-1678\n• Vancouver WA — 4811 NE 94th Ave, Vancouver, WA 98662 · (360) 254-1126 · 24 hours\nWelcomes every orientation, gender, and kink. taboovideo.com · @taboovideopdx",
        address: "311 NW Broadway, Portland, OR 97209",
        neighborhood: "Pearl / SE 82nd / MLK / Vancouver",
        website: "https://www.taboovideo.com",
        instagram: "@taboovideopdx",
        phone: "(503) 227-3443",
        hours:
          "Broadway: Sun–Mon 11am–midnight, Tue–Sat 11am–2am · 82nd & Vancouver: 24 hours · MLK: Sun–Thu 10am–midnight, Fri–Sat 10am–2am",
        imageUrl: "/directory-logos/Taboo_Video.png",
        lat: 45.5255,
        lng: -122.6785,
      },
      {
        name: "Mr. Peeps",
        description:
          "Mr. Peeps Adult Superstores (incl. The Peep Hole). Multi-location card:\n• Portland (The Peep Hole) — 709 SE 122nd Ave, Portland, OR 97233 · (503) 257-8617\n• Beaverton — 13355 SW Henry St, Beaverton, OR 97005 · (503) 643-6645\n• Aloha — 20625 SW Tualatin Valley Hwy, Aloha, OR 97003 · (503) 356-5624\nLocal chain since 1981. Novelties, video, and booths. mrpeeps.com",
        address: "709 SE 122nd Ave, Portland, OR 97233",
        neighborhood: "SE 122nd / Beaverton / Aloha",
        website: "https://www.mrpeeps.com",
        instagram: null,
        phone: "(503) 257-8617",
        hours: "24 hours (check location)",
        imageUrl: "/directory-logos/Mr_Peeps.png",
        lat: 45.5178,
        lng: -122.5378,
      },
    ];

    for (const s of shops) {
      const row = sqlite
        .prepare(`SELECT id FROM businesses WHERE LOWER(name) = LOWER(?) LIMIT 1`)
        .get(s.name) as { id?: number } | undefined;
      if (row?.id) {
        sqlite
          .prepare(
            `UPDATE businesses SET
               type = 'shop',
               description = ?,
               address = ?,
               neighborhood = ?,
               website = ?,
               instagram = ?,
               phone = ?,
               hours = ?,
               image_url = ?,
               lat = ?,
               lng = ?,
               queer_friendly = 1,
               active = 1,
               status = 'OPEN'
             WHERE id = ?`,
          )
          .run(
            s.description,
            s.address,
            s.neighborhood,
            s.website,
            s.instagram,
            s.phone,
            s.hours,
            s.imageUrl,
            s.lat,
            s.lng,
            row.id,
          );
      } else {
        db.insert(businesses)
          .values({
            name: s.name,
            type: "shop",
            description: s.description,
            address: s.address,
            neighborhood: s.neighborhood,
            website: s.website,
            instagram: s.instagram,
            phone: s.phone,
            hours: s.hours,
            imageUrl: s.imageUrl,
            lat: s.lat,
            lng: s.lng,
            queerOwned: false,
            queerFriendly: true,
            active: true,
            isNew: true,
            status: "OPEN",
            createdAt: now,
          } as any)
          .run();
      }
    }

    // Aliases as soft-search: if someone already created "Fantasy on Foster" etc.
    for (const [alias, canonical] of [
      ["Fantasy on Foster", "Fantasy Land"],
      ["Fantasyland", "Fantasy Land"],
      ["Taboo Adult Video", "Taboo Video"],
      ["Taboo", "Taboo Video"],
      ["The Peep Hole", "Mr. Peeps"],
      ["Mr Peeps Adult Superstores", "Mr. Peeps"],
    ] as const) {
      try {
        const aliasRow = sqlite
          .prepare(`SELECT id FROM businesses WHERE LOWER(name) = LOWER(?) LIMIT 1`)
          .get(alias) as { id?: number } | undefined;
        const canon = sqlite
          .prepare(`SELECT id FROM businesses WHERE LOWER(name) = LOWER(?) LIMIT 1`)
          .get(canonical) as { id?: number } | undefined;
        if (aliasRow?.id && canon?.id && aliasRow.id !== canon.id) {
          // Prefer the multi-location card; hide the dupe alias row from discovery
          sqlite
            .prepare(`UPDATE businesses SET active = 0, status = 'CLOSED' WHERE id = ?`)
            .run(aliasRow.id);
        }
      } catch {
        /* ignore */
      }
    }

    recordBootMigration("seed_adult_shops_multi_location_v1");
  }

  /**
   * FANTASY (Fantasy for Adults Only) — multi-location inclusive chain.
   * Separate from Fantasy Land on Foster (seeded above; keep both).
   */
  if (!hasBootMigration("seed_fantasy_adults_only_multi_v1")) {
    const now = new Date().toISOString();
    const name = "FANTASY";
    const description =
      "FANTASY (Fantasy for Adults Only) — Portland & metro inclusive adult shops. Toys, gear, local brands, performer-friendly. Multiple locations on one card:\n" +
      "• Hollywood — 3137 NE Sandy Blvd, Portland, OR 97232 · (503) 239-6969 · 10am–12am\n" +
      "• Downtown — 1703 W Burnside St, Portland, OR 97209 · (503) 295-6969 · 12pm–8pm\n" +
      "• Tigard — 6440 SW Coronado Dr, Portland, OR 97219 · (503) 244-6969 · 10am–12am\n" +
      "• Clackamas — 15536 SE 82nd Dr, Clackamas, OR 97015 · (503) 203-6969 · 12pm–8pm\n" +
      "Also Missoula MT. Online: fantasyforadultsonly.com · @fantasy_oregon_portland\n" +
      "Not the same as Fantasy Land on SE Foster (separate shop).";
    const address = "3137 NE Sandy Blvd, Portland, OR 97232";
    const neighborhood = "Hollywood / Downtown / Tigard / Clackamas";
    const website = "https://www.fantasyforadultsonly.com";
    const instagram = "@fantasy_oregon_portland";
    const phone = "(503) 239-6969";
    const hours =
      "Sandy & Tigard: 10am–12am · Downtown: 12pm–8pm · Clackamas: 12pm–8pm (confirm per store)";
    const imageUrl = "/directory-logos/Fantasy_Adults_Only.png";
    const lat = 45.5328;
    const lng = -122.6325;

    const existing = sqlite
      .prepare(`SELECT id FROM businesses WHERE LOWER(name) = LOWER(?) LIMIT 1`)
      .get(name) as { id?: number } | undefined;
    if (existing?.id) {
      sqlite
        .prepare(
          `UPDATE businesses SET
             type = 'shop',
             description = ?,
             address = ?,
             neighborhood = ?,
             website = ?,
             instagram = ?,
             phone = ?,
             hours = ?,
             image_url = ?,
             lat = ?,
             lng = ?,
             queer_friendly = 1,
             active = 1,
             status = 'OPEN'
           WHERE id = ?`,
        )
        .run(
          description,
          address,
          neighborhood,
          website,
          instagram,
          phone,
          hours,
          imageUrl,
          lat,
          lng,
          existing.id,
        );
    } else {
      // Also match if seeded under a longer legal name
      const alt = sqlite
        .prepare(
          `SELECT id FROM businesses WHERE LOWER(name) IN (
             lower('Fantasy for Adults Only'),
             lower('Fantasy Adults Only'),
             lower('FANTASY Portland')
           ) LIMIT 1`,
        )
        .get() as { id?: number } | undefined;
      if (alt?.id) {
        sqlite
          .prepare(
            `UPDATE businesses SET
               name = ?,
               type = 'shop',
               description = ?,
               address = ?,
               neighborhood = ?,
               website = ?,
               instagram = ?,
               phone = ?,
               hours = ?,
               image_url = ?,
               lat = ?,
               lng = ?,
               queer_friendly = 1,
               active = 1,
               status = 'OPEN'
             WHERE id = ?`,
          )
          .run(
            name,
            description,
            address,
            neighborhood,
            website,
            instagram,
            phone,
            hours,
            imageUrl,
            lat,
            lng,
            alt.id,
          );
      } else {
        db.insert(businesses)
          .values({
            name,
            type: "shop",
            description,
            address,
            neighborhood,
            website,
            instagram,
            phone,
            hours,
            imageUrl,
            lat,
            lng,
            queerOwned: false,
            queerFriendly: true,
            active: true,
            isNew: true,
            status: "OPEN",
            createdAt: now,
          } as any)
          .run();
      }
    }
    recordBootMigration("seed_fantasy_adults_only_multi_v1");
  }

  /**
   * The Secret Warehouse — Kerns warehouse / film + party venue (411 NE 18th).
   * Hosts queer dance & play parties; often listed as "Secret Warehouse Portland".
   */
  if (!hasBootMigration("seed_secret_warehouse_directory_v1")) {
    const now = new Date().toISOString();
    const name = "The Secret Warehouse";
    const description =
      "Warehouse venue and film production space in Kerns (NE 18th). Hosts private parties, queer dance nights, and community events — often ticketed with location confirmation for guests. Queer-friendly Portland space.";
    const address = "411 NE 18th Ave, Portland, OR 97232";
    const neighborhood = "Kerns";
    const website = "https://www.yelp.com/biz/the-secret-warehouse-portland";
    const existing = sqlite
      .prepare(
        `SELECT id FROM businesses
         WHERE LOWER(name) = LOWER(?)
            OR LOWER(name) LIKE '%secret warehouse%'
            OR LOWER(name) LIKE '%secret wearhouse%'
         LIMIT 1`,
      )
      .get(name) as { id?: number } | undefined;
    if (existing?.id) {
      sqlite
        .prepare(
          `UPDATE businesses SET
             type = 'venue',
             description = COALESCE(NULLIF(TRIM(description), ''), ?),
             address = COALESCE(NULLIF(TRIM(address), ''), ?),
             neighborhood = COALESCE(NULLIF(TRIM(neighborhood), ''), ?),
             website = COALESCE(NULLIF(TRIM(website), ''), ?),
             queer_friendly = 1,
             active = 1
           WHERE id = ?`,
        )
        .run(description, address, neighborhood, website, existing.id);
    } else {
      db.insert(businesses)
        .values({
          name,
          type: "venue",
          description,
          address,
          neighborhood,
          website,
          instagram: null,
          queerOwned: false,
          queerFriendly: true,
          active: true,
          isNew: true,
          lat: 45.5239,
          lng: -122.6475,
          createdAt: now,
        } as any)
        .run();
    }
    recordBootMigration("seed_secret_warehouse_directory_v1");
  }

  // Remove Back 2 Earth from directory (venue no longer listed).
  if (!hasBootMigration("remove_back_2_earth_v1")) {
    const row = sqlite
      .prepare(`SELECT id FROM businesses WHERE name = 'Back 2 Earth' OR website LIKE '%back2earth%' LIMIT 1`)
      .get() as { id?: number } | undefined;
    const bizId = row?.id;
    if (bizId != null) {
      try {
        sqlite.prepare(`DELETE FROM business_claims WHERE business_id = ?`).run(bizId);
      } catch {
        /* table may not exist in all envs */
      }
      try {
        sqlite.prepare(`DELETE FROM business_submissions WHERE business_id = ?`).run(bizId);
      } catch {
        /* ignore */
      }
      try {
        sqlite.prepare(`DELETE FROM business_blocks WHERE business_id = ?`).run(bizId);
      } catch {
        /* ignore */
      }
      try {
        sqlite.prepare(`DELETE FROM business_logo_requests WHERE business_id = ?`).run(bizId);
      } catch {
        /* ignore */
      }
      sqlite.prepare(`DELETE FROM businesses WHERE id = ?`).run(bizId);
    } else {
      sqlite
        .prepare(
          `DELETE FROM businesses WHERE name = 'Back 2 Earth' OR website LIKE '%back2earth%' OR instagram LIKE '%back2earth%'`,
        )
        .run();
    }
    try {
      sqlite
        .prepare(
          `DELETE FROM qsearch_source_health WHERE source_id LIKE '%back2earth%' OR label LIKE '%Back 2 Earth%' OR url LIKE '%back2earth%'`,
        )
        .run();
    } catch {
      /* qsearch tables may not exist yet */
    }
    recordBootMigration("remove_back_2_earth_v1");
  }

  // Catalog cleanup: drop non-scene noise (Skatecamp, StrongFirst) + collapse LIVE
  // same-title same-venue same-day duplicates (e.g. Charli XCX album party ×3 from Badlands re-sync).
  if (!hasBootMigration("scrub_noise_and_live_dups_v1")) {
    const noise = sqlite
      .prepare(
        `SELECT id FROM events
         WHERE lower(title) LIKE '%skatecamp%'
            OR lower(title) LIKE '%skate camp%'
            OR lower(title) LIKE '%strongfirst%'
            OR lower(title) LIKE '%strong first%'
            OR (lower(title) LIKE '%sfl %' AND lower(title) LIKE '%barbell%')
            OR lower(title) LIKE '%barbell instructor certification%'`,
      )
      .all() as Array<{ id: number }>;
    hardDeleteEventIds(noise.map(r => r.id));

    // LIVE exact-ish dups: same title + venue + calendar day → keep lowest id, hide rest.
    const live = sqlite
      .prepare(
        `SELECT id, title, venue_name, date_start FROM events WHERE status = 'LIVE' ORDER BY id ASC`,
      )
      .all() as Array<{
        id: number;
        title: string;
        venue_name: string | null;
        date_start: string | null;
      }>;
    const seen = new Map<string, number>();
    const hideIds: number[] = [];
    for (const row of live) {
      const key = [
        String(row.title || "")
          .trim()
          .toLowerCase()
          .replace(/\s+/g, " "),
        String(row.venue_name || "")
          .trim()
          .toLowerCase()
          .replace(/\s+/g, " "),
        String(row.date_start || "").slice(0, 10),
      ].join("|");
      if (!key.startsWith("|") && key.length > 12) {
        const keeper = seen.get(key);
        if (keeper == null) {
          seen.set(key, row.id);
        } else {
          hideIds.push(row.id);
        }
      }
    }
    for (const id of hideIds) {
      sqlite
        .prepare(
          `UPDATE events
           SET status = 'HIDDEN',
               admin_notes = COALESCE(admin_notes || ' | ', '') ||
                 'Hidden: duplicate LIVE listing (same title+venue+day) - scrub_noise_and_live_dups_v1'
           WHERE id = ? AND status = 'LIVE'`,
        )
        .run(id);
    }
    recordBootMigration("scrub_noise_and_live_dups_v1");
  }

  /**
   * Sanctuary LIVE flyers: pull real event art from pdxsanctuary.com event pages
   * (featured image / uploads). Replaces wrong series art (JKPride leak) and
   * placeholders for published Sanctuary listings.
   * Sources: ICS+page enrich + 6 parallel page scrapes of calendar/sitemap URLs.
   */
  if (!hasBootMigration("sanctuary_real_flyers_v1")) {
    const posters: Array<{ id: number; url: string }> = [
      { id: 14, url: "https://pdxsanctuary.com/wp-content/uploads/2026/04/treasuretrail.avif" },
      { id: 269, url: "https://pdxsanctuary.com/wp-content/uploads/2025/07/CirqueDeSade.png" },
      { id: 270, url: "https://pdxsanctuary.com/wp-content/uploads/2025/07/CirqueDeSade-1.png" },
      { id: 271, url: "https://pdxsanctuary.com/wp-content/uploads/2025/07/CirqueDeSade-1.png" },
      { id: 272, url: "https://pdxsanctuary.com/wp-content/uploads/2025/07/Studio69July26Pricing.jpg" },
      { id: 274, url: "https://pdxsanctuary.com/wp-content/uploads/2025/07/deleapocalypse.webp" },
      { id: 275, url: "https://pdxsanctuary.com/wp-content/uploads/2025/07/back_to_school.jpg" },
      { id: 277, url: "https://pdxsanctuary.com/wp-content/uploads/2025/08/boot-snow-globe.avif" },
      { id: 278, url: "https://pdxsanctuary.com/wp-content/uploads/2025/07/badsanta.avif" },
      { id: 279, url: "https://pdxsanctuary.com/wp-content/uploads/2025/07/BiteClub-1.jpg" },
      { id: 280, url: "https://pdxsanctuary.com/wp-content/uploads/2025/07/Fempower-2.jpg" },
      { id: 282, url: "https://pdxsanctuary.com/wp-content/uploads/2025/07/sarumanAug23_with_bgc.avif" },
      { id: 283, url: "https://pdxsanctuary.com/wp-content/uploads/2026/04/SinfulSundayMarket.avif" },
      { id: 285, url: "https://pdxsanctuary.com/wp-content/uploads/2026/07/Screenshot-2026-07-06-170527.avif" },
      { id: 286, url: "https://pdxsanctuary.com/wp-content/uploads/2025/07/PickupMixer.jpg" },
      { id: 287, url: "https://pdxsanctuary.com/wp-content/uploads/2025/07/TranscenDance-1.jpg" },
      { id: 288, url: "https://pdxsanctuary.com/wp-content/uploads/2025/08/deleenm.avif" },
      { id: 289, url: "https://pdxsanctuary.com/wp-content/uploads/2026/07/BodyLanguageAug.avif" },
      { id: 291, url: "https://pdxsanctuary.com/wp-content/uploads/2026/02/IMG_5178.jpeg1_.avif" },
      { id: 292, url: "https://pdxsanctuary.com/wp-content/uploads/2026/07/Ball-Busting-Squre-Draft-1-7-16-26.avif" },
      { id: 359, url: "https://pdxsanctuary.com/wp-content/uploads/2026/01/1f84c461-addd-4a68-8ccf-69ed1933e784.avif" },
      { id: 360, url: "https://pdxsanctuary.com/wp-content/uploads/2025/07/delehorsemarket-e1692985599818.png" },
      { id: 361, url: "https://pdxsanctuary.com/wp-content/uploads/2025/07/delehorsemarket-e1692985599818.png" },
      { id: 370, url: "https://pdxsanctuary.com/wp-content/uploads/2025/07/BiteClub-1.jpg" },
    ];
    const note =
      "Poster set from pdxsanctuary.com event page art (sanctuary_real_flyers_v1)";
    for (const p of posters) {
      sqlite
        .prepare(
          `UPDATE events
           SET poster_image_url = ?,
               admin_notes = COALESCE(admin_notes || ' | ', '') || ?
           WHERE id = ?
             AND (venue_name LIKE '%Sanctuary%' OR address LIKE '%9th%' OR source LIKE '%sanctuary%' OR description LIKE '%Sanctuary%')`,
        )
        .run(p.url, note, p.id);
    }
    // Also title+day based safety for re-seeded DBs where ids differ:
    // fix any LIVE Sanctuary row still showing JKPride that is not Jiffy Kink Pride.
    sqlite
      .prepare(
        `UPDATE events
         SET poster_image_url = NULL,
             admin_notes = COALESCE(admin_notes || ' | ', '') ||
               'Cleared wrong JKPride series art (sanctuary_real_flyers_v1) - re-sync Trusted for flyer'
         WHERE status = 'LIVE'
           AND poster_image_url LIKE '%JKPride%'
           AND lower(title) NOT LIKE '%jiffy kink%pride%'
           AND (lower(venue_name) LIKE '%sanctuary%' OR lower(source) LIKE '%sanctuary%')`,
      )
      .run();
    recordBootMigration("sanctuary_real_flyers_v1");
  }

  /**
   * Remove Eventbrite/url_ingest off-scene noise that landed LIVE:
   * Oregon Pro Wrestling, Playmakers (Hazel Dell), Glendoveer golf scramble,
   * LDS Kellogg Creek Ward Sports Night. Root cause: open-mode ingest without
   * queer filter; hardened in isOffSceneNoiseDraft.
   */
  if (!hasBootMigration("scrub_offscene_eb_noise_v1")) {
    const byId = sqlite
      .prepare(
        `SELECT id FROM events WHERE id IN (374, 375, 383, 384)
           OR lower(title) LIKE '%advocacy golf scramble%'
           OR lower(title) LIKE '%kellogg creek ward%'
           OR lower(title) LIKE '%oregon professional wrestling%'
           OR (lower(venue_name) LIKE '%playmakers%sports%' AND lower(title) LIKE '%paint%')
           OR lower(venue_name) LIKE '%church of jesus christ of latter%'
           OR lower(venue_name) LIKE '%oregon pro wrestling%'
           OR lower(venue_name) LIKE '%glendoveer golf%'`,
      )
      .all() as Array<{ id: number }>;
    hardDeleteEventIds(byId.map(r => r.id));
    recordBootMigration("scrub_offscene_eb_noise_v1");
  }

  /**
   * Sweep remaining Eventbrite url_ingest rows with no LGBTQ signal
   * (BJJ, beer runs, rock gym, Shriners, Camas art walk, women golf outing, etc.).
   * Open-mode now requires queer signal for Eventbrite (eb_no_queer_signal).
   */
  if (!hasBootMigration("scrub_url_ingest_eb_no_queer_v2")) {
    const drop = new Set<number>();
    // Known noise ids (live audit 2026-07-26)
    for (const id of [366, 373, 378, 379, 380, 382, 385, 365, 368, 374, 375, 383, 384]) {
      drop.add(id);
    }
    // Title / venue patterns (id-independent)
    const patterned = sqlite
      .prepare(
        `SELECT id FROM events WHERE
           lower(title) LIKE '%girls in gis%'
           OR lower(title) LIKE '%no-gi event%'
           OR lower(title) LIKE '%women golf outing%'
           OR lower(title) LIKE '%hosts & home teams%'
           OR lower(title) LIKE '%hosts and home teams%'
           OR lower(title) LIKE '%5k beer run%'
           OR lower(title) LIKE '%brewery running series%'
           OR lower(title) LIKE '%camas art%wine%'
           OR lower(title) LIKE '%shriners%sports consortium%'
           OR lower(title) LIKE '%rock gym%climbing%'
           OR lower(venue_name) LIKE '%10th planet jiu%'
           OR lower(venue_name) LIKE '%portland rock gym%'
           OR lower(venue_name) LIKE '%shriners children%'
           OR lower(venue_name) LIKE '%patricia reser center%'
           OR (lower(COALESCE(ticket_url,'')) LIKE '%eventbrite%'
               AND lower(COALESCE(source,'')) = 'url_ingest'
               AND lower(title) LIKE '%golf outing%')`,
      )
      .all() as Array<{ id: number }>;
    for (const r of patterned) drop.add(r.id);

    // Broader: LIVE url_ingest + Eventbrite ticket, no LGBTQ signal in text
    const rows = sqlite
      .prepare(
        `SELECT id, title, venue_name, address, description, ticket_url, source
         FROM events
         WHERE status = 'LIVE'
           AND lower(COALESCE(source, '')) = 'url_ingest'
           AND lower(COALESCE(ticket_url, '')) LIKE '%eventbrite%'`,
      )
      .all() as Array<{
        id: number;
        title: string;
        venue_name: string | null;
        address: string | null;
        description: string | null;
        ticket_url: string | null;
        source: string | null;
      }>;

    const QUEER =
      /\b(lgbtq?\+?|queer|gay|lesbian|sapphic|bisexual|\bbi\b|trans(?:gender)?|non[- ]?binary|enby|drag|pride|bear\b|cub\b|leather|kink|fetish|dyke|twink|femme|butch|ballroom|vogue|poly(?:am)?|enm\b|t4t|wlw|mlm|same[- ]sex|rainbow|jockstrap|sex[- ]positive|nudity|orgy|munch|pup\b|handler|jiffy kink|sanctuary|darcelle|stag|badlands|hawks|camp bar|cc slaughters|sports bra|q center|rose court|bearracuda|smyrc|werq|prism)\b/i;
    const QUEER_VENUE =
      /\b(darcelle|stag(?:\s*pdx)?|badlands|eagle(?:\s*portland)?|silverado|cc\s*slaughters|nova(?:\s*pdx)?|holocene|sanctuary|hawks|camp\s*bar|scandals|get\s*down|meet\s*rack|peacock|process|escape\s*bar|sports\s*bra|q\s*center|rose\s*court|bearracuda|steam(?:\s*pdx)?|montavilla\s*station|automatic\s*bar|covert\s*caf|living\s*room\s*wines)\b/i;

    for (const r of rows) {
      const blob = [r.title, r.venue_name, r.address, (r.description || "").slice(0, 500)].join(" ");
      if (QUEER.test(blob) || QUEER_VENUE.test(blob)) continue;
      drop.add(r.id);
    }

    const ids = Array.from(drop);
    try {
      hardDeleteEventIds(ids);
    } catch (e) {
      console.error("[boot] scrub_url_ingest_eb_no_queer_v2 hardDelete failed, soft-hiding:", e);
      for (const id of ids) {
        try {
          sqlite
            .prepare(
              `UPDATE events SET status = 'HIDDEN',
                 admin_notes = COALESCE(admin_notes || ' | ', '') ||
                   'Hidden: Eventbrite url_ingest without LGBTQ signal (scrub_url_ingest_eb_no_queer_v2)'
               WHERE id = ?`,
            )
            .run(id);
        } catch {
          /* ignore single-row failures */
        }
      }
    }
    console.info(`[boot] scrub_url_ingest_eb_no_queer_v2: removed/hid ${ids.length} events`);
    recordBootMigration("scrub_url_ingest_eb_no_queer_v2");
  }

  // One-off: Romance x Women's Sports Book Event (EB / Sports Bra noise) — remove LIVE listing.
  if (!hasBootMigration("remove_romance_womens_sports_book_event_v1")) {
    const rows = sqlite
      .prepare(
        `SELECT id FROM events
         WHERE id = 143
            OR (
              lower(title) LIKE '%romance%x%women%sports%book%'
              OR lower(title) LIKE '%romance x women%sports book%'
              OR lower(title) LIKE '%anita kelly%samatha saldivar%'
              OR lower(title) LIKE '%anita kelly%samantha saldivar%'
            )`,
      )
      .all() as Array<{ id: number }>;
    hardDeleteEventIds(rows.map(r => r.id));
    recordBootMigration("remove_romance_womens_sports_book_event_v1");
  }

  // One-off: hide every UPCOMING Sports Bra listing that is NOT a game/watch-party.
  // Real games carry the auto-generated /api/game-poster image or a matchup /
  // "watch party" title; everything else at The Sports Bra is leaked non-game
  // noise (church pickleball, barbell cert, book events, etc.). Past events are
  // left alone (they no longer show). Reversible: status → HIDDEN with an admin
  // note, no hard delete, so a mis-caught real game can be flipped back to LIVE.
  if (!hasBootMigration("hide_sports_bra_non_games_v1")) {
    const rows = sqlite
      .prepare(
        `SELECT id, title FROM events
          WHERE status = 'LIVE'
            AND lower(venue_name) LIKE '%sports bra%'
            AND date_start >= date('now')
            AND (poster_image_url IS NULL OR lower(poster_image_url) NOT LIKE '%game-poster%')
            AND lower(title) NOT LIKE '% vs %'
            AND lower(title) NOT LIKE '% vs. %'
            AND lower(title) NOT LIKE '%watch party%'`,
      )
      .all() as Array<{ id: number; title: string }>;
    const hide = sqlite.prepare(
      `UPDATE events SET status = 'HIDDEN',
         admin_notes = COALESCE(admin_notes || ' | ', '') ||
           'Hidden: Sports Bra non-game listing (hide_sports_bra_non_games_v1)'
       WHERE id = ?`,
    );
    for (const r of rows) {
      try {
        hide.run(r.id);
      } catch {
        /* ignore single-row failures */
      }
    }
    console.info(
      `[boot] hide_sports_bra_non_games_v1: hid ${rows.length} events` +
        (rows.length ? ` -> ${rows.map(r => `#${r.id} ${r.title}`).join("; ")}` : ""),
    );
    recordBootMigration("hide_sports_bra_non_games_v1");
  }

  // Cross-venue contamination repair:
  // - Camp Bar rows with Eagle Wix posters / Eagle ticket URLs
  // - Sanctuary nights with Game Bang flyer art when title is not Game Bang
  // Poster clear is immediate; Sanctuary re-enrich runs async after boot (see server/index).
  if (!hasBootMigration("cross_venue_contamination_repair_v1")) {
    const noteCamp =
      "Repair cross-venue contamination: cleared foreign (Eagle) poster/ticket on Camp Bar listing.";
    const noteSanc =
      "Repair cross-venue contamination: cleared Game Bang flyer on non-Game Bang Sanctuary night.";

    // Camp Bar only (not Triangle Recreation Camp / Camp TRC)
    const camp = sqlite
      .prepare(
        `UPDATE events
         SET
           poster_image_url = CASE
             WHEN poster_image_url IS NOT NULL
               AND (poster_image_url LIKE '%wixstatic.com%' OR poster_image_url LIKE '%wix:image:%')
             THEN NULL
             ELSE poster_image_url
           END,
           ticket_url = CASE
             WHEN ticket_url IS NOT NULL
               AND (
                 ticket_url LIKE '%eagleportland.com%'
                 OR ticket_url LIKE '%wixstatic.com%'
                 OR ticket_url LIKE '%wix:image:%'
               )
             THEN 'https://campbarpdx.com'
             ELSE ticket_url
           END,
           admin_notes = CASE
             WHEN admin_notes IS NULL OR trim(admin_notes) = '' THEN ?
             WHEN instr(admin_notes, ?) > 0 THEN admin_notes
             ELSE substr(admin_notes || ' | ' || ?, 1, 1000)
           END
         WHERE status != 'REMOVED'
           AND lower(venue_name) LIKE '%camp%'
           AND lower(venue_name) NOT LIKE '%triangle%'
           AND lower(venue_name) NOT LIKE '%trc%'
           AND lower(venue_name) NOT LIKE '%recreation%'
           AND (
             (poster_image_url IS NOT NULL AND (poster_image_url LIKE '%wixstatic.com%' OR poster_image_url LIKE '%wix:image:%'))
             OR (ticket_url IS NOT NULL AND (
               ticket_url LIKE '%eagleportland.com%'
               OR ticket_url LIKE '%wixstatic.com%'
               OR ticket_url LIKE '%wix:image:%'
             ))
           )`,
      )
      .run(noteCamp, noteCamp, noteCamp);

    const sanctuary = sqlite
      .prepare(
        `UPDATE events
         SET
           poster_image_url = NULL,
           admin_notes = CASE
             WHEN admin_notes IS NULL OR trim(admin_notes) = '' THEN ?
             WHEN instr(admin_notes, ?) > 0 THEN admin_notes
             ELSE substr(admin_notes || ' | ' || ?, 1, 1000)
           END
         WHERE status != 'REMOVED'
           AND lower(venue_name) LIKE '%sanctuary%'
           AND poster_image_url IS NOT NULL
           AND lower(poster_image_url) LIKE '%gamebang%'
           AND lower(title) NOT LIKE '%game bang%'
           AND lower(title) NOT LIKE '%gamebang%'`,
      )
      .run(noteSanc, noteSanc, noteSanc);

    console.info(
      `[boot] cross_venue_contamination_repair_v1: camp rows=${camp.changes}, sanctuary rows=${sanctuary.changes}`,
    );
    recordBootMigration("cross_venue_contamination_repair_v1");
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
  const demoUserId = getDemoUserId();
  const isDemo = demoUserId != null && row.user_id === demoUserId;
  const { user_id: _uid, eventDateStart: _eds, ...publicRow } = row;
  return { ...publicRow, isMine, anonymous: !isMine && !isDemo, isDemo };
}

function hubFeedAuthorFromUser(
  u: {
    displayName?: string | null;
    username?: string | null;
    photoUrl?: string | null;
    avatarChoice?: number | null;
    avatarRing?: string | null;
  } | null | undefined,
  anonymous = false,
): HubFeedAuthor {
  if (anonymous || !u) {
    return { displayName: "Someone in the scene", anonymous: true };
  }
  return {
    displayName: u.displayName || u.username || "Member",
    username: u.username ?? null,
    photoUrl: u.photoUrl ?? null,
    avatarChoice: u.avatarChoice ?? 1,
    avatarRing: u.avatarRing ?? "none",
  };
}

function hubFeedResolveBusinessForEvent(
  evt: Event | Record<string, unknown>,
  businesses: Business[],
): Business | null {
  const eventLike = {
    venueName: String((evt as any).venueName ?? (evt as any).venue_name ?? ""),
    address: ((evt as any).address ?? null) as string | null,
    lat: ((evt as any).lat ?? null) as number | null,
    lng: ((evt as any).lng ?? null) as number | null,
  };
  for (const biz of businesses) {
    if (eventMatchesBusiness(eventLike, biz)) return biz;
  }
  return null;
}

function hubFeedVenueAuthor(venueName: string, evt: Event | Record<string, unknown>, businesses: Business[]): HubFeedAuthor {
  const biz = hubFeedResolveBusinessForEvent(evt, businesses);
  const name = biz?.name || venueName;
  // Prefer static neon pack (/directory-logos), then DB imageUrl, then type fallback -
  // same resolution the Directory UI uses (Camp Bar PDX, etc.).
  const logo =
    resolveDirectoryLogo(String(name), biz?.imageUrl)
    || (biz ? directoryFallbackLogo(biz.type) : null)
    || resolveDirectoryLogo(String(venueName), null);
  const businessId = biz?.id ?? null;
  if (logo) {
    return {
      displayName: String(venueName || name),
      photoUrl: logo,
      venueLogo: true,
      businessId,
    };
  }
  return { displayName: String(venueName), venueLogo: !!biz, businessId };
}

/** Feed author for a directory venue posting under its own name. */
function hubFeedBusinessAuthor(biz: Business): HubFeedAuthor {
  const logo = resolveDirectoryLogo(String(biz.name), biz.imageUrl) || directoryFallbackLogo(biz.type) || null;
  return {
    displayName: biz.name,
    photoUrl: logo,
    venueLogo: true,
    businessId: biz.id,
  };
}

/** Resolve a stored Top 8 (JSON [{k:"u"|"b",id}]) into display tiles, dropping dead refs. */
function resolveProfileTop8(raw: string | null | undefined): any[] {
  let list: any[] = [];
  try {
    const parsed = JSON.parse(raw || "[]");
    if (Array.isArray(parsed)) list = parsed;
  } catch { /* ignore malformed */ }
  const out: any[] = [];
  for (const entry of list.slice(0, 8)) {
    const id = Number(entry?.id);
    if (!Number.isInteger(id) || id <= 0) continue;
    if (entry.k === "u") {
      const u = storage.getUserById(id);
      if (u && String(u.status || "").toUpperCase() !== "SUSPENDED") {
        out.push({
          kind: "user",
          id: u.id,
          username: u.username,
          displayName: u.displayName || u.username,
          photoUrl: u.photoUrl || null,
          avatarChoice: u.avatarChoice,
          avatarRing: u.avatarRing,
        });
      }
    } else if (entry.k === "b") {
      const b = storage.getBusiness(id);
      if (b) {
        out.push({
          kind: "place",
          id: b.id,
          name: b.name,
          logoUrl: resolveDirectoryLogo(String(b.name), b.imageUrl) || directoryFallbackLogo(b.type) || null,
        });
      }
    }
  }
  return out;
}

function hubFeedEventEmbed(evt: any, goingCount?: number, poster?: HubFeedAuthor | null): HubFeedEventEmbed {
  return {
    id: Number(evt.id ?? evt.eventId),
    title: evt.title,
    venueName: evt.venueName ?? evt.venue_name ?? "",
    dayOfWeek: evt.dayOfWeek ?? evt.day_of_week ?? null,
    dateStart: evt.dateStart ?? evt.date_start ?? "",
    admission: evt.admission ?? "FREE",
    goingCount,
    posterImageUrl: evt.posterImageUrl ?? evt.poster_image_url ?? null,
    poster: poster ?? null,
  };
}

function hubFeedEventPoster(evt: Event | Record<string, unknown>, businesses: Business[]): HubFeedAuthor | null {
  const claimedBy = (evt as Event).claimedBy ?? (evt as any).claimed_by;
  const submittedBy = (evt as Event).submittedBy ?? (evt as any).submitted_by;
  if (claimedBy) {
    const u = storage.getUserByUsername(String(claimedBy));
    if (u) return hubFeedAuthorFromUser(u);
    return { displayName: String(claimedBy), username: String(claimedBy) };
  }
  if (submittedBy) {
    const u = storage.getUserByUsername(String(submittedBy)) || storage.getUserByEmail(String(submittedBy));
    if (u) return hubFeedAuthorFromUser(u);
  }
  const venueName = (evt as Event).venueName ?? (evt as any).venue_name;
  if (venueName) return hubFeedVenueAuthor(String(venueName), evt, businesses);
  return null;
}

function hubFeedEventAuthor(evt: Event | Record<string, unknown>, businesses: Business[]): HubFeedAuthor {
  const claimedBy = (evt as Event).claimedBy ?? (evt as any).claimed_by;
  const submittedBy = (evt as Event).submittedBy ?? (evt as any).submitted_by;
  const venueName = (evt as Event).venueName ?? (evt as any).venue_name;
  // Prefer directory venue logo for venue-attributed event cards when there is
  // no real member photo (common for unclaimed or venue-named listings).
  if (claimedBy) {
    const u = storage.getUserByUsername(String(claimedBy));
    if (u?.photoUrl) return hubFeedAuthorFromUser(u);
    if (venueName) return hubFeedVenueAuthor(String(venueName), evt, businesses);
    if (u) return hubFeedAuthorFromUser(u);
    return { displayName: String(claimedBy), username: String(claimedBy) };
  }
  if (submittedBy) {
    const u = storage.getUserByUsername(String(submittedBy)) || storage.getUserByEmail(String(submittedBy));
    if (u?.photoUrl) return hubFeedAuthorFromUser(u);
    if (venueName) return hubFeedVenueAuthor(String(venueName), evt, businesses);
    if (u) return hubFeedAuthorFromUser(u);
  }
  if (venueName) return hubFeedVenueAuthor(String(venueName), evt, businesses);
  return { displayName: "The scene" };
}

/** Same-venue same-window window for bundling multi-night drops. */
const HUB_FEED_EVENT_CONDENSE_MS = 2 * 60 * 60 * 1000;

function hubFeedAuthorKey(author: HubFeedAuthor): string {
  return (author.username || author.displayName || "unknown").toLowerCase();
}

function hubFeedNormalizeVenueKey(name: string | null | undefined): string {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Feed sort/time for event cards.
 * Bulk-seeded venue parties share one created_at second - that piles the whole
 * guide into "just now". Prefer the party date_start so the feed spreads across
 * the week. User submissions keep their real listing timestamp.
 */
function hubFeedEventActivityAt(evt: {
  source?: string | null;
  submittedBy?: string | null;
  claimedBy?: string | null;
  createdAt?: string | null;
  dateStart?: string | null;
}): string {
  // News-feed order is chronological by when the event was listed/posted - NOT
  // by the (often future) party date. Sorting by party start floats every
  // upcoming party to the top and buries real-time posts, host updates, and
  // RSVPs beneath the whole week's catalog. Prefer the created/listed time for
  // all events; only fall back to the party date when no created time exists.
  const created = hubFeedCreatedAt(evt);
  if (created) return created;

  const start = typeof evt.dateStart === "string" ? evt.dateStart : "";
  if (start) {
    const startMs = parsePacificDateTime(start);
    if (startMs != null) return new Date(startMs).toISOString();
    return start;
  }
  return created;
}

function hubFeedEventCondenseKey(item: HubFeedItem): string {
  const venue =
    item.event?.venueName
    || item.events?.[0]?.venueName
    || (item.author.venueLogo ? item.author.displayName : "")
    || "";
  const venueKey = hubFeedNormalizeVenueKey(venue);
  if (venueKey) return `venue:${venueKey}`;
  return `author:${hubFeedAuthorKey(item.author)}`;
}

/** Normalize titles so "Jiffy Kink" / "Jiffy Kink!" / "jiffy  kink" series-match. */
function hubFeedNormalizeSeriesTitle(title: string | null | undefined): string {
  return String(title || "")
    .toLowerCase()
    .replace(/\b(part|week|night|ep|episode)\s*#?\d+\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Recurring bulk adds: same venue + same show title across many nights.
 * Falls back to venue/author key when title is missing.
 */
function hubFeedSeriesKey(item: HubFeedItem): string {
  const title = hubFeedNormalizeSeriesTitle(item.event?.title);
  const venue =
    item.event?.venueName
    || item.events?.[0]?.venueName
    || (item.author.venueLogo ? item.author.displayName : "")
    || "";
  const venueKey = hubFeedNormalizeVenueKey(venue);
  if (title && venueKey) return `series:${venueKey}|${title}`;
  if (title) return `series:title:${title}`;
  return hubFeedEventCondenseKey(item);
}

/**
 * Bulk recurring series → ONE feed card (badge Recurring), not N rows.
 * Embeds the next upcoming night (or earliest) only.
 */
function bundleHubFeedRecurringSeries(cluster: HubFeedItem[]): HubFeedItem {
  const withEvents = cluster.filter((item) => item.event != null);
  if (withEvents.length === 0) return cluster[0];
  if (withEvents.length === 1) return withEvents[0];

  const byStart = [...withEvents].sort((a, b) =>
    String(a.event!.dateStart || "").localeCompare(String(b.event!.dateStart || "")),
  );
  const now = Date.now();
  const next =
    byStart.find((item) => {
      const ms = parsePacificDateTime(item.event!.dateStart);
      return ms != null && ms >= now;
    }) || byStart[0];

  const newest = [...withEvents].sort((a, b) =>
    String(b.createdAt).localeCompare(String(a.createdAt)),
  )[0];
  const n = withEvents.length;
  const venueAuthor = newest.author.venueLogo;
  const action = venueAuthor
    ? `Listed a recurring series · ${n} nights`
    : `Posted a recurring series · ${n} nights`;

  return {
    ...newest,
    id: `event-series-${hubFeedSeriesKey(next)}-${n}`,
    kind: "event",
    badge: "Recurring",
    action,
    // Don't dump the first night's long description on a series card.
    text: null,
    // Single embed only - HubFeedCard must not render N event rows.
    event: next.event ?? null,
    events: undefined,
    createdAt: newest.createdAt,
    link: null,
  };
}

function bundleHubFeedEventCluster(cluster: HubFeedItem[]): HubFeedItem {
  if (cluster.length === 1) return cluster[0];
  // Newest activity first in the bundle
  const ordered = [...cluster].sort((a, b) =>
    String(b.createdAt).localeCompare(String(a.createdAt)),
  );
  const head = ordered[0];
  const events = ordered
    .map((item) => item.event)
    .filter((e): e is HubFeedEventEmbed => e != null);
  const count = events.length;
  const venueAuthor = head.author.venueLogo;
  const action = venueAuthor
    ? (count === 1 ? "Listed a party" : `Listed ${count} parties`)
    : (count === 1 ? "Posted a new event" : `Posted ${count} new events`);
  return {
    ...head,
    id: `event-bundle-${hubFeedEventCondenseKey(head)}-${head.createdAt}`,
    action,
    text: null,
    events,
    event: events[0] ?? null,
  };
}

/**
 * Same-venue multi-night drops within a short createdAt window
 * (different show titles - not a single recurring series).
 */
function condenseHubFeedByVenueWindow(items: HubFeedItem[]): HubFeedItem[] {
  if (items.length <= 1) return items;
  const byKey = new Map<string, HubFeedItem[]>();
  for (const item of items) {
    const key = hubFeedEventCondenseKey(item);
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key)!.push(item);
  }
  const out: HubFeedItem[] = [];
  for (const group of Array.from(byKey.values())) {
    group.sort((a: HubFeedItem, b: HubFeedItem) => String(b.createdAt).localeCompare(String(a.createdAt)));
    let cluster: HubFeedItem[] = [];
    for (const item of group) {
      if (cluster.length === 0) {
        cluster.push(item);
        continue;
      }
      const anchor = new Date(cluster[0].createdAt).getTime();
      const t = new Date(item.createdAt).getTime();
      if (Number.isFinite(anchor) && Number.isFinite(t) && Math.abs(anchor - t) <= HUB_FEED_EVENT_CONDENSE_MS) {
        cluster.push(item);
      } else {
        out.push(bundleHubFeedEventCluster(cluster));
        cluster = [item];
      }
    }
    if (cluster.length) out.push(bundleHubFeedEventCluster(cluster));
  }
  return out;
}

function condenseHubFeedEventItems(items: HubFeedItem[]): HubFeedItem[] {
  if (items.length <= 1) return items;

  // Pass 1 - recurring series: same venue + same title (bulk weekly/monthly adds).
  // One news-feed card with badge "Recurring", not one row per night.
  const bySeries = new Map<string, HubFeedItem[]>();
  for (const item of items) {
    const key = hubFeedSeriesKey(item);
    if (!bySeries.has(key)) bySeries.set(key, []);
    bySeries.get(key)!.push(item);
  }

  const residual: HubFeedItem[] = [];
  const seriesOut: HubFeedItem[] = [];
  for (const [key, group] of Array.from(bySeries.entries())) {
    if (key.startsWith("series:") && group.length >= 2) {
      seriesOut.push(bundleHubFeedRecurringSeries(group));
    } else {
      residual.push(...group);
    }
  }

  // Pass 2 - leftover multi-title drops at the same venue still window-bundle.
  return [...seriesOut, ...condenseHubFeedByVenueWindow(residual)];
}

function canViewerSeeHubFeedRsvp(
  row: { userId: number; eventId: number; visibility?: string | null; isAnonymous?: number | boolean },
  viewerUserId: number | undefined,
  viewerIsAdmin: boolean,
): boolean {
  if (viewerUserId == null) return false;
  const vis = resolveAttendanceVisibility(row);
  // Anonymous never surfaces as a named hub card (mask would strip identity anyway).
  if (vis === "anonymous") return false;
  if (viewerIsAdmin) return true;
  if (row.userId === viewerUserId) return true;
  if (storage.isUserEventHost(row.eventId, viewerUserId)) return true;
  if (vis === "friends") {
    return canViewerSeeFriendsAttendance(viewerUserId, row.userId);
  }
  // public: followers of the RSVP'er (existing hub graph filter)
  if (storage.isFollowing(viewerUserId, row.userId)) return true;
  return false;
}

function hubFeedCreatedAt(row: { createdAt?: string | null; created_at?: string | null; dateStart?: string | null; date_start?: string | null }) {
  return row.createdAt ?? row.created_at ?? row.dateStart ?? row.date_start ?? "";
}

function canViewerSeeHubFeedPost(
  post: { userId: number; audience: string; eventId: number | null; status: string },
  viewerUserId: number | undefined,
  viewerRsvpEventIds: Set<number>,
  viewerIsAdmin: boolean,
  posterHostedIds: number[],
): boolean {
  if (post.status !== "LIVE") return false;
  if (viewerUserId == null) return false;
  if (post.userId === viewerUserId) return true;
  if (viewerIsAdmin) return true;
  if (post.audience === "ALL") return true;
  if (post.eventId != null) return viewerRsvpEventIds.has(post.eventId);
  return posterHostedIds.some((id) => viewerRsvpEventIds.has(id));
}

function hubFeedPostToItem(
  row: any,
  goingCounts: Record<number, { count: number }>,
  businesses: Business[] = [],
  viewerUserId?: number,
): HubFeedItem {
  const postType = row.postType ?? row.post_type;
  const audience = row.audience ?? "ALL";
  const eventId = row.eventId ?? row.event_id ?? null;
  const postAs = row.postAs ?? row.post_as ?? "self";
  const businessId = row.businessId ?? row.business_id ?? null;
  const authorUserId = Number(row.userId ?? row.user_id ?? 0) || null;

  let eventEmbed: HubFeedEventEmbed | null = null;
  if (eventId != null) {
    const evt = storage.getEvent(Number(eventId));
    if (evt && evt.status === "LIVE") {
      eventEmbed = hubFeedEventEmbed(evt, goingCounts[evt.id]?.count);
    }
  }

  // The real person is always the account that posted - used as the primary
  // author for "self" posts, and as the "posted by" sub-line for event/venue
  // posts so co-hosts stay attributable.
  const personAuthor = hubFeedAuthorFromUser({
    displayName: row.displayName,
    username: row.username,
    photoUrl: row.authorPhotoUrl ?? row.photoUrl,
    avatarChoice: row.avatarChoice,
    avatarRing: row.avatarRing,
  });

  let author = personAuthor;
  let postedBy: HubFeedAuthor | null = null;

  if (postAs === "venue" && businessId != null) {
    const biz = businesses.find((b) => b.id === Number(businessId)) || storage.getBusiness(Number(businessId));
    if (biz) {
      author = hubFeedBusinessAuthor(biz);
      postedBy = personAuthor;
    }
  } else if (postAs === "event" && eventId != null) {
    const evt = storage.getEvent(Number(eventId));
    if (evt) {
      author = hubFeedVenueAuthor(String(evt.venueName || ""), evt, businesses);
      postedBy = personAuthor;
    }
  }

  const action = audience === "RSVPS"
    ? (eventEmbed ? `Shared with RSVPs for ${eventEmbed.title}` : "Shared with their RSVPs")
    : "Shared with the scene";
  const viewerFollowsAuthor =
    viewerUserId != null && authorUserId != null && viewerUserId !== authorUserId
      ? storage.isFollowing(viewerUserId, authorUserId)
      : null;
  return {
    id: `feed_post-${row.id}`,
    kind: postType === "photo" ? "feed_photo" : "feed_text",
    badge: postType === "photo" ? "Photo" : "Post",
    action,
    text: row.body ?? null,
    photoUrl: row.photoUrl ?? row.photo_url ?? null,
    createdAt: row.createdAt ?? row.created_at ?? "",
    author,
    postedBy,
    event: eventEmbed,
    link: null,
    viewerFollowsAuthor,
  };
}

const HUB_FEED_GUIDE_AUTHOR: HubFeedAuthor = {
  displayName: "Zaylist",
  username: "prideguidepdx",
  photoUrl: "/brand/zaylist-avatar.jpg",
  avatarChoice: 1,
  avatarRing: "rainbow",
};

function buildHubFeedPinnedItems(
  goingCounts: Record<number, { count: number }>,
  businesses: Business[],
): HubFeedItem[] {
  const pinned: HubFeedItem[] = [];
  const anchorTime = "2000-01-01T00:00:00.000Z";

  pinned.push({
    id: "pin-beach-rooster-rock",
    kind: "beach",
    badge: "Beaches",
    action: "River Brats board is live",
    text: "Crossing levels, check-ins, and who is headed out to Rooster Rock today.",
    createdAt: anchorTime,
    author: HUB_FEED_GUIDE_AUTHOR,
    beachId: "rooster-rock",
    beachLabel: "Rooster Rock State Park",
    link: "/nude-beaches?tab=rooster-rock",
    pinned: true,
  });

  pinned.push({
    id: "pin-beach-sauvie-island",
    kind: "beach",
    badge: "Beaches",
    action: "River Brats board is live",
    text: "Collins Beach check-ins, carpools, and the clothing-optional scene on Sauvie Island.",
    createdAt: anchorTime,
    author: HUB_FEED_GUIDE_AUTHOR,
    beachId: "sauvie-island",
    beachLabel: "Collins Beach · Sauvie Island",
    link: "/nude-beaches?tab=sauvie-island",
    pinned: true,
  });

  const stankId = findSiteOwnerEventId();
  if (stankId != null) {
    const stank = sqlite.prepare(`
      SELECT id, title, description, venue_name AS venueName, day_of_week AS dayOfWeek,
             date_start AS dateStart, admission, created_at AS createdAt,
             claimed_by AS claimedBy, submitted_by AS submittedBy
      FROM events WHERE id = ? AND status = 'LIVE'
    `).get(stankId) as any;
    if (stank) {
      pinned.push({
        id: `pin-event-${stank.id}`,
        kind: "event",
        badge: "Event",
        action: "Pride weekend highlight",
        text: stank.description?.slice(0, 280) || null,
        createdAt: anchorTime,
        author: hubFeedEventAuthor(stank, businesses),
        event: hubFeedEventEmbed(
          stank,
          goingCounts[stank.id]?.count,
          hubFeedEventPoster(stank, businesses),
        ),
        link: null,
        pinned: true,
      });
    }
  }

  pinned.push({
    id: "pin-feedback",
    kind: "feedback",
    badge: "Feedback",
    action: "Spot a bug?",
    text: "Broken button, weird layout, or wrong event detail? Send it through the same feedback route as the site footer.",
    createdAt: anchorTime,
    author: HUB_FEED_GUIDE_AUTHOR,
    ctaAction: "feedback",
    ctaLabel: "Submit feedback",
    pinned: true,
  });

  const adminGigId = findSiteAdminGigPostId();
  if (adminGigId != null) {
    const gig = storage.getGigPosts("LIVE").find((g) => g.id === adminGigId);
    if (gig) {
      pinned.push({
        id: `pin-gig-${gig.id}`,
        kind: "gig",
        badge: "Gig",
        action: "Open on Gigz",
        title: gig.title,
        text: gig.description || null,
        createdAt: anchorTime,
        author: hubFeedAuthorFromUser({
          displayName: gig.displayName || gig.name,
          username: gig.username,
          photoUrl: gig.posterPhotoUrl,
          avatarChoice: gig.avatarChoice,
          avatarRing: gig.posterAvatarRing,
        }),
        link: `/pride-work?post=${gig.id}`,
        boardPostId: gig.id,
        pinned: true,
      });
    }
  }

  return pinned;
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

function safeJsonOrNull(value: string | null | undefined) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
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

export const SITE_ADMIN_GIG_TITLE = "Site Admins Needed: Zaylist";
export const SITE_ADMIN_GIG_OWNER_USERNAME = "tucker_pdmax";
export const SITE_OWNER_EVENT_TITLE = "Stank Yes Coach, PDX PRIDE";
export const SITE_OWNER_EMAIL = (
  process.env.SITE_OWNER_EMAIL
  || process.env.ADMIN_USER_EMAILS?.split(",")[0]
  || "hello.tuckercasey@gmail.com"
).trim().toLowerCase();

/** Shared non-personal sender for admin rejects / guide notices. Replies land in Admin inbox. */
export const GUIDE_ADMIN_USERNAME = "prideguidepdx";
export const GUIDE_ADMIN_EMAIL = "admin@zaylist.com";
export const GUIDE_ADMIN_DISPLAY_NAME = "Zaylist";
export const GUIDE_ADMIN_PHOTO_URL = "/brand/zaylist-avatar.jpg";

/** Message context types that always send as the shared guide-admin identity. */
const GUIDE_ADMIN_CONTEXT_TYPES = new Set([
  "GUIDE_UPDATE",
  "PROFILE_PHOTO",
  "SUBMISSION",
  "PROMOTER",
  "EVENT_CLAIM",
  "ADMIN_ALERT",
  "EVENT_TALENT",
  "ADMIN_MESSAGE",
]);

export type AdminActionLogEntry = {
  id: number;
  actorUserId: number | null;
  actorUsername: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  targetLabel: string | null;
  detail: Record<string, unknown> | null;
  createdAt: string;
};

export type AdminQueueBreakdown = {
  total: number;
  submissions: number;
  moderation: number;
  promoters: number;
  businessClaims: number;
  businessSubmissions: number;
  logoRequests: number;
  giftingReports: number;
  giftingFlagged: number;
  missedConnections: number;
  riverBrats: number;
  pendingGigs: number;
  guideUnread: number;
};

function ensureAdminActionLogSchema() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS admin_action_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_user_id INTEGER,
      actor_username TEXT,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      target_label TEXT,
      detail TEXT,
      created_at TEXT NOT NULL DEFAULT ''
    );
    CREATE INDEX IF NOT EXISTS idx_admin_action_log_created ON admin_action_log(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_admin_action_log_action ON admin_action_log(action);
  `);
}
ensureAdminActionLogSchema();

type SiteOwnerRow = {
  id: number;
  email: string;
  displayName: string | null;
  username: string;
};

const SITE_ADMIN_GIG_DESCRIPTION = `Zaylist is looking for site admins to help during Pride season and beyond.

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

/**
 * Shared site identity for admin-originated member messages (photo reject, queue
 * outcomes, manual admin DMs). Not a login for humans - replies go here so they
 * show under floating inbox → Admin → Inbox / Sent for every keyholder.
 */
function ensureGuideAdminUser(): User {
  const byUsername = storage.getUserByUsername(GUIDE_ADMIN_USERNAME);
  if (byUsername) {
    const patch: Record<string, unknown> = {};
    if (byUsername.displayName !== GUIDE_ADMIN_DISPLAY_NAME) patch.displayName = GUIDE_ADMIN_DISPLAY_NAME;
    if (byUsername.photoUrl !== GUIDE_ADMIN_PHOTO_URL) patch.photoUrl = GUIDE_ADMIN_PHOTO_URL;
    if ((byUsername as any).avatarRing !== "rainbow") patch.avatarRing = "rainbow";
    if (byUsername.status !== "active") patch.status = "active";
    if (Object.keys(patch).length) storage.updateUser(byUsername.id, patch as any);
    return { ...byUsername, ...patch } as User;
  }
  const byEmail = storage.getUserByEmail(GUIDE_ADMIN_EMAIL);
  if (byEmail) {
    storage.updateUser(byEmail.id, {
      username: GUIDE_ADMIN_USERNAME,
      displayName: GUIDE_ADMIN_DISPLAY_NAME,
      photoUrl: GUIDE_ADMIN_PHOTO_URL,
      avatarRing: "rainbow",
      status: "active",
    } as any);
    return storage.getUserById(byEmail.id)!;
  }
  const randomPw = crypto.randomBytes(32).toString("hex");
  const created = storage.createUser({
    username: GUIDE_ADMIN_USERNAME,
    email: GUIDE_ADMIN_EMAIL,
    passwordHash: randomPw,
    displayName: GUIDE_ADMIN_DISPLAY_NAME,
  });
  storage.updateUser(created.id, {
    photoUrl: GUIDE_ADMIN_PHOTO_URL,
    avatarRing: "rainbow",
    displayName: GUIDE_ADMIN_DISPLAY_NAME,
  } as any);
  return storage.getUserById(created.id) || created;
}

function resolveGuideAdminUser(): User | undefined {
  try {
    const user = ensureGuideAdminUser();
    // Stamp brand photo after create (createUser doesn't take photoUrl).
    if (user.photoUrl !== GUIDE_ADMIN_PHOTO_URL || (user as any).avatarRing !== "rainbow") {
      storage.updateUser(user.id, {
        photoUrl: GUIDE_ADMIN_PHOTO_URL,
        avatarRing: "rainbow",
        displayName: GUIDE_ADMIN_DISPLAY_NAME,
      } as any);
      return storage.getUserById(user.id);
    }
    return user;
  } catch (err) {
    console.error("[guide_admin] ensure failed:", err);
    return undefined;
  }
}

function isGuideAdminUserId(userId: number | null | undefined): boolean {
  if (!userId) return false;
  const guide = resolveGuideAdminUser();
  return !!guide && guide.id === userId;
}

/** Move legacy owner-sent guide notices onto the shared admin identity. */
function migrateGuideAdminMessagesOnce() {
  if (hasBootMigration("guide_admin_sender_v1")) return;
  const guide = resolveGuideAdminUser();
  const owner = resolveSiteOwner();
  if (!guide) {
    recordBootMigration("guide_admin_sender_v1");
    return;
  }
  if (owner && owner.id !== guide.id) {
    const types = Array.from(GUIDE_ADMIN_CONTEXT_TYPES).map(t => `'${t}'`).join(",");
    try {
      sqlite.prepare(`
        UPDATE messages
        SET from_user_id = ?
        WHERE from_user_id = ?
          AND context_type IN (${types})
      `).run(guide.id, owner.id);
    } catch (err) {
      console.warn("[guide_admin] migrate messages failed:", err);
    }
  }
  recordBootMigration("guide_admin_sender_v1");
}

function isSiteOwnerUser(user: { id?: number | null; email?: string | null; username?: string | null } | null | undefined): boolean {
  if (!user?.id) return false;
  return listSiteOwnerCandidates().some(candidate => candidate.id === user.id);
}

/** True only for Tucker (primary owner), not other env-listed or granted admins. */
function isPrimarySiteOwner(user: { id?: number | null } | null | undefined): boolean {
  if (!user?.id) return false;
  const owner = resolveSiteOwner();
  return !!owner && owner.id === user.id;
}

/**
 * Owner-level admin peers (e.g. @brohoejams): same site-admin powers as primary owner
 * except Owner Desk items stay primary-only.
 * Comma-separated usernames via OWNER_ADMIN_PEER_USERNAMES, default brohoejams.
 */
const OWNER_ADMIN_PEER_USERNAMES: string[] = (
  process.env.OWNER_ADMIN_PEER_USERNAMES || "brohoejams"
)
  .split(",")
  .map(s => s.trim().toLowerCase().replace(/^@/, ""))
  .filter(Boolean);

function isOwnerAdminPeer(user: { username?: string | null } | null | undefined): boolean {
  const uname = String(user?.username || "").trim().toLowerCase().replace(/^@/, "");
  if (!uname) return false;
  return OWNER_ADMIN_PEER_USERNAMES.includes(uname);
}

/** Primary owner OR designated peer - full admin tools except Owner Desk. */
function hasOwnerAdminAccess(user: { id?: number | null; username?: string | null } | null | undefined): boolean {
  return isPrimarySiteOwner(user) || isOwnerAdminPeer(user);
}

function ownerIdentitySets(candidates: SiteOwnerRow[]) {
  return {
    userIds: Array.from(new Set(candidates.map(c => c.id))),
    emails: Array.from(new Set(candidates.map(c => c.email.trim().toLowerCase()).filter(Boolean))),
    usernames: Array.from(new Set(candidates.map(c => c.username.trim().toLowerCase()).filter(Boolean))),
  };
}

function findSiteAdminGigPostId(): number | undefined {
  const byTitle = sqlite.prepare(`SELECT id FROM gig_posts WHERE title = ? LIMIT 1`).get(SITE_ADMIN_GIG_TITLE) as { id: number } | undefined;
  if (byTitle) return byTitle.id;
  const byMarker = sqlite.prepare(`
    SELECT id FROM gig_posts
    WHERE description LIKE 'Zaylist is looking for site admins%'
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
    console.warn("[site_owner] Yes Coach event not found - skipping event host sync");
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
  const sender = resolveGuideAdminUser();
  if (!sender) {
    // Fallback: never leave the member without a notice if guide identity can't be created.
    const owner = resolveSiteOwner();
    if (!owner) return;
    storage.sendMessage(owner.id, toUserId, subject, body, {
      contextType: opts?.contextType || "GUIDE_UPDATE",
      contextId: opts?.contextId ?? null,
      contextLabel: opts?.contextLabel || null,
    });
    return;
  }
  if (sender.id === toUserId) return;
  storage.sendMessage(sender.id, toUserId, subject, body, {
    contextType: opts?.contextType || "GUIDE_UPDATE",
    contextId: opts?.contextId ?? null,
    contextLabel: opts?.contextLabel || null,
  });
}

/** Outbound admin DM / reject note as the shared guide-admin profile. */
function sendAsGuideAdmin(
  toUserId: number,
  subject: string,
  body: string,
  opts?: { threadId?: string; contextType?: string; contextId?: number | null; contextLabel?: string | null },
): Message | undefined {
  const sender = resolveGuideAdminUser();
  if (!sender || sender.id === toUserId) return undefined;
  return storage.sendMessage(sender.id, toUserId, subject, body, {
    threadId: opts?.threadId,
    contextType: opts?.contextType || "ADMIN_MESSAGE",
    contextId: opts?.contextId ?? null,
    contextLabel: opts?.contextLabel || null,
  });
}

function notifySubmissionMerged(
  sub: { id: number; title: string; submitterEmail: string },
  eventTitle: string,
) {
  const recipient = storage.getUserByEmail(sub.submitterEmail);
  if (!recipient) return;
  notifyGuideInbox(
    recipient.id,
    `Merged: ${sub.title}`,
    `Your submission was merged into the existing listing "${eventTitle}". You're attached as the host, open your dashboard to manage it and post updates.`,
    {
      contextType: "SUBMISSION",
      contextId: sub.id,
      contextLabel: eventTitle,
    },
  );
}

function notifyBoardReject(
  toUserId: number,
  boardLabel: string,
  postTitle: string,
  reasonCode: string,
  note: string | undefined,
  context: { contextType: string; contextId: number; contextLabel: string },
) {
  const reason = formatBoardRejectMessage(reasonCode, note);
  const body = `Your ${boardLabel} post "${postTitle}" was sent back and is not on the board.\n\nReason: ${reason}\n\nYou can edit and resubmit when ready.`;
  notifyGuideInbox(toUserId, `${boardLabel} post sent back`, body, context);
}

function notifyProfilePhotoReject(toUserId: number, reasonCode: string, note?: string) {
  const reason = formatProfilePhotoRejectMessage(reasonCode, note);
  const body = `Your profile photo was removed because it doesn't fit our public-facing image guidelines.\n\nReason: ${reason}\n\nYou can upload a new photo from your dashboard when ready.`;
  notifyGuideInbox(toUserId, "Profile photo removed", body, {
    contextType: "PROFILE_PHOTO",
    contextId: toUserId,
    contextLabel: "Profile photo",
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
      : `Your event "${sub.title}" is live on Zaylist. Open your dashboard to see it listed.`;
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
    contactEmail: owner?.email || "hello@zaylist.com",
    description: SITE_ADMIN_GIG_DESCRIPTION,
    skills: "Moderation, Event review, Community support, Detail-oriented",
    compensation: "Volunteer, community help",
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

function attendanceChatExpiresAt(from = new Date()): string {
  return new Date(from.getTime() + ATTENDANCE_CHAT_HOURS * 60 * 60 * 1000).toISOString();
}

function expireStaleAttendances(eventId?: number) {
  const now = new Date().toISOString();
  if (eventId != null) {
    sqlite.prepare(`UPDATE attendances SET is_active = 0 WHERE event_id = ? AND is_active = 1 AND expires_at IS NOT NULL AND expires_at <= ?`).run(eventId, now);
    return;
  }
  sqlite.prepare(`UPDATE attendances SET is_active = 0 WHERE is_active = 1 AND expires_at IS NOT NULL AND expires_at <= ?`).run(now);
}

/** Normalize API / DB attendance visibility. Maps legacy "visible" → "public". */
export function normalizeAttendanceVisibility(
  raw: unknown,
  isAnonymousFallback?: boolean,
): AttendanceVisibility {
  if (isAnonymousFallback === true) return "anonymous";
  const v = String(raw ?? "").trim().toLowerCase();
  if (v === "visible" || v === "public") return "public";
  if (v === "friends" || v === "friends_only" || v === "friends-only") return "friends";
  if (v === "anonymous" || v === "anon") return "anonymous";
  if (isAnonymousFallback === false) return "public";
  return "public";
}

function resolveAttendanceVisibility(r: any): AttendanceVisibility {
  const rawVis = r.visibility ?? r.Visibility;
  const isAnon = Boolean(r.isAnonymous ?? r.is_anonymous);
  if (rawVis != null && String(rawVis).trim() !== "") {
    return normalizeAttendanceVisibility(rawVis, isAnon);
  }
  return isAnon ? "anonymous" : "public";
}

function canViewerSeeFriendsAttendance(
  viewerUserId: number | undefined,
  attendeeUserId: number | null | undefined,
): boolean {
  if (viewerUserId == null || attendeeUserId == null) return false;
  if (viewerUserId === attendeeUserId) return true;
  // Either direction: people you follow OR who follow you.
  return (
    storage.isFollowing(viewerUserId, attendeeUserId) ||
    storage.isFollowing(attendeeUserId, viewerUserId)
  );
}

function maskAttendanceIdentity(
  r: any,
  opts: { handle: string; isAnonymous: boolean; visibility: AttendanceVisibility },
): any {
  const expiresAt = r.expiresAt ?? r.expires_at ?? null;
  return {
    id: r.id,
    event_id: r.event_id ?? r.eventId,
    handle: opts.handle,
    message: r.message,
    avatarSeed: r.avatarSeed ?? r.avatar_seed,
    photoUrl: null,
    userPhotoUrl: null,
    username: undefined,
    displayName: null,
    created_at: r.created_at,
    is_active: r.is_active,
    isAnonymous: opts.isAnonymous,
    visibility: opts.visibility,
    expiresAt,
    masked: true,
  };
}

function maskAttendanceRow(viewerUserId: number | undefined, viewerRsvped: boolean, r: any): any {
  const uid = r.userId ?? r.user_id;
  const isSelf = viewerUserId != null && uid === viewerUserId;
  const visibility = resolveAttendanceVisibility(r);
  const isAnonymous = visibility === "anonymous";
  const expiresAt = r.expiresAt ?? r.expires_at ?? null;

  // Non-RSVPed strangers only see masked shells (counts still via length).
  if (!viewerRsvped && !isSelf) {
    if (visibility === "friends") {
      return maskAttendanceIdentity(r, {
        handle: "Friends",
        isAnonymous: false,
        visibility: "friends",
      });
    }
    return maskAttendanceIdentity(r, {
      handle: "Anonymous",
      isAnonymous: true,
      visibility: isAnonymous ? "anonymous" : "public",
    });
  }

  if (isAnonymous && !isSelf) {
    return maskAttendanceIdentity(r, {
      handle: "Anonymous",
      isAnonymous: true,
      visibility: "anonymous",
    });
  }

  // Friends-only: full identity only for self or follow-graph peers.
  if (visibility === "friends" && !isSelf && !canViewerSeeFriendsAttendance(viewerUserId, uid)) {
    return maskAttendanceIdentity(r, {
      handle: "Friends",
      isAnonymous: false,
      visibility: "friends",
    });
  }

  return {
    ...r,
    isAnonymous,
    visibility,
    expiresAt,
    masked: false,
  };
}

function maskAttendances(viewerUserId: number | undefined, rows: any[]): any[] {
  const viewerRsvped = viewerUserId != null && rows.some((r: any) => (r.userId ?? r.user_id) === viewerUserId);
  return rows.map(r => maskAttendanceRow(viewerUserId, viewerRsvped, r));
}

function getActiveAttendanceForUser(eventId: number, userId: number) {
  expireStaleAttendances(eventId);
  return sqlite.prepare(`
    SELECT * FROM attendances
    WHERE event_id = ? AND user_id = ? AND is_active = 1
    LIMIT 1
  `).get(eventId, userId) as Attendance | undefined;
}

export type AdminMetricsSnapshot = {
  generatedAt: string;
  users: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  activeSessions: number;
  messages: number;
  liveEvents: number;
  hiddenEvents: number;
  userSubmittedEvents: number;
  seededEvents: number;
  attendances: number;
  attendancesThisWeek: number;
  pendingSubmissions: number;
  pendingQueue: number;
  gigPosts: number;
  giftingPosts: number;
  missedConnections: number;
  directoryPlaces: number;
  unclaimedEvents: number;
  claimedEvents: number;
  approvedPromoters: number;
  pendingPromoterRequests: number;
  signupsTrend14d: number[];
  rsvpsTrend14d: number[];
  memberGrowth12h: Array<{
    at: string;
    signups: number;
    rsvps: number;
    total: number;
    cumulativeSignups: number;
    cumulativeRsvps: number;
  }>;
  contentBreakdown: Array<{ label: string; count: number }>;
  eventSources: Array<{ label: string; count: number }>;
  conversions: {
    newSignupsThisWeek: number;
    newSignupsPrevWeek: number;
    eventSubmissionsThisWeek: number;
    eventSubmissionsPrevWeek: number;
    rsvpsThisWeek: number;
    rsvpsPrevWeek: number;
  };
  traffic: TrafficMetrics;
  productExperience: ProductExperienceMetrics;
};

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
  autoApproveClaim(id: number, claimedByUsername: string): void;
  approveSubmission(id: number, adminName: string): Submission | undefined;
  mergeSubmissionIntoEvent(id: number, eventId: number, adminName: string): { event: Event; submission: Submission } | { error: string };
  rejectSubmission(id: number, reason: string): void;
  // Gigs
  getGigPosts(status?: string): GigPostWithAuthor[];
  createGigPost(data: InsertGigPost): GigPost;
  getGigPostsByUser(userId: number): GigPost[];
  updateGigPost(id: number, userId: number, data: Partial<GigPost>): void;
  deleteGigPost(id: number, userId: number): void;
  adminUpdateGigStatus(id: number, status: string): void;
  adminUpdateGigPost(id: number, data: Partial<GigPost>): GigPost | undefined;
  rejectGigPost(id: number, reasonCode: string, note?: string): { ok?: boolean; error?: string };
  rejectGiftingPost(id: number, reasonCode: string, note?: string): { ok?: boolean; error?: string };
  rejectMissedConnection(id: number, reasonCode: string, note?: string): { ok?: boolean; error?: string };
  rejectUserProfilePhoto(username: string, reasonCode: string, note?: string): { ok?: boolean; error?: string };
  getAdminMissedConnections(): any[];
  getRecentlyReviewedMissedConnections(): any[];
  approveMissedConnection(id: number): { ok?: boolean; error?: string };
  removeMissedConnectionAdmin(id: number): { ok?: boolean; error?: string };
  ensureSiteAdminGigPost(): void;
  syncSiteOwnerPortfolio(): void;
  isSiteOwnerUser(user: { id?: number | null; email?: string | null; username?: string | null } | null | undefined): boolean;
  isPrimarySiteOwner(user: { id?: number | null } | null | undefined): boolean;
  isOwnerAdminPeer(user: { username?: string | null } | null | undefined): boolean;
  /** Primary owner or peer (e.g. brohoejams) - full admin tools except Owner Desk. */
  hasOwnerAdminAccess(user: { id?: number | null; username?: string | null } | null | undefined): boolean;
  // Promoters
  getPromoterByEmail(email: string): Promoter | undefined;
  createPromoter(data: InsertPromoter): Promoter;
  // Moderation requests
  getModerationRequests(status?: string): ModerationRequest[];
  createModerationRequest(data: InsertModerationRequest): ModerationRequest;
  resolveModerationRequest(id: number, status: "APPROVED" | "REJECTED", adminNotes?: string): void;
  dismissStaleTestModerationRequests(): number;
  getAdminPendingCount(): number;
  getAdminQueueBreakdown(): AdminQueueBreakdown;
  logAdminAction(input: {
    actorUserId?: number | null;
    actorUsername?: string | null;
    action: string;
    targetType?: string | null;
    targetId?: string | number | null;
    targetLabel?: string | null;
    detail?: Record<string, unknown> | null;
  }): void;
  getAdminActionLog(limit?: number): AdminActionLogEntry[];
  adminGlobalSearch(rawQuery: string, limit?: number): {
    users: Array<{ id: number; username: string; displayName: string | null; email: string; promoterStatus: string }>;
    events: Array<{ id: number; title: string; venueName: string | null; status: string; dateStart: string | null }>;
    queue: Array<{ kind: string; id: number; title: string; meta: string }>;
  };
  markGuideAdminInboxRead(): number;
  softDeleteGuideAdminThread(threadId: string): number;
  isSystemGuideAccount(user: { id?: number | null; username?: string | null; email?: string | null } | null | undefined): boolean;
  countAdminGiftingFlagged(): number;
  getAdminMetrics(): AdminMetricsSnapshot;
  hasSiteAdminGrant(userId: number): boolean;
  /** True for env-listed admins, site_admin_grants, or sub_admin flag. */
  userIsSiteAdmin(user: { id?: number | null; email?: string | null; username?: string | null; subAdmin?: boolean | null } | null | undefined): boolean;
  ensureSiteAdminGrant(userId: number, grantedByUserId: number | null, note?: string | null, createdAt?: string): void;
  /** Content likes for profile Updates (GIG | GIFTING | SPOTTED | HUB). */
  countContentLikes(contentType: string, contentId: number): number;
  hasContentLike(contentType: string, contentId: number, userId: number): boolean;
  toggleContentLike(contentType: string, contentId: number, userId: number): { liked: boolean; likes: number; error?: string };
  /** Public thread replies for GIG / HUB. SPOTTED / GIFTING use native private flows for counts only. */
  countContentReplies(contentType: string, contentId: number): number;
  listContentReplies(contentType: string, contentId: number, limit?: number): Array<{
    id: number;
    body: string;
    createdAt: string;
    author: {
      username: string;
      displayName: string | null;
      photoUrl: string | null;
      avatarChoice: number;
      avatarRing: string;
    };
  }>;
  createContentReply(contentType: string, contentId: number, userId: number, body: string): {
    reply?: {
      id: number;
      body: string;
      createdAt: string;
      author: {
        username: string;
        displayName: string | null;
        photoUrl: string | null;
        avatarChoice: number;
        avatarRing: string;
      };
    };
    replies?: number;
    error?: string;
  };
  /** Native count for SPOTTED (threads) / GIFTING (interests); content_replies for GIG / HUB. */
  getContentReplyMeta(contentType: string, contentId: number): {
    count: number;
    mode: "thread" | "native";
    nativeHref: string | null;
    error?: string;
  };
  listSiteAdmins(): Array<{
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
    /** Latest admin-panel or promoter-host activity for team roster. */
    lastActivityAt: string | null;
    lastActivityLabel: string | null;
  }>;
  grantSiteAdminByIdentifier(identifier: string, grantedByUserId: number | null, note?: string): { admin?: any; error?: string };
  revokeSiteAdmin(userId: number): { ok?: boolean; error?: string };
  // Attendance
  getAttendances(eventId: number, viewerUserId?: number): any[];
  getAttendanceSummaries(): Record<number, { count: number; preview: Array<{ id: number; initials: string; avatarSeed: string }> }>;
  getAttendancesByUser(userId: number): any[];
  /**
   * Upsert RSVP. `visibility` accepts "public"|"friends"|"anonymous" (or legacy "visible"),
   * or a boolean (true = anonymous) for older callers.
   */
  upsertAttendance(
    eventId: number,
    user: User,
    message: string,
    visibility?: AttendanceVisibility | boolean | string,
  ): Attendance;
  removeAttendance(eventId: number, userId: number): void;
  /** Global search v0: LIVE events + active directory places. */
  searchGlobal(q: string): {
    q: string;
    events: Array<{ id: number; title: string; subtitle: string; href: string }>;
    places: Array<{ id: number; name: string; subtitle: string; href: string }>;
  };
  getEventChatMessages(eventId: number, viewerUserId: number): {
    messages: any[];
    expiresAt: string | null;
    chatOpen: boolean;
    opensAt: string | null;
    windowState: "BEFORE" | "OPEN" | "CLOSED";
    isHost: boolean;
    pinned: any | null;
  };
  postEventChatMessage(eventId: number, userId: number, body: string): any;
  // Users
  getUserById(id: number): User | undefined;
  getUserByEmail(email: string): User | undefined;
  getUserByUsername(username: string): User | undefined;
  getUserByGoogleId(googleId: string): User | undefined;
  createUser(data: {
    username: string;
    email: string;
    passwordHash: string;
    displayName?: string;
    googleId?: string;
    communityStandardsVersion?: string | null;
    communityStandardsAgreedAt?: string | null;
  }): User;
  setCommunityStandardsAgreement(userId: number, opts: { agreed: boolean; version: string }): void;
  applyAccountModeration(opts: {
    targetUserId: number;
    actorUserId: number;
    action: "suspend" | "unsuspend" | "shadowban" | "unshadowban" | "delete";
    reasonCode?: string | null;
    reasonLabel?: string | null;
    note?: string | null;
    until?: string | null;
  }): User | null;
  clearExpiredAccountModeration(userId: number): User | null;
  linkGoogleToUser(id: number, googleId: string): void;
  updateUser(id: number, data: Partial<Pick<User, 'displayName' | 'avatarChoice' | 'avatarRing' | 'avatarCrop' | 'bio' | 'photoUrl' | 'pronouns' | 'location' | 'socialLinks' | 'profileEmbeds' | 'profilePhotos' | 'promoterStatus' | 'subAdmin' | 'talents' | 'standFor' | 'affiliatedVenueIds' | 'marquee' | 'top8' | 'accentColor' | 'banner' | 'coverImageUrl' | 'coverCrop' | 'pup' | 'username' | 'usernameChangedAt'>>): void;
  changeUsername(userId: number, rawUsername: string): { username: string } | { error: string };
  updatePasswordHash(id: number, passwordHash: string): void;
  createPasswordResetToken(userId: number, tokenHash: string, expiresAt: string): void;
  resetPasswordWithToken(tokenHash: string, newPassword: string): boolean;
  setPromoterStatus(userId: number, status: string): void;
  /** Resolve standalone promoter-application rows when the promoter queue is acted on. */
  resolvePromoterApplicationSubmissions(userId: number, outcome: "approved" | "rejected", adminName?: string, reason?: string): void;
  getAllUsers(): User[];
  // Member profiles + follows
  getPublicProfile(username: string, viewerUserId?: number | null, viewerIsAdmin?: boolean): any | undefined;
  getPackLinks(userId: number, relation: "packmate" | "handler"): Array<{ id: number; username: string; displayName: string | null; avatarChoice: number; avatarRing: string; photoUrl: string | null }>;
  addPackLink(userId: number, relation: "packmate" | "handler", targetUsername: string): { ok?: boolean; error?: string };
  removePackLink(userId: number, relation: "packmate" | "handler", linkedUserId: number): void;
  getProfileMedia(userId: number): any | null;
  saveProfileMedia(userId: number, data: any): any;
  /** Soft-launch: every active member follows every other unless unfollowed. */
  isFollowAllDefault(): boolean;
  isFollowBlocked(followerUserId: number, followingUserId: number): boolean;
  followUser(followerUserId: number, followingUserId: number): void;
  unfollowUser(followerUserId: number, followingUserId: number): void;
  getFollowerCount(userId: number): number;
  getFollowingCount(userId: number): number;
  isFollowing(followerUserId: number, followingUserId: number): boolean;
  followBusiness(followerUserId: number, businessId: number): void;
  unfollowBusiness(followerUserId: number, businessId: number): void;
  isFollowingBusiness(followerUserId: number, businessId: number): boolean;
  getBusinessFollowerCount(businessId: number): number;
  /** Active directory venues this user follows (business_follows). */
  getFollowedBusinessesList(userId: number): import("../shared/peopleHub").HubFollowedPlace[];
  getFollowingList(userId: number, viewerUserId: number | null): import("../shared/peopleHub").PeopleHubUser[];
  getFollowersList(userId: number, viewerUserId: number | null): import("../shared/peopleHub").PeopleHubUser[];
  discoverPeople(viewerUserId: number, limit?: number): import("../shared/peopleHub").PeopleHubUser[];
  buildPeopleHubUser(row: any, viewerUserId: number | null): import("../shared/peopleHub").PeopleHubUser;
  countEventsHostedByUser(userId: number): number;
  purgeQaTestUsers(): { deleted: number; usernames: string[] };
  countActiveMessages(): number;
  autoApproveSubmission(id: number, claimedByUsername: string): void;
  getPendingPromoterRequests(): any[];
  // Host messages
  getHostMessages(eventId: number, limit?: number): any[];
  createHostMessage(data: InsertHostMessage): HostMessage;
  notifyAttendeesOfHostUpdate(eventId: number, hostUserId: number, eventTitle: string, body: string): number;
  getFollowerUserIds(userId: number): number[];
  getPastAttendeeUserIdsForHost(hostUserId: number): number[];
  previewEventInviteAudience(eventId: number, hostUserId: number): {
    pastAttendees: number;
    followers: number;
    total: number;
  };
  inviteAudienceToEvent(
    eventId: number,
    hostUserId: number,
    opts?: {
      includePastAttendees?: boolean;
      includeFollowers?: boolean;
      message?: string | null;
    },
  ): { sent: number; pastAttendees: number; followers: number; skipped: number };
  getEventHosts(eventId: number): any[];
  resolveUserByIdentifier(identifier: string): User | undefined;
  resolveEventPrimaryHostUser(eventId: number): User | undefined;
  resolveVenueOwnerUser(event: Pick<Event, "venueName" | "address" | "lat" | "lng">): { user: User; businessName: string } | undefined;
  resolveEventMessageRecipient(eventId: number): { user: User; recipientType: "host" | "venue_owner"; venueName?: string } | undefined;
  isUserEventHost(eventId: number, userId: number): boolean;
  setPrimaryEventHost(eventId: number, userId: number, addedByUserId: number | null): void;
  addEventCoHost(eventId: number, inviterUserId: number, username: string, email: string): { host?: any; error?: string };
  replaceEventPrimaryHost(eventId: number, newUserId: number): void;
  unassignEventHosts(eventId: number): void;
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
  getMemberBlockStatus(viewerUserId: number, targetUserId: number): { blockedByViewer: boolean; blockedViewer: boolean; interactionBlocked: boolean };
  blockMember(blockerUserId: number, blockedUserId: number): void;
  unblockMember(blockerUserId: number, blockedUserId: number): void;
  getBlockedMembers(blockerUserId: number): Array<{ id: number; username: string; displayName: string | null; photoUrl: string | null }>;
  isMemberInteractionBlocked(firstUserId: number, secondUserId: number): boolean;
  /** Toggle a DM reaction. Viewer must be a participant on the message. */
  toggleMessageReaction(
    messageId: number,
    userId: number,
    emoji: string,
  ): {
    reactions: Array<{ code: string; count: number; mine: boolean }>;
    error?: string;
  };
  sendMessage(fromUserId: number, toUserId: number, subject: string, body: string, opts?: { threadId?: string; contextType?: string; contextId?: number | null; contextLabel?: string | null }): Message;
  /** Shared non-personal admin identity used for rejects / admin DMs. */
  resolveGuideAdminUser(): User | undefined;
  isGuideAdminUserId(userId: number | null | undefined): boolean;
  getGuideAdminInbox(): Message[];
  getGuideAdminSent(): Message[];
  getGuideAdminUnreadCount(): number;
  /** Send or reply as the shared guide-admin profile (not the acting admin). */
  sendAsGuideAdmin(
    toUserId: number,
    subject: string,
    body: string,
    opts?: { threadId?: string; contextType?: string; contextId?: number | null; contextLabel?: string | null },
  ): Message | undefined;
  /** Drop a content-moderation alert into the site owner's guide inbox. */
  notifyOwnerModeration(subject: string, body: string): void;
  /** Public "Message me" / sponsorship pitch / custom order form on the About page - always lands in the owner's guide inbox. Returns false if there's no resolvable owner to deliver to. */
  sendPortfolioContactMessage(input: {
    kind?: "message" | "sponsor" | "order";
    name: string;
    email: string;
    phone?: string;
    message: string;
    businessName?: string;
    lengthNeeded?: string;
    sponsorshipType?: string;
    /** Custom disco-body order fields */
    size?: string;
    hangingSpace?: string;
    ceilingHeight?: string;
    attachmentUrls?: string[];
    pageUrl?: string;
  }): boolean;
  getNotificationPrefs(userId: number): NotificationPrefs;
  setNotificationPrefs(userId: number, prefs: Partial<NotificationPrefs>, isAdmin?: boolean): NotificationPrefs;
  upsertPushSubscription(userId: number, data: { endpoint: string; p256dh: string; auth: string; userAgent?: string | null; platform?: string | null }): unknown;
  deactivatePushSubscription(id: number): void;
  deactivatePushSubscriptionByEndpoint(userId: number, endpoint: string): void;
  touchPushSubscription(id: number): void;
  getActivePushSubscriptions(userId: number): Array<{ id: number; endpoint: string; p256dh: string; auth: string }>;
  countActivePushSubscriptions(): number;
  getAllActivePushSubscriptions(): Array<{ id: number; userId: number; endpoint: string; p256dh: string; auth: string }>;
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
  getMissedConnectionsByBeach(beachId: string, viewerUserId?: number): any[];
  getMissedConnectionsByUser(userId: number): MissedConnection[];
  expireRiverBratsCheckins(): void;
  getBeachCheckins(beachId: string, calendarDate: string, viewerUserId?: number): any[];
  /** Active planned beach days for My Schedule (advance check-ins). */
  getBeachCheckinsByUser(userId: number): Array<{
    id: number;
    beachId: string;
    calendarDate: string;
    arrivalHour: number;
    departHour: number | null;
    note: string | null;
    presence: string;
    isAnonymous: boolean;
  }>;
  getBeachCheckinByUser(beachId: string, userId: number, calendarDate: string): BeachCheckin | undefined;
  upsertBeachCheckin(data: InsertBeachCheckin & { isAnonymous?: boolean }): BeachCheckin;
  deleteBeachCheckin(id: number, userId: number): boolean;
  verifyBeachPresence(userId: number, beachId: string, calendarDate: string, lat: number, lng: number):
    | { ok: true; presence: "HERE"; gpsVerifiedAt: string }
    | { ok: false; error: "NO_CHECKIN" }
    | { ok: false; error: "TOO_FAR"; distanceM: number };
  scheduleBeachArrivalPrompt(checkin: BeachCheckin): void;
  cancelBeachArrivalPrompts(userId: number, beachId: string, calendarDate: string): void;
  markPromptSkipped(promptId: number): void;
  claimDuePrompts(nowIso: string, limit?: number): any[];
  purgeExpiredChatMessages(now?: number): void;
  getMyGroupChats(userId: number): any[];
  /** Active non-anon check-in dates for a user at a beach (still in access window). */
  getBeachChatDatesForUser(beachId: string, userId: number): string[];
  getBeachChatMessages(beachId: string, calendarDate: string, viewerUserId: number): { messages: any[]; expiresAt: string | null; opensAt?: string | null; chatOpen: boolean };
  postBeachChatMessage(beachId: string, calendarDate: string, userId: number, body: string): any;
  expireBeachCarpoolPosts(): void;
  getBeachCarpoolPosts(beachId: string, tripDate: string, viewerUserId?: number): any[];
  getBeachCarpoolPost(id: number): any;
  createBeachCarpoolPost(data: InsertBeachCarpoolPost): BeachCarpoolPost;
  deleteBeachCarpoolPost(id: number, userId: number): boolean;
  requestBeachCarpool(postId: number, userId: number, note: string): BeachCarpoolRequest;
  selectBeachCarpoolRequest(postId: number, requestId: number, posterUserId: number): Message;
  getBeachCarpoolRequests(postId: number, posterUserId: number): any[];
  reportRiverBrats(data: InsertRiverBratsReport): void;
  getRiverBratsReports(status?: string): any[];
  resolveRiverBratsReport(id: number, adminNotes?: string): void;
  getHubFeed(opts?: { tab?: HubFeedTab; limit?: number; cursor?: string; viewerUserId?: number; viewerIsAdmin?: boolean }): HubFeedResponse;
  canUserPostToHubFeed(userId: number, isAdmin?: boolean): boolean;
  getHostedLiveEventIds(userId: number): number[];
  createHubFeedPost(data: InsertHubFeedPost): HubFeedPost;
  getHubFeedPostsByUser(userId: number, limit?: number): HubFeedPost[];
  removeHubFeedPost(id: number, userId: number, opts?: { isAdmin?: boolean }): { ok: true } | { error: string };
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
  // Soft launch feedback (legacy table; new reports land in owner_desk_items)
  createFeedbackReport(data: InsertFeedbackReport): FeedbackReport;
  getFeedbackReports(status?: string): FeedbackReport[];
  resolveFeedbackReport(id: number): void;
  // Owner desk - contact form, bug reports, owner-only escalations
  createOwnerDeskItem(data: {
    kind: string;
    title: string;
    summary?: string | null;
    body: string;
    contactName?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    pageUrl?: string | null;
    severity?: string | null;
    metaJson?: Record<string, unknown> | null;
  }): { id: number; kind: string; title: string; status: string; createdAt: string };
  getOwnerDeskItems(status?: string): Array<{
    id: number;
    source: "desk" | "feedback";
    kind: string;
    kindLabel: string;
    title: string;
    summary: string;
    body: string;
    contactName: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    pageUrl: string | null;
    severity: string | null;
    meta: Record<string, unknown>;
    status: string;
    createdAt: string;
    resolvedAt: string | null;
  }>;
  getOwnerDeskCount(): number;
  resolveOwnerDeskItem(id: number, source?: "desk" | "feedback"): void;
  // Business directory
  getBusinesses(opts?: { type?: string; neighborhood?: string; queerOwned?: boolean }): Business[];
  getBusiness(id: number): Business | undefined;
  createBusiness(data: InsertBusiness): Business;
  updateBusiness(id: number, data: Partial<InsertBusiness>): Business | undefined;
  toggleBusinessActive(id: number, active: boolean): void;
  getUserLinkedBusinesses(userId: number): { id: number; name: string; type: string; address: string | null }[];
  // Business ownership: claims, new-business submissions, blocklist, logo requests
  getUserOwnedBusinesses(userId: number): Business[];
  /** Admin directory roster with owner profiles for venue-claims assign UI. */
  getAdminDirectoryBusinesses(): Array<Business & {
    ownerProfile: {
      id: number;
      username: string;
      displayName: string | null;
      email: string;
      photoUrl: string | null;
      avatarChoice: number;
      avatarRing: string;
    } | null;
  }>;
  assignBusinessOwner(businessId: number, userId: number): { ok?: boolean; error?: string; business?: Business };
  clearBusinessOwner(businessId: number): { ok?: boolean; error?: string; business?: Business };
  createBusinessClaim(
    businessId: number,
    userId: number,
    claimReason: string,
    opts?: { mergePayload?: Record<string, unknown> },
  ): { claim?: BusinessClaim; error?: string };
  getPendingBusinessClaims(): any[];
  getRecentResolvedBusinessClaims(): any[];
  approveBusinessClaim(id: number, adminName: string): { ok?: boolean; error?: string };
  rejectBusinessClaim(id: number, reason?: string): void;
  createBusinessSubmission(userId: number, data: Omit<InsertBusiness, "active" | "isNew" | "queerOwned" | "queerFriendly"> & { logoImageUrl?: string | null }): BusinessSubmission;
  getPendingBusinessSubmissions(): BusinessSubmission[];
  getRecentResolvedBusinessSubmissions(): BusinessSubmission[];
  approveBusinessSubmission(id: number, adminName: string, overrideImageUrl?: string): { business?: Business; error?: string };
  rejectBusinessSubmission(id: number, reason?: string): void;
  getPromotersForBusiness(businessId: number): { id: number; username: string; displayName: string | null }[];
  blockPromoterFromBusiness(businessId: number, blockedUserId: number, createdByUserId: number): { ok?: boolean; error?: string };
  unblockPromoterFromBusiness(businessId: number, blockedUserId: number): void;
  isPromoterBlockedFromBusiness(businessId: number, userId: number): boolean;
  getBlockedBusinessMatch(userId: number, venueLike: { venueName: string; address?: string | null; lat?: number | null; lng?: number | null }): Business | null;
  getBusinessBlocks(businessId: number): any[];
  createBusinessLogoRequest(businessId: number, userId: number, imageUrl: string): BusinessLogoRequest;
  getPendingBusinessLogoRequests(): any[];
  getRecentResolvedBusinessLogoRequests(): any[];
  approveBusinessLogoRequest(id: number, overrideImageUrl?: string): { ok?: boolean; error?: string };
  rejectBusinessLogoRequest(id: number, reason?: string): void;
}

const RECENT_QUEUE_DAYS = 30;

function recentQueueCutoffIso(days = RECENT_QUEUE_DAYS): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
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
    // Footgun guard: never inherit a silent LIVE default. Callers that want public
    // must pass status: "LIVE" explicitly (admin seed, approve flows, etc.).
    const now = new Date().toISOString();
    return db
      .insert(events)
      .values({
        ...data,
        status: data.status ?? "HIDDEN",
        createdAt: now,
        updatedAt: now,
      })
      .returning()
      .get();
  },
  updateEventStatus(id, status) {
    db.update(events)
      .set({ status, updatedAt: new Date().toISOString() })
      .where(eq(events.id, id))
      .run();
  },
  updateEvent(id, data) {
    const { updatedAt: _ignore, createdAt: _c, ...rest } = data as Partial<InsertEvent> & {
      updatedAt?: string;
      createdAt?: string;
    };
    db.update(events)
      .set({ ...rest, updatedAt: new Date().toISOString() } as any)
      .where(eq(events.id, id))
      .run();
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
    // Hide the shared system guide identity from roster / search surfaces.
    return db.select().from(users).all().filter((u) => !storage.isSystemGuideAccount(u));
  },
  // ─── Member profiles + follows ─────────────────────────────────────────────
  /**
   * Soft-launch graph: every active member follows every other active member
   * unless they explicitly unfollowed (row in follow_blocks).
   * Set FOLLOW_ALL_DEFAULT=0 to revert to explicit follows-only.
   */
  isFollowAllDefault() {
    const v = String(process.env.FOLLOW_ALL_DEFAULT ?? "1").trim().toLowerCase();
    return !(v === "0" || v === "false" || v === "off" || v === "no");
  },
  isFollowBlocked(followerUserId, followingUserId) {
    if (followerUserId === followingUserId) return false;
    return !!sqlite.prepare(
      `SELECT 1 FROM follow_blocks WHERE blocker_user_id = ? AND blocked_user_id = ?`,
    ).get(followerUserId, followingUserId);
  },
  followUser(followerUserId, followingUserId) {
    if (followerUserId === followingUserId) return;
    // Re-follow: clear soft-launch unfollow block
    sqlite.prepare(
      `DELETE FROM follow_blocks WHERE blocker_user_id = ? AND blocked_user_id = ?`,
    ).run(followerUserId, followingUserId);
    sqlite.prepare(`
      INSERT OR IGNORE INTO follows (follower_user_id, following_user_id, created_at)
      VALUES (?, ?, ?)
    `).run(followerUserId, followingUserId, new Date().toISOString());
  },
  unfollowUser(followerUserId, followingUserId) {
    if (followerUserId === followingUserId) return;
    sqlite.prepare(`DELETE FROM follows WHERE follower_user_id = ? AND following_user_id = ?`).run(followerUserId, followingUserId);
    if (storage.isFollowAllDefault()) {
      sqlite.prepare(`
        INSERT OR IGNORE INTO follow_blocks (blocker_user_id, blocked_user_id, created_at)
        VALUES (?, ?, ?)
      `).run(followerUserId, followingUserId, new Date().toISOString());
    }
  },
  getFollowerCount(userId) {
    if (storage.isFollowAllDefault()) {
      // Everyone active except self and those who unfollowed this user
      const row = sqlite.prepare(`
        SELECT COUNT(*) AS count FROM users u
        WHERE u.status = 'active'
          AND u.id != ?
          AND NOT EXISTS (
            SELECT 1 FROM follow_blocks fb
            WHERE fb.blocker_user_id = u.id AND fb.blocked_user_id = ?
          )
      `).get(userId, userId) as { count: number } | undefined;
      // Subtract system guide accounts (not listed as people)
      const guide = sqlite.prepare(`
        SELECT COUNT(*) AS count FROM users u
        WHERE u.status = 'active' AND u.id != ?
          AND lower(u.username) IN ('prideguidepdx', 'zaylist')
          AND NOT EXISTS (
            SELECT 1 FROM follow_blocks fb
            WHERE fb.blocker_user_id = u.id AND fb.blocked_user_id = ?
          )
      `).get(userId, userId) as { count: number } | undefined;
      return Math.max(0, (row?.count ?? 0) - (guide?.count ?? 0));
    }
    const row = sqlite.prepare(`SELECT COUNT(*) AS count FROM follows WHERE following_user_id = ?`).get(userId) as { count: number } | undefined;
    return row?.count ?? 0;
  },
  getFollowingCount(userId) {
    if (storage.isFollowAllDefault()) {
      const row = sqlite.prepare(`
        SELECT COUNT(*) AS count FROM users u
        WHERE u.status = 'active'
          AND u.id != ?
          AND NOT EXISTS (
            SELECT 1 FROM follow_blocks fb
            WHERE fb.blocker_user_id = ? AND fb.blocked_user_id = u.id
          )
      `).get(userId, userId) as { count: number } | undefined;
      const guide = sqlite.prepare(`
        SELECT COUNT(*) AS count FROM users u
        WHERE u.status = 'active' AND u.id != ?
          AND lower(u.username) IN ('prideguidepdx', 'zaylist')
          AND NOT EXISTS (
            SELECT 1 FROM follow_blocks fb
            WHERE fb.blocker_user_id = ? AND fb.blocked_user_id = u.id
          )
      `).get(userId, userId) as { count: number } | undefined;
      return Math.max(0, (row?.count ?? 0) - (guide?.count ?? 0));
    }
    const row = sqlite.prepare(`SELECT COUNT(*) AS count FROM follows WHERE follower_user_id = ?`).get(userId) as { count: number } | undefined;
    return row?.count ?? 0;
  },
  isFollowing(followerUserId, followingUserId) {
    if (followerUserId === followingUserId) return false;
    if (storage.isFollowAllDefault()) {
      return !storage.isFollowBlocked(followerUserId, followingUserId);
    }
    return !!sqlite.prepare(`SELECT 1 FROM follows WHERE follower_user_id = ? AND following_user_id = ?`).get(followerUserId, followingUserId);
  },
  followBusiness(followerUserId, businessId) {
    sqlite.prepare(`
      INSERT OR IGNORE INTO business_follows (follower_user_id, business_id, created_at)
      VALUES (?, ?, ?)
    `).run(followerUserId, businessId, new Date().toISOString());
  },
  unfollowBusiness(followerUserId, businessId) {
    sqlite.prepare(`DELETE FROM business_follows WHERE follower_user_id = ? AND business_id = ?`).run(followerUserId, businessId);
  },
  isFollowingBusiness(followerUserId, businessId) {
    return !!sqlite.prepare(`SELECT 1 FROM business_follows WHERE follower_user_id = ? AND business_id = ?`).get(followerUserId, businessId);
  },
  getBusinessFollowerCount(businessId) {
    const row = sqlite.prepare(`SELECT COUNT(*) AS count FROM business_follows WHERE business_id = ?`).get(businessId) as { count: number } | undefined;
    return row?.count ?? 0;
  },
  getFollowedBusinessesList(userId) {
    const rows = sqlite.prepare(`
      SELECT b.id, b.name, b.type, b.neighborhood, b.image_url AS imageUrl,
             bf.created_at AS followedAt
      FROM business_follows bf
      JOIN businesses b ON b.id = bf.business_id
      WHERE bf.follower_user_id = ? AND b.active = 1
      ORDER BY bf.created_at DESC
    `).all(userId) as Array<{
      id: number;
      name: string;
      type: string;
      neighborhood: string | null;
      imageUrl: string | null;
      followedAt: string;
    }>;
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type || "venue",
      neighborhood: row.neighborhood ?? null,
      imageUrl: row.imageUrl ?? null,
      isFollowing: true,
      followerCount: storage.getBusinessFollowerCount(row.id),
    }));
  },
  getFollowingList(userId, viewerUserId) {
    if (storage.isFollowAllDefault()) {
      // Soft-launch: everyone you're not unfollowed
      const rows = sqlite.prepare(`
        SELECT u.id, u.username, u.display_name AS displayName, u.photo_url AS photoUrl,
               u.avatar_choice AS avatarChoice, u.avatar_ring AS avatarRing, u.bio,
               u.location, u.promoter_status AS promoterStatus
        FROM users u
        WHERE u.status = 'active'
          AND u.id != ?
          AND NOT EXISTS (
            SELECT 1 FROM follow_blocks fb
            WHERE fb.blocker_user_id = ? AND fb.blocked_user_id = u.id
          )
        ORDER BY u.display_name COLLATE NOCASE, u.username COLLATE NOCASE
      `).all(userId, userId) as any[];
      return rows
        .filter((row) => !isGuideSystemUsername(row.username))
        .map((row) => storage.buildPeopleHubUser(row, viewerUserId));
    }
    const rows = sqlite.prepare(`
      SELECT u.id, u.username, u.display_name AS displayName, u.photo_url AS photoUrl,
             u.avatar_choice AS avatarChoice, u.avatar_ring AS avatarRing, u.bio,
             u.location, u.promoter_status AS promoterStatus
      FROM follows f
      JOIN users u ON u.id = f.following_user_id
      WHERE f.follower_user_id = ? AND u.status = 'active'
      ORDER BY f.created_at DESC
    `).all(userId) as any[];
    return rows
      .filter((row) => !isGuideSystemUsername(row.username))
      .map((row) => storage.buildPeopleHubUser(row, viewerUserId));
  },
  getFollowersList(userId, viewerUserId) {
    if (storage.isFollowAllDefault()) {
      const rows = sqlite.prepare(`
        SELECT u.id, u.username, u.display_name AS displayName, u.photo_url AS photoUrl,
               u.avatar_choice AS avatarChoice, u.avatar_ring AS avatarRing, u.bio,
               u.location, u.promoter_status AS promoterStatus
        FROM users u
        WHERE u.status = 'active'
          AND u.id != ?
          AND NOT EXISTS (
            SELECT 1 FROM follow_blocks fb
            WHERE fb.blocker_user_id = u.id AND fb.blocked_user_id = ?
          )
        ORDER BY u.display_name COLLATE NOCASE, u.username COLLATE NOCASE
      `).all(userId, userId) as any[];
      return rows
        .filter((row) => !isGuideSystemUsername(row.username))
        .map((row) => storage.buildPeopleHubUser(row, viewerUserId));
    }
    const rows = sqlite.prepare(`
      SELECT u.id, u.username, u.display_name AS displayName, u.photo_url AS photoUrl,
             u.avatar_choice AS avatarChoice, u.avatar_ring AS avatarRing, u.bio,
             u.location, u.promoter_status AS promoterStatus
      FROM follows f
      JOIN users u ON u.id = f.follower_user_id
      WHERE f.following_user_id = ? AND u.status = 'active'
      ORDER BY f.created_at DESC
    `).all(userId) as any[];
    return rows
      .filter((row) => !isGuideSystemUsername(row.username))
      .map((row) => storage.buildPeopleHubUser(row, viewerUserId));
  },
  discoverPeople(viewerUserId, limit = 24) {
    // Soft-launch: who-to-follow = people you unfollowed (easy re-follow) + new hosts not yet "seen"
    if (storage.isFollowAllDefault()) {
      const rows = sqlite.prepare(`
        SELECT u.id, u.username, u.display_name AS displayName, u.photo_url AS photoUrl,
               u.avatar_choice AS avatarChoice, u.avatar_ring AS avatarRing, u.bio,
               u.location, u.promoter_status AS promoterStatus
        FROM users u
        WHERE u.status = 'active'
          AND u.id != ?
          AND EXISTS (
            SELECT 1 FROM follow_blocks fb
            WHERE fb.blocker_user_id = ? AND fb.blocked_user_id = u.id
          )
        ORDER BY u.created_at DESC
        LIMIT ?
      `).all(viewerUserId, viewerUserId, limit) as any[];
      return rows
        .filter((row) => !isGuideSystemUsername(row.username))
        .map((row) => storage.buildPeopleHubUser(row, viewerUserId));
    }
    const rows = sqlite.prepare(`
      SELECT u.id, u.username, u.display_name AS displayName, u.photo_url AS photoUrl,
             u.avatar_choice AS avatarChoice, u.avatar_ring AS avatarRing, u.bio,
             u.location, u.promoter_status AS promoterStatus
      FROM users u
      WHERE u.status = 'active'
        AND u.id != ?
        AND u.id NOT IN (
          SELECT following_user_id FROM follows WHERE follower_user_id = ?
        )
        AND (
          u.promoter_status = 'approved'
          OR EXISTS (
            SELECT 1 FROM event_hosts eh
            JOIN events e ON e.id = eh.event_id
            WHERE eh.user_id = u.id AND e.status = 'LIVE'
          )
        )
      ORDER BY
        (SELECT COUNT(*) FROM follows WHERE following_user_id = u.id) DESC,
        u.created_at DESC
      LIMIT ?
    `).all(viewerUserId, viewerUserId, limit) as any[];
    return rows
      .filter((row) => !isGuideSystemUsername(row.username))
      .map((row) => storage.buildPeopleHubUser(row, viewerUserId));
  },
  buildPeopleHubUser(row, viewerUserId) {
    const hosting = storage.countEventsHostedByUser(row.id);
    const verifiedHost = row.promoterStatus === "approved";
    const subtitleParts: string[] = [];
    if (verifiedHost) subtitleParts.push("Verified host");
    else if (hosting > 0) subtitleParts.push(hosting === 1 ? "1 event" : `${hosting} events`);
    if (row.location?.trim()) subtitleParts.push(String(row.location).trim());
    const bioSnippet = row.bio?.trim() ? String(row.bio).trim().slice(0, 120) : null;
    return {
      id: row.id,
      username: row.username,
      displayName: row.displayName ?? null,
      photoUrl: row.photoUrl ?? null,
      avatarChoice: row.avatarChoice ?? 1,
      avatarRing: row.avatarRing || "none",
      bio: bioSnippet,
      verifiedHost,
      followers: storage.getFollowerCount(row.id),
      isFollowing: viewerUserId != null ? storage.isFollowing(viewerUserId, row.id) : false,
      subtitle: subtitleParts.length > 0 ? subtitleParts.join(" · ") : null,
    };
  },
  countEventsHostedByUser(userId) {
    const row = sqlite.prepare(`
      SELECT COUNT(*) AS count
      FROM event_hosts eh
      JOIN events e ON e.id = eh.event_id
      WHERE eh.user_id = ? AND e.status = 'LIVE'
    `).get(userId) as { count: number } | undefined;
    return row?.count ?? 0;
  },
  getPublicProfile(username, viewerUserId = null, viewerIsAdmin = false) {
    let user = storage.getUserByUsername(username);
    if (!user) return undefined;
    // Auto-lift timed suspend/shadow so profile status stays accurate.
    if (user.status === "suspended" || user.shadowBanned) {
      user = storage.clearExpiredAccountModeration(user.id) || user;
    }
    if (user.status === "deleted") return undefined;
    if (user.status === "suspended") {
      // Suspended profiles are not public; owner/admin can still open for moderation.
      const isOwner = viewerUserId != null && viewerUserId === user.id;
      if (!isOwner && !viewerIsAdmin) return undefined;
    }
    const isOwner = viewerUserId != null && viewerUserId === user.id;
    // Shadow ban: hidden from everyone except self + admins.
    if (user.shadowBanned && !isOwner && !viewerIsAdmin) {
      const untilOk = !user.shadowBanUntil || Date.parse(user.shadowBanUntil) > Date.now();
      if (untilOk) return undefined;
    }
    const verifiedHost = user.promoterStatus === "approved";

    const talentByEvent = storage.getEventTalentByUser(user.id);
    const roles: string[] = [];
    for (const entry of Object.values(talentByEvent)) {
      if (entry.status !== "LIVE") continue;
      for (const role of entry.roles) {
        const label = EVENT_TALENT_ROLE_LABELS[role];
        if (label && !roles.includes(label)) roles.push(label);
      }
    }

    const hostedEventsAll = sqlite.prepare(`
      SELECT e.id, e.title, e.venue_name AS venueName, e.day_of_week AS dayOfWeek,
             e.date_start AS dateStart, e.date_end AS dateEnd, e.admission, e.ticket_url AS ticketUrl,
             e.poster_image_url AS posterImageUrl, e.neighborhood AS neighborhood
      FROM event_hosts eh
      JOIN events e ON e.id = eh.event_id
      WHERE eh.user_id = ? AND e.status = 'LIVE'
      ORDER BY e.date_start ASC
    `).all(user.id) as any[];
    const nowMs = Date.now();
    const isPastEvent = (e: { dateEnd: string }) => {
      const endMs = parsePacificDateTime(e.dateEnd);
      return endMs != null && endMs < nowMs;
    };
    const hostedUpcoming = hostedEventsAll.filter(e => !isPastEvent(e));
    const hostedPastRaw = hostedEventsAll.filter(isPastEvent);
    // Full archive for @tucker_pdmax; flyer-credit subset (DJ+Host) for @brohoejams.
    const hostedPast = mergeTuckerHostedArchivePast(user.username, hostedPastRaw);
    if ((hostedUpcoming.length + hostedPast.length) > 0 && !roles.includes("Party Host")) {
      roles.push("Party Host");
    }
    // Archive flyer DJ credits for Bro Hoe even when nights aren't in event_talent.
    if (
      user.username.trim().toLowerCase() === "brohoejams" &&
      hostedPast.some(e => e.id < 0) &&
      !roles.includes("DJ")
    ) {
      roles.push("DJ");
    }

    const gigRows = storage.getGigPostsByUser(user.id).filter(gig => gig.status === "LIVE");
    const HIDDEN_GIFTING_STATUSES = new Set(["REMOVED", "REJECTED", "PENDING", "EXPIRED"]);
    const giftingRows = storage.getGiftingPostsByUser(user.id)
      .filter((post: any) => !HIDDEN_GIFTING_STATUSES.has(String(post.status)));
    // Missed connections stay anonymous: never list them on public profiles
    // (even for the owner). Authors manage theirs via /spotted and dashboard.
    const hubRows = storage.getHubFeedPostsByUser(user.id, 30)
      .filter((post: any) => post.status === "LIVE" && String(post.audience || "ALL").toUpperCase() === "ALL");

    const gigLikeCounts = bulkContentLikeCounts("GIG", gigRows.map(g => g.id));
    const giftLikeCounts = bulkContentLikeCounts("GIFTING", giftingRows.map((g: any) => g.id));
    const hubLikeCounts = bulkContentLikeCounts("HUB", hubRows.map((h: any) => h.id));
    const gigReplyCounts = bulkContentReplyCounts("GIG", gigRows.map(g => g.id));
    const hubReplyCounts = bulkContentReplyCounts("HUB", hubRows.map((h: any) => h.id));
    // GIFTING: interests (not public replies).
    const giftReplyCounts = bulkGiftingInterestCounts(giftingRows.map((g: any) => g.id));

    const gigs = gigRows.map(gig => ({
      id: gig.id,
      title: gig.title,
      venueText: gig.location || null,
      compensation: gig.compensation || null,
      status: gig.status,
      createdAt: gig.createdAt,
      description: gig.description,
      likes: gigLikeCounts.get(gig.id) ?? 0,
      replies: gigReplyCounts.get(gig.id) ?? 0,
    }));
    const gifting = giftingRows.map((post: any) => ({
      id: post.id,
      title: post.title,
      neighborhood: post.neighborhood,
      createdAt: post.createdAt ?? post.created_at,
      description: post.description,
      likes: giftLikeCounts.get(post.id) ?? 0,
      replies: giftReplyCounts.get(post.id) ?? 0,
    }));

    // Profile Updates rail: gigs + gifting + public hub posts (no spotted).
    const boardPosts = [
      ...gigs.map(g => ({
        id: g.id,
        board: "Gigz",
        contentType: "GIG" as const,
        color: "var(--board-gigs)",
        where: g.venueText || "Portland",
        title: g.title,
        text: g.description || g.title,
        createdAt: g.createdAt ?? null,
        likes: g.likes,
        replies: g.replies,
      })),
      ...gifting.map(g => ({
        id: g.id,
        board: "GifZ",
        contentType: "GIFTING" as const,
        color: "var(--board-gifting)",
        where: g.neighborhood || "Portland",
        title: g.title,
        text: g.description || g.title,
        createdAt: g.createdAt ?? null,
        likes: g.likes,
        replies: g.replies,
      })),
      ...hubRows.map((h: any) => ({
        id: h.id,
        board: "Updates",
        contentType: "HUB" as const,
        color: "var(--neon-cyan)",
        where: "Hub",
        text: String(h.body || "").trim() || (h.photoUrl ? "Shared a photo" : "Update"),
        createdAt: h.createdAt ?? h.created_at ?? null,
        likes: hubLikeCounts.get(h.id) ?? 0,
        replies: hubReplyCounts.get(h.id) ?? 0,
      })),
    ].sort((a, b) => {
      const ta = a.createdAt ? Date.parse(String(a.createdAt)) : 0;
      const tb = b.createdAt ? Date.parse(String(b.createdAt)) : 0;
      return tb - ta;
    });

    const attendedAll = sqlite.prepare(`
      SELECT e.id, e.title, e.venue_name AS venueName, e.day_of_week AS dayOfWeek,
             e.date_start AS dateStart, e.date_end AS dateEnd, e.admission,
             e.poster_image_url AS posterImageUrl, e.neighborhood AS neighborhood,
             e.ticket_url AS ticketUrl
      FROM attendances a
      JOIN events e ON e.id = a.event_id
      WHERE a.user_id = ? AND a.is_active = 1 AND COALESCE(e.status, 'LIVE') != 'DELETED'
      ORDER BY e.date_start ASC
    `).all(user.id) as any[];
    // One authoritative set drives the profile rail and its counters. Closing an
    // event must not erase a legitimate attendance; only removed events disappear.
    const checkIns = attendedAll.length;
    const attendedPastLive = attendedAll.filter(isPastEvent);
    // Host nights Tucker archived are nights he ran and was there - surface in
    // both hosting.past and attended past without inventing fake RSVP rows.
    const attendedPast = mergeTuckerHostedArchivePast(user.username, attendedPastLive);
    // Public Going rail: upcoming RSVPs are visible on member profiles.
    // (Previously owner-only, which left the design's Going panel empty for everyone else.)
    const goingToUpcoming = attendedAll.filter(e => !isPastEvent(e));

    const socialLinksRaw = safeJson(user.socialLinks || "{}");
    const activity: any = {
      hostedEvents: hostedUpcoming,
      hostedEventsPast: hostedPast,
      gigs,
      gifting,
      // Always empty - missed connections must not de-anonymize on profiles.
      spotted: [],
      goingTo: goingToUpcoming,
      attendedPast,
    };

    const ownedBusinesses = storage.getUserOwnedBusinesses(user.id);
    const affiliatedVenueIds: number[] = safeJson(user.affiliatedVenueIds || "[]");
    const affiliatedVenues = affiliatedVenueIds
      .map(id => storage.getBusiness(id))
      .filter((b): b is Business => !!b)
      .map(b => ({ id: b.id, name: b.name, type: b.type }));

    return {
      username: user.username,
      displayName: user.displayName,
      pronouns: user.pronouns || null,
      location: user.location || null,
      bio: user.bio,
      photoUrl: user.photoUrl,
      avatarChoice: user.avatarChoice ?? 1,
      avatarRing: user.avatarRing || "none",
      avatarCrop: user.avatarCrop || null,
      memberSince: user.createdAt,
      verifiedHost,
      showPromoterVariant: verifiedHost,
      roles,
      talents: safeJson(user.talents || "[]"),
      standFor: verifiedHost ? safeJson(user.standFor || "[]") : [],
      affiliatedVenues,
      ownedBusiness: ownedBusinesses[0] || null,
      accentColor: user.accentColor || null,
      banner: user.banner || DEFAULT_PROFILE_BANNER,
      coverImageUrl: user.coverImageUrl || null,
      coverCrop: user.coverCrop || null,
      marquee: verifiedHost ? safeJsonOrNull(user.marquee) : null,
      top8: resolveProfileTop8(user.top8),
      pup: !verifiedHost ? safeJsonOrNull(user.pup) : null,
      packmates: !verifiedHost ? storage.getPackLinks(user.id, "packmate") : [],
      handlers: !verifiedHost ? storage.getPackLinks(user.id, "handler") : [],
      media: storage.getProfileMedia(user.id),
      socialLinks: socialLinksRaw && typeof socialLinksRaw === "object" && !Array.isArray(socialLinksRaw) ? socialLinksRaw : {},
      profileEmbeds: safeJson(user.profileEmbeds || "[]"),
      profilePhotos: safeJson(user.profilePhotos || "[]"),
      stats: {
        events: hostedUpcoming.length + hostedPast.length,
        hosting: hostedUpcoming.length,
        going: goingToUpcoming.length,
        posts: boardPosts.length,
        gigs: gigs.length,
        gifting: gifting.length,
        checkIns,
        followers: storage.getFollowerCount(user.id),
      },
      isOwner,
      isAdmin: storage.userIsSiteAdmin(user),
      isSiteOwner: storage.isPrimarySiteOwner(user),
      viewerIsAdmin: !!viewerIsAdmin && !isOwner,
      isFollowing: viewerUserId != null && !isOwner ? storage.isFollowing(viewerUserId, user.id) : false,
      blockStatus: viewerUserId != null && !isOwner
        ? storage.getMemberBlockStatus(viewerUserId, user.id)
        : { blockedByViewer: false, blockedViewer: false, interactionBlocked: false },
      activity,
      boardPosts,
      linkedVenues: storage.getUserLinkedBusinesses(user.id),
      // Admin-only moderation surface (also useful if owner is viewing own suspend state via gate)
      accountStatus: user.status || "active",
      suspendReasonCode: user.suspendReasonCode || null,
      suspendReasonLabel: user.suspendReasonLabel || null,
      suspendNote: user.suspendNote || null,
      suspendUntil: user.suspendUntil || null,
      suspendedAt: user.suspendedAt || null,
      ...(viewerIsAdmin
        ? {
            shadowBanned: !!user.shadowBanned,
            shadowBanReasonCode: user.shadowBanReasonCode || null,
            shadowBanReasonLabel: user.shadowBanReasonLabel || null,
            shadowBanUntil: user.shadowBanUntil || null,
          }
        : {}),
    };
  },
  rejectUserProfilePhoto(username, reasonCode, note) {
    const user = storage.getUserByUsername(String(username || "").trim().replace(/^@/, ""));
    if (!user || user.status === "deleted") return { error: "User not found" };
    if (!user.photoUrl) return { error: "No profile photo" };
    storage.updateUser(user.id, { photoUrl: null, avatarCrop: null });
    notifyProfilePhotoReject(user.id, reasonCode, note);
    return { ok: true };
  },
  getPackLinks(userId, relation) {
    const rows = sqlite.prepare(`
      SELECT u.id, u.username, u.display_name AS displayName, u.avatar_choice AS avatarChoice,
             u.avatar_ring AS avatarRing, u.photo_url AS photoUrl
      FROM pack_links pl
      JOIN users u ON u.id = pl.linked_user_id
      WHERE pl.user_id = ? AND pl.relation = ? AND u.status = 'active'
      ORDER BY pl.created_at ASC
    `).all(userId, relation) as any[];
    return rows.map(r => ({
      id: r.id, username: r.username, displayName: r.displayName ?? null,
      avatarChoice: r.avatarChoice ?? 1, avatarRing: r.avatarRing || "none", photoUrl: r.photoUrl ?? null,
    }));
  },
  addPackLink(userId, relation, targetUsername) {
    const target = storage.getUserByUsername(targetUsername.replace(/^@/, "").trim());
    if (!target || target.status !== "active") return { error: "That member could not be found." };
    if (target.id === userId) return { error: "You can't link yourself." };
    try {
      sqlite.prepare(`
        INSERT INTO pack_links (user_id, linked_user_id, relation, created_at)
        VALUES (?, ?, ?, ?)
      `).run(userId, target.id, relation, new Date().toISOString());
      return { ok: true };
    } catch (e: any) {
      if (String(e?.message || "").includes("UNIQUE")) return { error: "Already added." };
      return { error: "Could not add link." };
    }
  },
  removePackLink(userId, relation, linkedUserId) {
    sqlite.prepare(`DELETE FROM pack_links WHERE user_id = ? AND relation = ? AND linked_user_id = ?`)
      .run(userId, relation, linkedUserId);
  },
  getProfileMedia(userId) {
    const media = sqlite.prepare(`SELECT * FROM profile_media WHERE user_id = ?`).get(userId) as any;
    if (media) {
      const items = sqlite.prepare(`
        SELECT id, label, title, meta, audio_url AS audioUrl, is_embed AS isEmbed
        FROM profile_media_items WHERE media_id = ? ORDER BY sort_order ASC, id ASC
      `).all(media.id) as any[];
      return {
        kind: media.kind,
        title: media.title,
        tag: media.tag ?? null,
        cadence: media.cadence ?? null,
        blurb: media.blurb ?? null,
        coverUrl: media.cover_url ?? null,
        platformLinks: safeJson(media.platform_links || "[]"),
        items: items.map(it => ({ ...it, isEmbed: !!it.isEmbed })),
      };
    }
    // Legacy fallback: synthesize a media card from SoundCloud embeds so
    // existing promoters' sets don't vanish before they set up the new model.
    const user = storage.getUserById(userId);
    const embeds = safeJson(user?.profileEmbeds || "[]") as Array<{ id: string; src: string; title: string }>;
    if (!user || embeds.length === 0) return null;
    return {
      kind: user.promoterStatus === "approved" ? "podcast" : "playlist",
      title: "My tracks",
      tag: null,
      cadence: null,
      blurb: null,
      coverUrl: null,
      platformLinks: [],
      items: embeds.map(e => ({ id: e.id, label: null, title: e.title, meta: null, audioUrl: e.src, isEmbed: true })),
    };
  },
  saveProfileMedia(userId, data) {
    const now = new Date().toISOString();
    const existing = sqlite.prepare(`SELECT id FROM profile_media WHERE user_id = ?`).get(userId) as { id: number } | undefined;
    let mediaId: number;
    if (existing) {
      sqlite.prepare(`
        UPDATE profile_media SET kind = ?, title = ?, tag = ?, cadence = ?, blurb = ?, cover_url = ?,
          platform_links = ?, updated_at = ? WHERE id = ?
      `).run(data.kind, data.title, data.tag ?? null, data.cadence ?? null, data.blurb ?? null,
        data.coverUrl ?? null, JSON.stringify(data.platformLinks || []), now, existing.id);
      mediaId = existing.id;
      sqlite.prepare(`DELETE FROM profile_media_items WHERE media_id = ?`).run(mediaId);
    } else {
      const result = sqlite.prepare(`
        INSERT INTO profile_media (user_id, kind, title, tag, cadence, blurb, cover_url, platform_links, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(userId, data.kind, data.title, data.tag ?? null, data.cadence ?? null, data.blurb ?? null,
        data.coverUrl ?? null, JSON.stringify(data.platformLinks || []), now, now);
      mediaId = Number(result.lastInsertRowid);
    }
    const items = (data.items || []).slice(0, 30);
    items.forEach((item: any, i: number) => {
      sqlite.prepare(`
        INSERT INTO profile_media_items (media_id, sort_order, label, title, meta, audio_url, is_embed, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(mediaId, i, item.label ?? null, item.title, item.meta ?? null, item.audioUrl, item.isEmbed ? 1 : 0, now);
    });
    return storage.getProfileMedia(userId);
  },
  countActiveMessages() {
    const row = sqlite.prepare(`
      SELECT COUNT(*) AS count FROM messages
      WHERE deleted_by_from = 0 AND deleted_by_to = 0
    `).get() as { count: number };
    return row?.count ?? 0;
  },
  purgeQaTestUsers() {
    const targets = db.select().from(users).all().filter((u: User) => {
      if (isEnvListedSiteAdmin(u) || storage.hasSiteAdminGrant(u.id)) return false;
      const email = String(u.email || "").toLowerCase();
      const username = String(u.username || "").toLowerCase();
      return email.includes("testmail.local")
        || email.includes("+qa")
        || username.startsWith("qa_")
        || username.endsWith("_qa");
    });
    const deleted: string[] = [];
    for (const user of targets) {
      const userId = user.id;
      const email = user.email;
      sqlite.prepare(`DELETE FROM gig_posts WHERE user_id = ?`).run(userId);
      sqlite.prepare(`DELETE FROM gifting_interests WHERE user_id = ?`).run(userId);
      sqlite.prepare(`DELETE FROM gifting_posts WHERE user_id = ?`).run(userId);
      sqlite.prepare(`DELETE FROM missed_connections WHERE user_id = ?`).run(userId);
      sqlite.prepare(`DELETE FROM attendances WHERE user_id = ?`).run(userId);
      sqlite.prepare(`DELETE FROM event_talent WHERE user_id = ?`).run(userId);
      sqlite.prepare(`DELETE FROM event_hosts WHERE user_id = ?`).run(userId);
      sqlite.prepare(`DELETE FROM messages WHERE from_user_id = ? OR to_user_id = ?`).run(userId, userId);
      sqlite.prepare(`DELETE FROM users WHERE id = ?`).run(userId);
      sqlite.prepare(`DELETE FROM submissions WHERE submitter_email = ?`).run(email);
      deleted.push(user.username);
    }
    return { deleted: deleted.length, usernames: deleted };
  },
  autoApproveClaim(id: number, claimedByUsername: string) {
    const sub = db.select().from(submissions).where(eq(submissions.id, id)).get();
    if (!sub || sub.type !== "CLAIM" || !sub.eventId) return;
    const now = new Date().toISOString();
    db.update(submissions).set({
      status: "APPROVED",
      approvals: JSON.stringify([claimedByUsername]),
      adminNotes: `Auto-approved: @${claimedByUsername} is a verified promoter, no manual review required.`,
    }).where(eq(submissions.id, id)).run();
    db.update(events).set({
      isClaimable: false,
      claimedBy: claimedByUsername,
      adminNotes: null,
    }).where(eq(events.id, sub.eventId)).run();
    const submitter = db.select().from(users).where(eq(users.email, sub.submitterEmail)).get();
    if (submitter) {
      if (submitter.promoterStatus !== "approved") {
        db.update(users).set({ promoterStatus: "approved" }).where(eq(users.id, submitter.id)).run();
      }
      storage.setPrimaryEventHost(sub.eventId, submitter.id, null);
    }
  },
  autoApproveSubmission(id, claimedByUsername) {
    const sub = db.select().from(submissions).where(eq(submissions.id, id)).get();
    if (!sub || sub.type !== "NEW_EVENT") return;
    const directoryRows = db.select().from(businesses).all().filter(b => b.active);
    const coords = mergeMapCoordinates({
      venueName: sub.venueName,
      address: sub.address,
      lat: sub.lat,
      lng: sub.lng,
    }, directoryRows);
    db.update(submissions).set({ status: "APPROVED", approvals: JSON.stringify([claimedByUsername]) }).where(eq(submissions.id, id)).run();
    const nowIso = new Date().toISOString();
    const created = db.insert(events).values({
      title: sub.title, description: sub.description,
      venueName: sub.venueName, address: sub.address,
      neighborhood: sub.neighborhood, lat: coords.lat, lng: coords.lng,
      dateStart: sub.dateStart, dateEnd: sub.dateEnd, dayOfWeek: sub.dayOfWeek,
      ageRequirement: sub.ageRequirement, eventTypes: sub.eventTypes,
      admission: sub.admission, ticketUrl: sub.ticketUrl,
      isPublic: sub.isPublic, isPrivate: sub.isPrivate,
      isHouseParty: sub.isHouseParty, isSexPositive: sub.isSexPositive,
      nudityOk: sub.nudityOk, posterImageUrl: sub.posterImageUrl,
      status: "LIVE", source: "user_submitted",
      isClaimable: false, claimedBy: claimedByUsername,
      submittedBy: sub.submitterEmail, adminNotes: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    }).returning().get();
    const submitter = db.select().from(users).where(eq(users.email, sub.submitterEmail)).get();
    if (created && submitter) {
      if (submitter.promoterStatus === "pending") {
        db.update(users).set({ promoterStatus: "approved" }).where(eq(users.id, submitter.id)).run();
      }
      storage.setPrimaryEventHost(created.id, submitter.id, null);
    }
  },
  approveSubmission(id, adminName) {
    const sub = db.select().from(submissions).where(eq(submissions.id, id)).get();
    if (!sub) return undefined;
    let approvalList: string[] = [];
    try {
      const parsed = JSON.parse(sub.approvals || "[]");
      approvalList = Array.isArray(parsed) ? parsed : [];
    } catch {
      approvalList = [];
    }
    if (!approvalList.includes(adminName)) approvalList.push(adminName);
    const newStatus = approvalList.length >= 1 ? "APPROVED" : "PENDING";
    db.update(submissions).set({ approvals: JSON.stringify(approvalList), status: newStatus }).where(eq(submissions.id, id)).run();
    if (newStatus === "APPROVED") {
      const submitter = db.select().from(users).where(eq(users.email, sub.submitterEmail)).get();

      if (sub.type === "PROMOTER_APPLICATION") {
        // Standalone promoter application - approve user, no event created
        if (submitter) db.update(users).set({ promoterStatus: "approved" }).where(eq(users.id, submitter.id)).run();
      } else if (sub.type === "CLAIM" && sub.eventId) {
        db.update(events).set({
          isClaimable: false,
          claimedBy: submitter?.username || sub.submitterEmail,
          adminNotes: null,
          updatedAt: new Date().toISOString(),
        }).where(eq(events.id, sub.eventId)).run();
        if (submitter) {
          db.update(users).set({ promoterStatus: "approved" }).where(eq(users.id, submitter.id)).run();
          storage.setPrimaryEventHost(sub.eventId, submitter.id, null);
        }
      } else if (sub.type === "SUGGEST") {
        const directoryRows = db.select().from(businesses).all().filter(b => b.active);
        const coords = mergeMapCoordinates({
          venueName: sub.venueName,
          address: sub.address,
          lat: sub.lat,
          lng: sub.lng,
        }, directoryRows);
        // Community tip - goes live as unclaimed (anyone can claim it later)
        const tipNow = new Date().toISOString();
        db.insert(events).values({
          title: sub.title, description: sub.description,
          venueName: sub.venueName, address: sub.address,
          neighborhood: sub.neighborhood, lat: coords.lat, lng: coords.lng,
          dateStart: sub.dateStart, dateEnd: sub.dateEnd, dayOfWeek: sub.dayOfWeek,
          ageRequirement: sub.ageRequirement, eventTypes: sub.eventTypes,
          admission: sub.admission, ticketUrl: sub.ticketUrl,
          isPublic: sub.isPublic, isPrivate: sub.isPrivate,
          isHouseParty: sub.isHouseParty, isSexPositive: sub.isSexPositive,
          nudityOk: sub.nudityOk, posterImageUrl: sub.posterImageUrl,
          status: "LIVE", source: "community_tip",
          isClaimable: true, claimedBy: null,
          submittedBy: sub.submitterEmail, adminNotes: null,
          createdAt: tipNow,
          updatedAt: tipNow,
        }).run();
      } else {
        const directoryRows = db.select().from(businesses).all().filter(b => b.active);
        const coords = mergeMapCoordinates({
          venueName: sub.venueName,
          address: sub.address,
          lat: sub.lat,
          lng: sub.lng,
        }, directoryRows);
        // NEW_EVENT - create event, and if user was pending promoter, approve them too
        const newNow = new Date().toISOString();
        const created = db.insert(events).values({
          title: sub.title, description: sub.description,
          venueName: sub.venueName, address: sub.address,
          neighborhood: sub.neighborhood, lat: coords.lat, lng: coords.lng,
          dateStart: sub.dateStart, dateEnd: sub.dateEnd, dayOfWeek: sub.dayOfWeek,
          ageRequirement: sub.ageRequirement, eventTypes: sub.eventTypes,
          admission: sub.admission, ticketUrl: sub.ticketUrl,
          isPublic: sub.isPublic, isPrivate: sub.isPrivate,
          isHouseParty: sub.isHouseParty, isSexPositive: sub.isSexPositive,
          nudityOk: sub.nudityOk, posterImageUrl: sub.posterImageUrl,
          status: "LIVE", source: "user_submitted",
          isClaimable: false, claimedBy: submitter?.username || null,
          submittedBy: sub.submitterEmail, adminNotes: null,
          createdAt: newNow,
          updatedAt: newNow,
        }).returning().get();
        if (submitter) {
          if (submitter.promoterStatus === "pending") {
            db.update(users).set({ promoterStatus: "approved" }).where(eq(users.id, submitter.id)).run();
          }
          storage.setPrimaryEventHost(created.id, submitter.id, null);
        }
      }
      notifySubmissionOutcome(sub, true);
    }
    return db.select().from(submissions).where(eq(submissions.id, id)).get();
  },
  mergeSubmissionIntoEvent(id, eventId, adminName) {
    const sub = db.select().from(submissions).where(eq(submissions.id, id)).get();
    if (!sub) return { error: "Submission not found" };
    if (sub.status !== "PENDING") return { error: "Submission is not pending" };
    if (sub.type !== "NEW_EVENT" && sub.type !== "SUGGEST") {
      return { error: "Only new event submissions can be merged" };
    }

    const existing = db.select().from(events).where(eq(events.id, eventId)).get();
    if (!existing) return { error: "Event not found" };
    if (existing.status !== "LIVE") return { error: "Only live events can receive a merge" };

    const patch = buildSubmissionMergePatch(existing, sub);
    const directoryRows = db.select().from(businesses).all().filter(b => b.active);
    const coords = mergeMapCoordinates({
      venueName: (patch.venueName as string | undefined) ?? existing.venueName,
      address: (patch.address as string | undefined) ?? existing.address,
      lat: existing.lat,
      lng: existing.lng,
    }, directoryRows);

    const submitter = db.select().from(users).where(eq(users.email, sub.submitterEmail)).get();
    const claimedBy = existing.claimedBy || submitter?.username || null;

    db.update(events).set({
      ...patch,
      lat: coords.lat,
      lng: coords.lng,
      isClaimable: false,
      claimedBy,
      submittedBy: existing.submittedBy || sub.submitterEmail,
      adminNotes: existing.adminNotes,
    } as any).where(eq(events.id, eventId)).run();

    db.update(submissions).set({
      status: "APPROVED",
      approvals: JSON.stringify([adminName]),
      adminNotes: `Merged into event #${eventId} (${existing.title}) by ${adminName}.`,
      eventId,
    }).where(eq(submissions.id, id)).run();

    if (submitter) {
      if (submitter.promoterStatus === "pending") {
        db.update(users).set({ promoterStatus: "approved" }).where(eq(users.id, submitter.id)).run();
      }
      storage.setPrimaryEventHost(eventId, submitter.id, null);
    }

    const updatedEvent = db.select().from(events).where(eq(events.id, eventId)).get()!;
    const updatedSub = db.select().from(submissions).where(eq(submissions.id, id)).get()!;
    notifySubmissionMerged(sub, updatedEvent.title);
    return { event: updatedEvent, submission: updatedSub };
  },
  rejectSubmission(id, reason) {
    const sub = db.select().from(submissions).where(eq(submissions.id, id)).get();
    db.update(submissions).set({ status: "REJECTED", adminNotes: reason }).where(eq(submissions.id, id)).run();
    if (sub?.type === "PROMOTER_APPLICATION") {
      const submitter = db.select().from(users).where(eq(users.email, sub.submitterEmail)).get();
      if (submitter?.promoterStatus === "pending") {
        db.update(users).set({ promoterStatus: "rejected" }).where(eq(users.id, submitter.id)).run();
      }
    }
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
      adminNotes: row.admin_notes ?? null,
      createdAt: row.created_at,
      userId: row.user_id,
      imageUrl: row.image_url,
      gigDate: row.gig_date,
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
      notifyBoardReject(userId, "GifZ", post.title, reasonCode, note, {
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
    notifyBoardReject(row.userId, "Mizzed Connection", row.title, reasonCode, note, {
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
      SELECT COUNT(*) AS cnt FROM content_likes WHERE content_type = ? AND content_id = ?
    `).get(type, contentId) as { cnt: number } | undefined;
    return Number(row?.cnt) || 0;
  },
  hasContentLike(contentType, contentId, userId) {
    ensureContentLikesSchema();
    const type = String(contentType || "").toUpperCase();
    if (!(CONTENT_LIKE_TYPES as readonly string[]).includes(type)) return false;
    return !!sqlite.prepare(`
      SELECT 1 FROM content_likes WHERE content_type = ? AND content_id = ? AND user_id = ?
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

    const already = storage.hasContentLike(type, id, userId);
    if (already) {
      sqlite.prepare(`
        DELETE FROM content_likes WHERE content_type = ? AND content_id = ? AND user_id = ?
      `).run(type, id, userId);
    } else {
      sqlite.prepare(`
        INSERT INTO content_likes (content_type, content_id, user_id, created_at)
        VALUES (?, ?, ?, ?)
      `).run(type, id, userId, new Date().toISOString());
    }
    const likes = storage.countContentLikes(type, id);
    return { liked: !already, likes };
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
        reject_gifting: "Rejected GifZ post",
        resolve_gifting_report: "Resolved GifZ report",
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
      { label: "GifZ", count: giftingPosts },
      { label: "Gigz", count: gigPosts },
      { label: "Mizzed Connection", count: missedConnections },
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
    const viewerCheckedIn = viewerUserId != null && rows.some((r: any) => r.userId === viewerUserId);
    return rows.map((r: any) => {
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

    const messages = rows.map(row => {
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
      members,
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
    return rows.map(row => ({
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
    return sqlite.prepare(`
      SELECT r.*, u.username, u.display_name AS displayName
      FROM beach_carpool_requests r
      JOIN users u ON u.id = r.user_id
      WHERE r.post_id = ? AND r.status = 'INTERESTED'
      ORDER BY r.created_at ASC
    `).all(postId);
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
        badge: post.postType === "ISO" ? "ISO" : "GifZ",
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
        action: gig.postType === "LOOKING_FOR_WORK" ? "Posted on Gigz" : "Posted a gig on Gigz",
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
        // Deep-link opens Gigz with this exact post expanded.
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
        badge: "Mizzed Connection",
        action: "New missed connection",
        title: subject,
        text: row.body || "",
        place,
        createdAt: row.createdAt,
        // Missed connections are anonymous - the card renders without a person.
        author: { displayName: "Mizzed Connection", anonymous: true },
        // No event embed: tapping opens the Mizzed Connection detail card
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
