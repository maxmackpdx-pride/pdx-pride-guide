import { useEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from "react";
import { ChevronRight } from "lucide-react";
import type { EventListing } from "@shared/multiDayEvents";
import type { TonightCardLive } from "@/components/home/TonightEventCard";
import { listingPosterUrl } from "@/lib/dsEvent";
import EventsRail from "./EventsRail";
import EventRailCard from "./EventRailCard";
import { motifDay } from "./DayMotif";
import SponsorRailCard, { SPONSOR_KINDS } from "./SponsorRailCard";
import "./ThisWeekRail.css";

const WEEK_INDEX: Record<string, number> = { MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6, SUN: 7 };

function quiet() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    || document.documentElement.classList.contains("calm-mode")
    || document.documentElement.dataset.calm === "true";
}

/**
 * Covers: wide day names (MON, WED) step down so every name fills the same frame,
 * and the cover art drifts with scroll like the big event card motifs: an 8px
 * diagonal from page scroll, plus a little sideways drift as the rail slides.
 */
function useWeekCovers(ref: RefObject<HTMLElement>, key: number) {
  useEffect(() => {
    const sec = ref.current;
    if (!sec) return;
    const fit = () => sec.querySelectorAll<HTMLElement>(".week-day__hero").forEach(h => {
      h.style.removeProperty("--hs");
      const room = (h.parentElement?.clientWidth ?? 136) - 10;
      if (h.scrollWidth > room) h.style.setProperty("--hs", `${(60 * room / h.scrollWidth).toFixed(1)}px`);
    });
    fit();
    document.fonts?.ready.then(fit).catch(() => {});
    if (quiet()) return;
    const scroller = sec.querySelector<HTMLElement>(".events-rail") ?? sec;
    let raf = 0;
    const run = () => {
      raf = 0;
      const vh = window.innerHeight, vw = window.innerWidth;
      sec.querySelectorAll<HTMLElement>(".week-day__cover").forEach(a => {
        const r = a.parentElement!.getBoundingClientRect();
        if (r.bottom < -80 || r.top > vh + 80) return;
        const py = Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2)));
        const px = Math.max(-1, Math.min(1, (r.left + r.width / 2 - vw / 2) / (vw / 2 + r.width / 2)));
        const uy = py * 8, ux = px * 8 * 0.6;
        a.style.transform = `translate3d(${(uy * 0.707 + ux).toFixed(2)}px, ${(uy * 0.707).toFixed(2)}px, 0)`;
      });
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(run); };
    kick();
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);
    scroller.addEventListener("scroll", kick, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
      scroller.removeEventListener("scroll", kick);
    };
  }, [ref, key]);
}

export type WeekDay = { key: string; code: string; mon: string; dom: number; color: string; items: EventListing[] };

/** Sponsors adapt to how much is open: one per open day with 4+ events, a second
 * past 8. Never first in a day, never next to another sponsor or a day card. */
function sponsorSlots(n: number): number[] {
  const k = n >= 8 ? 2 : n >= 4 ? 1 : 0;
  return Array.from({ length: k }, (_, j) => Math.round((n * (j + 1)) / (k + 1))).filter(i => i > 0);
}

/**
 * This week: one day card per weekday in its day color. Tap it and that day's
 * events slide out onto the rail. Closed, a few of the day's real rail cards fan
 * out from behind it and breathe, so it reads as something to open.
 */
