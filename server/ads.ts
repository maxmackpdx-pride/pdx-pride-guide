/**
 * Ad Manager domain: DDL, seed, CRUD, serve filter, impression/click rollups.
 * Kept out of storage.ts to limit blast radius (see plan R1).
 */
import type { Database } from "better-sqlite3";

export type AdFormat = "feed" | "poster";
export type AdStatus = "live" | "scheduled" | "paused" | "ended";
export type AdSource = "template" | "custom" | "manual";
export type AdMediaMode = "single" | "slideshow";
export type AdAudience = "everyone" | "members" | "guests";

export type AdRecord = {
  id: number;
  format: AdFormat;
  business: string;
  pillLabel: string;
  title: string;
  body: string;
  ctaTitle: string;
  ctaCopy: string;
  logoText: string;
  logoImg: string | null;
  tag1: string;
  tag2: string;
  destUrl: string;
  primaryColor: string;
  secondaryColor: string;
  mediaMode: AdMediaMode;
  singleSrc: string | null;
  slides: string[];
  slideAuto: boolean;
  slideMs: number;
  slideArrows: boolean;
  placeAll: boolean;
  placeFollowing: boolean;
  placeEvents: boolean;
  placeSpotted: boolean;
  cadence: number;
  pinTop: boolean;
  scrollDepths: number[];
  audience: AdAudience;
  dismissible: boolean;
  maxImpr: number;
  maxPerDay: number;
  minEvents: number;
  scatterPct: number;
  onePerDay: boolean;
  neverFirst: boolean;
  noAdjacent: boolean;
  weight: number;
  freqCap: number;
  startDate: string | null;
  endDate: string | null;
  days: string[];
  status: AdStatus;
  impressions: number;
  clicks: number;
  contact: string;
  billing: string;
  templateKey: string | null;
  source: AdSource;
  ownerId: number | null;
  createdAt: string;
  updatedAt: string;
};

/** Public serve payload: no contact/billing. */
export type AdServePayload = Omit<AdRecord, "contact" | "billing" | "ownerId">;

export type AdWriteInput = Partial<Omit<AdRecord, "id" | "impressions" | "clicks" | "createdAt" | "updatedAt">> & {
  format?: AdFormat;
  business?: string;
};

type AdRow = {
  id: number;
  format: string;
  business: string;
  pill_label: string;
  title: string;
  body: string;
  cta_title: string;
  cta_copy: string;
  logo_text: string;
  logo_img: string | null;
  tag1: string;
  tag2: string;
  dest_url: string;
  primary_color: string;
  secondary_color: string;
  media_mode: string;
  single_src: string | null;
  slides: string;
  slide_auto: number;
  slide_ms: number;
  slide_arrows: number;
  place_all: number;
  place_following: number;
  place_events: number;
  place_spotted: number;
  cadence: number;
  pin_top: number;
  scroll_depths: string;
  audience: string;
  dismissible: number;
  max_impr: number;
  max_per_day: number;
  min_events: number;
  scatter_pct: number;
  one_per_day: number;
  never_first: number;
  no_adjacent: number;
  weight: number;
  freq_cap: number;
  start_date: string | null;
  end_date: string | null;
  days: string;
  status: string;
  impressions: number;
  clicks: number;
  contact: string;
  billing: string;
  template_key: string | null;
  source: string;
  owner_id: number | null;
  created_at: string;
  updated_at: string;
};

