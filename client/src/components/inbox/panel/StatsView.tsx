import { useQuery } from "@tanstack/react-query";
import MemberGrowthChart from "@/components/admin/MemberGrowthChart";
import "@/components/admin/admin-stats.css";
import { C, MONO, DISPLAY, sectionTitle, barTrack, hbars } from "./sheet";

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
};

function fmtSession(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}
function fmtDelta(cur: number, prev: number): string {
  if (!prev) return cur > 0 ? "new" : "—";
  const pct = Math.round(((cur - prev) / prev) * 100);
  return `${pct >= 0 ? "+" : ""}${pct}% vs last week`;
}

function Tile({ value, label }: { value: number | string; label: string }) {
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 14, background: C.card, padding: 14 }}>
      <div
        style={{
          fontFamily: DISPLAY,
          fontWeight: 800,
          fontSize: 34,
          lineHeight: 0.85,
          color: C.heading,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".09em", color: C.meta, marginTop: 7 }}>
        {label}
      </div>
    </div>
  );
}

function HBars({ rows }: { rows: ReturnType<typeof hbars> }) {
  return (
    <>
      {rows.map((it) => (
        <div key={it.label} style={{ marginBottom: 11 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 13, color: C.body }}>{it.label}</span>
            <span
              style={{
                fontFamily: DISPLAY,
                fontWeight: 800,
                fontSize: 15,
                color: C.heading,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {it.display}
            </span>
          </div>
          <div style={barTrack}>
            <div style={{ height: "100%", width: it.width, borderRadius: 999, background: it.color }} />
          </div>
        </div>
      ))}
    </>
  );
}

export default function StatsView() {
  const { data: m } = useQuery<Metrics>({
    queryKey: ["/api/admin/metrics"],
    queryFn: () => fetch("/api/admin/metrics", { credentials: "include" }).then((r) => (r.ok ? r.json() : null)),
  });

  const { data: places = [] } = useQuery<unknown[]>({
    queryKey: ["/api/directory"],
    queryFn: () => fetch("/api/directory", { credentials: "include" }).then((r) => (r.ok ? r.json() : [])),
  });

  if (!m) {
    return (
      <div style={{ textAlign: "center", padding: "48px 20px", color: C.faint, fontFamily: MONO, fontSize: 11, letterSpacing: ".1em" }}>
        LOADING STATS…
      </div>
    );
  }

  const tr = m.traffic;
  const claimed = Math.max(0, m.liveEvents - m.userSubmittedEvents);
  const unclaimed = m.userSubmittedEvents;
  const total = claimed + unclaimed;
  const claimedPct = total ? (claimed / total) * 100 : 0;

  const community: Array<[number | string, string]> = [
    [m.users, "REGISTERED USERS"],
    [m.newUsersToday, "NEW USERS TODAY"],
    [m.liveEvents, "LIVE EVENTS"],
    [places.length || "—", "DIRECTORY PLACES"],
    [m.attendances, "MEMBER RSVPS"],
    [m.giftingPosts, "GIFTING POSTS"],
    [m.missedConnections, "MISSED CONNECTIONS"],
    [m.userSubmittedEvents, "UNCLAIMED EVENTS"],
  ];

  const board = hbars(
    [
      ["Messages", m.messages],
      ["RSVPs", m.attendances],
      ["Gig posts", m.gigPosts],
      ["Gifting", m.giftingPosts],
      ["Missed Connections", m.missedConnections],
    ],
    C.purple,
  );

  const memberGrowth = m.memberGrowth12h ?? [];
  const signupTotal = (m.signupsTrend14d ?? []).reduce((a, b) => a + b, 0);
  const rsvpTotal = (m.rsvpsTrend14d ?? []).reduce((a, b) => a + b, 0);

  return (
    <>
      {/* SITE PULSE */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          margin: "0 2px 12px",
          fontFamily: MONO,
          fontSize: 10,
          letterSpacing: ".14em",
          fontWeight: 600,
          color: C.green,
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: 999, background: C.green, boxShadow: `0 0 8px ${C.green}`, flex: "none" }} />
        SITE PULSE
      </div>
      <div style={{ border: `1px solid ${C.border}`, borderTop: `3px solid ${C.green}`, borderRadius: 16, background: C.card, padding: 16, marginBottom: 8 }}>
        <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: ".12em", color: C.meta }}>LIVE RIGHT NOW</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 8 }}>
          <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 56, lineHeight: 0.85, color: C.heading, fontVariantNumeric: "tabular-nums" }}>
            {tr?.activeNow ?? m.activeSessions}
          </span>
          <span style={{ fontSize: 14, color: C.body, lineHeight: 1.3 }}>visitors in the last 5 min</span>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".08em", color: C.faint, marginTop: 10 }}>
          {tr?.source === "google_analytics" ? "Google Analytics" : "First-party (GA API fallback)"}
        </div>
      </div>

      {/* THIS WEEK — real totals (no fabricated deltas) */}
      <div style={{ ...sectionTitle, marginTop: 22, marginBottom: 4 }}>SNAPSHOT</div>
      <p style={{ margin: "0 2px 12px", fontSize: 12, color: C.faint, lineHeight: 1.4 }}>Live totals across the platform right now.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          [m.newUsersToday, "NEW USERS TODAY", C.limeSoft],
          [m.userSubmittedEvents, "USER EVENT SUBMISSIONS", C.cyan],
          [m.attendances, "RSVPS GOING", C.magenta],
        ].map(([value, label, color], i) => (
          <div key={i} style={{ border: `1px solid ${C.border}`, borderRadius: 16, background: C.card, padding: "15px 16px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 44, lineHeight: 0.85, color: color as string, fontVariantNumeric: "tabular-nums", flex: "none", width: 92 }}>
              {value}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".1em", color: C.muted2 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* THE COMMUNITY */}
      <div style={sectionTitle}>THE COMMUNITY</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {community.map(([value, label]) => (
          <Tile key={label} value={value} label={label} />
        ))}
      </div>

      {/* BOARD ACTIVITY */}
      <div style={sectionTitle}>BOARD ACTIVITY</div>
      <HBars rows={board} />

      {/* CLAIMED VS UNCLAIMED */}
      <div style={sectionTitle}>CLAIMED VS UNCLAIMED</div>
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 16, background: C.card, padding: 16, display: "flex", alignItems: "center", gap: 18 }}>
        <div
          style={{
            position: "relative",
            width: 96,
            height: 96,
            borderRadius: 999,
            flex: "none",
            background: `conic-gradient(${C.limeSoft} 0 ${claimedPct}%, ${C.magenta} ${claimedPct}% 100%)`,
          }}
        >
          <div style={{ position: "absolute", inset: 13, borderRadius: 999, background: C.card, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 26, lineHeight: 0.9, color: C.heading }}>{total}</span>
            <span style={{ fontFamily: MONO, fontSize: 7, letterSpacing: ".1em", color: C.meta }}>EVENTS</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
            <span style={{ width: 11, height: 11, borderRadius: 3, background: C.limeSoft, flex: "none" }} />
            <span style={{ fontSize: 13, color: C.body, flex: 1 }}>Claimed</span>
            <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 20, color: C.heading }}>{claimed}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ width: 11, height: 11, borderRadius: 3, background: C.magenta, flex: "none" }} />
            <span style={{ fontSize: 13, color: C.body, flex: 1 }}>Unclaimed</span>
            <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 20, color: C.heading }}>{unclaimed}</span>
          </div>
        </div>
      </div>
      <p style={{ margin: "12px 2px 4px", fontSize: 12, color: C.faint, lineHeight: 1.4 }}>
        {unclaimed} live listings still open for promoters to claim.
      </p>

      {/* TRAFFIC & AUDIENCE — first-party analytics (or GA if reporting is wired) */}
      {tr && (
        <>
          <div style={sectionTitle}>TRAFFIC &amp; AUDIENCE</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "0 2px 10px" }}>
            {[
              [`GA TRACKING ${tr.gaTrackingEnabled ? "ON" : "OFF"}`, tr.gaTrackingEnabled ? C.green : C.faint],
              [`GA REPORTING ${tr.gaReportingEnabled ? "ON" : "OFF"}`, tr.gaReportingEnabled ? C.green : C.faint],
              [`SOURCE: ${tr.source === "google_analytics" ? "GOOGLE ANALYTICS" : "FIRST-PARTY"}`, C.cyan],
            ].map(([label, color]) => (
              <span
                key={label as string}
                style={{
                  fontFamily: MONO,
                  fontSize: 8.5,
                  letterSpacing: ".08em",
                  fontWeight: 600,
                  color: color as string,
                  border: `1px solid ${color}55`,
                  background: `${color}14`,
                  padding: "4px 8px",
                  borderRadius: 6,
                }}
              >
                {label}
              </span>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {([
              ["PAGE VIEWS", String(tr.pageViews7d)],
              ["UNIQUE VISITORS", String(tr.uniqueVisitors7d)],
              ["SESSIONS", String(tr.sessions7d)],
              ["AVG. SESSION", fmtSession(tr.avgSessionSeconds7d)],
              ["BOUNCE RATE", `${tr.bounceRate7d}%`],
              ["PAGES / SESSION", tr.pagesPerSession7d.toFixed(1)],
            ] as Array<[string, string]>).map(([label, value]) => (
              <div key={label} style={{ border: `1px solid ${C.border}`, borderRadius: 14, background: C.card, padding: 14 }}>
                <span style={{ fontFamily: MONO, fontSize: 8.5, letterSpacing: ".09em", color: C.meta }}>{label}</span>
                <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 30, lineHeight: 0.9, color: C.heading, marginTop: 8, fontVariantNumeric: "tabular-nums" }}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* PAGE VIEWS 14 DAYS */}
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 16, background: C.card, padding: 15, marginTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".1em", color: C.meta }}>PAGE VIEWS · 14 DAYS</span>
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: MONO, fontSize: 8.5, letterSpacing: ".09em", color: C.green }}>
                <span style={{ width: 5, height: 5, borderRadius: 999, background: C.green }} />
                {fmtDelta(tr.pageViews7d, tr.pageViewsPrev7d)}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 62 }}>
              {(() => {
                const max = Math.max(...tr.pageViewsTrend14d, 1);
                return tr.pageViewsTrend14d.map((v, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: `${Math.round((v / max) * 100)}%`,
                      minHeight: 3,
                      borderRadius: "3px 3px 0 0",
                      background: `linear-gradient(180deg, ${C.cyan}, ${C.cyan}88)`,
                    }}
                  />
                ));
              })()}
            </div>
          </div>

          {tr.topPages.length > 0 && (
            <>
              <div style={sectionTitle}>TOP PAGES</div>
              <HBars rows={hbars(tr.topPages.map((p) => [p.path, p.views] as [string, number]), C.cyan)} />
            </>
          )}
          {tr.sources.length > 0 && (
            <>
              <div style={sectionTitle}>WHERE THEY COME FROM</div>
              <HBars rows={hbars(tr.sources.map((s) => [s.label, s.pct] as [string, number]), C.magenta, "%")} />
            </>
          )}
          {tr.devices.length > 0 && (
            <>
              <div style={sectionTitle}>DEVICES</div>
              <HBars rows={hbars(tr.devices.map((d) => [d.label, d.pct] as [string, number]), C.orange, "%")} />
            </>
          )}
          {tr.newReturning.length > 0 && (
            <>
              <div style={sectionTitle}>NEW VS RETURNING</div>
              <HBars rows={hbars(tr.newReturning.map((n) => [n.label, n.pct] as [string, number]), C.limeSoft, "%")} />
            </>
          )}
        </>
      )}

      {/* MEMBER GROWTH — same 12h buckets as AdminStatsView */}
      <div style={sectionTitle}>MEMBER GROWTH</div>
      <p style={{ margin: "0 2px 12px", fontSize: 12, color: C.faint, lineHeight: 1.4 }}>
        Signups and RSVPs in 12-hour buckets over the last 14 days. {signupTotal} signup{signupTotal === 1 ? "" : "s"},{" "}
        {rsvpTotal} RSVP{rsvpTotal === 1 ? "" : "s"} total.
      </p>
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 16, background: C.card, padding: 15, marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".1em", color: C.meta }}>SIGNUPS + RSVPS · 14 DAYS</span>
          <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: MONO, fontSize: 8.5, letterSpacing: ".09em", color: C.cyan }}>
            <span style={{ width: 5, height: 5, borderRadius: 999, background: C.cyan }} />
            12-HOUR BUCKETS
          </span>
        </div>
        <MemberGrowthChart buckets={memberGrowth} />
      </div>
    </>
  );
}
