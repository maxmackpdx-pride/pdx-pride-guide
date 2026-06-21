import type { Express } from "express";
import type { Server } from "http";
import { storage, hashPassword } from "./storage";
import { insertSubmissionSchema, insertGigPostSchema, insertModerationRequestSchema, insertMissedConnectionSchema } from "@shared/schema";
import crypto from "crypto";
import session from "express-session";
import multer from "multer";
import path from "path";
import fs from "fs";

// ─── File upload setup ────────────────────────────────────────────────────────
const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
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
  }
}

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "Tcasey90";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "dinoLeo!1";

function publicEvent(evt: any, pendingClaimIds: Set<number> = new Set()) {
  const { adminNotes, submittedBy, claimedBy, ...safe } = evt;
  return { ...safe, hasPendingClaim: pendingClaimIds.has(evt.id) };
}

function publicUser(user: any) {
  if (!user) return null;
  const { passwordHash, email, status, ...safe } = user;
  return safe;
}

function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

function requireAdmin(req: any, res: any, next: any) {
  if (!req.session?.isAdmin) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

export function registerRoutes(httpServer: Server, app: Express) {
  // Session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || "pdxpride_secret_2026",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // set true behind HTTPS proxy
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  }));

  // ─── FILE UPLOADS ───────────────────────────────────────────────────────
  // Poster image upload (event submit / claim edit)
  app.post("/api/upload/poster", requireAuth, upload.single("poster"), (req: any, res: any) => {
    if (!req.file) return res.status(400).json({ error: "No file or invalid type (jpg/png/gif/webp, max 8MB)" });
    res.json({ url: `/uploads/${req.file.filename}` });
  });

  // Profile photo upload
  app.post("/api/upload/avatar", requireAuth, upload.single("avatar"), async (req: any, res: any) => {
    if (!req.file) return res.status(400).json({ error: "No file or invalid type" });
    const url = `/uploads/${req.file.filename}`;
    storage.updateUser(req.session.userId!, { photoUrl: url });
    res.json({ url });
  });

  // Serve uploaded files statically
  app.use("/uploads", (req: any, res: any, next: any) => {
    const express = require("express");
    express.static(UPLOADS_DIR)(req, res, next);
  });

  // ─── EVENTS ─────────────────────────────────────────────────────────────
  app.get("/api/events", (req, res) => {
    const { status, day } = req.query;
    const evts = storage.getEvents({ status: "LIVE", day: day as string });
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

  app.get("/api/events/:id", (req, res) => {
    const evt = storage.getEvent(Number(req.params.id));
    if (!evt) return res.status(404).json({ error: "Not found" });
    const pendingClaimIds = new Set(storage.getPendingClaimEventIds());
    res.json(publicEvent(evt, pendingClaimIds));
  });

  // ─── SUBMISSIONS ─────────────────────────────────────────────────────────
  app.post("/api/submit", requireAuth, (req, res) => {
    try {
      const user = storage.getUserById(req.session.userId!);
      if (!user) return res.status(401).json({ error: "Not authenticated" });
      const type = req.body.type === "CLAIM" ? "CLAIM" : "NEW_EVENT";
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
      res.json(sub);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // ─── CLAIMED EVENT EDIT (owner only) ──────────────────────────────────────
  // Returns events claimed by the logged-in user
  app.get("/api/events/mine/claimed", requireAuth, (req, res) => {
    const username = storage.getUserById(req.session.userId!)?.username;
    if (!username) return res.status(404).json({ error: "User not found" });
    const all = storage.getEvents({});
    const mine = all.filter(e => e.claimedBy === username);
    res.json(mine);
  });

  app.get("/api/events/mine/submitted", requireAuth, (req, res) => {
    const user = storage.getUserById(req.session.userId!);
    if (!user) return res.status(404).json({ error: "User not found" });
    const mine = storage.getSubmissions().filter(s => s.submitterEmail === user.email);
    res.json(mine);
  });

  app.get("/api/events/mine/check-ins", requireAuth, (req, res) => {
    res.json(storage.getAttendancesByUser(req.session.userId!));
  });

  // Owner edits a claimed event (all fields, goes back to pending review)
  app.put("/api/events/:id/edit", requireAuth, (req, res) => {
    const evt = storage.getEvent(Number(req.params.id));
    if (!evt) return res.status(404).json({ error: "Not found" });
    const user = storage.getUserById(req.session.userId!);
    if (!user || evt.claimedBy !== user.username) return res.status(403).json({ error: "Not your event" });
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

  // ─── MODERATION REQUESTS (claim/remove) ──────────────────────────────────
  app.post("/api/moderation-request", (req, res) => {
    try {
      const data = insertModerationRequestSchema.parse(req.body);
      const req2 = storage.createModerationRequest(data);
      res.json(req2);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // ─── ATTENDANCE ───────────────────────────────────────────────────────────
  app.get("/api/events/:id/attendance", (req, res) => {
    const list = storage.getAttendances(Number(req.params.id));
    res.json(list);
  });

  app.post("/api/events/:id/attendance", requireAuth, (req, res) => {
    try {
      const user = storage.getUserById(req.session.userId!);
      if (!user) return res.status(401).json({ error: "Not authenticated" });
      const message = String(req.body.message || "").trim();
      if (!message) return res.status(400).json({ error: "message required" });
      const att = storage.upsertAttendance(Number(req.params.id), user, message);
      res.json(att);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/events/:id/attendance", requireAuth, (req, res) => {
    storage.removeAttendance(Number(req.params.id), req.session.userId!);
    res.json({ ok: true });
  });

  app.post("/api/events/:eventId/attendance/:attendanceId/message", requireAuth, (req, res) => {
    const list = storage.getAttendances(Number(req.params.eventId));
    const att = list.find((a: any) => a.id === Number(req.params.attendanceId));
    if (!att?.userId) return res.status(404).json({ error: "Check-in not found" });
    if (att.userId === req.session.userId) return res.status(400).json({ error: "Cannot message yourself" });
    const body = String(req.body.body || "").trim();
    if (!body) return res.status(400).json({ error: "body required" });
    const evt = storage.getEvent(Number(req.params.eventId));
    const msg = storage.sendMessage(req.session.userId!, Number(att.userId), `Check-in: ${evt?.title || "Event"}`, body, {
      contextType: "CHECK_IN",
      contextId: Number(req.params.eventId),
      contextLabel: evt?.title || null,
    });
    res.json(msg);
  });

  // ─── GIGS ─────────────────────────────────────────────────────────────────
  app.get("/api/gigs", (req, res) => {
    const gigs = storage.getGigPosts("LIVE");
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
      req.session.userId = user.id;
      res.json({
        id: user.id, username: user.username, email: user.email,
        displayName: user.displayName, avatarChoice: user.avatarChoice, bio: user.bio,
      });
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
    const hashed = hashPassword(password);
    if (user.passwordHash !== hashed) return res.status(401).json({ error: "Invalid credentials" });
    req.session.userId = user.id;
    res.json({
      id: user.id, username: user.username, email: user.email,
      displayName: user.displayName, avatarChoice: user.avatarChoice,
      bio: user.bio, photoUrl: user.photoUrl,
    });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.userId = undefined;
    res.json({ ok: true });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.session?.userId) return res.status(401).json({ error: "Not authenticated" });
    const user = storage.getUserById(req.session.userId);
    if (!user) return res.status(401).json({ error: "Not authenticated" });
    res.json({
      id: user.id, username: user.username, email: user.email,
      displayName: user.displayName, avatarChoice: user.avatarChoice,
      bio: user.bio, photoUrl: user.photoUrl,
    });
  });

  // Update own profile
  app.put("/api/users/me", requireAuth, (req, res) => {
    const { displayName, avatarChoice, bio } = req.body;
    storage.updateUser(req.session.userId!, { displayName, avatarChoice, bio });
    const updated = storage.getUserById(req.session.userId!);
    res.json({
      id: updated!.id, username: updated!.username, email: updated!.email,
      displayName: updated!.displayName, avatarChoice: updated!.avatarChoice,
      bio: updated!.bio, photoUrl: updated!.photoUrl,
    });
  });

  // ─── MISSED CONNECTIONS ──────────────────────────────────────────────────
  app.get("/api/missed-connections", requireAuth, (req, res) => {
    res.json(storage.getMissedConnections("ACTIVE"));
  });

  app.get("/api/missed-connections/mine", requireAuth, (req, res) => {
    res.json(storage.getMissedConnectionsByUser(req.session.userId!));
  });

  app.post("/api/missed-connections", requireAuth, (req, res) => {
    try {
      const data = insertMissedConnectionSchema.parse({ ...req.body, userId: req.session.userId! });
      if (data.body.length > 500) return res.status(400).json({ error: "body max is 500 characters" });
      res.json(storage.createMissedConnection(data));
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put("/api/missed-connections/:id", requireAuth, (req, res) => {
    const patch: any = {};
    ["title", "body", "dayOfWeek", "venueHint", "status"].forEach(k => {
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
    const post = storage.getMissedConnections("ACTIVE").find((m: any) => m.id === Number(req.params.id));
    if (!post) return res.status(404).json({ error: "Not found" });
    if (post.userId === req.session.userId) return res.status(400).json({ error: "Cannot message yourself" });
    const body = String(req.body.body || "").trim();
    if (!body) return res.status(400).json({ error: "body required" });
    const msg = storage.sendMessage(req.session.userId!, post.userId, `Missed Connection: ${post.title}`, body, {
      contextType: "MISSED_CONNECTION",
      contextId: post.id,
      contextLabel: post.title,
    });
    res.json(msg);
  });

  // ─── MESSAGES ────────────────────────────────────────────────────────────
  app.get("/api/messages/unread-count", requireAuth, (req, res) => {
    res.json({ count: storage.getUnreadCount(req.session.userId!) });
  });

  app.get("/api/messages/inbox", requireAuth, (req, res) => {
    const inbox = storage.getInbox(req.session.userId!);
    res.json(inbox);
  });

  app.get("/api/messages/sent", requireAuth, (req, res) => {
    const sent = storage.getSentMessages(req.session.userId!);
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
    storage.markRead(Number(req.params.id));
    res.json({ ok: true });
  });

  app.get("/api/messages/thread/:threadId", requireAuth, (req, res) => {
    const thread = storage.getThread(req.params.threadId);
    const visible = thread.some((m: any) => m.fromUserId === req.session.userId || m.toUserId === req.session.userId);
    if (!visible) return res.status(404).json({ error: "Thread not found" });
    res.json(thread);
  });

  app.delete("/api/messages/thread/:threadId", requireAuth, (req, res) => {
    storage.softDeleteThread(req.params.threadId, req.session.userId!);
    res.json({ ok: true });
  });

  app.post("/api/events/:id/message-host", requireAuth, (req, res) => {
    const evt = storage.getEvent(Number(req.params.id));
    if (!evt) return res.status(404).json({ error: "Not found" });
    if (!evt.claimedBy) return res.status(400).json({ error: "NO_HOST", ticketUrl: evt.ticketUrl });
    const host = storage.getUserByUsername(evt.claimedBy) || storage.getUserByEmail(evt.claimedBy);
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
    const hashed = hashPassword(password);
    if (promoter.passwordHash !== hashed) return res.status(401).json({ error: "Invalid credentials" });
    req.session.promoterId = promoter.id;
    res.json({ id: promoter.id, name: promoter.name, email: promoter.email, org: promoter.org });
  });

  // ─── ADMIN AUTH ───────────────────────────────────────────────────────────
  app.post("/api/admin/login", (req, res) => {
    const { username, password } = req.body;
    if (!password) return res.status(400).json({ error: "password required" });
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) return res.status(401).json({ error: "Invalid credentials" });
    req.session.isAdmin = true;
    res.json({ isAdmin: true });
  });

  app.post("/api/admin/logout", (req, res) => {
    req.session.isAdmin = undefined;
    res.json({ ok: true });
  });

  app.get("/api/admin/me", (req, res) => {
    if (!req.session?.isAdmin) return res.status(401).json({ error: "Not authenticated" });
    res.json({ isAdmin: true });
  });

  // ─── ADMIN ────────────────────────────────────────────────────────────────
  app.get("/api/admin/submissions", (req, res) => {
    const subs = storage.getSubmissions("PENDING");
    res.json(subs);
  });

  app.post("/api/admin/submissions/:id/approve", (req, res) => {
    const { adminName } = req.body;
    if (!adminName) return res.status(400).json({ error: "adminName required" });
    const sub = storage.approveSubmission(Number(req.params.id), adminName);
    if (!sub) return res.status(404).json({ error: "Not found" });
    res.json(sub);
  });

  app.post("/api/admin/submissions/:id/reject", (req, res) => {
    const { reason } = req.body;
    storage.rejectSubmission(Number(req.params.id), reason || "");
    res.json({ ok: true });
  });

  app.get("/api/admin/events", (req, res) => {
    const evts = storage.getEvents({});
    res.json(evts);
  });

  // PUT full event edit (admin only)
  app.put("/api/admin/events/:id", (req, res) => {
    if (!req.session.isAdmin) return res.status(403).json({ error: "Forbidden" });
    const evt = storage.getEvent(Number(req.params.id));
    if (!evt) return res.status(404).json({ error: "Not found" });
    const updated = storage.updateEvent(Number(req.params.id), req.body);
    res.json(updated);
  });

  app.patch("/api/admin/events/:id/claimable", (req, res) => {
    const { isClaimable } = req.body;
    const evt = storage.getEvent(Number(req.params.id));
    if (!evt) return res.status(404).json({ error: "Not found" });
    storage.toggleClaimable(Number(req.params.id), Boolean(isClaimable));
    res.json({ ok: true });
  });

  // GET admin moderation requests
  app.get("/api/admin/moderation", (req, res) => {
    const reqs = storage.getModerationRequests("PENDING");
    res.json(reqs);
  });

  // POST resolve moderation request
  app.post("/api/admin/moderation/:id/resolve", (req, res) => {
    const { status, adminNotes } = req.body;
    if (!["APPROVED", "REJECTED"].includes(status)) return res.status(400).json({ error: "status must be APPROVED or REJECTED" });
    storage.resolveModerationRequest(Number(req.params.id), status, adminNotes);
    res.json({ ok: true });
  });

  // GET admin inbox summary (notification counts)
  app.get("/api/admin/inbox", (req, res) => {
    const pendingSubs = storage.getSubmissions("PENDING").length;
    const pendingMod = storage.getModerationRequests("PENDING").length;
    res.json({ pendingSubmissions: pendingSubs, pendingModeration: pendingMod, total: pendingSubs + pendingMod });
  });
}
