import { useId, type CSSProperties } from "react";
import { Minus, Plus } from "lucide-react";
import { NeedzCompactCard } from "./NeedzCompactCard";
import {
  NEEDZ_HOW, NEEDZ_NEED_COUNTS, NEEDZ_NEEDS, NEEDZ_WHEN, NEEDZ_WHERE, NEEDZ_WHO, toggle,
  type NeedzFilters, type NeedzRow,
} from "./needzDeckModel";

/** Intake: everyday needs first, then timing; how, where and who stay folded under More options. */
export function NeedzIntake({ filters, deck, moreOpen, onFilters, onMore, onStart, onReset }: {
  filters: NeedzFilters; deck: NeedzRow[]; moreOpen: boolean;
  onFilters: (next: NeedzFilters) => void; onMore: () => void; onStart: (index: number) => void; onReset: () => void;
}) {
  const moreId = useId();
  const whenName = NEEDZ_WHEN.find(option => option.id === filters.when)?.name;
  return <div className="nd-intake">
    <section className="nd-step" aria-labelledby="nd-need-title">
      <h2 id="nd-need-title" className="nd-heading">What are you looking for today?</h2>
      <p className="nd-sub">Pick as many as you like, or skip ahead to see everything.</p>
      <div className="nd-needs" role="group" aria-labelledby="nd-need-title">
        {NEEDZ_NEEDS.map(need => {
          const on = filters.needs.includes(need.id);
          const count = NEEDZ_NEED_COUNTS[need.id];
          return <button key={need.id} type="button" className="nd-need pdx-glass-rebind" style={{ "--c": need.color } as CSSProperties} aria-pressed={on} onClick={() => onFilters({ ...filters, needs: toggle(filters.needs, need.id) })}>
            <span className="nd-need__top">
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d={need.glyph} /></svg>
              {on && <span className="nd-need__added">Added</span>}
            </span>
            <span className="nd-need__name">{need.name}</span>
            <span className="nd-need__count">{count} {count === 1 ? "place" : "places"}</span>
          </button>;
        })}
      </div>
      <a className="pdx-glass-rebind pdxBtn nd-btn nd-btn--wide" href="tel:211">Not sure where to start? Call 211info</a>
      <p className="nd-fine">211info is free and covers housing, food, utilities, child care and more. Calls Mon to Fri, 8am to 6pm.</p>
    </section>
    <section className="nd-step" aria-labelledby="nd-when-title">
      <h2 id="nd-when-title" className="nd-heading nd-heading--small">When works for you?</h2>
      <div className="nd-when" role="group" aria-labelledby="nd-when-title">
        {NEEDZ_WHEN.map(option => <button key={option.id} type="button" className="nd-when__option" aria-pressed={filters.when === option.id} onClick={() => onFilters({ ...filters, when: option.id })}>
          <strong>{option.name}</strong><span>{option.sub}</span>
        </button>)}
      </div>
    </section>
    <section className="nd-step">
      <button type="button" className="pdx-glass-rebind pdxBtn nd-btn nd-btn--wide nd-more" aria-expanded={moreOpen} aria-controls={moreId} onClick={onMore}>
        <span>More options: how, where, who</span>{moreOpen ? <Minus size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
      </button>
      <div id={moreId} className="nd-more__body" hidden={!moreOpen}>
        <div className="nd-chips" role="group" aria-label="How to reach them">{NEEDZ_HOW.map(option => <button key={option.id} type="button" className="nd-chip" aria-pressed={filters.how === option.id} onClick={() => onFilters({ ...filters, how: option.id })}>{option.name}</button>)}</div>
        <div className="nd-chips" role="group" aria-label="Where">{NEEDZ_WHERE.map(option => <button key={option.id} type="button" className="nd-chip" aria-pressed={filters.where === option.id} onClick={() => onFilters({ ...filters, where: option.id })}>{option.name}</button>)}</div>
        <div className="nd-chips" role="group" aria-label="Who it's for">{NEEDZ_WHO.map(option => <button key={option.id} type="button" className="nd-chip" aria-pressed={filters.who.includes(option.id)} onClick={() => onFilters({ ...filters, who: toggle(filters.who, option.id) })}>{option.name}</button>)}</div>
      </div>
    </section>
    <section className="nd-summary pdx-glass-rebind" aria-labelledby="nd-summary-title">
      <div className="nd-summary__head"><h2 id="nd-summary-title" className="nd-heading nd-heading--small" aria-live="polite">{deck.length} {deck.length === 1 ? "place" : "places"} for you</h2><span>{whenName}</span></div>
      {deck.length > 0 ? <>
        <div className="nd-compact-grid nd-compact-grid--preview">{deck.slice(0, 2).map((row, index) => <NeedzCompactCard key={row.id} row={row} onOpen={() => onStart(index)} />)}</div>
        <button type="button" className="pdx-glass-rebind pdxBtn pdxBtn--solid nd-btn nd-btn--start" onClick={() => onStart(0)}>Flip through them</button>
        <p className="nd-fine nd-center">One card at a time. Save the ones that fit, skip the rest.</p>
      </> : <button type="button" className="pdx-glass-rebind pdxBtn nd-btn nd-btn--wide" onClick={onReset}>Widen the options</button>}
    </section>
  </div>;
}
