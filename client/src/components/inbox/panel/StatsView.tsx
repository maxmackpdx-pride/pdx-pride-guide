import { useQuery } from "@tanstack/react-query";
import { C, MONO, DISPLAY, sectionTitle, barTrack, hbars } from "./sheet";

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
};

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
    [m.missedConnections, "SPOTTED POSTS"],
    [m.userSubmittedEvents, "UNCLAIMED EVENTS"],
  ];

  const board = hbars(
    [
      ["Messages", m.messages],
      ["RSVPs", m.attendances],
      ["Gig posts", m.gigPosts],
      ["Gifting", m.giftingPosts],
      ["Spotted", m.missedConnections],
    ],
    C.purple,
  );

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
        <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: ".12em", color: C.meta }}>ACTIVE SESSIONS</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 8 }}>
          <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 56, lineHeight: 0.85, color: C.heading, fontVariantNumeric: "tabular-nums" }}>
            {m.activeSessions}
          </span>
          <span style={{ fontSize: 14, color: C.body, lineHeight: 1.3 }}>active sessions right now</span>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: ".08em", color: C.faint, marginTop: 10 }}>First-party (session store)</div>
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

      {/* GA-DERIVED SECTIONS — honest placeholder (no analytics source wired yet) */}
      <div style={sectionTitle}>TRAFFIC &amp; AUDIENCE</div>
      <div style={{ border: `1px dashed ${C.border3}`, borderRadius: 16, background: C.card, padding: "20px 16px", textAlign: "center" }}>
        <div style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: ".12em", color: C.meta, marginBottom: 8 }}>NOT CONNECTED</div>
        <p style={{ margin: 0, fontSize: 12.5, color: C.muted, lineHeight: 1.5, maxWidth: 300, marginInline: "auto" }}>
          Traffic, top pages, sources, devices, and member-growth charts populate once Google Analytics is connected.
        </p>
      </div>
    </>
  );
}
