import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, parseApiError } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import "./qsearch.css";

type SourceHealth = {
  sourceId: string;
  url: string;
  label: string;
  lastScanAt: string | null;
  lastOk: boolean | null;
  lastError: string | null;
  lastEventCount: number;
  consecutiveFails: number;
  isDirectory: boolean;
  isNew: boolean;
  tier: string;
  format: string;
  resolvedUrl: string | null;
  recipeUrl: string | null;
  winningParser: string | null;
  yieldStatus: string;
  zeroYieldStreak: number;
  instagramHandle: string | null;
  dragpdxOptIn: boolean;
};

type CoverageRow = {
  businessId: number;
  name: string;
  type: string | null;
  websiteField: string | null;
  resolvedUrl: string | null;
  resolution: "field" | "fallback" | "none";
  absorbedByCurated: boolean;
};

type Candidate = {
  id: string;
  draft: {
    title: string;
    description: string;
    venueName: string;
    address?: string | null;
    dateStart: string;
    dateEnd: string;
    dayOfWeek: string | null;
    ticketUrl: string | null;
    ageRequirement?: string | null;
    admission?: string | null;
    warnings: string[];
    confidence?: number | null;
    posterImageUrl?: string | null;
    parseSource?: string;
    sourceUrl?: string | null;
  };
  sourceId: string;
  sourceLabel: string;
  sourceUrl: string;
  selected?: boolean;
  recurring: string | null;
  recurringCount: number;
  condensed: boolean;
  conflicts: Array<{
    eventId: number;
    title: string;
    note: string;
    kind: string;
  }>;
  strongDuplicate: {
    eventId: number;
    title: string;
    score: number;
    catalogRecurring?: string | null;
    catalogRecurringStatus?: string;
    note?: string;
  } | null;
  duplicates?: Array<{
    eventId: number;
    title: string;
    catalogRecurringStatus?: string;
    note?: string;
  }>;
  recurringDupAction?: string | null;
  directoryBrands?: Array<{
    businessId: number;
    name: string;
    type: string;
    logoUrl: string | null;
    color: string;
    role: "venue" | "group" | "place";
  }>;
  status?: string;
};

type Dashboard = {
  sources: Array<{ id: string; label: string; url: string; tier: string; notes?: string; caution?: boolean }>;
  health: SourceHealth[];
  coverage?: CoverageRow[];
  pendingCandidates?: Candidate[];
  stats: {
    urlCount: number;
    curatedCount: number;
    directoryCount: number;
    directoryPlaces?: number;
    directoryWithWebsiteField?: number;
    directoryWithFallbackUrl?: number;
    directoryMissingUrl?: number;
    healthyCount: number;
    failingCount: number;
    neverScannedCount: number;
    newDirectoryCount: number;
    pendingReview?: number;
    lastScanAt: string | null;
  };
  failing: SourceHealth[];
  newFromDirectory: SourceHealth[];
  latestJob: { id: string; status: string } | null;
};

type ScanJobView = {
  id: string;
  status: string;
  total: number;
  completed: number;
  currentLabel: string | null;
  etaSeconds: number | null;
  progress: number;
  candidates: Candidate[];
  candidateCount: number;
  perSource: Array<{
    sourceId: string;
    label: string;
    ok: boolean;
    eventCount: number;
    error: string | null;
    resolvedUrl?: string | null;
    parsers?: string[];
  }>;
  kind?: string;
};

type Tab = "overview" | "venues" | "queue" | "assist";
type ConflictAction = "keep_both" | "deny" | "override";

function fmtEta(sec: number | null | undefined): string {
  if (sec == null || !Number.isFinite(sec)) return "—";
  if (sec < 60) return `~${sec}s`;
  return `~${Math.floor(sec / 60)}m ${sec % 60}s`;
}

