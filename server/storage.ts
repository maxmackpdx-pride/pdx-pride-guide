import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import {
  events, submissions, gigPosts, promoters, moderationRequests, attendances, users, messages,
  type Event, type InsertEvent,
  type Submission, type InsertSubmission,
  type GigPost, type InsertGigPost,
  type Promoter, type InsertPromoter,
  type ModerationRequest, type InsertModerationRequest,
  type Attendance, type InsertAttendance,
  type User, type Message,
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
    handle TEXT NOT NULL,
    message TEXT NOT NULL,
    avatar_seed TEXT NOT NULL,
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
    created_at TEXT NOT NULL DEFAULT ''
  );
`);

// Add new columns to gig_posts if not present (SQLite doesn't support IF NOT EXISTS on ALTER)
try { sqlite.exec(`ALTER TABLE gig_posts ADD COLUMN user_id INTEGER`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE gig_posts ADD COLUMN image_url TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE gig_posts ADD COLUMN gig_date TEXT`); } catch(e) {}
try { sqlite.exec(`ALTER TABLE gig_posts ADD COLUMN gig_time TEXT`); } catch(e) {}

export function hashPassword(pw: string) {
  return crypto.createHash("sha256").update(pw + "pdxpride_salt").digest("hex");
}

// Old fake event titles used to detect stale seed data
const OLD_SEED_TITLES = ["Queer Dance Party", "Leather Pride Social", "Drag Extravaganza", "Pride Brunch", "Kink & Community Fair", "Trans Joy Dance"];

