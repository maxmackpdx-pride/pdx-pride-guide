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
      lat: 45.5122, lng: -122.6715,
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
      lat: 45.5231, lng: -122.6838,
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
      lat: 45.5247, lng: -122.6731,
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
      lat: 45.5311, lng: -122.698,
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
      lat: 45.5194, lng: -122.6768,
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
      lat: 45.5246, lng: -122.6787,
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
      lat: 45.5326, lng: -122.6444,
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
      lat: 45.5249, lng: -122.6742,
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
      lat: 45.5249, lng: -122.6742,
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
      lat: 45.5246, lng: -122.6787,
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
      lat: 45.4895, lng: -122.5680,
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
      lat: 45.5228, lng: -122.6716,
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
      lat: 45.5200, lng: -122.6750,
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
      lat: 45.5175, lng: -122.6615,
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
      lat: 45.5270, lng: -122.6788,
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
      lat: 45.5189, lng: -122.6567,
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
      lat: 45.5251, lng: -122.6730,
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
      lat: 45.5251, lng: -122.6730,
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
      lat: 45.5251, lng: -122.6730,
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
      lat: 45.4791, lng: -122.6631,
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
      title: "Hawks All-Gender Friday Pride Mixxxer",
      description: "Hawks PDX All-Gender Pride Friday — all afternoon and all night. Inclusive, friendly, body-positive queer community space. Sauna, soak, connection. All LGBTQIA2S+ community members welcome. Come pre-game before heading out to other events.",
      venueName: "Hawks PDX",
      address: "335 SE 99th Ave, Portland, OR 97216",
      neighborhood: "SE Portland",
      lat: 45.5162, lng: -122.5682,
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
      title: "TranSocial at Hawks PDX",
      description: "Transcendent Pride Saturday at Hawks PDX celebrating Trans identity. All gender expressions welcome. Open to close (10am-6am). A welcoming, affirming space for the trans community and allies.",
      venueName: "Hawks PDX",
      address: "335 SE 99th Ave, Portland, OR 97216",
      neighborhood: "SE Portland",
      lat: 45.5162, lng: -122.5682,
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
      title: "Hawks All-Gender Pride Spa Day",
      description: "Queer/allied community wellness day at Hawks PDX. Body-positive, all gender expressions welcome. Nude yoga at 4pm (optional). Sauna, soak, and Pride Sunday relaxation. 1pm to 2am.",
      venueName: "Hawks PDX",
      address: "335 SE 99th Ave, Portland, OR 97216",
      neighborhood: "SE Portland",
      lat: 45.5162, lng: -122.5682,
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
      lat: 45.5175, lng: -122.6615,
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
      address: "Portland, OR",
      neighborhood: "Portland",
      lat: 45.5231, lng: -122.6765,
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
      lat: 45.5175, lng: -122.6615,
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
      lat: 45.5122, lng: -122.6715,
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
      lat: 45.5200, lng: -122.6750,
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
      lat: 45.5231, lng: -122.6838,
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
      lat: 45.5228, lng: -122.6716,
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
      lat: 45.5249, lng: -122.6742,
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
      lat: 45.5228, lng: -122.6716,
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
      lat: 45.5270, lng: -122.6788,
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
