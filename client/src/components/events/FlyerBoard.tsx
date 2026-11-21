import { DOW_INDEX, MONTHS, shareEventListing, ROT_CYCLE, weekdayCode, dayColorVar, startMs, dateStrOf, countdownParts, Tape, Hardware, type CellCommon, aspectByPosterUrl, usePosterLoad, PosterCell, DayFlag } from './EventFlyerFront';
import {useHistoryState} from "wouter/use-browser-location";
import {useModalA11y} from "@/hooks/useModalA11y";
import type React from "react";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { listingKey, type EventListing } from "@shared/multiDayEvents";
import {
  getMissedConnectionWindow,
  pacificTodayDate,
  parsePacificDateTime,
} from "@shared/missedConnections";
import { listingPosterUrl } from "@/lib/dsEvent";
import type { EventModalOriginRect } from "../EventModal";
import type { MissedConnectionPost } from "@/components/MissedConnectionsPanel";
import "../board/punk/push-pins.css";
import "./FlyerBoard.css";
import OpenEventCard from "./OpenEventCard";
import { rectOf, type OriginRect } from "@/components/cards/flipCard";
import { connectionsForListing, isPosterActivation } from "./flyerBoardBehavior";

/**
 * The Flyer Board — a faithful port of the approved demo (build_board_v5):
 * same DOM, same geometry, same motion, fed by the live catalog. The board
 * owns the page: its own filter row (ALL / TONIGHT / THIS WEEK / LATER +
 * tag toggles + search), Happening Now / Later / This Weekend rails, the
 * Plan Ahead flow with day flags and Load More, the pile into the past
 * view, the Mizzed fan, and the flip-open card.
 */
export type FlyerBoardProps = {
  /** The whole upcoming pool; the board sections and filters it itself. */
  events: EventListing[];
  /** All past listings; the board keeps the last 7 days for the past view. */
  pastEvents: EventListing[];
  pastView: boolean;
  onEnterPast: () => void;
  onExitPast: () => void;
  /** Opens the full production expanded card (deep actions: post a Mizzed, etc.). */
  onOpen: (listing: EventListing, originRect: EventModalOriginRect | null) => void;
  now: number;
  query: string;
  setQuery: (value: string) => void;
  fday: string;
  setFday: (value: string) => void;
  tags: Set<string>;
  setTags: React.Dispatch<React.SetStateAction<Set<string>>>;
  onClear: () => void;
  /** Reports the board's visible event count (the old filter bar's number)
      to the page, which now shows it inside the bottom filter drawer. */
  onVisibleCount?: (count: number) => void;
};
const DAY_MS = 86_400_000;
const MTOPS = [0, 10, 4, 14, 2, 8, 0, 12, 6, 2];
const PILE_SPOTS: Array<[number, number, number]> = [
  [4, -9, 54],
  [22, 7, 46],
  [60, -6, 48],
  [79, 9, 55],
];
function endMs(e: EventListing): number {
  return parsePacificDateTime(e.dateEnd) ?? startMs(e);
}

function serialOf(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return Math.floor(Date.UTC(y || 1970, (m || 1) - 1, d || 1) / DAY_MS);
}
function dateStrFromSerial(serial: number): string {
  return new Date(serial * DAY_MS).toISOString().slice(0, 10);
}

function timeAgo(iso: string, now: number): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const s = (now - t) / 1000;
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  if (s < 86400 * 365) return `${Math.floor(s / (86400 * 30))}mo ago`;
  return `${Math.floor(s / (86400 * 365))}y ago`;
}

function SubmitCell({ mtop }: { mtop: number }) {
  return (
    <div className="cell submitcell" style={{ marginTop: mtop }}>
      <article
        className="poster submit pdx-glass-rebind"
        style={{ "--a": "var(--neon-cyan)", "--tc": "var(--neon-red)", "--rot": "-0.8deg" } as CSSProperties}
        role="link"
        tabIndex={0}
        aria-label="Submit your event — it's free, takes two minutes"
        onClick={() => {
          window.location.href = "/submit";
        }}
        onKeyDown={ev => {
          if (isPosterActivation(ev.key, ev.target === ev.currentTarget)) window.location.href = "/submit";
        }}
      >
        <div className="pc" style={{ aspectRatio: 0.98 }}>
          <div className="submit-in">
            <div className="plus">+</div>
            <div className="sub-t">SUBMIT YOUR EVENT</div>
            <div className="sub-s">IT'S FREE · TAKES TWO MINUTES</div>
          </div>
        </div>
        <Tape seedKey="submit" />
      </article>
    </div>
  );
}

