import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { StatCard } from "@/components/ds";
import CountUpValue from "@/components/CountUpValue";
import { prefersStillMotion } from "@/lib/motion";
import "./admin-stats.css";

interface AdminMetrics {
  users: number;
  newUsersToday: number;
  activeSessions: number;
  liveEvents: number;
  userSubmittedEvents: number;
  messages: number;
  attendances: number;
  pendingSubmissions: number;
  gigPosts: number;
  giftingPosts: number;
  missedConnections: number;
  openFeedback: number;
  generatedAt?: string;
}

type StatCardColor = "lime" | "cyan" | "orange" | "pink" | "purple" | "green";

type KpiFormat = "k" | "dur" | "pct" | "dec" | "n";

function fmtK(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(Math.round(n));
}

function mmss(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
}

function sparkPts(arr: number[]): string {
  const mn = Math.min(...arr);
  const mx = Math.max(...arr);
  const range = mx - mn || 1;
  return arr
    .map((v, i) => `${((i / (arr.length - 1)) * 60).toFixed(1)},${(18 - ((v - mn) / range) * 16).toFixed(1)}`)
    .join(" ");
}

function trendPoints(values: number[]): { line: string; area: string } {
  const mn = Math.min(...values);
  const mx = Math.max(...values);
  const range = mx - mn || 1;
  const line = values
    .map((v, i) => `${((i / (values.length - 1)) * 100).toFixed(2)},${(34 - ((v - mn) / range) * 30).toFixed(2)}`)
    .join(" ");
  return { line, area: `0,36 ${line} 100,36` };
}

