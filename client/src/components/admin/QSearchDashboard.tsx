import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, parseApiError } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import "./qsearch.css";
import QSearchTrusted from "./QSearchTrusted";

const DIRECTORY_TYPES = [
  "bar",
  "venue",
  "restaurant",
  "cafe",
  "shop",
  "service",
  "hotel",
  "nonprofit",
  "healthcare",
  "realestate",
  "group",
] as const;

type DirectoryFormState = {
  name: string;
  type: (typeof DIRECTORY_TYPES)[number];
  description: string;
  address: string;
  neighborhood: string;
  website: string;
  instagram: string;
  phone: string;
  hours: string;
  imageUrl: string;
  queerOwned: boolean;
  queerFriendly: boolean;
  lat: number | null;
  lng: number | null;
  fromCandidateId: string;
};

/** Venue names that should not prompt "Add to directory". */
function isWeakVenueName(name: string | null | undefined): boolean {
  const v = String(name || "").trim();
  if (!v || v.length < 2) return true;
  return /^(tba|tbd|n\/?a|unknown|various|online|virtual|see listing|multiple|portland)$/i.test(v);
}

/** Prefer a real venue site as website — skip Eventbrite/Facebook list noise. */
function guessWebsiteFromCandidate(c: {
  sourceUrl?: string;
  draft: { sourceUrl?: string | null; ticketUrl?: string | null };
}): string {
  const urls = [c.draft.sourceUrl, c.sourceUrl, c.draft.ticketUrl].filter(Boolean) as string[];
  for (const raw of urls) {
    try {
      const u = new URL(raw);
      const host = u.hostname.replace(/^www\./, "").toLowerCase();
      if (
        /eventbrite|facebook|fb\.com|instagram|ticketmaster|etix|dice\.fm|ra\.co|bandsintown/i.test(
          host,
        )
      ) {
        continue;
      }
      return `${u.protocol}//${u.hostname}`;
    } catch {
      /* next */
    }
  }
  return "";
}

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
  businessId: number | null;
  tier: string;
  format: string;
  resolvedUrl: string | null;
  recipeUrl: string | null;
  winningParser: string | null;
  yieldStatus: string;
  zeroYieldStreak: number;
  instagramHandle: string | null;
  dragpdxOptIn: boolean;
  disabled?: boolean;
  isCustom?: boolean;
};

/** City catch-alls / aggregators — not one directory listing. */
const GENERAL_SCRAPE_TIERS = new Set(["eventbrite", "partiful", "agg"]);

/** Strip recipe suffixes so "Holocene events" and "Holocene (BIT)" group under Holocene. */
function listingNameFromLabel(label: string): string {
  return label
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(
      /\s+(calendar|events?|ICS|Tribe JSON|JSON|API|homepage|Weebly weeklies|Eventbrite|BIT|Tixr|RA|site|flyer page|Portland only).*$/i,
      "",
    )
    .replace(/\s+/g, " ")
    .trim() || label;
}

function hostKey(url: string | null | undefined): string {
  if (!url) return "";
  try {
    return new URL(url.includes("://") ? url : `https://${url}`).hostname
      .replace(/^www\./i, "")
      .toLowerCase();
  } catch {
    return "";
  }
}

function isGeneralScrapeSource(h: SourceHealth): boolean {
  if (h.isDirectory || h.businessId != null) return false;
  if (GENERAL_SCRAPE_TIERS.has(h.tier)) return true;
  // Portland identity keyword searches (EB + EverOut) — not a single directory listing
  if (/^eb-/i.test(h.sourceId)) return true;
  if (/^everout-/i.test(h.sourceId)) return true;
  if (
    /^(partiful-|dragpdx|qsc-|pdx-events|bit-electronic|ra-process)/i.test(h.sourceId)
  ) {
    return true;
  }
  return false;
}

type SourceListingGroup = {
  key: string;
  name: string;
  businessId: number | null;
  /** True when this group includes a directory-auto source */
  hasDirectorySource: boolean;
  sources: SourceHealth[];
};

function buildDirectoryListingGroups(sources: SourceHealth[]): SourceListingGroup[] {
  const groups = new Map<string, SourceListingGroup>();
  const hostToKey = new Map<string, string>();
  const nameToKey = new Map<string, string>();

  const ensure = (key: string, name: string, businessId: number | null, hasDir: boolean) => {
    let g = groups.get(key);
    if (!g) {
      g = { key, name, businessId, hasDirectorySource: hasDir, sources: [] };
      groups.set(key, g);
    } else {
      if (hasDir) g.hasDirectorySource = true;
      if (businessId != null && g.businessId == null) g.businessId = businessId;
      // Prefer cleaner directory place name over recipe label
      if (hasDir && name) g.name = name;
    }
    return g;
  };

  // Pass 1: directory auto-sources define listing groups
  for (const h of sources) {
    if (!h.isDirectory && h.businessId == null) continue;
    const key = h.businessId != null ? `biz:${h.businessId}` : `dir:${h.sourceId}`;
    const g = ensure(key, h.label, h.businessId, h.isDirectory);
    g.sources.push(h);
    const hk = hostKey(h.resolvedUrl || h.url);
    if (hk) hostToKey.set(hk, key);
    nameToKey.set(listingNameFromLabel(h.label).toLowerCase(), key);
  }

  // Pass 2: curated venue/group recipes attach to listing or form their own
  for (const h of sources) {
    if (h.isDirectory || h.businessId != null) continue;
    const hk = hostKey(h.resolvedUrl || h.recipeUrl || h.url);
    let key = hk ? hostToKey.get(hk) : undefined;
    if (!key) {
      const n = listingNameFromLabel(h.label).toLowerCase();
      key = nameToKey.get(n);
      if (!key) {
        // Soft: directory name contained in recipe name or vice versa
        Array.from(nameToKey.entries()).some(([dn, dk]) => {
          if (n.includes(dn) || dn.includes(n)) {
            key = dk;
            return true;
          }
          return false;
        });
      }
    }
    if (!key) {
      const name = listingNameFromLabel(h.label);
      key = `curated:${name.toLowerCase()}`;
      ensure(key, name, null, false);
      nameToKey.set(name.toLowerCase(), key);
      if (hk) hostToKey.set(hk, key);
    }
    const g = groups.get(key)!;
    // Avoid double-adding if already in from pass 1
    if (!g.sources.some(s => s.sourceId === h.sourceId)) g.sources.push(h);
  }

  Array.from(groups.values()).forEach(g => {
    g.sources.sort((a: SourceHealth, b: SourceHealth) => {
      // Directory auto first, then by label
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      return a.label.localeCompare(b.label);
    });
  });

  return Array.from(groups.values()).sort((a, b) => a.name.localeCompare(b.name));
}

type CoverageRow = {
  businessId: number;
  name: string;
  type: string | null;
  websiteField: string | null;
  resolvedUrl: string | null;
  resolution: "field" | "fallback" | "none";
  absorbedByCurated: boolean;
};

type SourceBundleMember = {
  sourceId: string;
  sourceLabel: string;
  sourceUrl: string;
  title?: string;
  venueName?: string;
  dateStart?: string;
  dateEnd?: string;
  ticketUrl?: string | null;
  eventPageUrl?: string | null;
  address?: string | null;
  posterImageUrl?: string | null;
  ageRequirement?: string | null;
  admission?: string | null;
};

type FieldConflict = {
  field: string;
  label: string;
  values: Array<{ sourceLabel: string; sourceId: string; value: string }>;
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
    eventPageUrl?: string | null;
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
  /** Multi-source scrape of the same party */
  sourceBundle?: SourceBundleMember[];
  fieldConflicts?: FieldConflict[];
  status?: string;
};

/** Display-time bundle for older queue rows that weren't merged on scan. */
type QueueBundle = {
  key: string;
  primary: Candidate;
  members: Candidate[];
  sourceBundle: SourceBundleMember[];
  fieldConflicts: FieldConflict[];
};

