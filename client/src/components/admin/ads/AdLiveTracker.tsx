import type { AdRecord, AdStats } from "@/lib/adTypes";

type Props = {
  stats: AdStats | null;
  ads: AdRecord[];
  loading?: boolean;
  onStatus: (id: number, status: AdRecord["status"]) => void;
  onDelete: (id: number) => void;
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

function daysLeft(endDate: string | null): string {
  if (!endDate) return "open";
  const end = Date.parse(endDate.slice(0, 10) + "T23:59:59");
  if (!Number.isFinite(end)) return endDate;
  const diff = Math.ceil((end - Date.now()) / 86400000);
  if (diff < 0) return "expired";
  if (diff === 0) return "ends today";
  return `${diff}d left`;
}

function countdownClass(endDate: string | null): string {
  if (!endDate) return "";
  const end = Date.parse(endDate.slice(0, 10) + "T23:59:59");
  if (!Number.isFinite(end)) return "";
  const diff = Math.ceil((end - Date.now()) / 86400000);
  if (diff < 0) return "color:#ff1f1f";
  if (diff <= 2) return "color:#ff8c00";
  return "";
}

function badgeClass(source: AdRecord["source"]) {
  if (source === "manual") return "ad-mgr__badge ad-mgr__badge--manual";
  if (source === "template") return "ad-mgr__badge";
  return "ad-mgr__badge ad-mgr__badge--custom";
}

export default function AdLiveTracker({ stats, ads, loading, onStatus, onDelete }: Props) {
  const liveCount = stats?.liveCount ?? ads.filter((a) => a.status === "live").length;
  const impressions = stats?.impressions ?? ads.reduce((s, a) => s + a.impressions, 0);
  const clicks = stats?.clicks ?? ads.reduce((s, a) => s + a.clicks, 0);
  const avgCtr =
    stats?.avgCtr ??
    (impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0);

  return (
    <div>
      <div className="ad-mgr__band">
        <div className="ad-mgr__stat">
          <div className="ad-mgr__stat-value">{fmt(liveCount)}</div>
          <div className="ad-mgr__stat-label">Live ads</div>
        </div>
        <div className="ad-mgr__stat">
          <div className="ad-mgr__stat-value">{fmt(impressions)}</div>
          <div className="ad-mgr__stat-label">Impressions</div>
        </div>
        <div className="ad-mgr__stat">
          <div className="ad-mgr__stat-value">{fmt(clicks)}</div>
          <div className="ad-mgr__stat-label">Clicks</div>
        </div>
        <div className="ad-mgr__stat">
          <div className="ad-mgr__stat-value">{avgCtr.toFixed(2)}%</div>
          <div className="ad-mgr__stat-label">Avg CTR</div>
        </div>
      </div>

      <div className="ad-mgr__table-wrap">
        <table className="ad-mgr__table">
          <thead>
            <tr>
              <th>Ad</th>
              <th>Status</th>
              <th>Format</th>
              <th>Flight</th>
              <th>Impr.</th>
              <th>Clicks</th>
              <th>CTR</th>
              <th>Contact / billing</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} style={{ color: "#8a8a96" }}>
                  Loading ads…
                </td>
              </tr>
            )}
            {!loading && ads.length === 0 && (
              <tr>
                <td colSpan={8} style={{ color: "#8a8a96" }}>
                  No ads yet. Build one in Ad Builder and save.
                </td>
              </tr>
            )}
            {ads.map((ad) => {
              const ctr =
                ad.impressions > 0
                  ? Math.round((ad.clicks / ad.impressions) * 10000) / 100
                  : 0;
              return (
                <tr key={ad.id}>
                  <td>
                    <div className="ad-mgr__ad-cell">
                      <span
                        className="ad-mgr__swatch-sm"
                        style={{
                          background: ad.primaryColor,
                          boxShadow: `0 0 12px ${ad.primaryColor}88`,
                        }}
                      />
                      <div>
                        <div className="ad-mgr__ad-name">{ad.business || "Untitled"}</div>
                        <div className="ad-mgr__ad-title">{ad.title}</div>
                        <span className={badgeClass(ad.source)}>
                          {ad.source === "manual"
                            ? "MANUAL"
                            : ad.source === "template"
                              ? "TEMPLATE"
                              : "CUSTOM"}
                        </span>
                        <div className="ad-mgr__row-actions">
                          {ad.status !== "live" && (
                            <button
                              type="button"
                              className="ad-mgr__mini-btn"
                              onClick={() => onStatus(ad.id, "live")}
                            >
                              Go live
                            </button>
                          )}
                          {ad.status === "live" && (
                            <button
                              type="button"
                              className="ad-mgr__mini-btn"
                              onClick={() => onStatus(ad.id, "paused")}
                            >
                              Pause
                            </button>
                          )}
                          {ad.status === "paused" && (
                            <button
                              type="button"
                              className="ad-mgr__mini-btn"
                              onClick={() => onStatus(ad.id, "live")}
                            >
                              Resume
                            </button>
                          )}
                          {ad.source !== "manual" && (
                            <button
                              type="button"
                              className="ad-mgr__mini-btn"
                              onClick={() => {
                                if (window.confirm(`Delete ${ad.business || ad.title}?`)) {
                                  onDelete(ad.id);
                                }
                              }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`ad-mgr__status-pill ad-mgr__status-pill--${ad.status}`}>
                      {ad.status}
                    </span>
                  </td>
                  <td style={{ textTransform: "uppercase", fontSize: "0.78rem", color: "#8a8a96" }}>
                    {ad.format}
                    {ad.source === "manual" ? " · house" : ""}
                  </td>
                  <td>
                    <div style={{ fontVariantNumeric: "tabular-nums" }}>
                      {(ad.startDate || "n/a").slice(0, 10)}
                      {" → "}
                      {(ad.endDate || "n/a").slice(0, 10)}
                    </div>
                    <div style={{ fontSize: "0.8rem", ...(countdownClass(ad.endDate) ? { color: "#ff8c00" } : {}) }}>
                      <span style={countdownClass(ad.endDate) ? { color: daysLeft(ad.endDate) === "expired" ? "#ff1f1f" : "#ff8c00" } : undefined}>
                        {daysLeft(ad.endDate)}
                      </span>
                    </div>
                  </td>
                  <td style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(ad.impressions)}</td>
                  <td style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(ad.clicks)}</td>
                  <td className="ad-mgr__ctr">{ctr.toFixed(2)}%</td>
                  <td>
                    <div style={{ fontSize: "0.82rem" }}>{ad.contact || "n/a"}</div>
                    <div style={{ fontSize: "0.78rem", color: "#8a8a96" }}>{ad.billing || ""}</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
