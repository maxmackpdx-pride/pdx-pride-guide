import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link2, Loader2, Upload } from "lucide-react";
import { apiRequest, parseApiError } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  INGEST_SOURCES,
  INGEST_TIER_LABELS,
  type IngestSource,
  type IngestSourceTier,
} from "@shared/ingestSources";

type IngestDraft = {
  title: string;
  description: string;
  venueName: string;
  address: string | null;
  dateStart: string;
  dateEnd: string;
  dayOfWeek: string | null;
  admission: string;
  ticketUrl: string | null;
  posterImageUrl: string | null;
  sourceUrl: string | null;
  parseSource: string;
  warnings: string[];
};

type PreviewItem = {
  index: number;
  draft: IngestDraft;
  selected: boolean;
  strongDuplicate: { eventId: number; title: string; score: number; confidence: string } | null;
  duplicates: Array<{ eventId: number; title: string; score: number; confidence: string }>;
};

type PreviewResult = {
  ok: true;
  sourceUrl: string | null;
  parseSources: string[];
  events: PreviewItem[];
  warnings: string[];
  impact: string;
};

type SourcesResponse = {
  sources: IngestSource[];
  curatedCount: number;
  directoryCount: number;
  total: number;
};

const fieldClass =
  "w-full px-3 py-2 text-white text-sm border border-white/20 bg-black focus:outline-none focus:border-yellow-400";

const TIER_ORDER: IngestSourceTier[] = [
  "directory",
  "1",
  "2",
  "3",
  "eventbrite",
  "partiful",
  "agg",
];

/**
 * Admin URL / paste ingest. Directory websites load live from the Places DB
 * so every listing with a website appears automatically.
 */
