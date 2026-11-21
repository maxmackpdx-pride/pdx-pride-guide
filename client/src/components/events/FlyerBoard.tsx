import { EventFrontStage, DOW_INDEX, MONTHS, shareEventListing, ROT_CYCLE, weekdayCode, dayColorVar, startMs, dateStrOf, countdownParts, ShareIcon, Tape, Hardware, type CellCommon, aspectByPosterUrl, usePosterLoad, PosterCell, DayFlag } from './EventFlyerFront';
import { CardStage } from "@/components/cards/CardStage";
import { eventAge, eventPrice } from "@/lib/eventFacts";
import { EventGoingButton, EventInterestedHeart, EventPrivateSaveButton, EventReadStatus } from "./EventParticipation";
import EventPlanning from "./EventPlanning";
import { EventHostNotice } from "./EventHostNotice";
import {useHistoryState} from "wouter/use-browser-location";
import {useAuth} from "@/context/AuthContext";
import {useModalA11y} from "@/hooks/useModalA11y";
import {sharePageLink,shareToastTitle} from "@/lib/shareEvent";
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
  pacificCalendarDate,
  pacificTodayDate,
  parsePacificDateTime,
} from "@shared/missedConnections";
import { listingPosterUrl } from "@/lib/dsEvent";
import { eventDateLabel, eventTimeLabel } from "@/lib/eventDisplay";
import { eventPath } from "@shared/eventSlug";
import { placePath } from "@shared/placeSlug";
import type { EventModalOriginRect } from "../EventModal";
import type { MissedConnectionPost } from "@/components/MissedConnectionsPanel";
import "../board/punk/push-pins.css";
import "./FlyerBoard.css";
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
const OPAGE_NAMES = ["INFO", "FEED", "MAPS", "MORE + NEARBY", "PEOPLE"];
const OPAGE_LABELS = ["INFO", "FEED", "MAPS", "MORE", "PEOPLE"];
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

