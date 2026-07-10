import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { StatCard } from "@/components/ds";
import CountUpValue from "@/components/CountUpValue";
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
}

type StatCardColor = "lime" | "cyan" | "orange" | "pink" | "purple" | "green";

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

  const activityTrend = useMemo(() => {
    if (!data) return trendPoints([]);
    const combined = data.signupsTrend14d.map((v, i) => v + (data.rsvpsTrend14d[i] ?? 0));
    return trendPoints(combined);
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
      <div className="admin-stats__notice" role="note">
        <strong>No web traffic analytics yet.</strong> This page does not track page views, unique visitors,
        referral sources, devices, or bounce rate. Every number below is counted from the app database:
        signups, RSVPs, listings, messages, and queue items.
      </div>

      <div className="admin-stats__toolbar">
        <span className="admin-stats__toolbar-meta">Updated {updatedLabel} · refreshes every minute</span>
        <button
          type="button"
          className="dash-btn dash-btn-ghost"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw size={12} style={{ marginRight: 6, opacity: isFetching ? 0.5 : 1 }} />
          {isFetching ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <h2 className="admin-stats__section-title">Site pulse</h2>
      <p className="admin-stats__section-kicker">The community</p>
      <div className="admin-stats__grid">{community.map(renderStat)}</div>

      <p className="admin-stats__section-kicker">The program</p>
      <div className="admin-stats__grid admin-stats__grid--program">{program.map(renderStat)}</div>

      <h2 className="admin-stats__section-title">Member growth</h2>
      <p className="admin-stats__section-lede">
        Daily signups and new RSVPs over the last 14 days. {signupTotal} signup{signupTotal === 1 ? "" : "s"},{" "}
        {rsvpTotal} RSVP{rsvpTotal === 1 ? "" : "s"} in this window.
      </p>
      <div className="admin-stats__panel">
        <div className="admin-stats__panel-head">
          <h3 className="admin-stats__panel-title admin-stats__panel-title--lg">Signups + RSVPs · 14 days</h3>
          <span className="admin-stats__trend-tag">Database only</span>
        </div>
        <div className="admin-stats__chart-wipe">
          <svg viewBox="0 0 100 36" preserveAspectRatio="none" aria-hidden>
            <defs>
              <linearGradient id="adminStatsArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--cyan, #00ffff)" stopOpacity="0.34" />
                <stop offset="1" stopColor="var(--cyan, #00ffff)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon points={activityTrend.area} fill="url(#adminStatsArea)" />
            <polyline
              points={activityTrend.line}
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