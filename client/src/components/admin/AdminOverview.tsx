import { RefreshCw } from "lucide-react";
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
  metricsEnabled: boolean;
  onOpenInbox: (filterHint?: string) => void;
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
  metricsEnabled,
  onOpenInbox,
  onReviewItem,
  onMetricClick,
  pushStatus,
  onRefreshPush,
  onSendTestPush,
  testPushPending,
}: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Needs attention */}
      <section>
        <div className="admin-shell__section-head">
          <span className="admin-shell__section-label">Needs attention</span>
          {pendingCount > 0 && (
            <span
              className="admin-shell__nav-alert"
              style={{ fontSize: 12, borderRadius: 99, padding: "3px 10px" }}
            >
              {pendingCount} in the queue
            </span>
          )}
          <span style={{ flex: 1 }} />
          {pendingCount > 0 && (
            <button type="button" className="admin-shell__ghost-btn" onClick={() => onOpenInbox()}>
              Open inbox
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
                style={{ color: pill.color }}
                onClick={() => onOpenInbox(pill.key)}
              >
                {pill.count} {pill.label}
              </button>
            ))}
          </div>
        )}

        {pendingCount === 0 ? (
          <div className="admin-shell__queue-clear">
            <h3>✦ Inbox clear ✦</h3>
            <p>Nothing needs you right now. Go drink some water.</p>
          </div>
        ) : (
          <div className="admin-attn-list">
            {attentionItems.map(item => (
              <article key={item.key} className="admin-attn-card">
                <div className="admin-attn-card__top">
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h3 className="admin-attn-card__title">{item.title}</h3>
                    <p className="admin-attn-card__sub">{item.subtitle}</p>
                  </div>
                  <span className="admin-attn-card__kind" style={{ color: item.color }}>
                    {item.kindLabel}
                  </span>
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
              <button
                type="button"
                className="admin-shell__ghost-btn"
                onClick={() => onOpenInbox()}
              >
                View all {pendingCount} in inbox →
              </button>
            )}
          </div>
        )}
      </section>

      {/* Site pulse */}
      <section>
        <div className="admin-shell__section-head">
          <span className="admin-shell__section-label" style={{ fontSize: 18 }}>
            Site pulse
          </span>
        </div>
        <AdminMetricsPanel
          enabled={metricsEnabled}
          onMetricClick={(tab, metricKey) => onMetricClick(tab, metricKey)}
        />
      </section>

      {/* Push */}
      {pushStatus && (
        <section className="admin-shell__panel">
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div>
              <div
                className="display"
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  color: "#fff",
                  marginBottom: 4,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Push notifications
              </div>
              <p style={{ margin: 0, fontSize: "0.74rem", color: "#8c8980", lineHeight: 1.45 }}>
                Server: {pushStatus.configured ? "VAPID configured" : "keys missing on Railway"}
                {" · "}
                {pushStatus.totalActiveSubscriptions} active device
                {pushStatus.totalActiveSubscriptions === 1 ? "" : "s"} site-wide
                {" · "}
                {pushStatus.myDeviceSubscriptions} on this account
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {onRefreshPush && (
                <button type="button" className="admin-shell__ghost-btn" onClick={onRefreshPush}>
                  <RefreshCw size={11} style={{ marginRight: 6, verticalAlign: -1 }} />
                  Refresh
                </button>
              )}
              {onSendTestPush && (
                <button
                  type="button"
                  className="admin-shell__ghost-btn"
                  style={
                    pushStatus.configured && pushStatus.myDeviceSubscriptions > 0
                      ? { borderColor: "var(--lime, #c8fa3c)", color: "var(--lime, #c8fa3c)" }
                      : undefined
                  }
                  disabled={
                    !pushStatus.configured
                    || pushStatus.myDeviceSubscriptions === 0
                    || testPushPending
                  }
                  onClick={onSendTestPush}
                >
                  {testPushPending ? "Sending…" : "Send test push"}
                </button>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

