import type React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Link } from "wouter";
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
import type { EventModalOriginRect } from "../EventModal";
import type { scatterAffiliateCards } from "@/lib/affiliateCards";
import BoardPushPin from "@/components/board/BoardPushPin";
import SpottedCard, { spottedAccent } from "@/components/SpottedCard";
import type { MissedConnectionPost } from "@/components/MissedConnectionsPanel";
import PosterAdCard from "@/components/ads/PosterAdCard";
import AffiliatePosterCard from "@/components/AffiliatePosterCard";
import "../board/punk/push-pins.css";
import "./FlyerBoard.css";
import { fanSlots, isPosterActivation, connectionsByEvent } from "./flyerBoardBehavior";

type GridItem = ReturnType<typeof scatterAffiliateCards>[number];

export type FlyerBoardProps = {
  /** Page-filtered pool: upcoming events, or past events while pastView is on. */
  events: EventListing[];
  /** Explicit filter changes reset pagination; background refreshes do not. */
  paginationKey: string;
  /** Events with affiliate/ad cards scattered in (upcoming mode, Plan Ahead flow). */
  gridItems: GridItem[];
  /** All past listings (pile artwork in upcoming mode). */
  pastEvents: EventListing[];
  pastView: boolean;
  onEnterPast: () => void;
  onExitPast: () => void;
  onOpen: (listing: EventListing, originRect: EventModalOriginRect | null) => void;
  savedIds: Set<number>;
  onToggleSave: (id: number) => void;
  now: number;
};

const PACIFIC = "America/Los_Angeles";
const DAY_MS = 86_400_000;
const WEEKDAY_CODES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const ADMISSION_LABEL: Record<string, string> = {
  FREE: "FREE",
  TICKETED: "TICKETED",
  DOOR_FEE: "COVER AT DOOR",
  SUGGESTED_DONATION: "DONATION",
  UNKNOWN: "PRICE NOT CONFIRMED",
};
const AGE_LABEL: Record<string, string> = {
  "21_PLUS": "21+",
  "18_PLUS": "18+",
  ALL_AGES: "All ages",
};
const GIGZ_COLOR = "var(--neon-violet)";
const CARPOOL_COLOR = "var(--neon-orange)";
const MIZZED_COLOR = "var(--neon-magenta)";

