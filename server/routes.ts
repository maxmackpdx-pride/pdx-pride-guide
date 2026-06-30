import type { Express } from "express";
import type { Server } from "http";
import { buildLlmsTxt, buildRobotsTxt, buildSitemapXml, getLiveEventsForSeo } from "./seo";
import { expandMultiDayEvents } from "@shared/multiDayEvents";
import { storage, hashPassword, verifyPassword, isLegacyPasswordHash, sqlite, getTableCounts } from "./storage";
import { assertProductionPersistence, assertProductionSecrets, getPersistenceAudit } from "./persistence";
import { initAttendanceWs } from "./attendanceWs";
import { BetterSqliteSessionStore } from "./sessionStore";
import { insertSubmissionSchema, insertGigPostSchema, insertModerationRequestSchema, insertMissedConnectionSchema, insertGiftingPostSchema, insertGiftingInterestSchema, insertGiftingReportSchema, insertFeedbackReportSchema } from "@shared/schema";
import { resolveEventPosterUrl } from "@shared/eventPoster";
import {
  formatCustomSpottedVenue,
  generalSpottedClosesAt,
  isMissedConnectionPostable,
  missedConnectionClosesAt,
  pacificDayOfWeek,
} from "@shared/missedConnections";
import { isEventTalentRole } from "@shared/eventTalent";
import crypto from "crypto";
import session from "express-session";
import multer from "multer";
import path from "path";
import fs from "fs";

// ─── File upload setup ────────────────────────────────────────────────────────
const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads"));
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
      const rawExt = path.extname(file.originalname).toLowerCase();
      const ext = [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(rawExt) ? rawExt : ".jpg";
      cb(null, `poster-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|jpg|png|gif|webp)$/.test(file.mimetype);
    cb(null, ok);
  },
});

// Extend express-session to include our custom fields
declare module "express-session" {
  interface SessionData {
    userId?: number;
    promoterId?: number;
    isAdmin?: boolean;
    googleOAuthState?: string;
    googleOAuthLinkUserId?: number;
  }
}

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "Tcasey90";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "pdx_pride_admin_2026";
const ADMIN_USER_EMAILS = (process.env.ADMIN_USER_EMAILS || "hello.tuckercasey@gmail.com")
  .split(",")
  .map(value => value.trim().toLowerCase())
  .filter(Boolean);
const ADMIN_USERNAMES = (process.env.ADMIN_USERNAMES || "hello_tuckercasey,tucker_pdmax")
  .split(",")
  .map(value => value.trim().replace(/^@/, "").toLowerCase())
  .filter(Boolean);
const OWNER_DISPLAY_NAME = process.env.OWNER_DISPLAY_NAME || "Tucker_PDmaX";

function publicEvent(evt: any, pendingClaimIds: Set<number> = new Set()) {
  const { adminNotes, submittedBy, claimedBy, ...safe } = evt;
  return {
    ...safe,
    posterImageUrl: resolveEventPosterUrl(evt.id, evt.posterImageUrl),
    hasPendingClaim: pendingClaimIds.has(evt.id),
  };
}

function publicUser(user: any) {
  if (!user) return null;
  const { passwordHash, email, status, googleId, ...safe } = user;
  return safe;
}

function adminUserSummary(user: any) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    photoUrl: user.photoUrl || null,
    avatarChoice: user.avatarChoice ?? 1,
    avatarRing: user.avatarRing || "none",
    promoterStatus: user.promoterStatus || "none",
    subAdmin: !!user.subAdmin,
    googleLinked: !!user.googleId,
    status: user.status || "active",
    createdAt: user.createdAt || "",
    isOwner: isMainAdminUser(user),
  };
}

function lookupUserProfile(identifier: string | null | undefined) {
  const raw = String(identifier || "").trim().replace(/^@/, "");
  if (!raw) return null;
  const user = storage.getUserByEmail(raw) || storage.getUserByUsername(raw);
  return user ? adminUserSummary(user) : null;
}

function enrichSubmissionForAdmin(sub: any) {
  const user = storage.getUserByEmail(sub.submitterEmail);
  return {
    ...sub,
    submitterProfile: user ? adminUserSummary(user) : null,
  };
}

function enrichModerationForAdmin(req: any) {
  const user = storage.getUserByEmail(req.requesterEmail);
  return {
    ...req,
    requesterProfile: user ? adminUserSummary(user) : null,
  };
}

function enrichEventForAdmin(evt: any) {
  return {
    ...evt,
    submittedByProfile: lookupUserProfile(evt.submittedBy),
    claimedByProfile: lookupUserProfile(evt.claimedBy),
  };
}

function isMainAdminUser(user: any) {
  if (!user) return false;
  const email = String(user.email || "").trim().toLowerCase();
  const username = String(user.username || "").trim().replace(/^@/, "").toLowerCase();
  return ADMIN_USER_EMAILS.includes(email)
    || ADMIN_USERNAMES.includes(username)
    || storage.hasSiteAdminGrant(user.id);
}

function markAdminSessionForUser(req: any, user: any) {
  if (isMainAdminUser(user)) {
    req.session.isAdmin = true;
    return true;
  }
  if (user?.subAdmin) {
    req.session.isAdmin = true;
    return true;
  }
  return false;
}

function syncOwnerDisplayName(user: any) {
  if (!isMainAdminUser(user) || user.displayName === OWNER_DISPLAY_NAME) return user;
  storage.updateUser(user.id, { displayName: OWNER_DISPLAY_NAME });
  return { ...user, displayName: OWNER_DISPLAY_NAME };
}

function authUserResponse(req: any, user: any) {
  const isAdmin = markAdminSessionForUser(req, user);
  return {
    id: user.id, username: user.username, email: user.email,
    displayName: user.displayName, avatarChoice: user.avatarChoice,
    avatarRing: user.avatarRing || "none", avatarCrop: user.avatarCrop || null,
    bio: user.bio, photoUrl: user.photoUrl, googleLinked: !!user.googleId,
    promoterStatus: user.promoterStatus || "none",
    isAdmin,
    isSuperAdmin: isMainAdminUser(user),
    subAdmin: !!user.subAdmin,
  };
}

function publicGiftingPost(post: any, viewerUserId?: number) {
  const userId = Number(post.userId ?? post.user_id);
  const selectedInterestId = Number(post.selectedInterestId ?? post.selected_interest_id ?? 0) || null;
  const safeInterests = Array.isArray(post.interests) ? post.interests.map((interest: any) => ({
    id: interest.id,
    userId: interest.userId ?? interest.user_id,
    note: interest.note,
    status: interest.status,
    username: interest.username,
    displayName: interest.displayName,
    photoUrl: interest.photoUrl,
    avatarChoice: interest.avatarChoice,
    avatarRing: interest.avatarRing || "none",
    isMine: viewerUserId ? Number(interest.userId ?? interest.user_id) === viewerUserId : false,
  })) : [];
  return {
    id: post.id,
    userId,
    postType: post.postType ?? post.post_type,
    title: post.title,
    description: post.description,
    category: post.category,
    neighborhood: post.neighborhood,
    pickupPreference: post.pickupPreference ?? post.pickup_preference,
    photoUrls: post.photoUrls || [],
    status: post.status,
    selectedInterestId,
    renewCount: post.renewCount ?? post.renew_count ?? 0,
    expiresAt: post.expiresAt ?? post.expires_at,
    reportCount: post.reportCount ?? post.report_count ?? 0,
    createdAt: post.createdAt ?? post.created_at,
    username: post.username,
    displayName: post.displayName,
    posterPhotoUrl: post.posterPhotoUrl,
    avatarChoice: post.avatarChoice,
    posterAvatarRing: post.posterAvatarRing || post.avatarRing || "none",
    interestCount: Number(post.interestCount || 0),
    interests: safeInterests,
    isMine: viewerUserId ? userId === viewerUserId : false,
    selectedUserId: safeInterests.find((interest: any) => interest.id === selectedInterestId)?.userId || null,
  };
}

const GIFTING_RUN_END = new Date("2026-07-27T00:00:00-07:00").getTime();
const RESTRICTED_GIFTING_TERMS = [
  "weapon", "gun", "ammo", "drugs", "cocaine", "meth", "fentanyl", "prescription",
  "alcohol", "needle", "needles", "poppers", "lube", "lubricant", "insertable",
  "underwear", "stolen", "counterfeit", "hazardous",
];

function assertGiftingAllowed(body: any) {
  if (Date.now() >= GIFTING_RUN_END && process.env.GIFTING_KEEP_OPEN !== "true") {
    throw new Error("Public gifting posts are paused after July 26, 2026.");
  }
  if (!body.acceptRules) throw new Error("You must agree to the community rules.");
  const haystack = `${body.title || ""} ${body.description || ""} ${body.category || ""}`.toLowerCase();
  const found = RESTRICTED_GIFTING_TERMS.find(term => haystack.includes(term));
  if (found) throw new Error("This post appears to include a restricted item. Please revise or contact an admin.");
}

function getBaseUrl(req: any) {
  const proto = req.get("x-forwarded-proto") || req.protocol || "https";
  return `${proto}://${req.get("host")}`;
}

function googleRedirectUri(_req: any) {
  // Always use www so OAuth state cookie + Google redirect URI stay on one host.
  return process.env.GOOGLE_REDIRECT_URI || "https://www.prideguidepdx.com/api/auth/google/callback";
}

function makeUsername(email: string) {
  const base = email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 22) || "google_user";
  let username = base.length >= 3 ? base : `${base}_user`;
  let suffix = 1;
  while (storage.getUserByUsername(username)) {
    username = `${base.slice(0, 18)}_${suffix++}`;
  }
  return username;
}