function PastCell({
  listing,
  index,
  pool,
  isSource,
  onFan,
  tick,
}: CellCommon & {
  listing: EventListing;
  index: number;
  pool: MissedConnectionPost[];
  isSource: boolean;
  onFan: (listing: EventListing, el: HTMLElement | null) => void;
}) {
  const articleRef = useRef<HTMLElement | null>(null);
  const key = listingKey(listing);
  const pinned = index % 2 === 0;
  const rot = ROT_CYCLE[index % ROT_CYCLE.length];
  const dateStr = dateStrOf(listing);
  const dayColor = dayColorVar(dateStr);
  const accent = listing.accentColor || dayColor;
  const poster = listingPosterUrl(listing);
  const [aspect, setAspect] = useState(() => (poster ? aspectByPosterUrl.get(poster) ?? 0.8 : 0.8));
  const [cellRef, loadPoster] = usePosterLoad<HTMLDivElement>(poster);
  const expiry = getMissedConnectionWindow(listing.dateStart, listing.dateEnd, tick)?.closesAt ?? tick;
  const parts = countdownParts(expiry - tick);
  const pill =
    expiry > tick
      ? `POSTING OPEN · ${parseInt(parts.d, 10)}D ${parseInt(parts.h, 10)}H LEFT`
      : "EXPIRED · STILL READABLE";
  return (
    <div ref={cellRef} className={`cell pcell${isSource ? " source" : ""}`}>
      <article
        ref={articleRef}
        className="poster past pdx-glass-rebind"
        style={{ "--a": accent, "--tc": dayColor, "--rot": `${rot}deg` } as CSSProperties}
        role="button"
        tabIndex={0}
        aria-label={`Fan out mizzed connections for ${listing.title}`}
        data-event-id={listing.id}
        data-event-date={dateStr}
        data-venue={listing.venueName}
        onClick={() => onFan(listing, articleRef.current)}
        onKeyDown={ev => {
          if (isPosterActivation(ev.key, ev.target === ev.currentTarget)) {
            ev.preventDefault();
            onFan(listing, articleRef.current);
          }
        }}
      >
        <div className="pc" style={{ aspectRatio: aspect }}>
          {poster && loadPoster ? (
            <img
              src={poster}
              alt=""
              decoding="async"
              onLoad={ev => {
                const im = ev.currentTarget;
                if (im.naturalWidth > 0 && im.naturalHeight > 0) {
                  const ar = im.naturalWidth / im.naturalHeight;
                  if (poster) aspectByPosterUrl.set(poster, ar);
                  setAspect(ar);
                }
              }}
            />
          ) : null}
          <div className={`pmizz${aspect > 1.4 ? " pmizz-wide" : ""}`}>
            <b>{String(pool.length).padStart(2, "0")}</b>
            <i>MIZZED CONNECTIONS</i>
            <span>{pill}</span>
          </div>
        </div>
      </article>
      <Hardware pinned={pinned} seedKey={key} dayColor={dayColor} rot={rot} />
    </div>
  );
}


type WindowFilter = "all" | "tonight" | "week" | "later";
type FlowItem =
  | { kind: "poster"; e: EventListing }
  | { kind: "flag"; dateStr: string }
  | { kind: "submit"; n: number };

