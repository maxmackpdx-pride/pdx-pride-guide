import type { Database } from "better-sqlite3";

export type PageViewInput = {
  path: string;
  visitorId: string;
  sessionId: string;
  referrer?: string | null;
  deviceType?: string | null;
  userId?: number | null;
};

export type TrafficSource = "first_party" | "google_analytics";

export type TrafficMetrics = {
  source: TrafficSource;
  gaTrackingEnabled: boolean;
  gaReportingEnabled: boolean;
  activeNow: number;
  pageViews7d: number;
  pageViewsPrev7d: number;
  uniqueVisitors7d: number;
  uniqueVisitorsPrev7d: number;
  sessions7d: number;
  sessionsPrev7d: number;
  avgSessionSeconds7d: number;
  avgSessionSecondsPrev7d: number;
  bounceRate7d: number;
  bounceRatePrev7d: number;
  pagesPerSession7d: number;
  pagesPerSessionPrev7d: number;
  pageViewsTrend14d: number[];
  topPages: Array<{ path: string; views: number }>;
  sources: Array<{ label: string; pct: number }>;
  devices: Array<{ label: string; pct: number }>;
  newReturning: Array<{ label: string; pct: number }>;
};

const TRACKED_PREFIXES = [
  "/",
  "/events",
  "/schedule",
  "/submit",
  "/pride-work",
  "/gigs",
  "/gifting",
  "/about",
  "/contact",
  "/directory",
  "/spotted",
  "/sponsors",
  "/access",
  "/access-safety",
  "/nude-beaches",
  "/legal",
  "/u/",
  "/dashboard",
  "/inbox",
  "/settings",
];

const BLOCKED_PREFIXES = ["/admin", "/api", "/assets", "/posters", "/sandbox"];

export function ensureAnalyticsTable(db: Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS analytics_page_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT NOT NULL,
      visitor_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      referrer TEXT,
      source_bucket TEXT NOT NULL DEFAULT 'Direct',
      device_type TEXT NOT NULL DEFAULT 'desktop',
      user_id INTEGER,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_apv_created_at ON analytics_page_views(created_at);
    CREATE INDEX IF NOT EXISTS idx_apv_path ON analytics_page_views(path);
    CREATE INDEX IF NOT EXISTS idx_apv_visitor ON analytics_page_views(visitor_id);
    CREATE INDEX IF NOT EXISTS idx_apv_session ON analytics_page_views(session_id);
  `);
}

export function normalizeAnalyticsPath(raw: string): string | null {
  if (!raw || typeof raw !== "string") return null;
  const path = raw.split("?")[0].split("#")[0].trim();
  if (!path.startsWith("/") || path.length > 240) return null;
  if (BLOCKED_PREFIXES.some(prefix => path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(prefix))) {
    return null;
  }
  if (!TRACKED_PREFIXES.some(prefix => path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(prefix))) {
    return null;
  }
  return path;
}

export function bucketReferrer(referrer?: string | null): string {
  if (!referrer?.trim()) return "Direct";
  try {
    const host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, "");
    if (host.includes("instagram")) return "Instagram";
    if (host.includes("google")) return "Google";
    if (host.includes("tiktok")) return "TikTok";
    if (host.includes("facebook") || host.includes("fb.com") || host === "fb.me") return "Facebook";
    if (host.includes("twitter") || host === "t.co" || host.includes("x.com")) return "X / Twitter";
    if (
      host.includes("zaylist") ||
      host.includes("prideguidepdx") ||
      host.includes("pdxpg") ||
      host.includes("pdxprideguide")
    ) {
      return "Internal";
    }
    if (host.includes("bing")) return "Bing";
    if (host.includes("yahoo")) return "Yahoo";
    return "Referral";
  } catch {
    return "Referral";
  }
}

function normalizeDeviceType(deviceType?: string | null): string {
  const d = String(deviceType || "").toLowerCase();
  if (d === "mobile" || d === "tablet" || d === "desktop") return d;
  return "desktop";
}

export function recordPageView(db: Database, input: PageViewInput): boolean {
  const path = normalizeAnalyticsPath(input.path);
  if (!path) return false;
  const visitorId = String(input.visitorId || "").trim();
  const sessionId = String(input.sessionId || "").trim();
  if (!visitorId || visitorId.length > 80 || !sessionId || sessionId.length > 80) return false;

  db.prepare(`
    INSERT INTO analytics_page_views (
      path, visitor_id, session_id, referrer, source_bucket, device_type, user_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    path,
    visitorId,
    sessionId,
    input.referrer?.slice(0, 500) || null,
    bucketReferrer(input.referrer),
    normalizeDeviceType(input.deviceType),
    input.userId ?? null,
    new Date().toISOString(),
  );
  return true;
}