function maybeSyncSiteOwnerPortfolio(user: { id?: number; email?: string | null; username?: string | null } | null | undefined) {
  if (storage.isSiteOwnerUser(user)) storage.syncSiteOwnerPortfolio();
}

function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

function requireAdmin(req: any, res: any, next: any) {
  if (req.session?.isAdmin) {
    return next();
  }
  const user = req.session?.userId ? storage.getUserById(req.session.userId) : null;
  if (markAdminSessionForUser(req, user)) {
    return next();
  }
  return res.status(401).json({ error: "Not authenticated" });
}

function getSessionAdminUser(req: any) {
  if (!req.session?.userId) return null;
  const user = storage.getUserById(req.session.userId);
  if (!isMainAdminUser(user)) return null;
  req.session.isAdmin = true;
  return user;
}

function sessionIsAdmin(req: any): boolean {
  if (req.session?.isAdmin) return true;
  const user = req.session?.userId ? storage.getUserById(req.session.userId) : null;
  if (user && isMainAdminUser(user)) {
    req.session.isAdmin = true;
    return true;
  }
  return false;
}

function getAdminActorUserId(req: any): number | null {
  const sessionUser = req.session?.userId ? storage.getUserById(req.session.userId) : null;
  if (sessionUser && isMainAdminUser(sessionUser)) return sessionUser.id;
  for (const email of ADMIN_USER_EMAILS) {
    const u = storage.getUserByEmail(email);
    if (u) return u.id;
  }
  for (const uname of ADMIN_USERNAMES) {
    const u = storage.getUserByUsername(uname);
    if (u) return u.id;
  }
  return null;
}

let attendanceHub: ReturnType<typeof initAttendanceWs> | null = null;

function notifyAttendanceUpdate(eventId: number) {
  attendanceHub?.broadcastAttendance(eventId);
}

