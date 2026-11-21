import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { EVENT_TYPE_FILTERS } from "@shared/eventTypeTags";
import {
  eventTypeLabelToTagId,
  tagIdToEventTypeLabel,
  type DrawerFilterState,
} from "@shared/drawerFilters";
import { DrawerTop } from "@/components/drawers";
import type { DrawerTopEvent } from "@shared/drawerTop";
import "./EventsFilterDrawer.css";
import NightDrawer from "../afterz/NightDrawer";

/** A date-window chip (All / Today / Tonight / This week / months…). */
export type EventsFilterWindowChip = { key: string; label: string };

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

const LIP_H = 32;
type Stage = 0 | 1 | 2;

/**
 * The events filter drawer: a bottom sheet locked to the top of the mobile
 * dock with three stages. Stage 1 (arrives open, with a bounce) holds the
 * board's filter chips above a My-Schedule-style day picker. Below the day
 * picker, a second pull handle drags the sheet to stage 2 — full screen,
 * holding Your Schedule. Closing is two-stage: a normal swipe down from
 * full screen stops at stage 1 with a slight bounce; only a hard/fast drag
 * down, or a second drag down from stage 1, closes it to the dock. The lip
 * (3 stacked lines) drags or taps through the same stages. Not a modal at
 * stages 0–1: the page stays live behind it.
 *
 * Blend (Nov 19): stage 1 also carries the event-type chips and a
 * Back-in-time toggle (second filter row, still above the day picker) and
 * the board's window chips under the day picker. With `startAtSchedule`
 * (the /schedule deep link) the sheet arrives already at stage 2.
 */
