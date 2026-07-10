import { BetaAnalyticsDataClient } from "@google-analytics/data";
import type { TrafficMetrics } from "./analytics";
import { readGaMeasurementId } from "./gaSnippet";

type GaClient = BetaAnalyticsDataClient;

let client: GaClient | null | undefined;
let warned = false;

function parsePropertyId(): string | null {
  const raw = process.env.GA_PROPERTY_ID?.trim();
  if (!raw) return null;
  return raw.replace(/^properties\//, "");
}

function parseCredentials(): Record<string, unknown> | null {
  const raw = process.env.GA_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    if (!warned) {
      console.warn("[ga] GA_SERVICE_ACCOUNT_JSON is set but not valid JSON — skipping GA admin metrics");
      warned = true;
    }
    return null;
  }
}

function getClient(): GaClient | null {
  if (client !== undefined) return client;
  const propertyId = parsePropertyId();
  const credentials = parseCredentials();
  if (!propertyId || !credentials) {
    client = null;
    return null;
  }
  try {
    client = new BetaAnalyticsDataClient({ credentials });
  } catch (err) {
    console.warn("[ga] Failed to initialize Analytics Data client:", err);
    client = null;
  }
  return client;
}

export function isGoogleAnalyticsAdminConfigured(): boolean {
  return !!parsePropertyId() && !!parseCredentials();
}

type GaRow = {
  dimensionValues?: Array<{ value?: string | null } | null> | null;
  metricValues?: Array<{ value?: string | null } | null> | null;
};