export function registerRoutes(httpServer: Server, app: Express) {
  assertProductionPersistence();
  assertProductionSecrets();
  attendanceHub = initAttendanceWs(httpServer);
  storage.syncSiteOwnerPortfolio();

  // Machine-readable discovery for search engines and AI crawlers.
  app.get("/llms.txt", (_req, res) => {
    res.type("text/plain; charset=utf-8").send(buildLlmsTxt(getLiveEventsForSeo()));
  });

  app.get("/sitemap.xml", (_req, res) => {
    res.type("application/xml; charset=utf-8").send(buildSitemapXml(getLiveEventsForSeo()));
  });

  app.get("/robots.txt", (_req, res) => {
    res.type("text/plain; charset=utf-8").send(buildRobotsTxt());
  });

  // Session middleware — persisted on the same SQLite volume as user data
  app.use(session({
    secret: process.env.SESSION_SECRET || "pdxpride_secret_2026",
    store: new BetterSqliteSessionStore(sqlite),
    proxy: true,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  }));

  // ─── FILE UPLOADS ───────────────────────────────────────────────────────
  // Poster image upload (event submit / claim edit)
  app.post("/api/upload/poster", requireAuth, upload.single("poster"), (req: any, res: any) => {
    if (!req.file) return res.status(400).json({ error: "No file or invalid type (jpg/png/gif/webp, max 8MB)" });
    res.json({ url: `/uploads/${req.file.filename}` });
  });

  app.post("/api/admin/upload/poster", requireAdmin, upload.single("poster"), (req: any, res: any) => {
    if (!req.file) return res.status(400).json({ error: "No file or invalid type (jpg/png/gif/webp, max 8MB)" });
    res.json({ url: `/uploads/${req.file.filename}` });
  });

  // Profile photo upload (client sends pre-cropped circle JPEG from AvatarEditor)
  app.post("/api/upload/avatar", requireAuth, upload.single("avatar"), async (req: any, res: any) => {
    if (!req.file) return res.status(400).json({ error: "No file or invalid type" });
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  });

  app.post("/api/upload/gifting", requireAuth, upload.array("photos", 2), (req: any, res: any) => {
    const files = Array.isArray(req.files) ? req.files : [];
    if (!files.length) return res.status(400).json({ error: "Upload 1 or 2 image files (jpg/png/gif/webp, max 8MB each)" });
    res.json({ urls: files.slice(0, 2).map((file: any) => `/uploads/${file.filename}`) });
  });

  // Serve uploaded files statically
  app.use("/uploads", (req: any, res: any, next: any) => {
    const express = require("express");
    express.static(UPLOADS_DIR)(req, res, next);
  });

  // ─── EVENTS ─────────────────────────────────────────────────────────────
  app.get("/api/events", (req, res) => {
    const { day } = req.query;
    let evts = expandMultiDayEvents(storage.getEvents({ status: "LIVE" }));
    if (typeof day === "string" && day.length > 0) {
      evts = evts.filter(evt => evt.dayOfWeek === day);
    }
    const pendingClaimIds = new Set(storage.getPendingClaimEventIds());
    res.json(evts.map(evt => publicEvent(evt, pendingClaimIds)));
  });

  app.get("/api/events/unclaimed", (req, res) => {
    const pendingClaimIds = new Set(storage.getPendingClaimEventIds());
    const evts = storage.getEvents({ status: "LIVE" }).filter(evt =>
      evt.isClaimable && !evt.claimedBy && !pendingClaimIds.has(evt.id)
    );
    res.json(evts.map(evt => publicEvent(evt, pendingClaimIds)));
  });

  app.get("/api/events/attendance-summaries", (_req, res) => {
    res.json(storage.getAttendanceSummaries());
  });

  app.get("/api/events/:id", (req, res) => {
    const evt = storage.getEvent(Number(req.params.id));
    if (!evt) return res.status(404).json({ error: "Not found" });
    const pendingClaimIds = new Set(storage.getPendingClaimEventIds());
    const expanded = expandMultiDayEvents([evt]);
    const day = typeof req.query.day === "string" ? req.query.day.toUpperCase() : "";
    const listing = day
      ? expanded.find(e => e.dayOfWeek === day) || expanded[0]
      : expanded.length === 1
        ? expanded[0]
        : evt;
    res.json(publicEvent(listing, pendingClaimIds));
  });

  // ─── SUBMISSIONS ─────────────────────────────────────────────────────────
  app.post("/api/submit", requireAuth, (req, res) => {
    try {
      const user = storage.getUserById(req.session.userId!);
      if (!user) return res.status(401).json({ error: "Not authenticated" });
      const rawType = req.body.type;
      const type = rawType === "CLAIM" ? "CLAIM" : rawType === "SUGGEST" ? "SUGGEST" : "NEW_EVENT";
      const promoterStatus = user.promoterStatus || "none";
      const isAdminUser = isMainAdminUser(user) || !!req.session.isAdmin;

      const eventId = type === "CLAIM" ? Number(req.body.eventId) : null;
      const claimEventId = eventId ?? 0;
      const claimEvent = type === "CLAIM" && Number.isFinite(claimEventId) ? storage.getEvent(claimEventId) : null;
      if (type === "CLAIM") {
        if (!claimEvent || claimEvent.status !== "LIVE" || !claimEvent.isClaimable || claimEvent.claimedBy) {
          return res.status(400).json({ error: "This event is not available to claim." });
        }
        if (storage.getPendingClaimEventIds().includes(claimEventId)) {
          return res.status(409).json({ error: "This event already has a pending claim." });
        }
      }
      const source = type === "CLAIM" && claimEvent ? claimEvent : req.body;
      const data = insertSubmissionSchema.parse({
        ...source,
        type,
        eventId: type === "CLAIM" ? claimEventId : null,
        submitterName: user.displayName || user.username,
        submitterEmail: user.email,
        submitterOrg: req.body.submitterOrg || null,
        claimReason: type === "CLAIM" ? req.body.claimReason : null,
        eventTypes: type === "CLAIM"
          ? source.eventTypes
          : JSON.stringify(req.body.eventTypes || []),
      });
      const sub = storage.createSubmission(data);

      // Approved promoters / admins submitting a new event bypass the review queue
      if (type === "NEW_EVENT" && (promoterStatus === "approved" || isAdminUser)) {
        storage.autoApproveSubmission(sub.id, user.username);
        return res.json({ ...sub, autoApproved: true });
      }

      // NEW_EVENT from unapproved user → goes to queue + flags them for promoter review
      if (type === "NEW_EVENT" && promoterStatus !== "approved" && !isAdminUser) {
        if (promoterStatus === "none") storage.setPromoterStatus(user.id, "pending");
        return res.json({ ...sub, pendingPromoterReview: true });
      }

      // CLAIM from unapproved user → flag for promoter review
      if (type === "CLAIM" && promoterStatus !== "approved" && !isAdminUser) {
        if (promoterStatus === "none") storage.setPromoterStatus(user.id, "pending");
      }

      // SUGGEST goes straight to queue, no promoter status change
      res.json(sub);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // ─── CLAIMED EVENT EDIT (owner only) ──────────────────────────────────────
  // Returns events claimed by the logged-in user
  app.get("/api/events/mine/claimed", requireAuth, (req, res) => {
    const userId = req.session.userId!;
    if (!storage.getUserById(userId)) return res.status(404).json({ error: "User not found" });
    const all = storage.getEvents({});
    const mine = all.filter(e => storage.isUserEventHost(e.id, userId)).map(evt => ({
      ...evt,
      posterImageUrl: resolveEventPosterUrl(evt.id, evt.posterImageUrl),
    }));
    res.json(mine);
  });

  app.get("/api/events/mine/submitted", requireAuth, (req, res) => {
    const user = storage.getUserById(req.session.userId!);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (storage.isSiteOwnerUser(user)) return res.json([]);
    const mine = storage.getSubmissions().filter(s => s.submitterEmail === user.email);
    res.json(mine);
  });

  app.get("/api/events/mine/check-ins", requireAuth, (req, res) => {
    res.json(storage.getAttendancesByUser(req.session.userId!));
  });

  app.get("/api/events/mine/talent", requireAuth, (req, res) => {
    res.json(storage.getEventTalentByUser(req.session.userId!));
  });

  // Owner edits a claimed event (all fields, goes back to pending review)
  app.put("/api/events/:id/edit", requireAuth, (req, res) => {
    const evt = storage.getEvent(Number(req.params.id));
    if (!evt) return res.status(404).json({ error: "Not found" });
    const user = storage.getUserById(req.session.userId!);
    if (!user || !storage.isUserEventHost(evt.id, user.id)) return res.status(403).json({ error: "Not your event" });
    const allowed = [
      "title", "description", "venueName", "address", "neighborhood",
      "dateStart", "dateEnd", "dayOfWeek", "ageRequirement", "admission",
      "ticketUrl", "posterImageUrl", "eventTypes",
      "isPublic", "isHouseParty", "isSexPositive", "nudityOk",
    ];
    const patch: any = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) patch[k] = req.body[k]; });
    if (patch.eventTypes && Array.isArray(patch.eventTypes)) {
      patch.eventTypes = JSON.stringify(patch.eventTypes);
    }
    const updated = storage.updateEvent(Number(req.params.id), patch);
    res.json(updated);
  });

  // ─── MODERATION REQUESTS (remove/flag — claims go through /api/submit) ───
  app.post("/api/moderation-request", requireAuth, (req, res) => {
    try {
      const data = insertModerationRequestSchema.parse(req.body);
      if (data.type === "CLAIM") {
        const user = storage.getUserById(req.session.userId!);
        if (!user) return res.status(401).json({ error: "Not authenticated" });
        const claimEventId = Number(data.eventId);
        const claimEvent = Number.isFinite(claimEventId) ? storage.getEvent(claimEventId) : null;
        if (!claimEvent || claimEvent.status !== "LIVE" || !claimEvent.isClaimable || claimEvent.claimedBy) {
          return res.status(400).json({ error: "This event is not available to claim." });
        }
        if (storage.getPendingClaimEventIds().includes(claimEventId)) {
          return res.status(409).json({ error: "This event already has a pending claim." });
        }
        const sub = storage.createSubmission(insertSubmissionSchema.parse({
          ...claimEvent,
          type: "CLAIM",
          eventId: claimEventId,
          submitterName: user.displayName || user.username,
          submitterEmail: user.email,
          submitterOrg: null,
          claimReason: data.proof,
          eventTypes: claimEvent.eventTypes,
        }));
        const promoterStatus = user.promoterStatus || "none";
        if (promoterStatus !== "approved" && !isMainAdminUser(user)) {
          storage.setPromoterStatus(user.id, "pending");
        }
        return res.json({ redirected: "submission", submission: sub });
      }
      const req2 = storage.createModerationRequest(data);
      res.json(req2);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/feedback", (req, res) => {
    try {
      const payload = {
        ...req.body,
        pageUrl: String(req.body.pageUrl || req.get("referer") || "/").slice(0, 500),
        category: String(req.body.category || "BUG").slice(0, 40),
        severity: String(req.body.severity || "MEDIUM").slice(0, 40),
        message: String(req.body.message || "").trim().slice(0, 2000),
        steps: req.body.steps ? String(req.body.steps).trim().slice(0, 2000) : null,
        email: req.body.email ? String(req.body.email).trim().slice(0, 180) : null,
        userAgent: String(req.body.userAgent || req.get("user-agent") || "").slice(0, 500),
      };
      if (!payload.message) return res.status(400).json({ error: "message required" });
      const feedback = storage.createFeedbackReport(insertFeedbackReportSchema.parse(payload));
      res.json({ ok: true, id: feedback.id });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // ─── ATTENDANCE ───────────────────────────────────────────────────────────
  app.get("/api/events/:id/attendance", (req, res) => {
    const list = storage.getAttendances(Number(req.params.id), req.session?.userId);
    res.json(list);
  });

  app.post("/api/events/:id/attendance", requireAuth, (req, res) => {
    try {
      const user = storage.getUserById(req.session.userId!);
      if (!user) return res.status(401).json({ error: "Not authenticated" });
      const message = String(req.body.message || "").trim();
      if (!message) return res.status(400).json({ error: "message required" });
      const eventId = Number(req.params.id);
      const att = storage.upsertAttendance(eventId, user, message);
      notifyAttendanceUpdate(eventId);
      res.json(att);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/events/:id/attendance", requireAuth, (req, res) => {
    const eventId = Number(req.params.id);
    storage.removeAttendance(eventId, req.session.userId!);
    notifyAttendanceUpdate(eventId);
    res.json({ ok: true });
  });

  app.post("/api/events/:eventId/attendance/:attendanceId/message", requireAuth, (req, res) => {
    const eventId = Number(req.params.eventId);
    const senderList = storage.getAttendances(eventId, req.session.userId);
    const senderRsvped = senderList.some((a: any) => a.user_id === req.session.userId);
    if (!senderRsvped) return res.status(403).json({ error: "RSVP required to message attendees" });
    const att = senderList.find((a: any) => a.id === Number(req.params.attendanceId));
    if (!att?.user_id) return res.status(404).json({ error: "Check-in not found" });
    if (att.user_id === req.session.userId) return res.status(400).json({ error: "Cannot message yourself" });
    const body = String(req.body.body || "").trim();
    if (!body) return res.status(400).json({ error: "body required" });
    const evt = storage.getEvent(Number(req.params.eventId));
    const msg = storage.sendMessage(req.session.userId!, Number(att.user_id), `Check-in: ${evt?.title || "Event"}`, body, {
      contextType: "CHECK_IN",
      contextId: Number(req.params.eventId),
      contextLabel: evt?.title || null,
    });
    res.json(msg);
  });

  // ─── GIGS ─────────────────────────────────────────────────────────────────
  app.get("/api/gigs", (req, res) => {
    const viewerId = req.session?.userId;
    const gigs = storage.getGigPosts("LIVE").map(gig => ({
      ...gig,
      isMine: viewerId ? gig.userId === viewerId : false,
    }));
    res.json(gigs);
  });

  app.post("/api/gigs", requireAuth, (req, res) => {
    try {
      const data = insertGigPostSchema.parse(req.body);
      const userId = req.session.userId!;
      const gig = storage.createGigPost({ ...data, userId } as any);
      res.json(gig);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/gigs/:id/message", requireAuth, (req, res) => {
    const gig = storage.getGigPosts().find(g => g.id === Number(req.params.id));
    if (!gig?.userId) return res.status(404).json({ error: "Host not available" });
    if (gig.userId === req.session.userId) return res.status(400).json({ error: "Cannot message yourself" });
    const body = String(req.body.body || "").trim();
    if (!body) return res.status(400).json({ error: "body required" });
    const msg = storage.sendMessage(req.session.userId!, gig.userId, `Gig Board: ${gig.title}`, body, {
      contextType: "GIG",
      contextId: gig.id,
      contextLabel: gig.title,
    });
    res.json(msg);
  });

  // User's own gig posts
  app.get("/api/gigs/mine", requireAuth, (req, res) => {
    const gigs = storage.getGigPostsByUser(req.session.userId!);
    res.json(gigs);
  });

  app.put("/api/gigs/:id", requireAuth, (req, res) => {
    const id = Number(req.params.id);
    const userId = req.session.userId!;
    try {
      storage.updateGigPost(id, userId, req.body);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/gigs/:id", requireAuth, (req, res) => {
    const id = Number(req.params.id);
    const userId = req.session.userId!;
    storage.deleteGigPost(id, userId);
    res.json({ ok: true });
  });

  // ─── OUT OF MY CLOSET: GIFTING ───────────────────────────────────────────
  app.get("/api/gifting", (req: any, res) => {
    const posts = storage.getGiftingPosts({ viewerUserId: req.session?.userId });
    res.json(posts.map(post => publicGiftingPost(post, req.session?.userId)));
  });

  app.get("/api/gifting/mine", requireAuth, (req, res) => {
    const posts = storage.getGiftingPostsByUser(req.session.userId!);
    res.json(posts.map(post => publicGiftingPost(post, req.session.userId!)));
  });

  app.get("/api/gifting/:id", (req: any, res) => {
    const post = storage.getGiftingPost(Number(req.params.id));
    if (!post) return res.status(404).json({ error: "Not found" });
    res.json(publicGiftingPost(post, req.session?.userId));
  });

  app.post("/api/gifting", requireAuth, (req, res) => {
    try {
      assertGiftingAllowed(req.body);
      const photoUrls = Array.isArray(req.body.photoUrls) ? req.body.photoUrls.slice(0, 2) : [];
      const postType = req.body.postType === "ISO" ? "ISO" : "GIFT";
      const data = insertGiftingPostSchema.parse({
        userId: req.session.userId!,
        postType,
        title: String(req.body.title || "").trim(),
        description: String(req.body.description || "").trim(),
        category: String(req.body.category || "").trim(),
        neighborhood: String(req.body.neighborhood || "").trim(),
        pickupPreference: String(req.body.pickupPreference || "").trim(),
        photoUrls: JSON.stringify(photoUrls),
      });
      const post = storage.createGiftingPost(data);
      res.json({ ...post, message: "Your gifting post is live." });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/gifting/:id/interest", requireAuth, (req, res) => {
    try {
      const post = storage.getGiftingPost(Number(req.params.id));
      if (!post) return res.status(404).json({ error: "Not found" });
      if ((post.post_type || post.postType) !== "GIFT") return res.status(400).json({ error: "Use the In Search Of offer flow for In Search Of posts." });
      const note = String(req.body.note || "").trim();
      if (!note) return res.status(400).json({ error: "A short note is required." });
      const interest = storage.addGiftingInterest(insertGiftingInterestSchema.parse({
        postId: post.id,
        userId: req.session.userId!,
        note,
      }));
      const interestedUser = storage.getUserById(req.session.userId!);
      storage.sendMessage(req.session.userId!, Number(post.user_id), `Gifting interest: ${post.title}`, `${interestedUser?.displayName || interestedUser?.username || "Someone"} raised their hand: ${note}`, {
        contextType: "GIFTING",
        contextId: post.id,
        contextLabel: post.title,
      });
      res.json(interest);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/gifting/:id/offer", requireAuth, (req, res) => {
    try {
      const post = storage.getGiftingPost(Number(req.params.id));
      if (!post) return res.status(404).json({ error: "Not found" });
      if ((post.post_type || post.postType) !== "ISO") return res.status(400).json({ error: "Use the interest flow for Gift posts." });
      const note = String(req.body.note || "").trim();
      if (!note) return res.status(400).json({ error: "A short note is required." });
      const offer = storage.addGiftingInterest(insertGiftingInterestSchema.parse({
        postId: post.id,
        userId: req.session.userId!,
        note,
      }));
      const msg = storage.sendMessage(req.session.userId!, Number(post.user_id), `In Search Of offer: ${post.title}`, note, {
        contextType: "GIFTING",
        contextId: post.id,
        contextLabel: post.title,
      });
      res.json({ offer, message: msg });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/gifting/:id/interests/:interestId/choose", requireAuth, (req, res) => {
    try {
      const selected = storage.chooseGiftingInterest(Number(req.params.id), Number(req.params.interestId), req.session.userId!);
      if (!selected) return res.status(404).json({ error: "Interest not found" });
      const post = storage.getGiftingPost(Number(req.params.id));
      const body = String(req.body.body || `You were picked for "${post?.title}". Coordinate pickup here.`).trim();
      storage.sendMessage(req.session.userId!, Number((selected as any).userId), `Gifting pickup: ${post?.title || "Gift"}`, body, {
        contextType: "GIFTING",
        contextId: Number(req.params.id),
        contextLabel: post?.title || null,
      });
      res.json(selected);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/gifting/:id/mark-gifted", requireAuth, (req, res) => {
    try {
      storage.markGiftingResolved(Number(req.params.id), req.session.userId!, "GIFTED");
      res.json({ ok: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/gifting/:id/mark-found", requireAuth, (req, res) => {
    try {
      storage.markGiftingResolved(Number(req.params.id), req.session.userId!, "FOUND");
      res.json({ ok: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/gifting/:id/reopen", requireAuth, (req, res) => {
    try {
      storage.reopenGiftingPost(Number(req.params.id), req.session.userId!);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/gifting/:id/renew", requireAuth, (req, res) => {
    try {
      storage.renewGiftingPost(Number(req.params.id), req.session.userId!);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/gifting/:id/report", requireAuth, (req, res) => {
    try {
      const reason = String(req.body.reason || "").trim();
      if (!reason) return res.status(400).json({ error: "reason required" });
      storage.reportGiftingPost(insertGiftingReportSchema.parse({
        postId: Number(req.params.id),
        reporterUserId: req.session.userId!,
        reason,
      }));
      res.json({ ok: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/gifting/:id", requireAuth, (req, res) => {
    try {
      const user = storage.getUserById(req.session.userId!);
      if (!user) return res.status(401).json({ error: "Not authenticated" });
      storage.deleteGiftingPost(Number(req.params.id), user.id, { isAdmin: isMainAdminUser(user) });
      res.json({ ok: true });
    } catch (e: any) {
      const status = e.message === "Not allowed" ? 403 : e.message === "Post not found" ? 404 : 400;
      res.status(status).json({ error: e.message });
    }
  });

  // ─── USER AUTH ────────────────────────────────────────────────────────────
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, email, password, displayName } = req.body;
      if (!username || !email || !password) {
        return res.status(400).json({ error: "username, email, and password are required" });
      }
      if (username.length < 3) return res.status(400).json({ error: "Username must be at least 3 characters" });
      if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });

      const existingEmail = storage.getUserByEmail(email);
      if (existingEmail) return res.status(409).json({ error: "Email already registered" });

      const existingUsername = storage.getUserByUsername(username);
      if (existingUsername) return res.status(409).json({ error: "Username already taken" });

      const user = storage.createUser({ username, email, passwordHash: password, displayName });
      maybeSyncSiteOwnerPortfolio(user);
      req.session.userId = user.id;
      res.json(authUserResponse(req, user));
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "username/email and password required" });
    // Accept username or email
    const user = storage.getUserByEmail(email) || storage.getUserByUsername(email);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    if (!verifyPassword(password, user.passwordHash)) return res.status(401).json({ error: "Invalid credentials" });
    if (isLegacyPasswordHash(user.passwordHash)) {
      storage.updatePasswordHash(user.id, hashPassword(password));
    }
    const finishLogin = () => {
      req.session.userId = user.id;
      maybeSyncSiteOwnerPortfolio(user);
      res.json(authUserResponse(req, user));
    };
    if (typeof req.session.regenerate === "function") {
      return req.session.regenerate(err => {
        if (err) return res.status(500).json({ error: "Session error" });
        finishLogin();
      });
    }
    finishLogin();
  });

  app.get("/api/auth/google", (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) return res.status(500).send("Google sign-in is not configured.");
    const state = crypto.randomBytes(24).toString("hex");
    req.session.googleOAuthState = state;
    req.session.googleOAuthLinkUserId = req.query.link === "1" && req.session.userId ? req.session.userId : undefined;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: googleRedirectUri(req),
      response_type: "code",
      scope: "openid email profile",
      state,
      prompt: "select_account",
    });
    req.session.save((err) => {
      if (err) {
        console.error("Google OAuth session save failed:", err);
        return res.status(500).send("Could not start Google Sign-In.");
      }
      res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
    });
  });

  app.get("/api/auth/google/callback", async (req, res) => {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const code = String(req.query.code || "");
      const state = String(req.query.state || "");
      if (!clientId || !clientSecret) return res.status(500).send("Google sign-in is not configured.");
      if (!code || !state || state !== req.session.googleOAuthState) {
        return res.status(400).send("Invalid Google sign-in state.");
      }
      req.session.googleOAuthState = undefined;

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: "authorization_code",
          redirect_uri: googleRedirectUri(req),
        }),
      });
      if (!tokenRes.ok) {
        const text = await tokenRes.text();
        console.error("Google token exchange failed:", text);
        return res.status(401).send("Google sign-in failed.");
      }
      const token = await tokenRes.json() as { access_token?: string };
      if (!token.access_token) return res.status(401).send("Google sign-in failed.");

      const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${token.access_token}` },
      });
      if (!profileRes.ok) return res.status(401).send("Google profile lookup failed.");
      const profile = await profileRes.json() as {
        email?: string;
        email_verified?: boolean;
        sub?: string;
        name?: string;
        picture?: string;
      };
      if (!profile.email || profile.email_verified === false) {
        return res.status(401).send("Google email must be verified.");
      }
      if (!profile.sub) return res.status(401).send("Google profile lookup failed.");

      const linkUserId = req.session.googleOAuthLinkUserId;
      req.session.googleOAuthLinkUserId = undefined;

      if (linkUserId) {
        if (req.session.userId !== linkUserId) return res.status(401).send("Google link session expired.");
        const existingGoogleUser = storage.getUserByGoogleId(profile.sub);
        if (existingGoogleUser && existingGoogleUser.id !== linkUserId) {
          return res.status(409).send("That Google account is already linked to another PDX Pride Guide profile.");
        }
        const linkedUser = storage.getUserById(linkUserId);
        if (!linkedUser) return res.status(401).send("Google link session expired.");
        storage.linkGoogleToUser(linkUserId, profile.sub);
        if (!linkedUser.photoUrl && profile.picture) storage.updateUser(linkUserId, { photoUrl: profile.picture });
        markAdminSessionForUser(req, linkedUser);
        return req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Google link session save failed:", saveErr);
            return res.status(500).send("Google sign-in failed.");
          }
          res.redirect("/dashboard?google=linked");
        });
      }

      let user = storage.getUserByGoogleId(profile.sub) || storage.getUserByEmail(profile.email);
      if (!user) {
        user = storage.createUser({
          username: makeUsername(profile.email),
          email: profile.email,
          passwordHash: crypto.randomBytes(32).toString("hex"),
          displayName: profile.name || profile.email.split("@")[0],
          googleId: profile.sub,
        });
        if (profile.picture) storage.updateUser(user.id, { photoUrl: profile.picture });
      } else {
        if (!user.googleId) storage.linkGoogleToUser(user.id, profile.sub);
        if (!user.photoUrl && profile.picture) {
          storage.updateUser(user.id, { photoUrl: profile.picture });
        }
      }

      req.session.userId = user.id;
      maybeSyncSiteOwnerPortfolio(user);
      markAdminSessionForUser(req, user);
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error("Google sign-in session save failed:", saveErr);
          return res.status(500).send("Google sign-in failed.");
        }
        res.redirect("/dashboard");
      });
    } catch (e) {
      console.error("Google sign-in error:", e);
      res.status(500).send("Google sign-in failed.");
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(err => {
      if (err) return res.status(500).json({ error: "Logout failed" });
      res.clearCookie("connect.sid");
      res.json({ ok: true });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.session?.userId) return res.status(401).json({ error: "Not authenticated" });
    const user = storage.getUserById(req.session.userId);
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    res.json(authUserResponse(req, user));
  });

  // Update own profile
  app.put("/api/users/me", requireAuth, (req, res) => {
    const { displayName, avatarChoice, avatarRing, avatarCrop, bio, photoUrl } = req.body;
    const patch: Record<string, unknown> = {};
    if (displayName !== undefined) patch.displayName = displayName;
    if (avatarChoice !== undefined) patch.avatarChoice = avatarChoice;
    if (avatarRing !== undefined) patch.avatarRing = avatarRing || "none";
    if (avatarCrop !== undefined) patch.avatarCrop = avatarCrop || null;
    if (bio !== undefined) patch.bio = bio;
    if (photoUrl !== undefined) patch.photoUrl = photoUrl || null;
    storage.updateUser(req.session.userId!, patch as any);
    const updated = storage.getUserById(req.session.userId!);
    res.json(authUserResponse(req, updated));
  });

  // ─── MISSED CONNECTIONS ──────────────────────────────────────────────────
  app.get("/api/missed-connections/postable-events", requireAuth, (req, res) => {
    const scope = String(req.query.scope || "today");
    if (scope === "board") {
      return res.json(storage.getLinkableEventsForMissedConnections());
    }
    const requireToday = scope === "today";
    const events = storage.getPostableEventsForMissedConnections(requireToday);
    res.json(events.map(evt => ({
      id: evt.id,
      title: evt.title,
      venueName: evt.venueName,
      dayOfWeek: evt.dayOfWeek,
      dateStart: evt.dateStart,
      dateEnd: evt.dateEnd,
    })));
  });

  app.get("/api/missed-connections", (req: any, res) => {
    res.json(storage.getMissedConnections("ACTIVE", req.session?.userId));
  });

  app.get("/api/events/:id/missed-connections", (req: any, res) => {
    const evt = storage.getEvent(Number(req.params.id));
    if (!evt || evt.status !== "LIVE") return res.status(404).json({ error: "Not found" });
    res.json(storage.getMissedConnectionsByEvent(evt.id, req.session?.userId));
  });

  app.get("/api/missed-connections/mine", requireAuth, (req, res) => {
    res.json(storage.getMissedConnectionsByUser(req.session.userId!));
  });

  app.post("/api/missed-connections", requireAuth, (req, res) => {
    try {
      const rawEventId = req.body.eventId;
      const hasEvent = rawEventId !== undefined && rawEventId !== null && rawEventId !== "";
      const eventId = hasEvent ? Number(rawEventId) : null;

      if (hasEvent && !Number.isFinite(eventId)) {
        return res.status(400).json({ error: "Invalid event" });
      }

      let payload: Record<string, unknown>;
      let eventMeta: { title: string; venueName: string; dayOfWeek: string } | null = null;

      const scope = String(req.body.scope || "");
      const boardScope = scope === "board";

      if (eventId != null) {
        const evt = storage.getEvent(eventId);
        if (!evt || evt.status !== "LIVE") return res.status(400).json({ error: "Invalid event" });

        if (boardScope) {
          const strict = isMissedConnectionPostable(evt.dateStart, { requireToday: false });
          payload = {
            ...req.body,
            userId: req.session.userId!,
            eventId,
            dayOfWeek: evt.dayOfWeek,
            venueHint: evt.venueName,
            closesAt: strict.ok && strict.closesAt ? strict.closesAt : generalSpottedClosesAt(),
          };
        } else {
          const requireToday = scope === "today";
          const window = isMissedConnectionPostable(evt.dateStart, { requireToday });
          if (!window.ok) return res.status(400).json({ error: window.reason || "Posting not open for this event" });

          payload = {
            ...req.body,
            userId: req.session.userId!,
            eventId,
            dayOfWeek: evt.dayOfWeek,
            venueHint: evt.venueName,
            closesAt: window.closesAt || missedConnectionClosesAt(evt.dateStart),
          };
        }
        eventMeta = { title: evt.title, venueName: evt.venueName, dayOfWeek: evt.dayOfWeek || "" };
      } else {
        const customLabel = String(req.body.eventLabel || "").trim();
        const venueHint = formatCustomSpottedVenue(
          customLabel,
          String(req.body.venueHint || "").trim(),
        );
        payload = {
          ...req.body,
          userId: req.session.userId!,
          eventId: null,
          dayOfWeek: pacificDayOfWeek(),
          venueHint,
          closesAt: generalSpottedClosesAt(),
        };
      }

      const data = insertMissedConnectionSchema.parse(payload);
      if (data.body.length > 500) return res.status(400).json({ error: "body max is 500 characters" });
      const created = storage.createMissedConnection(data);
      res.json({
        ...created,
        eventTitle: eventMeta?.title ?? null,
        eventVenue: eventMeta?.venueName ?? null,
        eventDay: eventMeta?.dayOfWeek ?? created.dayOfWeek ?? null,
        isMine: true,
        anonymous: false,
      });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put("/api/missed-connections/:id", requireAuth, (req, res) => {
    const patch: any = {};
    ["title", "body", "status"].forEach(k => {
      if (req.body[k] !== undefined) patch[k] = req.body[k];
    });
    if (patch.body && patch.body.length > 500) return res.status(400).json({ error: "body max is 500 characters" });
    const updated = storage.updateMissedConnection(Number(req.params.id), req.session.userId!, patch);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });

  app.delete("/api/missed-connections/:id", requireAuth, (req, res) => {
    storage.deleteMissedConnection(Number(req.params.id), req.session.userId!);
    res.json({ ok: true });
  });

  app.post("/api/missed-connections/:id/reply", requireAuth, (req, res) => {
    const post = storage.getMissedConnection(Number(req.params.id));
    if (!post || post.status !== "ACTIVE") return res.status(404).json({ error: "Not found" });
    if (post.userId === req.session.userId) return res.status(400).json({ error: "Cannot message yourself" });
    const body = String(req.body.body || "").trim();
    if (!body) return res.status(400).json({ error: "body required" });
    const msg = storage.sendMessage(req.session.userId!, post.userId, `Missed Connection: ${post.title}`, body, {
      contextType: "MISSED_CONNECTION",
      contextId: post.id,
      contextLabel: post.title,
    });
    storage.createMissedConnectionThread(msg.threadId, post.id, post.userId, req.session.userId!);
    res.json(msg);
  });

  // ─── MESSAGES ────────────────────────────────────────────────────────────
  app.get("/api/messages/unread-count", requireAuth, (req, res) => {
    res.json({ count: storage.getUnreadCount(req.session.userId!) });
  });

  app.get("/api/messages/inbox", requireAuth, (req, res) => {
    const inbox = storage.getInbox(req.session.userId!).map(m =>
      storage.maskMessageParty(m, req.session.userId!, "inbox"),
    );
    res.json(inbox);
  });

  app.get("/api/messages/sent", requireAuth, (req, res) => {
    const sent = storage.getSentMessages(req.session.userId!).map(m =>
      storage.maskMessageParty(m, req.session.userId!, "sent"),
    );
    res.json(sent);
  });

  app.post("/api/messages/thread/:threadId/reply", requireAuth, (req, res) => {
    const thread = storage.getThread(req.params.threadId);
    const visible = thread.some((m: any) => m.fromUserId === req.session.userId || m.toUserId === req.session.userId);
    if (!visible || thread.length === 0) return res.status(404).json({ error: "Thread not found" });
    const first = thread[0] as any;
    const last = thread[thread.length - 1] as any;
    const toUserId = last.fromUserId === req.session.userId ? last.toUserId : last.fromUserId;
    const body = String(req.body.body || "").trim();
    if (!body) return res.status(400).json({ error: "body required" });
    const msg = storage.sendMessage(req.session.userId!, toUserId, first.subject || "Reply", body, {
      threadId: req.params.threadId,
      contextType: first.contextType || "THREAD",
      contextId: first.contextId || null,
      contextLabel: first.contextLabel || null,
    });
    res.json(msg);
  });

  app.put("/api/messages/:id/read", requireAuth, (req, res) => {
    const ok = storage.markReadForUser(Number(req.params.id), req.session.userId!);
    if (!ok) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  });

  app.get("/api/messages/thread/:threadId", requireAuth, (req, res) => {
    const thread = storage.getThreadForViewer(req.params.threadId, req.session.userId!);
    const visible = thread.some((m: any) => m.fromUserId === req.session.userId || m.toUserId === req.session.userId);
    if (!visible) return res.status(404).json({ error: "Thread not found" });
    const mcThread = storage.getMissedConnectionThread(req.params.threadId);
    const bothRevealed = !mcThread || Boolean(mcThread.poster_revealed && mcThread.replier_revealed);
    res.json({
      messages: thread,
      reveal: mcThread ? {
        posterRevealed: Boolean(mcThread.poster_revealed),
        replierRevealed: Boolean(mcThread.replier_revealed),
        bothRevealed,
        iAmPoster: mcThread.poster_user_id === req.session.userId,
        iRevealed: mcThread.poster_user_id === req.session.userId
          ? Boolean(mcThread.poster_revealed)
          : mcThread.replier_user_id === req.session.userId
            ? Boolean(mcThread.replier_revealed)
            : false,
      } : null,
    });
  });

  app.post("/api/messages/thread/:threadId/reveal", requireAuth, (req, res) => {
    const thread = storage.getThread(req.params.threadId);
    const visible = thread.some((m: any) => m.fromUserId === req.session.userId || m.toUserId === req.session.userId);
    if (!visible) return res.status(404).json({ error: "Thread not found" });
    const updated = storage.revealMissedConnectionIdentity(req.params.threadId, req.session.userId!);
    if (!updated) return res.status(400).json({ error: "Cannot reveal in this thread" });
    res.json({
      reveal: {
        posterRevealed: Boolean(updated.poster_revealed),
        replierRevealed: Boolean(updated.replier_revealed),
        bothRevealed: Boolean(updated.poster_revealed && updated.replier_revealed),
      },
    });
  });

  app.delete("/api/messages/thread/:threadId", requireAuth, (req, res) => {
    const threadId = decodeURIComponent(req.params.threadId || "").trim();
    if (!threadId) return res.status(400).json({ error: "Thread id required" });
    const thread = storage.getThread(threadId);
    const userId = req.session.userId!;
    const visible = thread.some((m: any) => m.fromUserId === userId || m.toUserId === userId);
    if (!visible) return res.status(404).json({ error: "Thread not found" });
    const cleared = storage.softDeleteThread(threadId, userId);
    if (cleared === 0) return res.status(404).json({ error: "Nothing to delete" });
    res.json({ ok: true, cleared });
  });

  app.delete("/api/messages/folder/:folder", requireAuth, (req, res) => {
    const folder = String(req.params.folder || "").toLowerCase();
    if (!["inbox", "sent", "all"].includes(folder)) {
      return res.status(400).json({ error: "folder must be inbox, sent, or all" });
    }
    const cleared = storage.clearInboxFolder(req.session.userId!, folder as "inbox" | "sent" | "all");
    res.json({ ok: true, cleared });
  });

  app.get("/api/events/:id/hosts", (req, res) => {
    const evt = storage.getEvent(Number(req.params.id));
    if (!evt || evt.status !== "LIVE") return res.status(404).json({ error: "Not found" });
    res.json(storage.getEventHosts(evt.id));
  });

  app.post("/api/events/:id/hosts", requireAuth, (req, res) => {
    const evt = storage.getEvent(Number(req.params.id));
    if (!evt || evt.status !== "LIVE") return res.status(404).json({ error: "Not found" });
    if (!sessionIsAdmin(req) && !storage.isUserEventHost(evt.id, req.session.userId!)) {
      return res.status(403).json({ error: "Only event hosts can add co-hosts" });
    }
    const username = String(req.body.username || "").trim();
    const email = String(req.body.email || "").trim();
    const result = storage.addEventCoHost(evt.id, req.session.userId!, username, email);
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result.host);
  });

  app.get("/api/events/:id/talent", (req, res) => {
    const evt = storage.getEvent(Number(req.params.id));
    if (!evt || evt.status !== "LIVE") return res.status(404).json({ error: "Not found" });
    const userId = req.session?.userId;
    const isAdmin = sessionIsAdmin(req);
    const canManage = isAdmin || (userId && storage.isUserEventHost(evt.id, userId));
    const talent = storage.getEventTalent(evt.id, { includePending: Boolean(canManage) });
    res.json(talent);
  });

  app.post("/api/events/:id/talent", requireAuth, (req, res) => {
    const evt = storage.getEvent(Number(req.params.id));
    if (!evt || evt.status !== "LIVE") return res.status(404).json({ error: "Not found" });
    if (!sessionIsAdmin(req) && !storage.isUserEventHost(evt.id, req.session.userId!)) {
      return res.status(403).json({ error: "Only event hosts can add talent" });
    }
    const role = String(req.body.role || "").trim().toUpperCase();
    if (!isEventTalentRole(role)) return res.status(400).json({ error: "Invalid role" });
    const username = String(req.body.username || "").trim();
    if (!username) return res.status(400).json({ error: "username required" });
    const result = storage.addEventTalentByHost(evt.id, req.session.userId!, username, role, { isAdmin: sessionIsAdmin(req) });
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result.talent);
  });

  app.post("/api/events/:id/talent/self", requireAuth, (req, res) => {
    const evt = storage.getEvent(Number(req.params.id));
    if (!evt || evt.status !== "LIVE") return res.status(404).json({ error: "Not found" });
    const role = String(req.body.role || "").trim().toUpperCase();
    if (!isEventTalentRole(role)) return res.status(400).json({ error: "Invalid role" });
    const result = storage.requestEventTalentSelf(evt.id, req.session.userId!, role);
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result);
  });

  app.post("/api/events/:id/talent/:talentId/approve", requireAuth, (req, res) => {
    const talentId = Number(req.params.talentId);
    const result = storage.approveEventTalent(talentId, req.session.userId!, { isAdmin: sessionIsAdmin(req) });
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result.talent);
  });

  app.post("/api/events/:id/talent/:talentId/reject", requireAuth, (req, res) => {
    const talentId = Number(req.params.talentId);
    const result = storage.rejectEventTalent(talentId, req.session.userId!, { isAdmin: sessionIsAdmin(req) });
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result);
  });

  app.get("/api/talent-request/:talentId", requireAuth, (req, res) => {
    const row = storage.getEventTalentById(Number(req.params.talentId));
    if (!row) return res.status(404).json({ error: "Not found" });
    if (!storage.canApproveEventTalent(row.id, req.session.userId!, sessionIsAdmin(req))) {
      return res.status(403).json({ error: "Not authorized" });
    }
    res.json(row);
  });

  app.post("/api/talent-request/:talentId/approve", requireAuth, (req, res) => {
    const talentId = Number(req.params.talentId);
    const userId = req.session.userId!;
    const result = storage.approveEventTalent(talentId, userId, { isAdmin: sessionIsAdmin(req) });
    if (result.error) return res.status(400).json({ error: result.error });
    storage.softDeleteTalentRequestThreads(talentId, userId);
    res.json(result.talent);
  });

  app.post("/api/talent-request/:talentId/reject", requireAuth, (req, res) => {
    const talentId = Number(req.params.talentId);
    const userId = req.session.userId!;
    const result = storage.rejectEventTalent(talentId, userId, { isAdmin: sessionIsAdmin(req) });
    if (result.error) return res.status(400).json({ error: result.error });
    storage.softDeleteTalentRequestThreads(talentId, userId);
    res.json(result);
  });

  app.delete("/api/events/:id/talent/:talentId", requireAuth, (req, res) => {
    const talentId = Number(req.params.talentId);
    const result = storage.removeEventTalent(talentId, req.session.userId!, { isAdmin: sessionIsAdmin(req) });
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result);
  });

  app.get("/api/events/:id/host-messages", (req, res) => {
    const evt = storage.getEvent(Number(req.params.id));
    if (!evt || evt.status !== "LIVE") return res.status(404).json({ error: "Not found" });
    res.json(storage.getHostMessages(Number(req.params.id), 2));
  });

  app.post("/api/events/:id/host-messages", requireAuth, (req, res) => {
    const evt = storage.getEvent(Number(req.params.id));
    if (!evt) return res.status(404).json({ error: "Not found" });
    const user = storage.getUserById(req.session.userId!);
    if (!user || !storage.isUserEventHost(evt.id, user.id)) {
      return res.status(403).json({ error: "Only the event host can post updates" });
    }
    const body = String(req.body.body || "").trim().slice(0, 1000);
    if (!body) return res.status(400).json({ error: "body required" });
    const msg = storage.createHostMessage({ eventId: evt.id, userId: user.id, body });
    const notified = storage.notifyAttendeesOfHostUpdate(evt.id, user.id, evt.title, body);
    res.json({ ...msg, notified });
  });

  app.post("/api/events/:id/transfer", requireAuth, (req, res) => {
    const evt = storage.getEvent(Number(req.params.id));
    if (!evt) return res.status(404).json({ error: "Not found" });
    const user = storage.getUserById(req.session.userId!);
    if (!user || !storage.isUserEventHost(evt.id, user.id)) {
      return res.status(403).json({ error: "Only the current host can transfer this event" });
    }
    const target = String(req.body.target || "").trim();
    const notes = String(req.body.notes || "").trim();
    if (!target) return res.status(400).json({ error: "target required (username or email)" });
    const req2 = storage.createModerationRequest({
      type: "TRANSFER",
      eventId: evt.id,
      eventTitle: evt.title,
      requesterName: user.displayName || user.username,
      requesterEmail: user.email,
      proof: `${target}${notes ? ` — ${notes}` : ""}`,
    });
    res.json(req2);
  });

  app.post("/api/events/:id/message-host", requireAuth, (req, res) => {
    const evt = storage.getEvent(Number(req.params.id));
    if (!evt) return res.status(404).json({ error: "Not found" });
    const hosts = storage.getEventHosts(evt.id);
    const primary = hosts.find((h: any) => h.role === "PRIMARY") || hosts[0];
    let host = primary?.userId ? storage.getUserById(primary.userId) : undefined;
    if (!host && evt.claimedBy) {
      host = storage.getUserByUsername(evt.claimedBy) || storage.getUserByEmail(evt.claimedBy);
    }
    if (!host) return res.status(400).json({ error: "NO_HOST", ticketUrl: evt.ticketUrl });
    if (host.id === req.session.userId) return res.status(400).json({ error: "Cannot message yourself" });
    const body = String(req.body.body || "").trim();
    if (!body) return res.status(400).json({ error: "body required" });
    const msg = storage.sendMessage(req.session.userId!, host.id, `Event: ${evt.title}`, body, {
      contextType: "EVENT_HOST",
      contextId: evt.id,
      contextLabel: evt.title,
    });
    res.json(msg);
  });

  // ─── PROMOTER AUTH ────────────────────────────────────────────────────────
  app.post("/api/promoter/register", (req, res) => {
    try {
      const { name, email, org, password } = req.body;
      if (!name || !email || !password) return res.status(400).json({ error: "name, email, password required" });
      const existing = storage.getPromoterByEmail(email);
      if (existing) return res.status(409).json({ error: "Email already registered" });
      const promoter = storage.createPromoter({ name, email, org, passwordHash: password });
      res.json({ id: promoter.id, name: promoter.name, email: promoter.email, org: promoter.org });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/promoter/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "email and password required" });
    const promoter = storage.getPromoterByEmail(email);
    if (!promoter) return res.status(401).json({ error: "Invalid credentials" });
    if (!verifyPassword(password, promoter.passwordHash)) return res.status(401).json({ error: "Invalid credentials" });
    req.session.promoterId = promoter.id;
    res.json({ id: promoter.id, name: promoter.name, email: promoter.email, org: promoter.org });
  });

  // ─── ADMIN AUTH ───────────────────────────────────────────────────────────
  app.post("/api/admin/login", (req, res) => {
    const { username, password } = req.body;
    if (!password) return res.status(400).json({ error: "password required" });
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) return res.status(401).json({ error: "Invalid credentials" });
    req.session.isAdmin = true;
    res.json({ isAdmin: true, username: ADMIN_USERNAME });
  });

  app.post("/api/admin/logout", (req, res) => {
    req.session.isAdmin = undefined;
    res.json({ ok: true });
  });

  app.get("/api/admin/me", requireAdmin, (req, res) => {
    const user = getSessionAdminUser(req);
    const syncedUser = user ? syncOwnerDisplayName(user) : null;
    res.json({
      isAdmin: true,
      username: syncedUser?.displayName || syncedUser?.username || ADMIN_USERNAME,
      email: syncedUser?.email || null,
      canManageTeam: true,
    });
  });

  app.get("/api/admin/team", requireAdmin, (_req, res) => {
    res.json(storage.listSiteAdmins());
  });

  app.post("/api/admin/team", requireAdmin, (req, res) => {
    const actor = getSessionAdminUser(req);
    const { identifier, note } = req.body || {};
    const result = storage.grantSiteAdminByIdentifier(String(identifier || ""), actor?.id ?? null, note);
    if (result.error) return res.status(400).json({ error: result.error });
    res.json(result.admin);
  });

  app.delete("/api/admin/team/:userId", requireAdmin, (req, res) => {
    const result = storage.revokeSiteAdmin(Number(req.params.userId));
    if (result.error) return res.status(400).json({ error: result.error });
    res.json({ ok: true });
  });

  // ─── ADMIN ────────────────────────────────────────────────────────────────
  app.get("/api/admin/submissions", requireAdmin, (req, res) => {
    const subs = req.query.all === "true" ? storage.getSubmissions() : storage.getSubmissions("PENDING");
    res.json(subs.map(enrichSubmissionForAdmin));
  });

  app.post("/api/admin/submissions/:id/approve", requireAdmin, (req, res) => {
    const { adminName } = req.body;
    if (!adminName) return res.status(400).json({ error: "adminName required" });
    const sub = storage.approveSubmission(Number(req.params.id), adminName);
    if (!sub) return res.status(404).json({ error: "Not found" });
    res.json(sub);
  });

  app.post("/api/admin/submissions/:id/reject", requireAdmin, (req, res) => {
    const { reason } = req.body;
    storage.rejectSubmission(Number(req.params.id), reason || "");
    res.json({ ok: true });
  });

  app.get("/api/admin/talent-requests", requireAdmin, (req, res) => {
    res.json(storage.getPendingTalentForUnclaimedEvents());
  });

  app.post("/api/admin/talent-requests/:talentId/approve", requireAdmin, (req, res) => {
    const approverId = getAdminActorUserId(req);
    if (!approverId) return res.status(401).json({ error: "No admin user account configured" });
    const talentId = Number(req.params.talentId);
    const result = storage.approveEventTalent(talentId, approverId, { isAdmin: true });
    if (result.error) return res.status(400).json({ error: result.error });
    storage.softDeleteTalentRequestThreads(talentId, approverId);
    if (req.session.userId && req.session.userId !== approverId) {
      storage.softDeleteTalentRequestThreads(talentId, req.session.userId);
    }
    res.json(result.talent);
  });

  app.post("/api/admin/talent-requests/:talentId/reject", requireAdmin, (req, res) => {
    const approverId = getAdminActorUserId(req);
    if (!approverId) return res.status(401).json({ error: "No admin user account configured" });
    const talentId = Number(req.params.talentId);
    const result = storage.rejectEventTalent(talentId, approverId, { isAdmin: true });
    if (result.error) return res.status(400).json({ error: result.error });
    storage.softDeleteTalentRequestThreads(talentId, approverId);
    if (req.session.userId && req.session.userId !== approverId) {
      storage.softDeleteTalentRequestThreads(talentId, req.session.userId);
    }
    res.json(result);
  });

  app.get("/api/admin/promoter-requests", requireAdmin, (req, res) => {
    res.json(storage.getPendingPromoterRequests());
  });

  app.post("/api/admin/promoter-requests/:userId/approve", requireAdmin, (req, res) => {
    const userId = Number(req.params.userId);
    const user = storage.getUserById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    storage.setPromoterStatus(userId, "approved");
    res.json({ ok: true, promoterStatus: "approved" });
  });

  app.post("/api/admin/promoter-requests/:userId/deny", requireAdmin, (req, res) => {
    const userId = Number(req.params.userId);
    const user = storage.getUserById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    storage.setPromoterStatus(userId, "rejected");
    res.json({ ok: true, promoterStatus: "rejected" });
  });

  app.get("/api/admin/users", requireAdmin, (req, res) => {
    const q = String(req.query.q || "").trim().toLowerCase();
    const all = storage.getAllUsers ? storage.getAllUsers() : [];
    const filtered = q
      ? all.filter((u: any) =>
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.displayName?.toLowerCase().includes(q)
      )
      : all;
    const sorted = [...filtered].sort((a: any, b: any) => {
      const aTime = Date.parse(a.createdAt || "") || a.id || 0;
      const bTime = Date.parse(b.createdAt || "") || b.id || 0;
      return bTime - aTime;
    });
    res.json(sorted.map(adminUserSummary));
  });

  app.get("/api/admin/users/search", requireAdmin, (req, res) => {
    const q = String(req.query.q || "").trim().toLowerCase();
    if (!q) return res.json([]);
    const all = storage.getAllUsers ? storage.getAllUsers() : [];
    const matches = all.filter((u: any) =>
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.displayName?.toLowerCase().includes(q)
    ).slice(0, 10).map(adminUserSummary);
    res.json(matches);
  });

  app.post("/api/admin/users/:userId/set-sub-admin", requireAdmin, (req, res) => {
    const caller = req.session.userId ? storage.getUserById(req.session.userId) : null;
    if (!isMainAdminUser(caller)) return res.status(403).json({ error: "Super admin only" });
    const userId = Number(req.params.userId);
    const { grant } = req.body as { grant: boolean };
    const target = storage.getUserById(userId);
    if (!target) return res.status(404).json({ error: "User not found" });
    if (isMainAdminUser(target)) return res.status(400).json({ error: "Cannot modify super admin" });
    storage.updateUser(userId, { subAdmin: grant });
    res.json({ ok: true, subAdmin: grant });
  });

  app.post("/api/admin/users/:userId/set-promoter-status", requireAdmin, (req, res) => {
    const userId = Number(req.params.userId);
    const { status } = req.body as { status: string };
    const allowed = ["none", "pending", "approved", "rejected"];
    if (!allowed.includes(status)) return res.status(400).json({ error: "Invalid status" });
    const user = storage.getUserById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    storage.setPromoterStatus(userId, status);
    res.json({ ok: true, promoterStatus: status });
  });

  app.get("/api/admin/events", requireAdmin, (req, res) => {
    const evts = storage.getEvents({});
    res.json(evts.map(enrichEventForAdmin));
  });

  app.get("/api/admin/persistence", requireAdmin, (_req, res) => {
    res.json(getPersistenceAudit(getTableCounts()));
  });

  app.get("/api/admin/pending-count", requireAdmin, (_req, res) => {
    res.json({ count: storage.getAdminPendingCount() });
  });

  app.get("/api/admin/metrics", requireAdmin, (_req, res) => {
    const counts = getTableCounts();
    const pendingSubmissions = storage.getSubmissions("PENDING").length;
    const liveEvents = storage.getEvents({ status: "LIVE" }).length;
    const userSubmittedEvents = storage.countEventsBySource("user_submitted", "LIVE");
    const openFeedback = storage.getFeedbackReports("OPEN").length;
    res.json({
      users: counts.users ?? 0,
      activeSessions: counts.express_sessions ?? 0,
      liveEvents,
      userSubmittedEvents,
      messages: storage.countActiveMessages(),
      attendances: counts.attendances ?? 0,
      pendingSubmissions,
      gigPosts: storage.getGigPosts("LIVE").length,
      giftingPosts: storage.getGiftingPosts().length,
      missedConnections: storage.getMissedConnections("ACTIVE").length,
      openFeedback,
      generatedAt: new Date().toISOString(),
    });
  });

  app.post("/api/admin/users/purge-qa", requireAdmin, (req, res) => {
    const caller = req.session.userId ? storage.getUserById(req.session.userId) : null;
    if (!isMainAdminUser(caller)) return res.status(403).json({ error: "Super admin only" });
    const result = storage.purgeQaTestUsers();
    res.json(result);
  });

  app.get("/api/admin/feedback", requireAdmin, (req, res) => {
    res.json(req.query.all === "true" ? storage.getFeedbackReports() : storage.getFeedbackReports("OPEN"));
  });

  app.post("/api/admin/feedback/:id/resolve", requireAdmin, (req, res) => {
    storage.resolveFeedbackReport(Number(req.params.id));
    res.json({ ok: true });
  });

  // PUT full event edit (admin only)
  app.put("/api/admin/events/:id", requireAdmin, (req, res) => {
    const evt = storage.getEvent(Number(req.params.id));
    if (!evt) return res.status(404).json({ error: "Not found" });
    const allowed = [
      "title", "description", "venueName", "address", "neighborhood", "lat", "lng",
      "dateStart", "dateEnd", "dayOfWeek", "ageRequirement", "admission",
      "ticketUrl", "posterImageUrl", "eventTypes", "status",
      "isPublic", "isHouseParty", "isSexPositive", "nudityOk", "isClaimable",
      "claimedBy", "source",
    ];
    const patch: Record<string, unknown> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) patch[key] = req.body[key];
    }
    if (patch.eventTypes && Array.isArray(patch.eventTypes)) {
      patch.eventTypes = JSON.stringify(patch.eventTypes);
    }
    const updated = storage.updateEvent(Number(req.params.id), patch);
    res.json(updated);
  });

  app.patch("/api/admin/events/:id/claimable", requireAdmin, (req, res) => {
    const { isClaimable } = req.body;
    const evt = storage.getEvent(Number(req.params.id));
    if (!evt) return res.status(404).json({ error: "Not found" });
    storage.toggleClaimable(Number(req.params.id), Boolean(isClaimable));
    res.json({ ok: true });
  });

  // GET admin moderation requests
  app.get("/api/admin/moderation", requireAdmin, (req, res) => {
    const reqs = req.query.all === "true" ? storage.getModerationRequests() : storage.getModerationRequests("PENDING");
    res.json(reqs.map(enrichModerationForAdmin));
  });

  // POST resolve moderation request
  app.post("/api/admin/moderation/:id/resolve", requireAdmin, (req, res) => {
    const { status, adminNotes } = req.body;
    if (!["APPROVED", "REJECTED"].includes(status)) return res.status(400).json({ error: "status must be APPROVED or REJECTED" });
    storage.resolveModerationRequest(Number(req.params.id), status, adminNotes);
    res.json({ ok: true });
  });

  app.post("/api/admin/moderation/dismiss-stale-tests", requireAdmin, (req, res) => {
    const count = storage.dismissStaleTestModerationRequests();
    res.json({ ok: true, dismissed: count });
  });

  app.get("/api/admin/gifting", requireAdmin, (req, res) => {
    res.json({
      posts: storage.getGiftingPosts({ includeInactive: true }).map(post => publicGiftingPost(post)),
      reports: storage.getGiftingReports(),
    });
  });

  app.post("/api/admin/gifting/:id/status", requireAdmin, (req, res) => {
    const status = String(req.body.status || "").trim().toUpperCase();
    if (!status) return res.status(400).json({ error: "status required" });
    storage.updateGiftingPostStatus(Number(req.params.id), status);
    res.json({ ok: true });
  });

  app.post("/api/admin/gifting/reports/:id/resolve", requireAdmin, (req, res) => {
    storage.resolveGiftingReport(Number(req.params.id), String(req.body.adminNotes || ""));
    res.json({ ok: true });
  });

  // ─── ADMIN: GIGS ────────────────────────────────────────────────────────
  app.get("/api/admin/gigs", requireAdmin, (req, res) => {
    res.json(storage.getGigPosts().map(gig => {
      const user = gig.userId ? storage.getUserById(gig.userId) : null;
      return {
        ...gig,
        username: user?.username,
        displayName: user?.displayName,
        posterPhotoUrl: user?.photoUrl ?? null,
        avatarChoice: user?.avatarChoice ?? 1,
        posterAvatarRing: user?.avatarRing || "none",
      };
    }));
  });

  app.post("/api/admin/gigs/:id/status", requireAdmin, (req, res) => {
    const status = String(req.body.status || "").trim().toUpperCase();
    if (!["LIVE", "PENDING", "REMOVED"].includes(status)) return res.status(400).json({ error: "Invalid status" });
    storage.adminUpdateGigStatus(Number(req.params.id), status);
    res.json({ ok: true });
  });

  app.put("/api/admin/gigs/:id", requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    const patch: Record<string, unknown> = {};
    const fields = [
      "postType", "title", "name", "contactEmail", "description", "skills",
      "compensation", "location", "isRemote", "status", "gigDate", "gigTime", "imageUrl",
    ] as const;
    for (const key of fields) {
      if (req.body[key] !== undefined) patch[key] = req.body[key];
    }
    if (patch.postType && !["POSTING_GIG", "LOOKING_FOR_WORK"].includes(String(patch.postType))) {
      return res.status(400).json({ error: "Invalid post type" });
    }
    if (patch.status && !["LIVE", "PENDING", "REMOVED"].includes(String(patch.status).toUpperCase())) {
      return res.status(400).json({ error: "Invalid status" });
    }
    if (patch.status) patch.status = String(patch.status).toUpperCase();
    const updated = storage.adminUpdateGigPost(id, patch as any);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });

  // GET admin inbox summary (notification counts)
  app.get("/api/admin/inbox", requireAdmin, (req, res) => {
    const pendingSubs = storage.getSubmissions("PENDING").length;
    const pendingMod = storage.getModerationRequests("PENDING").length;
    res.json({ pendingSubmissions: pendingSubs, pendingModeration: pendingMod, total: pendingSubs + pendingMod });
  });
}
