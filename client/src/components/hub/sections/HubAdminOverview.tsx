import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ds";
import { Link } from "wouter";
import { useInboxSheet } from "@/context/InboxSheetContext";

type Props = {
  pendingCount: number;
  ownerCount?: number;
  isPrimaryOwner?: boolean;
  onOpenAdminPanel?: () => void;
};

type Pulse = {
  generatedAt: string;
  adminBadge: number;
  ownerCount: number;
  guideUnread: number;
  liveEvents: number;
  newUsersToday: number;
  queue: {
    total: number;
    submissions: number;
    promoters: number;
    businessClaims: number;
    businessSubmissions: number;
    logoRequests: number;
    moderation: number;
    missedConnections: number;
    giftingReports: number;
    giftingFlagged: number;
    riverBrats: number;
    pendingGigs: number;
    guideUnread: number;
  };
};

/**
 * Hub admin launchpad. Real moderation lives in the floating inbox queue and /admin.
 * This view is read + jump only - no approve/deny here.
 */
export default function HubAdminOverview({
  pendingCount,
  ownerCount = 0,
  isPrimaryOwner = false,
  onOpenAdminPanel,
}: Props) {
  const { openSheet } = useInboxSheet();

  const { data: pulse } = useQuery<Pulse>({
    queryKey: ["/api/admin/pulse"],
    queryFn: () =>
      fetch("/api/admin/pulse", { credentials: "include" }).then((r) => {
        if (!r.ok) throw new Error("pulse failed");
        return r.json();
      }),
    refetchInterval: 60_000,
  });

  const { data: activity = [] } = useQuery<
    Array<{ id: number; action: string; targetLabel?: string | null; actorUsername?: string | null; createdAt: string }>
  >({
    queryKey: ["/api/admin/activity", 8],
    queryFn: () =>
      fetch("/api/admin/activity?limit=8", { credentials: "include" }).then((r) =>
        r.ok ? r.json() : [],
      ),
    refetchInterval: 90_000,
  });

  const q = pulse?.queue;
  const guideUnread = pulse?.guideUnread ?? 0;
  const desk = pulse?.ownerCount ?? ownerCount;
  const badge = pulse?.adminBadge ?? pendingCount;

  const bucketChips: Array<{ key: string; label: string; n: number }> = q
    ? [
        { key: "submissions", label: "Events", n: q.submissions },
        { key: "promoters", label: "Promoters", n: q.promoters },
        { key: "claims", label: "Venue claims", n: q.businessClaims },
        { key: "venues", label: "New venues", n: q.businessSubmissions },
        { key: "mod", label: "Moderation", n: q.moderation },
        { key: "mc", label: "Missed conn", n: q.missedConnections },
        { key: "gift", label: "Gifting", n: q.giftingReports + q.giftingFlagged },
        { key: "rb", label: "River Brats", n: q.riverBrats },
        { key: "gigs", label: "Gig Work", n: q.pendingGigs },
      ]
    : [];

  return (
    <div className="reveal">
      <div className="kick" style={{ color: "var(--panel-cyan)" }}>
        Control room · Floating inbox is the queue
      </div>
      <h1 className="h1">Admin</h1>
      <p style={{ margin: "12px 0 0", fontSize: 14, color: "var(--board-muted)", maxWidth: 520, lineHeight: 1.55 }}>
        Approve and reject in Messages → Admin · Queue. This screen only shows pulse and shortcuts.
      </p>

      <div
        className="statwrap"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: 2,
          border: "1px solid var(--panel-border)",
          borderRadius: 12,
          overflow: "hidden",
          margin: "20px 0 22px",
        }}
      >
        {[
          { n: badge, label: "Attention", color: "#fff" },
          { n: q?.total ?? pendingCount, label: "Queue", color: "#fff" },
          { n: guideUnread, label: "Guide inbox", color: "#fff" },
          ...(isPrimaryOwner ? [{ n: desk, label: "Owner desk", color: "#fff" }] : []),
          { n: pulse?.liveEvents ?? "-", label: "Live events", color: "#fff" },
          { n: pulse?.newUsersToday ?? "-", label: "New users today", color: "#fff" },
        ].map((s) => (
          <div key={s.label} style={{ padding: 16, background: "var(--panel-card)" }}>
            <div
              className="statnum"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 28,
                color: s.color,
                lineHeight: 0.85,
              }}
            >
              {s.n}
            </div>
            <div className="kick" style={{ letterSpacing: ".12em", marginTop: 8 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {bucketChips.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
          {bucketChips.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => openSheet({ view: "inbox", account: "admin" })}
              style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: 11,
                letterSpacing: "0.06em",
                fontWeight: 700,
                padding: "7px 12px",
                borderRadius: 999,
                border: `1px solid ${c.n > 0 ? "var(--panel-cyan)" : "var(--panel-border)"}`,
                background: c.n > 0 ? "rgba(0,255,255,0.08)" : "transparent",
                color: c.n > 0 ? "var(--panel-cyan)" : "var(--board-muted)",
                cursor: "pointer",
              }}
            >
              {c.label} · {c.n}
            </button>
          ))}
        </div>
      )}

      <div className="card" style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
          <span className="ld" />
          <span className="kick" style={{ letterSpacing: ".16em", color: "var(--panel-cyan)" }}>
            Floating inbox · {q?.total ?? pendingCount} in queue
            {guideUnread > 0 ? ` · ${guideUnread} guide replies` : ""}
          </span>
        </div>
        <p style={{ margin: "0 0 16px", fontSize: 14, color: "var(--board-muted)", lineHeight: 1.55 }}>
          Same path on phone and desktop: open Messages, switch to Admin, work Queue / Inbox / Sent.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <Button
            variant="neon"
            accent="pink"
            size="sm"
            onClick={() => openSheet({ view: "inbox", account: "admin" })}
          >
            Open admin queue{(q?.total ?? pendingCount) > 0 ? ` (${q?.total ?? pendingCount})` : ""}
          </Button>
          <Button
            variant="ghost"
            accent="cyan"
            size="sm"
            onClick={() => openSheet({ view: "inbox", account: "admin" })}
          >
            Guide messages{guideUnread > 0 ? ` (${guideUnread})` : ""}
          </Button>
          {isPrimaryOwner && (
            <Button
              variant="ghost"
              accent="purple"
              size="sm"
              onClick={() => openSheet({ view: "inbox", account: "owner" })}
            >
              Owner desk{desk > 0 ? ` (${desk})` : ""}
            </Button>
          )}
          <Button
            variant="ghost"
            accent="cyan"
            size="sm"
            onClick={() => openSheet({ view: "stats", account: "admin" })}
          >
            Stats
          </Button>
          <Link href="/admin?tab=events" onClick={onOpenAdminPanel}>
            <Button variant="ghost" accent="cyan" size="sm">
              Full admin tools →
            </Button>
          </Link>
        </div>
      </div>

      <div className="card" style={{ padding: "18px 20px", marginTop: 16 }}>
        <div className="kick" style={{ letterSpacing: ".16em", marginBottom: 12 }}>
          Recent admin activity
        </div>
        {activity.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: "var(--board-muted)" }}>No recent actions logged yet.</p>
        ) : (
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {activity.map((a) => (
              <li
                key={a.id}
                style={{
                  padding: "10px 0",
                  borderTop: "1px solid var(--panel-border)",
                  fontSize: 13,
                  color: "var(--board-text)",
                }}
              >
                <span style={{ color: "var(--panel-cyan)", fontFamily: "var(--font-mono, monospace)", fontSize: 11 }}>
                  {a.action}
                </span>
                {a.targetLabel ? ` · ${a.targetLabel}` : ""}
                <div style={{ fontSize: 11, color: "var(--board-muted)", marginTop: 3 }}>
                  {a.actorUsername ? `@${a.actorUsername}` : "admin"}
                  {a.createdAt ? ` · ${new Date(a.createdAt).toLocaleString()}` : ""}
                </div>
              </li>
            ))}
          </ul>
        )}
        <div style={{ marginTop: 12 }}>
          <Button
            variant="ghost"
            accent="cyan"
            size="sm"
            onClick={() => openSheet({ view: "inbox", account: "admin" })}
          >
            Open queue for follow-up
          </Button>
        </div>
      </div>

      <div className="card" style={{ padding: "18px 20px", marginTop: 16 }}>
        <div className="kick" style={{ letterSpacing: ".16em", marginBottom: 12 }}>
          Manage sections
        </div>
        <p style={{ margin: "0 0 14px", fontSize: 14, color: "var(--board-muted)", lineHeight: 1.55 }}>
          Catalog tools stay under Admin · More / full admin. Approvals stay in the floating inbox.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Link href="/admin?tab=events">
            <Button variant="ghost" accent="cyan" size="sm">All events</Button>
          </Link>
          <Link href="/admin?tab=promoters">
            <Button variant="ghost" accent="cyan" size="sm">Promoters</Button>
          </Link>
          <Link href="/admin?tab=venue-claims">
            <Button variant="ghost" accent="cyan" size="sm">Venue claims</Button>
          </Link>
          <Link href="/admin?tab=gigs">
            <Button variant="ghost" accent="cyan" size="sm">Gig Work</Button>
          </Link>
          <Link href="/admin?tab=team">
            <Button variant="ghost" accent="cyan" size="sm">My team</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
