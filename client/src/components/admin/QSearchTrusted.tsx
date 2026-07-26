import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, parseApiError } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export type TrustedHealth = "green" | "yellow" | "red" | "unknown";

export type TrustedVenueRow = {
  sourceId: string;
  venueName: string;
  calendarPageUrl: string;
  feedUrl: string;
  fetchMode: "badlands_api" | "sanctuary_ics" | "generic" | string;
  health: TrustedHealth;
  lastSyncAt: string | null;
  lastSyncOk: boolean | null;
  lastSyncError: string | null;
  lastEventCount: number;
  lastPublishedAt: string | null;
  lastPublishedTitle: string | null;
  lastPublishedEventId: number | null;
  consecutiveFails: number;
  pollHours: number;
  notes?: string | null;
};

type TrustedResponse = {
  venues: TrustedVenueRow[];
};

const HEALTH_LABEL: Record<TrustedHealth, string> = {
  green: "Healthy",
  yellow: "Stale",
  red: "Failing",
  unknown: "Never synced",
};

function asHealth(v: string | null | undefined): TrustedHealth {
  if (v === "green" || v === "yellow" || v === "red" || v === "unknown") return v;
  return "unknown";
}

function fmtAbsolute(iso: string | null | undefined): string {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

/** Relative age for last sync / publish timestamps. */
function fmtRelative(iso: string | null | undefined): string {
  if (!iso) return "Never";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return iso;
  const diff = Date.now() - t;
  if (diff < 0) return "just now";
  const sec = Math.floor(diff / 1000);
  if (sec < 45) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return fmtAbsolute(iso);
}

function isNotWiredError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  return /^404\b/.test(msg) || /not found|not wired|cannot post/i.test(msg);
}

