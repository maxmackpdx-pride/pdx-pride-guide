import type { CSSProperties } from "react";
import { Lock } from "lucide-react";
import "./admin-panel.css";

export type OwnerDeskItem = {
  id: number;
  source: "desk" | "feedback";
  kind: string;
  kindLabel: string;
  title: string;
  summary: string;
  body: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  pageUrl: string | null;
  severity: string | null;
  meta: Record<string, unknown>;
  status: string;
  createdAt: string;
};

type Props = {
  items: OwnerDeskItem[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  onResolve: (id: number, source: "desk" | "feedback") => void;
  resolvePending?: boolean;
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function severityStyle(sev: string | null): CSSProperties | undefined {
  if (!sev) return undefined;
  const upper = sev.toUpperCase();
  if (upper === "HIGH" || upper === "BLOCKER") {
    return { color: "#ff6600", border: "1.5px solid #ff6600", borderRadius: 3, padding: "2px 7px", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" };
  }
  return { color: "var(--text-lo)", border: "1.5px solid var(--border-strong)", borderRadius: 3, padding: "2px 7px", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" };
}

export default function AdminOwnerDesk({
  items,
  loading,
  error,
  onRetry,
  onResolve,
  resolvePending,
}: Props) {
  const open = items.filter(i => i.status === "OPEN");

  return (
    <div className="admin-owner-desk">
      <div className="admin-owner-desk-banner">
        <span className="admin-owner-desk-banner__icon" aria-hidden>
          <Lock size={17} />
        </span>
        <p>
          <strong>Owner only.</strong> Keyholders (site admins) can&apos;t see or touch this lane.
          Contact form messages, bug reports, and sponsorship pitches land here, not the shared review queue.
        </p>
      </div>

      {loading && <p className="dash-mono" style={{ fontSize: 11, color: "var(--dash-muted)" }}>Loading owner desk…</p>}

      {error && (
        <div style={{ marginBottom: 16 }}>
          <p className="text-white/50 text-sm">Could not load owner desk.</p>
          {onRetry && (
            <button type="button" className="admin-shell__ghost-btn" onClick={onRetry}>
              Retry
            </button>
          )}
        </div>
      )}

      {!loading && !error && open.length === 0 && (
        <div className="admin-owner-desk__clear">
          <h3>Owner desk clear</h3>
          <p>No owner-level calls waiting. The team&apos;s got the rest.</p>
        </div>
      )}

      <div className="admin-owner-desk__list">
        {open.map(item => (
          <article key={`${item.source}-${item.id}`} className="admin-owner-desk__card">
            <div className="admin-owner-desk__card-top">
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span className="admin-owner-desk__kind">{item.kindLabel}</span>
                {item.severity && <span style={severityStyle(item.severity)}>{item.severity}</span>}
              </div>
              <span className="admin-owner-desk__at">{formatWhen(item.createdAt)}</span>
            </div>

            {item.contactName && (
              <div className="admin-owner-desk__from">
                {item.contactName}
                {item.contactEmail ? ` · ${item.contactEmail}` : ""}
                {item.contactPhone ? ` · ${item.contactPhone}` : ""}
              </div>
            )}

            <h3 className="admin-owner-desk__title">{item.title}</h3>
            {item.summary && <p className="admin-owner-desk__sub">{item.summary}</p>}
            {item.pageUrl && (
              <p className="admin-owner-desk__meta">
                Page: <span>{item.pageUrl}</span>
              </p>
            )}

            <pre className="admin-owner-desk__body">{item.body}</pre>

            {Array.isArray(item.meta?.attachmentUrls) && item.meta.attachmentUrls.length > 0 && (
              <p className="admin-owner-desk__meta">
                Attachments:{" "}
                {(item.meta.attachmentUrls as string[]).map((url, i) => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                    {i > 0 ? ", " : ""}file {i + 1}
                  </a>
                ))}
              </p>
            )}

            <div className="admin-owner-desk__actions">
              <button
                type="button"
                className="admin-owner-desk__resolve"
                disabled={resolvePending}
                onClick={() => onResolve(item.id, item.source)}
              >
                Mark resolved
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}