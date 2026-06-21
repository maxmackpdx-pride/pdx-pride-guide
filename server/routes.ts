import type { Express } from "express";
import type { Server } from "http";
import { storage, hashPassword } from "./storage";
import { insertSubmissionSchema, insertGigPostSchema, insertModerationRequestSchema, insertAttendanceSchema } from "@shared/schema";
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

function publicEvent(evt: any) {
  const { adminNotes, submittedBy, claimedBy, ...safe } = evt;
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
    res.json(evts.map(publicEvent));
  });

  app.get("/api/events/:id", (req, res) => {
    const evt = storage.getEvent(Number(req.params.id));
    if (!evt) return res.status(404).json({ error: "Not found" });
    res.json(publicEvent(evt));
  });

  // ─── SUBMISSIONS ─────────────────────────────────────────────────────────
  app.post("/api/submit", (req, res) => {
    try {
      const data = insertSubmissionSchema.parse({
        ...req.body,
        eventTypes: JSON.stringify(req.body.eventTypes || []),
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

  app.post("/api/events/:id/attendance", (req, res) => {
    try {
      const data = insertAttendanceSchema.parse({
        ...req.body,
        eventId: Number(req.params.id),
        avatarSeed: req.body.handle + "_" + Date.now(),
      });
      const att = storage.createAttendance(data);
      res.json(att);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // ─── GIGS ─────────────────────────────────────────────────────────────────
  app.get("/api/gigs", (req, res) => {
    const gigs = storage.getGigPosts("LIVE");
    res.json(gigs);
  });

  app.post("/api/gigs", (req, res) => {
    try {
      const data = insertGigPostSchema.parse(req.body);
      const userId = req.session?.userId;
      const gig = storage.createGigPost({ ...data, userId: userId || null } as any);
      res.json(gig);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
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
    if (!email || !password) return res.status(400).json({ error: "email and password required" });
    const user = storage.getUserByEmail(email);
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

  // Look up user by username (for inbox compose)
  app.get("/api/users/by-username/:username", (req, res) => {
    const user = storage.getUserByUsername(req.params.username);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ id: user.id, username: user.username, displayName: user.displayName, avatarChoice: user.avatarChoice });
  });

  // Public user profile
  app.get("/api/users/:id", (req, res) => {
    const user = storage.getUserById(Number(req.params.id));
    if (!user) return res.status(404).json({ error: "Not found" });
    res.json({ id: user.id, username: user.username, displayName: user.displayName, avatarChoice: user.avatarChoice, bio: user.bio });
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

  // ─── MESSAGES ────────────────────────────────────────────────────────────
  app.get("/api/messages/inbox", requireAuth, (req, res) => {
    const inbox = storage.getInbox(req.session.userId!);
    res.json(inbox);
  });

  app.get("/api/messages/sent", requireAuth, (req, res) => {
    const sent = storage.getSentMessages(req.session.userId!);
    res.json(sent);
  });

  app.post("/api/messages", requireAuth, (req, res) => {
    const { toUserId, subject, body } = req.body;
    if (!toUserId || !body) return res.status(400).json({ error: "toUserId and body required" });
    const msg = storage.sendMessage(req.session.userId!, Number(toUserId), subject || "", body);
    res.json(msg);
  });

  app.put("/api/messages/:id/read", requireAuth, (req, res) => {
    storage.markRead(Number(req.params.id));
    res.json({ ok: true });
  });

  app.get("/api/messages/thread/:threadId", requireAuth, (req, res) => {
    const thread = storage.getThread(req.params.threadId);
    res.json(thread);
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
