/* AdminScreen, the moderation dashboard: stat grid + review queue. */
const {
  StatCard: AdStatCard, StatPill: AdStatPill, Button: AdBtn, Badge: AdBadge,
} = window.PDXPrideGuideDesignSystem_b20420;

const STATS = [
  { value: 14, label: "Registered Users", color: "lime" },
  { value: 0, label: "New Users Today", color: "lime" },
  { value: 33, label: "Active Sessions", color: "cyan" },
  { value: 47, label: "Live Events", color: "orange" },
  { value: 5, label: "Community-Submitted", color: "cyan" },
  { value: 3, label: "Member Check-ins", color: "lime" },
  { value: 21, label: "Active Messages", color: "cyan" },
  { value: 2, label: "Pending Review", color: "pink" },
  { value: 1, label: "Live Gig Posts", color: "orange" },
  { value: 1, label: "Active Gifting", color: "cyan" },
  { value: 1, label: "Missed Connections", color: "pink" },
  { value: 1, label: "Open Feedback", color: "purple" },
];
const TABS = ["All Types", "Submissions", "Promoters", "Talent", "Moderation", "Gifting", "Reports", "Feedback"];

function AdminScreen() {
  const [tab, setTab] = React.useState("All Types");
  return (
    <div className="pg-container pg-section--tight">
      <div className="pg-admin__head">
        <div className="pg-admin__title">
          <span style={{ color: "var(--neon-yellow)", fontSize: 22 }} aria-hidden="true">◈</span>
          <div>
            <h1>Admin Dashboard</h1>
            <div className="pg-admin__sub">Signed in as Tucker_PDMAX · Stats as of Jul 2, 2026, 5:33 PM</div>
          </div>
        </div>
        <div className="pg-admin__actions">
          <AdStatPill count={3} color="pink" glow>Action Items</AdStatPill>
          <AdBtn variant="ghost" size="sm">Refresh All</AdBtn>
          <AdBtn variant="ghost" size="sm">Log Out</AdBtn>
        </div>
      </div>

      <div className="pg-statgrid">
        {STATS.map((s) => (
          <AdStatCard key={s.label} value={s.value} label={s.label} color={s.color} href="#" />
        ))}
      </div>

      <div className="pg-tabs">
        {TABS.map((t) => (
          <button key={t} className={`pg-tab ${tab === t ? "is-active" : ""}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      <div style={{ color: "var(--text-lo)", fontSize: "var(--body-sm)", marginBottom: "var(--space-5)" }}>
        3 pending across submissions, promoters, talent, moderation, gifting, and feedback.
      </div>

      <div className="pg-queue-item" style={{ "--_c": "var(--neon-violet)", marginBottom: "var(--space-4)" }}>
        <div className="pg-queue-item__badges">
          <AdBadge color="purple" variant="outline">Feedback</AdBadge>
          <AdBadge color="yellow" variant="outline">Medium</AdBadge>
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, textTransform: "uppercase", color: "var(--text-hi)", fontSize: "1.05rem" }}>Mobile</div>
        <p style={{ color: "var(--text-mid)", fontSize: "var(--body-sm)", margin: "6px 0 12px" }}>
          The header is big and always there on mobile. Android Galaxy S26 Ultra. Have a screenshot I can share.
        </p>
        <AdBtn variant="neon" accent="yellow" size="sm">Mark Resolved</AdBtn>
      </div>

      <div className="pg-queue-item" style={{ "--_c": "var(--neon-cyan)" }}>
        <div className="pg-queue-item__badges">
          <AdBadge color="cyan" variant="outline">Submission</AdBadge>
          <AdBadge day="SAT" />
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, textTransform: "uppercase", color: "var(--text-hi)", fontSize: "1.05rem" }}>Stank Yes Coach, PDX PRIDE</div>
        <p style={{ color: "var(--text-mid)", fontSize: "var(--body-sm)", margin: "6px 0 12px" }}>
          @Sanctuary · Sanctuary Club · info@pdxsanctuary.com. New community submission awaiting review.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <AdBtn variant="neon" accent="lime" size="sm">Approve</AdBtn>
          <AdBtn variant="ghost" size="sm">Dismiss</AdBtn>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PGAdminScreen: AdminScreen });
