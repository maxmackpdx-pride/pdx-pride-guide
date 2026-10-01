import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useLocation } from "wouter";
import { ArrowUpRight, Search, X } from "lucide-react";
import { RESOURCE_CATEGORIES, type ResourceOrg } from "@/lib/resourcesData";
import { FOOD_PANTRIES, FOOD_RESOURCE } from "@/lib/foodPantries";
import { PRIMARY_NAV } from "@/lib/siteNav";

type SearchHit = { key: string; label: string; subtitle: string; detail?: string; href: string };
type SearchGroup = { label: string; hits: SearchHit[] };
type PlatformHit = { id: string; type: string; name: string; summary?: string | null; url: string; venueName?: string; neighborhood?: string; placeType?: string; location?: string; category?: string; memberCount?: number };
type SiteSearchProps = { open: boolean; onClose: () => void };

const PLATFORM_TYPES = "event,place,community,listing,gig,guide,profile,organization";
const GROUP_LABELS: Record<string, string> = {
  event: "EVENTZ", place: "PLACEZ", community: "Z/LISTS", listing: "SELLZ", gig: "GIGZ",
  guide: "GUIDES", profile: "PEOPLE", organization: "ORGANIZATIONS",
};
const GROUP_ORDER = ["ReZources", "EVENTZ", "PLACEZ", "Z/LISTS", "SELLZ", "GIGZ", "GUIDES", "PEOPLE", "ORGANIZATIONS", "PAGES"];
const RESOURCE_ROWS = RESOURCE_CATEGORIES.flatMap((category) =>
  (category.id === "safety" ? [...category.orgs, FOOD_RESOURCE] : category.orgs).map((org) => ({ org, category })),
);
const PAGE_LINKS = PRIMARY_NAV.flatMap((entry) => entry.type === "link" ? [{ label: entry.label, href: entry.href }] : entry.items);

