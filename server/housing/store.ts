/**
 * HAUSING data access.
 *
 * Kept out of server/storage.ts (already 13k lines) and modeled on the
 * server/ads.ts pattern: plain functions taking the better-sqlite3 handle.
 *
 * Spec: docs/HAUS_HOUSING_SPEC_v0.2.md
 * Build brief: docs/HAUS_ENGINEERING_HANDOFF.md
 *
 * Two invariants this file must never break:
 *  1. No query here may rank, hide, or steer posts by a protected characteristic.
 *     Ordering is recency. Filtering is by post type and by the viewer's own saves.
 *  2. No money moves. Rent and deposit columns are display text, nothing more.
 */
import type { Database } from "better-sqlite3";
import {
  housingDisplayName,
  type AffordabilityBadge,
  type FormingFlavor,
  type HousingAuthor,
  type HousingBoardStats,
  type HousingInterestGroup,
  type HousingMemberKind,
  type HousingMemberRole,
  type HousingPerson,
  type HousingPostView,
  type HousingRequestKind,
  type HousingRequestStatus,
  type HousingTrust,
  type HousingType,
  type OutdoorOption,
  type ParkingOption,
} from "../../shared/housing";

const nowIso = () => new Date().toISOString();

function parseJsonArray(raw: unknown): string[] {
  if (typeof raw !== "string" || !raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** "3 days ago" / "2 hours ago". Plain language, no em dashes. */
export function postedLabel(iso: string): string {
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return "just now";
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

type UserRow = {
  id: number;
  username: string;
  display_name: string | null;
  photo_url: string | null;
  avatar_choice: number | null;
  avatar_ring: string | null;
  pronouns: string | null;
  created_at: string;
};

function toAuthor(row: UserRow | undefined): HousingAuthor {
  if (!row) {
    return { userId: 0, displayName: "Someone", username: null, photoUrl: null };
  }
  return {
    userId: row.id,
    displayName: row.display_name || row.username,
    username: row.username,
    photoUrl: row.photo_url,
    avatarChoice: row.avatar_choice ?? 1,
    avatarRing: row.avatar_ring,
    pronouns: row.pronouns,
  };
}

function loadUsers(db: Database, ids: number[]): Map<number, UserRow> {
  const out = new Map<number, UserRow>();
  const unique = Array.from(new Set(ids.filter((n) => Number.isFinite(n) && n > 0)));
  if (!unique.length) return out;
  const placeholders = unique.map(() => "?").join(",");
  const rows = db
    .prepare(
      `SELECT id, username, display_name, photo_url, avatar_choice, avatar_ring, pronouns, created_at
       FROM users WHERE id IN (${placeholders})`,
    )
    .all(...unique) as UserRow[];
  for (const r of rows) out.set(r.id, r);
  return out;
}

/**
 * Community context: real overlap the community already generated.
 * Never a compatibility score, never an input to ordering.
 */
function loadTrust(db: Database, viewerId: number | null, subjectIds: number[]): Map<number, HousingTrust> {
  const out = new Map<number, HousingTrust>();
  if (!subjectIds.length) return out;
  const users = loadUsers(db, subjectIds);

  for (const id of subjectIds) {
    const u = users.get(id);
    const memberSince = u?.created_at ? new Date(u.created_at).getFullYear() : null;
    out.set(id, { memberSince: Number.isFinite(memberSince as number) ? memberSince : null });
  }
  if (!viewerId) return out;

  for (const id of Array.from(new Set(subjectIds))) {
    if (id === viewerId) continue;
    let mutual = 0;
    let events = 0;
    try {
      const row = db
        .prepare(
          `SELECT COUNT(*) AS n FROM follows a
             JOIN follows b ON a.following_id = b.following_id
            WHERE a.follower_id = ? AND b.follower_id = ?`,
        )
        .get(viewerId, id) as { n: number } | undefined;
      mutual = row?.n ?? 0;
    } catch {
      mutual = 0;
    }
    try {
      const row = db
        .prepare(
          `SELECT COUNT(DISTINCT a.event_id) AS n FROM attendances a
             JOIN attendances b ON a.event_id = b.event_id
            WHERE a.user_id = ? AND b.user_id = ?`,
        )
        .get(viewerId, id) as { n: number } | undefined;
      events = row?.n ?? 0;
    } catch {
      events = 0;
    }
    const prev = out.get(id) || {};
    out.set(id, { ...prev, mutualConnections: mutual, eventsTogether: events });
  }
  return out;
}

type PostRow = Record<string, any>;

function loadHousehold(db: Database, postIds: number[]): Map<number, HousingPerson[]> {
  const out = new Map<number, HousingPerson[]>();
  if (!postIds.length) return out;
  const placeholders = postIds.map(() => "?").join(",");
  const rows = db
    .prepare(
      `SELECT * FROM housing_members WHERE post_id IN (${placeholders})
        ORDER BY sort_order ASC, id ASC`,
    )
    .all(...postIds) as any[];
  const users = loadUsers(
    db,
    rows.map((r) => r.user_id).filter(Boolean),
  );
  for (const r of rows) {
    const u = r.user_id ? users.get(r.user_id) : undefined;
    const person: HousingPerson = {
      id: r.id,
      kind: r.kind as HousingMemberKind,
      userId: r.user_id ?? null,
      username: u?.username ?? null,
      name: u ? u.display_name || u.username : r.name,
      photoUrl: u ? u.photo_url : r.photo_url,
      avatarChoice: u?.avatar_choice ?? undefined,
      avatarRing: u?.avatar_ring ?? null,
      species: r.species ?? null,
      role: (r.role || "MEMBER") as HousingMemberRole,
    };
    const list = out.get(r.post_id) || [];
    list.push(person);
    out.set(r.post_id, list);
  }
  return out;
}

/**
 * Groups organizing around a managed listing. Many forming posts point at one
 * listing; building a HAUS never claims or reserves it, and several groups may
 * form around the same unit at once.
 */
function loadInterestGroups(db: Database, managedIds: number[]): Map<number, HousingInterestGroup[]> {
  const out = new Map<number, HousingInterestGroup[]>();
  if (!managedIds.length) return out;
  const placeholders = managedIds.map(() => "?").join(",");
  const rows = db
    .prepare(
      `SELECT p.id, p.name, p.type, p.user_id, p.seeking, p.around_post_id,
              (SELECT COUNT(*) FROM housing_members m WHERE m.post_id = p.id AND m.kind = 'MEMBER') AS member_count
         FROM housing_posts p
        WHERE p.around_post_id IN (${placeholders})
          AND p.type = 'FORMING' AND p.status = 'ACTIVE' AND p.hidden = 0
        ORDER BY p.created_at DESC`,
    )
    .all(...managedIds) as any[];
  const users = loadUsers(db, rows.map((r) => r.user_id));
  for (const r of rows) {
    const list = out.get(r.around_post_id) || [];
    list.push({
      postId: r.id,
      name: housingDisplayName("FORMING", r.name),
      lead: toAuthor(users.get(r.user_id)),
      memberCount: Math.max(r.member_count ?? 0, 1),
      seeking: r.seeking ?? 0,
    });
    out.set(r.around_post_id, list);
  }
  return out;
}

function loadAround(db: Database, aroundIds: number[]) {
  const out = new Map<number, { postId: number; propertyName: string; managerName: string }>();
  if (!aroundIds.length) return out;
  const placeholders = aroundIds.map(() => "?").join(",");
  const rows = db
    .prepare(
      `SELECT p.id, p.name, pm.name AS manager_name, pm.company AS manager_company
         FROM housing_posts p
         LEFT JOIN property_managers pm ON pm.id = p.property_manager_id
        WHERE p.id IN (${placeholders})`,
    )
    .all(...aroundIds) as any[];
  for (const r of rows) {
    out.set(r.id, {
      postId: r.id,
      propertyName: r.name,
      managerName: r.manager_company || r.manager_name || "the manager",
    });
  }
  return out;
}

export type ShapeOpts = { viewerId?: number | null };

/** Turn raw rows into the view the board and cards render. */
export function shapePosts(db: Database, rows: PostRow[], opts: ShapeOpts = {}): HousingPostView[] {
  if (!rows.length) return [];
  const viewerId = opts.viewerId ?? null;
  const ids = rows.map((r) => r.id);
  const authors = loadUsers(db, rows.map((r) => r.user_id));
  const households = loadHousehold(db, ids);
  const trust = loadTrust(db, viewerId, rows.map((r) => r.user_id));

  const managedIds = rows.filter((r) => r.type === "MANAGED").map((r) => r.id);
  const interestGroups = loadInterestGroups(db, managedIds);
  const aroundIds = rows.map((r) => r.around_post_id).filter(Boolean);
  const around = loadAround(db, aroundIds);

  const savedIds = new Set<number>();
  const myRequests = new Map<number, { id: number; kind: HousingRequestKind; status: HousingRequestStatus }>();
  if (viewerId) {
    const placeholders = ids.map(() => "?").join(",");
    const saves = db
      .prepare(`SELECT post_id FROM housing_saves WHERE user_id = ? AND post_id IN (${placeholders})`)
      .all(viewerId, ...ids) as any[];
    for (const s of saves) savedIds.add(s.post_id);
    const reqs = db
      .prepare(
        `SELECT id, post_id, kind, status FROM housing_requests
          WHERE requester_user_id = ? AND post_id IN (${placeholders})
          ORDER BY id DESC`,
      )
      .all(viewerId, ...ids) as any[];
    for (const r of reqs) {
      if (!myRequests.has(r.post_id)) {
        myRequests.set(r.post_id, { id: r.id, kind: r.kind, status: r.status });
      }
    }
  }

  const managers = new Map<number, any>();
  const pmIds = rows.map((r) => r.property_manager_id).filter(Boolean);
  if (pmIds.length) {
    const placeholders = Array.from(new Set(pmIds)).map(() => "?").join(",");
    const pmRows = db
      .prepare(`SELECT id, name, company, site_domain FROM property_managers WHERE id IN (${placeholders})`)
      .all(...Array.from(new Set(pmIds))) as any[];
    for (const p of pmRows) managers.set(p.id, p);
  }

  return rows.map((r) => {
    const type = r.type as HousingType;
    const household = households.get(r.id) || [];
    const memberCount = household.filter((p) => p.kind === "MEMBER" || p.kind === "OFFPLATFORM").length;
    const seeking = r.seeking ?? 0;
    const isFull = !!r.is_full;

    // Open slots are the visual expression of "looking for N more". A full
    // household shows none.
    let openSlots = 0;
    if (type === "FORMING") openSlots = isFull ? 0 : Math.max(seeking, 0);
    else if (type === "OFFERING") openSlots = r.status === "FILLED" ? 0 : 1;

    const trustBase = trust.get(r.user_id) || {};
    const view: HousingPostView = {
      id: r.id,
      type,
      author: toAuthor(authors.get(r.user_id)),
      createdAt: r.created_at,
      updatedAt: r.updated_at || r.created_at,
      postedLabel: postedLabel(r.created_at),
      name: r.name || "",
      displayName: housingDisplayName(type, r.name || ""),
      headline: r.headline || "",
      body: r.body || "",
      photos: parseJsonArray(r.photo_urls),
      areas: parseJsonArray(r.areas),
      status: r.status,
      saved: savedIds.has(r.id),
      trust: trustBase,
      household,
      openSlots,
      lastChangeLabel: r.last_change_label ?? null,
      lat: r.lat ?? null,
      lng: r.lng ?? null,
    };

    if (type === "LOOKING") {
      view.budget = r.budget;
      view.moveTimeline = r.move_timeline;
      view.livingStyle = parseJsonArray(r.living_style);
      view.openToHaus = !!r.open_to_haus;
    }

    if (type === "OFFERING" || type === "MANAGED") {
      view.rent = r.rent;
      view.rentNote = r.rent_note;
      view.deposit = r.deposit;
      view.moveIn = r.move_in;
      view.roomNote = r.room_note;
      view.beds = r.beds ?? null;
      view.baths = r.baths ?? null;
      view.parking = (r.parking as ParkingOption) ?? null;
      view.outdoor = (r.outdoor as OutdoorOption) ?? null;
      view.culture = parseJsonArray(r.culture);
      view.access = parseJsonArray(r.access);
    }

    if (type === "FORMING") {
      view.flavor = (r.flavor as FormingFlavor) ?? null;
      view.seeking = seeking;
      view.isFull = isFull;
      view.goals = r.goals;
      view.rent = r.rent; // combined budget, display text
      view.moveIn = r.move_in;
      view.around = r.around_post_id ? around.get(r.around_post_id) ?? null : null;
      view.myRequest = myRequests.get(r.id) ?? null;
    }

    if (type === "LOOKING" || type === "OFFERING") {
      view.myRequest = myRequests.get(r.id) ?? null;
    }

    if (type === "MANAGED") {
      const pm = r.property_manager_id ? managers.get(r.property_manager_id) : null;
      view.manager = pm
        ? { id: pm.id, name: pm.name, company: pm.company, siteDomain: pm.site_domain }
        : null;
      view.sourceUrl = r.source_url;
      view.sourceDomain = r.source_domain;
      view.badges = parseJsonArray(r.badges) as AffordabilityBadge[];
      view.lastSeenAt = r.last_seen_at;
      view.gone = !!r.gone;
      view.interestGroups = interestGroups.get(r.id) || [];
      view.trust = { ...trustBase, propertyManagerVerified: !!pm };
      // A managed listing is a unit, not a household. No avatar stack.
      view.household = [];
      view.openSlots = 0;
    }

    return view;
  });
}

export type ListOpts = {
  type?: HousingType | null;
  viewerId?: number | null;
  savedOnly?: boolean;
  includeHidden?: boolean;
  limit?: number;
};

/**
 * The board feed. Ordered by recency only. There is deliberately no relevance
 * or compatibility ordering here, and there must never be one.
 */
export function listHousingPosts(db: Database, opts: ListOpts = {}): HousingPostView[] {
  const where: string[] = ["p.status IN ('ACTIVE','FILLED')"];
  const args: any[] = [];
  if (!opts.includeHidden) where.push("p.hidden = 0");
  // Off-market managed listings leave the board.
  where.push("p.gone = 0");
  if (opts.type) {
    where.push("p.type = ?");
    args.push(opts.type);
  }
  if (opts.savedOnly) {
    if (!opts.viewerId) return [];
    where.push("EXISTS (SELECT 1 FROM housing_saves s WHERE s.post_id = p.id AND s.user_id = ?)");
    args.push(opts.viewerId);
  }
  const limit = Math.min(Math.max(opts.limit ?? 60, 1), 200);
  const rows = db
    .prepare(
      `SELECT p.* FROM housing_posts p
        WHERE ${where.join(" AND ")}
        ORDER BY p.created_at DESC, p.id DESC
        LIMIT ${limit}`,
    )
    .all(...args) as PostRow[];
  return shapePosts(db, rows, { viewerId: opts.viewerId });
}

export function getHousingPost(db: Database, id: number, viewerId?: number | null): HousingPostView | null {
  const row = db.prepare(`SELECT * FROM housing_posts WHERE id = ?`).get(id) as PostRow | undefined;
  if (!row) return null;
  const [view] = shapePosts(db, [row], { viewerId: viewerId ?? null });
  return view ?? null;
}

export function getHousingPostsByUser(db: Database, userId: number, viewerId?: number | null): HousingPostView[] {
  const rows = db
    .prepare(`SELECT * FROM housing_posts WHERE user_id = ? AND status != 'REMOVED' ORDER BY created_at DESC`)
    .all(userId) as PostRow[];
  return shapePosts(db, rows, { viewerId: viewerId ?? null });
}

export function getHousingStats(db: Database): HousingBoardStats {
  const one = (sql: string) => (db.prepare(sql).get() as { n: number } | undefined)?.n ?? 0;
  return {
    activePosts: one(`SELECT COUNT(*) AS n FROM housing_posts WHERE status = 'ACTIVE' AND hidden = 0 AND gone = 0`),
    formingHouses: one(
      `SELECT COUNT(*) AS n FROM housing_posts WHERE type = 'FORMING' AND status = 'ACTIVE' AND hidden = 0`,
    ),
    roomsOpen: one(
      `SELECT COUNT(*) AS n FROM housing_posts WHERE type IN ('OFFERING','MANAGED') AND status = 'ACTIVE' AND hidden = 0 AND gone = 0`,
    ),
  };
}

export type CreatePostInput = {
  userId: number;
  type: HousingType;
  name?: string;
  headline?: string;
  body?: string;
  photos?: string[];
  areas?: string[];
  budget?: string | null;
  moveTimeline?: string | null;
  livingStyle?: string[];
  openToHaus?: boolean;
  rent?: string | null;
  rentNote?: string | null;
  deposit?: string | null;
  moveIn?: string | null;
  roomNote?: string | null;
  beds?: number | null;
  baths?: number | null;
  parking?: string | null;
  outdoor?: string | null;
  culture?: string[];
  access?: string[];
  flavor?: FormingFlavor | null;
  seeking?: number;
  goals?: string | null;
  aroundPostId?: number | null;
  propertyManagerId?: number | null;
  sourceUrl?: string | null;
  sourceDomain?: string | null;
  badges?: string[];
  lat?: number | null;
  lng?: number | null;
};

export function createHousingPost(db: Database, input: CreatePostInput): number {
  const now = nowIso();
  const stmt = db.prepare(`
    INSERT INTO housing_posts (
      user_id, type, name, headline, body, photo_urls, areas,
      budget, move_timeline, living_style, open_to_haus,
      rent, rent_note, deposit, move_in, room_note, beds, baths, parking, outdoor, culture, access,
      flavor, seeking, is_full, goals, around_post_id,
      property_manager_id, source_url, source_domain, badges, lat, lng,
      status, created_at, updated_at
    ) VALUES (
      @userId, @type, @name, @headline, @body, @photos, @areas,
      @budget, @moveTimeline, @livingStyle, @openToHaus,
      @rent, @rentNote, @deposit, @moveIn, @roomNote, @beds, @baths, @parking, @outdoor, @culture, @access,
      @flavor, @seeking, 0, @goals, @aroundPostId,
      @propertyManagerId, @sourceUrl, @sourceDomain, @badges, @lat, @lng,
      'ACTIVE', @now, @now
    )
  `);
  const info = stmt.run({
    userId: input.userId,
    type: input.type,
    name: (input.name || "").trim(),
    headline: (input.headline || "").trim(),
    body: (input.body || "").trim(),
    photos: JSON.stringify(input.photos || []),
    areas: JSON.stringify(input.areas || []),
    budget: input.budget ?? null,
    moveTimeline: input.moveTimeline ?? null,
    livingStyle: JSON.stringify(input.livingStyle || []),
    openToHaus: input.openToHaus ? 1 : 0,
    rent: input.rent ?? null,
    rentNote: input.rentNote ?? null,
    deposit: input.deposit ?? null,
    moveIn: input.moveIn ?? null,
    roomNote: input.roomNote ?? null,
    beds: input.beds ?? null,
    baths: input.baths ?? null,
    parking: input.parking ?? null,
    outdoor: input.outdoor ?? null,
    culture: JSON.stringify(input.culture || []),
    access: JSON.stringify(input.access || []),
    flavor: input.flavor ?? null,
    seeking: input.seeking ?? 0,
    goals: input.goals ?? null,
    aroundPostId: input.aroundPostId ?? null,
    propertyManagerId: input.propertyManagerId ?? null,
    sourceUrl: input.sourceUrl ?? null,
    sourceDomain: input.sourceDomain ?? null,
    badges: JSON.stringify(input.badges || []),
    lat: input.lat ?? null,
    lng: input.lng ?? null,
    now,
  });
  const postId = Number(info.lastInsertRowid);

  // The author is the first member of their own household, and the Lead of a
  // forming HAUS.
  if (input.type === "FORMING" || input.type === "OFFERING") {
    db.prepare(
      `INSERT INTO housing_members (post_id, kind, user_id, name, role, sort_order, created_at)
       VALUES (?, 'MEMBER', ?, '', ?, 0, ?)`,
    ).run(postId, input.userId, input.type === "FORMING" ? "LEAD" : "MEMBER", now);
  }
  return postId;
}

const EDITABLE_COLUMNS: Record<string, string> = {
  name: "name",
  headline: "headline",
  body: "body",
  budget: "budget",
  moveTimeline: "move_timeline",
  openToHaus: "open_to_haus",
  rent: "rent",
  rentNote: "rent_note",
  deposit: "deposit",
  moveIn: "move_in",
  roomNote: "room_note",
  beds: "beds",
  baths: "baths",
  parking: "parking",
  outdoor: "outdoor",
  flavor: "flavor",
  seeking: "seeking",
  goals: "goals",
  sourceUrl: "source_url",
  status: "status",
};

const JSON_COLUMNS: Record<string, string> = {
  photos: "photo_urls",
  areas: "areas",
  livingStyle: "living_style",
  culture: "culture",
  access: "access",
  badges: "badges",
};

/** `changeLabel` is what the saved-post resurface shows, e.g. "Rent updated". */
export function updateHousingPost(
  db: Database,
  id: number,
  patch: Record<string, any>,
  changeLabel?: string | null,
): void {
  const sets: string[] = [];
  const args: any[] = [];
  for (const [key, col] of Object.entries(EDITABLE_COLUMNS)) {
    if (!(key in patch)) continue;
    let v = patch[key];
    if (key === "openToHaus") v = v ? 1 : 0;
    sets.push(`${col} = ?`);
    args.push(v ?? null);
  }
  for (const [key, col] of Object.entries(JSON_COLUMNS)) {
    if (!(key in patch)) continue;
    sets.push(`${col} = ?`);
    args.push(JSON.stringify(Array.isArray(patch[key]) ? patch[key] : []));
  }
  if ("isFull" in patch) {
    sets.push(`is_full = ?`);
    args.push(patch.isFull ? 1 : 0);
  }
  if (!sets.length) return;
  sets.push(`updated_at = ?`);
  args.push(nowIso());
  sets.push(`last_change_label = ?`);
  args.push(changeLabel ?? null);
  args.push(id);
  db.prepare(`UPDATE housing_posts SET ${sets.join(", ")} WHERE id = ?`).run(...args);
}

export function setHousingPostStatus(db: Database, id: number, status: string): void {
  db.prepare(`UPDATE housing_posts SET status = ?, updated_at = ? WHERE id = ?`).run(status, nowIso(), id);
}

/** Admin soft-hide. Reversible, and the owner decides whether it comes back. */
export function setHousingPostHidden(db: Database, id: number, hidden: boolean, byUserId: number): void {
  db.prepare(`UPDATE housing_posts SET hidden = ?, hidden_by_user_id = ?, updated_at = ? WHERE id = ?`).run(
    hidden ? 1 : 0,
    byUserId,
    nowIso(),
    id,
  );
}

export function getHousingPostOwner(db: Database, id: number): number | null {
  const row = db.prepare(`SELECT user_id FROM housing_posts WHERE id = ?`).get(id) as { user_id: number } | undefined;
  return row?.user_id ?? null;
}

// --- saves ------------------------------------------------------------------

export function toggleHousingSave(db: Database, postId: number, userId: number): boolean {
  const existing = db
    .prepare(`SELECT id FROM housing_saves WHERE post_id = ? AND user_id = ?`)
    .get(postId, userId) as { id: number } | undefined;
  if (existing) {
    db.prepare(`DELETE FROM housing_saves WHERE id = ?`).run(existing.id);
    return false;
  }
  db.prepare(`INSERT INTO housing_saves (post_id, user_id, seen_updated_at, created_at) VALUES (?, ?, ?, ?)`).run(
    postId,
    userId,
    nowIso(),
    nowIso(),
  );
  return true;
}

// --- household members ------------------------------------------------------

export type MemberInput = {
  kind: HousingMemberKind;
  userId?: number | null;
  name?: string;
  photoUrl?: string | null;
  species?: string | null;
  role?: HousingMemberRole;
};

export function addHousingMember(db: Database, postId: number, input: MemberInput): number {
  const next = db.prepare(`SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM housing_members WHERE post_id = ?`).get(
    postId,
  ) as { n: number };
  const info = db
    .prepare(
      `INSERT INTO housing_members (post_id, kind, user_id, name, photo_url, species, role, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      postId,
      input.kind,
      input.userId ?? null,
      (input.name || "").trim(),
      input.photoUrl ?? null,
      input.species ?? null,
      input.role ?? "MEMBER",
      next.n,
      nowIso(),
    );
  return Number(info.lastInsertRowid);
}

export function removeHousingMember(db: Database, postId: number, memberId: number): void {
  db.prepare(`DELETE FROM housing_members WHERE id = ? AND post_id = ?`).run(memberId, postId);
}

export function setHousingMemberRole(db: Database, postId: number, memberId: number, role: HousingMemberRole): void {
  db.prepare(`UPDATE housing_members SET role = ? WHERE id = ? AND post_id = ?`).run(role, memberId, postId);
}

export function isHousingLead(db: Database, postId: number, userId: number): boolean {
  const row = db
    .prepare(`SELECT id FROM housing_members WHERE post_id = ? AND user_id = ? AND role IN ('LEAD','COLEAD')`)
    .get(postId, userId) as { id: number } | undefined;
  if (row) return true;
  return getHousingPostOwner(db, postId) === userId;
}

// --- reports ----------------------------------------------------------------

export function reportHousingPost(
  db: Database,
  postId: number,
  reporterUserId: number,
  reason: string,
  detail: string,
): void {
  db.prepare(
    `INSERT INTO housing_reports (post_id, reporter_user_id, reason, detail, created_at) VALUES (?, ?, ?, ?, ?)`,
  ).run(postId, reporterUserId, reason, detail || "", nowIso());
  db.prepare(`UPDATE housing_posts SET report_count = report_count + 1 WHERE id = ?`).run(postId);
}

export function listHousingReports(db: Database, status = "PENDING"): any[] {
  return db
    .prepare(`SELECT * FROM housing_reports WHERE status = ? ORDER BY created_at DESC`)
    .all(status) as any[];
}
