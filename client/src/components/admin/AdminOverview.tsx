import AdminMetricsPanel from "@/components/dashboard/AdminMetricsPanel";

export type AttentionItem = {
  key: string;
  title: string;
  subtitle: string;
  kindLabel: string;
  color: string;
};

export type KindPill = {
  key: string;
  label: string;
  count: number;
  color: string;
};

type PushStatus = {
  configured: boolean;
  totalActiveSubscriptions: number;
  myDeviceSubscriptions: number;
} | null | undefined;

type Props = {
  pendingCount: number;
  attentionItems: AttentionItem[];
  kindPills: KindPill[];
  /** When true, show metrics inline (legacy). Prefer Stats tab. */
  metricsEnabled?: boolean;
  showMetrics?: boolean;
  isSuperAdmin?: boolean;
  ownerCount?: number;
  onOpenInbox: (filterHint?: string) => void;
  onOpenOwner?: () => void;
  onReviewItem: (key: string) => void;
  onMetricClick: (tab: string, metricKey: string) => void;
  pushStatus?: PushStatus;
  onRefreshPush?: () => void;
  onSendTestPush?: () => void;
  testPushPending?: boolean;
};

export default function AdminOverview({
  pendingCount,
  attentionItems,
  kindPills,
  metricsEnabled = false,
  showMetrics = false,
  isSuperAdmin = false,
  ownerCount = 0,
  onOpenInbox,
  onOpenOwner,
  onReviewItem,
  onMetricClick,
  pushStatus,
  onRefreshPush,
  onSendTestPush,
  testPushPending,
}: Props) {
  const showOwner = isSuperAdmin && ownerCount > 0 && onOpenOwner;

  return (
    <div className="admin-overview">
      {/* Owner-only banner (design: Hub.dc.html) */}
      {showOwner && (
        <section className="admin-owner-banner" aria-label="Owner only">
          <div className="admin-owner-banner__copy">
            <span className="admin-owner-banner__kicker">Owner only</span>
            <p className="admin-owner-banner__body">
              <strong>{ownerCount}</strong> item{ownerCount === 1 ? "" : "s"} only you can action.
            </p>
          </div>
          <button type="button" className="admin-owner-banner__cta" onClick={onOpenOwner}>
            Owner desk →
          </button>
        </section>
      )}

      {/* Needs attention */}
      <section className="admin-attn-section">
        <div className="admin-shell__section-head">
          <span className="admin-shell__section-label">Needs attention</span>
          {pendingCount > 0 && (
            <span className="admin-shell__nav-alert" style={{ fontSize: 12, borderRadius: 99, padding: "3px 10px" }}>
              {pendingCount} in the queue
            </span>
          )}
          <span style={{ flex: 1 }} />
          {pendingCount > 0 && (
            <button type="button" className="admin-shell__ghost-btn" onClick={() => onOpenInbox()}>
              Open queue →
            </button>
          )}
        </div>

        {kindPills.length > 0 && (
          <div className="admin-kind-pills">
            {kindPills.map(pill => (
              <button
                key={pill.key}
                type="button"
                className="admin-kind-pill"
                style={{ color: pill.color, borderColor: pill.color }}
                onClick={() => onOpenInbox(pill.key)}
              >
                {pill.count} {pill.label}
              </button>
            ))}
          </div>
        )}

        {pendingCount === 0 ? (
          <div className="admin-shell__queue-clear">
            <h3>✦ Queue clear ✦</h3>
            <p>Nothing needs you right now. Go drink some water.</p>
          </div>
        ) : (
          <div className="admin-attn-list">
            {attentionItems.map(item => (
              <article key={item.key} className="admin-attn-card" style={{ borderLeftColor: item.color }}>
                <div className="admin-attn-card__top">
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <span className="admin-attn-card__kind" style={{ color: item.color, borderColor: item.color }}>
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
                    style={{ borderColor: item.color, color: item.color }}
                    onClick={() => onReviewItem(item.key)}
                  >
                    Review
                  </button>
                </div>
              </article>
            ))}
            {pendingCount > attentionItems.length && (
              <button type="button" className="admin-shell__ghost-btn" onClick={() => onOpenInbox()}>
                View all {pendingCount} in queue →
              </button>
            )}
          </div>
        )}
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
            <span className="admin-shell__section-label">Push notifications</span>
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
        </section>
      )}
    </div>
  );
}
