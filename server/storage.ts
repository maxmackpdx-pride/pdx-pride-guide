import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import {
  events, submissions, gigPosts, promoters, moderationRequests, attendances,
  type Event, type InsertEvent,
  type Submission, type InsertSubmission,
  type GigPost, type InsertGigPost,
  type Promoter, type InsertPromoter,
  type ModerationRequest, type InsertModerationRequest,
  type Attendance, type InsertAttendance,
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
`);

function hashPassword(pw: string) {
  return crypto.createHash("sha256").update(pw + "pdxpride_salt").digest("hex");
}

function seedData() {
  const existing = db.select().from(events).all();
  if (existing.length > 0) return;
  const now = new Date().toISOString();

  const seedEvents = [
    {
      title: "Queer Dance Party", description: "Bass. House. Queer joy on the dance floor. All night long at one of Portland's most beloved underground venues.",
      venueName: "Holocene", address: "1001 SE Morrison St", neighborhood: "SE Portland",
      lat: 45.5189, lng: -122.6548, dateStart: "2026-07-17T22:00:00", dateEnd: "2026-07-18T02:00:00",
      dayOfWeek: "FRI", ageRequirement: "21_PLUS", eventTypes: JSON.stringify(["DANCE PARTY", "NIGHTLIFE"]),
      admission: "TICKETED", ticketUrl: "https://holocene.org",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: null, status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Leather Pride Social", description: "Annual kink-friendly meet & mingle. Dress code encouraged. Consent culture strictly enforced.",
      venueName: "Eagle Portland", address: "835 N Lombard St", neighborhood: "N Portland",
      lat: 45.5808, lng: -122.6785, dateStart: "2026-07-18T19:00:00", dateEnd: "2026-07-18T23:00:00",
      dayOfWeek: "SAT", ageRequirement: "21_PLUS", eventTypes: JSON.stringify(["SOCIAL", "KINK"]),
      admission: "FREE", ticketUrl: null,
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: true, nudityOk: false,
      posterImageUrl: null, status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Drag Extravaganza", description: "Portland's most iconic drag show returns with an all-star lineup. Expect spectacle, sass, and standing ovations.",
      venueName: "Alberta Rose Theatre", address: "3000 NE Alberta St", neighborhood: "NE Portland",
      lat: 45.5596, lng: -122.6479, dateStart: "2026-07-16T20:00:00", dateEnd: "2026-07-16T23:00:00",
      dayOfWeek: "THU", ageRequirement: "21_PLUS", eventTypes: JSON.stringify(["DRAG", "PERFORMANCE"]),
      admission: "TICKETED", ticketUrl: "https://albertarosetheatre.com",
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: null, status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Pride Brunch", description: "Bottomless mimosas, drag hosts, and a menu that slaps. Reserve early — this sells out every year.",
      venueName: "Crush Bar", address: "1400 SE Morrison St", neighborhood: "SE Portland",
      lat: 45.5179, lng: -122.6529, dateStart: "2026-07-19T11:00:00", dateEnd: "2026-07-19T14:00:00",
      dayOfWeek: "SUN", ageRequirement: "21_PLUS", eventTypes: JSON.stringify(["BRUNCH", "DRAG"]),
      admission: "TICKETED", ticketUrl: null,
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: null, status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Kink & Community Fair", description: "Educational, welcoming, and sex-positive. Workshops, vendors, and community connection. 18+ only.",
      venueName: "Portland Eagle", address: "835 N Lombard St", neighborhood: "N Portland",
      lat: 45.5808, lng: -122.6785, dateStart: "2026-07-17T14:00:00", dateEnd: "2026-07-17T18:00:00",
      dayOfWeek: "FRI", ageRequirement: "18_PLUS", eventTypes: JSON.stringify(["KINK", "FAIR"]),
      admission: "FREE", ticketUrl: null,
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: true, nudityOk: true,
      posterImageUrl: null, status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
    {
      title: "Trans Joy Dance", description: "A safe space dance party celebrating trans joy. All genders, all bodies, all vibes welcome.",
      venueName: "Holocene", address: "1001 SE Morrison St", neighborhood: "SE Portland",
      lat: 45.5189, lng: -122.6548, dateStart: "2026-07-16T21:00:00", dateEnd: "2026-07-17T01:00:00",
      dayOfWeek: "THU", ageRequirement: "21_PLUS", eventTypes: JSON.stringify(["DANCE PARTY", "TRANS"]),
      admission: "FREE", ticketUrl: null,
      isPublic: true, isPrivate: false, isHouseParty: false, isSexPositive: false, nudityOk: false,
      posterImageUrl: null, status: "LIVE", source: "admin_seeded", isClaimable: true,
      claimedBy: null, submittedBy: null, adminNotes: null, createdAt: now,
    },
  ];

  for (const e of seedEvents) {
    db.insert(events).values(e).run();
  }

  // Seed a few attendance entries per event for demo
  const bubbles = [
    "Hey, I'll be there!",
    "Hey, come say hi!",
    "Hey, I'm cute and slightly feral",
    "Hey, here for the queers and the chaos",
    "Hey, I'm friendly but bad at starting conversations",
    "Hey, let's be awkward together",
  ];
  const handles = ["queercat", "neonbabe", "velvethaze", "crushpunk", "stardust", "wildthing", "radtrans", "badfemme"];
  for (let eventId = 1; eventId <= 6; eventId++) {
    const count = 3 + Math.floor(Math.random() * 4);
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

  // Seed gigs
  const gigSeeds = [
    {
      postType: "POSTING_GIG", title: "Barbacks & Bartenders Available",
      name: "Portland Bar Collective", contactEmail: "info@portlandbarcollective.example",
      description: "Looking for experienced bar staff for Pride weekend events July 16–19. All genders welcome. OLCC required.",
      skills: "Bartending, OLCC", compensation: "$20/hr + tips", location: "Portland, OR",
      isRemote: false, status: "LIVE", createdAt: now,
    },
    {
      postType: "POSTING_GIG", title: "Drag Performers Needed",
      name: "Miss Deluxe Productions", contactEmail: "miss@deluxepdx.example",
      description: "Seeking local drag talent for multiple Pride shows. Paid gigs, family-friendly to adult shows available.",
      skills: "Drag performance", compensation: "$150–300/show", location: "Portland, OR",
      isRemote: false, status: "LIVE", createdAt: now,
    },
    {
      postType: "LOOKING_FOR_WORK", title: "Sound Tech & DJ",
      name: "DJ Queerwave", contactEmail: "djqueerwave@example.com",
      description: "Portland-based DJ. Experienced in queer nightlife, house, techno. Available July 16–19.",
      skills: "DJ, Sound Tech", compensation: "Negotiable", location: "Portland, OR",
      isRemote: false, status: "LIVE", createdAt: now,
    },
  ];

  for (const g of gigSeeds) {
    db.insert(gigPosts).values(g as any).run();
  }
}

seedData();

export interface IStorage {
  // Events
  getEvents(filters?: { status?: string; day?: string }): Event[];
  getEvent(id: number): Event | undefined;
  createEvent(data: InsertEvent): Event;
  updateEventStatus(id: number, status: string): void;
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
};