type EventDetailResponse = {
  event?: {
    description?: string | null;
    isClaimable?: boolean;
    hasPendingClaim?: boolean;
    ticketUrl?: string | null;
  } | null;
  /** Only present when the server passes this viewer through the source
   *  link gate (admins / promoters / owner); absent for everyone else. */
  sourceLink?: string | null;
  hostGroup?: { slug?: string | null; name?: string | null } | null;
  venue?: {
    id?: number;
    address?: string | null;
    neighborhood?: string | null;
    lat?: number | null;
    lng?: number | null;
  } | null;
  hosts?: Array<{ displayName?: string | null; username?: string | null; role?: string | null }>;
  talent?: Array<{ userId?: number; addedByUserId?: number | null; displayName?: string | null; username?: string | null; role?: string | null }>;
  gigs?: Array<{ id?: number | string; title?: string | null; description?: string | null }>;
  missedConnections?: unknown[];
  nearby?: {
    restaurants?: Array<{ name?: string | null; type?: string | null }>;
    events?: Array<{ id?: number; title?: string | null; venueName?: string | null; dateStart?: string | null }>;
  } | null;
};

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
  const [frontShowing, setFrontShowing] = useState(false);
  const [openListing, setOpenListing] = useState<EventListing | null>(null);
  const [ocardOn, setOcardOn] = useState(false);
  const [opage, setOpage] = useState(0);
  const [oday, setOday] = useState(0);
  const pagesRef = useRef<HTMLDivElement | null>(null);
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

  const {user: viewer} = useAuth();
  const detailQuery = useQuery<EventDetailResponse>({
    queryKey: ["/api/events", openListing?.id, "detail", viewer?.id, openListing && dateStrOf(openListing)],
    queryFn: () => apiRequest("GET", `/api/events/${openListing!.id}/detail?date=${encodeURIComponent(dateStrOf(openListing!))}`).then(r => r.json()),
    enabled: !!openListing,
    staleTime: 60_000,
  });

  /* ----- open card (demo flip) ----- */
  const clearTimers = () => {
    timersRef.current.forEach(t => window.clearTimeout(t));
    timersRef.current = [];
  };
  const later = (fn: () => void, ms: number) => {
    timersRef.current.push(window.setTimeout(fn, ms));
  };
  const goOpage = (i: number) => {
    const el = pagesRef.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };
  useEffect(() => {
    if (pagesRef.current) pagesRef.current.scrollLeft = 0;
  }, [openListing]);
  const historyState = useHistoryState() as {flyerPoster?:{id:number;date:string}}|null;
  const shareOpen = () => { if(openListing) void shareEventListing(openListing); };
  const openCard = (listing: EventListing, el: HTMLElement | null) => {
    clearTimers();
    setFan(null);
    setOpage(0);
    setOday(0);
    setOpenListing(listing);
    if (!window.history.state?.flyerPoster) {
      window.history.pushState({ ...window.history.state, flyerPoster: { id: listing.id, date: dateStrOf(listing) } }, "", window.location.href);
    }
    flipElRef.current = el;
    // Tucker, Nov 20: a tapped event opens straight into the sheet, not the centered preview.
    setFrontShowing(false);
    setOcardOn(true);
  };
  const expandFront = () => {
    setFrontShowing(false);
    setOcardOn(true);
  };
  const closeCard = (fromHistory = false) => {
    if (!fromHistory && window.history.state?.flyerPoster) { window.history.back(); return; }
    setFrontShowing(false);
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
  const posterDialog = useModalA11y({open:ocardOn,onClose:()=>closeCard()});

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

  const openAccent = openListing ? openListing.accentColor || dayColorVar(dateStrOf(openListing)) : "var(--neon-red)";
  const [failedOpenPoster, setFailedOpenPoster] = useState<string>();
  const openPosterUrl = openListing ? listingPosterUrl(openListing) : null;
  const openPoster = openPosterUrl === failedOpenPoster ? null : openPosterUrl;
  const openCd = openListing ? countdownParts(startMs(openListing) - tick) : null;
  const openRunning = openListing
    ? startMs(openListing) <= tick && (endMs(openListing) > tick || (!openListing.dateEnd && dateStrOf(openListing) === todayStr))
    : false;
  const openCdText = openListing
    ? openRunning
      ? "ON NOW"
      : `STARTS IN ${
          Number(openCd!.d) > 0
            ? `${Number(openCd!.d)}D ${Number(openCd!.h)}H`
            : Number(openCd!.h) > 0
              ? `${Number(openCd!.h)}H ${Number(openCd!.m)}M`
              : `${Number(openCd!.m)}M`
        }`
    : "";
  const venueId = detailQuery.data?.venue?.id;
  const venueQuery = useQuery<{ promoters?: { id: number; displayName?: string; username: string }[] }>({
    queryKey: ["/api/placez", venueId, "card-extras"],
    queryFn: () => apiRequest("GET", `/api/placez/${venueId}`).then(r => r.json()),
    enabled: !!venueId,
    staleTime: 300_000,
  });
  const detailStatus = <EventReadStatus label="Event details" query={detailQuery} />;
  const mizzCount = detailQuery.data?.missedConnections?.length;
  const detailEvent = detailQuery.data?.event ?? null;
  const detailVenue = detailQuery.data?.venue ?? null;
  const hosts = detailQuery.data?.hosts ?? [];
  const talent = detailQuery.data?.talent ?? [];
  const nearbyR = detailQuery.data?.nearby?.restaurants ?? [];
  const nearbyE = detailQuery.data?.nearby?.events ?? [];
  const openAddr = detailVenue?.address || openListing?.address || "";
  const openDesc = detailEvent?.description || openListing?.description || "";
  const openTicket = detailEvent?.ticketUrl || openListing?.ticketUrl || "";
  /* The detail payload carries sourceLink only when the server's gate
   * passed for this viewer (admins / promoters / owner) — rendering it
   * here inherits the gate exactly; everyone else never receives it. */
  const openSourceLink = /^https?:\/\//i.test(detailQuery.data?.sourceLink || "") ? (detailQuery.data?.sourceLink as string) : "";
  const openHostGroup = detailQuery.data?.hostGroup ?? null;
  const openClaimable = detailEvent?.isClaimable ?? openListing?.isClaimable ?? false;
  const openPending = detailEvent?.hasPendingClaim ?? Boolean((openListing as { hasPendingClaim?: boolean } | null)?.hasPendingClaim);
  const openLat = detailVenue?.lat ?? openListing?.lat ?? null;
  const openLng = detailVenue?.lng ?? openListing?.lng ?? null;
  const pinX = openLng != null ? Math.min(92, Math.max(8, ((openLng + 122.85) / 0.4) * 100)) : 50;
  const pinY = openLat != null ? Math.min(88, Math.max(10, ((45.65 - openLat) / 0.2) * 100)) : 50;
  const dirDest = encodeURIComponent(
    `${openAddr ? `${openAddr}, ` : ""}${openListing?.venueName ?? ""}, Portland, OR`,
  );
  const openCdLabel = openCdText === "ON NOW" ? "HAPPENING" : openCdText.startsWith("ENDS") ? "ENDS IN" : "STARTS IN";
  const openCdNums = openCdText.replace(/^(STARTS IN|ENDS IN)\s*/, "") || "ON NOW";
  /* More-at-venue strip: the open event's venue, day by day, for the 7
   * days starting on the event's own day (same shape as the expanded
   * card's strip on the event page). */
  const openStrip = useMemo(() => {
    type StripDay = { ds: string; dow: string; num: number; items: EventListing[] };
    if (!openListing) return [] as StripDay[];
    const start = dateStrOf(openListing);
    const [sy, sm, sd] = start.split("-").map(Number);
    const out: StripDay[] = [];
    for (let i = 0; i < 7; i++) {
      const ds = new Date(Date.UTC(sy, sm - 1, sd + i)).toISOString().slice(0, 10);
      const items = events
        .filter(e2 => e2.id !== openListing.id && e2.venueName === openListing.venueName && dateStrOf(e2) === ds)
        .sort((a, b) => a.dateStart.localeCompare(b.dateStart));
      out.push({ ds, dow: weekdayCode(ds), num: Number(ds.slice(8, 10)), items });
    }
    return out;
  }, [openListing, events]);

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
      {openListing && frontShowing && <EventFrontStage listing={openListing} onClose={() => closeCard()} onExpand={expandFront} />}
      {openListing && ocardOn && <CardStage className="fbx" onClose={() => closeCard()}>
        <div
          className={`ocard${ocardOn ? " on" : ""}`} ref={posterDialog} inert={!ocardOn}
          style={{ "--a": openAccent } as CSSProperties}
          role="dialog"
          aria-modal="true"
          aria-label={openListing.title}
        >
          <button type="button" className="ox" aria-label="Close event" onClick={()=>closeCard()}>✕</button>
          {/* Poster layer (Tucker, t277): natural aspect from the card top, behind
              the locked head AND the scroller, fading out at its own bottom edge. */}
          <div className="ohero">
              {openPoster ? (
                <img src={openPoster} alt="" onError={() => setFailedOpenPoster(openPoster)} />
              ) : (
                <div
                  className="ohero-typo"
                  style={{ background: `linear-gradient(160deg, ${openAccent} 0%, var(--evz-ink-0a0a0e) 78%)` }}
                >
                  <div className="typo-t">{openListing.title}</div>
                  <div className="typo-v" style={{ color: openAccent }}>
                    {openListing.venueName.toUpperCase()}
                  </div>
                </div>
              )}
            </div>
          <div className="ohead">
            <div className="oid">
              <h2>{openListing.title}</h2>
              <p className="ometa">
                {eventDateLabel(openListing.dateStart)} · {eventTimeLabel(openListing.dateStart)}
                {"\n"}
                {detailVenue?.id ? (
                  <a className="ovenue" href={placePath(detailVenue.id, openListing.venueName)} aria-label={`Open ${openListing.venueName} place card`}>
                    {openListing.venueName}
                  </a>
                ) : openListing.venueName}
              </p>
              <div className="ochips">
                <span className="ochip">{eventAge(openListing.ageRequirement)==="Not stated"?"Age not stated":eventAge(openListing.ageRequirement)}</span>
                {openListing.isSexPositive ? <span className="ochip">SEX-POSITIVE</span> : null}
                <span className="ochip">{openCdText}</span>
              </div>
            </div>
            <div className="otabs" role="tablist" aria-label="Event card pages">
              {OPAGE_NAMES.map((n, i) => (
                <button
                  key={n}
                  type="button"
                  role="tab"
                  aria-selected={opage === i}
                  className={opage === i ? "on" : ""}
                  onClick={() => goOpage(i)}
                >
                  {n}
                </button>
              ))}
            </div>
            </div>
          <div className="oscrollarea">
            <EventGoingButton eventId={openListing.id} past={!!openListing.dateEnd && endMs(openListing) < tick} poster />
            <div
              className="opages"
              ref={pagesRef}
              onScroll={e => {
                const el = e.currentTarget;
                const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
                if (i !== opage) setOpage(i);
              }}
            >
              <section className="opage" inert={opage!==0} aria-hidden={opage!==0} aria-label="Info">
                <p className="osec">EVENT DETAILS</p>
                <div className="ostarts">
                  <i>{openCdLabel}</i>
                  <b>{openCdNums}</b>
                </div>
                <div className="okv">
                  <span className="ok">WHEN</span>
                  <span>
                    {eventDateLabel(openListing.dateStart)} · {eventTimeLabel(openListing.dateStart)}
                  </span>
                </div>
                <div className="okv">
                  <span className="ok">WHERE</span>
                  <span>
                    {detailVenue?.id ? (
                      <a className="ovenue" href={placePath(detailVenue.id, openListing.venueName)}>
                        {openListing.venueName}
                      </a>
                    ) : (
                      openListing.venueName
                    )}
                    {openAddr ? (
                      <>
                        <br />
                        {openAddr}
                      </>
                    ) : null}
                  </span>
                </div>
                {openHostGroup?.name ? (
                  <div className="okv">
                    <span className="ok">HOSTED BY</span>
                    <span>
                      {openHostGroup.slug ? (
                        <a className="ovenue" href={`/z/${openHostGroup.slug}`}>
                          {openHostGroup.name}
                        </a>
                      ) : (
                        openHostGroup.name
                      )}
                    </span>
                  </div>
                ) : null}
                {openDesc ? <p className="odesc">{openDesc}</p> : null}
                <div className="okv">
                  <span className="ok">ADMISSION</span>
                  <span>{eventPrice(openListing.admission)}</span>
                </div>
                <div className="okv">
                  <span className="ok">AGE</span>
                  <span>{eventAge(openListing.ageRequirement)}</span>
                </div>
                {openTicket ? (
                  <a className="olinkbtn accent" href={openTicket} target="_blank" rel="noreferrer">
                    GET TICKETS <span>↗</span>
                  </a>
                ) : null}
                {openSourceLink ? (
                  <a className="olinkbtn" href={openSourceLink} target="_blank" rel="noreferrer">
                    SOURCE LINK <span>↗</span>
                  </a>
                ) : null}
                {openClaimable ? (
                  <p className="onote">
                    This event has not been claimed by its organizer. Details were sourced from public listings —
                    confirm time, venue, and ticketing directly before attending.
                    {openPending ? " A claim is pending admin review." : ""}
                  </p>
                ) : null}
                <a className="olinkbtn" href={eventPath(openListing.id, openListing.title, openListing.dayOfWeek, dateStrOf(openListing))}>
                  REPORT / REQUEST A CHANGE <span>›</span>
                </a>
                <EventHostNotice className="onote" />
              </section>
              <section className="opage" inert={opage!==1} aria-hidden={opage!==1} aria-label="Feed">
                {openListing.id > 0 && <EventPlanning eventId={openListing.id} occurrenceDate={openListing.dateStart} />}
                <button
                  type="button"
                  className="addm"
                  onClick={() => {
                    const target = openListing;
                    closeCard(true);
                    onOpen(target, null);
                  }}
                >
                  <b>+ ADD A MIZZED CONNECTION</b>
                  <p>{mizzCount ? `${mizzCount} posted for this event` : "Post during or after the event."}</p>
                </button>
              </section>
              <section className="opage" inert={opage!==2} aria-hidden={opage!==2} aria-label="Maps">
                <p className="osec">
                  MAP & DIRECTIONS <span className="osec-r">LOCATION OVERVIEW</span>
                </p>
                <div className="omap" aria-hidden="true">
                  <span className="omap-river" />
                  <span className="omap-road" style={{ left: 0, right: 0, top: "30%", height: 7 }} />
                  <span className="omap-road" style={{ top: 0, bottom: 0, left: "38%", width: 7 }} />
                  <span className="omap-road" style={{ left: 0, right: 0, top: "74%", height: 5 }} />
                  <span className="omap-tag">REAL LOCATION · NO STREET TILES</span>
                  <span className="omap-pin" style={{ left: `${pinX}%`, top: `${pinY}%` }} />
                </div>
                <div className="okv">
                  <span className="ok">VENUE</span>
                  <span>
                    {openListing.venueName}
                    {openAddr ? (
                      <>
                        <br />
                        {openAddr}
                      </>
                    ) : null}
                  </span>
                </div>
                <div className="odir">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${dirDest}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    DIRECTIONS · GOOGLE
                  </a>
                  <a href={`https://maps.apple.com/?daddr=${dirDest}`} target="_blank" rel="noreferrer">
                    DIRECTIONS · APPLE
                  </a>
                </div>
              </section>
              <section className="opage" inert={opage!==3} aria-hidden={opage!==3} aria-label="More and nearby">
                <p className="osec">
                  MORE AT {openListing.venueName.toUpperCase()} <span className="osec-r">THE SAME WEEK</span>
                </p>
                <div className="odays">
                  {openStrip.map((d, i) => (
                    <button
                      key={d.ds}
                      type="button"
                      className={`oday${oday === i ? " hot" : ""}`}
                      onClick={() => setOday(i)}
                    >
                      <i>{d.dow}</i>
                      <b>{d.num}</b>
                      <span>{d.items.length ? `${d.items.length} event${d.items.length === 1 ? "" : "s"}` : "—"}</span>
                    </button>
                  ))}
                </div>
                {openStrip[oday]?.items.length ? (
                  <div className="orail">
                    {openStrip[oday].items.map(n => (
                      <div className="omini" key={n.id}>
                        <b>{n.title}</b>
                        <span>{eventTimeLabel(n.dateStart)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="oempty">No other events at {openListing.venueName} on this day.</p>
                )}
                <p className="osec" style={{ marginTop: 16 }}>
                  RESTAURANTS CLOSE BY
                </p>
                {!Array.isArray(detailQuery.data?.nearby?.restaurants) ? detailStatus : nearbyR.length ? (
                  <div className="orail">
                    {nearbyR.map((r, i) => (
                      <div className="omini" key={`${r.name ?? "r"}-${i}`}>
                        <b>{r.name}</b>
                        <span>{r.type || "restaurant"}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="oempty">No restaurants listed nearby yet.</p>
                )}
                <p className="osec" style={{ marginTop: 16 }}>
                  EVENTS SAME DAY · CLOSE BY
                </p>
                {!Array.isArray(detailQuery.data?.nearby?.events) ? detailStatus : nearbyE.length ? (
                  <div className="orail">
                    {nearbyE.map((n, i) => (
                      <div className="omini" key={n.id ?? i}>
                        <b>{n.title}</b>
                        <span>
                          {n.venueName}
                          {n.dateStart ? (
                            <>
                              <br />
                              {eventDateLabel(n.dateStart)}
                            </>
                          ) : null}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="oempty">No other events close by on this day.</p>
                )}
              </section>
              <section className="opage" inert={opage!==4} aria-hidden={opage!==4} aria-label="People">
                <p className="osec">{hosts.length === 1 ? "HOST" : "HOSTS"}</p>
                {!Array.isArray(detailQuery.data?.hosts) ? detailStatus : hosts.length > 0 ? (
                  hosts.map((h, i) => {
                    const name = h.displayName || h.username || "";
                    const initials =
                      name
                        .trim()
                        .split(/\s+/)
                        .map(w => w[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase() || "?";
                    return (
                      <div className="operson" key={h.username ?? i}>
                        <span className="oavatar">{initials}</span>
                        <span>
                          <span className="opn">{name}</span>
                          {h.role ? (
                            <span className="opr">{h.role === "PRIMARY" ? "Primary host" : h.role}</span>
                          ) : null}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <>
                    <div className="oclaimbox">
                      <p className="oct">{openPending ? "CLAIM IN REVIEW" : openClaimable ? "OPEN TO CLAIM" : "HOST INFORMATION"}</p>
                      <p className="ocs">
                        No public event host is listed.
                        {openPending ? " A claim is pending admin review." : ""}
                      </p>
                    </div>
                    {openClaimable && !openPending ? (
                      <a className="olinkbtn" href={`/submit/claim/${openListing.id}`}>
                        CLAIM THIS EVENT <span>›</span>
                      </a>
                    ) : null}
                  </>
                )}
                {talent.length > 0 && (
                  <>
                    <p className="osec" style={{ marginTop: 16 }}>
                      TALENT · THIS EDITION
                    </p>
                    {talent.map((t, i) => {
                      const name = t.displayName || t.username || "";
                      const initials =
                        name
                          .trim()
                          .split(/\s+/)
                          .map(w => w[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase() || "?";
                      return (
                        <div className="operson" key={t.username ?? i}>
                          <span className="oavatar">{initials}</span>
                          <span>
                            <span className="opn">{name}</span>
                            {t.role ? <span className="opr">{t.role}</span> : null}
                            <span className="opr">{t.addedByUserId == null ? "Source unavailable" : t.addedByUserId === t.userId ? "Self-listed" : "Added by host or staff"}</span>
                          </span>
                        </div>
                      );
                    })}
                  </>
                )}
                <p className="osec" style={{ marginTop: 16 }}>
                  VENUE PROMOTERS
                </p>
                {!detailQuery.data ? detailStatus : !venueId ? <p className="oempty">No venue is linked.</p> : !Array.isArray(venueQuery.data?.promoters) ? <EventReadStatus label="Venue promoters" query={venueQuery} /> : venueQuery.data.promoters.length ? (
                  <ul>{venueQuery.data.promoters.map(person => <li key={person.id}>{person.displayName || person.username}</li>)}</ul>
                ) : <p className="oempty">No public promoters listed for this venue.</p>}
              </section>
            </div>
          </div>
          <div className="ofoot">
            <button
              type="button"
              className="oarw"
              disabled={opage === 0}
              onClick={() => goOpage(opage - 1)}
              aria-label="Previous page"
            >
              ‹
            </button>
            <span className="opg">
              PAGE {opage + 1} · {OPAGE_LABELS[opage]}
            </span>
            <button
              type="button"
              className="oarw"
              disabled={opage === OPAGE_NAMES.length - 1}
              onClick={() => goOpage(opage + 1)}
              aria-label="Next page"
            >
              ›
            </button>
            <button type="button" className="oshare" aria-label={`Share ${openListing.title}`} onClick={shareOpen}>
              <ShareIcon />
            </button>
            <EventPrivateSaveButton eventId={openListing.id} poster />
            <EventInterestedHeart
              eventId={openListing.id}
              variant="poster"
              snapshot={{
                title: openListing.title,
                subtitle: openListing.venueName,
                image: listingPosterUrl(openListing),
                href: eventPath(openListing.id, openListing.title, openListing.dayOfWeek, dateStrOf(openListing)),
                accent: openListing.accentColor ?? null,
              }}
            />
          </div>
        </div>
      </CardStage>}
          </div>,
          document.body,
        )}
    </div>
  );
}