function clientNormTitle(t: string): string {
  return String(t || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function clientNormVenue(v: string): string {
  return String(v || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function clientEventKey(c: Candidate): string {
  // Prefer ticket/page URL identity
  const urls = [c.draft.ticketUrl, c.draft.eventPageUrl, c.draft.sourceUrl, c.sourceUrl].filter(
    Boolean,
  ) as string[];
  for (const raw of urls) {
    try {
      const u = new URL(raw);
      if (/format=json|wp-json|tribe\/events|ical|\.ics/i.test(u.href)) continue;
      return `url:${u.hostname.replace(/^www\./, "")}${u.pathname.replace(/\/$/, "").toLowerCase()}`;
    } catch {
      /* next */
    }
  }
  const day = String(c.draft.dateStart || "").slice(0, 10);
  const title = clientNormTitle(c.draft.title).slice(0, 48);
  const venue = clientNormVenue(c.draft.venueName || "tba").slice(0, 32);
  const time = String(c.draft.dateStart || "").slice(11, 16);
  return `slot:${day}|${title}|${venue}|${time}`;
}

function clientFieldConflicts(members: Candidate[]): FieldConflict[] {
  const fields: Array<{ field: string; label: string; get: (c: Candidate) => string }> = [
    { field: "title", label: "Title", get: c => c.draft.title || "" },
    { field: "venueName", label: "Venue", get: c => c.draft.venueName || "" },
    { field: "address", label: "Address", get: c => c.draft.address || "" },
    {
      field: "dateStart",
      label: "Start",
      get: c => String(c.draft.dateStart || "").slice(0, 16).replace("T", " "),
    },
    {
      field: "dateEnd",
      label: "End",
      get: c => String(c.draft.dateEnd || "").slice(0, 16).replace("T", " "),
    },
    { field: "ticketUrl", label: "Tickets", get: c => c.draft.ticketUrl || "" },
    { field: "ageRequirement", label: "Age", get: c => c.draft.ageRequirement || "" },
    { field: "admission", label: "Admission", get: c => c.draft.admission || "" },
  ];
  const out: FieldConflict[] = [];
  for (const f of fields) {
    const byVal = new Map<string, { sourceLabel: string; sourceId: string; value: string }>();
    for (const m of members) {
      const v = f.get(m).trim();
      if (!v) continue;
      const key = v.toLowerCase();
      if (!byVal.has(key)) {
        byVal.set(key, {
          sourceLabel: m.sourceLabel,
          sourceId: m.sourceId,
          value: v.length > 80 ? v.slice(0, 77) + "…" : v,
        });
      }
    }
    if (byVal.size > 1) {
      out.push({ field: f.field, label: f.label, values: Array.from(byVal.values()) });
    }
  }
  return out;
}

function bundleQueueCandidates(list: Candidate[]): QueueBundle[] {
  const map = new Map<string, Candidate[]>();
  for (const c of list) {
    // Server-bundled already? keep as its own group key by id so we don't re-merge
    if (c.sourceBundle && c.sourceBundle.length > 1) {
      map.set(`server:${c.id}`, [c]);
      continue;
    }
    const key = clientEventKey(c);
    const arr = map.get(key) || [];
    arr.push(c);
    map.set(key, arr);
  }
  const bundles: QueueBundle[] = [];
  Array.from(map.entries()).forEach(([key, members]) => {
    // Prefer member with flyer / longer description as primary
    const ranked = [...members].sort((a, b) => {
      const score = (c: Candidate) =>
        (c.draft.posterImageUrl ? 40 : 0) +
        (c.draft.description?.length || 0) / 20 +
        (c.draft.ticketUrl ? 10 : 0);
      return score(b) - score(a);
    });
    const primary = ranked[0];
    const serverBundle = primary.sourceBundle?.length
      ? primary.sourceBundle
      : members.map(m => ({
          sourceId: m.sourceId,
          sourceLabel: m.sourceLabel,
          sourceUrl: m.sourceUrl,
          title: m.draft.title,
          venueName: m.draft.venueName,
          dateStart: m.draft.dateStart,
          dateEnd: m.draft.dateEnd,
          ticketUrl: m.draft.ticketUrl,
          eventPageUrl: m.draft.eventPageUrl,
          address: m.draft.address,
          posterImageUrl: m.draft.posterImageUrl,
          ageRequirement: m.draft.ageRequirement,
          admission: m.draft.admission,
        }));
    // unique by sourceId
    const seen = new Set<string>();
    const sourceBundle = serverBundle.filter(s => {
      if (seen.has(s.sourceId)) return false;
      seen.add(s.sourceId);
      return true;
    });
    const fieldConflicts =
      primary.fieldConflicts && primary.fieldConflicts.length
        ? primary.fieldConflicts
        : members.length > 1
          ? clientFieldConflicts(members)
          : [];
    bundles.push({ key, primary, members, sourceBundle, fieldConflicts });
  });
  return bundles;
}

function buildDirectoryFormFromCandidate(c: Candidate): DirectoryFormState {
  const name = String(c.draft.venueName || "").trim();
  const desc =
    (c.draft.description || "").trim().slice(0, 500) ||
    `${name} — found via QSearch (${c.sourceLabel || "scan"}). Edit this blurb before publishing.`;
  return {
    name,
    type: "venue",
    description: desc.length >= 10 ? desc : `${desc} Portland LGBTQ+ / nightlife place.`.slice(0, 500),
    address: String(c.draft.address || "").trim(),
    neighborhood: "",
    website: guessWebsiteFromCandidate(c),
    instagram: "",
    phone: "",
    hours: "",
    // Flyer can seed logo preview until a proper neon logo is uploaded
    imageUrl: c.draft.posterImageUrl || "",
    queerOwned: false,
    queerFriendly: true,
    lat: null,
    lng: null,
    fromCandidateId: c.id,
  };
}

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

type Tab = "overview" | "trusted" | "venues" | "queue" | "assist";
/** Which slice of data a hero-stat click should show in the tab below */
type StatFocus = "scan-urls" | "directory" | "works" | "trouble" | "queue" | "new-links" | null;
/** Sources tab: all, directory listings only, or general scrape only */
type SourceSection = "all" | "directory" | "general";
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

/** Human-readable party window — always includes year (critical for multi-year ICS). */
function formatPartyWhen(dateStart?: string | null, dateEnd?: string | null): string {
  if (!dateStart) return "";
  const parse = (s: string) => {
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (!m) return s.slice(0, 16);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const year = m[1];
    const mon = months[Number(m[2]) - 1] || m[2];
    const day = Number(m[3]);
    let h = Number(m[4]);
    const min = m[5];
    const ap = h >= 12 ? "pm" : "am";
    h = h % 12 || 12;
    return { date: `${mon} ${day}, ${year}`, dayKey: `${year}-${m[2]}-${m[3]}`, time: `${h}:${min}${ap}` };
  };
  const a = parse(dateStart);
  if (typeof a === "string") return a;
  if (!dateEnd) return `${a.date} · ${a.time}`;
  const b = parse(dateEnd);
  if (typeof b === "string") return `${a.date} · ${a.time}`;
  if (a.dayKey === b.dayKey) return `${a.date} · ${a.time}–${b.time}`;
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

/** Prefer human event page over feed/API URLs (ICS feed, Tribe REST, etc.). */
function isFeedOrApiUrl(url: string): boolean {
  return /format=json|wp-json|\/tribe\/events\/v1|\.ics(\?|$)|\/ics\/?(\?|$)|\/api\/calendar|ical=1|\/calendar\/.*ics/i.test(
    url,
  );
}

function isTicketVendorUrl(url: string): boolean {
  return /ticketmaster|etix\.com|eventbrite\.com\/checkout|dice\.fm\/checkout/i.test(url);
}

/** Public page for this listing — not the scrape feed. */
function humanEventPageUrl(c: Candidate): string | null {
  const d = c.draft;
  const candidates = [d.eventPageUrl, d.ticketUrl, d.sourceUrl, c.sourceUrl].filter(
    Boolean,
  ) as string[];
  for (const u of candidates) {
    if (!/^https?:\/\//i.test(u)) continue;
    if (isFeedOrApiUrl(u)) continue;
    return u;
  }
  // Fallback: ticket vendor page is still human-openable
  for (const u of candidates) {
    if (/^https?:\/\//i.test(u) && !isFeedOrApiUrl(u)) return u;
  }
  return null;
}

function ticketLinkUrl(c: Candidate, eventPage: string | null): string | null {
  const t = c.draft.ticketUrl;
  if (!t || !/^https?:\/\//i.test(t)) return null;
  if (eventPage && t === eventPage) return null;
  if (isFeedOrApiUrl(t)) return null;
  // Show separate Tickets when it's a vendor or different from event page
  if (isTicketVendorUrl(t) || (eventPage && t !== eventPage)) return t;
  return null;
}

function SourceRow({
  h,
  recipeEdits,
  setRecipeEdits,
  saveRecipe,
  onClearRecipe,
  onDelete,
  onRestore,
  busy,
}: {
  h: SourceHealth;
  recipeEdits: Record<string, string>;
  setRecipeEdits: (fn: (prev: Record<string, string>) => Record<string, string>) => void;
  saveRecipe: (sourceId: string) => void;
  onClearRecipe: () => void;
  onDelete: (h: SourceHealth) => void;
  onRestore?: (h: SourceHealth) => void;
  busy?: boolean;
}) {
  const link = h.resolvedUrl || h.url;
  const isDisabled = Boolean(h.disabled);
  return (
    <tr className={isDisabled ? "is-disabled-source" : undefined}>
      <td>
        {h.label}
        <div style={{ color: "var(--qs-muted)", fontSize: 11 }}>
          {h.tier}
          {h.isNew ? " · new" : ""}
          {h.isDirectory ? " · directory auto" : ""}
          {h.isCustom ? " · custom" : ""}
          {!h.isDirectory && !h.isCustom && !isGeneralScrapeSource(h) ? " · recipe" : ""}
          {isGeneralScrapeSource(h) ? " · general" : ""}
          {isDisabled ? " · removed" : ""}
        </div>
      </td>
      <td>
        {isDisabled ? (
          <span className="qsearch__badge is-fail">removed</span>
        ) : (
          <>
            <span className={`qsearch__badge ${yieldBadge(h.yieldStatus)}`}>{h.yieldStatus}</span>
            {h.zeroYieldStreak > 0 && (
              <span className="qsearch__badge is-fail">0×{h.zeroYieldStreak}</span>
            )}
            {h.lastEventCount > 0 && (
              <div style={{ fontSize: 11, color: "var(--qs-muted)" }}>
                last {h.lastEventCount} events
              </div>
            )}
          </>
        )}
      </td>
      <td style={{ minWidth: 220 }}>
        <a href={link} target="_blank" rel="noreferrer">
          {link.slice(0, 64)}
          {link.length > 64 ? "…" : ""}
        </a>
        {!isDisabled && (
          <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
            <input
              className="qsearch__filter"
              style={{ maxWidth: 260 }}
              placeholder="Recipe URL override"
              value={recipeEdits[h.sourceId] ?? h.recipeUrl ?? ""}
              onChange={e => setRecipeEdits(prev => ({ ...prev, [h.sourceId]: e.target.value }))}
            />
            <button type="button" onClick={() => saveRecipe(h.sourceId)} disabled={busy}>
              Save recipe
            </button>
            {h.recipeUrl && (
              <button type="button" onClick={onClearRecipe} disabled={busy}>
                Clear
              </button>
            )}
          </div>
        )}
      </td>
      <td>
        <div className="qsearch__source-actions">
          {isDisabled && onRestore ? (
            <button type="button" className="qsearch__btn-restore" onClick={() => onRestore(h)} disabled={busy}>
              Restore
            </button>
          ) : (
            <>
              <span style={{ color: "var(--qs-muted)", fontSize: 12 }}>{h.winningParser || "—"}</span>
              <button
                type="button"
                className="qsearch__btn-delete"
                onClick={() => onDelete(h)}
                disabled={busy}
                title={h.isCustom ? "Permanently delete custom source" : "Remove from scrape list (can restore)"}
              >
                {h.isCustom ? "Delete" : "Remove"}
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function QSearchDashboard({ onCommitted }: { onCommitted?: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("overview");
  const [statFocus, setStatFocus] = useState<StatFocus>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<ScanJobView | null>(null);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [conflictAction, setConflictAction] = useState<Record<string, ConflictAction>>({});
  const [venueFilter, setVenueFilter] = useState("");
  const [sourceSection, setSourceSection] = useState<SourceSection>("all");
  const [showAddSource, setShowAddSource] = useState(false);
  const [addLabel, setAddLabel] = useState("");
  const [addUrl, setAddUrl] = useState("");
  const [addTier, setAddTier] = useState("custom");
  const [addFormat, setAddFormat] = useState("html");
  const [showRemoved, setShowRemoved] = useState(false);
  const [resultFilter, setResultFilter] = useState("");
  const [tryVision, setTryVision] = useState(true);
  /** Default off: only upcoming/current listings in results */
  const [includePastEvents, setIncludePastEvents] = useState(false);
  const [recipeEdits, setRecipeEdits] = useState<Record<string, string>>({});

  // Assist forms
  const [visionUrl, setVisionUrl] = useState("");
  const [visionVenue, setVisionVenue] = useState("");
  const [igUrl, setIgUrl] = useState("");
  const [igHandle, setIgHandle] = useState("");

  // Add-to-directory modal (unknown venue from scan)
  const [dirForm, setDirForm] = useState<DirectoryFormState | null>(null);
  const [dirSaving, setDirSaving] = useState(false);
  const [dirAddedNames, setDirAddedNames] = useState<Record<string, true>>({});

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

  async function clearLastScan(scope: "last" | "all" = "last") {
    const msg =
      scope === "all"
        ? "Clear the entire Review queue? All pending scan candidates will be discarded (not committed)."
        : "Clear pending candidates from the last scan? Useful after a noisy run (bar crawls, wrong EB dumps).";
    if (!window.confirm(msg)) return;
    setBusy(true);
    try {
      const res = await apiRequest("POST", "/api/admin/qsearch/queue/clear", { scope, hard: false });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Clear failed");
      setSelected({});
      setJob(null);
      setJobId(null);
      toast({
        title: scope === "all" ? "Review queue cleared" : "Last scan cleared",
        description: `${data.cleared ?? 0} candidate${data.cleared === 1 ? "" : "s"} removed from queue`,
      });
      void refetch();
      void refetchQueue();
      void queryClient.invalidateQueries({ queryKey: ["/api/admin/qsearch/queue"] });
    } catch (err) {
      toast({
        title: "Clear failed",
        description: parseApiError(err, "Could not clear scan"),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
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
    if (!visionUrl.trim()) return;
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
          : data.error || "Try a clearer image or add a venue name.",
      });
      if (n) {
        void refetchQueue();
        setTab("queue");
      }
    } catch (err) {
      toast({
        title: "Could not read flyer",
        description: parseApiError(
          err,
          "Needs cloud vision (XAI_API_KEY or OPENAI_API_KEY) — not a local model",
        ),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function runVisionUpload(files: FileList | File[]) {
    const list = Array.from(files).slice(0, 12);
    if (!list.length) return;
    setBusy(true);
    try {
      const body = new FormData();
      for (const f of list) body.append("flyers", f);
      if (visionVenue.trim()) body.append("venueHint", visionVenue.trim());
      const res = await fetch("/api/admin/qsearch/vision/upload", {
        method: "POST",
        body,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload vision failed");
      const n = data.candidates?.length || data.draftCount || 0;
      toast({
        title: n ? `Read ${list.length} flyer${list.length === 1 ? "" : "s"}` : "No events from uploads",
        description: n
          ? `${n} draft${n === 1 ? "" : "s"} in Review${data.errors?.length ? ` · ${data.errors.length} failed` : ""}`
          : data.error || "Check API key and image quality",
      });
      if (n) {
        void refetchQueue();
        setTab("queue");
      }
    } catch (err) {
      toast({
        title: "Flyer upload failed",
        description: parseApiError(err, "Needs XAI_API_KEY or OPENAI_API_KEY"),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function saveDirectoryPlace() {
    if (!dirForm) return;
    if (!dirForm.name.trim() || dirForm.name.trim().length < 2) {
      toast({ title: "Name required", description: "Enter the place name.", variant: "destructive" });
      return;
    }
    if (!dirForm.description.trim() || dirForm.description.trim().length < 10) {
      toast({
        title: "Description required",
        description: "Add at least a short blurb (10+ characters) for the directory card.",
        variant: "destructive",
      });
      return;
    }
    setDirSaving(true);
    try {
      const res = await apiRequest("POST", "/api/admin/directory", {
        name: dirForm.name.trim(),
        type: dirForm.type,
        description: dirForm.description.trim(),
        address: dirForm.address.trim() || null,
        neighborhood: dirForm.neighborhood.trim() || null,
        website: dirForm.website.trim() || null,
        instagram: dirForm.instagram.trim() || null,
        phone: dirForm.phone.trim() || null,
        hours: dirForm.hours.trim() || null,
        imageUrl: dirForm.imageUrl.trim() || null,
        queerOwned: dirForm.queerOwned,
        queerFriendly: dirForm.queerFriendly,
        active: true,
        isNew: true,
        lat: dirForm.lat,
        lng: dirForm.lng,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not add place");
      const key = dirForm.name.trim().toLowerCase();
      setDirAddedNames(prev => ({ ...prev, [key]: true }));
      setDirForm(null);
      toast({
        title: "Added to directory",
        description: `${data.name || dirForm.name} is live as ${data.type || dirForm.type}. Re-scan or refresh Review to match logos.`,
      });
      void queryClient.invalidateQueries({ queryKey: ["/api/admin/qsearch/dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["/api/admin/qsearch/queue"] });
      void refetch();
      void refetchQueue();
    } catch (err) {
      toast({
        title: "Directory add failed",
        description: parseApiError(err, "Could not create place"),
        variant: "destructive",
      });
    } finally {
      setDirSaving(false);
    }
  }

  async function uploadDirectoryLogo(file: File) {
    const body = new FormData();
    body.append("logo", file);
    try {
      const res = await fetch("/api/upload/business-logo", {
        method: "POST",
        body,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      if (data.url) {
        setDirForm(prev => (prev ? { ...prev, imageUrl: data.url } : prev));
        toast({ title: "Logo uploaded", description: "Preview updated — save to attach to the place." });
      }
    } catch (err) {
      toast({
        title: "Logo upload failed",
        description: parseApiError(err, "jpg/png/webp, max 8MB"),
        variant: "destructive",
      });
    }
  }

  async function runIg(mode: "url" | "graph" = "url") {
    setBusy(true);
    try {
      const res = await apiRequest("POST", "/api/admin/qsearch/instagram", {
        mode,
        url: igUrl.trim() || null,
        handle: igHandle.trim() || null,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.note || "Could not use Instagram URL");
      const n = data.candidates?.length || 0;
      toast({
        title: n ? "Instagram → Review" : "No event found",
        description: n
          ? `${n} draft${n === 1 ? "" : "s"} — check Review, then approve as HIDDEN.`
          : data.error || data.note || "Try a direct image URL or upload the flyer.",
      });
      if (n) {
        void refetchQueue();
        setTab("queue");
      }
    } catch (err) {
      toast({
        title: mode === "graph" ? "Instagram pull failed" : "Could not use Instagram URL",
        description: parseApiError(
          err,
          mode === "graph"
            ? "Needs Meta Business API tokens."
            : "Paste a post or image URL. If IG blocks the post, upload the flyer instead.",
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

  const isTroubleHealth = useCallback((h: SourceHealth) => {
    return (
      h.lastOk === false ||
      h.consecutiveFails >= 2 ||
      ["dead", "zero_yield", "discovery_needed", "needs_recipe"].includes(h.yieldStatus)
    );
  }, []);

  const isWorksHealth = useCallback((h: SourceHealth) => {
    return h.yieldStatus === "works" || h.lastOk === true;
  }, []);

  const matchVenueFilter = useCallback(
    (h: SourceHealth) => {
      const q = venueFilter.trim().toLowerCase();
      if (!q) return true;
      return (
        h.label.toLowerCase().includes(q) ||
        h.url.toLowerCase().includes(q) ||
        (h.resolvedUrl || "").toLowerCase().includes(q) ||
        (h.recipeUrl || "").toLowerCase().includes(q) ||
        h.yieldStatus.includes(q) ||
        listingNameFromLabel(h.label).toLowerCase().includes(q) ||
        h.sourceId.toLowerCase().includes(q)
      );
    },
    [venueFilter],
  );

  const venues = useMemo(() => {
    // Prefer health list (full scrape sources) merged with coverage
    let health = (dash?.health || []).filter(h => !h.disabled);
    if (statFocus === "directory") health = health.filter(h => h.isDirectory || h.businessId != null);
    else if (statFocus === "works") health = health.filter(isWorksHealth);
    else if (statFocus === "trouble") health = health.filter(isTroubleHealth);
    else if (statFocus === "new-links") health = health.filter(h => h.isDirectory && h.isNew);
    // scan-urls / null → all active sources

    return health.filter(matchVenueFilter).sort((a, b) => a.label.localeCompare(b.label));
  }, [dash?.health, matchVenueFilter, statFocus, isWorksHealth, isTroubleHealth]);

  const removedSources = useMemo(() => {
    return (dash?.health || [])
      .filter(h => h.disabled)
      .filter(matchVenueFilter)
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [dash?.health, matchVenueFilter]);

  const sourcesByArea = useMemo(() => {
    const directoryLinked = venues.filter(h => !isGeneralScrapeSource(h));
    const general = venues.filter(isGeneralScrapeSource).sort((a, b) => a.label.localeCompare(b.label));
    const directoryGroups = buildDirectoryListingGroups(directoryLinked);
    return { directoryGroups, general, directoryCount: directoryLinked.length, generalCount: general.length };
  }, [venues]);

  async function addSource() {
    if (!addLabel.trim() || !addUrl.trim()) {
      toast({ title: "Label and URL required", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const res = await apiRequest("POST", "/api/admin/qsearch/sources", {
        label: addLabel.trim(),
        url: addUrl.trim(),
        tier: addTier,
        format: addFormat,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not add source");
      toast({ title: "Source added", description: data.source?.label || addLabel.trim() });
      setAddLabel("");
      setAddUrl("");
      setShowAddSource(false);
      void refetch();
    } catch (err) {
      toast({
        title: "Add failed",
        description: parseApiError(err, "Could not add source"),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function removeSource(h: SourceHealth) {
    const hard = Boolean(h.isCustom);
    const ok = window.confirm(
      hard
        ? `Permanently delete custom source “${h.label}”?`
        : `Remove “${h.label}” from the scrape list?\n\nIt will stop scanning. You can restore it later from Removed sources.`,
    );
    if (!ok) return;
    setBusy(true);
    try {
      const res = await apiRequest(
        "DELETE",
        `/api/admin/qsearch/sources/${encodeURIComponent(h.sourceId)}`,
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not remove source");
      toast({
        title: hard ? "Source deleted" : "Source removed",
        description: hard ? h.label : `${h.label} — restore anytime from Removed`,
      });
      if (!hard) setShowRemoved(true);
      void refetch();
    } catch (err) {
      toast({
        title: "Remove failed",
        description: parseApiError(err, "Could not remove source"),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  async function restoreSource(h: SourceHealth) {
    setBusy(true);
    try {
      const res = await apiRequest(
        "POST",
        `/api/admin/qsearch/sources/${encodeURIComponent(h.sourceId)}/enable`,
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not restore source");
      toast({ title: "Source restored", description: h.label });
      void refetch();
    } catch (err) {
      toast({
        title: "Restore failed",
        description: parseApiError(err, "Could not restore source"),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  // Hero "directory" focus → Directory listings section; other focuses keep All
  useEffect(() => {
    if (statFocus === "directory" || statFocus === "new-links") setSourceSection("directory");
    else if (statFocus === "scan-urls") setSourceSection("all");
  }, [statFocus]);

  const coverageMissing = useMemo(
    () => (dash?.coverage || []).filter(c => c.resolution === "none"),
    [dash?.coverage],
  );

  /** Hero stat → open the tab that lists that data (and filter Sources when relevant). */
  function openStat(focus: StatFocus) {
    setStatFocus(focus);
    if (focus === "queue") {
      setTab("queue");
      setTimeout(() => {
        document.getElementById("qsearch-panel-queue")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
      return;
    }
    if (focus === "trouble" || focus === "new-links") {
      // Overview panels list these; also open Sources filtered for the same slice
      setTab("overview");
      setTimeout(() => {
        const id =
          focus === "trouble" ? "qsearch-panel-trouble" : "qsearch-panel-new-links";
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
      return;
    }
    // scan-urls | directory | works → Sources table
    setTab("venues");
    setVenueFilter("");
    if (focus === "directory") setSourceSection("directory");
    else if (focus === "scan-urls") setSourceSection("all");
    setTimeout(() => {
      const id =
        focus === "directory" ? "qsearch-sources-directory" : "qsearch-panel-sources";
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  const statFocusLabel =
    statFocus === "scan-urls"
      ? "All scan URLs"
      : statFocus === "directory"
        ? "Directory places (auto-linked sources)"
        : statFocus === "works"
          ? "Yield works"
          : statFocus === "trouble"
            ? "Trouble / failing sources"
            : statFocus === "new-links"
              ? "New directory auto-links"
              : statFocus === "queue"
                ? "Review queue"
                : null;

  return (
    <div className="qsearch" data-testid="qsearch-dashboard">
      <header className="qsearch__hero">
        <p className="qsearch__kicker">Queer event intelligence</p>
        <h1 className="qsearch__title">QSearch</h1>
        <p className="qsearch__lede">
          <strong>Scan now</strong> pulls calendars into the Review queue. Use{" "}
          <strong>Add by hand</strong> only for a single flyer image or Instagram post that Scan
          missed. Review stages as <strong>HIDDEN</strong>.{" "}
          <strong>Trusted</strong> Sync also lands in Review first.
        </p>

        <div className="qsearch__stats" role="navigation" aria-label="QSearch stats shortcuts">
          <button
            type="button"
            className={`qsearch__stat${statFocus === "scan-urls" ? " is-active" : ""}`}
            onClick={() => openStat("scan-urls")}
            title="Open Sources — all scan URLs"
            data-testid="qsearch-stat-urls"
          >
            <div className="qsearch__stat-val is-cyan">{stats?.urlCount ?? "—"}</div>
            <div className="qsearch__stat-label">Scan URLs</div>
          </button>
          <button
            type="button"
            className={`qsearch__stat${statFocus === "directory" ? " is-active" : ""}`}
            onClick={() => openStat("directory")}
            title="Open Sources — directory places with websites"
            data-testid="qsearch-stat-directory"
          >
            <div className="qsearch__stat-val">{stats?.directoryPlaces ?? "—"}</div>
            <div className="qsearch__stat-label">Directory places</div>
          </button>
          <button
            type="button"
            className={`qsearch__stat${statFocus === "works" ? " is-active" : ""}`}
            onClick={() => openStat("works")}
            title="Open Sources — yield works"
            data-testid="qsearch-stat-works"
          >
            <div className="qsearch__stat-val">{stats?.healthyCount ?? "—"}</div>
            <div className="qsearch__stat-label">Yield works</div>
          </button>
          <button
            type="button"
            className={`qsearch__stat${statFocus === "trouble" ? " is-active" : ""}`}
            onClick={() => openStat("trouble")}
            title="Open Health — sources having trouble"
            data-testid="qsearch-stat-trouble"
          >
            <div className={`qsearch__stat-val ${(stats?.failingCount || 0) > 0 ? "is-warn" : ""}`}>
              {stats?.failingCount ?? "—"}
            </div>
            <div className="qsearch__stat-label">Trouble</div>
          </button>
          <button
            type="button"
            className={`qsearch__stat${statFocus === "queue" ? " is-active" : ""}`}
            onClick={() => openStat("queue")}
            title="Open Review queue"
            data-testid="qsearch-stat-queue"
          >
            <div className={`qsearch__stat-val ${(stats?.pendingReview || 0) > 0 ? "is-warn" : "is-cyan"}`}>
              {stats?.pendingReview ?? queueCandidates.length}
            </div>
            <div className="qsearch__stat-label">Review queue</div>
          </button>
          <button
            type="button"
            className={`qsearch__stat${statFocus === "new-links" ? " is-active" : ""}`}
            onClick={() => openStat("new-links")}
            title="Open Health — new directory auto-links"
            data-testid="qsearch-stat-new"
          >
            <div className={`qsearch__stat-val ${(stats?.newDirectoryCount || 0) > 0 ? "is-warn" : ""}`}>
              {stats?.newDirectoryCount ?? "—"}
            </div>
            <div className="qsearch__stat-label">New auto-links</div>
          </button>
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
          <button
            type="button"
            className="qsearch__scan-btn is-ghost"
            disabled={busy || scanning}
            title="Drop pending review rows from the most recent scan (bar-crawl noise, etc.)"
            onClick={() => void clearLastScan("last")}
            data-testid="qsearch-clear-last-scan"
          >
            Clear last scan
          </button>
          <button
            type="button"
            className="qsearch__scan-btn is-ghost"
            disabled={busy || scanning}
            title="Empty the entire Review queue"
            onClick={() => void clearLastScan("all")}
            data-testid="qsearch-clear-queue"
          >
            Clear review queue
          </button>
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
            ["trusted", "Trusted"],
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
            onClick={() => {
              setTab(id);
              // Manual tab pick clears stat filter except queue/sources still useful with focus
              if (id === "assist" || id === "trusted") setStatFocus(null);
              if (id === "overview" && statFocus !== "trouble" && statFocus !== "new-links") {
                setStatFocus(null);
              }
              if (id === "venues" && (statFocus === "queue" || statFocus === "trouble" || statFocus === "new-links")) {
                setStatFocus("scan-urls");
              }
              if (id === "queue") setStatFocus("queue");
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "trusted" && (
        <QSearchTrusted
          onSynced={() => {
            void queryClient.invalidateQueries({ queryKey: ["/api/admin/qsearch/dashboard"] });
            onCommitted?.();
          }}
        />
      )}

      {tab === "overview" && (
        <div>
          {statFocus === "trouble" && (
            <div className="qsearch__focus-banner">
              Showing <strong>Trouble</strong> sources
              <button type="button" className="qsearch__focus-clear" onClick={() => setStatFocus(null)}>
                Clear
              </button>
              <button
                type="button"
                className="qsearch__focus-clear"
                onClick={() => {
                  setStatFocus("trouble");
                  setTab("venues");
                }}
              >
                Open in Sources →
              </button>
            </div>
          )}
          {statFocus === "new-links" && (
            <div className="qsearch__focus-banner">
              Showing <strong>New auto-links</strong>
              <button type="button" className="qsearch__focus-clear" onClick={() => setStatFocus(null)}>
                Clear
              </button>
            </div>
          )}

          {(dash?.failing?.length || 0) > 0 || statFocus === "trouble" ? (
            <div
              className={`qsearch__panel${statFocus === "trouble" ? " is-focused" : ""}`}
              id="qsearch-panel-trouble"
            >
              <h2 className="qsearch__panel-title">
                Venues having trouble ({dash?.failing?.length ?? 0})
              </h2>
              {(dash?.failing?.length || 0) === 0 ? (
                <p style={{ fontSize: 13, color: "var(--qs-muted)", margin: 0 }}>No troubled sources right now.</p>
              ) : (
                <ul className="qsearch__fail-list">
                  {dash!.failing.slice(0, 50).map(h => (
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
              )}
            </div>
          ) : null}

          {(dash?.newFromDirectory?.length || 0) > 0 || statFocus === "new-links" ? (
            <div
              className={`qsearch__panel${statFocus === "new-links" ? " is-focused" : ""}`}
              id="qsearch-panel-new-links"
            >
              <h2 className="qsearch__panel-title">
                New directory auto-links ({dash?.newFromDirectory?.length ?? 0})
              </h2>
              {(dash?.newFromDirectory?.length || 0) === 0 ? (
                <p style={{ fontSize: 13, color: "var(--qs-muted)", margin: 0 }}>No new auto-links.</p>
              ) : (
                <>
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
                </>
              )}
            </div>
          ) : null}

          {coverageMissing.length > 0 && (
            <div className="qsearch__panel" id="qsearch-panel-directory-missing">
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
        <div id="qsearch-panel-sources">
          {statFocusLabel &&
            (statFocus === "scan-urls" ||
              statFocus === "directory" ||
              statFocus === "works" ||
              statFocus === "trouble" ||
              statFocus === "new-links") && (
              <div className="qsearch__focus-banner">
                Showing <strong>{statFocusLabel}</strong> · {venues.length} source
                {venues.length === 1 ? "" : "s"}
                <button
                  type="button"
                  className="qsearch__focus-clear"
                  onClick={() => {
                    setStatFocus(null);
                    setVenueFilter("");
                    setSourceSection("all");
                  }}
                >
                  Show all
                </button>
              </div>
            )}
          <div className="qsearch__toolbar">
            <input
              className="qsearch__filter"
              type="search"
              placeholder="Filter sources…"
              value={venueFilter}
              onChange={e => {
                setVenueFilter(e.target.value);
                if (e.target.value) setStatFocus(null);
              }}
            />
            <div className="qsearch__section-chips" role="group" aria-label="Source area">
              {(
                [
                  ["all", `All (${venues.length})`],
                  ["directory", `Directory (${sourcesByArea.directoryCount})`],
                  ["general", `General scrape (${sourcesByArea.generalCount})`],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`qsearch__section-chip${sourceSection === id ? " is-active" : ""}`}
                  onClick={() => setSourceSection(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="is-primary"
              onClick={() => setShowAddSource(v => !v)}
            >
              {showAddSource ? "Cancel add" : "Add source"}
            </button>
            {removedSources.length > 0 && (
              <button type="button" onClick={() => setShowRemoved(v => !v)}>
                {showRemoved ? "Hide removed" : `Removed (${removedSources.length})`}
              </button>
            )}
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

          {showAddSource && (
            <div className="qsearch__panel qsearch__add-source">
              <h2 className="qsearch__panel-title">Add scrape source</h2>
              <p className="qsearch__section-hint">
                Paste any calendar / events URL. Custom sources persist and are included in Scan now.
                Use Directory area for venue-specific recipes; General for city-wide catch-alls.
              </p>
              <div className="qsearch__add-source-grid">
                <label className="qsearch__field">
                  <span>Label</span>
                  <input
                    className="qsearch__filter"
                    value={addLabel}
                    onChange={e => setAddLabel(e.target.value)}
                    placeholder="e.g. New venue calendar"
                  />
                </label>
                <label className="qsearch__field qsearch__field--wide">
                  <span>URL</span>
                  <input
                    className="qsearch__filter"
                    style={{ maxWidth: "100%" }}
                    value={addUrl}
                    onChange={e => setAddUrl(e.target.value)}
                    placeholder="https://…"
                  />
                </label>
                <label className="qsearch__field">
                  <span>Tier</span>
                  <select
                    className="qsearch__filter"
                    value={addTier}
                    onChange={e => setAddTier(e.target.value)}
                  >
                    <option value="custom">Custom</option>
                    <option value="1">Tier 1 · venue</option>
                    <option value="2">Tier 2 · music</option>
                    <option value="3">Tier 3 · community</option>
                    <option value="eventbrite">Eventbrite</option>
                    <option value="partiful">Partiful</option>
                    <option value="agg">Aggregator</option>
                  </select>
                </label>
                <label className="qsearch__field">
                  <span>Parser hint</span>
                  <select
                    className="qsearch__filter"
                    value={addFormat}
                    onChange={e => setAddFormat(e.target.value)}
                  >
                    <option value="html">HTML</option>
                    <option value="ics">ICS</option>
                    <option value="jsonld">JSON-LD</option>
                    <option value="tribe">Tribe</option>
                    <option value="squarespace">Squarespace</option>
                    <option value="wix">Wix</option>
                    <option value="eventbrite">Eventbrite</option>
                    <option value="partiful">Partiful</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </label>
                <div className="qsearch__add-source-actions">
                  <button type="button" className="is-primary" disabled={busy} onClick={() => void addSource()}>
                    {busy ? "Saving…" : "Save source"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <p className="qsearch__sources-lede">
            <strong>Directory listings</strong> group every scrape URL under a place or group in the
            directory (auto website + curated recipes).{" "}
            <strong>General scrape</strong> is city-wide catch-alls and aggregators not tied to one
            listing (Eventbrite city, Partiful, dragpdx, EverOut, etc.). Use <strong>Add source</strong>{" "}
            for a new URL; <strong>Remove</strong> drops it from scans (custom = permanent delete).
          </p>

          {(sourceSection === "all" || sourceSection === "directory") && (
            <div className="qsearch__panel qsearch__sources-section" id="qsearch-sources-directory">
              <h2 className="qsearch__panel-title">
                Directory listings
                <span className="qsearch__panel-count">
                  {sourcesByArea.directoryGroups.length} listing
                  {sourcesByArea.directoryGroups.length === 1 ? "" : "s"} ·{" "}
                  {sourcesByArea.directoryCount} source
                  {sourcesByArea.directoryCount === 1 ? "" : "s"}
                </span>
              </h2>
              {!sourcesByArea.directoryGroups.length ? (
                <p className="qsearch__empty">No directory-linked sources match this filter.</p>
              ) : (
                <div className="qsearch__listing-groups">
                  {sourcesByArea.directoryGroups.map(group => (
                    <details key={group.key} className="qsearch__listing" open={group.sources.length <= 3 || !!venueFilter}>
                      <summary className="qsearch__listing-summary">
                        <span className="qsearch__listing-name">{group.name}</span>
                        <span className="qsearch__listing-meta">
                          {group.hasDirectorySource ? (
                            <span className="qsearch__badge is-ok">directory</span>
                          ) : (
                            <span className="qsearch__badge is-month">curated only</span>
                          )}
                          {group.businessId != null && (
                            <span className="qsearch__badge">#{group.businessId}</span>
                          )}
                          <span className="qsearch__listing-count">
                            {group.sources.length} source{group.sources.length === 1 ? "" : "s"}
                          </span>
                        </span>
                      </summary>
                      <div className="qsearch__listing-body" style={{ overflowX: "auto" }}>
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
                            {group.sources.map(h => (
                              <SourceRow
                                key={h.sourceId}
                                h={h}
                                recipeEdits={recipeEdits}
                                setRecipeEdits={setRecipeEdits}
                                saveRecipe={saveRecipe}
                                busy={busy}
                                onDelete={removeSource}
                                onClearRecipe={() => {
                                  setRecipeEdits(prev => ({ ...prev, [h.sourceId]: "" }));
                                  void apiRequest(
                                    "POST",
                                    `/api/admin/qsearch/sources/${encodeURIComponent(h.sourceId)}/recipe`,
                                    { recipeUrl: null },
                                  ).then(() => refetch());
                                }}
                              />
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </div>
          )}

          {(sourceSection === "all" || sourceSection === "general") && (
            <div className="qsearch__panel qsearch__sources-section" id="qsearch-sources-general">
              <h2 className="qsearch__panel-title">
                General scrape
                <span className="qsearch__panel-count">
                  {sourcesByArea.generalCount} source
                  {sourcesByArea.generalCount === 1 ? "" : "s"} · not tied to a directory listing
                </span>
              </h2>
              <p className="qsearch__section-hint">
                Eventbrite city searches, Partiful drops, and aggregators. High noise — review carefully
                before commit.
              </p>
              {!sourcesByArea.general.length ? (
                <p className="qsearch__empty">No general-scrape sources match this filter.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
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
                      {sourcesByArea.general.map(h => (
                        <SourceRow
                          key={h.sourceId}
                          h={h}
                          recipeEdits={recipeEdits}
                          setRecipeEdits={setRecipeEdits}
                          saveRecipe={saveRecipe}
                          busy={busy}
                          onDelete={removeSource}
                          onClearRecipe={() => {
                            setRecipeEdits(prev => ({ ...prev, [h.sourceId]: "" }));
                            void apiRequest(
                              "POST",
                              `/api/admin/qsearch/sources/${encodeURIComponent(h.sourceId)}/recipe`,
                              { recipeUrl: null },
                            ).then(() => refetch());
                          }}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {showRemoved && removedSources.length > 0 && (
            <div className="qsearch__panel qsearch__sources-section" id="qsearch-sources-removed">
              <h2 className="qsearch__panel-title">
                Removed sources
                <span className="qsearch__panel-count">
                  {removedSources.length} · not scanned until restored
                </span>
              </h2>
              <p className="qsearch__section-hint">
                Registry and directory sources soft-removed so they do not reappear on sync. Custom
                sources you deleted are gone permanently.
              </p>
              <div style={{ overflowX: "auto" }}>
                <table className="qsearch__venue-table">
                  <thead>
                    <tr>
                      <th>Source</th>
                      <th>Status</th>
                      <th>URL</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {removedSources.map(h => (
                      <SourceRow
                        key={h.sourceId}
                        h={h}
                        recipeEdits={recipeEdits}
                        setRecipeEdits={setRecipeEdits}
                        saveRecipe={saveRecipe}
                        busy={busy}
                        onDelete={removeSource}
                        onRestore={restoreSource}
                        onClearRecipe={() => undefined}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "queue" && (
        <div id="qsearch-panel-queue">
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
                  disabled={busy || scanning}
                  onClick={() => void clearLastScan("last")}
                  title="Discard pending candidates from the last scan"
                >
                  Clear last scan
                </button>
                <button
                  type="button"
                  disabled={busy || scanning}
                  onClick={() => void clearLastScan("all")}
                  title="Empty the entire review queue"
                >
                  Clear queue
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
                const venueNameKey = String(c.draft.venueName || "")
                  .trim()
                  .toLowerCase();
                const canAddToDirectory =
                  !venueBrand &&
                  !isWeakVenueName(c.draft.venueName) &&
                  !dirAddedNames[venueNameKey];
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
                        {canAddToDirectory && (
                          <button
                            type="button"
                            className="qsearch__add-dir-btn"
                            data-testid="qsearch-add-directory"
                            title="This venue is not in the directory yet"
                            onClick={e => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDirForm(buildDirectoryFormFromCandidate(c));
                            }}
                          >
                            Add to directory
                          </button>
                        )}
                        {dirAddedNames[venueNameKey] && !venueBrand && (
                          <span className="qsearch__cand-slot-name" style={{ color: "var(--qs-lime)" }}>
                            Added ✓
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
                      {(() => {
                        const eventPage = humanEventPageUrl(c);
                        const tickets = ticketLinkUrl(c, eventPage);
                        const feed =
                          c.sourceUrl && isFeedOrApiUrl(c.sourceUrl)
                            ? c.sourceUrl
                            : c.draft.sourceUrl && isFeedOrApiUrl(c.draft.sourceUrl)
                              ? c.draft.sourceUrl
                              : null;
                        return (
                          <p className="qsearch__cand-meta qsearch__cand-links">
                            {eventPage ? (
                              <a
                                className="qsearch__link-event"
                                href={eventPage}
                                target="_blank"
                                rel="noreferrer"
                                onClick={e => e.stopPropagation()}
                                title={eventPage}
                              >
                                Open event page
                              </a>
                            ) : (
                              <span className="qsearch__link-missing" title="Feed had no per-event URL">
                                No event page URL
                              </span>
                            )}
                            {tickets ? (
                              <>
                                {" · "}
                                <a
                                  href={tickets}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={e => e.stopPropagation()}
                                >
                                  Tickets
                                </a>
                              </>
                            ) : null}
                            {" · "}
                            <span title={feed || c.sourceUrl || undefined}>
                              via {c.sourceLabel || "source"}
                            </span>
                            {feed ? (
                              <>
                                {" · "}
                                <a
                                  href={feed}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  className="qsearch__link-feed"
                                >
                                  Feed
                                </a>
                              </>
                            ) : null}
                            {c.draft.parseSource ? ` · ${c.draft.parseSource}` : ""}
                            {c.draft.confidence != null
                              ? ` · conf ${(c.draft.confidence * 100).toFixed(0)}%`
                              : ""}
                          </p>
                        );
                      })()}
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
        </div>
      )}

      <Dialog open={!!dirForm} onOpenChange={open => !open && setDirForm(null)}>
        <DialogContent className="qsearch__dir-dialog max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add place to directory</DialogTitle>
            <DialogDescription>
              Venue from this scan is not in the directory yet. Review the fields (and logo), then
              save. Goes live immediately as an admin listing.
            </DialogDescription>
          </DialogHeader>
          {dirForm && (
            <div className="qsearch__dir-form">
              <div className="qsearch__dir-logo-row">
                <div className="qsearch__dir-logo-preview">
                  {dirForm.imageUrl ? (
                    <img src={dirForm.imageUrl} alt="" />
                  ) : (
                    <span>No logo</span>
                  )}
                </div>
                <div className="qsearch__dir-logo-fields">
                  <label className="qsearch__field">
                    <span>Logo / image URL</span>
                    <input
                      className="qsearch__filter"
                      value={dirForm.imageUrl}
                      onChange={e => setDirForm({ ...dirForm, imageUrl: e.target.value })}
                      placeholder="https://… or /uploads/…"
                    />
                  </label>
                  <label className="qsearch__field">
                    <span>Upload logo file</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={e => {
                        const f = e.target.files?.[0];
                        if (f) void uploadDirectoryLogo(f);
                      }}
                    />
                  </label>
                  <p className="qsearch__assist-note" style={{ margin: 0 }}>
                    Flyer is prefilled when present — replace with a square neon logo when you have
                    one.
                  </p>
                </div>
              </div>

              <label className="qsearch__field qsearch__field--wide">
                <span>Name *</span>
                <input
                  className="qsearch__filter"
                  value={dirForm.name}
                  onChange={e => setDirForm({ ...dirForm, name: e.target.value })}
                  required
                />
              </label>

              <div className="qsearch__assist-fields">
                <label className="qsearch__field">
                  <span>Type *</span>
                  <select
                    className="qsearch__filter"
                    value={dirForm.type}
                    onChange={e =>
                      setDirForm({
                        ...dirForm,
                        type: e.target.value as DirectoryFormState["type"],
                      })
                    }
                  >
                    {DIRECTORY_TYPES.map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="qsearch__field">
                  <span>Neighborhood</span>
                  <input
                    className="qsearch__filter"
                    value={dirForm.neighborhood}
                    onChange={e => setDirForm({ ...dirForm, neighborhood: e.target.value })}
                    placeholder="e.g. Old Town"
                  />
                </label>
              </div>

              <label className="qsearch__field qsearch__field--wide">
                <span>Description * (directory card blurb)</span>
                <textarea
                  className="qsearch__filter qsearch__textarea"
                  value={dirForm.description}
                  onChange={e => setDirForm({ ...dirForm, description: e.target.value })}
                  rows={4}
                />
              </label>

              <label className="qsearch__field qsearch__field--wide">
                <span>Address</span>
                <input
                  className="qsearch__filter"
                  value={dirForm.address}
                  onChange={e => setDirForm({ ...dirForm, address: e.target.value })}
                />
              </label>

              <div className="qsearch__assist-fields">
                <label className="qsearch__field">
                  <span>Website</span>
                  <input
                    className="qsearch__filter"
                    value={dirForm.website}
                    onChange={e => setDirForm({ ...dirForm, website: e.target.value })}
                    placeholder="https://"
                  />
                </label>
                <label className="qsearch__field">
                  <span>Instagram</span>
                  <input
                    className="qsearch__filter"
                    value={dirForm.instagram}
                    onChange={e => setDirForm({ ...dirForm, instagram: e.target.value })}
                    placeholder="@handle"
                  />
                </label>
                <label className="qsearch__field">
                  <span>Phone</span>
                  <input
                    className="qsearch__filter"
                    value={dirForm.phone}
                    onChange={e => setDirForm({ ...dirForm, phone: e.target.value })}
                  />
                </label>
                <label className="qsearch__field">
                  <span>Hours</span>
                  <input
                    className="qsearch__filter"
                    value={dirForm.hours}
                    onChange={e => setDirForm({ ...dirForm, hours: e.target.value })}
                    placeholder="e.g. Daily 4pm–2am"
                  />
                </label>
              </div>

              <div className="qsearch__dir-checks">
                <label>
                  <input
                    type="checkbox"
                    checked={dirForm.queerFriendly}
                    onChange={e => setDirForm({ ...dirForm, queerFriendly: e.target.checked })}
                  />{" "}
                  Queer-friendly
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={dirForm.queerOwned}
                    onChange={e => setDirForm({ ...dirForm, queerOwned: e.target.checked })}
                  />{" "}
                  Queer-owned
                </label>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              className="qsearch__scan-btn is-ghost"
              onClick={() => setDirForm(null)}
              disabled={dirSaving}
            >
              Cancel
            </button>
            <button
              type="button"
              className="qsearch__scan-btn"
              style={{ borderColor: "var(--qs-lime)", color: "var(--qs-lime)" }}
              disabled={dirSaving}
              onClick={() => void saveDirectoryPlace()}
              data-testid="qsearch-dir-save"
            >
              {dirSaving ? "Saving…" : "Save to directory"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {tab === "assist" && (
        <div className="qsearch__assist">
          <div className="qsearch__panel qsearch__assist-intro">
            <h2 className="qsearch__panel-title">When to use this tab</h2>
            <ol className="qsearch__assist-steps">
              <li>
                <strong>Scan now</strong> — calendars into Review.
              </li>
              <li>
                <strong>Read a flyer</strong> — paste image URL <em>or upload</em> one/many posters.
                Cloud vision (Grok/OpenAI) reads title/date/venue — not a local mini-model.
              </li>
              <li>
                <strong>Instagram</strong> — paste the post URL (or direct image URL) only.
              </li>
            </ol>
            <p className="qsearch__assist-note">
              Drafts land in <strong>Review</strong> as HIDDEN only. Needs{" "}
              <code>XAI_API_KEY</code> or <code>OPENAI_API_KEY</code> on the server to read flyers.
            </p>
          </div>

          <div className="qsearch__panel">
            <h2 className="qsearch__panel-title">1 · Read a flyer</h2>
            <p className="qsearch__assist-blurb">
              Cloud vision reads the poster (title, date, venue). Without an API key this step cannot
              OCR flyers — there is no custom on-device model.
            </p>
            <div className="qsearch__assist-fields">
              <label className="qsearch__field qsearch__field--wide">
                <span>Flyer image URL (optional if uploading)</span>
                <input
                  className="qsearch__filter"
                  type="url"
                  placeholder="https://…/flyer.jpg"
                  value={visionUrl}
                  onChange={e => setVisionUrl(e.target.value)}
                  data-testid="qsearch-flyer-url"
                />
              </label>
              <label className="qsearch__field">
                <span>Venue hint (optional)</span>
                <input
                  className="qsearch__filter"
                  placeholder="e.g. Darcelle XV Showplace"
                  value={visionVenue}
                  onChange={e => setVisionVenue(e.target.value)}
                  data-testid="qsearch-flyer-venue"
                />
              </label>
              <label className="qsearch__field qsearch__field--wide">
                <span>Upload flyer(s) — single or batch (max 12)</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  data-testid="qsearch-flyer-upload"
                  onChange={e => {
                    if (e.target.files?.length) void runVisionUpload(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            <div className="qsearch__toolbar">
              <button
                type="button"
                className="is-primary"
                disabled={busy || !visionUrl.trim()}
                onClick={() => void runVision()}
                data-testid="qsearch-read-flyer"
              >
                {busy ? "Reading…" : "Read URL → Review"}
              </button>
            </div>
          </div>

          <div className="qsearch__panel">
            <h2 className="qsearch__panel-title">2 · Instagram URL</h2>
            <p className="qsearch__assist-blurb">
              Paste the <strong>post link</strong> or a <strong>direct image address</strong>. We try
              to pull the flyer image and run vision — we do <em>not</em> log into Instagram. If the
              post is blocked, right‑click the image → copy address, or upload under Read a flyer.
            </p>
            <div className="qsearch__assist-fields">
              <label className="qsearch__field qsearch__field--wide">
                <span>Instagram post or image URL</span>
                <input
                  className="qsearch__filter"
                  type="url"
                  placeholder="https://www.instagram.com/p/…  or  https://…cdninstagram…/flyer.jpg"
                  value={igUrl}
                  onChange={e => setIgUrl(e.target.value)}
                  data-testid="qsearch-ig-url"
                />
              </label>
            </div>
            <div className="qsearch__toolbar">
              <button
                type="button"
                className="is-primary"
                disabled={busy || !igUrl.trim()}
                onClick={() => void runIg("url")}
                data-testid="qsearch-ig-url-btn"
              >
                {busy ? "Working…" : "Add from URL → Review"}
              </button>
            </div>

            <details className="qsearch__assist-advanced">
              <summary>Advanced: Meta Business Graph pull by @handle</summary>
              <p className="qsearch__assist-note">
                Only with server Meta tokens. Most people should use the URL field above.
              </p>
              <div className="qsearch__assist-fields">
                <label className="qsearch__field">
                  <span>@handle</span>
                  <input
                    className="qsearch__filter"
                    placeholder="@venuehandle"
                    value={igHandle}
                    onChange={e => setIgHandle(e.target.value)}
                  />
                </label>
              </div>
              <div className="qsearch__toolbar">
                <button
                  type="button"
                  disabled={busy || !igHandle.trim()}
                  onClick={() => void runIg("graph")}
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