function parseJsonArray<T>(raw: string | null | undefined, fallback: T[] = []): T[] {
  if (!raw) return fallback;
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function bool(n: number | boolean | null | undefined): boolean {
  return n === true || n === 1;
}

function rowToAd(row: AdRow): AdRecord {
  return {
    id: row.id,
    format: (row.format === "poster" ? "poster" : "feed") as AdFormat,
    business: row.business || "",
    pillLabel: row.pill_label || "Affiliate",
    title: row.title || "",
    body: row.body || "",
    ctaTitle: row.cta_title || "",
    ctaCopy: row.cta_copy || "",
    logoText: row.logo_text || "",
    logoImg: row.logo_img,
    tag1: row.tag1 || "",
    tag2: row.tag2 || "",
    destUrl: row.dest_url || "",
    primaryColor: row.primary_color || "#ff1f1f",
    secondaryColor: row.secondary_color || "#ffffff",
    mediaMode: row.media_mode === "slideshow" ? "slideshow" : "single",
    singleSrc: row.single_src,
    slides: parseJsonArray<string>(row.slides),
    slideAuto: bool(row.slide_auto),
    slideMs: Number(row.slide_ms) || 2600,
    slideArrows: bool(row.slide_arrows),
    placeAll: bool(row.place_all),
    placeFollowing: bool(row.place_following),
    placeEvents: bool(row.place_events),
    placeSpotted: bool(row.place_spotted),
    cadence: Number(row.cadence) || 0,
    pinTop: bool(row.pin_top),
    scrollDepths: parseJsonArray<number>(row.scroll_depths).map(Number).filter((n) => !Number.isNaN(n)),
    audience: (["everyone", "members", "guests"].includes(row.audience)
      ? row.audience
      : "everyone") as AdAudience,
    dismissible: bool(row.dismissible),
    maxImpr: Number(row.max_impr) || 0,
    maxPerDay: Number(row.max_per_day) || 5,
    minEvents: Number(row.min_events) || 2,
    scatterPct: Number(row.scatter_pct) || 45,
    onePerDay: bool(row.one_per_day),
    neverFirst: bool(row.never_first),
    noAdjacent: bool(row.no_adjacent),
    weight: Number(row.weight) || 1,
    freqCap: Number(row.freq_cap) || 0,
    startDate: row.start_date,
    endDate: row.end_date,
    days: parseJsonArray<string>(row.days),
    status: (["live", "scheduled", "paused", "ended"].includes(row.status)
      ? row.status
      : "scheduled") as AdStatus,
    impressions: Number(row.impressions) || 0,
    clicks: Number(row.clicks) || 0,
    contact: row.contact || "",
    billing: row.billing || "",
    templateKey: row.template_key,
    source: (["template", "custom", "manual"].includes(row.source)
      ? row.source
      : "custom") as AdSource,
    ownerId: row.owner_id,
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
  };
}

export function toServePayload(ad: AdRecord): AdServePayload {
  const { contact: _c, billing: _b, ownerId: _o, ...rest } = ad;
  return rest;
}

export function ensureAdsTables(db: Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS ads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      format TEXT NOT NULL,
      business TEXT NOT NULL DEFAULT '',
      pill_label TEXT NOT NULL DEFAULT 'Affiliate',
      title TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL DEFAULT '',
      cta_title TEXT NOT NULL DEFAULT '',
      cta_copy TEXT NOT NULL DEFAULT '',
      logo_text TEXT NOT NULL DEFAULT '',
      logo_img TEXT,
      tag1 TEXT NOT NULL DEFAULT '',
      tag2 TEXT NOT NULL DEFAULT '',
      dest_url TEXT NOT NULL DEFAULT '',
      primary_color TEXT NOT NULL DEFAULT '#ff1f1f',
      secondary_color TEXT NOT NULL DEFAULT '#ffffff',
      media_mode TEXT NOT NULL DEFAULT 'single',
      single_src TEXT,
      slides TEXT NOT NULL DEFAULT '[]',
      slide_auto INTEGER NOT NULL DEFAULT 1,
      slide_ms INTEGER NOT NULL DEFAULT 2600,
      slide_arrows INTEGER NOT NULL DEFAULT 0,
      place_all INTEGER NOT NULL DEFAULT 1,
      place_following INTEGER NOT NULL DEFAULT 1,
      place_events INTEGER NOT NULL DEFAULT 1,
      place_spotted INTEGER NOT NULL DEFAULT 0,
      cadence INTEGER NOT NULL DEFAULT 0,
      pin_top INTEGER NOT NULL DEFAULT 0,
      scroll_depths TEXT NOT NULL DEFAULT '[]',
      audience TEXT NOT NULL DEFAULT 'everyone',
      dismissible INTEGER NOT NULL DEFAULT 1,
      max_impr INTEGER NOT NULL DEFAULT 0,
      max_per_day INTEGER NOT NULL DEFAULT 5,
      min_events INTEGER NOT NULL DEFAULT 2,
      scatter_pct INTEGER NOT NULL DEFAULT 45,
      one_per_day INTEGER NOT NULL DEFAULT 1,
      never_first INTEGER NOT NULL DEFAULT 1,
      no_adjacent INTEGER NOT NULL DEFAULT 1,
      weight INTEGER NOT NULL DEFAULT 1,
      freq_cap INTEGER NOT NULL DEFAULT 0,
      start_date TEXT,
      end_date TEXT,
      days TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'scheduled',
      impressions INTEGER NOT NULL DEFAULT 0,
      clicks INTEGER NOT NULL DEFAULT 0,
      contact TEXT NOT NULL DEFAULT '',
      billing TEXT NOT NULL DEFAULT '',
      template_key TEXT,
      source TEXT NOT NULL DEFAULT 'custom',
      owner_id INTEGER,
      created_at TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT ''
    );
    CREATE INDEX IF NOT EXISTS idx_ads_status_format ON ads(status, format);
    CREATE INDEX IF NOT EXISTS idx_ads_template_key ON ads(template_key);

    CREATE TABLE IF NOT EXISTS ad_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ad_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      ts TEXT NOT NULL DEFAULT '',
      session_id TEXT,
      surface TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_ad_events_ad ON ad_events(ad_id);
    CREATE INDEX IF NOT EXISTS idx_ad_events_ts ON ad_events(ts);
    CREATE INDEX IF NOT EXISTS idx_ad_events_session ON ad_events(session_id);
  `);
}

function insertSeed(
  db: Database,
  partial: Record<string, unknown>,
) {
  const now = new Date().toISOString();
  const cols = Object.keys(partial);
  const placeholders = cols.map(() => "?").join(", ");
  const sql = `INSERT INTO ads (${cols.join(", ")}, created_at, updated_at) VALUES (${placeholders}, ?, ?)`;
  db.prepare(sql).run(...cols.map((c) => partial[c]), now, now);
}

/** Idempotent seed of current hard-coded affiliates + Yes Coach MANUAL tracker row. */
export function seedAdsIfNeeded(db: Database) {
  ensureAdsTables(db);
  const exists = db.prepare("SELECT id FROM ads WHERE template_key = ? LIMIT 1");

  if (!exists.get("cockblock-feed")) {
    insertSeed(db, {
      format: "feed",
      business: "CockBlock",
      pill_label: "Affiliate",
      title: "Meet CockBlock Stroke",
      body: "The only frot toy for people with a penis · new hand-held design · gay owned",
      cta_title: "10% Off · Code: TUCKERMAX",
      cta_copy: "cockblocktoys.com · free US & CA shipping",
      logo_text: "CockBlock",
      logo_img: "/affiliate/feed/cb-logo-white.png",
      tag1: "",
      tag2: "",
      dest_url: "https://cockblocktoys.com/tucker060",
      primary_color: "#ff1f1f",
      secondary_color: "#ffffff",
      media_mode: "slideshow",
      single_src: null,
      slides: JSON.stringify([
        "/affiliate/feed/cb-social.png",
        "/affiliate/feed/cb-handhold.jpg",
        "/affiliate/feed/cb-models.png",
      ]),
      slide_auto: 1,
      slide_ms: 2600,
      slide_arrows: 0,
      place_all: 1,
      place_following: 1,
      place_events: 1,
      place_spotted: 0,
      cadence: 0,
      pin_top: 0,
      scroll_depths: JSON.stringify([40]),
      audience: "everyone",
      dismissible: 1,
      max_impr: 0,
      max_per_day: 5,
      min_events: 2,
      scatter_pct: 45,
      one_per_day: 1,
      never_first: 1,
      no_adjacent: 1,
      weight: 2,
      freq_cap: 0,
      start_date: null,
      end_date: null,
      days: "[]",
      status: "live",
      impressions: 0,
      clicks: 0,
      contact: "affiliate@cockblocktoys.com",
      billing: "Affiliate · code TUCKERMAX",
      template_key: "cockblock-feed",
      source: "template",
      owner_id: null,
    });
  }

  if (!exists.get("mrs-feed")) {
    insertSeed(db, {
      format: "feed",
      business: "Mr. S Leather",
      pill_label: "Affiliate",
      title: "Gear Up at Mr S Leather",
      body: "Leather · rubber · fetish gear · made in San Francisco since 1979",
      cta_title: "Get your gear for Dore & Folsom",
      cta_copy: "mr-s-leather.com · ships worldwide",
      logo_text: "Mr. S Leather",
      logo_img: "/affiliate/feed/mrs-logo.webp",
      tag1: "",
      tag2: "",
      dest_url: "https://www.mr-s-leather.com/?acc=TUCKERMAX",
      primary_color: "#19e3ff",
      secondary_color: "#ffffff",
      media_mode: "single",
      single_src: "/affiliate/feed/mrs-logo.webp",
      slides: "[]",
      slide_auto: 0,
      slide_ms: 2600,
      slide_arrows: 0,
      place_all: 1,
      place_following: 1,
      place_events: 1,
      place_spotted: 0,
      cadence: 0,
      pin_top: 0,
      scroll_depths: JSON.stringify([80]),
      audience: "everyone",
      dismissible: 1,
      max_impr: 0,
      max_per_day: 5,
      min_events: 2,
      scatter_pct: 45,
      one_per_day: 1,
      never_first: 1,
      no_adjacent: 1,
      weight: 1,
      freq_cap: 0,
      start_date: null,
      end_date: null,
      days: "[]",
      status: "live",
      impressions: 0,
      clicks: 0,
      contact: "affiliate@mr-s-leather.com",
      billing: "Affiliate · code TUCKERMAX",
      template_key: "mrs-feed",
      source: "template",
      owner_id: null,
    });
  }

  if (!exists.get("cockblock-poster")) {
    insertSeed(db, {
      format: "poster",
      business: "CockBlock Toys",
      pill_label: "Affiliate",
      title: "CockBlock Toys",
      body: "The original frot toy, made for two",
      cta_title: "Code TUCKERMAX for 10% off",
      cta_copy: "Shop Now →",
      logo_text: "CockBlock",
      logo_img: null,
      tag1: "Toys & Play",
      tag2: "Gay-Owned",
      dest_url: "https://cockblocktoys.com/tucker060",
      primary_color: "#ff1f1f",
      secondary_color: "#ffffff",
      media_mode: "slideshow",
      single_src: null,
      slides: JSON.stringify(["/affiliate/cb1.jpg", "/affiliate/cb2.png", "/affiliate/cb3.png"]),
      slide_auto: 1,
      slide_ms: 3200,
      slide_arrows: 0,
      place_all: 1,
      place_following: 1,
      place_events: 1,
      place_spotted: 0,
      cadence: 0,
      pin_top: 0,
      scroll_depths: "[]",
      audience: "everyone",
      dismissible: 0,
      max_impr: 0,
      max_per_day: 5,
      min_events: 2,
      scatter_pct: 45,
      one_per_day: 1,
      never_first: 1,
      no_adjacent: 1,
      weight: 1,
      freq_cap: 0,
      start_date: null,
      end_date: null,
      days: "[]",
      status: "live",
      impressions: 0,
      clicks: 0,
      contact: "affiliate@cockblocktoys.com",
      billing: "Affiliate · code TUCKERMAX",
      template_key: "cockblock-poster",
      source: "template",
      owner_id: null,
    });
  }

  if (!exists.get("mrs-poster")) {
    insertSeed(db, {
      format: "poster",
      business: "Mr. S Leather",
      pill_label: "Affiliate",
      title: "Mr. S Leather",
      body: "Harnesses, restraints & fetish gear, made in SF",
      cta_title: "Shop the link, support the guide",
      cta_copy: "Shop Now →",
      logo_text: "Mr. S Leather",
      logo_img: null,
      tag1: "Leather & Gear",
      tag2: "Ships Worldwide",
      dest_url: "https://www.mr-s-leather.com/?acc=TUCKERMAX",
      primary_color: "#19e3ff",
      secondary_color: "#ffffff",
      media_mode: "single",
      single_src: "/affiliate/mrs.webp",
      slides: "[]",
      slide_auto: 0,
      slide_ms: 3200,
      slide_arrows: 0,
      place_all: 1,
      place_following: 1,
      place_events: 1,
      place_spotted: 0,
      cadence: 0,
      pin_top: 0,
      scroll_depths: "[]",
      audience: "everyone",
      dismissible: 0,
      max_impr: 0,
      max_per_day: 5,
      min_events: 2,
      scatter_pct: 45,
      one_per_day: 1,
      never_first: 1,
      no_adjacent: 1,
      weight: 1,
      freq_cap: 0,
      start_date: null,
      end_date: null,
      days: "[]",
      status: "live",
      impressions: 0,
      clicks: 0,
      contact: "affiliate@mr-s-leather.com",
      billing: "Affiliate · code TUCKERMAX",
      template_key: "mrs-poster",
      source: "template",
      owner_id: null,
    });
  }

  // Re-align seeded template chrome with live deep-glass refresh (idempotent).
  syncLiveAffiliateTemplates(db);

  if (!exists.get("yes-coach")) {
    insertSeed(db, {
      format: "feed",
      business: "Yes Coach / STANK",
      pill_label: "House",
      title: "STANK x Yes Coach",
      body: "House featured event ad. Managed in feed code (title match). Tracker only.",
      cta_title: "See the event",
      cta_copy: "House ad · not CMS-driven",
      logo_text: "Yes Coach",
      logo_img: null,
      tag1: "",
      tag2: "",
      dest_url: "/events",
      primary_color: "#19e3ff",
      secondary_color: "#5ce600",
      media_mode: "single",
      single_src: null,
      slides: "[]",
      slide_auto: 0,
      slide_ms: 2600,
      slide_arrows: 0,
      place_all: 1,
      place_following: 1,
      place_events: 1,
      place_spotted: 0,
      cadence: 0,
      pin_top: 1,
      scroll_depths: "[]",
      audience: "everyone",
      dismissible: 1,
      max_impr: 0,
      max_per_day: 1,
      min_events: 0,
      scatter_pct: 0,
      one_per_day: 1,
      never_first: 0,
      no_adjacent: 1,
      weight: 0,
      freq_cap: 0,
      start_date: null,
      end_date: null,
      days: "[]",
      status: "live",
      impressions: 0,
      clicks: 0,
      contact: "",
      billing: "House · manual",
      template_key: "yes-coach",
      source: "manual",
      owner_id: null,
    });
  }
}

/**
 * Keep known affiliate template rows on the post-refresh chrome
 * (cyan Mr S, red CockBlock, correct media + CTA mapping).
 * Only updates template_key rows so custom ads stay as-authored.
 */
function syncLiveAffiliateTemplates(db: Database) {
  const now = new Date().toISOString();
  const updates: Array<{ key: string; fields: Record<string, string | number> }> = [
    {
      key: "cockblock-feed",
      fields: {
        primary_color: "#ff1f1f",
        secondary_color: "#ffffff",
        cta_title: "10% Off · Code: TUCKERMAX",
        cta_copy: "cockblocktoys.com · free US & CA shipping",
        logo_img: "/affiliate/feed/cb-logo-white.png",
        slides: JSON.stringify([
          "/affiliate/feed/cb-social.png",
          "/affiliate/feed/cb-handhold.jpg",
          "/affiliate/feed/cb-models.png",
        ]),
        media_mode: "slideshow",
      },
    },
    {
      key: "mrs-feed",
      fields: {
        primary_color: "#19e3ff",
        secondary_color: "#ffffff",
        title: "Gear Up at Mr S Leather",
        body: "Leather · rubber · fetish gear · made in San Francisco since 1979",
        cta_title: "Get your gear for Dore & Folsom",
        cta_copy: "mr-s-leather.com · ships worldwide",
        logo_img: "/affiliate/feed/mrs-logo.webp",
        single_src: "/affiliate/feed/mrs-logo.webp",
        media_mode: "single",
        slides: "[]",
      },
    },
    {
      key: "cockblock-poster",
      fields: {
        primary_color: "#ff1f1f",
        secondary_color: "#ffffff",
        cta_title: "Code TUCKERMAX for 10% off",
        cta_copy: "Shop Now →",
        tag1: "Toys & Play",
        tag2: "Gay-Owned",
        media_mode: "slideshow",
        slides: JSON.stringify(["/affiliate/cb1.jpg", "/affiliate/cb2.png", "/affiliate/cb3.png"]),
      },
    },
    {
      key: "mrs-poster",
      fields: {
        primary_color: "#19e3ff",
        secondary_color: "#ffffff",
        cta_title: "Shop the link, support the guide",
        cta_copy: "Shop Now →",
        tag1: "Leather & Gear",
        tag2: "Ships Worldwide",
        media_mode: "single",
        single_src: "/affiliate/mrs.webp",
        slides: "[]",
      },
    },
  ];

  for (const u of updates) {
    const cols = Object.keys(u.fields);
    if (cols.length === 0) continue;
    const sets = cols.map((c) => `${c} = ?`).join(", ");
    const vals = cols.map((c) => u.fields[c]);
    db.prepare(
      `UPDATE ads SET ${sets}, updated_at = ? WHERE template_key = ? AND source = 'template'`,
    ).run(...vals, now, u.key);
  }
}

function listRows(db: Database): AdRow[] {
  return db.prepare("SELECT * FROM ads ORDER BY id DESC").all() as AdRow[];
}

export function listAds(db: Database): AdRecord[] {
  ensureAdsTables(db);
  return listRows(db).map(rowToAd);
}

export function getAd(db: Database, id: number): AdRecord | null {
  ensureAdsTables(db);
  const row = db.prepare("SELECT * FROM ads WHERE id = ?").get(id) as AdRow | undefined;
  return row ? rowToAd(row) : null;
}

const WRITABLE: Array<{ key: keyof AdWriteInput; col: string; json?: boolean; bool?: boolean }> = [
  { key: "format", col: "format" },
  { key: "business", col: "business" },
  { key: "pillLabel", col: "pill_label" },
  { key: "title", col: "title" },
  { key: "body", col: "body" },
  { key: "ctaTitle", col: "cta_title" },
  { key: "ctaCopy", col: "cta_copy" },
  { key: "logoText", col: "logo_text" },
  { key: "logoImg", col: "logo_img" },
  { key: "tag1", col: "tag1" },
  { key: "tag2", col: "tag2" },
  { key: "destUrl", col: "dest_url" },
  { key: "primaryColor", col: "primary_color" },
  { key: "secondaryColor", col: "secondary_color" },
  { key: "mediaMode", col: "media_mode" },
  { key: "singleSrc", col: "single_src" },
  { key: "slides", col: "slides", json: true },
  { key: "slideAuto", col: "slide_auto", bool: true },
  { key: "slideMs", col: "slide_ms" },
  { key: "slideArrows", col: "slide_arrows", bool: true },
  { key: "placeAll", col: "place_all", bool: true },
  { key: "placeFollowing", col: "place_following", bool: true },
  { key: "placeEvents", col: "place_events", bool: true },
  { key: "placeSpotted", col: "place_spotted", bool: true },
  { key: "cadence", col: "cadence" },
  { key: "pinTop", col: "pin_top", bool: true },
  { key: "scrollDepths", col: "scroll_depths", json: true },
  { key: "audience", col: "audience" },
  { key: "dismissible", col: "dismissible", bool: true },
  { key: "maxImpr", col: "max_impr" },
  { key: "maxPerDay", col: "max_per_day" },
  { key: "minEvents", col: "min_events" },
  { key: "scatterPct", col: "scatter_pct" },
  { key: "onePerDay", col: "one_per_day", bool: true },
  { key: "neverFirst", col: "never_first", bool: true },
  { key: "noAdjacent", col: "no_adjacent", bool: true },
  { key: "weight", col: "weight" },
  { key: "freqCap", col: "freq_cap" },
  { key: "startDate", col: "start_date" },
  { key: "endDate", col: "end_date" },
  { key: "days", col: "days", json: true },
  { key: "status", col: "status" },
  { key: "contact", col: "contact" },
  { key: "billing", col: "billing" },
  { key: "templateKey", col: "template_key" },
  { key: "source", col: "source" },
  { key: "ownerId", col: "owner_id" },
];

function serializeField(
  meta: (typeof WRITABLE)[number],
  value: unknown,
): unknown {
  if (value === undefined) return undefined;
  if (meta.json) return JSON.stringify(Array.isArray(value) ? value : []);
  if (meta.bool) return value ? 1 : 0;
  return value;
}

export function createAd(db: Database, input: AdWriteInput, ownerId?: number | null): AdRecord {
  ensureAdsTables(db);
  const now = new Date().toISOString();
  const format = input.format === "poster" ? "poster" : "feed";
  const cols: string[] = ["format", "created_at", "updated_at", "status", "source"];
  const vals: unknown[] = [
    format,
    now,
    now,
    input.status || "scheduled",
    input.source || "custom",
  ];

  for (const meta of WRITABLE) {
    if (meta.key === "format" || meta.key === "status" || meta.key === "source") continue;
    if (input[meta.key] === undefined) continue;
    cols.push(meta.col);
    vals.push(serializeField(meta, input[meta.key]));
  }
  if (ownerId != null) {
    cols.push("owner_id");
    vals.push(ownerId);
  }

  const placeholders = cols.map(() => "?").join(", ");
  const result = db.prepare(
    `INSERT INTO ads (${cols.join(", ")}) VALUES (${placeholders})`,
  ).run(...vals);
  const id = Number(result.lastInsertRowid);
  const ad = getAd(db, id);
  if (!ad) throw new Error("Failed to create ad");
  return ad;
}

export function updateAd(db: Database, id: number, input: AdWriteInput): AdRecord | null {
  ensureAdsTables(db);
  const existing = getAd(db, id);
  if (!existing) return null;
  const sets: string[] = ["updated_at = ?"];
  const vals: unknown[] = [new Date().toISOString()];
  for (const meta of WRITABLE) {
    if (input[meta.key] === undefined) continue;
    sets.push(`${meta.col} = ?`);
    vals.push(serializeField(meta, input[meta.key]));
  }
  vals.push(id);
  db.prepare(`UPDATE ads SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
  return getAd(db, id);
}