function metricValue(row: GaRow | null | undefined, index: number): number {
  const raw = row?.metricValues?.[index]?.value;
  const n = Number(raw ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function dailySeries(rows: GaRow[], days = 14): number[] {
  const byDay: Record<string, number> = {};
  for (const row of rows) {
    const day = row.dimensionValues?.[0]?.value;
    if (!day) continue;
    byDay[day] = metricValue(row, 0);
  }
  const series: number[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    series.push(byDay[key] ?? 0);
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

let cache: { at: number; data: TrafficMetrics } | null = null;
const CACHE_MS = 60_000;

export async function getGoogleAnalyticsTrafficMetrics(): Promise<TrafficMetrics | null> {
  const gaClient = getClient();
  const propertyId = parsePropertyId();
  if (!gaClient || !propertyId) return null;

  if (cache && Date.now() - cache.at < CACHE_MS) {
    return cache.data;
  }

  const property = `properties/${propertyId}`;

  try {
    const [summary] = await gaClient.runReport({
      property,
      dateRanges: [
        { startDate: "7daysAgo", endDate: "today", name: "current" },
        { startDate: "14daysAgo", endDate: "8daysAgo", name: "previous" },
      ],
      dimensions: [{ name: "dateRange" }],
      metrics: [
        { name: "screenPageViews" },
        { name: "activeUsers" },
        { name: "sessions" },
        { name: "averageSessionDuration" },
        { name: "bounceRate" },
        { name: "screenPageViewsPerSession" },
      ],
    });

    const current = summary.rows?.find(row => row.dimensionValues?.[0]?.value === "current") ?? summary.rows?.[0];
    const previous = summary.rows?.find(row => row.dimensionValues?.[0]?.value === "previous") ?? summary.rows?.[1];

    const pageViews7d = metricValue(current, 0);
    const pageViewsPrev7d = metricValue(previous, 0);
    const uniqueVisitors7d = metricValue(current, 1);
    const uniqueVisitorsPrev7d = metricValue(previous, 1);
    const sessions7d = metricValue(current, 2);
    const sessionsPrev7d = metricValue(previous, 2);
    const avgSessionSeconds7d = Math.round(metricValue(current, 3));
    const avgSessionSecondsPrev7d = Math.round(metricValue(previous, 3));
    const bounceRate7d = Math.round(metricValue(current, 4) * 1000) / 10;
    const bounceRatePrev7d = Math.round(metricValue(previous, 4) * 1000) / 10;
    const pagesPerSession7d = Math.round(metricValue(current, 5) * 10) / 10;
    const pagesPerSessionPrev7d = Math.round(metricValue(previous, 5) * 10) / 10;

    const [trendReport] = await gaClient.runReport({
      property,
      dateRanges: [{ startDate: "13daysAgo", endDate: "today" }],
      dimensions: [{ name: "date" }],
      metrics: [{ name: "screenPageViews" }],
      orderBys: [{ dimension: { dimensionName: "date" } }],
    });

    const trendRows: GaRow[] = (trendReport.rows ?? []).map(row => ({
      dimensionValues: [{ value: formatGaDate(row.dimensionValues?.[0]?.value) }],
      metricValues: row.metricValues ?? [],
    }));
    const pageViewsTrend14d = dailySeries(trendRows, 14);

    const [topPagesReport] = await gaClient.runReport({
      property,
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: 8,
    });
    const topPages = (topPagesReport.rows ?? [])
      .map(row => ({
        path: row.dimensionValues?.[0]?.value || "/",
        views: metricValue(row, 0),
      }))
      .filter(row => !row.path.startsWith("/admin"));

    const [sourcesReport] = await gaClient.runReport({
      property,
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 8,
    });
    const sources = bucketPercents(
      (sourcesReport.rows ?? []).map(row => ({
        label: row.dimensionValues?.[0]?.value || "Other",
        count: metricValue(row, 0),
      })),
    );

    const [devicesReport] = await gaClient.runReport({
      property,
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      dimensions: [{ name: "deviceCategory" }],
      metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    });
    const deviceLabels: Record<string, string> = {
      mobile: "Mobile",
      desktop: "Desktop",
      tablet: "Tablet",
    };
    const devices = bucketPercents(
      (devicesReport.rows ?? []).map(row => {
        const raw = (row.dimensionValues?.[0]?.value || "desktop").toLowerCase();
        return {
          label: deviceLabels[raw] || raw,
          count: metricValue(row, 0),
        };
      }),
    );

    const [newReturningReport] = await gaClient.runReport({
      property,
      dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
      dimensions: [{ name: "newVsReturning" }],
      metrics: [{ name: "activeUsers" }],
    });
    const newReturningRows = (newReturningReport.rows ?? []).map(row => ({
      label: formatNewReturning(row.dimensionValues?.[0]?.value),
      count: metricValue(row, 0),
    }));
    const newReturningTotal = Math.max(newReturningRows.reduce((sum, row) => sum + row.count, 0), 1);
    const newReturning = newReturningRows.map(row => ({
      label: row.label,
      pct: Math.round((row.count / newReturningTotal) * 100),
    }));

    let activeNow = 0;
    try {
      const [realtime] = await gaClient.runRealtimeReport({
        property,
        metrics: [{ name: "activeUsers" }],
      });
      activeNow = metricValue(realtime.rows?.[0], 0);
    } catch {
      activeNow = 0;
    }

    const data: TrafficMetrics = {
      source: "google_analytics",
      gaTrackingEnabled: !!readGaMeasurementId(),
      gaReportingEnabled: true,
      activeNow,
      pageViews7d,
      pageViewsPrev7d,
      uniqueVisitors7d,
      uniqueVisitorsPrev7d,
      sessions7d,
      sessionsPrev7d,
      avgSessionSeconds7d,
      avgSessionSecondsPrev7d,
      bounceRate7d,
      bounceRatePrev7d,
      pagesPerSession7d,
      pagesPerSessionPrev7d,
      pageViewsTrend14d,
      topPages,
      sources,
      devices,
      newReturning,
    };

    cache = { at: Date.now(), data };
    return data;
  } catch (err) {
    console.warn("[ga] Analytics Data API request failed:", err);
    return null;
  }
}

function formatGaDate(value?: string | null): string {
  if (!value || value.length !== 8) return value || "";
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
}

function formatNewReturning(value?: string | null): string {
  const raw = (value || "").toLowerCase();
  if (raw === "new") return "New";
  if (raw === "returning") return "Returning";
  return value || "Unknown";
}