function pctDelta(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? "new" : "steady";
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return "steady";
  return `${pct > 0 ? "+" : ""}${pct}%`;
}

function periodBounds(now = new Date()) {
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);
  const prevWeekStart = new Date(now);
  prevWeekStart.setDate(prevWeekStart.getDate() - 14);
  prevWeekStart.setHours(0, 0, 0, 0);
  const trendStart = new Date(now);
  trendStart.setDate(trendStart.getDate() - 13);
  trendStart.setHours(0, 0, 0, 0);
  const activeSince = new Date(now.getTime() - 5 * 60 * 1000);
  return {
    weekStartIso: weekStart.toISOString(),
    prevWeekStartIso: prevWeekStart.toISOString(),
    trendStartIso: trendStart.toISOString(),
    activeSinceIso: activeSince.toISOString(),
    nowIso: now.toISOString(),
  };
}

function countViews(db: Database, sinceIso: string, untilIso?: string) {
  if (untilIso) {
    return (db.prepare(
      `SELECT COUNT(*) AS count FROM analytics_page_views WHERE created_at >= ? AND created_at < ?`,
    ).get(sinceIso, untilIso) as { count: number })?.count ?? 0;
  }
  return (db.prepare(
    `SELECT COUNT(*) AS count FROM analytics_page_views WHERE created_at >= ?`,
  ).get(sinceIso) as { count: number })?.count ?? 0;
}

function countDistinct(db: Database, column: "visitor_id" | "session_id", sinceIso: string, untilIso?: string) {
  const sql = untilIso
    ? `SELECT COUNT(DISTINCT ${column}) AS count FROM analytics_page_views WHERE created_at >= ? AND created_at < ?`
    : `SELECT COUNT(DISTINCT ${column}) AS count FROM analytics_page_views WHERE created_at >= ?`;
  return (db.prepare(sql).get(...(untilIso ? [sinceIso, untilIso] : [sinceIso])) as { count: number })?.count ?? 0;
}

function sessionStats(db: Database, sinceIso: string, untilIso?: string) {
  const sql = untilIso
    ? `
      SELECT session_id,
             COUNT(*) AS pages,
             (julianday(MAX(created_at)) - julianday(MIN(created_at))) * 86400 AS duration_sec
      FROM analytics_page_views
      WHERE created_at >= ? AND created_at < ?
      GROUP BY session_id
    `
    : `
      SELECT session_id,
             COUNT(*) AS pages,
             (julianday(MAX(created_at)) - julianday(MIN(created_at))) * 86400 AS duration_sec
      FROM analytics_page_views
      WHERE created_at >= ?
      GROUP BY session_id
    `;
  return db.prepare(sql).all(...(untilIso ? [sinceIso, untilIso] : [sinceIso])) as Array<{
    session_id: string;
    pages: number;
    duration_sec: number;
  }>;
}

function summarizeSessions(rows: Array<{ pages: number; duration_sec: number }>) {
  if (rows.length === 0) {
    return { avgSessionSeconds: 0, bounceRate: 0, pagesPerSession: 0 };
  }
  const totalPages = rows.reduce((sum, row) => sum + row.pages, 0);
  const bounces = rows.filter(row => row.pages <= 1).length;
  const durations = rows.map(row => Math.max(0, Math.round(row.duration_sec || 0)));
  const avgSessionSeconds = Math.round(durations.reduce((a, b) => a + b, 0) / rows.length);
  return {
    avgSessionSeconds,
    bounceRate: Math.round((bounces / rows.length) * 100),
    pagesPerSession: Math.round((totalPages / rows.length) * 10) / 10,
  };
}

function dailyPageViewTrend(db: Database, trendStartIso: string, now = new Date()) {
  const rows = db.prepare(`
    SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS count
    FROM analytics_page_views
    WHERE created_at >= ?
    GROUP BY substr(created_at, 1, 10)
  `).all(trendStartIso) as Array<{ day: string; count: number }>;
  const byDay = Object.fromEntries(rows.map(r => [r.day, r.count]));
  const series: number[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    series.push(byDay[d.toISOString().slice(0, 10)] ?? 0);
  }
  return series;
}

