import { Children, useId, useState, type CSSProperties, type ChangeEvent, type ReactNode } from "react";
import { Grid2X2, SlidersHorizontal } from "lucide-react";
import { SearchInput } from "@/components/ds";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";
import EventsRail from "@/components/events/EventsRail";
import "./EventzBrowse.css";

export type BrowseCategory = { id: string; label: string; color: string; count: number };
export type BrowseView = "browse" | "grid";

/** Placez and ReZources use the approved Eventz composition, with their own data and actions. */
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

export function BrowseControls({ title, categories, selected, onSelect, query, onSearch, view, onView, children }: {
  title: string; categories: BrowseCategory[]; selected: string[]; onSelect: (id: string) => void;
  query: string; onSearch: (query: string) => void; view: BrowseView; onView: (view: BrowseView) => void; children?: ReactNode;
}) {
  return <div className="eb-controls">
    <div className="eb-category-row">
      <div className="eb-categories" role="group" aria-label={`${title} categories`}>
        {categories.map(category => <button type="button" className="eb-category pdx-glass-rebind" key={category.id}
          style={{ "--c": category.color } as CSSProperties} aria-pressed={selected.includes(category.id)} onClick={() => { onSelect(category.id); onView("browse"); }}>
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
    </div>
  </div>;
}

export function BrowseFilters({ title, active = false, children }: { title: string; active?: boolean; children: ReactNode }) {
  return <Popover>
    <PopoverTrigger asChild>
      <button type="button" className="eb-tool eb-mobile-filter-toggle" aria-label={title} data-active={active}>
        <SlidersHorizontal size={19} aria-hidden="true" />
      </button>
    </PopoverTrigger>
    <PopoverContent align="end" sideOffset={8} className="eb-panel eb-filter-popover" aria-label={title}>
      {children}
    </PopoverContent>
  </Popover>;
}

export function BrowseLane({ title, color, count, children }: { title: string; color: string; count: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const id = useId();
  return <section className={`eb-lane pdx-glass-rebind${open ? " eb-lane--open" : ""}`} style={{ "--c": color } as CSSProperties} aria-labelledby={id}>
    <header className="eb-lane__head"><h2 id={id}><i aria-hidden="true" />{title} <small>{count}</small></h2>
      {!isMobile && count > 4 && <button type="button" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Show less" : "View all"}</button>}
    </header>
    <EventsRail open={isMobile || open} label={title}>{Children.map(children, child => <div className="events-rail__item" role="listitem">{child}</div>)}</EventsRail>
  </section>;
}
