/**
 * HAUSING HTTP routes. Registered from routes.ts with shared auth/upload deps,
 * following the server/adsRoutes.ts pattern.
 *
 * Spec: docs/HAUS_HOUSING_SPEC_v0.2.md
 *
 * Permission ladder (enforced here, not only in the UI):
 *  - author: edit their own post
 *  - property manager: edit details of their OWN managed listings only
 *  - admin: edit any listing, and soft-hide one (files a review task, never deletes)
 *  - owner only: add/remove property managers, and remove listings
 */
import type { Express, RequestHandler } from "express";
import type { Database } from "better-sqlite3";
import {
  HOUSING_REPORT_REASONS,
  HOUSING_TYPES,
  stripHausSuffix,
  type HousingType,
} from "../../shared/housing";
import {
  addHousingMember,
  createHousingPost,
  getHousingPost,
  getHousingPostOwner,
  getHousingPostsByUser,
  getHousingStats,
  isHousingLead,
  listHousingPosts,
  listHousingReports,
  removeHousingMember,
  reportHousingPost,
  setHousingPostHidden,
  setHousingPostStatus,
  toggleHousingSave,
  updateHousingPost,
} from "./store";

type Deps = {
  db: Database;
  requireAuth: RequestHandler;
  requireAdmin: RequestHandler;
  isPrimaryOwner: (user: any) => boolean;
  getUserById: (id: number) => any;
  uploadPhotos: RequestHandler;
  /** The existing platform moderation queue. Housing adds categories, not a system. */
  createModerationRequest?: (data: any) => void;
};

const asArray = (v: any): string[] =>
  Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean).slice(0, 24) : [];

const asStr = (v: any, max = 2000): string | null => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s ? s.slice(0, max) : null;
};