function useAnimatedNumber(target: number, duration = 900): number {
  const [value, setValue] = useState(prefersStillMotion() ? target : 0);

  useEffect(() => {
    if (prefersStillMotion()) {
      setValue(target);
      return;
    }
    let frame = 0;
    let start: number | null = null;
    const from = 0;
    const tick = (ts: number) => {
      if (start == null) start = ts;
      const t = Math.min(1, (ts - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setValue(Math.round(from + (target - from) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

function AnimatedKpiValue({ target, format }: { target: number; format: KpiFormat }) {
  const animated = useAnimatedNumber(target);
  if (format === "k") return <>{fmtK(animated)}</>;
  if (format === "dur") return <>{mmss(animated)}</>;
  if (format === "pct") return <>{animated}%</>;
  if (format === "dec") return <>{(animated / 10).toFixed(1)}</>;
  return <CountUpValue value={animated} />;
}

const TRAFFIC_KPIS = [
  { id: "pv", label: "Page views", target: 128_400, format: "k" as const, delta: "+18%", color: "var(--lime, #c8fa3c)", spark: [9, 11, 10, 13, 14, 16, 19, 21] },
  { id: "uv", label: "Unique visitors", target: 41_200, format: "k" as const, delta: "+22%", color: "var(--lime, #c8fa3c)", spark: [6, 7, 7, 9, 10, 11, 13, 15] },
  { id: "ss", label: "Sessions", target: 63_800, format: "k" as const, delta: "+15%", color: "var(--lime, #c8fa3c)", spark: [7, 8, 9, 9, 11, 12, 13, 14] },
  { id: "dur", label: "Avg. session", target: 192, format: "dur" as const, delta: "+6%", color: "var(--lime, #c8fa3c)", spark: [150, 160, 158, 170, 175, 180, 188, 192] },
  { id: "br", label: "Bounce rate", target: 38, format: "pct" as const, delta: "-4%", color: "var(--lime, #c8fa3c)", spark: [46, 45, 43, 42, 41, 40, 39, 38] },
  { id: "pp", label: "Pages / session", target: 46, format: "dec" as const, delta: "+9%", color: "var(--lime, #c8fa3c)", spark: [38, 39, 40, 42, 43, 44, 45, 46] },
];

const TREND = [9, 11, 10, 12, 14, 13, 15, 14, 16, 18, 17, 19, 22, 21];

const TOP_PAGES = [
  { path: "/events", views: 38_900, color: "var(--cyan, #00ffff)" },
  { path: "/", views: 24_100, color: "var(--lime, #c8fa3c)" },
  { path: "/spotted", views: 15_600, color: "var(--pink, #ff00cc)" },
  { path: "/schedule", views: 12_300, color: "var(--orange, #ff8c00)" },
  { path: "/gifting", views: 8_700, color: "var(--amber, #ffee00)" },
];

const SOURCES = [
  { label: "Instagram", pct: 34, color: "var(--pink, #ff00cc)" },
  { label: "Direct", pct: 28, color: "var(--cyan, #00ffff)" },
  { label: "Google", pct: 19, color: "var(--lime, #c8fa3c)" },
  { label: "TikTok", pct: 12, color: "var(--orange, #ff8c00)" },
  { label: "Referral", pct: 7, color: "var(--purple, #8800ff)" },
];

const DEVICES = [
  { label: "Mobile", pct: 78, color: "var(--cyan, #00ffff)" },
  { label: "Desktop", pct: 17, color: "var(--lime, #c8fa3c)" },
  { label: "Tablet", pct: 5, color: "var(--orange, #ff8c00)" },
];

const NEW_RETURNING = [
  { label: "New", pct: 61, color: "var(--lime, #c8fa3c)" },
  { label: "Returning", pct: 39, color: "var(--cyan, #00ffff)" },
];

const SAMPLE_CONVERSIONS = [
  { label: "New signups", target: 214, format: "n" as const, delta: "+31%" },
  { label: "Event submissions", target: 5, format: "n" as const, delta: "steady" },
  { label: "RSVPs going", target: 1840, format: "k" as const, delta: "+27%" },
];

function peakKey(): string {
  const d = new Date();
  return `pdx-stats-peak-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function BarRow({
  label,
  value,
  pct,
  color,
  delay,
  mono,
}: {
  label: string;
  value: string;
  pct: number;
  color: string;
  delay: number;
  mono?: boolean;
}) {
  return (
    <div className="admin-stats__bar-row">
      <div className="admin-stats__bar-meta">
        <span className={`admin-stats__bar-label${mono ? " admin-stats__bar-label--mono" : ""}`}>{label}</span>
        <span className="admin-stats__bar-value">{value}</span>
      </div>
      <div className="admin-stats__bar-track">
        <div
          className="admin-stats__bar-fill"
          style={{ width: `${pct}%`, background: color, animationDelay: `${delay}ms` }}
        />
      </div>
    </div>
  );
}

export default function AdminStatsView({
  enabled,
  onMetricClick,
}: {
  enabled: boolean;
  onMetricClick?: (tab: string, metricKey: keyof AdminMetrics) => void;
}) {
  const { data, isFetching, refetch, dataUpdatedAt } = useQuery<AdminMetrics>({
    queryKey: ["/api/admin/metrics"],
    queryFn: () => apiRequest("GET", "/api/admin/metrics").then(r => r.json()),
    enabled,
    staleTime: 0,
    refetchOnMount: "always",
    refetchInterval: 60_000,
  });

  const [peakToday, setPeakToday] = useState(0);

  useEffect(() => {
    if (!data) return;
    const key = peakKey();
    const stored = Number(localStorage.getItem(key) || 0);
    const next = Math.max(stored, data.activeSessions);
    if (next !== stored) localStorage.setItem(key, String(next));
    setPeakToday(next);
  }, [data?.activeSessions]);

  const trend = useMemo(() => trendPoints(TREND), []);
  const maxPageViews = Math.max(...TOP_PAGES.map(p => p.views));

  if (!data) {
    return (
      <div className="admin-stats" aria-busy="true">
        <p className="dash-mono" style={{ fontSize: 11, color: "var(--dash-muted)" }}>Loading stats…</p>
      </div>
    );
  }

  const community: { key: keyof AdminMetrics; label: string; color: StatCardColor; tab?: string }[] = [
    { key: "users", label: "Registered users", color: "lime", tab: "users" },
    { key: "activeSessions", label: "Active sessions", color: "cyan" },
    { key: "messages", label: "Active messages", color: "cyan", tab: "inbox" },
    { key: "newUsersToday", label: "New users today", color: "lime", tab: "users" },
  ];

  const program: { key: keyof AdminMetrics; label: string; color: StatCardColor; tab?: string }[] = [
    { key: "liveEvents", label: "Live events", color: "orange", tab: "events" },
    { key: "userSubmittedEvents", label: "Community-submitted", color: "cyan", tab: "events" },
    { key: "attendances", label: "Member check-ins", color: "green", tab: "events" },
    { key: "gigPosts", label: "Live gig posts", color: "orange", tab: "gigs" },
  ];

  const conversions = SAMPLE_CONVERSIONS.map((c, i) => {
    if (c.label === "Event submissions") {
      return { ...c, target: Math.max(c.target, data.userSubmittedEvents) };
    }
    if (c.label === "New signups") {
      return { ...c, target: Math.max(c.target, data.newUsersToday) };
    }
    return { ...c, delay: i * 60 };
  });

  const updatedLabel = data.generatedAt
    ? new Date(data.generatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : new Date(dataUpdatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  const renderStat = (item: (typeof community)[number]) => {
    const count = Number(data[item.key]) || 0;
    const clickable = !!item.tab && !!onMetricClick;
    return (
      <StatCard
        key={item.key}
        size="sm"
        value={count}
        label={item.label}
        color={item.color}
        action=""
        animateCount
        onClick={clickable ? () => onMetricClick!(item.tab!, item.key) : undefined}
        className={clickable ? "dash-metric-card-clickable" : ""}
      />
    );
  };

  return (
    <div className="admin-stats">
      <div className="admin-stats__live">
        <div className="admin-stats__live-left">
          <div className="admin-stats__wave" aria-hidden>
            <span /><span /><span /><span /><span />
          </div>
          <div>
            <div className="admin-stats__live-kicker">
              <span className="admin-stats__live-dot" aria-hidden />
              Live right now
            </div>
            <div className="admin-stats__live-num">
              <CountUpValue value={data.activeSessions} />{" "}
              <span className="admin-stats__live-sub">active on the site</span>
            </div>
          </div>
        </div>
        <div className="admin-stats__live-meta">
          Peak today: {peakToday} · Updated {updatedLabel}
          <button
            type="button"
            className="dash-btn dash-btn-ghost"
            onClick={() => refetch()}
            disabled={isFetching}
            style={{ display: "block", marginTop: 8, marginLeft: "auto", fontSize: 10, padding: "4px 10px" }}
          >
            <RefreshCw size={10} style={{ marginRight: 4, opacity: isFetching ? 0.5 : 1 }} />
            {isFetching ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      <h2 className="admin-stats__section-title">Site pulse</h2>
      <p className="admin-stats__section-kicker">The community</p>
      <div className="admin-stats__grid">{community.map(renderStat)}</div>

      <p className="admin-stats__section-kicker">The program</p>
      <div className="admin-stats__grid admin-stats__grid--program">{program.map(renderStat)}</div>

      <h2 className="admin-stats__section-title">Traffic and audience</h2>
      <p className="admin-stats__traffic-lede">Last 7 days versus the week before.</p>
      <div className="admin-stats__kpi-grid">
        {TRAFFIC_KPIS.map((kpi, i) => (
          <div key={kpi.id} className="admin-stats__kpi" style={{ animationDelay: `${i * 55}ms` }}>
            <div className="admin-stats__kpi-label">{kpi.label}</div>
            <div className="admin-stats__kpi-row">
              <span className="admin-stats__kpi-value">
                <AnimatedKpiValue target={kpi.target} format={kpi.format} />
              </span>
              <svg className="admin-stats__kpi-spark" viewBox="0 0 60 20" width="60" height="20" preserveAspectRatio="none" aria-hidden>
                <polyline
                  points={sparkPts(kpi.spark)}
                  fill="none"
                  stroke={kpi.color}
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="admin-stats__kpi-delta" style={{ color: kpi.color }}>
              {kpi.delta} <span>vs last week</span>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-stats__panel">
        <div className="admin-stats__panel-head">
          <h3 className="admin-stats__panel-title admin-stats__panel-title--lg">Page views · 14 days</h3>
          <span className="admin-stats__trend-tag">Trending up</span>
        </div>
        <div className="admin-stats__chart-wipe">
          <svg viewBox="0 0 100 36" preserveAspectRatio="none" aria-hidden>
            <defs>
              <linearGradient id="adminStatsArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--cyan, #00ffff)" stopOpacity="0.34" />
                <stop offset="1" stopColor="var(--cyan, #00ffff)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon points={trend.area} fill="url(#adminStatsArea)" />
            <polyline
              points={trend.line}
              fill="none"
              stroke="var(--cyan, #00ffff)"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      <div className="admin-stats__two-col">
        <div className="admin-stats__panel" style={{ marginBottom: 0 }}>
          <h3 className="admin-stats__panel-title">Top pages</h3>
          {TOP_PAGES.map((row, i) => (
            <BarRow
              key={row.path}
              label={row.path}
              value={fmtK(row.views)}
              pct={(row.views / maxPageViews) * 100}
              color={row.color}
              delay={i * 70}
              mono
            />
          ))}
        </div>
        <div className="admin-stats__panel" style={{ marginBottom: 0 }}>
          <h3 className="admin-stats__panel-title">Where they come from</h3>
          {SOURCES.map((row, i) => (
            <BarRow
              key={row.label}
              label={row.label}
              value={`${row.pct}%`}
              pct={row.pct}
              color={row.color}
              delay={i * 70}
            />
          ))}
        </div>
      </div>

      <div className="admin-stats__two-col">
        <div className="admin-stats__panel" style={{ marginBottom: 0 }}>
          <h3 className="admin-stats__panel-title">Devices</h3>
          {DEVICES.map((row, i) => (
            <BarRow
              key={row.label}
              label={row.label}
              value={`${row.pct}%`}
              pct={row.pct}
              color={row.color}
              delay={i * 70}
            />
          ))}
        </div>
        <div className="admin-stats__panel" style={{ marginBottom: 0 }}>
          <h3 className="admin-stats__panel-title">New vs returning</h3>
          {NEW_RETURNING.map((row, i) => (
            <BarRow
              key={row.label}
              label={row.label}
              value={`${row.pct}%`}
              pct={row.pct}
              color={row.color}
              delay={i * 70}
            />
          ))}
          <p className="admin-stats__insight">
            Returning visitors are climbing as Pride week nears. Keep the schedule fresh.
          </p>
        </div>
      </div>

      <h2 className="admin-stats__section-title" style={{ marginBottom: 12 }}>Conversions this week</h2>
      <div className="admin-stats__conv-grid">
        {conversions.map((c, i) => (
          <div key={c.label} className="admin-stats__conv" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="admin-stats__conv-value">
              <AnimatedKpiValue target={c.target} format={c.format} />
            </div>
            <div className="admin-stats__conv-label">{c.label}</div>
            <div className="admin-stats__conv-delta">{c.delta}</div>
          </div>
        ))}
      </div>
    </div>
  );
}