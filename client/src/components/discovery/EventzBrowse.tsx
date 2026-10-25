import { useBrowseControlsOffset } from "./useBrowseControlsOffset";
import { Children, useEffect, useId, useRef, useState, type CSSProperties, type ChangeEvent, type ReactNode } from "react";
import { DockChip, ScrollDock, focusPageSearch, scrollToResults, useScrollDock } from "./ScrollDock";
import { Grid2X2, SlidersHorizontal } from "lucide-react";
import { SearchInput } from "@/components/ds";
import { useIsMobile } from "@/hooks/use-mobile";
import EventsRail from "@/components/events/EventsRail";
import "./EventzBrowse.css";

export type BrowseCategory = { id: string; label: string; color: string; count: number };
export type BrowseView = "browse" | "grid";

/** Placez and NEEDZ use the approved Eventz composition, with their own data and actions. */
export function BrowseHeader({ title, logo, kicker, description, children }: {
  title: string; logo: string; kicker: string; description: string; children: ReactNode;
}) {
  return <header className="eb-header eb-frame">
    <div className="eb-header__row"><div className="eb-header__identity">
      <p className="eb-kicker">{kicker}</p>
      <h1><img src={logo} alt={title} /></h1>
    </div><div className="eb-header__actions">{children}</div></div>
    <p className="eb-lede">{description}</p>
  </header>;
}

export function BrowseControls({ title, categories, selected, onSelect, query, onSearch, view, onView, children, actions }: {
  title: string; categories: BrowseCategory[]; selected: string[]; onSelect: (id: string) => void;
  query: string; onSearch: (query: string) => void; view: BrowseView; onView: (view: BrowseView) => void; children?: ReactNode; actions?: ReactNode;
}) {
  const controlsRef=useBrowseControlsOffset();
  const categoryRowRef=useRef<HTMLDivElement>(null);
  const dockTop=useScrollDock(categoryRowRef);
  const selectedKey = selected.join(",");
  const categoryKey = categories.map(category => category.id).join(",");
  const markCategoryScroll = (scroller: HTMLElement) => {
    const max = scroller.scrollWidth - scroller.clientWidth;
    scroller.classList.toggle("is-scrolled", scroller.scrollLeft > 4);
    scroller.classList.toggle("can-scroll-end", max > 4 && scroller.scrollLeft < max - 4);
  };
  useEffect(() => {
    const scroller = categoryRowRef.current?.querySelector<HTMLElement>(".eb-categories");
    const pressed = scroller?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!scroller || !pressed) return;
    const pad = 18;
    const left = pressed.offsetLeft - pad;
    const right = pressed.offsetLeft + pressed.offsetWidth + pad;
    if (left < scroller.scrollLeft) scroller.scrollLeft = left;
    else if (right > scroller.scrollLeft + scroller.clientWidth) scroller.scrollLeft = right - scroller.clientWidth;
    markCategoryScroll(scroller);
  }, [selectedKey, categoryKey]);
  const pick=(id: string) => { onSelect(id); onView("grid"); };
  return <div className="eb-controls" ref={controlsRef}>
    {dockTop != null && (<ScrollDock top={dockTop} label={`${title} categories`} searchLabel={`Search ${title}`}
      onSearch={() => focusPageSearch(".eb-controls .eb-search-row input", dockTop)}>
      {categories.map(category => <DockChip key={category.id} label={category.id === "ALL" ? "All" : category.label} count={category.count}
        color={category.color} pressed={selected.includes(category.id)} onClick={() => { pick(category.id); requestAnimationFrame(() => scrollToResults(".eb-result-head, .eb-body", dockTop)); }} />)}
    </ScrollDock>)}
    <div className="eb-category-row" ref={categoryRowRef}>
      <div className="eb-categories" role="group" aria-label={`${title} categories`} onScroll={event => markCategoryScroll(event.currentTarget)}>
        {categories.map(category => <button type="button" className="eb-category pdx-glass-rebind" key={category.id}
          style={{ "--c": category.color } as CSSProperties} aria-pressed={selected.includes(category.id)} onClick={() => pick(category.id)}>
          <span>{category.label}</span><small>{category.id === "ALL" ? "Explore" : title}</small><b>{category.count}</b>
        </button>)}
      </div>
    </div>
    <div className="eb-search-row"><SearchInput aria-label={`Search ${title}`} placeholder={`Search ${title.toLowerCase()}…`} value={query}
      onChange={(event: ChangeEvent<HTMLInputElement>) => onSearch(event.target.value)} onClear={() => onSearch("")} />{children}</div>
    <div className="eb-browse-actions">
      <button type="button" className="eb-tool eb-view-all" aria-pressed={view === "grid"} onClick={() => onView("grid")}>
        <Grid2X2 size={18} aria-hidden="true" />View all
      </button>
      {actions}
    </div>
  </div>;
}

export function BrowseFilters({ title, active = false, children }: { title: string; active?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  return <>
    <button type="button" className="eb-tool eb-mobile-filter-toggle" aria-expanded={open} aria-controls={panelId} aria-label={title} data-active={active} onClick={() => setOpen(value => !value)}>
      <SlidersHorizontal size={19} aria-hidden="true" />
    </button>
    {open && <div id={panelId} className="eb-panel eb-filter-popover" role="region" aria-label={title}>{children}</div>}
  </>;
}

export function BrowseLane({ title, color, count, children, onViewAll }: { title: string; color: string; count: number; children: ReactNode; onViewAll?: () => void }) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const id = useId();
  const showViewAll = onViewAll ? count > 4 : !isMobile && count > 4;
  return <section className={`eb-lane pdx-glass-rebind${open ? " eb-lane--open" : ""}`} style={{ "--c": color } as CSSProperties} aria-labelledby={id}>
    <header className="eb-lane__head"><h2 id={id}><i aria-hidden="true" />{title} <small>{count}</small></h2>
      {showViewAll && <button type="button" aria-expanded={onViewAll ? undefined : open} onClick={() => onViewAll ? onViewAll() : setOpen(!open)}>{!onViewAll && open ? "Show less" : "View all"}</button>}
    </header>
    <EventsRail open={isMobile || open} label={title}>{Children.map(children, child => <div className="events-rail__item" role="listitem">{child}</div>)}</EventsRail>
  </section>;
}
