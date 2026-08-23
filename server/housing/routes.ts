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
  HOUSING_DATE_KINDS,
  HOUSING_REPORT_REASONS,
  HOUSING_TYPES,
  PLACE_STATUSES,
  hausNameFromProperty,
  stripHausSuffix,
  withinHousingBounds,
  type HousingRequestKind,
  type HousingType,
} from "../../shared/housing";
import { parseHousingTagFilter } from "../../shared/housingTags";
import { canSendHousingNudge } from "../../shared/changeCoalesce";
import {
  addHousingDate,
  addHousingMember,
  addHousingPlace,
  attachHousingRequestThread,
  convertHousingPostType,
  countHousingWaitlist,
  createHousingPost,
  createHousingRequest,
  findMyHausForListing,
  getHousingRequest,
  getMyHousingRequest,
  listHousingDates,
  listHousingPlaces,
  listPendingHousingRequests,
  removeHousingDate,
  removeHousingPlace,
  resolveHousingRequest,
  setHousingPlaceStatus,
  tearDownManagedListing,
  toggleHousingPlaceReaction,
  approvePmApplication,
  createPmApplication,
  getPmApplicationForUser,
  getPropertyManagerByUser,
  listManagerListings,
  listPmApplications,
  listPropertyManagers,
  rejectPmApplication,
  removePropertyManager,
  setPmMembership,
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
  markHousingSaveSeen,
  getHousingRequestByThread,
  markHousingRequestNudged,
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
  /**
   * The existing messaging system. Housing adds a consent gate on top of it and
   * does NOT introduce a second inbox or thread model.
   */
  sendMessage: (
    fromUserId: number,
    toUserId: number,
    subject: string,
    body: string,
    opts?: { threadId?: string; contextType?: string; contextId?: number | null; contextLabel?: string | null },
  ) => { threadId: string } & Record<string, any>;
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

/** Short label for the feed "what changed" chip when an edit omits changeLabel. */
function deriveHousingChangeLabel(patch: Record<string, any>): string | null {
  if (!patch || typeof patch !== "object") return null;
  if ("rent" in patch || "budget" in patch) return "Rent updated";
  if ("photos" in patch) return "New photos";
  if ("isFull" in patch) return patch.isFull ? "Now full" : "Open again";
  if ("seeking" in patch) return "Openings updated";
  if ("moveIn" in patch || "moveTimeline" in patch) return "Timeline updated";
  if ("headline" in patch || "body" in patch || "name" in patch) return "Post updated";
  if ("sourceUrl" in patch) return "Listing link updated";
  // Any other field still resurfaces the card with a generic label.
  const keys = Object.keys(patch).filter((k) => !["changeLabel", "type", "propertyManagerId"].includes(k));
  return keys.length ? "Updated" : null;
}

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
    const demoOnly = String(req.query.demo || "") === "1";
    const posts = listHousingPosts(db, {
      type,
      savedOnly,
      demoOnly,
      tags: parseHousingTagFilter(String(req.query.tags || "")),
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

    /**
     * A room and a seeker both need at least one photo.
     *
     * People are deciding who to live with, and a post with no pictures gives
     * them nothing to go on. It also raises the floor against throwaway and
     * scam posts, which is the cheapest safety win on the board.
     */
    const photos = asArray(req.body?.photos);
    if ((type === "OFFERING" || type === "LOOKING") && photos.length === 0) {
      return res.status(400).json({
        error:
          type === "OFFERING"
            ? "Add at least one photo of the place. The first one is the cover."
            : "Add at least one photo. Something you do, not a photo of your body.",
      });
    }

    // Store the front part only. The locked HAUS suffix is appended on render.
    const rawName = asStr(req.body?.name, 120) || "";
    const name = type === "MANAGED" ? rawName : stripHausSuffix(rawName);

    // Housing geofence is wider than events (metro + Salem corridor). Only
    // reject when coordinates are present and outside the box — posts without
    // lat/lng still publish (neighborhood text is enough).
    const lat = asNum(req.body?.lat);
    const lng = asNum(req.body?.lng);
    if (lat != null && lng != null && !withinHousingBounds(lat, lng)) {
      return res.status(400).json({
        error: "That pin is outside THE HAÜZ region (Portland metro through the Willamette Valley to Salem).",
      });
    }

    const postId = createHousingPost(db, {
      userId,
      type,
      name,
      headline,
      body: asStr(req.body?.body, 4000) || "",
      photos,
      areas: asArray(req.body?.areas),
      // Validated against the post type in normalizeHousingTags: unknown ids,
      // conflicting pairs, platform issued verification, and household tags on
      // a whole unit listing are all dropped here rather than trusted.
      tags: asArray(req.body?.tags),
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
      lat,
      lng,
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
    delete patch.changeLabel;
    if ("name" in patch && post.type !== "MANAGED") {
      patch.name = stripHausSuffix(String(patch.name || ""));
    }
    if ("lat" in patch || "lng" in patch) {
      const lat = asNum(patch.lat) ?? post.lat ?? null;
      const lng = asNum(patch.lng) ?? post.lng ?? null;
      if (lat != null && lng != null && !withinHousingBounds(lat, lng)) {
        return res.status(400).json({
          error: "That pin is outside THE HAÜZ region (Portland metro through the Willamette Valley to Salem).",
        });
      }
    }
    const changeLabel =
      asStr(req.body?.changeLabel, 60) || deriveHousingChangeLabel(patch);
    updateHousingPost(db, id, patch, changeLabel);
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

  /** Clear the "what changed" chip for a saved post (viewer opened it). */
  app.post("/api/housing/:id/seen", requireAuth, (req: any, res: any) => {
    const id = asNum(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });
    const ok = markHousingSaveSeen(db, id, viewerId(req)!);
    res.json({ ok });
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

  // --- the consent gate: request to chat = request to join -------------------

  app.post("/api/housing/:id/request", requireAuth, (req: any, res: any) => {
    const id = asNum(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });
    const userId = viewerId(req)!;
    const post = getHousingPost(db, id, userId);
    if (!post || post.status === "REMOVED") return res.status(404).json({ error: "Not found" });

    // A managed listing is a landlord unit. It links out; it never opens a chat.
    if (post.type === "MANAGED") {
      return res.status(400).json({ error: "Managed listings link out to the manager's own site" });
    }
    const recipientId = getHousingPostOwner(db, id);
    if (!recipientId) return res.status(404).json({ error: "Not found" });
    if (recipientId === userId) return res.status(400).json({ error: "This is your own post" });

    let kind = String(req.body?.kind || "CHAT").toUpperCase() as HousingRequestKind;
    if (!["CHAT", "JOIN", "WAITLIST"].includes(kind)) kind = "CHAT";
    // A full HAUS takes waitlist asks instead of dead-ending the person.
    if (post.type === "FORMING") kind = post.isFull ? "WAITLIST" : "JOIN";

    const note = asStr(req.body?.note, 1000) || "";
    const { id: requestId, existing } = createHousingRequest(db, {
      postId: id,
      requesterUserId: userId,
      recipientUserId: recipientId,
      kind,
      note,
    });
    const current = getHousingRequest(db, requestId);
    if (existing) {
      return res.json({ request: { id: requestId, kind: current?.kind, status: current?.status }, alreadySent: true });
    }

    // The message exists immediately so both sides see it in the floating inbox,
    // but the thread stays pending until the recipient accepts.
    try {
      const label = post.displayName || post.headline.slice(0, 60);
      const subject =
        kind === "WAITLIST"
          ? `Waiting list: ${label}`
          : kind === "JOIN"
            ? `Asked to join ${label}`
            : `THE HAÜZ: ${label}`;
      const msg = deps.sendMessage(userId, recipientId, subject, note || "Asked to chat about this post.", {
        contextType: "HOUSING",
        contextId: id,
        contextLabel: label,
      });
      if (msg?.threadId) attachHousingRequestThread(db, requestId, msg.threadId);
    } catch {
      // The request stands even if the message could not be created.
    }
    res.json({ request: { id: requestId, kind, status: "PENDING" } });
  });

  app.get("/api/housing/:id/requests", requireAuth, (req: any, res: any) => {
    const id = asNum(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });
    const userId = viewerId(req)!;
    if (!isHousingLead(db, id, userId) && !isAdmin(req)) {
      return res.status(403).json({ error: "Not yours to answer" });
    }
    res.json({ requests: listPendingHousingRequests(db, id), waitlist: countHousingWaitlist(db, id) });
  });

  /** Accepting opens the conversation. For a HAUS it also adds the member. */
  app.post("/api/housing/requests/:requestId/accept", requireAuth, (req: any, res: any) => {
    const requestId = asNum(req.params.requestId);
    if (!requestId) return res.status(400).json({ error: "Invalid id" });
    const userId = viewerId(req)!;
    const request = getHousingRequest(db, requestId);
    if (!request) return res.status(404).json({ error: "Not found" });
    if (request.recipient_user_id !== userId && !isHousingLead(db, request.post_id, userId) && !isAdmin(req)) {
      return res.status(403).json({ error: "Not yours to answer" });
    }
    if (request.status !== "PENDING") return res.status(400).json({ error: "Already answered" });

    resolveHousingRequest(db, requestId, "ACCEPTED");
    const post = getHousingPost(db, request.post_id, userId);
    if (post?.type === "FORMING" && request.kind !== "WAITLIST") {
      addHousingMember(db, request.post_id, { kind: "MEMBER", userId: request.requester_user_id, role: "MEMBER" });
      const seeking = Math.max(0, (post.seeking ?? 0) - 1);
      updateHousingPost(
        db,
        request.post_id,
        seeking === 0 ? { seeking, isFull: true } : { seeking },
        seeking === 0 ? "Household is full" : "Someone joined",
      );
    }
    try {
      deps.sendMessage(
        userId,
        request.requester_user_id,
        `Accepted: ${post?.displayName || "THE HAÜZ"}`,
        post?.type === "FORMING" ? "You are in. Welcome to the household." : "Happy to chat.",
        {
          threadId: request.thread_id || undefined,
          contextType: "HOUSING",
          contextId: request.post_id,
          contextLabel: post?.displayName || null,
        },
      );
    } catch {
      /* acceptance stands even if the notice fails */
    }
    res.json({ ok: true, post: getHousingPost(db, request.post_id, userId) });
  });

  /** Declining is quiet: status flips, no notification, no drama. */
  app.post("/api/housing/requests/:requestId/decline", requireAuth, (req: any, res: any) => {
    const requestId = asNum(req.params.requestId);
    if (!requestId) return res.status(400).json({ error: "Invalid id" });
    const userId = viewerId(req)!;
    const request = getHousingRequest(db, requestId);
    if (!request) return res.status(404).json({ error: "Not found" });
    if (request.recipient_user_id !== userId && !isHousingLead(db, request.post_id, userId) && !isAdmin(req)) {
      return res.status(403).json({ error: "Not yours to answer" });
    }
    resolveHousingRequest(db, requestId, "DECLINED");
    res.json({ ok: true });
  });

  app.post("/api/housing/requests/:requestId/withdraw", requireAuth, (req: any, res: any) => {
    const requestId = asNum(req.params.requestId);
    if (!requestId) return res.status(400).json({ error: "Invalid id" });
    const request = getHousingRequest(db, requestId);
    if (!request) return res.status(404).json({ error: "Not found" });
    if (request.requester_user_id !== viewerId(req)) return res.status(403).json({ error: "Not your request" });
    resolveHousingRequest(db, requestId, "WITHDRAWN");
    res.json({ ok: true });
  });

  app.get("/api/housing/requests/by-thread/:threadId", requireAuth, (req: any, res: any) => {
    const threadId = String(req.params.threadId || "").trim();
    if (!threadId) return res.status(400).json({ error: "Invalid thread" });
    const userId = viewerId(req)!;
    const request = getHousingRequestByThread(db, threadId);
    if (!request) return res.status(404).json({ error: "Not found" });
    const isRequester = request.requester_user_id === userId;
    const isRecipient = request.recipient_user_id === userId;
    if (!isRequester && !isRecipient && !isAdmin(req)) {
      return res.status(403).json({ error: "Not your request" });
    }
    const pending = request.status === "PENDING";
    const accepted = request.status === "ACCEPTED";
    res.json({
      requestId: request.id,
      kind: request.kind,
      role: isRequester ? "requester" : "recipient",
      accepted,
      pending,
      awaiting: isRequester && !accepted && request.status !== "WITHDRAWN",
      canNudge: isRequester && canSendHousingNudge(request.created_at, request.nudge_sent_at, Date.now()),
    });
  });

  app.post("/api/housing/requests/:requestId/nudge", requireAuth, (req: any, res: any) => {
    const requestId = asNum(req.params.requestId);
    if (!requestId) return res.status(400).json({ error: "Invalid id" });
    const userId = viewerId(req)!;
    const request = getHousingRequest(db, requestId);
    if (!request) return res.status(404).json({ error: "Not found" });
    if (request.requester_user_id !== userId) return res.status(403).json({ error: "Not your request" });
    if (request.status !== "PENDING") return res.status(400).json({ error: "Not waiting" });
    if (!canSendHousingNudge(request.created_at, request.nudge_sent_at, Date.now())) {
      return res.status(400).json({ error: "Nudge is not available yet" });
    }
    markHousingRequestNudged(db, requestId);
    const post = getHousingPost(db, request.post_id, userId);
    try {
      deps.sendMessage(
        userId,
        request.recipient_user_id,
        `Still hoping to connect: ${post?.displayName || "THE HAÜZ"}`,
        "Just a nudge. Still interested when you have a moment.",
        {
          threadId: request.thread_id || undefined,
          contextType: "HOUSING",
          contextId: request.post_id,
          contextLabel: post?.displayName || null,
        },
      );
    } catch {
      /* nudge stamp stands even if the stub message fails */
    }
    res.json({ ok: true });
  });

  // --- the forming workspace -------------------------------------------------

  const canSeeWorkspace = (req: any, postId: number): boolean => {
    const userId = viewerId(req);
    if (!userId) return false;
    if (isHousingLead(db, postId, userId) || isAdmin(req)) return true;
    const member = db
      .prepare(`SELECT id FROM housing_members WHERE post_id = ? AND user_id = ?`)
      .get(postId, userId) as any;
    return !!member;
  };

  app.get("/api/housing/:id/workspace", requireAuth, (req: any, res: any) => {
    const id = asNum(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });
    if (!canSeeWorkspace(req, id)) return res.status(403).json({ error: "Members only" });
    const userId = viewerId(req)!;
    const lead = isHousingLead(db, id, userId);
    res.json({
      isLead: lead,
      places: listHousingPlaces(db, id),
      dates: listHousingDates(db, id),
      requests: lead ? listPendingHousingRequests(db, id) : [],
      waitlist: countHousingWaitlist(db, id),
    });
  });

  app.post("/api/housing/:id/places", requireAuth, (req: any, res: any) => {
    const id = asNum(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });
    if (!canSeeWorkspace(req, id)) return res.status(403).json({ error: "Members only" });
    const url = asStr(req.body?.url, 500);
    if (!url || !/^https?:\/\//i.test(url)) return res.status(400).json({ error: "Paste a link that starts with http" });
    const placeId = addHousingPlace(db, id, viewerId(req)!, {
      url,
      title: asStr(req.body?.title, 200) || url,
      rent: asStr(req.body?.rent, 80) || undefined,
      neighborhood: asStr(req.body?.neighborhood, 80) || undefined,
    });
    res.json({ id: placeId, places: listHousingPlaces(db, id) });
  });

  app.patch("/api/housing/:id/places/:placeId", requireAuth, (req: any, res: any) => {
    const id = asNum(req.params.id);
    const placeId = asNum(req.params.placeId);
    if (!id || !placeId) return res.status(400).json({ error: "Invalid id" });
    if (!canSeeWorkspace(req, id)) return res.status(403).json({ error: "Members only" });
    const status = String(req.body?.status || "").toUpperCase();
    if (!PLACE_STATUSES.includes(status as any)) return res.status(400).json({ error: "Unknown status" });
    setHousingPlaceStatus(db, id, placeId, status);
    res.json({ places: listHousingPlaces(db, id) });
  });

  app.post("/api/housing/:id/places/:placeId/react", requireAuth, (req: any, res: any) => {
    const id = asNum(req.params.id);
    const placeId = asNum(req.params.placeId);
    if (!id || !placeId) return res.status(400).json({ error: "Invalid id" });
    if (!canSeeWorkspace(req, id)) return res.status(403).json({ error: "Members only" });
    const on = toggleHousingPlaceReaction(db, placeId, viewerId(req)!);
    res.json({ reacted: on, places: listHousingPlaces(db, id) });
  });

  app.delete("/api/housing/:id/places/:placeId", requireAuth, (req: any, res: any) => {
    const id = asNum(req.params.id);
    const placeId = asNum(req.params.placeId);
    if (!id || !placeId) return res.status(400).json({ error: "Invalid id" });
    if (!isHousingLead(db, id, viewerId(req)!) && !isAdmin(req)) {
      return res.status(403).json({ error: "The Lead curates the shortlist" });
    }
    removeHousingPlace(db, id, placeId);
    res.json({ places: listHousingPlaces(db, id) });
  });

  app.post("/api/housing/:id/dates", requireAuth, (req: any, res: any) => {
    const id = asNum(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });
    if (!canSeeWorkspace(req, id)) return res.status(403).json({ error: "Members only" });
    const label = asStr(req.body?.label, 160);
    const dateOn = asStr(req.body?.dateOn, 40);
    if (!label || !dateOn) return res.status(400).json({ error: "A date needs a label and a day" });
    const kind = String(req.body?.kind || "OTHER").toUpperCase();
    const dateId = addHousingDate(db, id, viewerId(req)!, {
      kind: HOUSING_DATE_KINDS.includes(kind as any) ? kind : "OTHER",
      label,
      dateOn,
      note: asStr(req.body?.note, 300) || "",
    });
    res.json({ id: dateId, dates: listHousingDates(db, id) });
  });

  app.delete("/api/housing/:id/dates/:dateId", requireAuth, (req: any, res: any) => {
    const id = asNum(req.params.id);
    const dateId = asNum(req.params.dateId);
    if (!id || !dateId) return res.status(400).json({ error: "Invalid id" });
    if (!isHousingLead(db, id, viewerId(req)!) && !isAdmin(req)) {
      return res.status(403).json({ error: "The Lead manages the dates" });
    }
    removeHousingDate(db, id, dateId);
    res.json({ dates: listHousingDates(db, id) });
  });

  /** Mark the household full, or open it back up. */
  app.post("/api/housing/:id/full", requireAuth, (req: any, res: any) => {
    const id = asNum(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });
    if (!isHousingLead(db, id, viewerId(req)!) && !isAdmin(req)) {
      return res.status(403).json({ error: "Not your household" });
    }
    const isFull = req.body?.isFull !== false;
    updateHousingPost(db, id, { isFull }, isFull ? "We are full" : "Open again");
    res.json({ post: getHousingPost(db, id, viewerId(req)) });
  });

  /**
   * Looking for Housing <-> Forming a HAUS. Same post, same replies, same
   * community context. Only the type changes.
   */
  app.post("/api/housing/:id/convert", requireAuth, (req: any, res: any) => {
    const id = asNum(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });
    const userId = viewerId(req)!;
    if (getHousingPostOwner(db, id) !== userId && !isAdmin(req)) {
      return res.status(403).json({ error: "Not your post" });
    }
    const post = getHousingPost(db, id, userId);
    if (!post) return res.status(404).json({ error: "Not found" });
    if (post.type !== "LOOKING" && post.type !== "FORMING") {
      return res.status(400).json({ error: "Only a seeker post converts" });
    }
    const to = String(req.body?.to || "").toUpperCase();
    if (to !== "LOOKING" && to !== "FORMING") return res.status(400).json({ error: "Convert to LOOKING or FORMING" });
    convertHousingPostType(db, id, to, userId);
    res.json({ post: getHousingPost(db, id, userId) });
  });

  // --- the bridge: build a HAUS from a managed listing ------------------------

  /**
   * Spins up a place-in-mind HAUS pre-seeded from the listing. This never claims
   * or reserves the unit: the listing stays live and rentable, and several groups
   * may form around the same property at once.
   */
  app.post("/api/housing/:id/build-haus", requireAuth, (req: any, res: any) => {
    const id = asNum(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });
    const userId = viewerId(req)!;
    const listing = getHousingPost(db, id, userId);
    if (!listing || listing.type !== "MANAGED") return res.status(404).json({ error: "Not a managed listing" });
    if (listing.gone) return res.status(400).json({ error: "That listing is off the market" });

    // One per person per property.
    const mine = findMyHausForListing(db, id, userId);
    if (mine) return res.json({ postId: mine, alreadyLeading: true });

    const postId = createHousingPost(db, {
      userId,
      type: "FORMING",
      name: hausNameFromProperty(listing.name),
      headline: `Putting together roommates to take ${listing.name} as a household.`,
      body: listing.body || "",
      photos: listing.photos,
      areas: listing.areas,
      rent: listing.rent,
      moveIn: listing.moveIn,
      flavor: "PLACE_IN_MIND",
      seeking: Math.max(1, (listing.beds ?? 2) - 1),
      aroundPostId: id,
    });
    // The unit is the shortlist target, and its availability seeds the dates.
    addHousingPlace(db, postId, userId, {
      url: listing.sourceUrl || `/hausing/${id}`,
      title: `${listing.name} · the target`,
      rent: listing.rent || undefined,
      neighborhood: listing.areas[0],
      isTarget: true,
      managedPostId: id,
    });
    if (listing.moveIn) {
      addHousingDate(db, postId, userId, {
        kind: "MOVE_IN",
        label: "Available from the manager",
        dateOn: listing.moveIn,
        note: "From the managed listing",
      });
    }
    addHousingDate(db, postId, userId, {
      kind: "OTHER",
      label: "Talk to the manager",
      dateOn: new Date().toISOString().slice(0, 10),
      note: "Applications happen on the manager's own site",
    });
    res.json({ postId, post: getHousingPost(db, postId, userId) });
  });

  /**
   * The manager takes a listing down. Attached groups detach and survive, they
   * are never deleted along with it.
   */
  app.post("/api/housing/:id/takedown", requireAuth, (req: any, res: any) => {
    const id = asNum(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });
    const userId = viewerId(req)!;
    const listing = getHousingPost(db, id, userId);
    if (!listing || listing.type !== "MANAGED") return res.status(404).json({ error: "Not a managed listing" });
    const pm = managerFor(userId);
    const mayTakeDown = (pm && listing.manager?.id === pm.id) || isAdmin(req);
    if (!mayTakeDown) return res.status(403).json({ error: "Not your listing" });
    const detached = tearDownManagedListing(db, id);
    res.json({ ok: true, detachedGroups: detached.length });
  });

  // --- property manager accounts ---------------------------------------------
  //
  // Verification is mandatory and free and is never sold. The membership below
  // gates publishing and distribution only, never verification or safety.

  /** What the Managed Property entry point needs to decide what to show. */
  app.get("/api/housing/pm/me", requireAuth, (req: any, res: any) => {
    const userId = viewerId(req)!;
    const pm = getPropertyManagerByUser(db, userId);
    if (!pm || pm.status !== "active") {
      const application = getPmApplicationForUser(db, userId);
      return res.json({
        approved: false,
        application: application
          ? { id: application.id, status: application.status, company: application.company }
          : null,
      });
    }
    res.json({
      approved: true,
      manager: {
        id: pm.id,
        name: pm.name,
        company: pm.company,
        siteDomain: pm.site_domain,
        membershipStatus: pm.membership_status,
        foundingPartner: !!pm.founding_partner,
        firstMonthFree: !!pm.first_month_free,
      },
      listings: listManagerListings(db, pm.id, userId),
    });
  });

  app.post("/api/housing/pm-application", requireAuth, (req: any, res: any) => {
    const userId = viewerId(req)!;
    if (getPropertyManagerByUser(db, userId)) {
      return res.status(400).json({ error: "You are already a verified property manager" });
    }
    const prior = getPmApplicationForUser(db, userId);
    if (prior && prior.status === "PENDING") {
      return res.json({ ok: true, alreadyPending: true, id: prior.id });
    }
    const company = asStr(req.body?.company, 160);
    // Accept short client aliases (site/license/directory) alongside canonical keys.
    const siteUrl = asStr(req.body?.siteUrl ?? req.body?.site, 300);
    const businessLicense = asStr(req.body?.businessLicense ?? req.body?.license, 200) || "";
    const directoryBusinessId = asNum(req.body?.directoryBusinessId ?? req.body?.directory);
    if (!company || !siteUrl) {
      return res.status(400).json({ error: "Company and rental website are both needed" });
    }
    const user = deps.getUserById(userId);
    const id = createPmApplication(db, {
      userId,
      name: asStr(req.body?.name, 120) || user?.displayName || user?.username || "Property manager",
      email: asStr(req.body?.email, 200) || user?.email || "",
      company,
      siteUrl,
      domainProof: asStr(req.body?.domainProof, 500) || "",
      businessLicense,
      directoryBusinessId,
      note: asStr(req.body?.note, 1000) || "",
    });
    // Applications go to the owner, same as the promoter application.
    if (deps.createModerationRequest) {
      try {
        deps.createModerationRequest({
          type: "PROPERTY_MANAGER_APPLICATION",
          eventId: 0,
          eventTitle: `Property manager: ${company}`,
          requesterName: user?.displayName || user?.username || "member",
          requesterEmail: user?.email || null,
          proof: [siteUrl, businessLicense.slice(0, 120) || null, asStr(req.body?.domainProof, 200)]
            .filter(Boolean)
            .join(" · ")
            .slice(0, 500),
        });
      } catch {
        /* the application is recorded either way */
      }
    }
    res.json({ ok: true, id });
  });

  app.get("/api/admin/housing/pm-applications", requireAdmin, (req: any, res: any) => {
    res.json({ applications: listPmApplications(db, String(req.query.status || "PENDING")) });
  });

  app.get("/api/admin/housing/property-managers", requireAdmin, (_req: any, res: any) => {
    res.json({ managers: listPropertyManagers(db) });
  });

  /** Owner only: approving is what creates the account and grants verification. */
  app.post("/api/admin/housing/pm-applications/:id/approve", requireAdmin, (req: any, res: any) => {
    if (!isOwner(req)) return res.status(403).json({ error: "Owner only" });
    const id = asNum(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });
    const result = approvePmApplication(db, id);
    if (!result) return res.status(400).json({ error: "Already answered" });
    res.json({ ok: true, propertyManagerId: result.propertyManagerId });
  });

  app.post("/api/admin/housing/pm-applications/:id/reject", requireAdmin, (req: any, res: any) => {
    if (!isOwner(req)) return res.status(403).json({ error: "Owner only" });
    const id = asNum(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });
    rejectPmApplication(db, id, asStr(req.body?.notes, 500) || undefined);
    res.json({ ok: true });
  });

  /** Owner only: pause or resume publishing. Verification is untouched. */
  app.post("/api/admin/housing/property-managers/:id/membership", requireAdmin, (req: any, res: any) => {
    if (!isOwner(req)) return res.status(403).json({ error: "Owner only" });
    const id = asNum(req.params.id);
    const status = String(req.body?.status || "").toLowerCase();
    if (!id || !["trialing", "active", "lapsed"].includes(status)) {
      return res.status(400).json({ error: "Status must be trialing, active, or lapsed" });
    }
    setPmMembership(db, id, status as any);
    res.json({ ok: true });
  });

  app.delete("/api/admin/housing/property-managers/:id", requireAdmin, (req: any, res: any) => {
    if (!isOwner(req)) return res.status(403).json({ error: "Owner only" });
    const id = asNum(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid id" });
    removePropertyManager(db, id);
    res.json({ ok: true });
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
