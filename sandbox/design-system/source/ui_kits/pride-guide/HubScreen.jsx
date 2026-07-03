/* HubScreen, the signed-in dashboard: collage hero, profile, stat pills, and
   inbox / weather / pride-week / connections panels. */
const {
  HeroBanner: HbHero, Button: HbBtn, StatPill: HbStatPill, Countdown: HbCountdown,
  StickerBadge: HbSticker,
} = window.PDXPrideGuideDesignSystem_b20420;

const WX = [
  { d: "Mon", t: "72°" }, { d: "Tue", t: "73°" }, { d: "Wed", t: "74°" },
  { d: "Thu", t: "74°" }, { d: "Fri", t: "76°" }, { d: "Sat", t: "79°", hot: true }, { d: "Sun", t: "71°" },
];

function Panel({ title, titleColor, accent, rainbow, action, children }) {
  const cls = ["pg-panel", rainbow ? "pg-panel--rainbow" : accent ? "pg-panel--accent" : ""].filter(Boolean).join(" ");
  return (
    <div className={cls} style={{ "--_c": accent }}>
      <div className="pg-panel__head">
        <span className="pg-panel__title" style={{ "--_c": titleColor }}>{title}</span>
        {action}
      </div>
      {children}
    </div>
  );
}

function HubScreen({ onNav }) {
  return (
    <div className="pg-hub">
      <HbHero image="../../assets/banners/banner-stickers.png" minHeight={420} align="bottom-left" flush scrim="bottom-left">
        <span className="pdx-marker pdx-marker--cyan">Your Hub</span>
        <h1 className="pdx-display" style={{ fontSize: "var(--display-1)", margin: "10px 0 0" }}>
          Your <span style={{ color: "var(--neon-cyan)" }}>Hub</span>
        </h1>
        <p style={{ maxWidth: "44ch", marginTop: 12, color: "var(--text-mid)" }}>
          Community-run and free. Manage your submissions and claims, board posts, and inbox threads in one place.
        </p>
      </HbHero>

      <div className="pg-container">
        {/* profile row */}
        <div className="pg-hub__profile">
          <div className="pg-hub__id">
            <span className="pg-hub__avatar pg-avatar--fallback">
              <span style={{ width: "100%", height: "100%", borderRadius: "999px", border: "2px solid var(--ink-1000)", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--ink-800)", color: "#fff", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 26 }}>TC</span>
            </span>
            <div>
              <div className="pg-hub__name">Tucker_PDMAX</div>
              <div className="pg-hub__handle">@hello_tuckercasey · hello.tuckercasey@gmail.com</div>
            </div>
          </div>
          <div className="pg-hub__actions">
            <HbBtn accent="lime">Edit Profile</HbBtn>
            <HbBtn variant="ghost">Sign Out</HbBtn>
          </div>
        </div>

        {/* stat pills */}
        <div className="pg-hub__stats">
          <HbStatPill count={1} color="cyan">Events</HbStatPill>
          <HbStatPill count={1} color="orange">Gigs</HbStatPill>
          <HbStatPill count={1} color="cyan">Gifting</HbStatPill>
          <HbStatPill count={1} color="pink">Spotted</HbStatPill>
          <HbStatPill count={1} color="lime">Check-ins</HbStatPill>
        </div>

        {/* site admin banner */}
        <div className="pg-panel pg-panel--accent" style={{ "--_c": "var(--neon-magenta)", marginBottom: "var(--space-5)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <span className="pg-panel__title" style={{ "--_c": "var(--neon-magenta)", display: "block", marginBottom: 4 }}>Site Admin</span>
            <span className="pg-panel__body"><b style={{ color: "var(--neon-magenta)" }}>3</b> items waiting in the review queue.</span>
          </div>
          <HbBtn accent="cyan" arrow onClick={() => onNav("admin")}>Open Admin</HbBtn>
        </div>

        {/* grid: inbox + right column */}
        <div className="pg-hub__grid" style={{ marginBottom: "var(--space-8)" }}>
          <Panel title="Inbox" titleColor="var(--neon-cyan)" accent="var(--border-default)"
            action={<HbBtn accent="cyan" size="sm" arrow>Open Inbox</HbBtn>}>
            <p className="pg-panel__body">No threads yet. Replies from Spotted, Pride Werk, event hosts, and check-ins show up here.</p>
            <div className="pg-quickrow">
              <HbBtn variant="ghost" size="sm">Spotted</HbBtn>
              <HbBtn variant="ghost" size="sm">Pride Werk</HbBtn>
              <HbBtn variant="ghost" size="sm">Submit Event</HbBtn>
            </div>
          </Panel>

          <div style={{ display: "grid", gap: "var(--space-5)" }}>
            {/* weather */}
            <div className="pg-panel">
              <div className="pg-panel__head" style={{ marginBottom: 8 }}>
                <span className="pdx-kicker">Pride Week · Jul 13 to 19</span>
                <span style={{ width: 30, height: 30, borderRadius: "999px", background: "radial-gradient(circle, var(--neon-orange), #b34700)", boxShadow: "0 0 16px -2px var(--neon-orange)" }} />
              </div>
              <div style={{ display: "inline-block" }}><EvEstimate /></div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 4 }}>
                <span className="pg-weather__temp">79°</span>
                <span className="pg-weather__cond">Mostly Clear</span>
              </div>
              <div className="pg-weather__days">
                {WX.map((w) => (
                  <div className="pg-weather__day" key={w.d}>
                    <div className="d">{w.d}</div>
                    <div className="t" style={w.hot ? { color: "var(--yellow)" } : null}>{w.t}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* pride week countdown, rainbow border */}
            <div className="pg-panel pg-panel--rainbow">
              <div className="pg-panel__head">
                <span className="pg-panel__title">Pride Week</span>
                <HbStatPill variant="solid" color="lime" glow dot>Live</HbStatPill>
              </div>
              <span className="pdx-kicker" style={{ display: "block", marginBottom: 12 }}>Jul 13 to 19 · Portland</span>
              <HbCountdown target="2026-07-16T19:00:00" size="sm" />
              <div style={{ marginTop: 14, color: "var(--text-mid)", fontSize: "var(--body-sm)", display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ width: 8, height: 8, borderRadius: "999px", background: "var(--neon-yellow)" }} />
                Next up: <b style={{ color: "var(--text-hi)" }}>Sad Girl Summer, Pride Edition</b>
              </div>
            </div>
          </div>
        </div>

        {/* account connections */}
        <div className="pg-panel" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: "var(--space-16)" }}>
          <div>
            <span className="pg-panel__title" style={{ display: "block", marginBottom: 4, fontSize: "1rem" }}>Account Connections</span>
            <span style={{ color: "var(--neon-yellow)", fontSize: "var(--body-sm)" }}>Google is linked to this profile.</span>
          </div>
          <HbBtn accent="lime" size="sm">Google Linked</HbBtn>
        </div>
      </div>
    </div>
  );
}

function EvEstimate() {
  return <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: ".72rem", letterSpacing: ".08em", textTransform: "uppercase", background: "var(--yellow)", color: "#000", padding: "3px 9px 2px", borderRadius: "2px" }}>Estimate</span>;
}

Object.assign(window, { PGHubScreen: HubScreen });
