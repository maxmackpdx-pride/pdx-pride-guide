import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { insertSubmissionSchema, insertGigPostSchema, insertModerationRequestSchema, insertAttendanceSchema } from "@shared/schema";
import crypto from "crypto";

function hashPassword(pw: string) {
  return crypto.createHash("sha256").update(pw + "pdxpride_salt").digest("hex");
}

export function registerRoutes(httpServer: Server, app: Express) {
  // ─── EVENTS ─────────────────────────────────────────────────────────────
  app.get("/api/events", (req, res) => {
    const { day, status } = req.query as { day?: string; status?: string };
    const evts = storage.getEvents({ status: status || "LIVE", day });
    res.json(evts);
  });

  app.get("/api/events/:id", (req, res) => {
    const evt = storage.getEvent(Number(req.params.id));
    if (!evt) return res.status(404).json({ error: "Not found" });
    res.json(evt);
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
      const gig = storage.createGigPost(data);
      res.json(gig);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
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
    res.json({ id: promoter.id, name: promoter.name, email: promoter.email, org: promoter.org });
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