export function setAdStatus(db: Database, id: number, status: AdStatus): AdRecord | null {
  return updateAd(db, id, { status });
}

export function deleteAd(db: Database, id: number): boolean {
  ensureAdsTables(db);
  const result = db.prepare("DELETE FROM ads WHERE id = ?").run(id);
  if (result.changes > 0) {
    db.prepare("DELETE FROM ad_events WHERE ad_id = ?").run(id);
  }
  return result.changes > 0;
}

function dayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function inFlight(ad: AdRecord, today = dayKey()): boolean {
  if (ad.startDate && today < ad.startDate.slice(0, 10)) return false;
  if (ad.endDate && today > ad.endDate.slice(0, 10)) return false;
  return true;
}

function underCap(ad: AdRecord): boolean {
  if (ad.maxImpr > 0 && ad.impressions >= ad.maxImpr) return false;
  return true;
}

export type ServeQuery = {
  surface: "feed" | "grid";
  tab?: string; // all | following | events | spotted
  audience?: "everyone" | "members" | "guests";
};

export function serveAds(db: Database, q: ServeQuery): AdServePayload[] {
  ensureAdsTables(db);
  const format: AdFormat = q.surface === "grid" ? "poster" : "feed";
  const all = listAds(db).filter(
    (ad) =>
      ad.format === format &&
      ad.status === "live" &&
      ad.source !== "manual" &&
      inFlight(ad) &&
      underCap(ad),
  );

  const tab = (q.tab || "all").toLowerCase();
  const audience = q.audience || "everyone";

  const filtered = all.filter((ad) => {
    if (ad.audience === "members" && audience === "guests") return false;
    if (ad.audience === "guests" && audience === "members") return false;
    if (format === "feed") {
      if (tab === "following" && !ad.placeFollowing && !ad.placeAll) return false;
      if (tab === "events" && !ad.placeEvents && !ad.placeAll) return false;
      if (tab === "spotted" && !ad.placeSpotted && !ad.placeAll) return false;
      if ((tab === "all" || tab === "") && !ad.placeAll && !ad.placeFollowing && !ad.placeEvents) {
        // still allow if any feed placement is on
        if (!ad.placeAll) return ad.placeFollowing || ad.placeEvents || ad.placeSpotted;
      }
    }
    return true;
  });

  filtered.sort((a, b) => b.weight - a.weight || a.id - b.id);
  return filtered.map(toServePayload);
}

