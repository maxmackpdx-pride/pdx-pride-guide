import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { StatCard } from "@/components/ds";
import CountUpValue from "@/components/CountUpValue";
import MemberGrowthChart from "@/components/admin/MemberGrowthChart";
import "./admin-stats.css";

interface AdminMetrics {
  users: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  activeSessions: number;
  liveEvents: number;
  hiddenEvents: number;
  userSubmittedEvents: number;
  seededEvents: number;
  messages: number;
  attendances: number;
  attendancesThisWeek: number;
  pendingSubmissions: number;
  pendingQueue: number;
  gigPosts: number;
  giftingPosts: number;
  missedConnections: number;
  directoryPlaces: number;
  unclaimedEvents: number;
  claimedEvents: number;
  approvedPromoters: number;
  pendingPromoterRequests: number;
  signupsTrend14d: number[];
  rsvpsTrend14d: number[];
  memberGrowth12h: Array<{
    at: string;
    signups: number;
    rsvps: number;
    total: number;
    cumulativeSignups: number;
    cumulativeRsvps: number;
  }>;
  contentBreakdown: Array<{ label: string; count: number }>;
  eventSources: Array<{ label: string; count: number }>;
  conversions: {
    newSignupsThisWeek: number;
    newSignupsPrevWeek: number;
    eventSubmissionsThisWeek: number;
    eventSubmissionsPrevWeek: number;
    rsvpsThisWeek: number;
    rsvpsPrevWeek: number;
  };
  generatedAt?: string;
  traffic: {
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
}

type StatCardColor = "lime" | "cyan" | "orange" | "pink" | "purple" | "green";

const TRAFFIC_COLORS = [
  "var(--lime, #c8fa3c)",
  "var(--cyan, #00ffff)",
  "var(--orange, #ff8c00)",
  "var(--pink, #ff00cc)",
  "var(--purple, #8800ff)",
  "var(--amber, #ffee00)",
];

function fmtK(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(Math.round(n));
}

function mmss(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
}

function sparkPts(arr: number[]): string {
  if (arr.length < 2) return "0,10 60,10";
  const mn = Math.min(...arr);
  const mx = Math.max(...arr);
  const range = mx - mn || 1;
  return arr
    .map((v, i) => `${((i / (arr.length - 1)) * 60).toFixed(1)},${(18 - ((v - mn) / range) * 16).toFixed(1)}`)
    .join(" ");
}

function trafficDelta(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? "new" : "steady";
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return "steady";
  return `${pct > 0 ? "+" : ""}${pct}% vs last week`;
}

const BREAKDOWN_COLORS = [
  "var(--cyan, #00ffff)",
  "var(--lime, #c8fa3c)",
  "var(--pink, #ff00cc)",
  "var(--orange, #ff8c00)",
  "var(--amber, #ffee00)",
  "var(--purple, #8800ff)",
];

const SOURCE_COLORS = [
  "var(--lime, #c8fa3c)",
  "var(--cyan, #00ffff)",
  "var(--orange, #ff8c00)",
  "var(--pink, #ff00cc)",
];

function trendPoints(values: number[]): { line: string; area: string } {
  if (values.length < 2) {
    return { line: "0,18 100,18", area: "0,36 0,18 100,18 100,36" };
  }
  const mn = Math.min(...values);
  const mx = Math.max(...values);
  const range = mx - mn || 1;
  const line = values
    .map((v, i) => `${((i / (values.length - 1)) * 100).toFixed(2)},${(34 - ((v - mn) / range) * 30).toFixed(2)}`)
    .join(" ");
  return { line, area: `0,36 ${line} 100,36` };
}

function formatDelta(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? "new this week" : "steady";
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return "steady";
  return `${pct > 0 ? "+" : ""}${pct}% vs last week`;
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

  const trafficTrend = useMemo(() => {
    if (!data?.traffic) return trendPoints([]);
    return trendPoints(data.traffic.pageViewsTrend14d);
  }, [data]);

  if (!data) {
    return (
      <div className="admin-stats" aria-busy="true">
        <p className="dash-mono" style={{ fontSize: 11, color: "var(--dash-muted)" }}>Loading stats…</p>
      </div>
    );
  }

  const community: { key: keyof AdminMetrics; label: string; color: StatCardColor; tab?: string }[] = [
    { key: "users", label: "Registered users", color: "lime", tab: "users" },
    { key: "newUsersToday", label: "New users today", color: "lime", tab: "users" },
    { key: "messages", label: "Active messages", color: "cyan", tab: "inbox" },
    { key: "activeSessions", label: "Server sessions", color: "cyan" },
  ];

  const program: { key: keyof AdminMetrics; label: string; color: StatCardColor; tab?: string }[] = [
    { key: "liveEvents", label: "Live events", color: "orange", tab: "events" },
    { key: "directoryPlaces", label: "Directory places", color: "pink" },
    { key: "attendances", label: "Member RSVPs", color: "green", tab: "events" },
    { key: "pendingQueue", label: "Queue pending", color: "orange", tab: "inbox" },
    { key: "gigPosts", label: "Live gig posts", color: "orange", tab: "gigs" },
    { key: "giftingPosts", label: "Gifting posts", color: "lime" },
    { key: "missedConnections", label: "Spotted posts", color: "pink" },
    { key: "unclaimedEvents", label: "Unclaimed events", color: "cyan", tab: "events" },
  ];

  const maxContent = Math.max(...data.contentBreakdown.map(r => r.count), 1);
  const maxSources = Math.max(...data.eventSources.map(r => r.count), 1);
  const claimTotal = Math.max(data.claimedEvents + data.unclaimedEvents, 1);

  const memberActivity = [
    { label: "RSVPs", count: data.attendances },
    { label: "Messages", count: data.messages },
    { label: "Gig posts", count: data.gigPosts },
    { label: "Gifting", count: data.giftingPosts },
    { label: "Spotted", count: data.missedConnections },
  ].sort((a, b) => b.count - a.count);
  const maxActivity = Math.max(...memberActivity.map(r => r.count), 1);

  const conversions = [
    {
      label: "New signups",
      target: data.conversions.newSignupsThisWeek,
      delta: formatDelta(data.conversions.newSignupsThisWeek, data.conversions.newSignupsPrevWeek),
    },
    {
      label: "Event submissions",
      target: data.conversions.eventSubmissionsThisWeek,
      delta: formatDelta(data.conversions.eventSubmissionsThisWeek, data.conversions.eventSubmissionsPrevWeek),
    },
    {
      label: "RSVPs going",
      target: data.conversions.rsvpsThisWeek,
      delta: formatDelta(data.conversions.rsvpsThisWeek, data.conversions.rsvpsPrevWeek),
    },
  ];

  const updatedLabel = data.generatedAt
    ? new Date(data.generatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : new Date(dataUpdatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  const signupTotal = data.signupsTrend14d.reduce((a, b) => a + b, 0);
  const rsvpTotal = data.rsvpsTrend14d.reduce((a, b) => a + b, 0);
  const traffic = data.traffic;
  const maxPageViews = Math.max(...traffic.topPages.map(p => p.views), 1);
  const trafficSpark = traffic.pageViewsTrend14d.slice(-8);

  const trafficKpis = [
    {
      id: "pv",
      label: "Page views",
      value: fmtK(traffic.pageViews7d),
      delta: trafficDelta(traffic.pageViews7d, traffic.pageViewsPrev7d),
      color: TRAFFIC_COLORS[0],
      spark: trafficSpark,
    },
    {
      id: "uv",
      label: "Unique visitors",
      value: fmtK(traffic.uniqueVisitors7d),
      delta: trafficDelta(traffic.uniqueVisitors7d, traffic.uniqueVisitorsPrev7d),
      color: TRAFFIC_COLORS[1],
      spark: trafficSpark,
    },
    {
      id: "ss",
      label: "Sessions",
      value: fmtK(traffic.sessions7d),
      delta: trafficDelta(traffic.sessions7d, traffic.sessionsPrev7d),
      color: TRAFFIC_COLORS[0],
      spark: trafficSpark,
    },
    {
      id: "dur",
      label: "Avg. session",
      value: mmss(traffic.avgSessionSeconds7d),
      delta: trafficDelta(traffic.avgSessionSeconds7d, traffic.avgSessionSecondsPrev7d),
      color: TRAFFIC_COLORS[0],
      spark: trafficSpark,
    },
    {
      id: "br",
      label: "Bounce rate",
      value: `${traffic.bounceRate7d}%`,
      delta: trafficDelta(traffic.bounceRate7d, traffic.bounceRatePrev7d),
      color: TRAFFIC_COLORS[2],
      spark: trafficSpark,
    },
    {
      id: "pp",
      label: "Pages / session",
      value: traffic.pagesPerSession7d.toFixed(1),
      delta: trafficDelta(traffic.pagesPerSession7d, traffic.pagesPerSessionPrev7d),
      color: TRAFFIC_COLORS[0],
      spark: trafficSpark,
    },
  ];

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
              <CountUpValue value={traffic.activeNow} />{" "}
              <span className="admin-stats__live-sub">visitors in the last 5 min</span>
            </div>
          </div>
        </div>
        <div className="admin-stats__live-meta">
          Updated {updatedLabel}
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
      <p className="admin-stats__section-lede">Last 7 days versus the week before. First-party pageview tracking — no Google Analytics.</p>
      <div className="admin-stats__kpi-grid">
        {trafficKpis.map((kpi, i) => (
          <div key={kpi.id} className="admin-stats__kpi" style={{ animationDelay: `${i * 55}ms` }}>
            <div className="admin-stats__kpi-label">{kpi.label}</div>
            <div className="admin-stats__kpi-row">
              <span className="admin-stats__kpi-value">{kpi.value}</span>
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
              {kpi.delta}
            </div>
          </div>
        ))}
      </div>

      <div className="admin-stats__panel">
        <div className="admin-stats__panel-head">
          <h3 className="admin-stats__panel-title admin-stats__panel-title--lg">Page views · 14 days</h3>
          <span className="admin-stats__trend-tag">
            {traffic.pageViews7d > 0 ? "Tracking live" : "Collecting data"}
          </span>
        </div>
        <div className="admin-stats__chart-wipe">
          <svg viewBox="0 0 100 36" preserveAspectRatio="none" aria-hidden>
            <defs>
              <linearGradient id="adminStatsTrafficArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--lime, #c8fa3c)" stopOpacity="0.34" />
                <stop offset="1" stopColor="var(--lime, #c8fa3c)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon points={trafficTrend.area} fill="url(#adminStatsTrafficArea)" />
            <polyline
              points={trafficTrend.line}
              fill="none"
              stroke="var(--lime, #c8fa3c)"
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
          {traffic.topPages.length === 0 ? (
            <p className="admin-stats__insight">No pageviews recorded yet. Browse the public site to seed data.</p>
          ) : (
            traffic.topPages.map((row, i) => (
              <BarRow
                key={row.path}
                label={row.path}
                value={fmtK(row.views)}
                pct={(row.views / maxPageViews) * 100}
                color={TRAFFIC_COLORS[i % TRAFFIC_COLORS.length]}
                delay={i * 70}
                mono
              />
            ))
          )}
        </div>
        <div className="admin-stats__panel" style={{ marginBottom: 0 }}>
          <h3 className="admin-stats__panel-title">Where they come from</h3>
          {traffic.sources.length === 0 ? (
            <p className="admin-stats__insight">Referrer data appears after visitors arrive from external links.</p>
          ) : (
            traffic.sources.map((row, i) => (
              <BarRow
                key={row.label}
                label={row.label}
                value={`${row.pct}%`}
                pct={row.pct}
                color={TRAFFIC_COLORS[i % TRAFFIC_COLORS.length]}
                delay={i * 70}
              />
            ))
          )}
        </div>
      </div>

      <div className="admin-stats__two-col">
        <div className="admin-stats__panel" style={{ marginBottom: 0 }}>
          <h3 className="admin-stats__panel-title">Devices</h3>
          {traffic.devices.length === 0 ? (
            <p className="admin-stats__insight">Device mix fills in as pageviews arrive.</p>
          ) : (
            traffic.devices.map((row, i) => (
              <BarRow
                key={row.label}
                label={row.label}
                value={`${row.pct}%`}
                pct={row.pct}
                color={TRAFFIC_COLORS[i % TRAFFIC_COLORS.length]}
                delay={i * 70}
              />
            ))
          )}
        </div>
        <div className="admin-stats__panel" style={{ marginBottom: 0 }}>
          <h3 className="admin-stats__panel-title">New vs returning</h3>
          {traffic.newReturning.map((row, i) => (
            <BarRow
              key={row.label}
              label={row.label}
              value={`${row.pct}%`}
              pct={row.pct}
              color={TRAFFIC_COLORS[i % TRAFFIC_COLORS.length]}
              delay={i * 70}
            />
          ))}
        </div>
      </div>

      <h2 className="admin-stats__section-title">Member growth</h2>
      <p className="admin-stats__section-lede">
        Signups and RSVPs in 12-hour buckets over the last 14 days. {signupTotal} signup{signupTotal === 1 ? "" : "s"},{" "}
        {rsvpTotal} RSVP{rsvpTotal === 1 ? "" : "s"} total.
      </p>
      <div className="admin-stats__panel">
        <div className="admin-stats__panel-head">
          <h3 className="admin-stats__panel-title admin-stats__panel-title--lg">Signups + RSVPs · 14 days</h3>
          <span className="admin-stats__trend-tag">12-hour buckets</span>
        </div>
        <MemberGrowthChart buckets={data.memberGrowth12h} />
      </div>

      <div className="admin-stats__two-col">
        <div className="admin-stats__panel" style={{ marginBottom: 0 }}>
          <h3 className="admin-stats__panel-title">Content live on site</h3>
          {data.contentBreakdown.map((row, i) => (
            <BarRow
              key={row.label}
              label={row.label}
              value={String(row.count)}
              pct={(row.count / maxContent) * 100}
              color={BREAKDOWN_COLORS[i % BREAKDOWN_COLORS.length]}
              delay={i * 70}
            />
          ))}
        </div>
        <div className="admin-stats__panel" style={{ marginBottom: 0 }}>
          <h3 className="admin-stats__panel-title">Event catalog sources</h3>
          {data.eventSources.length === 0 ? (
            <p className="admin-stats__insight">No live events in the catalog yet.</p>
          ) : (
            data.eventSources.map((row, i) => (
              <BarRow
                key={row.label}
                label={row.label}
                value={String(row.count)}
                pct={(row.count / maxSources) * 100}
                color={SOURCE_COLORS[i % SOURCE_COLORS.length]}
                delay={i * 70}
              />
            ))
          )}
        </div>
      </div>

      <div className="admin-stats__two-col">
        <div className="admin-stats__panel" style={{ marginBottom: 0 }}>
          <h3 className="admin-stats__panel-title">Board activity</h3>
          {memberActivity.map((row, i) => (
            <BarRow
              key={row.label}
              label={row.label}
              value={String(row.count)}
              pct={(row.count / maxActivity) * 100}
              color={BREAKDOWN_COLORS[i % BREAKDOWN_COLORS.length]}
              delay={i * 70}
            />
          ))}
        </div>
        <div className="admin-stats__panel" style={{ marginBottom: 0 }}>
          <h3 className="admin-stats__panel-title">Claimed vs unclaimed</h3>
          <BarRow
            label="Claimed"
            value={String(data.claimedEvents)}
            pct={(data.claimedEvents / claimTotal) * 100}
            color="var(--lime, #c8fa3c)"
            delay={0}
          />
          <BarRow
            label="Unclaimed"
            value={String(data.unclaimedEvents)}
            pct={(data.unclaimedEvents / claimTotal) * 100}
            color="var(--cyan, #00ffff)"
            delay={70}
          />
          <p className="admin-stats__insight">
            {data.unclaimedEvents > 0
              ? `${data.unclaimedEvents} live listing${data.unclaimedEvents === 1 ? "" : "s"} still open for promoters to claim.`
              : "Every live event has a host attached."}
          </p>
        </div>
      </div>

      <h2 className="admin-stats__section-title" style={{ marginBottom: 12 }}>This week</h2>
      <p className="admin-stats__section-lede">Rolling 7-day counts compared to the prior week.</p>
      <div className="admin-stats__conv-grid">
        {conversions.map((c, i) => (
          <div key={c.label} className="admin-stats__conv" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="admin-stats__conv-value">
              <CountUpValue value={c.target} />
            </div>
            <div className="admin-stats__conv-label">{c.label}</div>
            <div className="admin-stats__conv-delta">{c.delta}</div>
          </div>
        ))}
      </div>
    </div>
  );
}