function fmtWhen(iso: string | null): string {
  if (!iso) return "Never";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

/** Human-readable party window from Pacific wall-clock ISO strings. */
function formatPartyWhen(dateStart?: string | null, dateEnd?: string | null): string {
  if (!dateStart) return "";
  const parse = (s: string) => {
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (!m) return s.slice(0, 16);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const mon = months[Number(m[2]) - 1] || m[2];
    const day = Number(m[3]);
    let h = Number(m[4]);
    const min = m[5];
    const ap = h >= 12 ? "pm" : "am";
    h = h % 12 || 12;
    return { date: `${mon} ${day}`, time: `${h}:${min}${ap}` };
  };
  const a = parse(dateStart);
  if (typeof a === "string") return a;
  if (!dateEnd) return `${a.date} · ${a.time}`;
  const b = parse(dateEnd);
  if (typeof b === "string") return `${a.date} · ${a.time}`;
  if (a.date === b.date) return `${a.date} · ${a.time}–${b.time}`;
  return `${a.date} ${a.time} → ${b.date} ${b.time}`;
}

function yieldBadge(status: string) {
  const map: Record<string, string> = {
    works: "is-ok",
    zero_yield: "is-fail",
    discovery_needed: "is-fail",
    needs_recipe: "is-new",
    meta_only: "is-month",
    dead: "is-fail",
    unscanned: "",
  };
  return map[status] || "";
}

export default function QSearchDashboard({ onCommitted }: { onCommitted?: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<ScanJobView | null>(null);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [conflictAction, setConflictAction] = useState<Record<string, ConflictAction>>({});
  const [venueFilter, setVenueFilter] = useState("");
  const [resultFilter, setResultFilter] = useState("");
  const [tryVision, setTryVision] = useState(true);
  /** Default off: only upcoming/current listings in results */
  const [includePastEvents, setIncludePastEvents] = useState(false);
  const [recipeEdits, setRecipeEdits] = useState<Record<string, string>>({});

  // Assist forms
  const [visionUrl, setVisionUrl] = useState("");
  const [visionVenue, setVisionVenue] = useState("");
  const [igHandle, setIgHandle] = useState("");
  const [igCaption, setIgCaption] = useState("");
  const [igImage, setIgImage] = useState("");

  const { data: dash, isLoading, refetch } = useQuery<Dashboard>({
    queryKey: ["/api/admin/qsearch/dashboard"],
    queryFn: () => apiRequest("GET", "/api/admin/qsearch/dashboard").then(r => r.json()),
    refetchInterval: job && (job.status === "running" || job.status === "queued") ? false : 45_000,
  });

  const { data: queueData, refetch: refetchQueue } = useQuery<{ candidates: Candidate[] }>({
    queryKey: ["/api/admin/qsearch/queue"],
    queryFn: () => apiRequest("GET", "/api/admin/qsearch/queue?status=pending&limit=300").then(r => r.json()),
  });

  const pollJob = useCallback(async (id: string) => {
    const res = await apiRequest("GET", `/api/admin/qsearch/scan/${id}`);
    const data = (await res.json()) as ScanJobView;
    setJob(data);
    if (data.status === "done" || data.status === "cancelled" || data.status === "failed") {
      if (data.candidates?.length) {
        const init: Record<string, boolean> = {};
        const conf: Record<string, ConflictAction> = {};
        for (const c of data.candidates) {
          init[c.id] = c.selected !== false;
          conf[c.id] = "keep_both";
        }
        setSelected(init);
        setConflictAction(conf);
        setTab("queue");
      }
      void queryClient.invalidateQueries({ queryKey: ["/api/admin/qsearch/dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["/api/admin/qsearch/queue"] });
    }
    return data;
  }, [queryClient]);

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        const data = await pollJob(jobId);
        if (cancelled) return;
        if (data.status === "running" || data.status === "queued") timer = setTimeout(tick, 900);
      } catch {
        if (!cancelled) timer = setTimeout(tick, 2000);
      }
    };
    void tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [jobId, pollJob]);

  // Resume progress UI if a scan is already running (page refresh / stuck job recovery)
  useEffect(() => {
    const latest = dash?.latestJob;
    if (!latest?.id) return;
    if (latest.status !== "running" && latest.status !== "queued") return;
    if (jobId === latest.id) return;
    setJobId(latest.id);
    setJob(prev =>
      prev?.id === latest.id
        ? prev
        : ({
            id: latest.id,
            status: latest.status,
            total: 0,
            completed: 0,
            currentLabel: null,
            etaSeconds: null,
            progress: 0,
            candidates: [],
            candidateCount: 0,
            perSource: [],
          } as ScanJobView),
    );
  }, [dash?.latestJob, jobId]);

  // Seed selection from pending queue when opening queue tab
  useEffect(() => {
    const list = queueData?.candidates || dash?.pendingCandidates || [];
    if (!list.length) return;
    setSelected(prev => {
      if (Object.keys(prev).length) return prev;
      const init: Record<string, boolean> = {};
      for (const c of list) init[c.id] = c.selected !== false && !c.strongDuplicate;
      return init;
    });
  }, [queueData, dash?.pendingCandidates]);

  async function startScan(opts?: {
    onlyFailing?: boolean;
    onlyNew?: boolean;
    onlyDirectory?: boolean;
    kind?: string;
  }) {
    setBusy(true);
    try {
      const res = await apiRequest("POST", "/api/admin/qsearch/scan", {
        ...opts,
        tryVision,
        includePastEvents,
      });
      const data = await res.json();
      if (!res.ok) {
        // If server thinks a scan is running, attach to it so progress shows
        if (String(data.error || "").toLowerCase().includes("already running")) {
          const dashRes = await apiRequest("GET", "/api/admin/qsearch/dashboard");
          const dashJson = (await dashRes.json()) as Dashboard;
          const latest = dashJson.latestJob;
          if (latest?.id && (latest.status === "running" || latest.status === "queued")) {
            setJobId(latest.id);
            toast({
              title: "Scan already in progress",
              description: "Showing live progress — use Cancel if it's stuck.",
            });
            return;
          }
        }
        throw new Error(data.error || "Scan failed to start");
      }
      setJobId(data.jobId);
      setJob({
        id: data.jobId,
        status: data.status || "queued",
        total: data.total,
        completed: 0,
        currentLabel: null,
        etaSeconds: data.etaSeconds,
        progress: 0,
        candidates: [],
        candidateCount: 0,
        perSource: [],
      });
      setTab("overview");
      toast({ title: "Scan started", description: `Searching ${data.total} sources…` });
    } catch (err) {
      toast({
        title: "Could not start scan",
        description: parseApiError(err, "Scan failed"),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function cancelScan() {
    if (!jobId) return;
    try {
      await apiRequest("POST", `/api/admin/qsearch/scan/${jobId}/cancel`, {});
      toast({ title: "Cancelling scan…" });
    } catch (err) {
      toast({ title: "Cancel failed", description: parseApiError(err, "Could not cancel"), variant: "destructive" });
    }
  }

  async function saveRecipe(sourceId: string) {
    const recipeUrl = recipeEdits[sourceId]?.trim() || null;
    try {
      await apiRequest("POST", `/api/admin/qsearch/sources/${encodeURIComponent(sourceId)}/recipe`, {
        recipeUrl,
      });
      toast({ title: recipeUrl ? "Recipe saved" : "Recipe cleared" });
      void refetch();
    } catch (err) {
      toast({ title: "Recipe failed", description: parseApiError(err, "Could not save"), variant: "destructive" });
    }
  }

  async function runVision() {
    setBusy(true);
    try {
      const res = await apiRequest("POST", "/api/admin/qsearch/vision", {
        imageUrl: visionUrl.trim(),
        venueHint: visionVenue.trim() || null,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not read flyer");
      const n = data.candidates?.length || 0;
      toast({
        title: n ? "Flyer added to Review" : "No event found on flyer",
        description: n
          ? `${n} draft${n === 1 ? "" : "s"} — check Review, then approve as HIDDEN.`
          : data.error || "Try a clearer image URL or add a venue name.",
      });
      if (n) {
        void refetchQueue();
        setTab("queue");
      }
    } catch (err) {
      toast({
        title: "Could not read flyer",
        description: parseApiError(err, "Needs a public image URL and AI key (XAI_API_KEY or OPENAI_API_KEY)"),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function runIg(mode: "paste" | "graph") {
    setBusy(true);
    try {
      const res = await apiRequest("POST", "/api/admin/qsearch/instagram", {
        mode,
        handle: igHandle.trim() || null,
        caption: igCaption.trim() || null,
        imageUrl: igImage.trim() || null,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not build draft from Instagram");
      const n = data.candidates?.length || 0;
      toast({
        title: n ? "Instagram post added to Review" : "No event found",
        description: n
          ? `${n} draft${n === 1 ? "" : "s"} — check Review, then approve as HIDDEN.`
          : data.error || data.note || "Paste the caption text and/or a flyer image URL.",
      });
      if (n) {
        void refetchQueue();
        setTab("queue");
      }
    } catch (err) {
      toast({
        title: mode === "graph" ? "Instagram pull failed" : "Could not use paste",
        description: parseApiError(
          err,
          mode === "graph"
            ? "Needs Meta Business API tokens, or just paste the caption below instead."
            : "Paste caption text and/or an image URL from the post.",
        ),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  const queueCandidates: Candidate[] = useMemo(() => {
    if (job?.candidates?.length && (job.status === "done" || job.status === "cancelled")) {
      return job.candidates;
    }
    return queueData?.candidates || dash?.pendingCandidates || [];
  }, [job, queueData, dash?.pendingCandidates]);

  const filteredCandidates = useMemo(() => {
    const q = resultFilter.trim().toLowerCase();
    if (!q) return queueCandidates;
    return queueCandidates.filter(
      c =>
        c.draft.title.toLowerCase().includes(q) ||
        c.draft.venueName.toLowerCase().includes(q) ||
        (c.sourceLabel || "").toLowerCase().includes(q),
    );
  }, [queueCandidates, resultFilter]);

  const selectedCount = useMemo(() => Object.values(selected).filter(Boolean).length, [selected]);

  function selectAll(on: boolean) {
    const next: Record<string, boolean> = {};
    for (const c of queueCandidates) next[c.id] = on;
    setSelected(next);
  }

  async function approveSelected() {
    const items = queueCandidates
      .filter(c => selected[c.id])
      .map(c => {
        const action = conflictAction[c.id] || "keep_both";
        return {
          id: c.id,
          draft: c.draft,
          skip: false,
          conflictAction: action,
          conflictEventIds: action === "override" ? c.conflicts.map(x => x.eventId) : [],
        };
      });
    if (!items.length) {
      toast({ title: "Nothing selected", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const res = await apiRequest("POST", "/api/admin/qsearch/approve", {
        confirm: true,
        status: "HIDDEN",
        skipDuplicates: true,
        items,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Approve failed");
      toast({ title: "Staged as HIDDEN", description: data.impact });
      setSelected({});
      onCommitted?.();
      void refetch();
      void refetchQueue();
    } catch (err) {
      toast({
        title: "Approve failed",
        description: parseApiError(err, "Could not create events"),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  const scanning = job?.status === "running" || job?.status === "queued";
  const stats = dash?.stats;
  const healthById = useMemo(() => {
    const m = new Map<string, SourceHealth>();
    for (const h of dash?.health || []) m.set(h.sourceId, h);
    return m;
  }, [dash?.health]);

  const venues = useMemo(() => {
    const q = venueFilter.trim().toLowerCase();
    // Prefer health list (full scrape sources) merged with coverage
    const health = dash?.health || [];
    return health
      .filter(h => {
        if (!q) return true;
        return (
          h.label.toLowerCase().includes(q) ||
          h.url.toLowerCase().includes(q) ||
          (h.resolvedUrl || "").toLowerCase().includes(q) ||
          (h.recipeUrl || "").toLowerCase().includes(q) ||
          h.yieldStatus.includes(q)
        );
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [dash?.health, venueFilter]);

  const coverageMissing = useMemo(
    () => (dash?.coverage || []).filter(c => c.resolution === "none"),
    [dash?.coverage],
  );

  return (
    <div className="qsearch" data-testid="qsearch-dashboard">
      <header className="qsearch__hero">
        <p className="qsearch__kicker">Queer event intelligence</p>
        <h1 className="qsearch__title">QSearch</h1>
        <p className="qsearch__lede">
          <strong>Scan now</strong> pulls calendars into the Review queue. Use{" "}
          <strong>Add by hand</strong> only for a single flyer image or Instagram post that Scan
          missed. Everything stages as <strong>HIDDEN</strong> — never auto-LIVE.
        </p>

        <div className="qsearch__stats">
          <div className="qsearch__stat">
            <div className="qsearch__stat-val is-cyan">{stats?.urlCount ?? "—"}</div>
            <div className="qsearch__stat-label">Scan URLs</div>
          </div>
          <div className="qsearch__stat">
            <div className="qsearch__stat-val">{stats?.directoryPlaces ?? "—"}</div>
            <div className="qsearch__stat-label">Directory places</div>
          </div>
          <div className="qsearch__stat">
            <div className="qsearch__stat-val">{stats?.healthyCount ?? "—"}</div>
            <div className="qsearch__stat-label">Yield works</div>
          </div>
          <div className="qsearch__stat">
            <div className={`qsearch__stat-val ${(stats?.failingCount || 0) > 0 ? "is-warn" : ""}`}>
              {stats?.failingCount ?? "—"}
            </div>
            <div className="qsearch__stat-label">Trouble</div>
          </div>
          <div className="qsearch__stat">
            <div className={`qsearch__stat-val ${(stats?.pendingReview || 0) > 0 ? "is-warn" : "is-cyan"}`}>
              {stats?.pendingReview ?? queueCandidates.length}
            </div>
            <div className="qsearch__stat-label">Review queue</div>
          </div>
          <div className="qsearch__stat">
            <div className={`qsearch__stat-val ${(stats?.newDirectoryCount || 0) > 0 ? "is-warn" : ""}`}>
              {stats?.newDirectoryCount ?? "—"}
            </div>
            <div className="qsearch__stat-label">New auto-links</div>
          </div>
        </div>

        <div className="qsearch__scan-row">
          <button
            type="button"
            className="qsearch__scan-btn"
            disabled={busy || scanning || isLoading}
            onClick={() => startScan()}
            data-testid="qsearch-scan-now"
          >
            {scanning ? "Scanning…" : "Scan now"}
          </button>
          <button
            type="button"
            className="qsearch__scan-btn is-ghost"
            disabled={busy || scanning}
            onClick={() => startScan({ onlyFailing: true })}
          >
            Re-scan troubled
          </button>
          <button
            type="button"
            className="qsearch__scan-btn is-ghost"
            disabled={busy || scanning}
            onClick={() => startScan({ onlyNew: true })}
          >
            New links only
          </button>
          <button
            type="button"
            className="qsearch__scan-btn is-ghost"
            disabled={busy || scanning}
            onClick={async () => {
              setBusy(true);
              try {
                const res = await apiRequest("POST", "/api/admin/qsearch/scan/nightly-now", {});
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Failed");
                setJobId(data.jobId);
                toast({ title: "Nightly priority scan", description: `${data.total} sources` });
              } catch (err) {
                toast({
                  title: "Nightly scan failed",
                  description: parseApiError(err, "Could not start"),
                  variant: "destructive",
                });
              } finally {
                setBusy(false);
              }
            }}
          >
            Nightly priority
          </button>
          {scanning && (
            <button type="button" className="qsearch__scan-btn is-ghost" onClick={cancelScan}>
              Cancel
            </button>
          )}
          <label
            style={{ fontSize: 12, color: "var(--qs-muted)", display: "flex", gap: 6, alignItems: "center" }}
            title="If a calendar page has no structured events, try reading flyer images on that page (needs AI key)."
          >
            <input type="checkbox" checked={tryVision} onChange={e => setTryVision(e.target.checked)} />
            When a site is empty, try reading flyer images
          </label>
          <label
            style={{ fontSize: 12, color: "var(--qs-muted)", display: "flex", gap: 6, alignItems: "center" }}
            title="Off by default: only upcoming/current nights. Turn on to include past occurrences from feeds."
          >
            <input
              type="checkbox"
              checked={includePastEvents}
              onChange={e => setIncludePastEvents(e.target.checked)}
              data-testid="qsearch-include-past"
            />
            Include past events
          </label>
          <span style={{ color: "var(--qs-muted)", fontSize: 12 }}>
            Last scan: {fmtWhen(stats?.lastScanAt ?? null)}
          </span>
        </div>
      </header>

      {scanning && job && (
        <div className="qsearch__progress" data-testid="qsearch-progress">
          <p className="qsearch__progress-current">
            {job.currentLabel ? `Searching: ${job.currentLabel}` : "Working…"}
          </p>
          <div className="qsearch__progress-bar" aria-hidden>
            <div className="qsearch__progress-fill" style={{ width: `${job.progress || 0}%` }} />
          </div>
          <div className="qsearch__progress-meta">
            <span>
              {job.completed} / {job.total} · {job.progress || 0}%
            </span>
            <span>ETA {fmtEta(job.etaSeconds)}</span>
          </div>
        </div>
      )}

      <div className="qsearch__tabs" role="tablist">
        {(
          [
            ["overview", "Health"],
            ["venues", `Sources (${venues.length})`],
            ["queue", `Review (${queueCandidates.length})`],
            ["assist", "Add by hand"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            className={`qsearch__tab${tab === id ? " is-active" : ""}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div>
          {(dash?.failing?.length || 0) > 0 && (
            <div className="qsearch__panel">
              <h2 className="qsearch__panel-title">Venues having trouble</h2>
              <ul className="qsearch__fail-list">
                {dash!.failing.slice(0, 25).map(h => (
                  <li key={h.sourceId}>
                    <span className={`qsearch__badge ${yieldBadge(h.yieldStatus)}`}>{h.yieldStatus}</span>
                    <strong>{h.label}</strong> — {h.lastError || "No data"}
                    {h.zeroYieldStreak > 0 ? ` · zero×${h.zeroYieldStreak}` : ""}
                    <br />
                    <a href={h.resolvedUrl || h.url} target="_blank" rel="noreferrer">
                      {h.resolvedUrl || h.url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(dash?.newFromDirectory?.length || 0) > 0 && (
            <div className="qsearch__panel">
              <h2 className="qsearch__panel-title">New directory auto-links</h2>
              <ul className="qsearch__fail-list" style={{ color: "rgba(255,180,120,0.95)" }}>
                {dash!.newFromDirectory.map(h => (
                  <li key={h.sourceId}>
                    <span className="qsearch__badge is-new">New</span>
                    {h.label}{" "}
                    <a href={h.url} target="_blank" rel="noreferrer">
                      {h.url}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="qsearch__toolbar" style={{ marginTop: 8 }}>
                <button
                  type="button"
                  onClick={async () => {
                    await apiRequest("POST", "/api/admin/qsearch/sources/ack-new", {});
                    void refetch();
                  }}
                >
                  Mark new as seen
                </button>
              </div>
            </div>
          )}

          {coverageMissing.length > 0 && (
            <div className="qsearch__panel">
              <h2 className="qsearch__panel-title">Directory places with no URL ({coverageMissing.length})</h2>
              <p style={{ fontSize: 12, color: "var(--qs-muted)" }}>
                {coverageMissing.map(c => c.name).join(" · ")}
              </p>
            </div>
          )}

          {job?.status === "done" && (
            <div className="qsearch__panel">
              <h2 className="qsearch__panel-title">Last scan</h2>
              <p style={{ fontSize: 13, color: "var(--qs-muted)", margin: 0 }}>
                {job.perSource?.filter(p => p.ok && p.eventCount > 0).length || 0} sources with events ·{" "}
                {job.perSource?.filter(p => !p.ok || p.eventCount === 0).length || 0} empty/fail ·{" "}
                {job.candidateCount} candidates after condense
              </p>
              <div className="qsearch__toolbar" style={{ marginTop: 10 }}>
                <button type="button" className="is-primary" onClick={() => setTab("queue")}>
                  Open review queue
                </button>
              </div>
            </div>
          )}

          <div className="qsearch__panel">
            <h2 className="qsearch__panel-title">Nightly</h2>
            <p style={{ fontSize: 13, color: "var(--qs-muted)", margin: 0 }}>
              ~3:00am America/Los_Angeles when <code>QSEARCH_NIGHTLY</code> is on (default in production).
              See <code>docs/QSEARCH.md</code>. Priority: never-scanned → failing → Tier1/EB → rest.
              Candidates land here for human approve → HIDDEN.
            </p>
          </div>
        </div>
      )}

      {tab === "venues" && (
        <div>
          <div className="qsearch__toolbar">
            <input
              className="qsearch__filter"
              type="search"
              placeholder="Filter sources…"
              value={venueFilter}
              onChange={e => setVenueFilter(e.target.value)}
            />
            <button
              type="button"
              onClick={async () => {
                await apiRequest("POST", "/api/admin/qsearch/dragpdx-opt-in", { optIn: true });
                toast({ title: "dragpdx opt-in enabled" });
                void refetch();
              }}
            >
              Opt-in dragpdx
            </button>
          </div>
          <div className="qsearch__panel" style={{ overflowX: "auto" }}>
            <table className="qsearch__venue-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Yield</th>
                  <th>URL / recipe</th>
                  <th>Parser</th>
                </tr>
              </thead>
              <tbody>
                {venues.map(h => (
                  <tr key={h.sourceId}>
                    <td>
                      {h.label}
                      <div style={{ color: "var(--qs-muted)", fontSize: 11 }}>
                        {h.tier}
                        {h.isNew ? " · new" : ""}
                        {h.isDirectory ? " · directory" : ""}
                      </div>
                    </td>
                    <td>
                      <span className={`qsearch__badge ${yieldBadge(h.yieldStatus)}`}>{h.yieldStatus}</span>
                      {h.zeroYieldStreak > 0 && (
                        <span className="qsearch__badge is-fail">0×{h.zeroYieldStreak}</span>
                      )}
                      {h.lastEventCount > 0 && (
                        <div style={{ fontSize: 11, color: "var(--qs-muted)" }}>
                          last {h.lastEventCount} events
                        </div>
                      )}
                    </td>
                    <td style={{ minWidth: 220 }}>
                      <a href={h.resolvedUrl || h.url} target="_blank" rel="noreferrer">
                        {(h.resolvedUrl || h.url).slice(0, 64)}
                        {(h.resolvedUrl || h.url).length > 64 ? "…" : ""}
                      </a>
                      <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <input
                          className="qsearch__filter"
                          style={{ maxWidth: 260 }}
                          placeholder="Recipe URL override"
                          value={recipeEdits[h.sourceId] ?? h.recipeUrl ?? ""}
                          onChange={e =>
                            setRecipeEdits(prev => ({ ...prev, [h.sourceId]: e.target.value }))
                          }
                        />
                        <button type="button" onClick={() => saveRecipe(h.sourceId)}>
                          Save recipe
                        </button>
                        {h.recipeUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setRecipeEdits(prev => ({ ...prev, [h.sourceId]: "" }));
                              void apiRequest(
                                "POST",
                                `/api/admin/qsearch/sources/${encodeURIComponent(h.sourceId)}/recipe`,
                                { recipeUrl: null },
                              ).then(() => refetch());
                            }}
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </td>
                    <td>{h.winningParser || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "queue" && (
        <div>
          {!filteredCandidates.length && (
            <p className="qsearch__empty">
              Review queue empty. Run <strong>Scan now</strong>, or use <strong>Add by hand</strong> for
              one flyer / Instagram post.
            </p>
          )}
          {!!filteredCandidates.length && (
            <>
              <div className="qsearch__toolbar">
                <input
                  className="qsearch__filter"
                  type="search"
                  placeholder="Filter queue…"
                  value={resultFilter}
                  onChange={e => setResultFilter(e.target.value)}
                />
                <button type="button" onClick={() => selectAll(true)}>
                  Select all
                </button>
                <button type="button" onClick={() => selectAll(false)}>
                  Deselect all
                </button>
                <button
                  type="button"
                  className="is-primary"
                  disabled={busy || selectedCount === 0}
                  onClick={approveSelected}
                  data-testid="qsearch-approve"
                >
                  Approve {selectedCount} as HIDDEN
                </button>
              </div>
              {filteredCandidates.map(c => {
                const on = !!selected[c.id];
                const needsRecurringUpdate =
                  c.strongDuplicate?.catalogRecurringStatus ===
                    "catalog_one_off_needs_recurring_update" ||
                  c.duplicates?.some(
                    d => d.catalogRecurringStatus === "catalog_one_off_needs_recurring_update",
                  );
                const catalogAlreadyRecurring =
                  c.strongDuplicate?.catalogRecurringStatus === "catalog_already_recurring";
                const brands = c.directoryBrands || [];
                const groupBrand = brands.find(b => b.role === "group");
                const venueBrand =
                  brands.find(b => b.role === "venue") || brands.find(b => b.role === "place");
                const orderedBrands = [groupBrand, venueBrand].filter(Boolean) as NonNullable<
                  typeof brands
                >;
                const brandColors = orderedBrands.map(b => b.color).filter(Boolean);
                const cardBg =
                  brandColors.length >= 2
                    ? `linear-gradient(105deg, ${brandColors[0]}40 0%, ${brandColors[1]}40 50%, rgba(0,0,0,0.55) 100%)`
                    : brandColors.length === 1
                      ? `linear-gradient(135deg, ${brandColors[0]}35 0%, rgba(0,0,0,0.5) 65%)`
                      : undefined;
                return (
                  <label
                    key={c.id}
                    className={`qsearch__cand${on ? " is-selected" : " is-dim"}`}
                    style={{
                      background: cardBg,
                      borderColor: brandColors[0] || undefined,
                      boxShadow:
                        brandColors.length >= 2
                          ? `inset 3px 0 0 ${brandColors[0]}, inset 6px 0 0 ${brandColors[1]}`
                          : brandColors[0]
                            ? `inset 4px 0 0 ${brandColors[0]}`
                            : undefined,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={e => setSelected(prev => ({ ...prev, [c.id]: e.target.checked }))}
                    />
                    {/* Group → Venue → Flyer (directory brand marks, not avatars) */}
                    <div className="qsearch__cand-row" aria-label="Group, venue, flyer">
                      <div className="qsearch__cand-slot">
                        <span className="qsearch__cand-slot-label">Group</span>
                        {groupBrand ? (
                          <div
                            className="qsearch__cand-logo"
                            style={{ borderColor: groupBrand.color }}
                            title={groupBrand.name}
                          >
                            <img
                              src={groupBrand.logoUrl || "/directory-logos/fallback_nonprofits.png"}
                              alt=""
                              loading="lazy"
                              onError={e => {
                                const img = e.currentTarget;
                                if (!img.src.includes("fallback_")) {
                                  img.src = "/directory-logos/fallback_nonprofits.png";
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="qsearch__cand-logo qsearch__cand-logo--empty" title="No group match">
                            —
                          </div>
                        )}
                        {groupBrand && (
                          <span className="qsearch__cand-slot-name" style={{ color: groupBrand.color }}>
                            {groupBrand.name}
                          </span>
                        )}
                      </div>
                      <div className="qsearch__cand-slot">
                        <span className="qsearch__cand-slot-label">Venue</span>
                        {venueBrand ? (
                          <div
                            className="qsearch__cand-logo"
                            style={{ borderColor: venueBrand.color }}
                            title={venueBrand.name}
                          >
                            <img
                              src={venueBrand.logoUrl || "/directory-logos/fallback_venues.png"}
                              alt=""
                              loading="lazy"
                              onError={e => {
                                const img = e.currentTarget;
                                if (!img.src.includes("fallback_")) {
                                  img.src = "/directory-logos/fallback_venues.png";
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="qsearch__cand-logo qsearch__cand-logo--empty" title="No venue match">
                            —
                          </div>
                        )}
                        {venueBrand && (
                          <span className="qsearch__cand-slot-name" style={{ color: venueBrand.color }}>
                            {venueBrand.name}
                          </span>
                        )}
                      </div>
                      <div className="qsearch__cand-slot qsearch__cand-slot--flyer">
                        <span className="qsearch__cand-slot-label">Flyer</span>
                        {c.draft.posterImageUrl ? (
                          <img
                            src={c.draft.posterImageUrl}
                            alt=""
                            className="qsearch__cand-flyer"
                            loading="lazy"
                            onError={e => {
                              e.currentTarget.style.opacity = "0.35";
                              e.currentTarget.title = "Flyer failed to load";
                            }}
                          />
                        ) : (
                          <div className="qsearch__cand-flyer qsearch__cand-flyer--empty">No flyer</div>
                        )}
                      </div>
                    </div>
                    <div className="qsearch__cand-body">
                      <h3 className="qsearch__cand-title" data-testid="qsearch-cand-title">
                        {c.draft.title || "Untitled event"}
                      </h3>
                      <p className="qsearch__cand-party">
                        <span className="qsearch__cand-party-line">
                          {[
                            c.draft.dayOfWeek,
                            formatPartyWhen(c.draft.dateStart, c.draft.dateEnd),
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                        <span className="qsearch__cand-party-line">
                          {[c.draft.venueName, c.draft.address].filter(Boolean).join(" · ")}
                        </span>
                        <span className="qsearch__cand-party-line">
                          {[
                            c.draft.admission && c.draft.admission !== "FREE"
                              ? c.draft.admission
                              : c.draft.admission === "FREE"
                                ? "Free"
                                : null,
                            c.draft.ageRequirement && c.draft.ageRequirement !== "ALL_AGES"
                              ? c.draft.ageRequirement.replace(/_/g, " ")
                              : c.draft.ageRequirement === "ALL_AGES"
                                ? "All ages"
                                : null,
                          ]
                            .filter(Boolean)
                            .join(" · ") || null}
                        </span>
                        {c.draft.description?.trim() && (
                          <span className="qsearch__cand-party-desc">
                            {c.draft.description.trim().replace(/\s+/g, " ").slice(0, 160)}
                            {c.draft.description.trim().length > 160 ? "…" : ""}
                          </span>
                        )}
                      </p>
                      <p className="qsearch__cand-meta">
                        {(c.sourceUrl || c.draft.sourceUrl) ? (
                          <>
                            Found at{" "}
                            <a
                              href={c.sourceUrl || c.draft.sourceUrl || "#"}
                              target="_blank"
                              rel="noreferrer"
                              onClick={e => e.stopPropagation()}
                            >
                              {c.sourceLabel || "source"}
                            </a>
                          </>
                        ) : (
                          c.sourceLabel
                        )}
                        {c.draft.parseSource ? ` · ${c.draft.parseSource}` : ""}
                        {c.draft.confidence != null
                          ? ` · conf ${(c.draft.confidence * 100).toFixed(0)}%`
                          : ""}
                        {c.draft.ticketUrl ? (
                          <>
                            {" · "}
                            <a
                              href={c.draft.ticketUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={e => e.stopPropagation()}
                            >
                              Tickets
                            </a>
                          </>
                        ) : null}
                      </p>
                      <div>
                        {c.condensed && c.recurring === "weekly" && (
                          <span className="qsearch__badge is-week">Weekly · {c.recurringCount}</span>
                        )}
                        {c.condensed && c.recurring === "monthly" && (
                          <span className="qsearch__badge is-month">Monthly · {c.recurringCount}</span>
                        )}
                        {c.strongDuplicate && (
                          <span className="qsearch__badge is-fail">
                            Dup #{c.strongDuplicate.eventId}
                          </span>
                        )}
                        {catalogAlreadyRecurring && (
                          <span className="qsearch__badge is-ok">Catalog already series</span>
                        )}
                        {needsRecurringUpdate && (
                          <span className="qsearch__badge is-new">Needs recurring update</span>
                        )}
                        {!c.draft.posterImageUrl && (
                          <span className="qsearch__badge is-fail">Missing flyer</span>
                        )}
                        {c.draft.posterImageUrl?.startsWith("/uploads/") && (
                          <span className="qsearch__badge is-ok">Flyer saved</span>
                        )}
                        {c.draft.warnings?.some(w => /Flyer reused from prior/i.test(w)) && (
                          <span className="qsearch__badge is-ok">Prior flyer</span>
                        )}
                        {c.conflicts?.map(conf => (
                          <span key={conf.eventId} className="qsearch__badge is-conflict">
                            {conf.kind === "likely_replacement" ? "May replace" : "Conflict"} #
                            {conf.eventId}
                          </span>
                        ))}
                      </div>
                      {(c.recurringDupAction || c.strongDuplicate?.note) && (
                        <p style={{ fontSize: 12, color: "var(--qs-orange)", margin: "6px 0 0" }}>
                          {c.recurringDupAction || c.strongDuplicate?.note}
                        </p>
                      )}
                      {!!c.conflicts?.length && (
                        <div className="qsearch__cand-actions">
                          <span style={{ fontSize: 12, color: "var(--qs-muted)" }}>
                            {c.conflicts[0]?.note}
                          </span>
                          <select
                            value={conflictAction[c.id] || "keep_both"}
                            onChange={e =>
                              setConflictAction(prev => ({
                                ...prev,
                                [c.id]: e.target.value as ConflictAction,
                              }))
                            }
                            onClick={e => e.preventDefault()}
                          >
                            <option value="keep_both">Keep both</option>
                            <option value="override">Override (hide existing)</option>
                            <option value="deny">Deny this candidate</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </>
          )}
        </div>
      )}

      {tab === "assist" && (
        <div className="qsearch__assist">
          <div className="qsearch__panel qsearch__assist-intro">
            <h2 className="qsearch__panel-title">When to use this tab</h2>
            <ol className="qsearch__assist-steps">
              <li>
                <strong>Scan now</strong> (top of page) — normal path. Pulls venue calendars into
                Review.
              </li>
              <li>
                <strong>Read a flyer</strong> — you have one poster image URL (host shared art, email
                flyer) and Scan didn’t pick it up.
              </li>
              <li>
                <strong>From Instagram</strong> — you copy the post caption (and optionally the image
                URL). We do <em>not</em> log into Instagram or scrape profiles.
              </li>
            </ol>
            <p className="qsearch__assist-note">
              Both tools only create drafts in <strong>Review</strong>. You still approve → HIDDEN.
              Nothing goes LIVE from here.
            </p>
          </div>

          <div className="qsearch__panel">
            <h2 className="qsearch__panel-title">1 · Read a flyer image</h2>
            <p className="qsearch__assist-blurb">
              Paste a <strong>direct link to the image</strong> (ends in .jpg / .png, or a CDN image
              URL). AI reads the text for title, date, and venue, then drops a draft in Review with
              that image as the flyer.
            </p>
            <p className="qsearch__assist-note">
              Needs an AI key on the server (<code>XAI_API_KEY</code> or <code>OPENAI_API_KEY</code>).
              Unclear flyers stay unchecked so you can fix them before approve.
            </p>
            <div className="qsearch__assist-fields">
              <label className="qsearch__field">
                <span>Flyer image URL</span>
                <input
                  className="qsearch__filter"
                  type="url"
                  placeholder="https://example.com/path/to/flyer.jpg"
                  value={visionUrl}
                  onChange={e => setVisionUrl(e.target.value)}
                  data-testid="qsearch-flyer-url"
                />
              </label>
              <label className="qsearch__field">
                <span>Venue name (optional but helps)</span>
                <input
                  className="qsearch__filter"
                  placeholder="e.g. Darcelle XV Showplace"
                  value={visionVenue}
                  onChange={e => setVisionVenue(e.target.value)}
                  data-testid="qsearch-flyer-venue"
                />
              </label>
            </div>
            <div className="qsearch__toolbar">
              <button
                type="button"
                className="is-primary"
                disabled={busy || !visionUrl.trim()}
                onClick={runVision}
                data-testid="qsearch-read-flyer"
              >
                {busy ? "Reading…" : "Read flyer → Review"}
              </button>
            </div>
          </div>

          <div className="qsearch__panel">
            <h2 className="qsearch__panel-title">2 · From an Instagram post</h2>
            <p className="qsearch__assist-blurb">
              Open the post → copy the <strong>caption</strong>. Optionally copy the{" "}
              <strong>image address</strong> (right‑click image → copy image address) so Review gets
              a flyer. We never open Instagram for you.
            </p>
            <div className="qsearch__assist-fields">
              <label className="qsearch__field qsearch__field--wide">
                <span>Caption text (required unless you only have an image URL)</span>
                <textarea
                  className="qsearch__filter qsearch__textarea"
                  placeholder={
                    "Paste the full caption here…\n\nExample:\nFriday Night Show · July 25 · Doors 8pm @ Darcelle"
                  }
                  value={igCaption}
                  onChange={e => setIgCaption(e.target.value)}
                  data-testid="qsearch-ig-caption"
                />
              </label>
              <label className="qsearch__field">
                <span>Flyer image URL (optional)</span>
                <input
                  className="qsearch__filter"
                  type="url"
                  placeholder="https://… (copy image address from the post)"
                  value={igImage}
                  onChange={e => setIgImage(e.target.value)}
                  data-testid="qsearch-ig-image"
                />
              </label>
              <label className="qsearch__field">
                <span>@handle (optional, for notes only)</span>
                <input
                  className="qsearch__filter"
                  placeholder="@venuehandle"
                  value={igHandle}
                  onChange={e => setIgHandle(e.target.value)}
                  data-testid="qsearch-ig-handle"
                />
              </label>
            </div>
            <div className="qsearch__toolbar">
              <button
                type="button"
                className="is-primary"
                disabled={busy || (!igCaption.trim() && !igImage.trim())}
                onClick={() => runIg("paste")}
                data-testid="qsearch-ig-paste"
              >
                {busy ? "Working…" : "Add post → Review"}
              </button>
            </div>

            <details className="qsearch__assist-advanced">
              <summary>Advanced: pull recent posts via Meta API</summary>
              <p className="qsearch__assist-note">
                Only if the server has Meta Business tokens configured. Needs a handle. Most people
                should ignore this and paste the caption instead.
              </p>
              <div className="qsearch__toolbar">
                <button
                  type="button"
                  disabled={busy || !igHandle.trim()}
                  onClick={() => runIg("graph")}
                  data-testid="qsearch-ig-graph"
                >
                  Pull recent posts for @{igHandle.trim().replace(/^@/, "") || "handle"}
                </button>
              </div>
            </details>
          </div>

          <div className="qsearch__panel">
            <h2 className="qsearch__panel-title">3 · Whole calendar URL (advanced)</h2>
            <p className="qsearch__assist-blurb" style={{ marginBottom: 0 }}>
              Prefer <strong>Scan now</strong> — it already walks the source list. To debug one URL
              from scripts or API: <code>POST /api/admin/events/ingest/preview</code> then commit.
              That path is for engineers, not day‑to‑day review.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