export default function QSearchTrusted({
  onSynced,
  compact = false,
}: {
  onSynced?: () => void;
  /** Daily mode: name · health · sync · last sync only */
  compact?: boolean;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<TrustedResponse>({
    queryKey: ["/api/admin/qsearch/trusted"],
    queryFn: () => apiRequest("GET", "/api/admin/qsearch/trusted").then(r => r.json()),
    retry: false,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const venues = data?.venues ?? [];
  const notWired = isError && isNotWiredError(error);
  const busy = syncingId != null || syncingAll;

  async function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["/api/admin/qsearch/trusted"] });
    onSynced?.();
  }

  async function syncOne(sourceId: string, venueName: string) {
    if (
      !window.confirm(
        `Sync trusted venue “${venueName}” now?\n\nNew events go to the Review queue - you approve before anything goes live.`,
      )
    ) {
      return;
    }
    setSyncingId(sourceId);
    try {
      const res = await apiRequest("POST", `/api/admin/qsearch/trusted/sync/${encodeURIComponent(sourceId)}`, {});
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        queued?: number;
        message?: string;
        error?: string;
      };
      toast({
        title: `Synced ${venueName}`,
        description:
          body.message ||
          (body.queued != null
            ? `${body.queued} candidate${body.queued === 1 ? "" : "s"} in Review`
            : "Trusted sync finished - check Review"),
      });
      await invalidate();
      void queryClient.invalidateQueries({ queryKey: ["/api/admin/qsearch/queue"] });
      void queryClient.invalidateQueries({ queryKey: ["/api/admin/qsearch/dashboard"] });
      void refetch();
    } catch (err) {
      if (isNotWiredError(err)) {
        toast({
          title: "Trusted API not wired yet",
          description: "Server routes for trusted sync are not available on this deploy.",
          variant: "destructive",
        });
      } else {
        toast({
          title: `Sync failed · ${venueName}`,
          description: parseApiError(err, "Could not sync trusted venue"),
          variant: "destructive",
        });
      }
      void refetch();
    } finally {
      setSyncingId(null);
    }
  }

  async function syncAll() {
    if (
      !window.confirm(
        `Sync all trusted venues now?\n\nNew events go to the Review queue - you approve before anything goes live.`,
      )
    ) {
      return;
    }
    setSyncingAll(true);
    try {
      const res = await apiRequest("POST", "/api/admin/qsearch/trusted/sync", {});
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        queued?: number;
        message?: string;
        error?: string;
      };
      toast({
        title: "Synced all trusted",
        description:
          body.message ||
          (body.queued != null
            ? `${body.queued} candidates in Review`
            : `Finished ${venues.length} venue${venues.length === 1 ? "" : "s"} - check Review`),
      });
      await invalidate();
      void queryClient.invalidateQueries({ queryKey: ["/api/admin/qsearch/queue"] });
      void queryClient.invalidateQueries({ queryKey: ["/api/admin/qsearch/dashboard"] });
      void refetch();
    } catch (err) {
      if (isNotWiredError(err)) {
        toast({
          title: "Trusted API not wired yet",
          description: "Server routes for trusted sync are not available on this deploy.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sync all failed",
          description: parseApiError(err, "Could not sync trusted venues"),
          variant: "destructive",
        });
      }
      void refetch();
    } finally {
      setSyncingAll(false);
    }
  }

  if (isLoading) {
    return (
      <div className="qsearch__trusted" data-testid="qsearch-trusted">
        <div className="qsearch__panel">
          <p className="qsearch__empty">Loading trusted venues…</p>
        </div>
      </div>
    );
  }

  if (notWired) {
    return (
      <div className="qsearch__trusted" data-testid="qsearch-trusted">
        <div className="qsearch__panel qsearch__trusted-empty">
          <h2 className="qsearch__panel-title">Trusted venues</h2>
          <p className="qsearch__trusted-banner" role="status">
            Trusted API not wired yet
          </p>
          <p className="qsearch__empty" style={{ marginTop: "0.5rem" }}>
            Health board and trusted Sync → Review will show here once server routes are live.
            Other QSearch tabs keep working.
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="qsearch__trusted" data-testid="qsearch-trusted">
        <div className="qsearch__panel">
          <h2 className="qsearch__panel-title">Trusted venues</h2>
          <p className="qsearch__empty" role="alert">
            Could not load trusted health: {parseApiError(error, "Unknown error")}
          </p>
          <button
            type="button"
            className="qsearch__scan-btn is-ghost"
            onClick={() => void refetch()}
            data-testid="qsearch-trusted-retry"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`qsearch__trusted${compact ? " qsearch__trusted--compact" : ""}`}
      data-testid="qsearch-trusted"
    >
      <div className="qsearch__panel">
        <div className="qsearch__trusted-header">
          <div>
            <h2 className="qsearch__panel-title" style={{ marginBottom: "0.35rem" }}>
              Trusted venues
              <span className="qsearch__panel-count">{venues.length}</span>
            </h2>
            <p className="qsearch__trusted-lede">
              {compact ? (
                <>
                  Sync → Review. Expand a row for errors, last published, and feed links.
                </>
              ) : (
                <>
                  Core venues with known feeds. <strong>Sync</strong> → Review → approve or ✕
                  dismiss. Health = last successful pull.
                </>
              )}
            </p>
          </div>
          <div className="qsearch__trusted-actions">
            {!compact && (
              <button
                type="button"
                className="qsearch__scan-btn is-ghost"
                disabled={busy || venues.length === 0}
                onClick={() => void refetch()}
                data-testid="qsearch-trusted-refresh"
              >
                Refresh
              </button>
            )}
            <button
              type="button"
              className="qsearch__scan-btn"
              disabled={busy || venues.length === 0}
              onClick={() => void syncAll()}
              data-testid="qsearch-trusted-sync-all"
            >
              {syncingAll ? "Syncing…" : "Sync all"}
            </button>
          </div>
        </div>

        {venues.length === 0 ? (
          <p className="qsearch__empty">No trusted venues registered yet.</p>
        ) : compact ? (
          <ul className="qsearch__trusted-rows" role="list">
            {venues.map(v => {
              const health = asHealth(v.health);
              const syncing = syncingId === v.sourceId;
              const expanded = openId === v.sourceId;
              const errSnippet =
                v.lastSyncOk === false && v.lastSyncError
                  ? v.lastSyncError.length > 120
                    ? `${v.lastSyncError.slice(0, 117)}…`
                    : v.lastSyncError
                  : null;
              return (
                <li
                  key={v.sourceId}
                  className={`qsearch__trusted-row${expanded ? " is-open" : ""}${
                    health === "red" ? " is-bad" : ""
                  }`}
                  data-testid={`qsearch-trusted-row-${v.sourceId}`}
                >
                  <div className="qsearch__trusted-row-main">
                    <button
                      type="button"
                      className="qsearch__trusted-row-toggle"
                      aria-expanded={expanded}
                      onClick={() => setOpenId(expanded ? null : v.sourceId)}
                    >
                      <span className="qsearch__trusted-row-name">{v.venueName}</span>
                      <span
                        className={`qsearch__health qsearch__health--${health}`}
                        title={HEALTH_LABEL[health]}
                      >
                        <span className="qsearch__health-dot" aria-hidden />
                        {HEALTH_LABEL[health]}
                      </span>
                      <span className="qsearch__trusted-row-when" title={fmtAbsolute(v.lastSyncAt)}>
                        {fmtRelative(v.lastSyncAt)}
                        {typeof v.lastEventCount === "number" ? ` · ${v.lastEventCount} evt` : ""}
                      </span>
                    </button>
                    <button
                      type="button"
                      className="qsearch__scan-btn is-ghost qsearch__trusted-sync-one"
                      disabled={busy}
                      onClick={() => void syncOne(v.sourceId, v.venueName)}
                      data-testid={`qsearch-trusted-sync-${v.sourceId}`}
                    >
                      {syncing ? "…" : "Sync"}
                    </button>
                  </div>
                  {expanded && (
                    <div className="qsearch__trusted-row-detail">
                      {v.lastPublishedTitle ? (
                        <p>
                          Last published: <strong>{v.lastPublishedTitle}</strong>
                          {v.lastPublishedAt ? ` · ${fmtRelative(v.lastPublishedAt)}` : ""}
                        </p>
                      ) : (
                        <p className="qsearch__trusted-muted">No published events tracked yet.</p>
                      )}
                      {errSnippet && (
                        <p className="qsearch__trusted-err" title={v.lastSyncError || undefined}>
                          {errSnippet}
                        </p>
                      )}
                      <div className="qsearch__trusted-links">
                        {v.calendarPageUrl ? (
                          <a
                            href={v.calendarPageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="qsearch__trusted-link"
                          >
                            Calendar ↗
                          </a>
                        ) : null}
                        {v.feedUrl ? (
                          <a
                            href={v.feedUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="qsearch__trusted-link qsearch__trusted-link--muted"
                          >
                            Feed ↗
                          </a>
                        ) : null}
                        {v.consecutiveFails > 0 && (
                          <span className="qsearch__badge is-fail">fails ×{v.consecutiveFails}</span>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="qsearch__trusted-list" role="list">
            {venues.map(v => {
              const health = asHealth(v.health);
              const syncing = syncingId === v.sourceId;
              const errSnippet =
                v.lastSyncOk === false && v.lastSyncError
                  ? v.lastSyncError.length > 120
                    ? `${v.lastSyncError.slice(0, 117)}…`
                    : v.lastSyncError
                  : null;
              return (
                <article
                  key={v.sourceId}
                  className="qsearch__trusted-card"
                  role="listitem"
                  data-testid={`qsearch-trusted-row-${v.sourceId}`}
                >
                  <div className="qsearch__trusted-card-top">
                    <div className="qsearch__trusted-name-block">
                      <h3 className="qsearch__trusted-name">{v.venueName}</h3>
                      <span
                        className={`qsearch__health qsearch__health--${health}`}
                        title={`Health: ${HEALTH_LABEL[health]}`}
                      >
                        <span className="qsearch__health-dot" aria-hidden />
                        {HEALTH_LABEL[health]}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="qsearch__scan-btn is-ghost qsearch__trusted-sync-one"
                      disabled={busy}
                      onClick={() => void syncOne(v.sourceId, v.venueName)}
                      data-testid={`qsearch-trusted-sync-${v.sourceId}`}
                    >
                      {syncing ? "Syncing…" : "Sync now"}
                    </button>
                  </div>

                  <dl className="qsearch__trusted-meta">
                    <div>
                      <dt>Last sync</dt>
                      <dd title={fmtAbsolute(v.lastSyncAt)}>
                        {fmtRelative(v.lastSyncAt)}
                        {v.lastSyncOk === true && (
                          <span className="qsearch__trusted-ok"> · ok</span>
                        )}
                        {v.lastSyncOk === false && (
                          <span className="qsearch__trusted-fail"> · error</span>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>Events pulled</dt>
                      <dd>{v.lastEventCount ?? 0}</dd>
                    </div>
                    <div className="qsearch__trusted-meta--wide">
                      <dt>Last published</dt>
                      <dd title={fmtAbsolute(v.lastPublishedAt)}>
                        {v.lastPublishedTitle ? (
                          <>
                            <span className="qsearch__trusted-pub-title">
                              {v.lastPublishedTitle}
                            </span>
                            <span className="qsearch__trusted-pub-when">
                              {" "}
                              · {fmtRelative(v.lastPublishedAt)}
                            </span>
                          </>
                        ) : (
                          <span className="qsearch__trusted-muted">None yet</span>
                        )}
                      </dd>
                    </div>
                    {errSnippet && (
                      <div className="qsearch__trusted-meta--wide">
                        <dt>Last error</dt>
                        <dd className="qsearch__trusted-err" title={v.lastSyncError || undefined}>
                          {errSnippet}
                        </dd>
                      </div>
                    )}
                  </dl>

                  <div className="qsearch__trusted-links">
                    {v.calendarPageUrl ? (
                      <a
                        href={v.calendarPageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="qsearch__trusted-link"
                      >
                        Calendar page ↗
                      </a>
                    ) : null}
                    {v.feedUrl ? (
                      <a
                        href={v.feedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="qsearch__trusted-link qsearch__trusted-link--muted"
                        title={v.feedUrl}
                      >
                        Feed ↗
                      </a>
                    ) : null}
                    {v.consecutiveFails > 0 && (
                      <span className="qsearch__badge is-fail">
                        fails ×{v.consecutiveFails}
                      </span>
                    )}
                    {v.notes ? (
                      <span className="qsearch__trusted-notes" title={v.notes}>
                        {v.notes}
                      </span>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
