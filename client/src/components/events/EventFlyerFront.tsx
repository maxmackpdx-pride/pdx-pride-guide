import { EventFrontSheen } from "@/components/events/EventFrontSheen";
import { formatCardCountdown } from '@/lib/countdown';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type React from 'react';
import { listingKey, type EventListing } from '@shared/multiDayEvents';
import { parsePacificDateTime, pacificCalendarDate, pacificTodayDate } from '@shared/missedConnections';
import { eventPath } from '@shared/eventSlug';
import { resolveDirectoryLogo } from '@shared/directoryLogos';
import { useHeart } from '@/hooks/useHearts';
import { eventDateLabel, eventTimeLabel } from '@/lib/eventDisplay';
import { eventAge, eventPrice } from '@/lib/eventFacts';
import { listingPosterUrl, posterCarriesTitle } from '@/lib/dsEvent';
import AuthModal from '@/components/AuthModal';
import BoardPushPin from '@/components/board/BoardPushPin';
import { isPosterActivation } from './flyerBoardBehavior';
import { PosterlessFlyer } from './PosterlessFlyer';
import '../board/punk/push-pins.css';
import './EventFlyerFront.css';


const PACIFIC = "America/Los_Angeles";
const WEEKDAY_CODES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;
export const DOW_INDEX: Record<string, number> = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 };
export const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
/** The demo's rotation rhythm and stagger, by position in the container. */
export const ROT_CYCLE = [-2.2, 1.6, -1.2, 2.6, -2.8, 1.9];

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

/** Seeded torn lower edge for pinned posters (from the approved demo). */
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

export function weekdayCode(dateStr: string): string {
  const noon = parsePacificDateTime(`${dateStr}T12:00:00`);
  if (noon == null) return "SAT";
  const wd = new Intl.DateTimeFormat("en-US", { timeZone: PACIFIC, weekday: "short" }).format(new Date(noon));
  const code = wd.toUpperCase();
  return (WEEKDAY_CODES as readonly string[]).includes(code) ? code : "SAT";
}

export function dayColorVar(dateStr: string): string {
  return `var(--day-${weekdayCode(dateStr).toLowerCase()})`;
}

function flagLabel(dateStr: string): string {
  const [, month, day] = dateStr.split("-").map(Number);
  return `${weekdayCode(dateStr)} · ${MONTHS[(month || 1) - 1]} ${day}`;
}

export function startMs(e: EventListing): number {
  return parsePacificDateTime(e.dateStart) ?? Number.POSITIVE_INFINITY;
}
export function dateStrOf(e: EventListing): string {
  return pacificCalendarDate(e.dateStart) ?? "";
}

