import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useLocation } from "wouter";
import { Search, X } from "lucide-react";

type SearchEventHit = {
  id: string | number;
  title: string;
  subtitle: string;
  href: string;
};

type SearchPlaceHit = {
  id: string | number;
  name: string;
  subtitle: string;
  href: string;
};

type SearchResponse = {
  q: string;
  events: SearchEventHit[];
  places: SearchPlaceHit[];
  communities: Array<{ id: string; name: string; subtitle: string; href: string }>;
};

type FlatResult =
  | { kind: "event"; key: string; label: string; subtitle: string; href: string }
  | { kind: "place"; key: string; label: string; subtitle: string; href: string }
  | { kind: "community"; key: string; label: string; subtitle: string; href: string };

type SiteSearchProps = {
  open: boolean;
  onClose: () => void;
};

function useDebouncedValue<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

/**
 * Global site search: EVENTZ + directory places + Communities.
 * Open via prop, Cmd/Ctrl+K from Nav, or the header search button.
 */
export default function SiteSearch({ open, onClose }: SiteSearchProps) {
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [query, setQuery] = useState("");
  const debouncedQ = useDebouncedValue(query.trim(), 200);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setData(null);
    setActiveIndex(0);
    const t = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    if (debouncedQ.length < 2) {
      setData(null);
      setLoading(false);
      abortRef.current?.abort();
      return;
    }
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    fetch(`/api/v1/search?q=${encodeURIComponent(debouncedQ)}&types=event,place,community&limit=24`, {
      credentials: "include",
      signal: ac.signal,
    })
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((payload: any) => {
        if (ac.signal.aborted) return;
        const objects = Array.isArray(payload?.data) ? payload.data : [];
        const json: SearchResponse = {
          q: debouncedQ,
          events: objects.filter((item: any) => item.type === "event").map((item: any) => ({ id: item.id, title: item.name, subtitle: [item.venueName, item.neighborhood].filter(Boolean).join(" · "), href: item.url })),
          places: objects.filter((item: any) => item.type === "place").map((item: any) => ({ id: item.id, name: item.name, subtitle: [item.neighborhood, item.placeType].filter(Boolean).join(" · "), href: item.url })),
          communities: objects.filter((item: any) => item.type === "community").map((item: any) => ({ id: item.id, name: item.name, subtitle: [item.neighborhood, `${item.memberCount} members`].filter(Boolean).join(" · "), href: item.url })),
        };
        setData(json);
        setActiveIndex(0);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setData({ q: debouncedQ, events: [], places: [], communities: [] });
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });
    return () => ac.abort();
  }, [debouncedQ, open]);

  const flat: FlatResult[] = useMemo(() => {
    if (!data) return [];
    const out: FlatResult[] = [];
    for (const e of data.events || []) {
      out.push({
        kind: "event",
        key: `event-${e.id}`,
        label: e.title,
        subtitle: e.subtitle,
        href: e.href,
      });
    }
    for (const p of data.places || []) {
      out.push({
        kind: "place",
        key: `place-${p.id}`,
        label: p.name,
        subtitle: p.subtitle,
        href: p.href,
      });
    }
    for (const community of data.communities || []) {
      out.push({ kind: "community", key: `community-${community.id}`, label: community.name, subtitle: community.subtitle, href: community.href });
    }
    return out;
  }, [data]);

  const go = useCallback(
    (href: string) => {
      onClose();
      setLocation(href);
    },
    [onClose, setLocation],
  );

  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (flat.length ? (i + 1) % flat.length : 0));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (flat.length ? (i - 1 + flat.length) % flat.length : 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const hit = flat[activeIndex];
      if (hit) go(hit.href);
    }
  };

  if (!open) return null;

  const showEmpty = debouncedQ.length >= 2 && !loading && flat.length === 0;
  const events = data?.events || [];
  const places = data?.places || [];
  const communities = data?.communities || [];

  return (
    <div className="site-search" role="presentation">
      <div className="site-search__backdrop" onClick={onClose} data-testid="site-search-backdrop" />
      <div
        className="site-search__panel pdx-glass"
        role="dialog"
        aria-modal="true"
        aria-label="Search Zaylist"
        data-testid="site-search-panel"
      >
        <div className="site-search__head">
          <Search size={18} className="site-search__icon" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            className="site-search__input"
            placeholder="Search EVENTZ, Places, and Communities…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            aria-controls={listId}
            aria-autocomplete="list"
            data-testid="site-search-input"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="site-search__kbd" aria-hidden="true">
            esc
          </kbd>
          <button
            type="button"
            className="site-search__close"
            onClick={onClose}
            aria-label="Close search"
          >
            <X size={18} />
          </button>
        </div>

        <div id={listId} className="site-search__body" role="listbox">
          {debouncedQ.length < 2 && (
            <p className="site-search__hint">Type at least 2 characters. Search EVENTZ, Places, and Communities.</p>
          )}
          {loading && <p className="site-search__hint">Searching…</p>}
          {showEmpty && <p className="site-search__hint">No matches for “{debouncedQ}”.</p>}

          {events.length > 0 && (
            <section className="site-search__group">
              <h3 className="site-search__group-title">EVENTZ</h3>
              <ul className="site-search__list">
                {events.map((e) => {
                  const idx = flat.findIndex((f) => f.key === `event-${e.id}`);
                  const active = idx === activeIndex;
                  return (
                    <li key={e.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={active}
                        className={`site-search__item${active ? " is-active" : ""}`}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => go(e.href)}
                        data-testid={`site-search-event-${e.id}`}
                      >
                        <span className="site-search__item-label">{e.title}</span>
                        {e.subtitle && (
                          <span className="site-search__item-sub">{e.subtitle}</span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {places.length > 0 && (
            <section className="site-search__group">
              <h3 className="site-search__group-title">Places</h3>
              <ul className="site-search__list">
                {places.map((p) => {
                  const idx = flat.findIndex((f) => f.key === `place-${p.id}`);
                  const active = idx === activeIndex;
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={active}
                        className={`site-search__item${active ? " is-active" : ""}`}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => go(p.href)}
                        data-testid={`site-search-place-${p.id}`}
                      >
                        <span className="site-search__item-label">{p.name}</span>
                        {p.subtitle && (
                          <span className="site-search__item-sub">{p.subtitle}</span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
          {communities.length > 0 && (
            <section className="site-search__group">
              <h3 className="site-search__group-title">Communities</h3>
              <ul className="site-search__list">
                {communities.map((community) => {
                  const idx = flat.findIndex((item) => item.key === `community-${community.id}`);
                  const active = idx === activeIndex;
                  return <li key={community.id}><button type="button" role="option" aria-selected={active} className={`site-search__item${active ? " is-active" : ""}`} onMouseEnter={() => setActiveIndex(idx)} onClick={() => go(community.href)}><span className="site-search__item-label">{community.name}</span>{community.subtitle ? <span className="site-search__item-sub">{community.subtitle}</span> : null}</button></li>;
                })}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

/** Global Cmd/Ctrl+K listener; call from Nav (or root). */
export function useSiteSearchHotkey(onOpen: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key !== "k" && e.key !== "K") return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;
      e.preventDefault();
      onOpen();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onOpen]);
}
