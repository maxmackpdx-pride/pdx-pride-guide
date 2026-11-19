import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
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
  scheduleContent,
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
}) {
  const [stage, setStage] = useState<Stage>(1);
  const [arriving, setArriving] = useState(true);
  const [settling, setSettling] = useState(false);
  const [dragH, setDragH] = useState<number | null>(null);
  const [bodyH, setBodyH] = useState(0);
  const [fullH, setFullH] = useState(0);
  const [stage2Mounted, setStage2Mounted] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
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
    return Math.max(320, root.getBoundingClientRect().bottom - headerBottom - LIP_H);
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
      if (!s1.hidden) setBodyH(s1.scrollHeight);
      onHeightChange?.(root.offsetHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(s1);
    ro.observe(root);
    return () => ro.disconnect();
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
      if (Math.max(d.velocity, avgV) > 0.85) { goStage(0); return; }
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

  const pickDay = (date: string) => {
    goStage(0);
    onPickDay(date);
  };

  return (
    <section
      ref={rootRef}
      className={`edrawer${arriving ? " is-arriving" : ""}${settling ? " is-settling" : ""}${dragH != null ? " is-dragging" : ""}${stage === 2 ? " is-full" : ""}`}
      aria-label="Event filters"
    >
      <button
        type="button"
        className="edrawer__lip"
        aria-expanded={stage > 0}
        aria-label={stage === 0 ? "Open filters" : stage === 1 ? "Close filters" : "Back to filters"}
        onPointerDown={onDown("lip")}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={onKey}
      >
        <span className="edrawer__lines" aria-hidden="true">
          <i /><i /><i />
        </span>
      </button>
      <div className="edrawer__bodywrap" style={{ height: shownH }} inert={stage === 0 && dragH == null}>
        <div className="edrawer__stage1" ref={stage1Ref} hidden={showSchedule} inert={showSchedule}>
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
          <button
            type="button"
            className="edrawer__pull"
            aria-label="Pull up for your schedule"
            onPointerDown={onDown("pull")}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
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