function bucketPercents(
  rows: Array<{ label: string; count: number }>,
): Array<{ label: string; pct: number }> {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  if (total === 0) return [];
  return rows
    .sort((a, b) => b.count - a.count)
    .map(row => ({
      label: row.label,
      pct: Math.round((row.count / total) * 100),
    }));
}

export function getTrafficMetrics(
  db: Database,
  meta?: { gaTrackingEnabled?: boolean; gaReportingEnabled?: boolean; source?: TrafficSource },
): TrafficMetrics {
  const bounds = periodBounds();
  const pageViews7d = countViews(db, bounds.weekStartIso);
  const pageViewsPrev7d = countViews(db, bounds.prevWeekStartIso, bounds.weekStartIso);
  const uniqueVisitors7d = countDistinct(db, "visitor_id", bounds.weekStartIso);
  const uniqueVisitorsPrev7d = countDistinct(db, "visitor_id", bounds.prevWeekStartIso, bounds.weekStartIso);
  const sessions7d = countDistinct(db, "session_id", bounds.weekStartIso);
  const sessionsPrev7d = countDistinct(db, "session_id", bounds.prevWeekStartIso, bounds.weekStartIso);
  const session7d = summarizeSessions(sessionStats(db, bounds.weekStartIso));
  const sessionPrev7d = summarizeSessions(sessionStats(db, bounds.prevWeekStartIso, bounds.weekStartIso));

  const topPages = db.prepare(`
    SELECT path, COUNT(*) AS views
    FROM analytics_page_views
    WHERE created_at >= ?
    GROUP BY path
    ORDER BY views DESC
    LIMIT 8
  `).all(bounds.weekStartIso) as Array<{ path: string; views: number }>;

  const sourceRows = db.prepare(`
    SELECT source_bucket AS label, COUNT(*) AS count
    FROM analytics_page_views
    WHERE created_at >= ?
    GROUP BY source_bucket
  `).all(bounds.weekStartIso) as Array<{ label: string; count: number }>;

  const deviceRows = db.prepare(`
    SELECT device_type AS label, COUNT(*) AS count
    FROM analytics_page_views
    WHERE created_at >= ?
    GROUP BY device_type
  `).all(bounds.weekStartIso) as Array<{ label: string; count: number }>;

  const deviceLabels: Record<string, string> = {
    mobile: "Mobile",
    desktop: "Desktop",
    tablet: "Tablet",
  };
  const devices = bucketPercents(deviceRows.map(row => ({
    label: deviceLabels[row.label] || row.label,
    count: row.count,
  })));

  const newVisitors = (db.prepare(`
    SELECT COUNT(*) AS count FROM (
      SELECT visitor_id
      FROM analytics_page_views
      WHERE created_at >= ?
      GROUP BY visitor_id
      HAVING MIN(created_at) >= ?
    )
  `).get(bounds.weekStartIso, bounds.weekStartIso) as { count: number })?.count ?? 0;
  const returningVisitors = Math.max(uniqueVisitors7d - newVisitors, 0);
  const visitorTotal = Math.max(newVisitors + returningVisitors, 1);
  const newReturning = [
    { label: "New", pct: Math.round((newVisitors / visitorTotal) * 100) },
    { label: "Returning", pct: Math.round((returningVisitors / visitorTotal) * 100) },
  ];

  const activeNow = countDistinct(db, "visitor_id", bounds.activeSinceIso);

  return {
    source: meta?.source ?? "first_party",
    gaTrackingEnabled: meta?.gaTrackingEnabled ?? false,
    gaReportingEnabled: meta?.gaReportingEnabled ?? false,
    activeNow,
    pageViews7d,
    pageViewsPrev7d,
    uniqueVisitors7d,
    uniqueVisitorsPrev7d,
    sessions7d,
    sessionsPrev7d,
    avgSessionSeconds7d: session7d.avgSessionSeconds,
    avgSessionSecondsPrev7d: sessionPrev7d.avgSessionSeconds,
    bounceRate7d: session7d.bounceRate,
    bounceRatePrev7d: sessionPrev7d.bounceRate,
    pagesPerSession7d: session7d.pagesPerSession,
    pagesPerSessionPrev7d: sessionPrev7d.pagesPerSession,
    pageViewsTrend14d: dailyPageViewTrend(db, bounds.trendStartIso),
    topPages,
    sources: bucketPercents(sourceRows),
    devices,
    newReturning,
  };
}

export function formatTrafficDelta(current: number, previous: number): string {
  return `${pctDelta(current, previous)} vs last week`;
}