function hashString(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seeded torn lower edge for pinned posters (ported from the approved demo). */
function tearPolygons(key: string): { clip: string; clip2: string } {
  const rand = mulberry32(hashString(key));
  const points = 14;
  const ridge: number[] = [];
  for (let i = 0; i < points; i++) ridge.push(93.8 + rand() * 5.3);
  const lift = 0.7 + rand() * 1.1;
  const build = (ys: number[]) => {
    const parts = ["0% 0%", "100% 0%"];
    for (let i = points - 1; i >= 0; i--) {
      parts.push(`${((i / (points - 1)) * 100).toFixed(1)}% ${ys[i].toFixed(2)}%`);
    }
    return `polygon(${parts.join(",")})`;
  };
  return { clip: build(ridge), clip2: build(ridge.map(y => Math.max(0, y - lift))) };
}

function pacificDateString(ms: number): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: PACIFIC,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(ms));
  const get = (type: string) => parts.find(p => p.type === type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function weekdayCode(dateStr: string): string {
  const noon = parsePacificDateTime(`${dateStr}T12:00:00`);
  if (noon == null) return "SAT";
  const wd = new Intl.DateTimeFormat("en-US", { timeZone: PACIFIC, weekday: "short" }).format(new Date(noon));
  const code = wd.toUpperCase();
  return (WEEKDAY_CODES as readonly string[]).includes(code) ? code : "SAT";
}

function dayColorVar(dateStr: string): string {
  return `var(--day-${weekdayCode(dateStr).toLowerCase()})`;
}

function flagLabel(dateStr: string): string {
  const [, month, day] = dateStr.split("-").map(Number);
  return `${weekdayCode(dateStr)} · ${MONTHS[(month || 1) - 1]} ${day}`;
}

function startMs(e: EventListing): number {
  return parsePacificDateTime(e.dateStart) ?? Number.POSITIVE_INFINITY;
}
function endMs(e: EventListing): number {
  return parsePacificDateTime(e.dateEnd) ?? startMs(e);
}

function dateStrOf(e: EventListing): string {
  return pacificCalendarDate(e.dateStart) ?? "";
}

function countdownParts(ms: number): { d: string; h: string; m: string } {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  return {
    d: String(d).padStart(2, "0"),
    h: String(h).padStart(2, "0"),
    m: String(m).padStart(2, "0"),
  };
}

/** Pointer-tracked tilt for taped posters; the tape line (top edge) stays put. */
function useTapeTilt(ref: React.RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let active = false;
    const loop = () => {
      cx += (tx - cx) * 0.16;
      cy += (ty - cy) * 0.16;
      el.style.setProperty("--ry", `${(cx * 8).toFixed(2)}deg`);
      el.style.setProperty("--rx", `${(-cy * 7).toFixed(2)}deg`);
      if (active || Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) {
        raf = requestAnimationFrame(loop);
      } else {
        raf = 0;
      }
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const onMove = (ev: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      tx = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      ty = ((ev.clientY - rect.top) / rect.height) * 2 - 1;
      active = true;
      kick();
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
      active = false;
      kick();
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref, enabled]);
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" focusable="false">
      <path
        d="M12 20.7C6.4 17 3 13.6 3 9.9 3 7.2 5.1 5 7.8 5c1.7 0 3.3.9 4.2 2.3C12.9 5.9 14.5 5 16.2 5 18.9 5 21 7.2 21 9.9c0 3.7-3.4 7.1-9 10.8Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

type CellHandlers = {
  onOpen: FlyerBoardProps["onOpen"];
  savedIds: Set<number>;
  onToggleSave: (id: number) => void;
  tick: number;
};

function PosterCell({
  listing,
  handlers,
  live,
}: {
  listing: EventListing;
  handlers: CellHandlers;
  live?: boolean;
}) {
  const articleRef = useRef<HTMLElement | null>(null);
  const key = listingKey(listing);
  const seed = hashString(key);
  const pinned = seed % 2 === 0;
  const rot = ((seed % 61) / 10 - 3).toFixed(1);
  const dateStr = dateStrOf(listing);
  const dayColor = dayColorVar(dateStr);
  const accent = listing.accentColor || dayColor;
  const poster = listingPosterUrl(listing);
  const tear = useMemo(() => (pinned ? tearPolygons(key) : null), [pinned, key]);
  useTapeTilt(articleRef, !pinned);

  const open = (ev: ReactPointerEvent | React.MouseEvent) => {
    const rect = articleRef.current?.getBoundingClientRect();
    handlers.onOpen(
      listing,
      rect ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height } : null,
    );
    ev.stopPropagation();
  };
  const share = async (ev: React.MouseEvent) => {
    ev.stopPropagation();
    const url = `${window.location.origin}${eventPath(listing.id, listing.title, listing.dayOfWeek)}`;
    try {
      if (navigator.share) await navigator.share({ title: listing.title, url });
      else await navigator.clipboard.writeText(url);
    } catch {
      /* share dismissed */
    }
  };
  const saved = handlers.savedIds.has(listing.id);
  const cd = countdownParts(startMs(listing) - handlers.tick);
  const age = AGE_LABEL[listing.ageRequirement || ""] || "";
  const price = ADMISSION_LABEL[listing.admission || "UNKNOWN"] || "PRICE NOT CONFIRMED";

  return (
    <div
      className="fb-cell"
      style={{ "--rot": `${rot}deg` } as CSSProperties}
      data-key={key}
    >
      <div className={`fb-hw fb-hw--${pinned ? "pin" : "tape"}`} aria-hidden="true">
        {pinned ? (
          <span className="fb-pinwrap pdx-glass-rebind" style={{ "--c": dayColor } as CSSProperties}>
            <BoardPushPin postKey={key} />
          </span>
        ) : (
          <span className="fb-tape" style={{ "--tc": dayColor } as CSSProperties} />
        )}
      </div>
      <article
        ref={articleRef}
        className={`fb-poster pdx-glass-rebind${pinned ? " fb-poster--pin" : " fb-poster--tape"}${tear ? " fb-poster--torn" : ""}`}
        style={{ "--c": accent, "--clip": tear?.clip, "--clip2": tear?.clip2 } as CSSProperties}
        onClick={open}
        onKeyDown={ev => {
          if (isPosterActivation(ev.key, ev.target === ev.currentTarget)) {
            ev.preventDefault();
            open(ev as unknown as React.MouseEvent);
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={`Open ${listing.title}`}
      >
        <div className="fb-art">
          {poster ? (
            <img src={poster} alt="" loading="lazy" draggable={false} />
          ) : (
            <div className="fb-art--fallback">
              <span>{listing.title}</span>
            </div>
          )}
          <div className="fb-shade" />
          <button type="button" className="fb-share" onClick={share} aria-label={`Share ${listing.title}`}>
            SHARE
          </button>
          <span className="fb-price">{price}</span>
          <div className="fb-pfoot">
            <h3 className="fb-title">{listing.title}</h3>
            <p className="fb-meta">
              {eventDateLabel(listing.dateStart)} · {eventTimeLabel(listing.dateStart)} · {listing.venueName}
              {age ? ` · ${age}` : ""}
            </p>
            <div className="fb-start">
              {live ? (
                <span className="fb-onnow">ON NOW</span>
              ) : (
                <>
                  <span className="fb-start__label">STARTS IN</span>
                  <span className="fb-start__digits">
                    <span><b>{cd.d}</b><i>DAYS</i></span>
                    <span><b>{cd.h}</b><i>HRS</i></span>
                    <span><b>{cd.m}</b><i>MIN</i></span>
                  </span>
                </>
              )}
            </div>
            <div className="fb-counters">
              <span className="fb-chip" style={{ "--chip": GIGZ_COLOR } as CSSProperties}>
                <b>–</b><i>GIGZ</i>
              </span>
              <span className="fb-chip" style={{ "--chip": CARPOOL_COLOR } as CSSProperties}>
                <b>–</b><i>CARPOOL</i>
              </span>
              <button
                type="button"
                className={`fb-heart${saved ? " fb-heart--on" : ""}`}
                aria-pressed={saved}
                aria-label={saved ? `Remove ${listing.title} from My Schedule` : `Save ${listing.title} to My Schedule`}
                onClick={ev => {
                  ev.stopPropagation();
                  handlers.onToggleSave(listing.id);
                }}
              >
                <HeartIcon filled={saved} />
              </button>
            </div>
          </div>
        </div>
        {tear ? <div className="fb-trim" aria-hidden="true" /> : null}
      </article>
    </div>
  );
}

function DayFlag({ dateStr }: { dateStr: string }) {
  const color = dayColorVar(dateStr);
  return (
    <div className="fb-cell fb-cell--flag" aria-hidden="true">
      <div className="fb-vflag pdx-glass-rebind" style={{ "--c": color } as CSSProperties}>
        <span className="fb-vflag__pin">
          <BoardPushPin postKey={`flag-${dateStr}`} />
        </span>
        <span className="fb-vflag__text">{flagLabel(dateStr)}</span>
      </div>
    </div>
  );
}

function SubmitBlank() {
  return (
    <div className="fb-cell fb-cell--blank">
      <Link href="/submit" className="fb-blank">
        <span className="fb-blank__plus" aria-hidden="true">+</span>
        <span className="fb-blank__label">SUBMIT YOUR EVENT</span>
        <span className="fb-blank__sub">Free to list · takes a minute</span>
      </Link>
    </div>
  );
}

function PastCell({
  listing,
  count,
  tick,
  onFan,
}: {
  listing: EventListing;
  count: number;
  tick: number;
  onFan: (listing: EventListing) => void;
}) {
  const key = listingKey(listing);
  const seed = hashString(key);
  const pinned = seed % 2 === 0;
  const rot = ((seed % 61) / 10 - 3).toFixed(1);
  const dateStr = dateStrOf(listing);
  const dayColor = dayColorVar(dateStr);
  const accent = listing.accentColor || dayColor;
  const poster = listingPosterUrl(listing);
  const expiry = getMissedConnectionWindow(listing.dateStart, listing.dateEnd, tick)?.closesAt ?? tick;
  const left = expiry - tick;
  const wide = false;

  return (
    <div className="fb-cell fb-cell--past" style={{ "--rot": `${rot}deg` } as CSSProperties}>
      <div className={`fb-hw fb-hw--${pinned ? "pin" : "tape"}`} aria-hidden="true">
        {pinned ? (
          <span className="fb-pinwrap pdx-glass-rebind" style={{ "--c": dayColor } as CSSProperties}>
            <BoardPushPin postKey={key} />
          </span>
        ) : (
          <span className="fb-tape" style={{ "--tc": dayColor } as CSSProperties} />
        )}
      </div>
      <article
        className={`fb-poster fb-poster--past pdx-glass-rebind${wide ? " fb-poster--wide" : ""}`}
        style={{ "--c": accent } as CSSProperties}
        onClick={() => onFan(listing)}
        onKeyDown={ev => {
          if (ev.key === "Enter" || ev.key === " ") {
            ev.preventDefault();
            onFan(listing);
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={`See mizzed connections for ${listing.title}`}
      >
        <div className="fb-art">
          {poster ? (
            <img src={poster} alt="" loading="lazy" draggable={false} />
          ) : (
            <div className="fb-art--fallback">
              <span>{listing.title}</span>
            </div>
          )}
          <div className="fb-pwash" />
          <div className="fb-pmizz">
            <b>{String(count).padStart(2, "0")}</b>
            <i>MIZZED CONNECTIONS</i>
            <span className="fb-pexp">
              {left > 0
                ? `POSTING CLOSES IN ${Math.floor(left / DAY_MS)}D ${String(Math.floor((left % DAY_MS) / 3600000)).padStart(2, "0")}H`
                : "POSTING CLOSED"}
            </span>
          </div>
          <p className="fb-pmeta">
            {listing.title} · {eventDateLabel(listing.dateStart)}
          </p>
        </div>
      </article>
    </div>
  );
}

function FanDeck({
  listing,
  posts,
  onClose,
  onOpenListing,
}: {
  listing: EventListing;
  posts: MissedConnectionPost[];
  onClose: () => void;
  onOpenListing: (listing: EventListing) => void;
}) {
  const [index, setIndex] = useState(0);
  const dragX = useRef<number | null>(null);
  const returnFocus = useRef(typeof document !== "undefined" ? document.activeElement as HTMLElement | null : null);
  const openingListing = useRef(false);
  const total = Math.max(1, posts.length);
  const step = (dir: number) => setIndex(i => (i + dir + total) % total);

  useEffect(() => {
    setIndex(0);
  }, [listing]);


  const cards: Array<{ post: MissedConnectionPost | null; offset: number; key: string }> = [];
  if (posts.length === 0) {
    cards.push({ post: null, offset: 0, key: "empty" });
  } else {
    for (const { index: i, offset } of fanSlots(posts.length, index)) {
      cards.push({ post: posts[i], offset, key: `mc-${posts[i].id}` });
    }
  }

  return (
    <Dialog.Root open onOpenChange={open => { if (!open) onClose(); }}>
    <Dialog.Portal>
    <Dialog.Content asChild aria-describedby={undefined}
      onCloseAutoFocus={ev => {
        ev.preventDefault();
        if (!openingListing.current) returnFocus.current?.focus();
      }}
      onKeyDown={ev => {
        if (ev.target instanceof HTMLElement && ev.target.closest("input, textarea, select, [contenteditable=true]")) return;
        if (ev.key === "ArrowRight" || ev.key === "ArrowLeft") {
          ev.preventDefault();
          step(ev.key === "ArrowRight" ? 1 : -1);
        }
      }}
    >
    <div className="fb-fan" onClick={ev => { if (ev.target === ev.currentTarget) onClose(); }}>
      <Dialog.Title className="fb-fan__title">Mizzed connections for {listing.title}</Dialog.Title>
      <button type="button" className="fb-fan__close" aria-label="Close mizzed connections" onClick={onClose}>×</button>
      <div
        className="fb-deck"
        onClick={ev => ev.stopPropagation()}
        onPointerDown={ev => {
          dragX.current = ev.clientX;
        }}
        onPointerUp={ev => {
          if (dragX.current == null) return;
          const dx = ev.clientX - dragX.current;
          dragX.current = null;
          if (dx > 40) step(-1);
          else if (dx < -40) step(1);
        }}
      >
        {cards.map(({ post, offset, key }) => {
          const abs = Math.abs(offset);
          const style = {
            transform: `translateX(${offset * 36}%) rotate(${offset * 9}deg) scale(${1 - abs * 0.07})`,
            zIndex: 10 - abs,
            filter: `brightness(${abs === 0 ? 1 : abs === 1 ? 0.7 : 0.48})`,
            opacity: abs > 2 ? 0 : 1,
          } as CSSProperties;
          return (
            <div
              key={key}
              className={`fb-deck__card${offset === 0 ? " fb-deck__card--front" : ""}`}
              style={style}
              onClick={() => {
                if (offset !== 0) setIndex((index + offset + total) % total);
              }}
            >
              <div aria-hidden={offset !== 0 || undefined} ref={node => { if (node) node.inert = offset !== 0; }}>
              {post ? (
                <SpottedCard
                  post={post}
                  accentColor={spottedAccent(post.id)}
                  onReply={() => { openingListing.current = true; onOpenListing(listing); }}
                />
              ) : (
                <div className="fb-deck__empty">
                  <b>No mizzed connections yet</b>
                  <p>
                    No active public connections are available for this event. Expired or removed
                    posts are not shown.
                  </p>
                </div>
              )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="fb-decknav" onClick={ev => ev.stopPropagation()}>
        <button type="button" aria-label="Previous connection" disabled={posts.length < 2} onClick={() => step(-1)}>
          ‹
        </button>
        <span className="fb-dcount" aria-live="polite">
          {posts.length === 0 ? 0 : index + 1} / {posts.length}
        </span>
        <button type="button" aria-label="Next connection" disabled={posts.length < 2} onClick={() => step(1)}>
          ›
        </button>
      </div>
      <p className="fb-fan__hint">
        {listing.title} · {listing.venueName} — tap a side card or drag to sort through them
      </p>
    </div>
    </Dialog.Content>
    </Dialog.Portal>
    </Dialog.Root>
  );
}

function Pile({
  pastEvents,
  onEnterPast,
}: {
  pastEvents: EventListing[];
  onEnterPast: () => void;
}) {
  const minis = pastEvents.slice(0, 5);
  return (
    <section className="fb-pile" aria-label="Go back in time with Mizzed Connections">
      <div className="fb-pile__stage">
        {minis.map((e, i) => {
          const poster = listingPosterUrl(e);
          if (!poster) return null;
          return (
            <img
              key={listingKey(e)}
              className={`fb-pile__mini fb-pile__mini--${i}`}
              src={poster}
              alt=""
              loading="lazy"
              draggable={false}
            />
          );
        })}
        <button type="button" className="fb-pile__card" onClick={onEnterPast}>
          <svg className="fb-pile__swipe" viewBox="0 0 120 64" aria-hidden="true" focusable="false">
            <path d="M14 44 Q 58 22 96 30" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 9" />
            <circle cx="17" cy="42" r="6" fill="currentColor" />
            <path d="M104 31 L82 16 L84 46 Z" fill="currentColor" />
          </svg>
          <b>GO BACK IN TIME</b>
          <span>PAST 7 DAYS · MIZZED CONNECTIONS</span>
        </button>
      </div>
      <p className="fb-pile__cap">THE PILE · CLICK IT TO GO BACK 7 DAYS</p>
    </section>
  );
}

type FlowItem =
  | { kind: "poster"; listing: EventListing }
  | { kind: "flag"; dateStr: string }
  | { kind: "blank" }
  | { kind: "ad"; item: GridItem };

/** Posters swing with scroll velocity: faster scroll, bigger sway, springing back to rest. */
function useScrollSway() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;
    let cur = 0, tgt = 0, yCur = 0, yTgt = 0, lastY: number | null = null, lastT = 0, raf: number | null = null;
    const loop = () => {
      cur += (tgt - cur) * 0.14;
      yCur += (yTgt - yCur) * 0.14;
      if (performance.now() - lastT > 60) {
        tgt *= 0.86; yTgt *= 0.86;
        if (Math.abs(tgt) < 0.02) tgt = 0;
        if (Math.abs(yTgt) < 0.2) yTgt = 0;
      }
      root.style.setProperty("--sway", `${cur.toFixed(2)}deg`);
      root.style.setProperty("--sway-y", `${yCur.toFixed(1)}px`);
      if (Math.abs(cur) > 0.01 || Math.abs(yCur) > 0.1 || tgt !== 0 || yTgt !== 0) {
        raf = requestAnimationFrame(loop);
      } else {
        raf = null;
        root.style.setProperty("--sway", "0deg");
        root.style.setProperty("--sway-y", "0px");
      }
    };
    const onScroll = () => {
      const y = window.scrollY;
      if (lastY === null) { lastY = y; return; }
      const v = y - lastY;
      lastY = y;
      if (v === 0) return;
      lastT = performance.now();
      tgt = Math.max(-4.5, Math.min(4.5, v * 0.05));
      yTgt = Math.max(-6, Math.min(6, v * 0.07));
      if (raf === null) raf = requestAnimationFrame(loop);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf !== null) cancelAnimationFrame(raf);
      root.style.removeProperty("--sway");
      root.style.removeProperty("--sway-y");
    };
  }, []);
}

export default function FlyerBoard(props: FlyerBoardProps) {
  const { events, gridItems, pastEvents, pastView, onEnterPast, onExitPast } = props;
  const [tick, setTick] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setTick(Date.now()), 30_000);
    return () => window.clearInterval(t);
  }, []);
  const nowMs = Math.max(props.now, tick);

  const batch = () => (typeof window !== "undefined" && window.innerWidth < 768 ? 12 : 20);
  const [visibleSlots, setVisibleSlots] = useState(20);
  useEffect(() => {
    setVisibleSlots(batch());
  }, [props.paginationKey, pastView]);

  useScrollSway();

  const handlers: CellHandlers = {
    onOpen: props.onOpen,
    savedIds: props.savedIds,
    onToggleSave: props.onToggleSave,
    tick: nowMs,
  };

  /* ---------- upcoming sections ---------- */
  const sections = useMemo(() => {
    if (pastView) return null;
    const today = pacificTodayDate(nowMs);
    const noon = parsePacificDateTime(`${today}T12:00:00`) ?? nowMs;
    const todayCode = weekdayCode(today);
    const weekdayIdx = (WEEKDAY_CODES as readonly string[]).indexOf(todayCode);
    const friday = noon + (5 - weekdayIdx) * DAY_MS;
    const weekendDates = new Set([
      pacificDateString(friday),
      pacificDateString(friday + DAY_MS),
      pacificDateString(friday + 2 * DAY_MS),
    ]);
    const nowItems: EventListing[] = [];
    const laterItems: EventListing[] = [];
    const weekendItems: EventListing[] = [];
    const ahead: EventListing[] = [];
    const seen = new Set<string>();
    for (const e of events) {
      const k = listingKey(e);
      if (seen.has(k)) continue;
      seen.add(k);
      const dateStr = dateStrOf(e);
      const s = startMs(e);
      const en = endMs(e);
      if (s <= nowMs && en > nowMs) nowItems.push(e);
      else if (dateStr === today && s > nowMs) laterItems.push(e);
      else if (dateStr !== today && weekendDates.has(dateStr)) weekendItems.push(e);
      else ahead.push(e);
    }
    // Preserve the page-selected order within each time section.
    return { nowItems, laterItems, weekendItems, ahead };
  }, [events, pastView, nowMs]);

  /* Plan Ahead flow: ahead posters + scattered ads + submit blanks + day flags. */
  const flow = useMemo<FlowItem[]>(() => {
    if (!sections) return [];
    const aheadKeys = new Set(sections.ahead.map(e => listingKey(e)));
    const mixed: Array<{ listing?: EventListing; item?: GridItem }> = [];
    for (const item of gridItems) {
      if (item.kind === "event") {
        if (aheadKeys.has(listingKey(item.event))) mixed.push({ listing: item.event });
      } else {
        mixed.push({ item });
      }
    }
    // If ads have not been scattered yet, gridItems is events-only; either way
    // make sure every ahead event appears even if gridItems lagged behind.
    const inMixed = new Set(
      mixed.filter(m => m.listing).map(m => listingKey(m.listing as EventListing)),
    );
    for (const e of sections.ahead) {
      if (!inMixed.has(listingKey(e))) mixed.push({ listing: e });
    }
    const totalPosters = mixed.filter(m => m.listing).length;
    const marks = new Set([1, Math.floor(totalPosters / 2), Math.floor(totalPosters * 0.8)]);
    const out: FlowItem[] = [];
    let lastDate = "";
    let posterIdx = 0;
    for (const m of mixed) {
      if (m.listing) {
        const dateStr = dateStrOf(m.listing);
        if (dateStr !== lastDate) {
          out.push({ kind: "flag", dateStr });
          lastDate = dateStr;
        }
        out.push({ kind: "poster", listing: m.listing });
        if (marks.has(posterIdx)) out.push({ kind: "blank" });
        posterIdx++;
      } else if (m.item) {
        out.push({ kind: "ad", item: m.item });
      }
    }
    return out;
  }, [sections, gridItems]);

  const slotCost = (item: FlowItem) => (item.kind === "flag" ? 0 : 1);
  const visibleFlow = useMemo(() => {
    const out: FlowItem[] = [];
    let used = 0;
    for (const item of flow) {
      const cost = slotCost(item);
      if (used + cost > visibleSlots && cost > 0) break;
      out.push(item);
      used += cost;
    }
    return out;
  }, [flow, visibleSlots]);
  const remainingSlots = useMemo(() => {
    let used = 0;
    for (const item of visibleFlow) used += slotCost(item);
    return flow.reduce((acc, item) => acc + slotCost(item), 0) - used;
  }, [flow, visibleFlow]);
  const lastAheadDate =
    sections && sections.ahead.length
      ? dateStrOf(sections.ahead[sections.ahead.length - 1])
      : null;

  /* ---------- past mode ---------- */
  const [fanListing, setFanListing] = useState<EventListing | null>(null);
  const mcQuery = useQuery<MissedConnectionPost[]>({
    queryKey: ["/api/missed-connections"],
    queryFn: () => apiRequest("GET", "/api/missed-connections").then(r => r.json()),
    enabled: pastView,
    staleTime: 60_000,
  });
  const mcByEvent = useMemo(() => connectionsByEvent(mcQuery.data ?? []), [mcQuery.data]);
  const mcFor = (e: EventListing): MissedConnectionPost[] => mcByEvent.get(e.id) ?? [];

  const pastFlow = useMemo<FlowItem[]>(() => {
    if (!pastView) return [];
    const today = pacificTodayDate(nowMs);
    const cutoff = pacificDateString((parsePacificDateTime(`${today}T12:00:00`) ?? nowMs) - 7 * DAY_MS);
    const last7 = events
      .filter(e => dateStrOf(e) >= cutoff)
      .sort((a, b) => startMs(b) - startMs(a));
    const out: FlowItem[] = [];
    let lastDate = "";
    for (const e of last7) {
      const dateStr = dateStrOf(e);
      if (dateStr !== lastDate) {
        out.push({ kind: "flag", dateStr });
        lastDate = dateStr;
      }
      out.push({ kind: "poster", listing: e });
    }
    return out;
  }, [events, pastView, nowMs]);
  const visiblePastFlow = useMemo(() => {
    const out: FlowItem[] = [];
    let used = 0;
    for (const item of pastFlow) {
      const cost = slotCost(item);
      if (used + cost > visibleSlots && cost > 0) break;
      out.push(item);
      used += cost;
    }
    return out;
  }, [pastFlow, visibleSlots]);
  const pastRemaining = useMemo(() => {
    let used = 0;
    for (const item of visiblePastFlow) used += slotCost(item);
    return pastFlow.reduce((acc, item) => acc + slotCost(item), 0) - used;
  }, [pastFlow, visiblePastFlow]);
  const pastTotal = useMemo(() => {
    if (!pastView) return 0;
    const ids = new Set<number>();
    for (const item of pastFlow) {
      if (item.kind === "poster") {
        for (const p of mcFor(item.listing)) ids.add(p.id);
      }
    }
    return ids.size;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pastFlow, mcByEvent]);

  const renderFlow = (items: FlowItem[], past: boolean) => (
    <div className="fb-grid">
      {items.map((item, i) => {
        if (item.kind === "flag") return <DayFlag key={`flag-${item.dateStr}-${i}`} dateStr={item.dateStr} />;
        if (item.kind === "blank") return <SubmitBlank key={`blank-${i}`} />;
        if (item.kind === "ad") {
          const ad = item.item;
          if (ad.kind !== "affiliate") return null;
          return (
            <div key={ad.key} className="fb-cell fb-cell--ad">
              <div className="ds-listing-card ds-listing-card--grid pdx-glass-rebind fb-adwrap">
                {ad.ad ? (
                  <PosterAdCard ad={ad.ad} brand={ad.brand} style={{ height: "100%" }} />
                ) : (
                  <AffiliatePosterCard brand={ad.brand} style={{ height: "100%" }} />
                )}
              </div>
            </div>
          );
        }
        return past ? (
          <PastCell
            key={listingKey(item.listing)}
            listing={item.listing}
            count={mcFor(item.listing).length}
            tick={nowMs}
            onFan={setFanListing}
          />
        ) : (
          <PosterCell key={listingKey(item.listing)} listing={item.listing} handlers={handlers} />
        );
      })}
    </div>
  );

  if (pastView) {
    return (
      <div className="fb-root boardz-punk-scope">
        <div className="fb-pasthead">
          <button type="button" className="fb-back" onClick={onExitPast}>
            ← BACK TO UPCOMING
          </button>
          <h2 className="fb-mizzed-logo">
            MIZZED <span>CONNECTIONS</span>
          </h2>
          <p className="fb-pastsub">
            LAST 7 DAYS · {pastFlow.filter(i => i.kind === "poster").length} EVENTS · {pastTotal}{" "}
            MIZZED CONNECTIONS
          </p>
          <p className="fb-pasthint">TAP A POSTER TO FAN ITS CONNECTIONS OUT · SORT THEM WITH THE ARROWS</p>
        </div>
        {renderFlow(visiblePastFlow, true)}
        {pastRemaining > 0 && (
          <div className="fb-loadmore">
            <button type="button" onClick={() => setVisibleSlots(s => s + batch())}>
              LOAD MORE · {pastRemaining} MORE
            </button>
          </div>
        )}
        {fanListing && (
          <FanDeck
            listing={fanListing}
            posts={mcFor(fanListing)}
            onClose={() => setFanListing(null)}
            onOpenListing={listing => {
              setFanListing(null);
              props.onOpen(listing, null);
            }}
          />
        )}
      </div>
    );
  }

  if (!sections) return null;
  const hasAhead = sections.ahead.length > 0;

  return (
    <div className="fb-root boardz-punk-scope">
      {sections.nowItems.length > 0 && (
        <section className="fb-sec" aria-label="Happening now">
          <h2 className="fb-sec__title">HAPPENING NOW</h2>
          <div className="fb-rail">
            {sections.nowItems.map(e => (
              <PosterCell key={listingKey(e)} listing={e} handlers={handlers} live />
            ))}
          </div>
        </section>
      )}
      {sections.laterItems.length > 0 && (
        <section className="fb-sec" aria-label="Happening later today">
          <h2 className="fb-sec__title">HAPPENING LATER</h2>
          <div className="fb-rail">
            {sections.laterItems.map(e => (
              <PosterCell key={listingKey(e)} listing={e} handlers={handlers} />
            ))}
          </div>
        </section>
      )}
      {sections.weekendItems.length > 0 && (
        <section className="fb-sec" aria-label="Happening this weekend">
          <h2 className="fb-sec__title">HAPPENING THIS WEEKEND</h2>
          <div className="fb-rail">
            {sections.weekendItems.map(e => (
              <PosterCell key={listingKey(e)} listing={e} handlers={handlers} />
            ))}
          </div>
        </section>
      )}
      {hasAhead && (
        <section className="fb-sec fb-sec--ahead" aria-label="Plan ahead">
          <div className="fb-seam" aria-hidden="true" />
          <h2 className="fb-sec__title">PLAN AHEAD</h2>
          {renderFlow(visibleFlow, false)}
          {remainingSlots > 0 ? (
            <div className="fb-loadmore">
              <button type="button" onClick={() => setVisibleSlots(s => s + batch())}>
                LOAD MORE · {remainingSlots} MORE
              </button>
            </div>
          ) : lastAheadDate ? (
            <p className="fb-endcap">
              END OF THE BOARD · EVERYTHING THROUGH {flagLabel(lastAheadDate)}
            </p>
          ) : null}
        </section>
      )}
      <Pile pastEvents={pastEvents} onEnterPast={onEnterPast} />
    </div>
  );
}