function seedData() {
  const existing = db.select().from(events).all();

  // Force re-seed if old fake events, no lat/lng, no poster images, or event count too low (new events added)
  if (existing.length > 0) {
    const needsReseed = OLD_SEED_TITLES.includes(existing[0].title) || existing[0].lat === null || existing[0].posterImageUrl === null || existing.length < 23;
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
      description: "2026 theme is 'Made with Pride' — celebrates creativity and entrepreneurship in Portland LGBTQ2SIA+ community. Live music, makers' market, food/drink vendors, nonprofit booths.",
      venueName: "Tom McCall Waterfront Park",
      address: "98 SW Naito Pkwy, Portland, OR 97204",
      neighborhood: "Downtown",
      lat: 45.5122, lng: -122.6715,
      dateStart: "2026-07-18T12:00:00", dateEnd: "2026-07-19T23:59:00",
      dayOfWeek: "SAT",
      ageRequirement: "ALL_AGES",
      eventTypes: JSON.stringify(["FESTIVAL", "OFFICIAL", "PARADE"]),
      admission: "TICKETED",
      ticketUrl: "https://pridenw.org",
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
      lat: 45.5231, lng: -122.6838,
      dateStart: "2026-07-19T11:00:00", dateEnd: "2026-07-19T23:59:00",
      dayOfWeek: "SUN",
      ageRequirement: "ALL_AGES",
      eventTypes: JSON.stringify(["PARADE", "FREE"]),
      admission: "FREE",
      ticketUrl: "https://pridenw.org",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/portland-pride-parade.png", status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "INFERNO PRIDE PORTLAND 2026",
      description: "Indoor + outdoor party with go-go dancers, DJ Lauren 6–8PM, DJ Wild Fire 8–10PM, games.",
      venueName: "Formerly Opaline",
      address: "105 NW 3rd Ave, Portland, OR 97209",
      neighborhood: "Old Town",
      lat: 45.5247, lng: -122.6731,
      dateStart: "2026-07-18T18:00:00", dateEnd: "2026-07-18T23:59:00",
      dayOfWeek: "SAT",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["PARTY", "DANCE", "DJS"]),
      admission: "TICKETED",
      ticketUrl: "https://www.tickettailor.com",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/inferno-pride-portland.png", status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Portland Pride Ride",
      description: "Casual bike ride to celebrate LGBTQIA+ community. Helmets required. Ends at 503 Distilling with parking lot party.",
      venueName: "Trek Bicycle Portland Slabtown",
      address: "Trek Bicycle Portland Slabtown, Northwest District, Portland, OR",
      neighborhood: "Northwest District",
      lat: 45.5311, lng: -122.698,
      dateStart: "2026-07-18T17:30:00", dateEnd: "2026-07-18T23:59:00",
      dayOfWeek: "SAT",
      ageRequirement: "ALL_AGES",
      eventTypes: JSON.stringify(["BIKE", "FREE", "OUTDOOR"]),
      admission: "FREE",
      ticketUrl: null,
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/portland-pride-ride.jpg", status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Lez Out Pride Brunch",
      description: "Lesbian drag brunch hosted by Shandi Evans & Harlow Quinzel. DJ Dilemma, performers Fay Ludes, Venereal Denise, RIOT!",
      venueName: "Bullard Tavern",
      address: "813 SW Alder St, Portland, OR 97205",
      neighborhood: "Downtown",
      lat: 45.5194, lng: -122.6768,
      dateStart: "2026-07-18T12:00:00", dateEnd: "2026-07-18T23:59:00",
      dayOfWeek: "SAT",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["BRUNCH", "DRAG", "LESBIAN"]),
      admission: "TICKETED",
      ticketUrl: null,
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
      eventTypes: JSON.stringify(["PARTY", "DANCE", "DRAG"]),
      admission: "TICKETED",
      ticketUrl: null,
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
      lat: 45.5246, lng: -122.6787,
      dateStart: "2026-07-18T21:00:00", dateEnd: "2026-07-19T02:00:00",
      dayOfWeek: "SAT",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["PARTY", "SPORTS", "LEATHER"]),
      admission: "TICKETED",
      ticketUrl: null,
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/stank-yes-coach.jpg",
      status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Certified Freak Block Party",
      description: "Drag queens, circus acrobats, avant-garde fashion. Benefits Basic Rights Oregon.",
      venueName: "Happylucky",
      address: "1930 NE Sandy Blvd, Portland, OR 97232",
      neighborhood: "Portland",
      lat: 45.5326, lng: -122.6444,
      dateStart: "2026-07-18T18:00:00", dateEnd: "2026-07-19T00:00:00",
      dayOfWeek: "SAT",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["PARTY", "DRAG", "BLOCK-PARTY", "FUNDRAISER"]),
      admission: "TICKETED",
      ticketUrl: null,
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
      dateStart: "2026-07-17T20:00:00", dateEnd: "2026-07-18T02:00:00",
      dayOfWeek: "FRI",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["PARTY", "DANCE", "LEATHER", "OFFICIAL"]),
      admission: "TICKETED",
      ticketUrl: null,
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
      lat: 45.5249, lng: -122.6742,
      dateStart: "2026-07-17T20:00:00", dateEnd: "2026-07-18T23:59:00",
      dayOfWeek: "FRI",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["PARTY", "TAKEOVER", "MULTI-DAY"]),
      admission: "TICKETED",
      ticketUrl: "https://jeffreyjay.gay",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/pride-in-demand.jpg", status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Lumbertwink / Bearracuda",
      description: "Bear-centric Pride Sunday party. Part of BEAR WEEK in Portland.",
      venueName: "TBA",
      address: "Portland, OR",
      neighborhood: "Portland",
      lat: 45.5231, lng: -122.6765,
      dateStart: "2026-07-19T20:00:00", dateEnd: "2026-07-19T23:59:00",
      dayOfWeek: "SUN",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["PARTY", "BEAR"]),
      admission: "TICKETED",
      ticketUrl: null,
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
      dateStart: "2026-07-18T11:00:00", dateEnd: "2026-07-18T23:59:00",
      dayOfWeek: "SAT",
      ageRequirement: "ALL_AGES",
      eventTypes: JSON.stringify(["DAYTIME", "MARKET", "WITCH"]),
      admission: "TBD",
      ticketUrl: null,
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/gay-witch-appreciation-day.jpg", status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Sasha Colby Pride Kick-Off",
      description: "Headline performance by drag queen Sasha Colby for Portland Pride Kick-Off.",
      venueName: "TBA",
      address: "Portland, OR",
      neighborhood: "Portland",
      lat: 45.5231, lng: -122.6765,
      dateStart: "2026-07-16T20:00:00", dateEnd: "2026-07-16T23:59:00",
      dayOfWeek: "THU",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["DRAG", "HEADLINE", "KICKOFF"]),
      admission: "TICKETED",
      ticketUrl: "https://flipphoneevents.com/Portland",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/sasha-colby-pride-kickoff.jpg",
      status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Treasure Trail Portland Pride",
      description: "Bearracuda's Pride Thursday kick-off at Sanctuary. DJ TIGERBEATZ (Seattle), hosted by JP Hardy. Wristband color system at the door (red=top, blue=vers, green=bottom, white=side). Venmo tickets available with no surcharge.",
      venueName: "Sanctuary",
      address: "33 NW 9th Ave, Portland, OR 97209",
      neighborhood: "Pearl District",
      lat: 45.5246, lng: -122.6787,
      dateStart: "2026-07-17T20:00:00", dateEnd: "2026-07-18T02:00:00",
      dayOfWeek: "THU",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["PARTY", "DANCE", "BEAR"]),
      admission: "TICKETED",
      ticketUrl: "https://bearracuda.com/events/treasurepdx/",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/treasure-trail-portland-pride.jpg", status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Bearracuda Portland Pride Friday",
      description: "Bearracuda's Pride Friday night at Nova PDX. One of the longest-running bear & friends club nights in the country — all admirers and respectful partygoers welcome.",
      venueName: "Nova PDX",
      address: "18 NW 3rd Ave, Portland, OR 97209",
      neighborhood: "Old Town",
      lat: 45.5249, lng: -122.6742,
      dateStart: "2026-07-18T21:00:00", dateEnd: "2026-07-19T02:00:00",
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
      address: "18 NW 3rd Ave, Portland, OR 97209",
      neighborhood: "Old Town",
      lat: 45.5249, lng: -122.6742,
      dateStart: "2026-07-19T21:00:00", dateEnd: "2026-07-20T02:00:00",
      dayOfWeek: "SAT",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["PARTY", "DANCE", "BEAR"]),
      admission: "TICKETED",
      ticketUrl: "https://bearracuda.com/events/portland-pride-saturday/",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: "/posters/bearracuda-pride-saturday.jpg", status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Portland Pickles Pride Night",
      description: "Portland Pickles baseball meets Pride! All ages welcome at Walker Stadium. A rare Pride event the whole family can enjoy together.",
      venueName: "Walker Stadium",
      address: "4727 SE 92nd Ave, Portland, OR 97266",
      neighborhood: "SE Portland",
      lat: 45.4895, lng: -122.5680,
      dateStart: "2026-07-17T19:05:00", dateEnd: "2026-07-17T22:00:00",
      dayOfWeek: "THU",
      ageRequirement: "ALL_AGES",
      eventTypes: JSON.stringify(["SPORTS", "FAMILY", "OUTDOOR"]),
      admission: "TICKETED",
      ticketUrl: "https://portlandpickles.com",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: null, status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Ankeny Alley Pride Block Party",
      description: "Official PrideNW block party in Old Town's Ankeny Alley. Two days of outdoor celebration, local vendors, and community gathering. Free and all ages.",
      venueName: "Ankeny Alley",
      address: "SW Ankeny St, Portland, OR 97204",
      neighborhood: "Old Town",
      lat: 45.5228, lng: -122.6716,
      dateStart: "2026-07-18T12:00:00", dateEnd: "2026-07-19T22:00:00",
      dayOfWeek: "SAT",
      ageRequirement: "ALL_AGES",
      eventTypes: JSON.stringify(["BLOCK-PARTY", "OFFICIAL", "FREE", "OUTDOOR"]),
      admission: "FREE",
      ticketUrl: "https://pridenw.org",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: null, status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Midtown Beer Garden Pride",
      description: "Official PrideNW outdoor beer garden open Thursday through Sunday. Community drinks and Pride energy just outside the main festival footprint.",
      venueName: "Midtown Beer Garden",
      address: "SW 3rd Ave & SW Morrison St, Portland, OR 97204",
      neighborhood: "Downtown",
      lat: 45.5200, lng: -122.6750,
      dateStart: "2026-07-17T17:00:00", dateEnd: "2026-07-20T20:00:00",
      dayOfWeek: "THU",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["BAR", "OFFICIAL", "OUTDOOR", "MULTI-DAY"]),
      admission: "FREE",
      ticketUrl: "https://pridenw.org",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: null, status: "LIVE", source: "admin_seeded", isClaimable: true,
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
      eventTypes: JSON.stringify(["BLOCK-PARTY", "COMMUNITY", "FREE", "OUTDOOR"]),
      admission: "FREE",
      ticketUrl: null,
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: null, status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "The Sports Bra Pride Block Party",
      description: "Portland's legendary women's sports bar throws its annual Pride block party. Queer athletes, fans, and community taking over the block all afternoon.",
      venueName: "The Sports Bra",
      address: "3455 NE Belmont St, Portland, OR 97232",
      neighborhood: "NE Portland",
      lat: 45.5302, lng: -122.6502,
      dateStart: "2026-07-19T13:00:00", dateEnd: "2026-07-19T22:00:00",
      dayOfWeek: "SUN",
      ageRequirement: "ALL_AGES",
      eventTypes: JSON.stringify(["BLOCK-PARTY", "SPORTS", "COMMUNITY"]),
      admission: "TICKETED",
      ticketUrl: "https://thesportsbrapub.com",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: null, status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Yes Sir Gay Dance Party",
      description: "Secret warehouse dance party. Gay underwear night featuring DJ Ottogyro. Location revealed to ticket holders only. 21+ only.",
      venueName: "Secret Warehouse",
      address: "Portland, OR (location revealed with ticket)",
      neighborhood: "Portland",
      lat: 45.5231, lng: -122.6765,
      dateStart: "2026-07-20T21:00:00", dateEnd: "2026-07-21T02:00:00",
      dayOfWeek: "SUN",
      ageRequirement: "21_PLUS",
      eventTypes: JSON.stringify(["PARTY", "DANCE", "WAREHOUSE"]),
      admission: "TICKETED",
      ticketUrl: null,
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: null, status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Portland Pride Drag Brunch at Stag PDX",
      description: "All-ages drag brunch at Stag PDX in the Pearl District. Two-day run of performances, mimosas, and weekend Pride energy.",
      venueName: "Stag PDX",
      address: "317 NW Broadway, Portland, OR 97209",
      neighborhood: "Pearl District",
      lat: 45.5270, lng: -122.6788,
      dateStart: "2026-07-19T11:00:00", dateEnd: "2026-07-20T15:00:00",
      dayOfWeek: "SAT",
      ageRequirement: "ALL_AGES",
      eventTypes: JSON.stringify(["BRUNCH", "DRAG", "MULTI-DAY"]),
      admission: "TICKETED",
      ticketUrl: null,
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: null, status: "LIVE", source: "admin_seeded", isClaimable: true,
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
  for (let eventId = 1; eventId <= 23; eventId++) {
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

seedData();

export interface IStorage {
  // Events
  getEvents(filters?: { status?: string; day?: string }): Event[];
  getEvent(id: number): Event | undefined;
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
  getAttendances(eventId: number): Attendance[];
  createAttendance(data: InsertAttendance): Attendance;
  // Users
  getUserById(id: number): User | undefined;
  getUserByEmail(email: string): User | undefined;
  getUserByUsername(username: string): User | undefined;
  createUser(data: { username: string; email: string; passwordHash: string; displayName?: string }): User;
  updateUser(id: number, data: Partial<Pick<User, 'displayName' | 'avatarChoice' | 'bio'>>): void;
  // Messages
  getInbox(userId: number): Message[];
  getSentMessages(userId: number): Message[];
  sendMessage(fromUserId: number, toUserId: number, subject: string, body: string): Message;
  markRead(messageId: number): void;
  getThread(threadId: string): Message[];
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
        isClaimable: false, claimedBy: sub.submitterEmail,
        submittedBy: sub.submitterEmail, adminNotes: null,
        createdAt: new Date().toISOString(),
      }).run();
    }
    return db.select().from(submissions).where(eq(submissions.id, id)).get();
  },
  rejectSubmission(id, reason) {
    db.update(submissions).set({ status: "REJECTED", adminNotes: reason }).where(eq(submissions.id, id)).run();
  },
  getGigPosts(status) {
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
    db.update(gigPosts).set(data).where(eq(gigPosts.id, id)).run();
  },
  deleteGigPost(id, userId) {
    db.delete(gigPosts).where(eq(gigPosts.id, id)).run();
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
    return db.select().from(attendances).where(eq(attendances.eventId, eventId)).all();
  },
  createAttendance(data) {
    return db.insert(attendances).values({ ...data, createdAt: new Date().toISOString() }).returning().get();
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
  createUser({ username, email, passwordHash, displayName }) {
    const hashed = hashPassword(passwordHash);
    return db.insert(users).values({
      username, email, passwordHash: hashed,
      displayName: displayName || null,
      avatarChoice: 1,
      status: "active",
      createdAt: new Date().toISOString(),
    }).returning().get();
  },
  updateUser(id, data) {
    db.update(users).set(data).where(eq(users.id, id)).run();
  },
  // Messages
  getInbox(userId) {
    return db.select().from(messages).where(eq(messages.toUserId, userId)).all();
  },
  getSentMessages(userId) {
    return db.select().from(messages).where(eq(messages.fromUserId, userId)).all();
  },
  sendMessage(fromUserId, toUserId, subject, body) {
    const threadId = `thread_${Date.now()}_${fromUserId}_${toUserId}`;
    return db.insert(messages).values({
      fromUserId, toUserId, subject, body,
      isRead: false,
      threadId,
      createdAt: new Date().toISOString(),
    }).returning().get();
  },
  markRead(messageId) {
    db.update(messages).set({ isRead: true }).where(eq(messages.id, messageId)).run();
  },
  getThread(threadId) {
    return db.select().from(messages).where(eq(messages.threadId, threadId)).all();
  },
};
