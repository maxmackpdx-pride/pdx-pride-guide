import "./staff-reading.css";
import { ArrowRight } from "lucide-react";
import { CheckCircle } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminMetricsPanel from "@/components/dashboard/AdminMetricsPanel";
import { apiRequest, parseApiError } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export type AttentionItem = {
  key: string;
  title: string;
  subtitle: string;
  kindLabel: string;
  color: string;
};

type PushStatus = {
  configured: boolean;
  totalActiveSubscriptions: number;
  myDeviceSubscriptions: number;
} | null | undefined;

export type QueueBreakdown = {
  submissions?: number;
  moderation?: number;
  promoters?: number;
  businessClaims?: number;
  businessSubmissions?: number;
  giftingReports?: number;
  giftingFlagged?: number;
  missedConnections?: number;
  riverBrats?: number;
  pendingGigs?: number;
  guideUnread?: number;
} | null | undefined;

/** Human labels + colors for each queue bucket (matches QueueView groups). */
const QUEUE_BUCKETS: Array<{ key: keyof NonNullable<QueueBreakdown>; label: string; color: string; bucket: string }> = [
  { key: "submissions", bucket: "events", label: "Events / claims", color: "#19E3FF" },
  { key: "promoters", bucket: "promoters", label: "Promoters", color: "#B06BFF" },
  { key: "businessClaims", bucket: "venue_claims", label: "Venue claims", color: "#FF8C00" },
  { key: "businessSubmissions", bucket: "new_venues", label: "New venues", color: "#FF8C00" },
  { key: "moderation", bucket: "moderation", label: "Moderation", color: "#FF1FA0" },
  { key: "missedConnections", bucket: "spotted", label: "Missed conn.", color: "#FF1FA0" },
  { key: "giftingReports", bucket: "gifting", label: "GIFTZ reports", color: "#D4FF00" },
  { key: "giftingFlagged", bucket: "gifting", label: "GIFTZ flagged", color: "#D4FF00" },
  { key: "riverBrats", bucket: "river_brats", label: "River Brats", color: "#FF8C00" },
  { key: "pendingGigs", bucket: "gigs", label: "GIGZ", color: "#B06BFF" },
];

type LiveHealth = {
  ok?: boolean;
  ts?: string;
  pushConfigured?: boolean;
  gitSha?: string;
  railwayEnvironment?: string;
  deploymentId?: string;
};

type Props = {
  pendingCount?: number;
  queueUnavailable: boolean;
  onRetryQueue: () => void;
  attentionItems: AttentionItem[];
  /** When true, show metrics inline (legacy). Prefer Stats tab. */
  metricsEnabled?: boolean;
  showMetrics?: boolean;
  isPrimaryOwner?: boolean;
  ownerCount?: number;
  onOpenInbox: (filterHint?: string) => void;
  onOpenOwner?: () => void;
  onReviewItem: (key: string) => void;
  onMetricClick: (tab: string, metricKey: string) => void;
  pushStatus?: PushStatus;
  onRefreshPush?: () => void;
  onSendTestPush?: () => void;
  testPushPending?: boolean;
  /** Per-category counts behind the queue badge, so a "1" is never a mystery. */
  breakdown?: QueueBreakdown;
};

function shortSha(sha?: string): string {
  if (!sha) return "";
  const clean = sha.trim();
  return clean.length > 7 ? clean.slice(0, 7) : clean;
}

const DEFAULT_BROADCAST_TITLE = "";
const DEFAULT_BROADCAST_BODY = "";