export default function AdminIngestPanel({ onCommitted }: { onCommitted?: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(true);
  const [url, setUrl] = useState("");
  const [paste, setPaste] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [status, setStatus] = useState<"HIDDEN" | "LIVE">("HIDDEN");
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [tier, setTier] = useState<IngestSourceTier>("directory");
  const [activeSourceId, setActiveSourceId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const {
    data: sourcesData,
    isLoading: sourcesLoading,
    isError: sourcesError,
    refetch: refetchSources,
  } = useQuery<SourcesResponse>({
    queryKey: ["/api/admin/events/ingest/sources"],
    queryFn: () => apiRequest("GET", "/api/admin/events/ingest/sources").then(r => r.json()),
    staleTime: 30_000,
  });

  // Also refresh when directory list changes (admin added a place website)
  useEffect(() => {
    if (!open) return;
    void refetchSources();
  }, [open, refetchSources]);

  const allSources = sourcesData?.sources ?? INGEST_SOURCES;

  const tierSources = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return allSources
      .filter(s => s.tier === tier)
      .filter(s => {
        if (!q) return true;
        return (
          s.label.toLowerCase().includes(q) ||
          s.url.toLowerCase().includes(q) ||
          String(s.businessType || "").toLowerCase().includes(q)
        );
      });
  }, [allSources, tier, filter]);

  const tierCounts = useMemo(() => {
    const counts = {} as Record<IngestSourceTier, number>;
    for (const t of TIER_ORDER) counts[t] = 0;
    for (const s of allSources) {
      counts[s.tier] = (counts[s.tier] || 0) + 1;
    }
    return counts;
  }, [allSources]);

  function isSelected(item: PreviewItem): boolean {
    if (selected[item.index] !== undefined) return selected[item.index];
    return item.selected;
  }

  const selectedCount = useMemo(() => {
    if (!preview) return 0;
    return preview.events.filter(item => {
      if (selected[item.index] !== undefined) return selected[item.index];
      return item.selected;
    }).length;
  }, [preview, selected]);

  function pickSource(src: IngestSource) {
    setUrl(src.url);
    setActiveSourceId(src.id);
    setPreview(null);
  }

  async function runPreview(overrideUrl?: string) {
    setBusy(true);
    setPreview(null);
    try {
      const body: Record<string, unknown> = { expandPaths: true };
      const useUrl = (overrideUrl ?? url).trim();
      if (useUrl) body.url = useUrl;
      const pasteTrim = paste.trim();
      if (pasteTrim) {
        if (/BEGIN:VCALENDAR|BEGIN:VEVENT/i.test(pasteTrim)) body.ics = pasteTrim;
        else body.html = pasteTrim;
      }
      if (!body.url && !body.html && !body.ics) {
        throw new Error("Pick a Directory chip, curated source, or paste a URL / HTML / .ics");
      }
      const res = await apiRequest("POST", "/api/admin/events/ingest/preview", body);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Preview failed");
      setPreview(data);
      const init: Record<number, boolean> = {};
      for (const e of data.events as PreviewItem[]) init[e.index] = e.selected;
      setSelected(init);
      toast({ title: "Ingest preview", description: data.impact });
    } catch (err) {
      toast({
        title: "Ingest preview failed",
        description: parseApiError(err, "Could not parse source"),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function runCommit() {
    if (!preview) return;
    setBusy(true);
    try {
      const events = preview.events.map(item => ({
        draft: item.draft,
        skip: !isSelected(item),
      }));
      const res = await apiRequest("POST", "/api/admin/events/ingest/commit", {
        confirm: true,
        status,
        skipDuplicates,
        events,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Commit failed");
      toast({
        title: "Ingest committed",
        description: data.impact,
      });
      setPreview(null);
      setPaste("");
      onCommitted?.();
    } catch (err) {
      toast({
        title: "Ingest commit failed",
        description: parseApiError(err, "Could not create events"),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="mb-6 border border-white/15"
      style={{ background: "rgba(255,102,0,0.05)" }}
      data-testid="admin-ingest-panel"
    >
      <button
        type="button"
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
        onClick={() => setOpen(o => !o)}
        data-testid="admin-ingest-toggle"
      >
        <span className="flex items-center gap-2 flex-wrap">
          <Upload size={14} className="text-[#FF6600]" aria-hidden />
          <span className="display text-xs tracking-wide text-[#FF6600]">
            INGEST FROM URL / ICS
          </span>
          <span className="text-white/40 text-xs font-normal normal-case tracking-normal">
            {sourcesLoading
              ? "Loading directory sites…"
              : `${sourcesData?.total ?? allSources.length} sources · ${sourcesData?.directoryCount ?? "?"} from directory`}
          </span>
        </span>
        <span className="text-white/40 text-xs">{open ? "HIDE" : "OPEN"}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-3">
          <p className="text-white/45 text-xs leading-relaxed">
            <strong className="text-white/70">Directory · auto</strong> lists every Place with a
            website - add a site in the directory and it shows up here. Curated tiers keep the
            specialized feeds (Tribe, Squarespace JSON, Badlands worker). Preview expands{" "}
            <code className="text-white/55">/events</code> paths when the homepage is empty.
            Default commit is <strong className="text-white/70">HIDDEN</strong>.
          </p>

          {sourcesError && (
            <p className="text-amber-300/90 text-xs">
              Could not load live directory sources - showing curated list only.{" "}
              <button type="button" className="underline" onClick={() => void refetchSources()}>
                Retry
              </button>
            </p>
          )}

          <div className="flex flex-wrap gap-1.5" data-testid="admin-ingest-tiers">
            {TIER_ORDER.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTier(t);
                  setFilter("");
                }}
                className="display text-[10px] px-2 py-1 border"
                style={{
                  borderColor: tier === t ? "#FF6600" : "rgba(255,255,255,0.2)",
                  color: tier === t ? "#FF6600" : "rgba(255,255,255,0.55)",
                  background: tier === t ? "rgba(255,102,0,0.12)" : "transparent",
                }}
              >
                {INGEST_TIER_LABELS[t]}
                {tierCounts[t] ? ` (${tierCounts[t]})` : ""}
              </button>
            ))}
          </div>

          {(tier === "directory" || tierSources.length > 12) && (
            <input
              type="search"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder={
                tier === "directory"
                  ? "Filter directory places by name…"
                  : "Filter this tier…"
              }
              className={fieldClass}
              data-testid="admin-ingest-filter"
            />
          )}

          <div
            className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto"
            data-testid="admin-ingest-sources"
          >
            {sourcesLoading && tier === "directory" && (
              <span className="text-white/40 text-xs flex items-center gap-2">
                <Loader2 size={12} className="animate-spin" /> Loading directory websites…
              </span>
            )}
            {!sourcesLoading && tierSources.length === 0 && (
              <span className="text-white/45 text-xs">
                {tier === "directory"
                  ? "No directory websites yet - add a website on a Place and refresh."
                  : "No sources in this tier."}
              </span>
            )}
            {tierSources.map(src => {
              const active = activeSourceId === src.id;
              return (
                <button
                  key={src.id}
                  type="button"
                  title={src.notes || src.url}
                  onClick={() => pickSource(src)}
                  className="text-[11px] px-2 py-1 border rounded-sm"
                  style={{
                    borderColor: active
                      ? "#C8FA3C"
                      : src.caution
                        ? "rgba(255,0,204,0.45)"
                        : "rgba(255,255,255,0.18)",
                    color: active
                      ? "#C8FA3C"
                      : src.priority
                        ? "#FF6600"
                        : "rgba(255,255,255,0.75)",
                    background: active ? "rgba(200,250,60,0.08)" : "rgba(0,0,0,0.35)",
                  }}
                  data-testid={`admin-ingest-source-${src.id}`}
                >
                  {src.priority ? "★ " : ""}
                  {src.label}
                  {src.caution ? " ⚠" : ""}
                </button>
              );
            })}
          </div>

          {activeSourceId && (
            <p className="text-white/40 text-[11px] break-all">
              {allSources.find(s => s.id === activeSourceId)?.url}
              {allSources.find(s => s.id === activeSourceId)?.notes
                ? ` · ${allSources.find(s => s.id === activeSourceId)?.notes}`
                : ""}
            </p>
          )}

          <div>
            <label className="display text-[10px] text-white/40 block mb-1" htmlFor="admin-ingest-url">
              PAGE OR CALENDAR URL
            </label>
            <div className="relative">
              <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
              <input
                id="admin-ingest-url"
                type="url"
                value={url}
                onChange={e => {
                  setUrl(e.target.value);
                  setActiveSourceId(null);
                }}
                placeholder="Or paste any event URL / .ics / format=json feed"
                className={fieldClass}
                style={{ paddingLeft: 34 }}
                data-testid="admin-ingest-url"
              />
            </div>
          </div>

          <div>
            <label className="display text-[10px] text-white/40 block mb-1" htmlFor="admin-ingest-paste">
              OR PASTE HTML / ICS
            </label>
            <textarea
              id="admin-ingest-paste"
              value={paste}
              onChange={e => setPaste(e.target.value)}
              rows={3}
              placeholder="Optional: paste page HTML with JSON-LD, or a full VCALENDAR body"
              className={fieldClass}
              data-testid="admin-ingest-paste"
            />
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <button
              type="button"
              disabled={busy}
              onClick={() => runPreview()}
              className="display text-xs px-3 py-2 border inline-flex items-center gap-2"
              style={{ borderColor: "#19E3FF", color: "#19E3FF" }}
              data-testid="admin-ingest-preview"
            >
              {busy ? <Loader2 size={12} className="animate-spin" /> : null}
              PREVIEW
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void refetchSources()}
              className="display text-[10px] px-2 py-2 border text-white/50 border-white/20"
              title="Reload directory websites"
            >
              REFRESH SOURCES
            </button>
            {preview && (
              <span className="text-white/50 text-xs" data-testid="admin-ingest-impact">
                {preview.impact}
                {preview.parseSources?.length
                  ? ` · via ${preview.parseSources.join(" + ")}`
                  : ""}
              </span>
            )}
          </div>

          {preview?.warnings?.length ? (
            <ul className="text-amber-300/80 text-xs space-y-1 list-disc pl-4">
              {preview.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          ) : null}

          {preview && preview.events.length > 0 && (
            <div className="space-y-2" data-testid="admin-ingest-results">
              {preview.events.map(item => {
                const on = isSelected(item);
                return (
                  <label
                    key={item.index}
                    className="flex gap-3 p-3 border border-white/10 cursor-pointer"
                    style={{
                      background: on ? "rgba(200,250,60,0.06)" : "rgba(0,0,0,0.35)",
                      opacity: on ? 1 : 0.65,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={e =>
                        setSelected(prev => ({ ...prev, [item.index]: e.target.checked }))
                      }
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-white text-sm font-medium truncate">{item.draft.title}</div>
                      <div className="text-white/50 text-xs mt-0.5">
                        {item.draft.dateStart} → {item.draft.dateEnd}
                        {item.draft.dayOfWeek ? ` · ${item.draft.dayOfWeek}` : ""}
                        {" · "}
                        {item.draft.venueName}
                      </div>
                      {item.strongDuplicate && (
                        <div className="text-[#FF00CC] text-xs mt-1">
                          Strong duplicate of #{item.strongDuplicate.eventId}{" "}
                          “{item.strongDuplicate.title}” - deselected by default
                        </div>
                      )}
                      {item.draft.warnings?.length > 0 && (
                        <div className="text-amber-200/70 text-xs mt-1">
                          {item.draft.warnings.join(" · ")}
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}

              <div className="flex flex-wrap gap-3 items-end pt-2 border-t border-white/10">
                <div>
                  <label className="display text-[10px] text-white/40 block mb-1" htmlFor="admin-ingest-status">
                    CREATE AS
                  </label>
                  <select
                    id="admin-ingest-status"
                    value={status}
                    onChange={e => setStatus(e.target.value as "HIDDEN" | "LIVE")}
                    className={fieldClass}
                    style={{ maxWidth: 160 }}
                  >
                    <option value="HIDDEN">HIDDEN (safe)</option>
                    <option value="LIVE">LIVE (public)</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-xs text-white/60 pb-2">
                  <input
                    type="checkbox"
                    checked={skipDuplicates}
                    onChange={e => setSkipDuplicates(e.target.checked)}
                  />
                  Skip strong duplicates
                </label>
                <button
                  type="button"
                  disabled={busy || selectedCount === 0}
                  onClick={runCommit}
                  className="display text-xs px-3 py-2 border"
                  style={{
                    borderColor: "#C8FA3C",
                    color: "#C8FA3C",
                    opacity: selectedCount === 0 ? 0.4 : 1,
                  }}
                  data-testid="admin-ingest-commit"
                >
                  COMMIT {selectedCount} EVENT{selectedCount === 1 ? "" : "S"}
                </button>
              </div>
            </div>
          )}

          {preview && preview.events.length === 0 && (
            <p className="text-white/50 text-sm">
              Nothing parsed from that site. Try a curated ★ feed, or paste an .ics / Eventbrite page.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
