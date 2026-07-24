import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { AdRecord, AdStats } from "@/lib/adTypes";
import AdBuilder from "./AdBuilder";
import AdLiveTracker from "./AdLiveTracker";
import "./AdManager.css";

type Tab = "builder" | "live";

async function fetchJson<T>(url: string): Promise<T> {
  const r = await fetch(url, { credentials: "include" });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw new Error(data.error || `Request failed (${r.status})`);
  }
  return r.json();
}

export default function AdManager() {
  const [tab, setTab] = useState<Tab>("builder");
  const qc = useQueryClient();

  const adsQuery = useQuery({
    queryKey: ["/api/admin/ads"],
    queryFn: () => fetchJson<AdRecord[]>("/api/admin/ads"),
  });

  const statsQuery = useQuery({
    queryKey: ["/api/admin/ads/stats"],
    queryFn: () => fetchJson<AdStats>("/api/admin/ads/stats"),
  });

  const refresh = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ["/api/admin/ads"] });
    void qc.invalidateQueries({ queryKey: ["/api/admin/ads/stats"] });
  }, [qc]);

  const onStatus = async (id: number, status: AdRecord["status"]) => {
    await fetch(`/api/admin/ads/${id}/status`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    refresh();
  };

  const onDelete = async (id: number) => {
    await fetch(`/api/admin/ads/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    refresh();
  };

  const liveCount =
    statsQuery.data?.liveCount ??
    (adsQuery.data || []).filter((a) => a.status === "live").length;

  return (
    <div className="ad-mgr">
      <div className="ad-mgr__crumb">
        <div>
          Home · Admin · <span style={{ color: "#f4f1ea" }}>Ad Manager</span>
        </div>
        <div className="ad-mgr__owner-pill">Owner only</div>
      </div>

      <h1 className="ad-mgr__title">
        Ad <span>Manager</span>
      </h1>
      <p className="ad-mgr__lede">
        Build affiliate and house ads from your existing templates, set the glow and placement
        rules, then track everything that is live. Never visible to the public.
      </p>
      <hr className="ad-mgr__rule" />

      <div className="ad-mgr__tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "builder"}
          className={`ad-mgr__tab${tab === "builder" ? " is-active" : ""}`}
          onClick={() => setTab("builder")}
        >
          Ad Builder
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "live"}
          className={`ad-mgr__tab${tab === "live" ? " is-active" : ""}`}
          onClick={() => setTab("live")}
        >
          Live ads
          <span className="ad-mgr__tab-count">{liveCount}</span>
        </button>
      </div>

      {tab === "builder" ? (
        <AdBuilder
          onSaved={() => {
            refresh();
            setTab("live");
          }}
        />
      ) : (
        <AdLiveTracker
          stats={statsQuery.data || null}
          ads={adsQuery.data || []}
          loading={adsQuery.isLoading}
          onStatus={onStatus}
          onDelete={onDelete}
        />
      )}

      <div className="ad-mgr__seam">
        Pride is a protest · <span>zaylist.com/admin?tab=ads</span>
      </div>
    </div>
  );
}