/** Owner-only: compose + send one push announcement to every subscribed device. */
function BroadcastPanel({ reach }: { reach: number }) {
  const { toast } = useToast();
  const [title, setTitle] = useState(DEFAULT_BROADCAST_TITLE);
  const [body, setBody] = useState(DEFAULT_BROADCAST_BODY);
  const [url, setUrl] = useState("/events");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!title.trim()) {
      toast({ title: "Add a title", description: "The notification needs a title.", variant: "destructive" });
      return;
    }
    const ok = window.confirm(
      `Send this push to EVERYONE?\n\n“${title.trim()}”\n${body.trim()}\n\nThis goes to all ${reach} subscribed device${reach === 1 ? "" : "s"} (minus anyone who muted announcements). This cannot be unsent.`,
    );
    if (!ok) return;
    setSending(true);
    try {
      const res = await apiRequest("POST", "/api/admin/push/broadcast", {
        title: title.trim(),
        body: body.trim(),
        url: url.trim() || "/events",
      });
      const data = await res.json();
      toast({
        title: "Broadcast sent",
        description: `Delivered to ${data.sent} device${data.sent === 1 ? "" : "s"} across ${data.usersTargeted} member${data.usersTargeted === 1 ? "" : "s"}${data.usersOptedOut ? ` · ${data.usersOptedOut} muted` : ""}${data.failed ? ` · ${data.failed} failed` : ""}.`,
      });
    } catch (err) {
      toast({ title: "Broadcast failed", description: parseApiError(err, "Could not send broadcast."), variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const titleLeft = 80 - title.length;
  const bodyLeft = 180 - body.length;

  return (
    <section className="admin-push-panel admin-broadcast">
      <div className="admin-shell__section-head">
        <h3 className="admin-shell__section-label">Broadcast to everyone</h3>
        <span className="admin-broadcast__owner">Owner only</span>
      </div>
      <p className="admin-push-panel__meta" style={{ marginBottom: 12 }}>
        Sends one push to all {reach} subscribed device{reach === 1 ? "" : "s"} (people who muted announcements are skipped).
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 520 }}>
        <label style={{ display: "block" }}>
          <span className="admin-broadcast__label">
            Title · {titleLeft} left
          </span>
          <input
            type="text"
            value={title}
            maxLength={80}
            onChange={(e) => setTitle(e.target.value)}
            className="admin-broadcast__field"
          />
        </label>
        <label style={{ display: "block" }}>
          <span className="admin-broadcast__label">
            Message · {bodyLeft} left
          </span>
          <textarea
            value={body}
            maxLength={180}
            rows={3}
            onChange={(e) => setBody(e.target.value)}
            className="admin-broadcast__field"
          />
        </label>
        <label style={{ display: "block" }}>
          <span className="admin-broadcast__label">
            Opens (path, e.g. /events)
          </span>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="/events"
            className="admin-broadcast__field"
          />
        </label>
        <button
          type="button"
          onClick={() => void send()}
          disabled={sending || reach === 0 || !title.trim() || !body.trim()}
          className="admin-broadcast__send"
        >
          {sending ? "Sending…" : `Send to ${reach} device${reach === 1 ? "" : "s"}`}
        </button>
      </div>
    </section>
  );
}