export function recordAdEvent(
  db: Database,
  adId: number,
  type: "impression" | "click",
  opts?: { sessionId?: string | null; surface?: string | null },
): { ok: boolean; reason?: string; ad?: AdRecord } {
  ensureAdsTables(db);
  const ad = getAd(db, adId);
  if (!ad) return { ok: false, reason: "not_found" };
  if (ad.status !== "live") return { ok: false, reason: "not_live" };
  if (!inFlight(ad)) return { ok: false, reason: "out_of_flight" };
  if (type === "impression" && !underCap(ad)) return { ok: false, reason: "cap" };

  // Session frequency cap (impressions only for v1)
  if (type === "impression" && ad.freqCap > 0 && opts?.sessionId) {
    const count = db
      .prepare(
        `SELECT COUNT(*) AS c FROM ad_events WHERE ad_id = ? AND type = 'impression' AND session_id = ?`,
      )
      .get(adId, opts.sessionId) as { c: number };
    if (count.c >= ad.freqCap) return { ok: false, reason: "freq_cap", ad };
  }

  const now = new Date().toISOString();
  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO ad_events (ad_id, type, ts, session_id, surface) VALUES (?, ?, ?, ?, ?)`,
    ).run(adId, type, now, opts?.sessionId || null, opts?.surface || null);
    if (type === "impression") {
      db.prepare(`UPDATE ads SET impressions = impressions + 1, updated_at = ? WHERE id = ?`).run(
        now,
        adId,
      );
    } else {
      db.prepare(`UPDATE ads SET clicks = clicks + 1, updated_at = ? WHERE id = ?`).run(now, adId);
    }
  });
  tx();
  return { ok: true, ad: getAd(db, adId) || undefined };
}

export type AdStats = {
  liveCount: number;
  impressions: number;
  clicks: number;
  avgCtr: number;
  ads: Array<{
    id: number;
    business: string;
    title: string;
    status: AdStatus;
    format: AdFormat;
    source: AdSource;
    templateKey: string | null;
    impressions: number;
    clicks: number;
    ctr: number;
    startDate: string | null;
    endDate: string | null;
    contact: string;
    billing: string;
    primaryColor: string;
  }>;
};

export function getAdStats(db: Database): AdStats {
  const adsList = listAds(db);
  const live = adsList.filter((a) => a.status === "live" && a.source !== "manual");
  // Include MANUAL yes-coach in tracker numbers for impressions if any, but liveCount = commerce live
  const liveCount = adsList.filter((a) => a.status === "live").length;
  const impressions = adsList.reduce((s, a) => s + a.impressions, 0);
  const clicks = adsList.reduce((s, a) => s + a.clicks, 0);
  const avgCtr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  return {
    liveCount,
    impressions,
    clicks,
    avgCtr: Math.round(avgCtr * 100) / 100,
    ads: adsList.map((a) => ({
      id: a.id,
      business: a.business,
      title: a.title,
      status: a.status,
      format: a.format,
      source: a.source,
      templateKey: a.templateKey,
      impressions: a.impressions,
      clicks: a.clicks,
      ctr: a.impressions > 0 ? Math.round((a.clicks / a.impressions) * 10000) / 100 : 0,
      startDate: a.startDate,
      endDate: a.endDate,
      contact: a.contact,
      billing: a.billing,
      primaryColor: a.primaryColor,
    })),
  };
}