const asNum = (v: any): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export function registerHousingRoutes(app: Express, deps: Deps) {
  const { db, requireAuth, requireAdmin, uploadPhotos } = deps;

  const viewerId = (req: any): number | null => req.session?.userId ?? null;

  const isAdmin = (req: any): boolean => {
    const id = viewerId(req);
    if (!id) return false;
    const user = deps.getUserById(id);
    return !!user && (user.subAdmin || deps.isPrimaryOwner(user));
  };

  const isOwner = (req: any): boolean => {
    const id = viewerId(req);
    if (!id) return false;
    const user = deps.getUserById(id);
    return !!user && deps.isPrimaryOwner(user);
  };

  /** The property-manager account attached to this session, if any. */
  const managerFor = (userId: number | null) => {
    if (!userId) return null;
    return db
      .prepare(`SELECT * FROM property_managers WHERE user_id = ? AND status = 'active'`)
      .get(userId) as any;
  };

  // --- board ---------------------------------------------------------------

  app.get("/api/housing", (req: any, res: any) => {
    const rawType = String(req.query.type || "").toUpperCase();
    const type = HOUSING_TYPES.includes(rawType as HousingType) ? (rawType as HousingType) : null;
    const savedOnly = String(req.query.filter || "").toUpperCase() === "SAVED";
    const posts = listHousingPosts(db, {
      type,
      savedOnly,
      viewerId: viewerId(req),
      limit: asNum(req.query.limit) ?? 60,
    });
    res.json({ posts, stats: getHousingStats(db) });
  });

  app.get("/api/housing/stats", (_req: any, res: any) => {
    res.json(getHousingStats(db));
  });

  app.get("/api/housing/mine", requireAuth, (req: any, res: any) => {
    const id = viewerId(req)!;
    res.json({ posts: getHousingPostsByUser(db, id, id) });
  });

  app.get("/api/housing/:id", (req: any, res: any) => {
    const id = asNum(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });
    const post = getHousingPost(db, id, viewerId(req));
    if (!post) return res.status(404).json({ error: "Not found" });
    if (post.status === "REMOVED") return res.status(404).json({ error: "Not found" });
    res.json(post);
  });

  // --- create / edit --------------------------------------------------------

  app.post("/api/housing", requireAuth, (req: any, res: any) => {
    const userId = viewerId(req)!;
    const type = String(req.body?.type || "").toUpperCase() as HousingType;
    if (!HOUSING_TYPES.includes(type)) {
      return res.status(400).json({ error: "Pick a post type" });
    }

    // Managed Property is a verified property manager's listing. Verification is
    // mandatory and free; there is no unverified path onto the board.
    let propertyManagerId: number | null = null;
    if (type === "MANAGED") {
      const pm = managerFor(userId);
      if (!pm) {
        return res.status(403).json({ error: "Managed listings come from verified property managers" });
      }
      if (pm.membership_status === "lapsed") {
        return res.status(403).json({ error: "Membership is paused, so listings are not publishing right now" });
      }
      propertyManagerId = pm.id;
    }

    const headline = asStr(req.body?.headline, 240);
    if (!headline) return res.status(400).json({ error: "Add a line about what you are after" });

    // Store the front part only. The locked HAUS suffix is appended on render.
    const rawName = asStr(req.body?.name, 120) || "";
    const name = type === "MANAGED" ? rawName : stripHausSuffix(rawName);

    const postId = createHousingPost(db, {
      userId,
      type,
      name,
      headline,
      body: asStr(req.body?.body, 4000) || "",
      photos: asArray(req.body?.photos),
      areas: asArray(req.body?.areas),
      budget: asStr(req.body?.budget, 80),
      moveTimeline: asStr(req.body?.moveTimeline, 80),
      livingStyle: asArray(req.body?.livingStyle),
      openToHaus: type === "LOOKING" && !!req.body?.openToHaus,
      rent: asStr(req.body?.rent, 80),
      rentNote: asStr(req.body?.rentNote, 240),
      deposit: asStr(req.body?.deposit, 80),
      moveIn: asStr(req.body?.moveIn, 80),
      roomNote: asStr(req.body?.roomNote, 500),
      beds: asNum(req.body?.beds),
      baths: asNum(req.body?.baths),
      parking: asStr(req.body?.parking, 40),
      outdoor: asStr(req.body?.outdoor, 40),
      culture: asArray(req.body?.culture),
      access: asArray(req.body?.access),
      flavor: type === "FORMING" ? (asStr(req.body?.flavor, 40) as any) : null,
      seeking: Math.max(0, Math.min(asNum(req.body?.seeking) ?? 0, 12)),
      goals: asStr(req.body?.goals, 500),
      aroundPostId: asNum(req.body?.aroundPostId),
      propertyManagerId,
      sourceUrl: type === "MANAGED" ? asStr(req.body?.sourceUrl, 500) : null,
      sourceDomain: type === "MANAGED" ? asStr(req.body?.sourceDomain, 120) : null,
      badges: type === "MANAGED" ? asArray(req.body?.badges) : [],
      lat: asNum(req.body?.lat),
      lng: asNum(req.body?.lng),
    });

    res.json(getHousingPost(db, postId, userId));
  });

  app.patch("/api/housing/:id", requireAuth, (req: any, res: any) => {
    const id = asNum(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });
    const userId = viewerId(req)!;
    const post = getHousingPost(db, id, userId);
    if (!post) return res.status(404).json({ error: "Not found" });

    const author = getHousingPostOwner(db, id);
    let allowed = author === userId || isAdmin(req);

    // A property manager may edit the details of their own listings only.
    if (!allowed && post.type === "MANAGED") {
      const pm = managerFor(userId);
      allowed = !!pm && post.manager?.id === pm.id;
    }
    if (!allowed) return res.status(403).json({ error: "Not your post" });

    const patch: Record<string, any> = { ...req.body };
    delete patch.type; // conversion has its own route
    delete patch.propertyManagerId;
    if ("name" in patch && post.type !== "MANAGED") {
      patch.name = stripHausSuffix(String(patch.name || ""));
    }
    updateHousingPost(db, id, patch, asStr(req.body?.changeLabel, 60));
    res.json(getHousingPost(db, id, userId));
  });

  /** Author archives their own post. Removal of a listing is owner-only. */
  app.post("/api/housing/:id/archive", requireAuth, (req: any, res: any) => {
    const id = asNum(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });
    const userId = viewerId(req)!;
    if (getHousingPostOwner(db, id) !== userId && !isAdmin(req)) {
      return res.status(403).json({ error: "Not your post" });
    }
    setHousingPostStatus(db, id, "ARCHIVED");
    res.json({ ok: true });
  });

  app.delete("/api/housing/:id", requireAuth, (req: any, res: any) => {
    if (!isOwner(req)) return res.status(403).json({ error: "Owner only" });
    const id = asNum(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });
    setHousingPostStatus(db, id, "REMOVED");
    res.json({ ok: true });
  });

  /**
   * Admin soft-hide. Pulls the post from public view and files a review task for
   * the owner, who is the only one who can actually remove it.
   */
  app.post("/api/housing/:id/hide", requireAdmin, (req: any, res: any) => {
    const id = asNum(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });
    const hidden = req.body?.hidden !== false;
    setHousingPostHidden(db, id, hidden, viewerId(req)!);
    if (hidden && deps.createModerationRequest) {
      const post = getHousingPost(db, id, null);
      try {
        deps.createModerationRequest({
          type: "HOUSING_HIDE",
          eventId: id,
          eventTitle: post?.displayName || `Housing post ${id}`,
          requesterName: "Admin",
          requesterEmail: "",
          proof: asStr(req.body?.reason, 500) || "Hidden by an admin, pending owner review",
        });
      } catch {
        /* review task is best effort; the hide already took effect */
      }
    }
    res.json({ ok: true, hidden });
  });

  // --- saves ----------------------------------------------------------------

  app.post("/api/housing/:id/save", requireAuth, (req: any, res: any) => {
    const id = asNum(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });
    const saved = toggleHousingSave(db, id, viewerId(req)!);
    res.json({ saved });
  });

  // --- household members ----------------------------------------------------

  app.post("/api/housing/:id/members", requireAuth, (req: any, res: any) => {
    const id = asNum(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });
    const userId = viewerId(req)!;
    if (!isHousingLead(db, id, userId) && !isAdmin(req)) {
      return res.status(403).json({ error: "Not your household" });
    }
    const kind = String(req.body?.kind || "OFFPLATFORM").toUpperCase();
    if (!["MEMBER", "OFFPLATFORM", "PET"].includes(kind)) {
      return res.status(400).json({ error: "Unknown member kind" });
    }
    const memberId = addHousingMember(db, id, {
      kind: kind as any,
      userId: kind === "MEMBER" ? asNum(req.body?.userId) : null,
      name: asStr(req.body?.name, 60) || "",
      photoUrl: asStr(req.body?.photoUrl, 500),
      species: kind === "PET" ? asStr(req.body?.species, 40) : null,
      role: "MEMBER",
    });
    res.json({ id: memberId, post: getHousingPost(db, id, userId) });
  });

  app.delete("/api/housing/:id/members/:memberId", requireAuth, (req: any, res: any) => {
    const id = asNum(req.params.id);
    const memberId = asNum(req.params.memberId);
    if (!id || !memberId) return res.status(400).json({ error: "Invalid id" });
    const userId = viewerId(req)!;
    if (!isHousingLead(db, id, userId) && !isAdmin(req)) {
      return res.status(403).json({ error: "Not your household" });
    }
    removeHousingMember(db, id, memberId);
    res.json({ ok: true, post: getHousingPost(db, id, userId) });
  });

  // --- reports --------------------------------------------------------------

  app.post("/api/housing/:id/report", requireAuth, (req: any, res: any) => {
    const id = asNum(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });
    const reason = String(req.body?.reason || "OTHER").toUpperCase();
    if (!HOUSING_REPORT_REASONS.includes(reason as any)) {
      return res.status(400).json({ error: "Unknown reason" });
    }
    reportHousingPost(db, id, viewerId(req)!, reason, asStr(req.body?.detail, 1000) || "");
    // Surface it to every admin through the existing moderation queue rather
    // than a housing-only inbox.
    if (deps.createModerationRequest) {
      const post = getHousingPost(db, id, null);
      const reporter = deps.getUserById(viewerId(req)!);
      try {
        deps.createModerationRequest({
          type: "HOUSING_REPORT",
          eventId: id,
          eventTitle: post?.displayName || `Housing post ${id}`,
          requesterName: reporter?.displayName || reporter?.username || "member",
          requesterEmail: reporter?.email || null,
          proof: `${reason}: ${asStr(req.body?.detail, 400) || "no detail given"}`,
        });
      } catch {
        /* the report itself is already recorded; queueing is best effort */
      }
    }
    res.json({ ok: true });
  });

  app.get("/api/admin/housing/reports", requireAdmin, (req: any, res: any) => {
    res.json({ reports: listHousingReports(db, String(req.query.status || "PENDING")) });
  });

  // --- photo upload ---------------------------------------------------------

  app.post("/api/upload/housing", requireAuth, uploadPhotos, (req: any, res: any) => {
    const files = Array.isArray(req.files) ? req.files : [];
    if (!files.length) {
      return res.status(400).json({ error: "Upload at least one image (jpg/png/gif/webp)" });
    }
    res.json({ urls: files.map((f: any) => `/uploads/${f.filename}`) });
  });
}