export default function FlyerBoard({
  events,
  pastEvents,
  pastView,
  onEnterPast,
  onExitPast,
  onOpen,
  now, query, setQuery, fday, setFday, tags, setTags, onClear, onVisibleCount,
}: FlyerBoardProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [tick, setTick] = useState(now);
  const [budgetRows, setBudgetRows] = useState(4);
  const [cols, setCols] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(min-width: 1100px)").matches ? 5 : 3,
  );
  const [openListing, setOpenListing] = useState<EventListing | null>(null);
  const [openOrigin, setOpenOrigin] = useState<OriginRect | null>(null);
  const [ocardOn, setOcardOn] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const [fan, setFan] = useState<{ listing: EventListing; x: number; y: number } | null>(null);
  const [deckIdx, setDeckIdx] = useState(0);
  const flipElRef = useRef<HTMLElement | null>(null);
  const fanReturnRef = useRef<HTMLElement | null>(null);
  const fanDragX = useRef<number | null>(null);
  const pileDragX = useRef<number | null>(null);
  const pileWheelCool = useRef(false);
  const timersRef = useRef<number[]>([]);


  useEffect(() => {
    setTick(now);
  }, [now]);
  useEffect(() => {
    const t = setInterval(() => setTick(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1100px)");
    const fn = () => setCols(mq.matches ? 5 : 3);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  useEffect(() => () => {
    timersRef.current.forEach(t => window.clearTimeout(t));
  }, []);

  const todayStr = pacificTodayDate(tick);
  const todaySerial = serialOf(todayStr);
  const todayDow = DOW_INDEX[weekdayCode(todayStr)] ?? 0;

  const tagsOf = (e: EventListing): Set<string> => {
    const s = new Set<string>();
    if (e.ageRequirement === "21_PLUS") s.add("21plus");
    if (e.admission === "FREE") s.add("free");
    for (const t of e.eventTypes ?? []) {
      const u = String(t).toUpperCase();
      if (u === "PARTY") s.add("party");
      else if (u === "DRAG") s.add("drag");
      else if (u === "KINK") s.add("kink");
      else if (u === "SOCIAL") s.add("social");
    }
    return s;
  };
  const fdayOf = (e: EventListing): WindowFilter => {
    const diff = serialOf(dateStrOf(e)) - todaySerial;
    if (diff <= 0) return "tonight";
    if (diff <= 7) return "week";
    return "later";
  };
  const passCell = (e: EventListing): boolean => {
    if (fday !== "all" && fdayOf(e) !== fday) return false;
    if (tags.size > 0) {
      const own = tagsOf(e);
      for (const t of tags) if (!own.has(t)) return false;
    }
    // The parent applies the shared event query, including verified age filters.
    return true;
  };

  const weekendSet = useMemo(() => {
    const set = new Set<string>();
    if (todayDow !== 0) {
      const sunday = todaySerial + ((7 - todayDow) % 7);
      for (const s of [sunday - 2, sunday - 1, sunday]) {
        const ds = dateStrFromSerial(s);
        if (ds >= todayStr) set.add(ds);
      }
    }
    return set;
  }, [todaySerial, todayDow, todayStr]);

  const sections = useMemo(() => {
    const nowList: EventListing[] = [];
    const laterList: EventListing[] = [];
    const weekendList: EventListing[] = [];
    const aheadList: EventListing[] = [];
    for (const e of events) {
      const ds = dateStrOf(e);
      const s = startMs(e);
      const running = s <= tick && (endMs(e) > tick || (!e.dateEnd && ds === todayStr));
      if (running) nowList.push(e);
      else if (ds === todayStr && s > tick) laterList.push(e);
      if (!running && s > tick && weekendSet.has(ds)) weekendList.push(e);
      if (ds > todayStr) aheadList.push(e);
    }
    return { nowList, laterList, weekendList, aheadList };
  }, [events, tick, todayStr, weekendSet]);

  const visibleNow = sections.nowList.filter(passCell);
  const visibleLater = sections.laterList.filter(passCell);
  const visibleWeekend = sections.weekendList.filter(passCell);

  const flowData = useMemo(() => {
    const eligible = sections.aheadList.filter(passCell);
    const marks = new Set([
      1,
      Math.max(2, Math.floor(eligible.length / 2)),
      Math.max(3, Math.floor(eligible.length * 0.8)),
    ]);
    const flow: FlowItem[] = [];
    let lastDate = "";
    let posterCount = 0;
    let submitN = 0;
    for (const e of eligible) {
      const ds = dateStrOf(e);
      if (ds !== lastDate) {
        flow.push({ kind: "flag", dateStr: ds });
        lastDate = ds;
      }
      flow.push({ kind: "poster", e });
      posterCount++;
      if (marks.has(posterCount)) flow.push({ kind: "submit", n: submitN++ });
    }
    const budget = budgetRows * cols;
    let slots = 0;
    let shownPosters = 0;
    const shownGroups = new Set<string>();
    const vis: boolean[] = [];
    for (const item of flow) {
      const visible = item.kind !== "flag" && slots < budget;
      vis.push(visible);
      if (!visible) continue;
      slots++;
      if (item.kind === "poster") {
        shownPosters++;
        shownGroups.add(dateStrOf(item.e));
      }
    }
    flow.forEach((item, i) => {
      if (item.kind === "flag") vis[i] = shownGroups.has(item.dateStr);
    });
    return {
      eligible,
      flow,
      vis,
      shownPosters,
      remaining: eligible.length - shownPosters,
    };
  }, [sections.aheadList, passCell, budgetRows, cols]);

  const pastList = useMemo(
    () =>
      pastEvents
        .filter(e => startMs(e) > tick - 7 * DAY_MS)
        .sort((a, b) => startMs(b) - startMs(a)),
    [pastEvents, tick],
  );

  const mcQuery = useQuery<MissedConnectionPost[]>({
    queryKey: ["/api/missed-connections"],
    queryFn: () => apiRequest("GET", "/api/missed-connections").then(r => r.json()),
    enabled: pastView,
    staleTime: 60_000,
  });
  const mcFor = (e: EventListing): MissedConnectionPost[] =>
    connectionsForListing(mcQuery.data ?? [], e.id, e.venueName);
  const mcTotal = useMemo(() => {
    const ids = new Set<number>();
    for (const e of pastList) for (const p of mcFor(e)) ids.add(p.id);
    return ids.size;
  }, [pastList, mcFor]);


  /* ----- open card (demo flip) ----- */
  const clearTimers = () => {
    timersRef.current.forEach(t => window.clearTimeout(t));
    timersRef.current = [];
  };
  const later = (fn: () => void, ms: number) => {
    timersRef.current.push(window.setTimeout(fn, ms));
  };
  const historyState = useHistoryState() as {flyerPoster?:{id:number;date:string}}|null;
  const openCard = (listing: EventListing, el: HTMLElement | null) => {
    clearTimers();
    setFan(null);
    setOpenListing(listing);
    if (!window.history.state?.flyerPoster) {
      window.history.pushState({ ...window.history.state, flyerPoster: { id: listing.id, date: dateStrOf(listing) } }, "", window.location.href);
    }
    flipElRef.current = el;
    setOpenOrigin(rectOf(el));
    // Tucker, Nov 20: a tapped event opens straight into the sheet, not the centered preview.
    setOcardOn(true);
  };
  const closeCard = (fromHistory = false) => {
    if (!fromHistory && window.history.state?.flyerPoster) { window.history.back(); return; }
    setOcardOn(false);
    const p = flipElRef.current;
    flipElRef.current = null;
    requestAnimationFrame(() => p?.isConnected && p.focus({ preventScroll: true }));
    setOpenListing(null);
  };
  useEffect(() => {
    const selection = historyState?.flyerPoster;
    if (!selection) {
      if (openListing) closeCard(true);
      return;
    }
    if (openListing?.id === selection.id && dateStrOf(openListing) === selection.date) return;
    const listing = [...events, ...pastEvents].find(row => row.id===selection.id && dateStrOf(row)===selection.date);
    if (!listing) return;
    const origin = rootRef.current?.querySelector<HTMLElement>(`[data-event-id="${selection.id}"][data-event-date="${selection.date}"]`);
    openCard(listing, origin ?? null);
  }, [historyState, events, pastEvents, openListing, ocardOn]);

  /* ----- fan deck ----- */
  const closeFan = () => {
    setFan(null);
    if (fanReturnRef.current) {
      fanReturnRef.current.focus({ preventScroll: true });
      fanReturnRef.current = null;
    }
  };
  const fanDialog = useModalA11y({open:!!fan,onClose:closeFan});
  const openFan = (listing: EventListing, el: HTMLElement | null) => {
    if (fan && listingKey(fan.listing) === listingKey(listing)) {
      closeFan();
      return;
    }
    const rect = el?.getBoundingClientRect();
    fanReturnRef.current = el;
    setFan({
      listing,
      x: rect ? rect.left + rect.width / 2 : window.innerWidth / 2,
      y: rect ? rect.top + rect.height / 2 : 320,
    });
    setDeckIdx(0);
  };
  const fanPool = fan ? mcFor(fan.listing) : [];
  const fanCount = Math.max(1, fanPool.length);
  const stepDeck = (d: number) => setDeckIdx(i => (i + d + fanCount) % fanCount);
  useEffect(() => {
    if (!fan) return;
    const onKey = (ev: KeyboardEvent) => {
      const target = ev.target as HTMLElement | null;
      if (target && /INPUT|TEXTAREA|SELECT/.test(target.tagName || "")) return;
      if (ev.key === "ArrowRight") {
        ev.preventDefault();
        stepDeck(1);
      } else if (ev.key === "ArrowLeft") {
        ev.preventDefault();
        stepDeck(-1);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [fan, closeFan, stepDeck]);

  /* ----- reveal on scroll (demo) ----- */
  const revealKey = [
    pastView ? "past" : "main",
    fday,
    [...tags].sort().join("."),
    query,
    budgetRows,
    cols,
    visibleNow.length,
    visibleLater.length,
    visibleWeekend.length,
    flowData.shownPosters,
    pastList.length,
  ].join("|");
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const cells = Array.from(root.querySelectorAll<HTMLElement>(".cell"));
    cells.forEach((c, i) => {
      c.style.transitionDelay = `${(i % cols) * 50}ms`;
    });
    if (!("IntersectionObserver" in window)) {
      cells.forEach(c => c.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      es =>
        es.forEach(en => {
          if (en.isIntersecting) {
            (en.target as HTMLElement).classList.add("in");
            io.unobserve(en.target);
          }
        }),
      { threshold: 0.05 },
    );
    cells.forEach(c => {
      if (!c.classList.contains("in")) io.observe(c);
    });
    const fallback = window.setTimeout(() => cells.forEach(c => c.classList.add("in")), 1800);
    return () => {
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, [revealKey, cols]);

  const clearFilters = () => {
    onClear();
    setFday("all");
    setTags(new Set());
    setQuery("");
    setBudgetRows(4);
  };

  const todayLabel = `${weekdayCode(todayStr)} ${MONTHS[Number(todayStr.split("-")[1]) - 1]} ${Number(todayStr.split("-")[2])}`;
  const totalCount = visibleNow.length + visibleLater.length + visibleWeekend.length + flowData.shownPosters;
  const lastEligible = flowData.eligible[flowData.eligible.length - 1];
  const endLabel = lastEligible
    ? `${MONTHS[Number(dateStrOf(lastEligible).split("-")[1]) - 1]} ${Number(dateStrOf(lastEligible).split("-")[2])}`
    : "";

  const renderRailCell = (e: EventListing, i: number) => (
    <PosterCell
      key={listingKey(e)}
      listing={e}
      index={i}
      mtop={0}
      rail
      onOpenCard={openCard}
      tick={tick}
    />
  );

  const flowCells: React.ReactNode[] = [];
  for (const [i, item] of flowData.flow.entries()) {
    if (!flowData.vis[i] || item.kind === "flag") continue;
    const flowPos = flowCells.length;
    const mtop = MTOPS[flowPos % MTOPS.length];
    if (item.kind === "submit") {
      flowCells.push(<SubmitCell key={`submit-${item.n}`} mtop={mtop} />);
      continue;
    }
    flowCells.push(
      <PosterCell
        key={listingKey(item.e)}
        listing={item.e}
        showDayFlag={flowData.flow[i - 1]?.kind === "flag"}
        index={flowPos}
        mtop={mtop}
        onOpenCard={openCard}
        tick={tick}
      />
    );
  }

  const pastFlow: React.ReactNode[] = [];
  {
    let lastDate = "";
    pastList.forEach((e, i) => {
      const ds = dateStrOf(e);
      if (ds !== lastDate) {
        pastFlow.push(<DayFlag key={`pflag-${ds}`} dateStr={ds} />);
        lastDate = ds;
      }
      pastFlow.push(
        <PastCell
          key={listingKey(e)}
          listing={e}
          index={i}
          pool={mcFor(e)}
          isSource={!!fan && listingKey(fan.listing) === listingKey(e)}
          onFan={openFan}
          tick={tick}
        />,
      );
    });
  }

  const pileMinis = pastList.filter(e => listingPosterUrl(e)).slice(0, 4);


  /* The board's filter row moved into the page's bottom filter drawer
     (EventsFilterDrawer); the board reports its visible count up and takes
     day jumps over the `zaylist:board-day` window event. */
  useEffect(() => {
    onVisibleCount?.(pastView ? pastList.length : totalCount);
  }, [onVisibleCount, pastView, pastList.length, totalCount]);

  const jumpRef = useRef<(date: string) => boolean>(() => false);
  useLayoutEffect(() => {
    jumpRef.current = (date: string): boolean => {
      const root = rootRef.current;
      if (!root) return true;
      const scrollToEl = (el: HTMLElement) => {
        const y = el.getBoundingClientRect().top + window.scrollY - 88;
        window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
      };
      if (pastView) {
        const cell = root.querySelector<HTMLElement>(`.pastboard [data-event-date="${date}"]`);
        if (cell) { scrollToEl(cell); return true; }
        const head = root.querySelector<HTMLElement>(".pasthead");
        if (head) { scrollToEl(head); return true; }
        return false;
      }
      if (date <= todayStr) {
        const first = root.querySelector<HTMLElement>(".bandsec, .futurezone");
        if (first) { scrollToEl(first); return true; }
        return false;
      }
      /* Future date: grow the Plan Ahead budget until that date's group is
         on the board, then land on its first card (under its day flag). */
      let slots = 0;
      let needed = 0;
      for (const item of flowData.flow) {
        if (item.kind === "flag") continue;
        slots++;
        if (item.kind === "poster" && dateStrOf(item.e) === date) needed = slots;
      }
      if (needed === 0) {
        const zone = root.querySelector<HTMLElement>(".futurezone");
        if (zone) { scrollToEl(zone); return true; }
        return false;
      }
      const rows = Math.ceil(needed / cols);
      if (rows > budgetRows) { setBudgetRows(rows); return false; }
      const cell = root.querySelector<HTMLElement>(`.futurezone [data-event-date="${date}"]`);
      if (cell) { scrollToEl(cell); return true; }
      return false;
    };
  });
  useEffect(() => {
    const onDay = (ev: Event) => {
      const date = (ev as CustomEvent<{ date?: string }>).detail?.date;
      if (!date) return;
      const attempt = (tries = 0) => {
        if (jumpRef.current(date)) return;
        if (tries < 30) window.setTimeout(() => attempt(tries + 1), 100);
      };
      attempt();
    };
    window.addEventListener("zaylist:board-day", onDay);
    return () => window.removeEventListener("zaylist:board-day", onDay);
  }, []);

  return (
    <div className="fbx" ref={rootRef}>
      <div className="fbx-content">
        {pastView ? (
          <div>
            <div className="pasthead">
              <button type="button" className="pastback" onClick={onExitPast}>
                ← BACK TO UPCOMING
              </button>
              <div className="mizzlogo">
                <svg viewBox="0 0 48 48" aria-hidden="true">
                  <path
                    d="M8 5h32a7 7 0 0 1 7 7v19a7 7 0 0 1-7 7H23l-10 9v-9H8a7 7 0 0 1-7-7V12a7 7 0 0 1 7-7z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path d="M24 14v16M16 22h16" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                </svg>
                <div>
                  <b>MIZZED</b>
                  <i>CONNECTIONS</i>
                </div>
              </div>
              <p className="pastsub">
                LAST 7 DAYS · {pastList.length} EVENTS · {mcTotal} MIZZED CONNECTIONS
                <br />
                POSTERS SIT IN GREY — HOVER BRINGS THE COLOR BACK
                <br />
                TAP A POSTER TO FAN ITS CONNECTIONS OUT · SORT THEM WITH THE ARROWS
              </p>
            </div>
            <div className={`lboard pastboard${fan ? " away" : ""}`}>{pastFlow}</div>
          </div>
        ) : (
          <div>
            {visibleNow.length > 0 && (
              <div className="bandsec bandsec--scaled" id="happening-now">
                <div className="board-h">
                  <span className="livedot" />
                  <h3>HAPPENING NOW</h3>
                  <span className="bcount">{todayLabel}</span>
                </div>
                <div className="rail">{visibleNow.map(renderRailCell)}</div>
              </div>
            )}
            {visibleLater.length > 0 && (
              <div className="bandsec bandsec--scaled" id="happening-later">
                <div className="board-h">
                  <span className="tick-y" />
                  <h3>HAPPENING LATER</h3>
                  <span className="bcount">LATER TODAY</span>
                </div>
                <div className="rail">{visibleLater.map(renderRailCell)}</div>
              </div>
            )}
            {visibleWeekend.length > 0 && (
              <div className="bandsec bandsec--scaled" id="this-weekend">
                <div className="board-h">
                  <span className="wkdot" />
                  <h3>HAPPENING THIS WEEKEND</h3>
                </div>
                <div className="rail">{visibleWeekend.map(renderRailCell)}</div>
              </div>
            )}
            <div className="futurezone" id="plan-ahead">
              <div className="board-h">
                <span className="tick" />
                <h3>PLAN AHEAD</h3>
                <span className="bcount">
                  {flowData.shownPosters} OF {flowData.eligible.length} POSTERS · 4 ROWS AT A TIME
                </span>
              </div>
              <div className="lboard">{flowCells}</div>
              <div className={`empty${flowData.eligible.length === 0 ? " on" : ""}`}>
                <h4>NOTHING ON THE BOARD MATCHES</h4>
                <p>Check your filters or your spelling — or clear everything and start over.</p>
                <button type="button" onClick={clearFilters}>
                  CLEAR FILTERS
                </button>
              </div>
              <button
                type="button"
                className={`lmore${flowData.remaining > 0 ? " on" : ""}`}
                onClick={() => setBudgetRows(r => r + 4)}
              >
                <b>LOAD MORE · {flowData.remaining} MORE POSTERS</b>
                <small>4 MORE ROWS · THE BOARD RUNS 6 MONTHS OUT</small>
              </button>
              <div className={`lend${flowData.remaining === 0 && flowData.eligible.length > 0 ? " on" : ""}`}>
                END OF THE BOARD · EVERYTHING THROUGH {endLabel}
              </div>
            </div>
            <div
              className="pilewrap"
              role="button"
              tabIndex={0}
              aria-label="Go back in time — past 7 days of mizzed connections"
              onClick={onEnterPast}
              onKeyDown={ev => {
                if (isPosterActivation(ev.key, ev.target === ev.currentTarget)) onEnterPast();
              }}
              onPointerDown={ev => {
                pileDragX.current = ev.clientX;
              }}
              onPointerUp={ev => {
                if (pileDragX.current !== null && ev.clientX - pileDragX.current > 50) onEnterPast();
                pileDragX.current = null;
              }}
              onWheel={ev => {
                if (Math.abs(ev.deltaX) > 40 && !pileWheelCool.current) {
                  pileWheelCool.current = true;
                  onEnterPast();
                  window.setTimeout(() => {
                    pileWheelCool.current = false;
                  }, 1200);
                }
              }}
            >
              <div className="pile">
                {pileMinis.map((e, i) => (
                  <span
                    key={listingKey(e)}
                    className="pilemini"
                    style={{
                      left: `${PILE_SPOTS[i][0]}%`,
                      top: `${PILE_SPOTS[i][2]}%`,
                      transform: `translateY(-50%) rotate(${PILE_SPOTS[i][1]}deg)`,
                    }}
                  >
                    <img src={listingPosterUrl(e)} alt="" />
                  </span>
                ))}
                <div className="magcard">
                  <svg viewBox="0 0 120 60" aria-hidden="true">
                    <path d="M18 36 Q60 24 96 32" stroke="#fff" strokeWidth="4.5" fill="none" strokeLinecap="round" strokeDasharray="0.5 10" />
                    <path d="M84 16 L104 31 L82 44" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="17" cy="37" r="7.5" fill="#fff" />
                  </svg>
                  <div className="mag-t">GO BACK IN TIME</div>
                  <div className="mag-s">PAST 7 DAYS · MIZZED CONNECTIONS</div>
                </div>
              </div>
              <p className="pile-cap">THE PILE · SWIPE ACROSS IT, DRAG IT, TWO-FINGER SWIPE IT — OR JUST CLICK IT</p>
            </div>
          </div>
        )}
      </div>

      {/* Fan deck + open card render in a body portal: the events page
          flattens its children into a single z-index-2 layer, which let
          the close seam and page chrome paint over the fixed card. */}
      {mounted &&
        createPortal(
          <div className="fbx fbx-overlay">
            <div
              className={`fanLayer${fan ? " on" : ""}`}
              ref={fanDialog} role={fan?"dialog":undefined} aria-modal={fan?true:undefined}
              aria-label={fan?`Mizzed connections for ${fan.listing.venueName}`:undefined}
        onClick={ev => {
          if (ev.target === ev.currentTarget) closeFan();
        }}
      >
        {fan && (
          <>
            <div
              className="deck"
              style={{ left: fan.x, top: fan.y }}

              onPointerDown={ev => {
                fanDragX.current = ev.clientX;
              }}
              onPointerUp={ev => {
                if (fanDragX.current === null) return;
                const dx = ev.clientX - fanDragX.current;
                fanDragX.current = null;
                if (dx < -40) stepDeck(1);
                else if (dx > 40) stepDeck(-1);
              }}
            >
              {fanPool.length === 0 ? (
                <div className="fancard" style={{ opacity: 1, transform: "translate(-50%,-50%)" }}>
                  <span className="fc-quote">&ldquo;</span>
                  <div className="fc-title">No mizzed connections yet</div>
                  <p className="fc-body">
                    Nobody has posted one for {fan.listing.venueName} from this night. Be the first — posts stay
                    readable after they expire.
                  </p>
                  <div className="fc-foot">
                    <span className="fc-loc">● {fan.listing.venueName}</span>
                    <span className="fc-meta">BE THE FIRST</span>
                  </div>
                </div>
              ) : (
                fanPool.map((post, i) => {
                  const off = i - deckIdx;
                  const a = Math.abs(off);
                  const style: CSSProperties =
                    a > 2
                      ? {
                          opacity: 0,
                          pointerEvents: "none",
                          zIndex: 1,
                          transform: `translate(-50%,-50%) rotate(${off * 9}deg) translateX(${off * 36}%) scale(.78)`,
                        }
                      : {
                          opacity: a === 0 ? 1 : a === 1 ? 0.95 : 0.8,
                          filter: a === 0 ? "none" : `brightness(${a === 1 ? 0.7 : 0.48})`,
                          zIndex: 30 - a,
                          transform: `translate(-50%,-50%) rotate(${off * 9}deg) translateX(${off * 36}%) scale(${1 - a * 0.07})`,
                        };
                  const venue = post.venueHint || post.placeName || post.eventVenue || fan.listing.venueName;
                  const meta = `${post.anonymous ? "Anonymous" : "Posted"}${post.createdAt ? ` · ${timeAgo(post.createdAt, tick)}` : ""}`;
                  return (
                    <div
                      key={post.id}
                      inert={off!==0}
                      className="fancard"
                      style={style}
                      aria-hidden={off !== 0}
                      onClick={ev => {
                        ev.stopPropagation();
                        if (i !== deckIdx) setDeckIdx(i);
                      }}
                    >
                      {post.isDemo ? <span className="fc-demo">DEMO</span> : null}
                      <span className="fc-quote">&ldquo;</span>
                      {post.title ? <div className="fc-title">{post.title}</div> : null}
                      <p className="fc-body">{post.body}</p>
                      <div className="fc-foot">
                        <span className="fc-loc">● {venue}</span>
                        <span className="fc-meta">{meta}</span>
                      </div>
                      <div className="fc-actions">
                        <button
                          type="button"
                          className="fc-msg"
                          onClick={ev => {
                            ev.stopPropagation();
                            const target = fan.listing;
                            closeFan();
                            onOpen(target, null);
                          }}
                        >
                          MESSAGE →
                        </button>
                        <button
                          type="button"
                          className="fc-share"
                          onClick={async ev => {
                            ev.stopPropagation();
                            await shareEventListing(fan.listing);
                          }}
                        >
                          SHARE
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
              <div className="decknav">
                <button type="button" className="dnav" aria-label="Previous connection" disabled={fanCount < 2} onClick={ev => { ev.stopPropagation(); stepDeck(-1); }}>
                  ‹
                </button>
                <span className="dcount" aria-live="polite">
                  {deckIdx + 1} / {fanCount}
                </span>
                <button type="button" className="dnav" aria-label="Next connection" disabled={fanCount < 2} onClick={ev => { ev.stopPropagation(); stepDeck(1); }}>
                  ›
                </button>
              </div>
            </div>
            <button type="button" className="dfan-close" aria-label="Close mizzed connections" onClick={closeFan}>
              ×
            </button>
          </>
        )}
      </div>

      {/* open card */}
{openListing && ocardOn && (
        <OpenEventCard
          key={listingKey(openListing)}
          listing={openListing}
          related={events}
          originRect={openOrigin}
          onClose={() => closeCard()}
        />
      )}
          </div>,
          document.body,
        )}
    </div>
  );
}
