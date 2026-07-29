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
import { HOUSING_TAG_BY_ID, derivedHousingTags, normalizeHousingTags } from "../../shared/housingTags";

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

/**
 * A post's stored tags plus the verification tags the platform issues. Identity
 * and leaseholder verification are facts we hold, not claims a poster types, so
 * they live in trust and are merged in at read time.
 */
function mergeTags(stored: string[], trust: HousingTrust): string[] {
  const out = [...stored];
  for (const id of derivedHousingTags(trust)) if (!out.includes(id)) out.push(id);
  return out;
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
  /** post_id → seen_updated_at (ISO). Drives per-viewer "what changed" chip. */
  const saveSeenAt = new Map<number, string | null>();
  const myRequests = new Map<number, { id: number; kind: HousingRequestKind; status: HousingRequestStatus }>();
  if (viewerId) {
    const placeholders = ids.map(() => "?").join(",");
    const saves = db
      .prepare(
        `SELECT post_id, seen_updated_at FROM housing_saves WHERE user_id = ? AND post_id IN (${placeholders})`,
      )
      .all(viewerId, ...ids) as any[];
    for (const s of saves) {
      savedIds.add(s.post_id);
      saveSeenAt.set(s.post_id, s.seen_updated_at ?? null);
    }
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
    // "What changed" chip is per-viewer: only for savers who have not yet seen
    // this updated_at (seen_updated_at < post.updated_at). ISO string compare is fine.
    let lastChangeLabel: string | null = null;
    if (savedIds.has(r.id) && r.last_change_label) {
      const updatedAt = r.updated_at || r.created_at || "";
      const seenAt = saveSeenAt.get(r.id) ?? null;
      if (!seenAt || updatedAt > seenAt) {
        lastChangeLabel = r.last_change_label;
      }
    }
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
      // Stored tags plus the two the platform issues from trust. Verification
      // is never self-claimed, so it is merged in here rather than persisted.
      tags: mergeTags(parseJsonArray(r.tags), trustBase),
      status: r.status,
      saved: savedIds.has(r.id),
      trust: trustBase,
      household,
      openSlots,
      lastChangeLabel,
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
      // Combined budget is often stored in budget while rent stays empty; surface either.
      view.rent = r.rent || r.budget || null;
      view.budget = r.budget ?? null;
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
      view.tags = mergeTags(parseJsonArray(r.tags), view.trust);
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
  /** Tag ids. A post must carry every one of them (AND, not OR). */
  tags?: string[];
};

/**
 * The board feed. Ordered by activity recency only (created, or last update so
 * saved-post edits can resurface). There is deliberately no relevance or
 * compatibility ordering here, and there must never be one.
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

  /*
   * Tag filtering. A viewer narrowing the board is choosing what THEY see, so
   * this is a filter and never an ordering input: whatever survives still comes
   * back newest first.
   *
   * Stored tags filter in SQL. Matching on the quoted id inside the JSON array
   * is exact, because the surrounding quotes stop "quiet-hours" from matching
   * "strict-quiet-hours". Derived tags are not in the column, so they filter
   * after shaping.
   */
  const wanted = opts.tags?.filter((t) => HOUSING_TAG_BY_ID[t]) ?? [];
  const derivedWanted = wanted.filter((t) => HOUSING_TAG_BY_ID[t].derived);
  for (const id of wanted) {
    if (HOUSING_TAG_BY_ID[id].derived) continue;
    where.push("p.tags LIKE ?");
    args.push(`%"${id}"%`);
  }

  /*
   * Fetch a bit wide, then shape + condense. Condensation is one post per
   * (author, type) on the unfiltered board so one person cannot bury the feed
   * with five rooms of the same type — different types still all show (demo
   * board: Offering + Looking + Forming + Managed from the same demo user).
   */
  const limit = Math.min(Math.max(opts.limit ?? 60, 1), 200);
  const fetchLimit = Math.min(limit * 3, 200);
  const rows = db
    .prepare(
      `SELECT p.* FROM housing_posts p
        WHERE ${where.join(" AND ")}
        ORDER BY COALESCE(p.updated_at, p.created_at) DESC, p.id DESC
        LIMIT ${fetchLimit}`,
    )
    .all(...args) as PostRow[];
  let shaped = shapePosts(db, rows, { viewerId: opts.viewerId });
  if (derivedWanted.length) {
    shaped = shaped.filter((p) => derivedWanted.every((t) => p.tags.includes(t)));
  }

  // Saved filter and single-type filter: show everything the query matched.
  // Main board: condense same-author same-type duplicates.
  if (!opts.savedOnly && !opts.type) {
    const seen = new Set<string>();
    shaped = shaped.filter((p) => {
      const key = `${p.author?.userId ?? 0}:${p.type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  return shaped.slice(0, limit);
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
  tags?: string[];
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
      user_id, type, name, headline, body, photo_urls, areas, tags,
      budget, move_timeline, living_style, open_to_haus,
      rent, rent_note, deposit, move_in, room_note, beds, baths, parking, outdoor, culture, access,
      flavor, seeking, is_full, goals, around_post_id,
      property_manager_id, source_url, source_domain, badges, lat, lng,
      status, created_at, updated_at
    ) VALUES (
      @userId, @type, @name, @headline, @body, @photos, @areas, @tags,
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
    tags: JSON.stringify(normalizeHousingTags(input.tags, input.type)),
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
  tags: "tags",
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
    if (key === "tags") {
      // Re-validated against this post's own type, so an edit cannot smuggle in
      // a tag the type is not allowed to carry.
      const type = (db.prepare(`SELECT type FROM housing_posts WHERE id = ?`).get(id) as any)?.type;
      args.push(JSON.stringify(normalizeHousingTags(patch[key], type)));
      continue;
    }
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

/** Mark a saved post's update as seen so the "what changed" chip clears for this viewer. */
export function markHousingSaveSeen(db: Database, postId: number, userId: number): boolean {
  const existing = db
    .prepare(`SELECT id FROM housing_saves WHERE post_id = ? AND user_id = ?`)
    .get(postId, userId) as { id: number } | undefined;
  if (!existing) return false;
  db.prepare(`UPDATE housing_saves SET seen_updated_at = ? WHERE post_id = ? AND user_id = ?`).run(
    nowIso(),
    postId,
    userId,
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

// --- requests: the consent gate -------------------------------------------
//
// First contact is a request the recipient accepts or declines, not an open DM.
// Asking to chat and asking to join a HAUS are the SAME gesture, which is why one
// table covers both. Nothing opens until the recipient accepts, and declining is
// quiet: no notification drama, no second chance to pester.

export type RequestInput = {
  postId: number;
  requesterUserId: number;
  recipientUserId: number;
  kind: HousingRequestKind;
  note?: string;
};

export function getHousingRequest(db: Database, id: number): any | undefined {
  return db.prepare(`SELECT * FROM housing_requests WHERE id = ?`).get(id) as any;
}

/** The viewer's own live request against a post, if any. */
export function getMyHousingRequest(db: Database, postId: number, userId: number): any | undefined {
  return db
    .prepare(
      `SELECT * FROM housing_requests
        WHERE post_id = ? AND requester_user_id = ?
        ORDER BY id DESC LIMIT 1`,
    )
    .get(postId, userId) as any;
}

export function createHousingRequest(db: Database, input: RequestInput): { id: number; existing: boolean } {
  const prior = getMyHousingRequest(db, input.postId, input.requesterUserId);
  // Re-asking after a decline is not allowed, and re-asking while pending is a
  // no-op rather than a way to nag.
  if (prior && (prior.status === "PENDING" || prior.status === "ACCEPTED")) {
    return { id: prior.id, existing: true };
  }
  if (prior && prior.status === "DECLINED") {
    return { id: prior.id, existing: true };
  }
  const info = db
    .prepare(
      `INSERT INTO housing_requests (post_id, requester_user_id, recipient_user_id, kind, status, note, created_at)
       VALUES (?, ?, ?, ?, 'PENDING', ?, ?)`,
    )
    .run(
      input.postId,
      input.requesterUserId,
      input.recipientUserId,
      input.kind,
      (input.note || "").slice(0, 1000),
      nowIso(),
    );
  return { id: Number(info.lastInsertRowid), existing: false };
}

export function attachHousingRequestThread(db: Database, id: number, threadId: string): void {
  db.prepare(`UPDATE housing_requests SET thread_id = ? WHERE id = ?`).run(threadId, id);
}

export function resolveHousingRequest(
  db: Database,
  id: number,
  status: "ACCEPTED" | "DECLINED" | "WITHDRAWN",
): void {
  db.prepare(`UPDATE housing_requests SET status = ?, resolved_at = ? WHERE id = ?`).run(status, nowIso(), id);
}

/** Pending asks the Lead or poster still has to answer. */
export function listPendingHousingRequests(db: Database, postId: number): any[] {
  const rows = db
    .prepare(
      `SELECT r.*, u.username, u.display_name, u.photo_url, u.avatar_choice, u.avatar_ring, u.pronouns
         FROM housing_requests r
         JOIN users u ON u.id = r.requester_user_id
        WHERE r.post_id = ? AND r.status = 'PENDING'
        ORDER BY r.created_at ASC`,
    )
    .all(postId) as any[];
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    note: r.note,
    createdAt: r.created_at,
    threadId: r.thread_id,
    person: {
      userId: r.requester_user_id,
      displayName: r.display_name || r.username,
      username: r.username,
      photoUrl: r.photo_url,
      avatarChoice: r.avatar_choice,
      avatarRing: r.avatar_ring,
      pronouns: r.pronouns,
    },
  }));
}

/** Everyone waiting on a full HAUS, in the order they asked. */
export function listHousingWaitlist(db: Database, postId: number): any[] {
  return db
    .prepare(
      `SELECT r.*, u.username, u.display_name, u.photo_url
         FROM housing_requests r
         JOIN users u ON u.id = r.requester_user_id
        WHERE r.post_id = ? AND r.kind = 'WAITLIST' AND r.status = 'PENDING'
        ORDER BY r.created_at ASC`,
    )
    .all(postId) as any[];
}

export function countHousingWaitlist(db: Database, postId: number): number {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS n FROM housing_requests
        WHERE post_id = ? AND kind = 'WAITLIST' AND status = 'PENDING'`,
    )
    .get(postId) as { n: number } | undefined;
  return row?.n ?? 0;
}

// --- the forming workspace --------------------------------------------------

/**
 * The shared shortlist. These are external links the group bookmarks for itself.
 * Zaylist does not host or re-list these properties, which is what keeps the
 * shortlist a private planning tool rather than a rental listing service.
 */
export function listHousingPlaces(db: Database, postId: number): any[] {
  const places = db
    .prepare(`SELECT * FROM housing_places WHERE post_id = ? ORDER BY sort_order ASC, id ASC`)
    .all(postId) as any[];
  if (!places.length) return [];
  const ids = places.map((p) => p.id);
  const ph = ids.map(() => "?").join(",");
  const reactions = db
    .prepare(`SELECT place_id, COUNT(*) AS n FROM housing_place_reactions WHERE place_id IN (${ph}) GROUP BY place_id`)
    .all(...ids) as any[];
  const comments = db
    .prepare(`SELECT place_id, COUNT(*) AS n FROM housing_place_comments WHERE place_id IN (${ph}) GROUP BY place_id`)
    .all(...ids) as any[];
  const rMap = new Map(reactions.map((r) => [r.place_id, r.n]));
  const cMap = new Map(comments.map((c) => [c.place_id, c.n]));
  const users = loadUsers(db, places.map((p) => p.added_by_user_id));
  return places.map((p) => ({
    id: p.id,
    url: p.url,
    title: p.title,
    rent: p.rent,
    neighborhood: p.neighborhood,
    sourceDomain: p.source_domain,
    thumbUrl: p.thumb_url,
    status: p.status,
    isTarget: !!p.is_target,
    managedPostId: p.managed_post_id,
    addedBy: users.get(p.added_by_user_id)?.display_name || users.get(p.added_by_user_id)?.username || "Someone",
    reactions: rMap.get(p.id) ?? 0,
    comments: cMap.get(p.id) ?? 0,
    createdAt: p.created_at,
  }));
}

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function addHousingPlace(
  db: Database,
  postId: number,
  userId: number,
  input: { url: string; title?: string; rent?: string; neighborhood?: string; isTarget?: boolean; managedPostId?: number | null },
): number {
  const next = db
    .prepare(`SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM housing_places WHERE post_id = ?`)
    .get(postId) as { n: number };
  const info = db
    .prepare(
      `INSERT INTO housing_places
        (post_id, added_by_user_id, url, title, rent, neighborhood, source_domain, status, is_target, managed_post_id, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'INTERESTED', ?, ?, ?, ?)`,
    )
    .run(
      postId,
      userId,
      input.url,
      (input.title || input.url).slice(0, 200),
      input.rent ?? null,
      input.neighborhood ?? null,
      domainOf(input.url),
      input.isTarget ? 1 : 0,
      input.managedPostId ?? null,
      next.n,
      nowIso(),
    );
  return Number(info.lastInsertRowid);
}

export function setHousingPlaceStatus(db: Database, postId: number, placeId: number, status: string): void {
  db.prepare(`UPDATE housing_places SET status = ? WHERE id = ? AND post_id = ?`).run(status, placeId, postId);
}

export function removeHousingPlace(db: Database, postId: number, placeId: number): void {
  db.prepare(`DELETE FROM housing_place_reactions WHERE place_id = ?`).run(placeId);
  db.prepare(`DELETE FROM housing_place_comments WHERE place_id = ?`).run(placeId);
  db.prepare(`DELETE FROM housing_places WHERE id = ? AND post_id = ?`).run(placeId, postId);
}

export function toggleHousingPlaceReaction(db: Database, placeId: number, userId: number, emoji = "♥"): boolean {
  const existing = db
    .prepare(`SELECT id FROM housing_place_reactions WHERE place_id = ? AND user_id = ?`)
    .get(placeId, userId) as { id: number } | undefined;
  if (existing) {
    db.prepare(`DELETE FROM housing_place_reactions WHERE id = ?`).run(existing.id);
    return false;
  }
  db.prepare(`INSERT INTO housing_place_reactions (place_id, user_id, emoji, created_at) VALUES (?, ?, ?, ?)`).run(
    placeId,
    userId,
    emoji,
    nowIso(),
  );
  return true;
}

/** The dates a real house hunt runs on. Rides the platform reminder system. */
export function listHousingDates(db: Database, postId: number): any[] {
  const rows = db
    .prepare(`SELECT * FROM housing_dates WHERE post_id = ? ORDER BY date_on ASC, sort_order ASC`)
    .all(postId) as any[];
  const users = loadUsers(db, rows.map((r) => r.created_by_user_id));
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    label: r.label,
    dateOn: r.date_on,
    note: r.note,
    remindAt: r.remind_at,
    addedBy: users.get(r.created_by_user_id)?.display_name || users.get(r.created_by_user_id)?.username || "Someone",
  }));
}

