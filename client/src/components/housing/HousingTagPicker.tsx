/**
 * The tag picker in the HAUSING composer.
 *
 * Same catalog as the board filter, narrowed to what this post type may carry.
 * Categories collapse so the whole vocabulary is not thrown at someone writing
 * their first post, and contradictory tags swap instead of stacking.
 *
 * This is a set of tags, not a form. Nothing here is required and nothing here
 * is a question you have to answer.
 */
import { useMemo, useState } from "react";
import type { HousingType } from "@shared/housing";
import {
  HOUSING_TAG_BY_ID,
  blockedByHousingTags,
  housingTagGroups,
  housingTagsConflict,
  searchHousingTags,
  housingTagAllowedOn,
  type HousingTag,
} from "@shared/housingTags";
import { HousingIcon } from "./HousingIcon";
import { Mono } from "./HousingPrimitives";

export function HousingTagPicker({
  type,
  value,
  onChange,
}: {
  type: HousingType;
  value: string[];
  onChange: (tags: string[]) => void;
}) {
  const groups = useMemo(() => housingTagGroups(type), [type]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map((g) => [g.category.id, !!g.category.open])),
  );
  const [query, setQuery] = useState("");

  const blocked = useMemo(() => blockedByHousingTags(value), [value]);
  const results = useMemo(
    () => searchHousingTags(query).filter((t) => !t.derived && housingTagAllowedOn(t, type)),
    [query, type],
  );

  const toggle = (id: string) => {
    if (value.includes(id)) return onChange(value.filter((x) => x !== id));
    // The opposite answer replaces rather than refuses. Someone who taps
    // Unfurnished after Furnished has changed their mind, not made an error.
    onChange([...value.filter((x) => !housingTagsConflict(x, id)), id]);
  };

  const picked = value.map((id) => HOUSING_TAG_BY_ID[id]).filter(Boolean) as HousingTag[];
  const helpers = picked.filter((t) => t.helper && (t.pinned || t.priority === 1));

  return (
    <div className="hz-field hz-tagpick">
      <label>
        <Mono micro>Tags</Mono>
      </label>
      <small className="hz-hint">
        Optional. Tags are how people filter the board, so a few honest ones do more than a long list.
      </small>

      {picked.length ? (
        <div className="hz-tagrow hz-tagpick__picked">
          {picked.map((tag) => (
            <button
              key={tag.id}
              type="button"
              className={`hz-tag hz-tag--applied${tag.priority === 1 ? " hz-tag--urgent" : ""}${
                tag.tone === "adult" ? " hz-tag--adult" : ""
              }`}
              onClick={() => toggle(tag.id)}
              aria-label={`Remove ${tag.label}`}
            >
              {tag.label}
              <HousingIcon name="close" size={11} />
            </button>
          ))}
        </div>
      ) : null}

      {/* Conditions someone should read before they post, not after. */}
      {helpers.map((tag) => (
        <div className="hz-flag hz-flag--note" key={`help-${tag.id}`}>
          <span>
            <b style={{ color: "var(--text-hi)" }}>{tag.label}</b>
            <p>{tag.helper}</p>
          </span>
        </div>
      ))}

      <div className="hz-tagpick__search">
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

      <div className="hz-tagpick__body">
        {query ? (
          <div className="hz-tagpick__group">
            <Mono micro>{results.length ? `${results.length} matching` : "Nothing matches"}</Mono>
            <div className="hz-tagpick__tags">
              {results.map((tag) => (
                <PickTag
                  key={tag.id}
                  tag={tag}
                  on={value.includes(tag.id)}
                  blocked={blocked.has(tag.id)}
                  onToggle={() => toggle(tag.id)}
                />
              ))}
            </div>
          </div>
        ) : (
          groups.map(({ category, tags }) => {
            const isOpen = !!expanded[category.id];
            const n = tags.filter((t) => value.includes(t.id)).length;
            return (
              <div className="hz-tagpick__group" key={category.id}>
                <button
                  type="button"
                  className="hz-tagpick__grouphead"
                  aria-expanded={isOpen}
                  onClick={() => setExpanded((cur) => ({ ...cur, [category.id]: !cur[category.id] }))}
                >
                  <span>{category.label}</span>
                  {n ? <i className="hz-tagfilter__count">{n}</i> : null}
                  <svg className="hz-tagfilter__caret" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.4" />
                  </svg>
                </button>
                {isOpen ? (
                  <>
                    {category.blurb ? <small className="hz-hint">{category.blurb}</small> : null}
                    <div className="hz-tagpick__tags">
                      {tags.map((tag) => (
                        <PickTag
                          key={tag.id}
                          tag={tag}
                          on={value.includes(tag.id)}
                          blocked={blocked.has(tag.id)}
                          onToggle={() => toggle(tag.id)}
                        />
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function PickTag({
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
  const tone = tag.pulse ? " hz-tag--urgent hz-tag--now" : tag.tone ? ` hz-tag--${tag.tone}` : "";
  return (
    <button
      type="button"
      className={`hz-tag hz-tag--pick${tone}${on ? " is-on" : ""}${blocked && !on ? " is-blocked" : ""}`}
      aria-pressed={on}
      onClick={onToggle}
      title={blocked && !on ? "This replaces the opposite tag you already picked" : tag.helper}
    >
      {tag.label}
    </button>
  );
}

export default HousingTagPicker;
