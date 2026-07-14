import { Button } from "@/components/ds";
import { Link } from "wouter";
import { useInboxSheet } from "@/context/InboxSheetContext";

type Props = {
  pendingCount: number;
  ownerCount?: number;
  isPrimaryOwner?: boolean;
  onOpenAdminPanel?: () => void;
};

/**
 * Hub admin launchpad. Real moderation lives in the inbox queue and /admin.
 * This view is intentionally not a second review UI with fake Approve/Reject.
 */
export default function HubAdminOverview({
  pendingCount,
  ownerCount = 0,
  isPrimaryOwner = false,
  onOpenAdminPanel,
}: Props) {
  const { openSheet } = useInboxSheet();

  return (
    <div className="reveal">
      <div className="kick" style={{ color: "var(--panel-cyan)" }}>
        Owner desk · Answering to nobody
      </div>
      <h1 className="h1">Admin</h1>
      <p style={{ margin: "12px 0 0", fontSize: 14, color: "var(--board-muted)", maxWidth: 520, lineHeight: 1.55 }}>
        Jump into the real tools. Approve and reject happen in the queue and full admin panel, not on this screen.
      </p>

      <div
        className="statwrap"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 2,
          border: "1px solid var(--panel-border)",
          borderRadius: 12,
          overflow: "hidden",
          margin: "20px 0 22px",
        }}
      >
        <div style={{ padding: 18, background: "var(--panel-card)" }}>
          <div
            className="statnum"
            style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 30, color: "#fff", lineHeight: 0.85 }}
          >
            {pendingCount}
          </div>
          <div className="kick" style={{ letterSpacing: ".12em", marginTop: 8 }}>
            Pending review
          </div>
        </div>
        {isPrimaryOwner && (
          <div style={{ padding: 18, background: "var(--panel-card)" }}>
            <div
              className="statnum"
              style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 30, color: "#fff", lineHeight: 0.85 }}
            >
              {ownerCount}
            </div>
            <div className="kick" style={{ letterSpacing: ".12em", marginTop: 8 }}>
              Owner desk
            </div>
          </div>
        )}
      </div>

      <div className="card" style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
          <span className="ld" />
          <span className="kick" style={{ letterSpacing: ".16em", color: "var(--panel-cyan)" }}>
            Review queue · {pendingCount} pending
          </span>
        </div>
        <p style={{ margin: "0 0 16px", fontSize: 14, color: "var(--board-muted)", lineHeight: 1.55 }}>
          {pendingCount > 0
            ? "You have items waiting. Open the admin queue to approve or reject live submissions, claims, and tips."
            : "Nothing in the pending count right now. You can still open the full queue or admin panel."}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <Button
            variant="neon"
            accent="pink"
            size="sm"
            onClick={() => openSheet({ view: "inbox", account: "admin" })}
          >
            Open admin queue{pendingCount > 0 ? ` (${pendingCount})` : ""}
          </Button>
          {isPrimaryOwner && (
            <Button
              variant="ghost"
              accent="purple"
              size="sm"
              onClick={() => openSheet({ view: "inbox", account: "owner" })}
            >
              Owner desk{ownerCount > 0 ? ` (${ownerCount})` : ""}
            </Button>
          )}
          <Link href="/admin?tab=overview" onClick={onOpenAdminPanel}>
            <Button variant="ghost" accent="cyan" size="sm">
              Full admin panel →
            </Button>
          </Link>
        </div>
      </div>

      <div className="card" style={{ padding: "18px 20px", marginTop: 16 }}>
        <div className="kick" style={{ letterSpacing: ".16em", marginBottom: 12 }}>
          Manage sections
        </div>
        <p style={{ margin: "0 0 14px", fontSize: 14, color: "var(--board-muted)", lineHeight: 1.55 }}>
          Left-rail Admin children (All Events, Promoters, Claims, etc.) open the real <code style={{ color: "var(--panel-cyan)" }}>/admin</code> tabs. They do not use the mock tables that used to sit inside the hub.
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
            <Button variant="ghost" accent="cyan" size="sm">Pride Werk</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
