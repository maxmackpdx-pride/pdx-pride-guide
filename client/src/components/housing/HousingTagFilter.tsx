/**
 * The tag filter above the HAUSING feed.
 *
 * Narrowing the board is the viewer choosing what THEY want to see. It never
 * reorders posts and it never hides anyone from anyone: whatever survives the
 * filter still comes back newest first. See listHousingPosts().
 *
 * Selections are held as a draft until Apply, so half finished picking does not
 * refetch the board on every tap.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  HOUSING_TAG_BY_ID,
  URGENT_TAG_IDS,
  blockedByHousingTags,
  housingFilterGroups,
  housingTagsConflict,
  searchHousingTags,
  type HousingTag,
} from "@shared/housingTags";
import { HousingIcon } from "./HousingIcon";
import { Mono } from "./HousingPrimitives";

/** Categories that open on first paint. The rest start collapsed. */
const groups = housingFilterGroups();

export function HousingTagFilter({
  applied,
  onApply,
}: {
  applied: string[];
  onApply: (tags: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(applied);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map((g) => [g.category.id, !!g.category.open])),
  );
  const shellRef = useRef<HTMLDivElement | null>(null);

  // An applied set that changed elsewhere (a chip removed, the URL restored on
  // back navigation) has to reach the draft or Apply would undo it.
  useEffect(() => {
    if (!open) setDraft(applied);
  }, [applied, open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!shellRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const blocked = useMemo(() => blockedByHousingTags(draft), [draft]);
  const results = useMemo(() => searchHousingTags(query), [query]);

  const toggle = (id: string) => {
    setDraft((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      // Picking the opposite answer replaces the old one rather than refusing
      // the tap. Being told "no" by a filter you just touched reads as broken.
      return [...cur.filter((x) => !housingTagsConflict(x, id)), id];
    });
  };

  const apply = () => {
    onApply(draft);
    setOpen(false);
  };

  const clearAll = () => {
    setDraft([]);
    onApply([]);
  };

  const appliedTags = applied.map((id) => HOUSING_TAG_BY_ID[id]).filter(Boolean) as HousingTag[];
  const count = applied.length;
  const dirty = draft.length !== applied.length || draft.some((t) => !applied.includes(t));

  return (
    <div className="hz-tagfilter" ref={shellRef}>
      <div className="hz-tagfilter__bar">
        <button
          type="button"
          className="hz-tagfilter__toggle"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <HousingIcon name="search" size={15} />
          <span>Filter by tag</span>
          {count ? <i className="hz-tagfilter__count">{count}</i> : null}
          <svg className="hz-tagfilter__caret" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.4" />
          </svg>
        </button>

        {/* Applied filters live outside the dropdown so they stay visible while scrolling the feed. */}
        {appliedTags.length ? (
          <div className="hz-tagfilter__applied">
            {appliedTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                className={`hz-tag hz-tag--applied${tag.priority === 1 ? " hz-tag--urgent" : ""}`}
                onClick={() => onApply(applied.filter((x) => x !== tag.id))}
                aria-label={`Remove ${tag.label}`}
              >
                {tag.label}
                <HousingIcon name="close" size={11} />
              </button>
            ))}
            <button type="button" className="hz-tagfilter__clear" onClick={clearAll}>
              Clear all
            </button>
          </div>
        ) : null}
      </div>

      {open ? (
        <div className="hz-tagfilter__panel" role="dialog" aria-label="Filter listings by tag">
          <div className="hz-tagfilter__search">
            <HousingIcon name="search" size={14} />
            <input
              type="search"
              value={query}
              placeholder="Search tags"
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search tags"
            />
            {query ? (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear search">
                <HousingIcon name="close" size={13} />
              </button>
            ) : null}
          </div>

          <div className="hz-tagfilter__scroll">
            {query ? (
              <div className="hz-tagfilter__group">
                <Mono micro>{results.length ? `${results.length} matching` : "Nothing matches"}</Mono>
                <div className="hz-tagfilter__tags">
                  {results.map((tag) => (
                    <FilterTag
                      key={tag.id}
                      tag={tag}
                      on={draft.includes(tag.id)}
                      blocked={blocked.has(tag.id)}
                      onToggle={() => toggle(tag.id)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Someone who needs housing tonight should not have to scroll for it. */}
                <div className="hz-tagfilter__quick">
                  <Mono micro>Needs housing now</Mono>
                  <div className="hz-tagfilter__tags">
                    {URGENT_TAG_IDS.map((id) => (
                      <FilterTag
                        key={id}
                        tag={HOUSING_TAG_BY_ID[id]}
                        on={draft.includes(id)}
                        blocked={blocked.has(id)}
                        onToggle={() => toggle(id)}
                      />
                    ))}
                  </div>
                </div>

                {groups
                  .filter((g) => g.category.id !== "urgent")
                  .map(({ category, tags }) => {
                    const isOpen = !!expanded[category.id];
                    const picked = tags.filter((t) => draft.includes(t.id)).length;
                    return (
                      <div className="hz-tagfilter__group" key={category.id}>
                        <button
                          type="button"
                          className="hz-tagfilter__grouphead"
                          aria-expanded={isOpen}
                          onClick={() => setExpanded((cur) => ({ ...cur, [category.id]: !cur[category.id] }))}
                        >
                          <span>{category.label}</span>
                          {picked ? <i className="hz-tagfilter__count">{picked}</i> : null}
                          <svg className="hz-tagfilter__caret" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.4" />
                          </svg>
                        </button>
                        {isOpen ? (
                          <div className="hz-tagfilter__tags">
                            {tags.map((tag) => (
                              <FilterTag
                                key={tag.id}
                                tag={tag}
                                on={draft.includes(tag.id)}
                                blocked={blocked.has(tag.id)}
                                onToggle={() => toggle(tag.id)}
                              />
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
              </>
            )}
          </div>

          <div className="hz-tagfilter__foot">
            <button type="button" className="hz-tagfilter__clear" onClick={clearAll} disabled={!draft.length}>
              Clear all
            </button>
            <span className="hz-tagfilter__note">
              {draft.length ? `${draft.length} selected. Listings must match all of them.` : "Pick as many as you want."}
            </span>
            <button type="button" className="hz-tagfilter__apply" onClick={apply} disabled={!dirty}>
              Apply filters
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FilterTag({
  tag,
  on,
  blocked,
  onToggle,
}: {
  tag: HousingTag;
  on: boolean;
  blocked: boolean;
  onToggle: () => void;
}) {
  const tone = tag.pulse
    ? " hz-tag--urgent hz-tag--now"
    : tag.tone
      ? ` hz-tag--${tag.tone}`
      : "";
  return (
    <button
      type="button"
      className={`hz-tag hz-tag--pick${tone}${on ? " is-on" : ""}${blocked && !on ? " is-blocked" : ""}`}
      aria-pressed={on}
      onClick={onToggle}
      title={blocked && !on ? "Picking this replaces the opposite tag you already chose" : tag.helper}
    >
      {tag.label}
    </button>
  );
}