export default function EventsFilterDrawer({
  window: windowFilter,
  onWindow,
  tags,
  onToggleTag,
  query,
  onQuery,
  count,
  pastView,
  onPickDay,
  onHeightChange,
  scheduleContent,
  activeTypes,
  onToggleType,
  onTogglePast,
  windowChips,
  activeWindow,
  onPickWindow,
  startAtSchedule = false,
  upcomingEvents = [],
  selectedDate = null,
  onSelectDate,
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
  /** Your Schedule (the condensed week grid), shown at full-screen stage 2.
      Mounted lazily the first time stage 2 is reached, then kept mounted. */
  scheduleContent?: ReactNode;
  /** Event-type filters currently on (EVENT_TYPE_FILTERS labels). */
  activeTypes?: string[];
  onToggleType?: (filter: string) => void;
  /** Back-in-time toggle (past board view). */
  onTogglePast?: () => void;
  /** Date-window chips for the row under the day picker. */
  windowChips?: EventsFilterWindowChip[];
  activeWindow?: string;
  onPickWindow?: (key: string) => void;
  /** Arrive already at stage 2 (the /schedule deep link). */
  startAtSchedule?: boolean;
  upcomingEvents?: DrawerTopEvent[];
  selectedDate?: string | null;
  onSelectDate?: (date: string) => void;
}) {
  const [stage, setStage] = useState<Stage>(startAtSchedule ? 2 : 1);
  const [arriving, setArriving] = useState(!startAtSchedule);
  const [settling, setSettling] = useState(false);
  const [dragH, setDragH] = useState<number | null>(null);
  const [bodyH, setBodyH] = useState(0);
  const [fullH, setFullH] = useState(0);
  const [stage2Mounted, setStage2Mounted] = useState(startAtSchedule);
  const rootRef = useRef<HTMLElement>(null);
  const lipRef = useRef<HTMLButtonElement>(null);
  const pullRef = useRef<HTMLButtonElement>(null);
  const stage1Ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    source: "lip" | "pull";
    from: Stage;
    startY: number;
    startH: number;
    /** Current dragged height, kept on the ref: release decisions must not
        read the dragH state, whose closure can be a render behind when
        pointer events arrive faster than React flushes (a fast flick). */
    h: number;
    startT: number;
    moved: number;
    lastY: number;
    lastT: number;
    velocity: number;
  } | null>(null);
  const settleTimer = useRef<number | undefined>(undefined);

  const stageH = (s: Stage) => (s === 0 ? 0 : s === 1 ? bodyH : fullH);
  const shownH = dragH != null ? dragH : stageH(stage);
  /* Content swaps only on stage change, never mid-drag: hiding stage 1
     while its pull handle is being dragged hides the dragged element and
     kills the gesture before pointerup can land the next stage. */
  const showSchedule = stage === 2;

  const measureFull = () => {
    const root = rootRef.current;
    if (!root) return 0;
    /* Full screen = the whole app frame between the site header and the
       dock: the sheet's bottom edge is anchored to the dock, and its top
       stops just below the header. Running to the very top of the
       viewport would slide the lip UNDER the header bar (which lives in
       a 9000-range stacking shell) and leave stage 2 with no grabbable
       handle — the two-stage close depends on that lip. */
    const header = document.querySelector(".site-hub-mtop, .site-header");
    const headerBottom = header ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
    return Math.max(0, Math.floor(root.getBoundingClientRect().bottom - headerBottom - LIP_H - 2));
  };

  const goStage = (next: Stage) => {
    if (next === 2) {
      setStage2Mounted(true);
      setFullH(measureFull());
    }
    if (next === 1 && stage === 2) {
      setSettling(true);
      window.clearTimeout(settleTimer.current);
      settleTimer.current = window.setTimeout(() => setSettling(false), 650);
    }
    if (rootRef.current?.contains(document.activeElement)) {
      const nextGrip = next === 1 && stage === 2 ? pullRef : lipRef;
      requestAnimationFrame(() => nextGrip.current?.focus({ preventScroll: true }));
    }
    setStage(next);
  };

  /* Measure the stage-1 body so the closed sheet leaves exactly the lip
     showing, and report the total height so the page can clear space. */
  useEffect(() => {
    const s1 = stage1Ref.current;
    const root = rootRef.current;
    if (!s1 || !root) return;
    const measure = () => {
      /* While stage 2 shows, stage 1 is display:none and measures 0 —
         keep the last real stage-1 height for the trip back down. */
      if (!s1.hidden) setBodyH(Math.min(s1.scrollHeight, measureFull()));
      onHeightChange?.(root.offsetHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(s1);
    ro.observe(root);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [onHeightChange]);

  /* Keep the full-screen height honest on rotation/resize. */
  useEffect(() => {
    if (stage !== 2) return;
    const onResize = () => setFullH(measureFull());
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [stage]);

  /* The arrival bounce plays once, on mount. */
  useEffect(() => {
    const t = window.setTimeout(() => setArriving(false), 900);
    return () => window.clearTimeout(t);
  }, []);

  /* Full screen owns the page's scroll. */
  useEffect(() => {
    if (stage !== 2) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = prev; };
  }, [stage]);

  const onDown = (source: "lip" | "pull") => (event: ReactPointerEvent<HTMLButtonElement>) => {
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* older browsers */ }
    drag.current = {
      source,
      from: stage,
      startY: event.clientY,
      startH: shownH,
      h: shownH,
      startT: performance.now(),
      moved: 0,
      lastY: event.clientY,
      lastT: performance.now(),
      velocity: 0,
    };
    setDragH(shownH);
  };
  const onMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d) return;
    const now = performance.now();
    const dt = Math.max(1, now - d.lastT);
    const instV = (event.clientY - d.lastY) / dt;
    d.velocity = d.velocity * 0.65 + instV * 0.35;
    d.lastY = event.clientY;
    d.lastT = now;
    d.moved = event.clientY - d.startY;
    const cap = Math.max(fullH, measureFull());
    const h = Math.min(cap, Math.max(0, d.startH - d.moved));
    d.h = h;
    if (h > bodyH + 40) setStage2Mounted(true);
    setDragH(h);
  };
  const onUp = () => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    const h = d.h;
    setDragH(null);
    if (Math.abs(d.moved) < 6) {
      /* Tap: the lip cycles down a stage (or opens from closed); the pull
         handle opens Your Schedule. */
      if (d.source === "pull") { goStage(2); return; }
      goStage(d.from === 0 ? 1 : d.from === 1 ? 0 : 1);
      return;
    }
    if (d.from === 2) {
      /* Two-stage close: a hard/fast drag down skips stage 1 entirely;
         a normal swipe down stops at stage 1 with a bounce. Speed is the
         better of the smoothed instantaneous velocity and the gesture's
         average speed — the instantaneous estimate under-reads when
         pointermove events arrive sparsely, while the average stays
         honest for a flick and low for a slow drag or a held pause. */
      const avgV = Math.abs(d.moved) / Math.max(1, performance.now() - d.startT);
      if (d.moved > 40 && Math.max(d.velocity, avgV) > 0.85) { goStage(0); return; }
      if (h < fullH - 50) { goStage(1); return; }
      goStage(2);
      return;
    }
    if (h > bodyH + 70) { goStage(2); return; }
    if (h > bodyH / 2) { goStage(1); return; }
    goStage(0);
  };
  const onKey = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowUp") { event.preventDefault(); goStage(Math.min(2, stage + 1) as Stage); }
    if (event.key === "ArrowDown") { event.preventDefault(); goStage(Math.max(0, stage - 1) as Stage); }
  };

  const cancelDrag = () => { drag.current = null; setDragH(null); };
  const pickDay = (date: string) => {
    goStage(0);
    onPickDay(date);
  };

  const sharedFilters: DrawerFilterState = {
    categories: [],
    times: windowFilter && windowFilter !== "all" ? [windowFilter] : [],
    tags: Array.from(new Set([
      ...Array.from(tags),
      ...(activeTypes ?? []).map(label => eventTypeLabelToTagId(label as (typeof EVENT_TYPE_FILTERS)[number])),
    ].filter(Boolean))),
  };
  const applySharedFilters = (next: DrawerFilterState) => {
    const time = next.times[0] || "all";
    if (time !== windowFilter) onWindow(time);
    const typeLabels = next.tags.map(id => tagIdToEventTypeLabel(id)).filter((label): label is NonNullable<typeof label> => !!label);
    for (const label of EVENT_TYPE_FILTERS) {
      const was = !!activeTypes?.includes(label);
      const isOn = typeLabels.includes(label);
      if (was !== isOn) onToggleType?.(label);
    }
    const sceneTags = next.tags.filter(id => !tagIdToEventTypeLabel(id));
    const current = new Set(tags);
    for (const id of new Set([...current, ...sceneTags])) {
      if (current.has(id) !== sceneTags.includes(id)) onToggleTag(id);
    }
  };

  return (
    <section
      ref={rootRef} data-glass-piece="overlay"
      className={`edrawer pdx-glass-rebind${arriving ? " is-arriving" : ""}${settling ? " is-settling" : ""}${dragH != null ? " is-dragging" : ""}${stage === 2 ? " is-full" : ""}`}
      aria-label="Event filters"
      onKeyDown={event => {
        if (event.key === "Escape" && stage > 0 && !event.defaultPrevented &&
            event.currentTarget.contains(event.target as Node)) {
          if (stage === 2 && rootRef.current?.querySelector(".sch-pop")) return;
          event.preventDefault();
          event.stopPropagation();
          goStage(stage === 2 ? 1 : 0);
        }
      }}
    >
      <button
        type="button"
        className="edrawer__lip"
        ref={lipRef}
        onClick={event => { if (event.detail === 0) goStage(stage === 1 ? 0 : 1); }}
        aria-expanded={stage > 0}
        aria-label={stage === 0 ? "Open filters" : stage === 1 ? "Close filters" : "Back to filters"}
        onPointerDown={onDown("lip")}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={cancelDrag}
        onKeyDown={onKey}
      >
        <span className="edrawer__lines" aria-hidden="true">
          <i /><i /><i />
        </span>
      </button>
      <div className="edrawer__bodywrap" style={{ height: shownH }} inert={stage === 0 && dragH == null}>
        <div className="edrawer__stage1" ref={stage1Ref} hidden={showSchedule} inert={showSchedule}>
          <DrawerTop
            events={upcomingEvents}
            filterGroups={["time", "tag"]}
            selectedDate={selectedDate}
            onSelectDate={onSelectDate}
            filters={sharedFilters}
            onFiltersChange={applySharedFilters}
          />
          <div className="edrawer__filters" role="group" aria-label="Search the board">
            <input
              className="edrawer__search"
              type="text"
              placeholder="SEARCH EVENTS, VENUES, DAYS…"
              aria-label="Search events"
              value={query}
              onChange={e => onQuery(e.target.value)}
            />
            <span className="edrawer__count">{count} EVENTS</span>
            {onTogglePast ? (
              <button
                type="button"
                className={`edrawer__chip${pastView ? " on" : ""}`}
                aria-pressed={pastView}
                onClick={onTogglePast}
              >
                {pastView ? "BACK TO UPCOMING" : "BACK IN TIME"}
              </button>
            ) : null}
          </div>
          {windowChips && windowChips.length > 0 && onPickWindow ? (
            <div className="edrawer__windows" role="group" aria-label="Jump to a date window">
              {windowChips.map(c => (
                <button
                  key={c.key}
                  type="button"
                  className={`edrawer__chip${activeWindow === c.key ? " on" : ""}`}
                  aria-pressed={activeWindow === c.key}
                  onClick={() => onPickWindow(c.key)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          ) : null}
          <NightDrawer/>
          <button
            type="button"
            className="edrawer__pull"
            ref={pullRef}
            onClick={event => { if (event.detail === 0) goStage(2); }}
            onKeyDown={onKey}
            aria-label="Pull up for your schedule"
            onPointerDown={onDown("pull")}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={cancelDrag}
          >
            <span className="edrawer__pull-lines" aria-hidden="true"><i /><i /></span>
            <span className="edrawer__pull-label">YOUR SCHEDULE</span>
            <span className="edrawer__pull-chev" aria-hidden="true">‹</span>
          </button>
        </div>
        {stage2Mounted && scheduleContent ? (
          <div className="edrawer__stage2" hidden={!showSchedule} inert={!showSchedule}>
            <div className="edrawer__stage2-head" aria-hidden="true">YOUR SCHEDULE</div>
            {scheduleContent}
          </div>
        ) : null}
      </div>
    </section>
  );
}
