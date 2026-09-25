import { ArrowDown } from "lucide-react";
import { ArrowUp } from "lucide-react";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { apiRequest } from "@/lib/queryClient";
import UserAvatar from "@/components/UserAvatar";
import { resolveDirectoryLogo, directoryFallbackLogo } from "@shared/directoryLogos";
import type { ProfileTop8Entry } from "@/pages/profile/types";

type Props = {
  current: ProfileTop8Entry[];
  onClose: () => void;
  onSave: (refs: { k: "u" | "b"; id: number }[]) => void;
};

type Business = { id: number; name: string; type: string; imageUrl?: string | null };

function keyOf(e: ProfileTop8Entry): string {
  return `${e.kind}-${e.id}`;
}

export default function Top8Editor({ current, onClose, onSave }: Props) {
  const [list, setList] = useState<ProfileTop8Entry[]>(current.slice(0, 8));
  const [tab, setTab] = useState<"people" | "venues">("people");
  const [q, setQ] = useState("");
  const [people, setPeople] = useState<ProfileTop8Entry[]>([]);
  const [venues, setVenues] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const debounce = useRef<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { closeRef.current?.focus(); }, []);

  const inList = (e: ProfileTop8Entry) => list.some(x => keyOf(x) === keyOf(e));
  const full = list.length >= 8;

  // Load the directory once for venue search.
  useEffect(() => {
    let cancelled = false;
    apiRequest("GET", "/api/directory")
      .then(r => (r.ok ? r.json() : []))
      .then((rows: Business[]) => { if (!cancelled) setVenues(Array.isArray(rows) ? rows : []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Debounced people search.
  useEffect(() => {
    if (tab !== "people") return;
    if (debounce.current) window.clearTimeout(debounce.current);
    const term = q.trim();
    if (term.length < 2) { setPeople([]); return; }
    setLoading(true);
    debounce.current = window.setTimeout(async () => {
      try {
        const r = await apiRequest("GET", `/api/users/search?q=${encodeURIComponent(term)}`);
        const rows = r.ok ? await r.json() : [];
        setPeople(
          (Array.isArray(rows) ? rows : []).map((u: any) => ({
            kind: "user" as const,
            id: Number(u.id),
            username: u.username,
            displayName: u.displayName || u.username,
            photoUrl: u.photoUrl ?? null,
            avatarChoice: u.avatarChoice != null ? Number(u.avatarChoice) : undefined,
            avatarRing: u.avatarRing ?? null,
          })).filter((u: ProfileTop8Entry & { id: number }) => Number.isInteger(u.id)),
        );
      } catch { setPeople([]); }
      finally { setLoading(false); }
    }, 260);
    return () => { if (debounce.current) window.clearTimeout(debounce.current); };
  }, [q, tab]);

  const venueResults: ProfileTop8Entry[] = (() => {
    const term = q.trim().toLowerCase();
    const rows = term.length < 2
      ? venues.slice(0, 12)
      : venues.filter(b => b.name.toLowerCase().includes(term)).slice(0, 12);
    return rows.map(b => ({
      kind: "place" as const,
      id: b.id,
      name: b.name,
      logoUrl: resolveDirectoryLogo(String(b.name), b.imageUrl || undefined) || directoryFallbackLogo(b.type) || null,
    }));
  })();

  const results = tab === "people" ? people : venueResults;

  const add = (e: ProfileTop8Entry) => {
    if (full || inList(e)) return;
    setList(prev => [...prev, e]);
  };
  const remove = (e: ProfileTop8Entry) => setList(prev => prev.filter(x => keyOf(x) !== keyOf(e)));
  const move = (i: number, dir: -1 | 1) => {
    const moved = list[i];
    setList(prev => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    if (moved) setAnnouncement(`${nameOf(moved)} moved to position ${i + dir + 1} of ${list.length}.`);
  };

  const save = () => onSave(list.map(e => ({ k: e.kind === "user" ? "u" : "b", id: e.id })));

  const tileAvatar = (e: ProfileTop8Entry, size: number) =>
    e.kind === "user" ? (
      <UserAvatar photoUrl={e.photoUrl} avatarChoice={e.avatarChoice} avatarRing={e.avatarRing}
        displayName={e.displayName} username={e.username} size={size} />
    ) : (
      <span className="top8ed__logo" style={{ width: size, height: size }}>
        {e.logoUrl ? <img src={e.logoUrl} alt={e.name} /> : <span>{e.name.slice(0, 1)}</span>}
      </span>
    );
  const nameOf = (e: ProfileTop8Entry) => (e.kind === "user" ? e.displayName : e.name);
  const subOf = (e: ProfileTop8Entry) => (e.kind === "user" ? `@${e.username}` : "Venue");

  return createPortal(
    <>
      <button type="button" className="top8ed__backdrop" onClick={onClose} aria-label="Close Top 8 editor" />
      <div className="top8ed" role="dialog" aria-modal="true" aria-label="Edit Top 8">
        <div className="top8ed__head">
          <span className="display top8ed__title">Edit Top 8</span>
          <span className="top8ed__count">{list.length}/8</span>
          <button ref={closeRef} type="button" className="top8ed__x" onClick={onClose} aria-label="Close"><X size={16} aria-hidden="true" /></button>
        </div>

        {/* Current, ordered */}
        <div className="top8ed__current">
          {list.length === 0 && <p className="top8ed__empty">Search below and tap to add your first pick.</p>}
          {list.map((e, i) => (
            <div className="top8ed__row" key={keyOf(e)}>
              <span className="top8ed__rank display">{i + 1}</span>
              {tileAvatar(e, 34)}
              <span className="top8ed__row-main">
                <span className="top8ed__row-name display">{nameOf(e)}</span>
                <span className="top8ed__row-sub">{subOf(e)}</span>
              </span>
              <button type="button" className="top8ed__mv" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${nameOf(e)} up from position ${i + 1}`}><ArrowUp size={14} aria-hidden="true" /></button>
              <button type="button" className="top8ed__mv" disabled={i === list.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${nameOf(e)} down from position ${i + 1}`}><ArrowDown size={14} aria-hidden="true" /></button>
              <button type="button" className="top8ed__rm" onClick={() => { remove(e); setAnnouncement(`${nameOf(e)} removed from Top 8.`); }} aria-label={`Remove ${nameOf(e)}`}><X size={16} aria-hidden="true" /></button>
            </div>
          ))}
        </div>
        <p className="sr-only" aria-live="polite">{announcement}</p>

        {/* Search */}
        <div className="top8ed__search">
          <div className="top8ed__tabs">
            <button type="button" className={`top8ed__tab${tab === "people" ? " is-on" : ""}`} onClick={() => setTab("people")}>People</button>
            <button type="button" className={`top8ed__tab${tab === "venues" ? " is-on" : ""}`} onClick={() => setTab("venues")}>Venues</button>
          </div>
          <input
            className="top8ed__input"
            type="search"
            placeholder={tab === "people" ? "Search people by name…" : "Search venues…"}
            value={q}
            onChange={e => setQ(e.target.value)}
          />
          <div className="top8ed__results">
            {loading && tab === "people" && <p className="top8ed__hint">Searching…</p>}
            {results.length === 0 && !loading && (
              <p className="top8ed__hint">
                {tab === "people" ? "Type a name to find people." : "No venues match."}
              </p>
            )}
            {results.map(e => {
              const already = inList(e);
              return (
                <button
                  type="button"
                  key={keyOf(e)}
                  className={`top8ed__result${already ? " is-added" : ""}`}
                  onClick={() => add(e)}
                  disabled={already || full}
                >
                  {tileAvatar(e, 30)}
                  <span className="top8ed__row-main">
                    <span className="top8ed__row-name display">{nameOf(e)}</span>
                    <span className="top8ed__row-sub">{subOf(e)}</span>
                  </span>
                  <span className="top8ed__add">{already ? "Added" : full ? "Full" : "+ Add"}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="top8ed__foot">
          <button type="button" className="top8ed__cancel display" onClick={onClose}>Cancel</button>
          <button type="button" className="top8ed__save display" onClick={save}>Save Top 8</button>
        </div>
      </div>
    </>,
    document.body,
  );
}