function normalized(text: string) {
  return text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
function resourceScore(org: ResourceOrg, categoryName: string, query: string) {
  const needle = normalized(query);
  const fields = [org.name, ...(org.aliases || []), org.desc, org.scope, categoryName,
    ...(org.serviceTags || []), ...(org.programs || []).flatMap((program) => [program.name, program.desc]),
    ...(org.locations || []).flatMap((place) => [place.name, place.address]),
    ...(org === FOOD_RESOURCE ? FOOD_PANTRIES.map((pantry) => pantry.name) : []),
  ].map(normalized);
  if (/^[\d\s()+.\-]+$/.test(query) && query.replace(/\D/g, "").length >= 3) {
    const digits = query.replace(/\D/g, "");
    return fields.some((field) => field.replace(/\D/g, "").includes(digits)) ? 1 : 0;
  }
  if (fields[0].includes(needle)) return 1;
  if (fields.some((field) => field.includes(needle))) return 0.8;
  const words = fields.join(" ").split(/\s+/);
  return needle.split(/\s+/).every((term) => words.some((word) => word.startsWith(term))) ? 0.5 : 0;
}
function resourceHits(query: string): SearchHit[] {
  if (query.length < 2) return [];
  const seen = new Set<string>();
  return RESOURCE_ROWS.flatMap(({ org, category }) => {
    if (seen.has(org.name)) return [];
    seen.add(org.name);
    const score = resourceScore(org, category.name, query);
    return score ? [{ score, org, category }] : [];
  }).sort((a, b) => b.score - a.score || a.org.name.localeCompare(b.org.name)).slice(0, 8).map(({ org, category }) => ({
    key: `resource-${org.name}`, label: org.name,
    subtitle: (org.serviceTags?.length ? org.serviceTags : [category.name]).join(" · "),
    detail: org.scope, href: `/rezources?find=${encodeURIComponent(org.name)}`,
  }));
}
function platformGroups(objects: PlatformHit[]): SearchGroup[] {
  const groups = new Map<string, SearchHit[]>();
  for (const item of objects) {
    const label = GROUP_LABELS[item.type];
    if (!label || !item.url) continue;
    const subtitle = item.type === "event" ? [item.venueName, item.neighborhood].filter(Boolean).join(" · ")
      : item.type === "place" || item.type === "organization" ? [item.neighborhood, item.placeType].filter(Boolean).join(" · ")
      : item.type === "community" ? `${item.memberCount ?? 0} members`
      : item.type === "gig" ? item.location || "" : item.type === "listing" ? item.category || "" : item.summary || "";
    const hits = groups.get(label) || [];
    hits.push({ key: `${item.type}-${item.id}`, label: item.name, subtitle, href: item.url });
    groups.set(label, hits);
  }
  return [...groups].map(([label, hits]) => ({ label, hits }));
}

/** Sitewide search, opened from the nav or with Cmd/Ctrl+K. */
export default function SiteSearch({ open, onClose }: SiteSearchProps) {
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [objects, setObjects] = useState<PlatformHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!open) return;
    setQuery(""); setDebouncedQ(""); setObjects([]); setActiveIndex(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(timer);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => setDebouncedQ(query.trim()), 180);
    return () => window.clearTimeout(timer);
  }, [query, open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  useEffect(() => {
    if (!open || debouncedQ.length < 2) { setObjects([]); setLoading(false); return; }
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/v1/search?q=${encodeURIComponent(debouncedQ)}&types=${PLATFORM_TYPES}&limit=100`, {
      credentials: "include", signal: controller.signal,
    })
      .then((response) => response.ok ? response.json() : { data: [] })
      .then((payload) => { if (!controller.signal.aborted) setObjects(Array.isArray(payload?.data) ? payload.data : []); })
      .catch((error) => { if (error?.name !== "AbortError") setObjects([]); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [debouncedQ, open]);

  const groups = useMemo<SearchGroup[]>(() => {
    if (query.trim().length < 2) return [];
    const resource = resourceHits(query.trim());
    const pages = PAGE_LINKS.filter((page) => normalized(page.label).includes(normalized(query.trim()))).map((page) => ({
      key: `page-${page.href}`, label: page.label, subtitle: "Page", href: page.href,
    }));
    const all = [...platformGroups(objects), ...(resource.length ? [{ label: "ReZources", hits: resource }] : []), ...(pages.length ? [{ label: "PAGES", hits: pages }] : [])];
    return all.sort((a, b) => GROUP_ORDER.indexOf(a.label) - GROUP_ORDER.indexOf(b.label));
  }, [objects, query]);
  const flat = useMemo(() => groups.flatMap((group) => group.hits), [groups]);
  useEffect(() => setActiveIndex(0), [query]);
  const go = useCallback((href: string) => {
    onClose();
    if (href.startsWith("/rezources?find=") && window.location.pathname === "/rezources") {
      window.location.assign(href);
      return;
    }
    setLocation(href);
  }, [onClose, setLocation]);
  const onKeyDown = (event: ReactKeyboardEvent) => {
    if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex((index) => flat.length ? (index + 1) % flat.length : 0); }
    if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((index) => flat.length ? (index - 1 + flat.length) % flat.length : 0); }
    if (event.key === "Enter") { event.preventDefault(); if (flat[activeIndex]) go(flat[activeIndex].href); }
  };
  if (!open) return null;

  return <div className="site-search" role="presentation">
    <div className="site-search__backdrop" onClick={onClose} data-testid="site-search-backdrop" />
    <div className="site-search__panel" role="dialog" aria-modal="true" aria-label="Search Zaylist" data-testid="site-search-panel">
      <div className="site-search__head">
        <Search size={19} className="site-search__icon" aria-hidden="true" />
        <input ref={inputRef} type="search" className="site-search__input" placeholder="Search all of Zaylist…" aria-label="Search all of Zaylist"
          value={query} onChange={(event) => { setQuery(event.target.value); setObjects([]); }} onKeyDown={onKeyDown} aria-controls={listId}
          aria-autocomplete="list" data-testid="site-search-input" autoComplete="off" spellCheck={false} />
        <button type="button" className="site-search__close" onClick={onClose} aria-label="Close search"><X size={20} /></button>
      </div>
      <div id={listId} className="site-search__body" role="listbox" aria-label="Search results">
        {query.trim().length < 2 && <p className="site-search__hint">Search ReZources, EVENTZ, PLACEZ, Boards, people, and pages.</p>}
        {loading && <p className="site-search__hint" role="status">Searching…</p>}
        {query.trim().length >= 2 && !loading && flat.length === 0 && <p className="site-search__hint">No matches for “{query.trim()}”.</p>}
        {groups.map((group) => <section className="site-search__group" key={group.label}>
          <h3 className="site-search__group-title">{group.label}</h3>
          <ul className="site-search__list">{group.hits.map((hit) => {
            const index = flat.findIndex((item) => item.key === hit.key);
            const active = index === activeIndex;
            return <li key={hit.key}><button type="button" role="option" aria-selected={active}
              className={`site-search__item${active ? " is-active" : ""}`} onMouseEnter={() => setActiveIndex(index)} onClick={() => go(hit.href)}>
              <span className="site-search__item-copy"><span className="site-search__item-label">{hit.label}</span>
                {hit.subtitle && <small className="site-search__item-sub">{hit.subtitle}</small>}
                {hit.detail && <small className="site-search__item-detail">{hit.detail}</small>}</span>
              <ArrowUpRight size={16} aria-hidden="true" /></button></li>;
          })}</ul>
        </section>)}
      </div>
      <p className="site-search__footer">↑ ↓ to move · Enter to open · Esc to close</p>
    </div>
  </div>;
}

export function useSiteSearchHotkey(onOpen: () => void) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") return;
      const target = event.target as HTMLElement | null;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) return;
      event.preventDefault(); onOpen();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onOpen]);
}
