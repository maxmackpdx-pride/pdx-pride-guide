/**
 * Ad Manager HTTP routes. Registered from routes.ts with shared auth/upload deps.
 */
import type { Express, RequestHandler } from "express";
import type { Database } from "better-sqlite3";
import {
  createAd,
  deleteAd,
  getAd,
  getAdStats,
  listAds,
  recordAdEvent,
  serveAds,
  setAdStatus,
  updateAd,
  type AdStatus,
  type AdWriteInput,
} from "./ads";

type Deps = {
  db: Database;
  requireAdmin: RequestHandler;
  isPrimaryOwner: (user: { id?: number | null } | null | undefined) => boolean;
  getUserById: (id: number) => { id: number } | null | undefined;
  uploadSingle: RequestHandler;
  auditAdmin?: (
    req: any,
    action: string,
    target?: {
      type?: string | null;
      id?: string | number | null;
      label?: string | null;
      detail?: Record<string, unknown> | null;
    },
  ) => void;
};

const STATUSES = new Set(["live", "scheduled", "paused", "ended"]);

function ownerGate(
  deps: Deps,
  req: any,
  res: any,
): { id: number } | null {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  const user = deps.getUserById(userId);
  if (!user || !deps.isPrimaryOwner(user)) {
    res.status(403).json({ error: "Owner only" });
    return null;
  }
  return user;
}

export function registerAdRoutes(app: Express, deps: Deps) {
  const { db, requireAdmin, uploadSingle, auditAdmin } = deps;

  app.get("/api/admin/ads", requireAdmin, (req, res) => {
    if (!ownerGate(deps, req, res)) return;
    res.json(listAds(db));
  });

  app.get("/api/admin/ads/stats", requireAdmin, (req, res) => {
    if (!ownerGate(deps, req, res)) return;
    res.json(getAdStats(db));
  });

  app.get("/api/admin/ads/:id", requireAdmin, (req, res) => {
    if (!ownerGate(deps, req, res)) return;
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const ad = getAd(db, id);
    if (!ad) return res.status(404).json({ error: "Not found" });
    res.json(ad);
  });

  app.post("/api/admin/ads", requireAdmin, (req, res) => {
    const user = ownerGate(deps, req, res);
    if (!user) return;
    try {
      const body = (req.body || {}) as AdWriteInput;
      if (!body.format || (body.format !== "feed" && body.format !== "poster")) {
        return res.status(400).json({ error: "format must be feed or poster" });
      }
      const ad = createAd(db, body, user.id);
      auditAdmin?.(req, "ad_create", {
        type: "ad",
        id: ad.id,
        label: ad.business || ad.title,
      });
      res.status(201).json(ad);
    } catch (e: any) {
      res.status(400).json({ error: e?.message || "Could not create ad" });
    }
  });

  app.patch("/api/admin/ads/:id", requireAdmin, (req, res) => {
    if (!ownerGate(deps, req, res)) return;
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const ad = updateAd(db, id, (req.body || {}) as AdWriteInput);
    if (!ad) return res.status(404).json({ error: "Not found" });
    auditAdmin?.(req, "ad_update", {
      type: "ad",
      id: ad.id,
      label: ad.business || ad.title,
    });
    res.json(ad);
  });

  app.post("/api/admin/ads/:id/status", requireAdmin, (req, res) => {
    if (!ownerGate(deps, req, res)) return;
    const id = Number(req.params.id);
    const status = String(req.body?.status || "") as AdStatus;
    if (!Number.isFinite(id) || !STATUSES.has(status)) {
      return res.status(400).json({ error: "Invalid id or status" });
    }
    const ad = setAdStatus(db, id, status);
    if (!ad) return res.status(404).json({ error: "Not found" });
    auditAdmin?.(req, "ad_status", {
      type: "ad",
      id: ad.id,
      label: ad.business || ad.title,
      detail: { status },
    });
    res.json(ad);
  });

  app.delete("/api/admin/ads/:id", requireAdmin, (req, res) => {
    if (!ownerGate(deps, req, res)) return;
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const existing = getAd(db, id);
    if (!existing) return res.status(404).json({ error: "Not found" });
    deleteAd(db, id);
    auditAdmin?.(req, "ad_delete", {
      type: "ad",
      id,
      label: existing.business || existing.title,
    });
    res.json({ ok: true });
  });

  app.post("/api/admin/upload/ad-asset", requireAdmin, uploadSingle, (req: any, res) => {
    if (!ownerGate(deps, req, res)) return;
    if (!req.file?.filename) return res.status(400).json({ error: "No file" });
    res.json({ url: `/uploads/${req.file.filename}` });
  });

  // Public serve (no contact/billing). Audience is derived from session, not query
  // (clients must not spoof members-only creatives via ?audience=members).
  app.get("/api/ads/serve", (req: any, res) => {
    const surfaceRaw = String(req.query.surface || "feed").toLowerCase();
    const surface = surfaceRaw === "grid" || surfaceRaw === "poster" ? "grid" : "feed";
    const tab = req.query.tab != null ? String(req.query.tab) : undefined;
    const loggedIn = !!req.session?.userId && !!deps.getUserById(req.session.userId);
    const audience = loggedIn ? "members" : "guests";
    try {
      res.json({ ads: serveAds(db, { surface, tab, audience }) });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Serve failed", ads: [] });
    }
  });

  app.post("/api/ads/:id/impression", (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const sessionId =
      typeof req.body?.sessionId === "string"
        ? req.body.sessionId.slice(0, 80)
        : null;
    const surface =
      typeof req.body?.surface === "string" ? req.body.surface.slice(0, 32) : null;
    const result = recordAdEvent(db, id, "impression", { sessionId, surface });
    if (!result.ok && result.reason === "not_found") {
      return res.status(404).json({ error: "Not found" });
    }
    res.json({ ok: result.ok, reason: result.reason });
  });

  app.post("/api/ads/:id/click", (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });
    const sessionId =
      typeof req.body?.sessionId === "string"
        ? req.body.sessionId.slice(0, 80)
        : null;
    const surface =
      typeof req.body?.surface === "string" ? req.body.surface.slice(0, 32) : null;
    const result = recordAdEvent(db, id, "click", { sessionId, surface });
    if (!result.ok && result.reason === "not_found") {
      return res.status(404).json({ error: "Not found" });
    }
    res.json({ ok: result.ok, reason: result.reason });
  });
}