export function addHousingDate(
  db: Database,
  postId: number,
  userId: number,
  input: { kind?: string; label: string; dateOn: string; note?: string },
): number {
  const info = db
    .prepare(
      `INSERT INTO housing_dates (post_id, created_by_user_id, kind, label, date_on, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(postId, userId, input.kind || "OTHER", input.label.slice(0, 160), input.dateOn, (input.note || "").slice(0, 300), nowIso());
  return Number(info.lastInsertRowid);
}

export function removeHousingDate(db: Database, postId: number, dateId: number): void {
  db.prepare(`DELETE FROM housing_dates WHERE id = ? AND post_id = ?`).run(dateId, postId);
}

// --- conversion and teardown ------------------------------------------------

/**
 * Looking for Housing <-> Forming a HAUS. The SAME post, its replies, and its
 * community context all survive; only the type changes. Converting to a HAUS
 * makes the poster its Lead. Converting back archives the workspace as JSON so
 * nothing is lost if they flip again.
 */
export function convertHousingPostType(db: Database, postId: number, to: "LOOKING" | "FORMING", userId: number): void {
  const now = nowIso();
  if (to === "FORMING") {
    const archived = db.prepare(`SELECT archived_workspace FROM housing_posts WHERE id = ?`).get(postId) as any;
    // A Looking post has no house name, so a straight conversion would render as
    // a bare "HAÜS". Seed one from the poster's first name; they can rename it.
    const current = db.prepare(`SELECT name FROM housing_posts WHERE id = ?`).get(postId) as any;
    if (!String(current?.name || "").trim()) {
      const author = db.prepare(`SELECT username, display_name FROM users WHERE id = ?`).get(userId) as any;
      const seed = String(author?.display_name || author?.username || "").trim().split(/\s+/)[0];
      if (seed) db.prepare(`UPDATE housing_posts SET name = ? WHERE id = ?`).run(seed, postId);
    }
    db.prepare(
      `UPDATE housing_posts SET type = 'FORMING', flavor = COALESCE(flavor, 'FIND_TOGETHER'),
        updated_at = ?, last_change_label = 'Now forming a HAÜS', archived_workspace = NULL WHERE id = ?`,
    ).run(now, postId);
    const lead = db
      .prepare(`SELECT id FROM housing_members WHERE post_id = ? AND user_id = ?`)
      .get(postId, userId) as any;
    if (lead) {
      db.prepare(`UPDATE housing_members SET role = 'LEAD' WHERE id = ?`).run(lead.id);
    } else {
      db.prepare(
        `INSERT INTO housing_members (post_id, kind, user_id, name, role, sort_order, created_at)
         VALUES (?, 'MEMBER', ?, '', 'LEAD', 0, ?)`,
      ).run(postId, userId, now);
    }
    // Restore a workspace archived by an earlier flip back to LOOKING.
    if (archived?.archived_workspace) {
      try {
        const snap = JSON.parse(archived.archived_workspace);
        for (const p of snap.places || []) {
          addHousingPlace(db, postId, userId, {
            url: p.url,
            title: p.title,
            rent: p.rent,
            neighborhood: p.neighborhood,
            isTarget: p.isTarget,
          });
        }
        for (const d of snap.dates || []) {
          addHousingDate(db, postId, userId, { kind: d.kind, label: d.label, dateOn: d.dateOn, note: d.note });
        }
      } catch {
        /* a corrupt snapshot must not block the conversion */
      }
    }
    return;
  }

  // Back to LOOKING: snapshot the workspace, then clear it.
  const snapshot = JSON.stringify({
    places: listHousingPlaces(db, postId),
    dates: listHousingDates(db, postId),
    archivedAt: now,
  });
  db.prepare(
    `UPDATE housing_posts SET type = 'LOOKING', is_full = 0, updated_at = ?,
      last_change_label = 'Back to looking', archived_workspace = ? WHERE id = ?`,
  ).run(now, snapshot, postId);
  const places = db.prepare(`SELECT id FROM housing_places WHERE post_id = ?`).all(postId) as any[];
  for (const p of places) removeHousingPlace(db, postId, p.id);
  db.prepare(`DELETE FROM housing_dates WHERE post_id = ?`).run(postId);
}

/**
 * A property manager takes a listing down.
 *
 * Every HAUS that formed around it is notified and DETACHED, not deleted: the
 * group survives the listing. Each one converts to find-a-place-together, its
 * shortlist target flips to Passed, and the seeded manager dates are replaced by
 * a single "keep hunting together" beat.
 */
export function tearDownManagedListing(db: Database, managedPostId: number): number[] {
  const now = nowIso();
  db.prepare(`UPDATE housing_posts SET gone = 1, updated_at = ?, last_change_label = 'Off the market' WHERE id = ?`).run(
    now,
    managedPostId,
  );
  const attached = db
    .prepare(`SELECT id, areas FROM housing_posts WHERE around_post_id = ? AND type = 'FORMING'`)
    .all(managedPostId) as any[];
  for (const g of attached) {
    db.prepare(
      `UPDATE housing_posts
          SET flavor = 'FIND_TOGETHER', around_post_id = NULL, updated_at = ?,
              last_change_label = 'The place came off the market'
        WHERE id = ?`,
    ).run(now, g.id);
    db.prepare(
      `UPDATE housing_places SET status = 'PASSED', is_target = 0
        WHERE post_id = ? AND managed_post_id = ?`,
    ).run(g.id, managedPostId);
    db.prepare(`DELETE FROM housing_dates WHERE post_id = ? AND kind IN ('LEASE','APPLICATION')`).run(g.id);
    db.prepare(
      `INSERT INTO housing_dates (post_id, created_by_user_id, kind, label, date_on, note, created_at)
       SELECT ?, user_id, 'OTHER', 'Keep hunting together', ?, 'The listing came off the market', ?
         FROM housing_posts WHERE id = ?`,
    ).run(g.id, now.slice(0, 10), now, g.id);
  }
  return attached.map((g) => g.id);
}

/** One Build-a-HAUS per person per property. No spam, no land grab. */
export function findMyHausForListing(db: Database, managedPostId: number, userId: number): number | null {
  const row = db
    .prepare(
      `SELECT id FROM housing_posts
        WHERE around_post_id = ? AND user_id = ? AND type = 'FORMING' AND status != 'REMOVED'`,
    )
    .get(managedPostId, userId) as { id: number } | undefined;
  return row?.id ?? null;
}

// --- property managers ------------------------------------------------------
//
// A verified property manager is its own account type, modeled on promoters.
// Verification is MANDATORY and FREE and is never sold: you cannot buy your way
// onto the board. The Affirming Housing Partner membership gates publishing and
// distribution only, never verification or any safety step.

export function getPropertyManagerByUser(db: Database, userId: number): any | undefined {
  return db.prepare(`SELECT * FROM property_managers WHERE user_id = ?`).get(userId) as any;
}

export function getPropertyManager(db: Database, id: number): any | undefined {
  return db.prepare(`SELECT * FROM property_managers WHERE id = ?`).get(id) as any;
}

export function listPropertyManagers(db: Database): any[] {
  return db.prepare(`SELECT * FROM property_managers ORDER BY created_at DESC`).all() as any[];
}

export function listManagerListings(db: Database, propertyManagerId: number, viewerId?: number | null) {
  const rows = db
    .prepare(
      `SELECT * FROM housing_posts
        WHERE property_manager_id = ? AND status != 'REMOVED'
        ORDER BY created_at DESC`,
    )
    .all(propertyManagerId) as PostRow[];
  return shapePosts(db, rows, { viewerId: viewerId ?? null });
}

export type PmApplicationInput = {
  userId: number;
  name: string;
  email: string;
  company: string;
  siteUrl: string;
  domainProof?: string;
  businessLicense?: string;
  directoryBusinessId?: number | null;
  note?: string;
};

export function createPmApplication(db: Database, input: PmApplicationInput): number {
  const info = db
    .prepare(
      `INSERT INTO property_manager_applications
        (user_id, name, email, company, site_url, domain_proof, business_license, directory_business_id, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.userId,
      input.name,
      input.email,
      input.company,
      input.siteUrl,
      input.domainProof || "",
      input.businessLicense || "",
      input.directoryBusinessId ?? null,
      input.note || "",
      nowIso(),
    );
  return Number(info.lastInsertRowid);
}

export function getPmApplicationForUser(db: Database, userId: number): any | undefined {
  return db
    .prepare(`SELECT * FROM property_manager_applications WHERE user_id = ? ORDER BY id DESC LIMIT 1`)
    .get(userId) as any;
}

export function listPmApplications(db: Database, status = "PENDING"): any[] {
  return db
    .prepare(`SELECT * FROM property_manager_applications WHERE status = ? ORDER BY created_at ASC`)
    .all(status) as any[];
}

/**
 * Owner-only approval. This is what creates the property-manager account, and it
 * is the moment verification is granted. Founding partners are the first three
 * managers on the board and get six months; everyone else gets the first month.
 */
export function approvePmApplication(db: Database, applicationId: number): { propertyManagerId: number } | null {
  const app = db
    .prepare(`SELECT * FROM property_manager_applications WHERE id = ?`)
    .get(applicationId) as any;
  if (!app || app.status !== "PENDING") return null;

  const existingCount = (db.prepare(`SELECT COUNT(*) AS n FROM property_managers`).get() as { n: number }).n;
  const foundingPartner = existingCount < 3;
  const now = nowIso();
  let domain = "";
  try {
    domain = new URL(app.site_url.startsWith("http") ? app.site_url : `https://${app.site_url}`).hostname.replace(
      /^www\./,
      "",
    );
  } catch {
    domain = String(app.site_url || "").replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  }

  const info = db
    .prepare(
      `INSERT INTO property_managers
        (user_id, name, email, company, business_id, site_url, site_domain, status, verified_at,
         membership_status, first_month_free, founding_partner, membership_started_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, 'trialing', 1, ?, ?, ?)`,
    )
    .run(
      app.user_id,
      app.name,
      app.email,
      app.company,
      app.directory_business_id ?? null,
      app.site_url,
      domain,
      now,
      foundingPartner ? 1 : 0,
      now,
      now,
    );
  const propertyManagerId = Number(info.lastInsertRowid);
  db.prepare(
    `UPDATE property_manager_applications SET status = 'APPROVED', created_property_manager_id = ? WHERE id = ?`,
  ).run(propertyManagerId, applicationId);
  return { propertyManagerId };
}

export function rejectPmApplication(db: Database, applicationId: number, notes?: string): void {
  db.prepare(`UPDATE property_manager_applications SET status = 'REJECTED', owner_notes = ? WHERE id = ?`).run(
    notes || null,
    applicationId,
  );
}

/**
 * Membership gates PUBLISHING, never verification. A lapsed member stays a
 * verified account; their listings simply stop publishing until they resume.
 */
export function setPmMembership(db: Database, propertyManagerId: number, status: "trialing" | "active" | "lapsed"): void {
  db.prepare(`UPDATE property_managers SET membership_status = ? WHERE id = ?`).run(status, propertyManagerId);
  const hidden = status === "lapsed" ? 1 : 0;
  db.prepare(`UPDATE housing_posts SET hidden = ?, updated_at = ? WHERE property_manager_id = ?`).run(
    hidden,
    nowIso(),
    propertyManagerId,
  );
}

/** Owner-only removal of a property manager. Their listings unpublish with them. */
export function removePropertyManager(db: Database, propertyManagerId: number): void {
  db.prepare(`UPDATE property_managers SET status = 'suspended' WHERE id = ?`).run(propertyManagerId);
  db.prepare(`UPDATE housing_posts SET hidden = 1, updated_at = ? WHERE property_manager_id = ?`).run(
    nowIso(),
    propertyManagerId,
  );
}