export default function AdminOverview({
  pendingCount,
  attentionItems,
  queueUnavailable,
  onRetryQueue,
  metricsEnabled = false,
  showMetrics = false,
  isPrimaryOwner = false,
  ownerCount = 0,
  onOpenInbox,
  onOpenOwner,
  onReviewItem,
  onMetricClick,
  pushStatus,
  onRefreshPush,
  onSendTestPush,
  testPushPending,
  breakdown,
}: Props) {
  const showOwner = isPrimaryOwner && ownerCount > 0 && onOpenOwner;
  const bucketRows = breakdown
    ? QUEUE_BUCKETS.map((b) => ({ ...b, count: Number(breakdown[b.key] || 0) })).filter((b) => b.count > 0)
    : [];
  const guideUnread = Number(breakdown?.guideUnread || 0);

  const { data: liveHealth, isError: healthError, isFetching: healthFetching } = useQuery<LiveHealth>({
    queryKey: ["/api/health", "admin-overview"],
    queryFn: async () => {
      const r = await fetch("/api/health", { credentials: "include" });
      if (!r.ok) throw new Error(`health ${r.status}`);
      return r.json();
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const healthOk = !healthError && liveHealth?.ok === true;
  const sha = shortSha(liveHealth?.gitSha);
  const envLabel = liveHealth?.railwayEnvironment || "";

  return (
    <div className="admin-overview staff-reading">
      {/* Owner-only banner (design: Hub.dc.html) */}
      {showOwner && (
        <section className="admin-owner-banner" aria-label="Owner only">
          <div className="admin-owner-banner__copy">
            <span className="admin-owner-banner__kicker">Owner only</span>
            <p className="admin-owner-banner__body">
              <strong>{ownerCount}</strong> item{ownerCount === 1 ? "" : "s"} waiting for you.
            </p>
          </div>
          <button type="button" className="admin-owner-banner__cta" onClick={onOpenOwner}>
            Owner desk <ArrowRight size={14} aria-hidden="true" />
          </button>
        </section>
      )}

      {/* Needs attention */}
      <section className="admin-attn-section">
        <div className="admin-shell__section-head">
          <h2 className="admin-shell__section-label">Needs attention</h2>
          {pendingCount != null && pendingCount > 0 && (
            <span className="admin-shell__nav-alert" style={{ fontSize: 12, borderRadius: 99, padding: "3px 10px" }}>
              {pendingCount} in the queue
            </span>
          )}
          <span style={{ flex: 1 }} />
          {pendingCount != null && pendingCount > 0 && (
            <button type="button" className="admin-shell__ghost-btn" onClick={() => onOpenInbox()}>
              Open queue <ArrowRight size={14} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* What exactly is in the queue — every non-zero bucket, so a phantom
            "1" is always traceable to a category (and which group to scroll to). */}
        {(bucketRows.length > 0 || guideUnread > 0) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "4px 0 12px" }}>
            {bucketRows.map((b) => (
              <button
                key={b.key}
                type="button"
                onClick={() => onOpenInbox(b.bucket)}
                title={`Open the ${b.label} queue`}
                className="admin-kind-pill"
              >
                {b.label}
                <span style={{ fontFamily: "var(--font-display, sans-serif)", fontWeight: 900 }}>{b.count}</span>
              </button>
            ))}
            {guideUnread > 0 && (
              <button
                type="button"
                onClick={() => onOpenInbox("guide")}
                title="Open the guide inbox"
                className="admin-kind-pill"
              >
                Guide inbox
                <span style={{ fontFamily: "var(--font-display, sans-serif)", fontWeight: 900 }}>{guideUnread}</span>
              </button>
            )}
          </div>
        )}

        {pendingCount == null ? (
          <div className="admin-shell__queue-clear" role="status">
            <p>{queueUnavailable ? "The review queue could not be loaded." : "Loading the review queue…"}</p>
            {queueUnavailable && <button type="button" className="admin-shell__ghost-btn" onClick={onRetryQueue}>Retry</button>}
          </div>
        ) : pendingCount === 0 ? (
          <div className="admin-shell__queue-clear">
            <h3><CheckCircle size={16} aria-hidden="true" /> Queue clear</h3>
            <p>No items are waiting for review.</p>
          </div>
        ) : (
          <div className="admin-attn-list">
            {attentionItems.map(item => (
              <article key={item.key} className="admin-attn-card">
                <div className="admin-attn-card__top">
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <span className="admin-attn-card__kind">
                      {item.kindLabel}
                    </span>
                    <h3 className="admin-attn-card__title">{item.title}</h3>
                    <p className="admin-attn-card__sub">{item.subtitle}</p>
                  </div>
                </div>
                <div className="admin-attn-card__actions">
                  <button
                    type="button"
                    className="admin-shell__ghost-btn"
                    aria-label={"Review " + item.title}
                    onClick={() => onReviewItem(item.key)}
                  >
                    Review
                  </button>
                </div>
              </article>
            ))}
            {pendingCount != null && pendingCount > attentionItems.length && (
              <button type="button" className="admin-shell__ghost-btn" onClick={() => onOpenInbox()}>
                View all {pendingCount} in queue <ArrowRight size={14} aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </section>

      {/* Owner-facing live health / deploy chip */}
      <section className="admin-health-chip" aria-label="Live deploy health" data-testid="admin-health-chip">
        <span
          className={`admin-health-chip__dot${healthOk ? " is-ok" : healthFetching ? "" : " is-bad"}`}
          aria-hidden="true"
        />
        <span className="admin-health-chip__label">
          {healthFetching && !liveHealth
            ? "Checking live health…"
            : healthOk
              ? "Live /api/health ok"
              : "Live /api/health down"}
        </span>
        {sha ? (
          <span className="admin-health-chip__meta" title={liveHealth?.gitSha}>
            {sha}
          </span>
        ) : null}
        {envLabel ? <span className="admin-health-chip__meta">{envLabel}</span> : null}
        {liveHealth?.ts ? (
          <span className="admin-health-chip__meta" title={liveHealth.ts}>
            probed {new Date(liveHealth.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        ) : null}
      </section>

      {/* Optional inline metrics (legacy); prefer Stats tab */}
      {(showMetrics || metricsEnabled) && (
        <AdminMetricsPanel
          enabled
          onMetricClick={onMetricClick}
        />
      )}

      {/* Push status (kept; useful ops panel) */}
      {pushStatus != null && (
        <section className="admin-push-panel">
          <div className="admin-shell__section-head">
            <h2 className="admin-shell__section-label">Push notifications</h2>
            {onRefreshPush && (
              <button type="button" className="admin-shell__ghost-btn" onClick={onRefreshPush}>
                Refresh
              </button>
            )}
          </div>
          <p className="admin-push-panel__meta">
            {pushStatus.configured
              ? `${pushStatus.totalActiveSubscriptions} device subscription${pushStatus.totalActiveSubscriptions === 1 ? "" : "s"} site-wide · ${pushStatus.myDeviceSubscriptions} on this account`
              : "Push is not configured for this environment."}
          </p>
          {onSendTestPush && (
            <button
              type="button"
              className="admin-shell__ghost-btn"
              disabled={!pushStatus.configured || !pushStatus.myDeviceSubscriptions || testPushPending}
              onClick={onSendTestPush}
            >
              {testPushPending ? "Sending…" : "Send test push"}
            </button>
          )}
          {isPrimaryOwner && pushStatus.configured && (
            <BroadcastPanel reach={pushStatus.totalActiveSubscriptions} />
          )}
        </section>
      )}
    </div>
  );
}
