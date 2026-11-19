import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import "./EventsFilterDrawer.css";

export type EventsFilterDay = {
  /** YYYY-MM-DD (Pacific). */
  date: string;
  /** MON … SUN. */
  dowCode: string;
  /** Day of month. */
  dom: number;
  /** Live events on that date in the current view. */
  count: number;
  isToday: boolean;
  selected: boolean;
};

const WINDOWS = [
  ["all", "ALL"],
  ["tonight", "TONIGHT"],
  ["week", "THIS WEEK"],
  ["later", "LATER"],
] as const;

const TAG_CHIPS: Array<[string, string]> = [
  ["21plus", "21+"],
  ["free", "FREE"],
  ["party", "PARTY"],
  ["drag", "DRAG"],
  ["kink", "KINK"],
  ["social", "SOCIAL"],
];

/**
 * The events filter drawer: a persistent bottom sheet locked to the top of
 * the mobile dock. The thick lip (3 stacked lines) is the grab handle —
 * drag it or tap it to open/close. Inside, the board's filter chips sit
 * above a My-Schedule-style day picker (same button size and day colors,
 * dock materials). It arrives open with a bounce. Not a modal: the page
 * stays live behind it.
 */
export default function EventsFilterDrawer({
  window: windowFilter,
  onWindow,
  tags,
  onToggleTag,
  query,
  onQuery,
  count,
  days,
  pastView,
  onPickDay,
  onHeightChange,
  bottomLift = 0,
}: {
  window: string;
  onWindow: (value: string) => void;
  tags: Set<string>;
  onToggleTag: (tag: string) => void;
  query: string;
  onQuery: (value: string) => void;
  count: number;
  days: EventsFilterDay[];
  pastView: boolean;
  onPickDay: (date: string) => void;
  onHeightChange?: (height: number) => void;
  /** Extra lift above the dock line, for a surface where something else
      already holds the dock-top slot. */
  bottomLift?: number;
}) {
  const [open, setOpen] = useState(true);
  const [arriving, setArriving] = useState(true);
  const [dragH, setDragH] = useState<number | null>(null);
  const rootRef = useRef<HTMLElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startY: number; startH: number; moved: number } | null>(null);
  const [bodyH, setBodyH] = useState(0);

  /* Measure the body so the closed drawer leaves exactly the lip showing,
     and report the total height so the page can clear space for it. */
  useEffect(() => {
    const body = bodyRef.current;
    const root = rootRef.current;
    if (!body || !root) return;
    const measure = () => {
      setBodyH(body.scrollHeight);
      onHeightChange?.(root.offsetHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(body);
    ro.observe(root);
    return () => ro.disconnect();
  }, [onHeightChange]);

  /* The arrival bounce plays once, on mount. */
  useEffect(() => {
    const t = window.setTimeout(() => setArriving(false), 900);
    return () => window.clearTimeout(t);
  }, []);

  const shownH = dragH != null ? dragH : open ? bodyH : 0;

  const onDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* older browsers */ }
    drag.current = { startY: event.clientY, startH: shownH, moved: 0 };
    setDragH(shownH);
  };
  const onMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d) return;
    d.moved = event.clientY - d.startY;
    setDragH(Math.min(bodyH, Math.max(0, d.startH - d.moved)));
  };
  const onUp = () => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    const h = dragH ?? shownH;
    setDragH(null);
    if (Math.abs(d.moved) < 6) { setOpen(o => !o); return; }
    setOpen(h > bodyH / 2);
  };
  const onKey = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowUp") { event.preventDefault(); setOpen(true); }
    if (event.key === "ArrowDown") { event.preventDefault(); setOpen(false); }
  };

  const pickDay = (date: string) => {
    setOpen(false);
    onPickDay(date);
  };

  return (
    <section
      ref={rootRef}
      className={`edrawer${arriving ? " is-arriving" : ""}${dragH != null ? " is-dragging" : ""}`}
      aria-label="Event filters"
      style={{ "--edrawer-lift": `${bottomLift}px` } as CSSProperties}
    >
      <button
        type="button"
        className="edrawer__lip"
        aria-expanded={open}
        aria-label={open ? "Close filters" : "Open filters"}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={onKey}
      >
        <span className="edrawer__lines" aria-hidden="true">
          <i /><i /><i />
        </span>
      </button>
      <div className="edrawer__bodywrap" style={{ height: shownH }} inert={!open && dragH == null}>
        <div className="edrawer__body" ref={bodyRef}>
          <div className="edrawer__filters" role="group" aria-label="Filter the board">
            {WINDOWS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`edrawer__chip${windowFilter === value ? " on" : ""}`}
                aria-pressed={windowFilter === value}
                onClick={() => onWindow(value)}
              >
                {label}
              </button>
            ))}
            <span className="edrawer__div" />
            {TAG_CHIPS.map(([token, label]) => (
              <button
                key={token}
                type="button"
                className={`edrawer__chip${tags.has(token) ? " on" : ""}`}
                aria-pressed={tags.has(token)}
                onClick={() => onToggleTag(token)}
              >
                {label}
              </button>
            ))}
            <input
              className="edrawer__search"
              type="text"
              placeholder="SEARCH EVENTS, VENUES, DAYS…"
              aria-label="Search events"
              value={query}
              onChange={e => onQuery(e.target.value)}
            />
            <span className="edrawer__count">{count} EVENTS</span>
          </div>
          <div className="edrawer__days" role="group" aria-label={pastView ? "Jump to a past day" : "Jump to a day"}>
            {days.map(d => {
              const lower = d.dowCode.toLowerCase();
              const has = d.count > 0;
              return (
                <button
                  key={d.date}
                  type="button"
                  className={`edrawer__day${has ? " has-events" : ""}${d.isToday ? " is-today" : ""}${d.selected ? " is-selected" : ""}`}
                  style={{ "--dc": `var(--day-${lower})`, "--dt": `var(--day-${lower}-text, var(--day-${lower}))` } as CSSProperties}
                  aria-pressed={d.selected}
                  aria-label={`${d.dowCode} ${d.dom}${d.isToday ? ", today" : ""}${has ? `, ${d.count} event${d.count === 1 ? "" : "s"}` : ", no events"}`}
                  onClick={() => pickDay(d.date)}
                >
                  <span className="edrawer__dow">{d.dowCode.slice(0, 1)}</span>
                  <span className="edrawer__dom">{d.dom}</span>
                  <span className="edrawer__mark" aria-hidden="true">
                    {has ? <span className="edrawer__dcount">{d.count}</span> : <span className="edrawer__idle" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
