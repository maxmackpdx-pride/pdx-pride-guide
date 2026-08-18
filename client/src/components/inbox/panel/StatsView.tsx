import type { CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import MemberGrowthChart from "@/components/admin/MemberGrowthChart";
import { useAuth } from "@/context/AuthContext";
import "@/components/admin/admin-stats.css";
import "../inbox-experiment.css";
import { C, hbars } from "./sheet";

type Traffic = {
  source: "first_party" | "google_analytics";
  gaTrackingEnabled: boolean;
  gaReportingEnabled: boolean;
  activeNow: number;
  pageViews7d: number;
  pageViewsPrev7d: number;
  uniqueVisitors7d: number;
  sessions7d: number;
  avgSessionSeconds7d: number;
  bounceRate7d: number;
  pagesPerSession7d: number;
  pageViewsTrend14d: number[];
  topPages: Array<{ path: string; views: number }>;
  sources: Array<{ label: string; pct: number }>;
  devices: Array<{ label: string; pct: number }>;
  newReturning: Array<{ label: string; pct: number }>;
};

type MemberGrowthBucket = {
  at: string;
  signups: number;
  rsvps: number;
  total: number;
  cumulativeSignups: number;
  cumulativeRsvps: number;
};

type Metrics = {
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
  signupsTrend14d?: number[];
  rsvpsTrend14d?: number[];
  memberGrowth12h?: MemberGrowthBucket[];
  traffic?: Traffic;
  productExperience?: {
    windowDays: number;
    timeToContent: { medianMs: number | null; samples: number };
    posting: { attempts: number; completions: number; completionRate: number | null };
    contact: { attempts: number; completions: number; completionRate: number | null };
    reportDiscovery: { seen: number; opened: number; discoveryRate: number | null; completed: number };
    counterMismatches: number;
  };
};

function fmtSession(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}
function fmtDelta(cur: number, prev: number): string {
  if (!prev) return cur > 0 ? "new" : "-";
  const pct = Math.round(((cur - prev) / prev) * 100);
  return `${pct >= 0 ? "+" : ""}${pct}% vs last week`;
}

function Tile({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="inbox-exp-stats-tile">
      <div className="inbox-exp-stats-tile__value">{value}</div>
      <div className="inbox-exp-stats-tile__label">{label}</div>
    </div>
  );
}

function HBars({ rows }: { rows: ReturnType<typeof hbars> }) {
  return (
    <>
      {rows.map((it) => (
        <div key={it.label} className="inbox-exp-stats-hbar">
          <div className="inbox-exp-stats-hbar__head">
            <span className="inbox-exp-stats-hbar__label">{it.label}</span>
            <span className="inbox-exp-stats-hbar__value">{it.display}</span>
          </div>
          <div className="inbox-exp-stats-hbar__track">
            <div
              className="inbox-exp-stats-hbar__fill"
              style={{ width: it.width, "--inbox-exp-hbar-color": it.color } as CSSProperties}
            />
          </div>
        </div>
      ))}
    </>
  );
}

type AdStatsSummary = {
  liveCount: number;
  impressions: number;
  clicks: number;
  avgCtr: number;
};

export default function StatsView() {
  const { user } = useAuth();
  const fullStats = !!(user?.canViewUsers || user?.isPrimaryOwner);
  const isOwner = !!user?.isPrimaryOwner;

  const { data: m } = useQuery<Metrics>({
    queryKey: ["/api/admin/metrics"],
    queryFn: () => fetch("/api/admin/metrics", { credentials: "include" }).then((r) => (r.ok ? r.json() : null)),
  });

  const { data: places = [] } = useQuery<unknown[]>({
    queryKey: ["/api/directory"],
    queryFn: () => fetch("/api/directory", { credentials: "include" }).then((r) => (r.ok ? r.json() : [])),
  });

  const { data: adStats } = useQuery<AdStatsSummary>({
    queryKey: ["/api/admin/ads/stats"],
    queryFn: () =>
      fetch("/api/admin/ads/stats", { credentials: "include" }).then((r) => (r.ok ? r.json() : null)),
    enabled: isOwner,
  });

  if (!m) {
    return <div className="inbox-exp-empty">LOADING STATS…</div>;
  }

  const tr = m.traffic;
  const claimed = Math.max(0, m.liveEvents - m.userSubmittedEvents);
  const unclaimed = m.userSubmittedEvents;
  const total = claimed + unclaimed;
  const claimedPct = total ? (claimed / total) * 100 : 0;

  const community: Array<[number | string, string]> = fullStats
    ? [
        [m.users, "REGISTERED USERS"],
        [m.newUsersToday, "NEW USERS TODAY"],
        [m.liveEvents, "LIVE EVENTS"],
        [places.length || "-", "DIRECTORY PLACES"],
        [m.attendances, "MEMBER RSVPS"],
        [m.giftingPosts, "GIFTZ POSTS"],
        [m.missedConnections, "MIZZED CONNECTION"],
        [m.userSubmittedEvents, "UNCLAIMED EVENTS"],
      ]
    : [
        [m.liveEvents, "LIVE EVENTS"],
        [places.length || "-", "DIRECTORY PLACES"],
        [m.attendances, "MEMBER RSVPS"],
        [m.giftingPosts, "GIFTZ POSTS"],
        [m.missedConnections, "MIZZED CONNECTION"],
        [m.userSubmittedEvents, "UNCLAIMED EVENTS"],
      ];

  const board = hbars(
    [
      ["Messages", m.messages],
      ["RSVPs", m.attendances],
      ["GIGZ", m.gigPosts],
      ["GIFTZ", m.giftingPosts],
      ["MIZZED CONNECTION", m.missedConnections],
    ],
    C.purple,
  );

  const memberGrowth = m.memberGrowth12h ?? [];
  const signupTotal = (m.signupsTrend14d ?? []).reduce((a, b) => a + b, 0);
  const rsvpTotal = (m.rsvpsTrend14d ?? []).reduce((a, b) => a + b, 0);

  return (
    <div className="inbox-exp-stats">
      {fullStats && (
        <>
          <div className="inbox-exp-kicker inbox-exp-kicker--green">
            <span className="inbox-exp-kicker__ld" aria-hidden />
            SITE PULSE
          </div>
          <div className="inbox-exp-stats-pulse">
            <div className="inbox-exp-stats-pulse__label">LIVE RIGHT NOW</div>
            <div className="inbox-exp-stats-pulse__row">
              <span className="inbox-exp-stats-pulse__value">{tr?.activeNow ?? m.activeSessions}</span>
              <span className="inbox-exp-stats-pulse__sub">visitors in the last 5 min</span>
            </div>
            <div className="inbox-exp-stats-pulse__foot">
              {tr?.source === "google_analytics" ? "Google Analytics" : "First-party (GA API fallback)"}
            </div>
          </div>
        </>
      )}

      <div className={`inbox-exp-stats-title${fullStats ? "" : " inbox-exp-stats-title--first"} inbox-exp-stats-title--tight`}>
        SNAPSHOT
      </div>
      <p className="inbox-exp-stats-copy">Live totals across the platform right now.</p>
      <div className="inbox-exp-stats-stack">
        {[
          [m.newUsersToday, "NEW USERS TODAY", C.limeSoft],
          [m.userSubmittedEvents, "USER EVENT SUBMISSIONS", C.cyan],
          [m.attendances, "RSVPS GOING", C.magenta],
        ].map(([value, label, color], i) => (
          <div
            key={i}
            className="inbox-exp-stats-snapshot"
            style={{ "--inbox-exp-stat-accent": color } as CSSProperties}
          >
            <div className="inbox-exp-stats-snapshot__value">{value}</div>
            <div className="inbox-exp-stats-snapshot__label">{label}</div>
          </div>
        ))}
      </div>

      {isOwner && adStats && (
        <>
          <div className="inbox-exp-stats-title">ADS</div>
          <p className="inbox-exp-stats-copy">
            Owner-only rollup from Ad Manager.{" "}
            <a href="/admin?tab=ads" style={{ color: C.cyan }}>
              Open Ad Manager
            </a>
          </p>
          <div className="inbox-exp-stats-grid">
            <Tile value={adStats.liveCount} label="LIVE ADS" />
            <Tile value={adStats.impressions} label="IMPRESSIONS" />
            <Tile value={adStats.clicks} label="CLICKS" />
            <Tile value={`${adStats.avgCtr.toFixed(2)}%`} label="AVG CTR" />
          </div>
        </>
      )}

      <div className="inbox-exp-stats-title">THE COMMUNITY</div>
      <div className="inbox-exp-stats-grid">
        {community.map(([value, label]) => (
          <Tile key={label} value={value} label={label} />
        ))}
      </div>

      {fullStats && (
        <>
          <div className="inbox-exp-stats-title">BOARD ACTIVITY</div>
          <HBars rows={board} />

          {m.productExperience && (
            <>
              <div className="inbox-exp-stats-title">PRODUCT EXPERIENCE · {m.productExperience.windowDays} DAYS</div>
              <p className="inbox-exp-stats-copy">Completion rates include their attempt counts so low-volume signals stay honest.</p>
              <div className="inbox-exp-stats-grid">
                <Tile
                  value={m.productExperience.timeToContent.medianMs == null ? "—" : `${(m.productExperience.timeToContent.medianMs / 1000).toFixed(1)}s`}
                  label={`TIME TO CONTENT · N=${m.productExperience.timeToContent.samples}`}
                />
                <Tile
                  value={m.productExperience.posting.completionRate == null ? "—" : `${m.productExperience.posting.completionRate}%`}
                  label={`POST COMPLETION · ${m.productExperience.posting.completions}/${m.productExperience.posting.attempts}`}
                />
                <Tile
                  value={m.productExperience.contact.completionRate == null ? "—" : `${m.productExperience.contact.completionRate}%`}
                  label={`CONTACT COMPLETION · ${m.productExperience.contact.completions}/${m.productExperience.contact.attempts}`}
                />
                <Tile
                  value={m.productExperience.reportDiscovery.discoveryRate == null ? "—" : `${m.productExperience.reportDiscovery.discoveryRate}%`}
                  label={`REPORT DISCOVERY · ${m.productExperience.reportDiscovery.opened}/${m.productExperience.reportDiscovery.seen}`}
                />
                <Tile value={m.productExperience.reportDiscovery.completed} label="REPORTS COMPLETED" />
                <Tile value={m.productExperience.counterMismatches} label="COUNTER MISMATCHES" />
              </div>
            </>
          )}

          <div className="inbox-exp-stats-title">CLAIMED VS UNCLAIMED</div>
          <div className="inbox-exp-stats-donut">
            <div
              className="inbox-exp-stats-donut__ring"
              style={{
                background: `conic-gradient(${C.limeSoft} 0 ${claimedPct}%, ${C.magenta} ${claimedPct}% 100%)`,
              }}
            >
              <div className="inbox-exp-stats-donut__hole">
                <span className="inbox-exp-stats-donut__total">{total}</span>
                <span className="inbox-exp-stats-donut__total-label">EVENTS</span>
              </div>
            </div>
            <div className="inbox-exp-stats-legend">
              <div className="inbox-exp-stats-legend__row">
                <span className="inbox-exp-stats-legend__swatch" style={{ background: C.limeSoft }} />
                <span className="inbox-exp-stats-legend__label">Claimed</span>
                <span className="inbox-exp-stats-legend__value">{claimed}</span>
              </div>
              <div className="inbox-exp-stats-legend__row">
                <span className="inbox-exp-stats-legend__swatch" style={{ background: C.magenta }} />
                <span className="inbox-exp-stats-legend__label">Unclaimed</span>
                <span className="inbox-exp-stats-legend__value">{unclaimed}</span>
              </div>
            </div>
          </div>
          <p className="inbox-exp-stats-copy" style={{ marginTop: 12 }}>
            {unclaimed} live listings still open for promoters to claim.
          </p>
        </>
      )}

      {tr && (
        <>
          <div className="inbox-exp-stats-title">TRAFFIC &amp; AUDIENCE</div>
          {fullStats && (
            <div className="inbox-exp-stats-badges">
              {[
                [`GA TRACKING ${tr.gaTrackingEnabled ? "ON" : "OFF"}`, tr.gaTrackingEnabled ? C.green : C.faint],
                [`GA REPORTING ${tr.gaReportingEnabled ? "ON" : "OFF"}`, tr.gaReportingEnabled ? C.green : C.faint],
                [`SOURCE: ${tr.source === "google_analytics" ? "GOOGLE ANALYTICS" : "FIRST-PARTY"}`, C.cyan],
              ].map(([label, color]) => (
                <span
                  key={label as string}
                  className="inbox-exp-stats-badge"
                  style={{ "--inbox-exp-badge-color": color } as CSSProperties}
                >
                  {label}
                </span>
              ))}
            </div>
          )}
          <div className="inbox-exp-stats-grid">
            {(fullStats
              ? ([
                  ["PAGE VIEWS", String(tr.pageViews7d)],
                  ["UNIQUE VISITORS", String(tr.uniqueVisitors7d)],
                  ["SESSIONS", String(tr.sessions7d)],
                  ["AVG. SESSION", fmtSession(tr.avgSessionSeconds7d)],
                  ["BOUNCE RATE", `${tr.bounceRate7d}%`],
                  ["PAGES / SESSION", tr.pagesPerSession7d.toFixed(1)],
                ] as Array<[string, string]>)
              : ([
                  ["PAGE VIEWS", String(tr.pageViews7d)],
                  ["UNIQUE VISITORS", String(tr.uniqueVisitors7d)],
                ] as Array<[string, string]>)
            ).map(([label, value]) => (
              <div key={label} className="inbox-exp-stats-tile">
                <span className="inbox-exp-stats-metric__label">{label}</span>
                <div className="inbox-exp-stats-metric__value">{value}</div>
              </div>
            ))}
          </div>

          {fullStats && (
            <>
              <div className="inbox-exp-stats-chart">
                <div className="inbox-exp-stats-chart__head">
                  <span className="inbox-exp-stats-chart__title">PAGE VIEWS · 14 DAYS</span>
                  <span className="inbox-exp-stats-chart__delta">
                    <span className="inbox-exp-stats-chart__delta-dot" aria-hidden />
                    {fmtDelta(tr.pageViews7d, tr.pageViewsPrev7d)}
                  </span>
                </div>
                <div className="inbox-exp-stats-sparkline">
                  {(() => {
                    const max = Math.max(...tr.pageViewsTrend14d, 1);
                    return tr.pageViewsTrend14d.map((v, i) => (
                      <div
                        key={i}
                        className="inbox-exp-stats-sparkline__bar"
                        style={{ height: `${Math.round((v / max) * 100)}%` }}
                      />
                    ));
                  })()}
                </div>
              </div>

              {tr.topPages.length > 0 && (
                <>
                  <div className="inbox-exp-stats-title">TOP PAGES</div>
                  <HBars rows={hbars(tr.topPages.map((p) => [p.path, p.views] as [string, number]), C.cyan)} />
                </>
              )}
              {tr.sources.length > 0 && (
                <>
                  <div className="inbox-exp-stats-title">WHERE THEY COME FROM</div>
                  <HBars rows={hbars(tr.sources.map((s) => [s.label, s.pct] as [string, number]), C.magenta, "%")} />
                </>
              )}
              {tr.devices.length > 0 && (
                <>
                  <div className="inbox-exp-stats-title">DEVICES</div>
                  <HBars rows={hbars(tr.devices.map((d) => [d.label, d.pct] as [string, number]), C.orange, "%")} />
                </>
              )}
              {tr.newReturning.length > 0 && (
                <>
                  <div className="inbox-exp-stats-title">NEW VS RETURNING</div>
                  <HBars rows={hbars(tr.newReturning.map((n) => [n.label, n.pct] as [string, number]), C.limeSoft, "%")} />
                </>
              )}
            </>
          )}
        </>
      )}

      {fullStats && (
        <>
          <div className="inbox-exp-stats-title">MEMBER GROWTH</div>
          <p className="inbox-exp-stats-copy">
            Signups and RSVPs in 12-hour buckets over the last 14 days. {signupTotal} signup{signupTotal === 1 ? "" : "s"},{" "}
            {rsvpTotal} RSVP{rsvpTotal === 1 ? "" : "s"} total.
          </p>
          <div className="inbox-exp-stats-chart inbox-exp-stats-chart--growth">
            <div className="inbox-exp-stats-chart__head">
              <span className="inbox-exp-stats-chart__title">SIGNUPS + RSVPS · 14 DAYS</span>
              <span className="inbox-exp-stats-chart__delta inbox-exp-stats-chart__delta--cyan">
                <span className="inbox-exp-stats-chart__delta-dot" aria-hidden />
                12-HOUR BUCKETS
              </span>
            </div>
            <MemberGrowthChart buckets={memberGrowth} />
          </div>
        </>
      )}
    </div>
  );
}