export function countdownParts(ms: number): { d: string; h: string; m: string } {
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

/** Pointer-tracked tilt for taped posters; the tape line stays put (demo). */
function useDemoTilt(ref: React.RefObject<HTMLElement | null>, enabled: boolean) {
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
    const loop = () => {
      cx += (tx - cx) * 0.16;
      cy += (ty - cy) * 0.16;
      el.style.transform =
        `perspective(900px) rotateX(${cy.toFixed(2)}deg) rotateY(${cx.toFixed(2)}deg) ` +
        `rotate(var(--rot, 0deg))`;
      if (Math.abs(tx - cx) > 0.01 || Math.abs(ty - cy) > 0.01) {
        raf = requestAnimationFrame(loop);
      } else {
        raf = 0;
      }
    };
    const onMove = (ev: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      tx = ((ev.clientX - rect.left) / rect.width - 0.5) * 16;
      ty = -((ev.clientY - rect.top) / rect.height - 0.5) * 14;
      el.classList.add("tilting");
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const onLeave = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      el.classList.remove("tilting");
      el.style.transform = "";
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


function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

/** The demo's tape: solid / wireframe material swap + tear-slice glitch. */
export function Tape({ seedKey }: { seedKey: string }) {
  const style = useMemo(() => {
    const text = `tape-${seedKey}`;
    let seed = 0;
    for (let i = 0; i < text.length; i++) seed = (Math.imul(seed, 31) + text.charCodeAt(i)) >>> 0;
    const timing = Math.imul(seed ^ (seed >>> 16), 0x45d9f3b) >>> 0;
    return {
      "--tape-cycle": `${(8.2 + (timing % 4901) / 1000).toFixed(3)}s`,
      "--tape-phase": `${(-((timing >>> 7) % 13001) / 1000).toFixed(3)}s`,
      "--tape-glitch-phase": `${(-((timing >>> 3) % 6701) / 1000).toFixed(3)}s`,
    } as CSSProperties;
  }, [seedKey]);
  return (
    <span className="tape" style={style} aria-hidden="true">
      <i className="tape-solid" />
      <i className="tape-wire" />
      <i className="tape-slice tape-sa" />
      <i className="tape-slice tape-sb" />
    </span>
  );
}

export function Hardware({ pinned, seedKey, dayColor, rot }: { pinned: boolean; seedKey: string; dayColor: string; rot: number }) {
  return (
    <div
      className={`hw hw-${pinned ? "pin" : "tape"}`}
      style={{ "--tc": dayColor, transform: `rotate(${rot}deg)` } as CSSProperties}
      aria-hidden="true"
    >
      {pinned ? (
        <span className="boardz-punk-scope pdx-glass-rebind" style={{ "--c": dayColor } as CSSProperties}>
          <BoardPushPin postKey={seedKey} />
        </span>
      ) : (
        <Tape seedKey={seedKey} />
      )}
    </div>
  );
}

export type CellCommon = {
  tick: number;
};

/** Measured flyer proportions, shared by poster URL: the same flyer
 * anywhere on the board gets its exact dimensions immediately, with no
 * placeholder-proportioned jump while it loads. */
export const aspectByPosterUrl = new Map<string, number>();

/** Native loading="lazy" never fires for poster images inside the board's
 * transformed cells (measured live Nov 17, 2026: a card held fully in the
 * viewport for 15s was never even requested). Drive poster loading from an
 * IntersectionObserver instead: the img gets its src only when its cell
 * nears the viewport, so off-board posters still cost no bandwidth. */
export function usePosterLoad<T extends HTMLElement>(poster: string | null | undefined) {
  const ref = useRef<T | null>(null);
  const [load, setLoad] = useState(false);
  useEffect(() => {
    if (!poster || load) return;
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) {
      setLoad(true);
      return;
    }
    const io = new IntersectionObserver(
      es => {
        if (es.some(en => en.isIntersecting)) {
          setLoad(true);
          io.disconnect();
        }
      },
      { rootMargin: "800px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [poster, load]);
  return [ref, load] as const;
}

export function PosterCell({
  listing,
  index,
  mtop,
  rail = false,
  showDayFlag = false,
  onAspect,
  onOpenCard,
  tick,
}: CellCommon & {
  listing: EventListing;
  index: number;
  mtop: number;
  /** Rails never grow taller: a poster taller than the rail's standard
   *  height (the 0.8 reference at full rail width) scales down to fit. */
  rail?: boolean;
  onAspect?: (aspect: number) => void;
  showDayFlag?: boolean;
  onOpenCard: (listing: EventListing, el: HTMLElement | null) => void;
}) {
  const articleRef = useRef<HTMLElement | null>(null);
  const key = listingKey(listing);
  const pinned = index % 2 === 0;
  const rot = ROT_CYCLE[index % ROT_CYCLE.length];
  const dateStr = dateStrOf(listing);
  const dayColor = dayColorVar(dateStr);
  const accent = listing.accentColor || dayColor;
  const isFetLife = listing.sourcePlatform === "fetlife";
  const posterUrl = listingPosterUrl(listing);
  const [failedPoster, setFailedPoster] = useState<string>();
  const poster = posterUrl === failedPoster ? undefined : posterUrl;
  const [aspect, setAspect] = useState(() => (poster ? aspectByPosterUrl.get(poster) ?? 0.8 : 0.8));
  const [cellRef, loadPoster] = usePosterLoad<HTMLDivElement>(poster);
  /* The heart means "you're interested" (Tucker's ruling, Nov 19, 2026):
   * the same function on the front and the expanded card, driving the
   * one shared interested (follow) state — never the private save.
   * Filled = interested. The `.saved` class is the legacy on-state class. */
  const heart = useHeart("event", String(listing.id), {
    title: listing.title,
    subtitle: listing.venueName,
    image: poster,
    href: eventPath(listing.id, listing.title, listing.dayOfWeek, dateStr),
    accent: listing.accentColor ?? null,
  });
  const [heartAuth, setHeartAuth] = useState(false);
  const tear = useMemo(() => (pinned ? tearPolygons(key) : null), [pinned, key]);
  useDemoTilt(articleRef, !pinned);

  const start = startMs(listing);
  const end = parsePacificDateTime(listing.dateEnd);
  const running = start <= tick && (
    (end !== null && tick < end) ||
    (!listing.dateEnd && dateStr === pacificTodayDate(tick))
  );
  const countdownLabel = running ? (end === null ? "ON NOW" : "ENDS IN") : "STARTS IN";
  const cd = countdownLabel === "ON NOW" || !Number.isFinite(start) ? null : formatCardCountdown(
    running && end !== null ? end - tick : start - tick,
  );
  const age = eventAge(listing.ageRequirement);
  const meta = `${eventDateLabel(listing.dateStart)} · ${eventTimeLabel(listing.dateStart)} · ${listing.venueName} · ${listing.ageRequirement && age!=="Not stated"?age:"Age not stated"}`;
  const price = eventPrice(listing.admission) === "Not confirmed" ? "PRICE NOT CONFIRMED" : eventPrice(listing.admission).toUpperCase();
  const priceCls = listing.admission === "FREE" ? " free" : !listing.admission || listing.admission === "UNKNOWN" ? " unk" : "";
  /* An unconfirmed price is not a tag: it demotes to an asterisk
   * small-print note at the bottom of the card's bottom band (Tucker's
   * ruling, Nov 18, 2026). Confirmed prices keep the chip. */
  const priceUnconfirmed = price === "PRICE NOT CONFIRMED";
  /* Wide posters (landscape art) carry their info in a black chunk added
   * below the poster, with a little gradient blending into the poster's
   * bottom edge; tall posters keep the info laid over the poster with a
   * gradient. (Tucker's ruling, Nov 18, 2026.) */
  const wideChunk = !!poster && aspect >= 1.15;
  /* When the flyer art itself carries the title (the QSearch OCR flag,
   * step 6d), the card leaves its own title off — printing it again
   * would duplicate it. Text-free art (carriesTitle false) and
   * unchecked art (no flag) keep the card-added title as today. */
  const carriesTitle = !!poster && posterCarriesTitle(listing);


  return (
    <div
      ref={cellRef}
      className="cell"
      style={{
        marginTop: mtop,
        ...(rail && aspect < 0.8
          ? { width: `calc(var(--pw) * ${(aspect / 0.8).toFixed(3)})` }
          : {}),
      }}
    >
      {showDayFlag && <DayFlag dateStr={dateStr} />}
      <article
        ref={articleRef}
        className={`poster att-${pinned ? "pin" : "tape"}${tear ? " torn" : ""}${poster ? "" : " noart"}${wideChunk ? " chunk" : ""} pdx-glass-rebind`}
        style={
          {
            "--a": accent,
            "--tc": dayColor,
            "--rot": `${rot}deg`,
            ...(tear ? { "--clip": tear.clip, "--clip2": tear.clip2 } : {}),
          } as CSSProperties
        }
        role="button"
        tabIndex={0}
        aria-label={`Open ${listing.title}`}
        data-event-id={listing.id}
        data-event-date={dateStr}
        data-venue={listing.venueName}
        onClick={() => onOpenCard(listing, articleRef.current)}
        onKeyDown={ev => {
          if (isPosterActivation(ev.key, ev.target === ev.currentTarget)) {
            ev.preventDefault();
            onOpenCard(listing, articleRef.current);
          }
        }}
      >
        {tear ? <i className="trim" aria-hidden="true" /> : null}
        <div className="pc" style={{ aspectRatio: aspect }}>
          {poster && loadPoster ? (
            <img
              src={poster}
              alt=""
              decoding="async"
              onError={() => setFailedPoster(poster)}
              onLoad={ev => {
                const im = ev.currentTarget;
                if (im.naturalWidth > 0 && im.naturalHeight > 0) {
                  const ar = im.naturalWidth / im.naturalHeight;
                  if (poster) aspectByPosterUrl.set(poster, ar);
                  setAspect(ar);
                  onAspect?.(ar);
                }
              }}
            />
          ) : null}
          {!poster ? <PosterlessFlyer
            placeImageUrl={isFetLife ? null : listing.fallbackPlaceImage}
            logoUrl={isFetLife ? null : resolveDirectoryLogo(listing.venueName, listing.fallbackPlaceImage)}
            wordmark={isFetLife ? "FetLife" : null}
          /> : null}
          <EventFrontSheen/>
          {!priceUnconfirmed && <span className={`pprice${priceCls}`}>{price}</span>}
          <div className="pcdtop">
            <span className="ps-lab">{countdownLabel}</span>
            {cd && (
              <span className="ps-nums">
                <span><b>{cd}</b></span>
              </span>
            )}
          </div>
          {wideChunk ? <span className="pblend" aria-hidden="true" /> : null}
          {!wideChunk && (
            <>
              <div className="pshade">
                {!carriesTitle && <h4>{listing.title}</h4>}
                <p>{meta}</p>
              </div>
              <div className="pfoot">
                <div className="pactions">
                  <button
                    type="button"
                    className={`pheart${heart.hearted ? " saved" : ""}`}
                    aria-label={heart.hearted ? `Remove interest in ${listing.title}` : `Mark interest in ${listing.title}`}
                    title={heart.hearted ? "Interested" : "Mark interest"}
                    disabled={heart.pending} aria-pressed={heart.hearted}
                    onClick={ev => {
                      ev.stopPropagation();
                      heart.signedIn ? heart.toggle() : setHeartAuth(true);
                    }}
                  >
                    <HeartIcon />
                  </button>
                </div>
                {priceUnconfirmed && <p className="pprice-note">* Price not confirmed</p>}
              </div>
            </>
          )}
        </div>
        {wideChunk && (
          <div className="pchunk">
            {!carriesTitle && <h4>{listing.title}</h4>}
            <p className="pchunk-meta">
              {listing.venueName} · {weekdayCode(dateStr)} {eventTimeLabel(listing.dateStart)}
            </p>
            <div className="pchunk-row">
              <button
                type="button"
                className={`pheart${heart.hearted ? " saved" : ""}`}
                aria-label={heart.hearted ? `Remove interest in ${listing.title}` : `Mark interest in ${listing.title}`}
                title={heart.hearted ? "Interested" : "Mark interest"}
                disabled={heart.pending} aria-pressed={heart.hearted}
                onClick={ev => {
                  ev.stopPropagation();
                  heart.signedIn ? heart.toggle() : setHeartAuth(true);
                }}
              >
                <HeartIcon />
              </button>
            </div>
            {priceUnconfirmed && <p className="pprice-note">* Price not confirmed</p>}
          </div>
        )}
      </article>
      <Hardware pinned={pinned} seedKey={key} dayColor={dayColor} rot={rot} />
      {heartAuth && <AuthModal onClose={() => setHeartAuth(false)} />}
    </div>
  );
}

export function DayFlag({ dateStr }: { dateStr: string }) {
  const dow = DOW_INDEX[weekdayCode(dateStr)] ?? 6;
  const ink = dow === 1 || dow === 2 ? "var(--text-hi)" : "var(--paper-ink)";
  return (
    <div className="cell dayflag-cell">
      <div
        className="vflag"
        style={{ "--dc": dayColorVar(dateStr), "--ink": ink } as CSSProperties}
      >
        <span className="vflag-cloth" />
        <span className="vflag-pin">
          <span className="boardz-punk-scope pdx-glass-rebind" style={{ "--c": dayColorVar(dateStr) } as CSSProperties}>
            <BoardPushPin postKey={`flag-${dateStr}`} />
          </span>
        </span>
        <span className="vflag-t">{flagLabel(dateStr)}</span>
      </div>
    </div>
  );
}
