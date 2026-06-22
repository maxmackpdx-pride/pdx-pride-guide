import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import {
  events, submissions, gigPosts, promoters, moderationRequests, attendances, users, messages, missedConnections,
  giftingPosts, giftingInterests, giftingReports, feedbackReports,
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
} from "@shared/schema";
import crypto from "crypto";

const sqlite = new Database("data.db");
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
`);

// Add new columns to gig_posts if not present (SQLite doesn't support IF NOT EXISTS on ALTER)
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
}
ensureGigPostsSchema();

try { sqlite.exec(`ALTER TABLE gig_posts ADD COLUMN user_id INTEGER`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE gig_posts ADD COLUMN image_url TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE gig_posts ADD COLUMN gig_date TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE gig_posts ADD COLUMN gig_time TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN photo_url TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE users ADD COLUMN google_id TEXT`); } catch(e) {}
try { sqlite.exec(`CREATE UNIQUE INDEX IF NOT EXISTS users_google_id_unique ON users(google_id)`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE attendances ADD COLUMN user_id INTEGER`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE attendances ADD COLUMN photo_url TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE attendances ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE messages ADD COLUMN context_type TEXT NOT NULL DEFAULT 'THREAD'`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE messages ADD COLUMN context_id INTEGER`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE messages ADD COLUMN context_label TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE messages ADD COLUMN deleted_by_from INTEGER NOT NULL DEFAULT 0`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE messages ADD COLUMN deleted_by_to INTEGER NOT NULL DEFAULT 0`); } catch(e) {}

export function hashPassword(pw: string) {
  return crypto.createHash("sha256").update(pw + "pdxpride_salt").digest("hex");
}

// Old fake event titles used to detect stale seed data
const OLD_SEED_TITLES = ["Queer Dance Party", "Leather Pride Social", "Drag Extravaganza", "Pride Brunch", "Kink & Community Fair", "Trans Joy Dance"];

function seedData() {
  const existing = db.select().from(events).all();

  // Force re-seed if old fake events, no lat/lng, no poster images, or event count too low (new events added)
  if (existing.length > 0) {
    const needsReseed = OLD_SEED_TITLES.includes(existing[0].title) || existing[0].lat === null || existing[0].posterImageUrl === null || existing.length < 46 || existing.some((e: any) => e.title === "Bearracuda Portland Pride Saturday" && e.address === "18 NW 3rd Ave, Portland, OR 97209");
    if (needsReseed) {
      sqlite.exec(`DELETE FROM events`);
      sqlite.exec(`DELETE FROM attendances`);
      sqlite.exec(`DELETE FROM gig_posts`);
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
      title: "Pride in Demand — Portland Queer Takeover",
      description: "Organized by DotGay. Queer superhero theme. Multi-day takeover event.",
      venueName: "Star Theater and Starlight Lounge",
      address: "13 NW 6th Ave, Portland, OR 97209",
      neighborhood: "Old Town",
      lat: 45.523204065035, lng: -122.676518408183,
      dateStart: "2026-07-17T21:00:00", dateEnd: "2026-07-18T23:59:00",
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
      admission: "TBD",
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
      posterImageUrl: null, status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "BOYeurism: Pride Spectacular",
      description: "An explosive celebration of queerness from IZOHNNY — Isaiah Esquire & Johnny Nuriel, the Goliaths of Glam. Drag, burlesque, circus, and dance. Internationally acclaimed, unapologetically queer, fiercely inclusive. Featuring legendary icons.",
      venueName: "Alberta Rose Theatre",
      address: "3000 NE Alberta St, Portland, OR 97211",
      neighborhood: "Alberta Arts District",
      lat: 45.5581, lng: -122.6478,
      dateStart: "2026-07-18T19:00:00", dateEnd: "2026-07-18T23:00:00",
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
      posterImageUrl: "/posters/transocial-hawks.png", status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
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
      posterImageUrl: "/posters/transocial-hawks.png", status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
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
      posterImageUrl: "/posters/transocial-hawks.png", status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
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
      ticketUrl: "https://portlandpride.org",
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
      posterImageUrl: null, status: "LIVE", source: "admin_seeded", isClaimable: true,
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
      posterImageUrl: "/posters/sports-bra-pride-block-party.jpg", status: "LIVE", source: "admin_seeded", isClaimable: true,
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
  db.insert(gigPosts).values({
    postType: "LOOKING_FOR_WORK", title: "Sound Tech & DJ Available Pride Weekend",
    name: "DJ Queerwave", contactEmail: "djqueerwave@example.com",
    description: "Portland-based DJ and sound tech. Experienced in queer nightlife, house, and techno. Available July 16–19. Hit me up!",
    skills: "DJ, Sound Tech, Lighting", compensation: "Negotiable", location: "Portland, OR",
    isRemote: false, status: "LIVE", createdAt: now,
  } as any).run();
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
    admission: "FREE",
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
    dateStart: "2026-07-16T17:00:00",
    dateEnd: "2026-07-19T20:00:00",
    dayOfWeek: "THU",
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
    eventTypes: JSON.stringify(["MARCH", "COMMUNITY", "FREE", "TRANS", "OFFICIAL"]),
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
      description = 'DotGay''s Pride in Demand Portland Queer Takeover at Star Theater. Confirmed Saturday July 18, 2026 at 9pm. Ticket range reported at $31-$134.',
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
      dateStart: "2026-07-17T17:00:00", dateEnd: "2026-07-17T20:00:00",
      dayOfWeek: "FRI",
      ageRequirement: "ALL_AGES",
      eventTypes: JSON.stringify(["MARCH", "COMMUNITY", "FREE", "OFFICIAL"]),
      admission: "FREE",
      ticketUrl: "https://portlandpride.org",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: null, status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: "Added from updated official PrideNW event info; route/start should be checked closer to date.", createdAt: now,
    }).run();
  }
}

seedData();
applyVerifiedEventOverrides();
removeGiftingSeedPosts();

function archiveExpiredMissedConnections() {
  const archiveAt = new Date("2026-07-21T00:00:00-07:00").getTime();
  if (Date.now() < archiveAt) return;
  sqlite.prepare(`UPDATE missed_connections SET status = 'ARCHIVED' WHERE status = 'ACTIVE'`).run();
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

export interface IStorage {
  // Events
  getEvents(filters?: { status?: string; day?: string }): Event[];
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
  // Promoters
  getPromoterByEmail(email: string): Promoter | undefined;
  createPromoter(data: InsertPromoter): Promoter;
  // Moderation requests
  getModerationRequests(status?: string): ModerationRequest[];
  createModerationRequest(data: InsertModerationRequest): ModerationRequest;
  resolveModerationRequest(id: number, status: "APPROVED" | "REJECTED", adminNotes?: string): void;
  // Attendance
  getAttendances(eventId: number): any[];
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
  updateUser(id: number, data: Partial<Pick<User, 'displayName' | 'avatarChoice' | 'bio' | 'photoUrl'>>): void;
  // Messages
  getInbox(userId: number): Message[];
  getSentMessages(userId: number): Message[];
  getUnreadCount(userId: number): number;
  sendMessage(fromUserId: number, toUserId: number, subject: string, body: string, opts?: { threadId?: string; contextType?: string; contextId?: number | null; contextLabel?: string | null }): Message;
  markRead(messageId: number): void;
  getThread(threadId: string): Message[];
  softDeleteThread(threadId: string, userId: number): void;
  // Missed connections
  getMissedConnections(status?: string): any[];
  getMissedConnectionsByUser(userId: number): MissedConnection[];
  createMissedConnection(data: InsertMissedConnection): MissedConnection;
  updateMissedConnection(id: number, userId: number, data: Partial<MissedConnection>): MissedConnection | undefined;
  deleteMissedConnection(id: number, userId: number): void;
  archiveExpiredMissedConnections(): void;
  // Gifting
  getGiftingPosts(opts?: { includeInactive?: boolean; status?: string; userId?: number }): any[];
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
  approveSubmission(id, adminName) {
    const sub = db.select().from(submissions).where(eq(submissions.id, id)).get();
    if (!sub) return undefined;
    const approvalList = JSON.parse(sub.approvals || "[]");
    if (!approvalList.includes(adminName)) approvalList.push(adminName);
    const newStatus = approvalList.length >= 2 ? "APPROVED" : "PENDING";
    db.update(submissions).set({ approvals: JSON.stringify(approvalList), status: newStatus }).where(eq(submissions.id, id)).run();
    if (newStatus === "APPROVED") {
      if (sub.type === "CLAIM" && sub.eventId) {
        const user = db.select().from(users).where(eq(users.email, sub.submitterEmail)).get();
        db.update(events).set({
          isClaimable: false,
          claimedBy: user?.username || sub.submitterEmail,
          adminNotes: null,
        }).where(eq(events.id, sub.eventId)).run();
      } else {
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
          isClaimable: false, claimedBy: null,
          submittedBy: sub.submitterEmail, adminNotes: null,
          createdAt: new Date().toISOString(),
        }).run();
      }
    }
    return db.select().from(submissions).where(eq(submissions.id, id)).get();
  },
  rejectSubmission(id, reason) {
    db.update(submissions).set({ status: "REJECTED", adminNotes: reason }).where(eq(submissions.id, id)).run();
  },
  getGigPosts(status) {
    ensureGigPostsSchema();
    const rows = db.select().from(gigPosts).all();
    if (status) return rows.filter(g => g.status === status);
    return rows;
  },
  createGigPost(data) {
    return db.insert(gigPosts).values({ ...data, status: "PENDING", createdAt: new Date().toISOString() }).returning().get();
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
  resolveModerationRequest(id, status, adminNotes) {
    db.update(moderationRequests).set({ status, adminNotes: adminNotes || null }).where(eq(moderationRequests.id, id)).run();
    if (status === "APPROVED") {
      const req = db.select().from(moderationRequests).where(eq(moderationRequests.id, id)).get();
      if (req?.type === "REMOVE") {
        db.update(events).set({ status: "REMOVED" }).where(eq(events.id, req.eventId)).run();
      }
    }
  },
  getAttendances(eventId) {
    return sqlite.prepare(`
      SELECT a.*, u.username, u.display_name AS displayName, u.photo_url AS userPhotoUrl, u.avatar_choice AS avatarChoice
      FROM attendances a
      LEFT JOIN users u ON u.id = a.user_id
      WHERE a.event_id = ? AND a.is_active = 1
      ORDER BY a.created_at DESC
    `).all(eventId) as any[];
  },
  getAttendancesByUser(userId) {
    return sqlite.prepare(`
      SELECT a.*, e.title AS eventTitle, e.venue_name AS venueName, e.date_start AS dateStart
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
  // Messages
  getInbox(userId) {
    return sqlite.prepare(`
      SELECT * FROM messages
      WHERE to_user_id = ? AND deleted_by_to = 0
      ORDER BY created_at DESC
    `).all(userId) as Message[];
  },
  getSentMessages(userId) {
    return sqlite.prepare(`
      SELECT * FROM messages
      WHERE from_user_id = ? AND deleted_by_from = 0
      ORDER BY created_at DESC
    `).all(userId) as Message[];
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
  getThread(threadId) {
    return sqlite.prepare(`SELECT * FROM messages WHERE thread_id = ? ORDER BY created_at ASC`).all(threadId) as Message[];
  },
  softDeleteThread(threadId, userId) {
    sqlite.prepare(`UPDATE messages SET deleted_by_from = 1 WHERE thread_id = ? AND from_user_id = ?`).run(threadId, userId);
    sqlite.prepare(`UPDATE messages SET deleted_by_to = 1 WHERE thread_id = ? AND to_user_id = ?`).run(threadId, userId);
  },
  archiveExpiredMissedConnections() {
    archiveExpiredMissedConnections();
  },
  getMissedConnections(status = "ACTIVE") {
    archiveExpiredMissedConnections();
    return sqlite.prepare(`
      SELECT m.*, u.username, u.display_name AS displayName, u.photo_url AS photoUrl, u.avatar_choice AS avatarChoice
      FROM missed_connections m
      JOIN users u ON u.id = m.user_id
      WHERE m.status = ?
      ORDER BY m.created_at DESC
    `).all(status) as any[];
  },
  getMissedConnectionsByUser(userId) {
    archiveExpiredMissedConnections();
    return db.select().from(missedConnections).where(eq(missedConnections.userId, userId)).all();
  },
  createMissedConnection(data) {
    return db.insert(missedConnections).values({ ...data, status: "ACTIVE", createdAt: new Date().toISOString() }).returning().get();
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
      where.push(`p.status IN ('OPEN','THREE_INTERESTED','POSTER_CHOOSING','PICKUP_PENDING','REOPENED','LOOKING','OFFER_PENDING')`);
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
             (SELECT COUNT(*) FROM gifting_interests gi WHERE gi.post_id = p.id AND gi.status IN ('INTERESTED','SELECTED')) AS interestCount
      FROM gifting_posts p
      JOIN users u ON u.id = p.user_id
      WHERE p.id = ?
    `).get(id) as any;
    if (!post) return undefined;
    const interests = sqlite.prepare(`
      SELECT gi.*, u.username, u.display_name AS displayName, u.photo_url AS photoUrl, u.avatar_choice AS avatarChoice
      FROM gifting_interests gi
      JOIN users u ON u.id = gi.user_id
      WHERE gi.post_id = ? AND gi.status != 'WITHDRAWN'
      ORDER BY gi.created_at ASC
    `).all(id);
    return { ...post, photoUrls: safeJson(post.photo_urls || "[]"), interests };
  },
  getGiftingPostsByUser(userId) {
    return this.getGiftingPosts({ includeInactive: true, userId });
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
