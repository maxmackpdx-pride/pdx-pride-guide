import { Button } from "@/components/ds";
import { Link } from "wouter";
import { useInboxSheet } from "@/context/InboxSheetContext";

type ReviewItem = {
  kind: string;
  title: string;
  meta: string;
};

type Props = {
  pendingCount: number;
  ownerCount?: number;
  isPrimaryOwner?: boolean;
  stats?: Array<{ value: string | number; label: string }>;
  reviewQueue?: ReviewItem[];
  onOpenAdminPanel?: () => void;
};

const DEFAULT_STATS = [
  { value: "—", label: "Members" },
  { value: "—", label: "Live events" },
  { value: "—", label: "Pending review" },
  { value: "—", label: "Posts today" },
  { value: "—", label: "RSVPs today" },
  { value: "—", label: "Flags" },
];

const DEFAULT_QUEUE: ReviewItem[] = [
  { kind: "EVENT SUBMISSION", title: "Review pending submissions", meta: "Open the admin queue for live items" },
];

export default function HubAdminOverview({
  pendingCount,
  ownerCount = 0,
  isPrimaryOwner = false,
  stats = DEFAULT_STATS,
  reviewQueue = DEFAULT_QUEUE,
  onOpenAdminPanel,
}: Props) {
  const { openSheet } = useInboxSheet();
  const statsWithPending = stats.map((s) =>
    s.label === "Pending review" ? { ...s, value: pendingCount || s.value } : s,
  );

  return (
    <div className="reveal">
      <div className="kick" style={{ color: "var(--panel-cyan)" }}>
        Owner desk · Answering to nobody
      </div>
      <h1 className="h1">Admin</h1>

      <div
        className="statwrap"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 2,
          border: "1px solid var(--panel-border)",
          borderRadius: 12,
          overflow: "hidden",
          margin: "20px 0 22px",
        }}
      >
        {statsWithPending.map((st) => (
          <div key={st.label} style={{ padding: 18, background: "var(--panel-card)" }}>
            <div className="statnum" style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 30, color: "#fff", lineHeight: 0.85 }}>
              {st.value}
            </div>
            <div className="kick" style={{ letterSpacing: ".12em", marginTop: 8 }}>
              {st.label}
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: "4px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "16px 0 4px" }}>
          <span className="ld" />
          <span className="kick" style={{ letterSpacing: ".16em", color: "var(--panel-cyan)" }}>
            Review queue · {pendingCount} pending
          </span>
        </div>
        {reviewQueue.map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "15px 0", borderTop: "1px solid var(--panel-border)" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="kick" style={{ letterSpacing: ".14em" }}>
                {r.kind}
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, color: "#fff", textTransform: "uppercase", margin: "5px 0 3px" }}>
                {r.title}
              </div>
              <div className="kick" style={{ letterSpacing: ".05em" }}>
                {r.meta}
              </div>
            </div>
            <div style={{ display: "flex", gap: 9, flex: "none" }}>
              <button type="button" className="foll" style={{ borderColor: "var(--status-good)", background: "var(--status-good)" }}>
                Approve
              </button>
              <button type="button" className="foll on">
                Reject
              </button>
            </div>
          </div>
        ))}
        <div
          style={{
            padding: "16px 0 12px",
            borderTop: "1px solid var(--panel-border)",
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
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
    </div>
  );
}