export default function ThisWeekRail({
  days,
  savedIds,
  liveStateFor,
  onToggleSave,
  onOpen,
}: {
  days: WeekDay[];
  savedIds: Set<number>;
  liveStateFor: (e: EventListing) => TonightCardLive | null;
  onToggleSave: (id: number) => void;
  onOpen: (e: EventListing) => void;
}) {
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  // Sponsor designs rotate from a random start each visit.
  const [offset] = useState(() => Math.floor(Math.random() * SPONSOR_KINDS.length));
  const visible = days.filter(d => d.items.length > 0);

  const children = useMemo(() => {
    const out: JSX.Element[] = [];
    let sponsorCount = 0;
    for (const d of visible) {
      const isOpen = open.has(d.key);
      const code = motifDay(d.code);
      const fan = [...d.items.filter(e => listingPosterUrl(e)), ...d.items.filter(e => !listingPosterUrl(e))].slice(0, 3).reverse();
      const toggle = () => setOpen(prev => { const next = new Set(prev); if (next.has(d.key)) next.delete(d.key); else next.add(d.key); return next; });
      out.push(
        <div role="listitem" key={`day-${d.key}`} className={`events-rail__item week-day pdx-glass-rebind${isOpen ? " is-open" : " is-closed"}`} style={{ "--c": d.color } as CSSProperties}>
          {!isOpen && fan.map((e, i) => (
            <div key={e.id} className={`week-day__fan week-day__fan--${fan.length - i}`} aria-hidden="true" ref={el => el?.setAttribute("inert", "")}>
              <EventRailCard listing={e} size="m" saved={savedIds.has(e.id)} onToggleSave={() => {}} onOpen={() => {}} />
            </div>
          ))}
          <button type="button" className="week-day__card" aria-expanded={isOpen} aria-label={`${isOpen ? "Close" : "Open"} ${d.code}, ${d.items.length} events`} onClick={toggle}>
            <span className="week-day__cover" aria-hidden="true" style={{ backgroundImage: `url(/motifs/days/covers/${code.toLowerCase()}.webp)` }} />
            <span className="week-day__body">
              <span className="week-day__top">
                <span className="week-day__count">{d.items.length} {d.items.length === 1 ? "event" : "events"}</span>
                <span className="week-day__index" aria-hidden="true">D/0{WEEK_INDEX[code]}</span>
              </span>
              <span className="week-day__hero" data-t={d.code}>{d.code}</span>
              <span className="week-day__date">{d.mon}<b>{d.dom}</b></span>
            </span>
            <span className="week-day__foot"><span className="week-day__tap">{isOpen ? "Close" : "Open"} <ChevronRight size={12} strokeWidth={3} aria-hidden="true" /></span></span>
          </button>
        </div>,
      );
      if (!isOpen) continue;
      const slots = sponsorSlots(d.items.length);
      let step = 0;
      d.items.forEach((e, i) => {
        if (slots.includes(i)) {
          const kind = SPONSOR_KINDS[(offset + sponsorCount++) % SPONSOR_KINDS.length];
          out.push(
            <div role="listitem" key={`ad-${d.key}-${i}`} className="events-rail__item week-slide" style={{ animationDelay: `${step++ * 60}ms` }}>
              <SponsorRailCard kind={kind} />
            </div>,
          );
        }
        out.push(
          <div role="listitem" key={`ev-${d.key}-${e.id}-${e.dateStart}`} className="events-rail__item week-slide" style={{ animationDelay: `${step++ * 60}ms` }}>
            <EventRailCard listing={e} size="m" saved={savedIds.has(e.id)} liveState={liveStateFor(e)} onToggleSave={onToggleSave} onOpen={onOpen} />
          </div>,
        );
      });
    }
    return out;
  }, [visible, open, offset, savedIds, liveStateFor, onToggleSave, onOpen]);

  const secRef = useRef<HTMLElement>(null);
  useWeekCovers(secRef, children.length);

  if (!visible.length) return null;
  const first = visible[0];
  const last = visible[visible.length - 1];
  return (
    <section ref={secRef} className="events-rail-sec events-rail-sec--m events-week pdx-glass-rebind" style={{ "--c": "var(--neon-cyan)" } as CSSProperties} aria-labelledby="events-rail-week">
      <div className="events-rail-sec__head">
        <h3 id="events-rail-week"><span aria-hidden="true" />This week<small>{first.code} {first.dom} to {last.code} {last.dom}</small></h3>
      </div>
      <EventsRail open={false} label="This week">{children}</EventsRail>
    </section>
  );
}
