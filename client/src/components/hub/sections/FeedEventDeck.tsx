import { useMemo, useState } from "react";
import { resolveEventPosterUrl } from "@shared/eventPoster";
import type { HubFeedEventEmbed } from "@shared/hubFeed";
import "./FeedEventDeck.css";

const DAY_COLOR: Record<string, string> = {
  MON: "#8800FF",
  TUE: "#0044FF",
  WED: "#FFEE00",
  THU: "#00FFFF",
  FRI: "#FF00CC",
  SAT: "#39FF14",
  SUN: "#FF6600",
};

function dayKey(raw?: string | null): string {
  return String(raw || "").trim().toUpperCase().slice(0, 3);
}

function dayColor(raw?: string | null): string {
  return DAY_COLOR[dayKey(raw)] || "#ffffff";
}

type Built = {
  id: number;
  title: string;
  venue: string;
  day: string;
  color: string;
  going?: number;
  posterUrl: string;
};

/**
 * Poster deck for hub-feed event listings — the profile "stash" look. A single
 * event shows one poster card; multiple fan into a tap-to-cycle stack.
 */
export default function FeedEventDeck({
  events,
  onOpen,
}: {
  events: HubFeedEventEmbed[];
  onOpen: (eventId: number) => void;
}) {
  const cards: Built[] = useMemo(
    () =>
      events.map((e) => ({
        id: e.id,
        title: e.title,
        venue: e.venueName || "",
        day: dayKey(e.dayOfWeek),
        color: dayColor(e.dayOfWeek),
        going: e.goingCount && e.goingCount > 0 ? e.goingCount : undefined,
        posterUrl: resolveEventPosterUrl(e.id, e.posterImageUrl ?? null, e.dayOfWeek),
      })),
    [events],
  );

  const n = cards.length;
  const [active, setActive] = useState(0);

  const laidOut = useMemo(() => {
    const spread = 9;
    const gap = 46;
    return cards.map((c, i) => {
      let rel = i - active;
      if (rel > n / 2) rel -= n;
      if (rel < -n / 2) rel += n;
      const abs = Math.abs(rel);
      const rot = rel * spread;
      const x = rel * gap;
      const y = abs * abs * 7;
      const scale = rel === 0 ? 1.06 : Math.max(0.66, 1 - Math.min(abs, 5) * 0.06);
      const z = 200 - Math.round(abs * 10);
      const opacity = abs > 4 ? 0 : 1;
      const front = rel === 0;
      const shadow = front
        ? `0 16px 40px rgba(0,0,0,0.7), 0 0 22px ${c.color}55`
        : "0 10px 24px rgba(0,0,0,0.55)";
      return {
        ...c,
        index: i,
        front,
        transform: `translateX(${x}px) translateY(${y}px) rotate(${rot}deg) scale(${scale})`,
        z,
        opacity,
        shadow,
      };
    });
  }, [cards, active, n]);

  if (!n) return null;

  const front = cards[((active % n) + n) % n];

  return (
    <div className={`feed-deck ${n > 1 ? "feed-deck--fan" : "feed-deck--single"}`}>
      {n > 1 && <div className="feed-deck__label">Front · {front?.title}</div>}

      <div className="feed-deck__anchor">
        {laidOut.map((c) => (
          <button
            key={c.id}
            type="button"
            className="feed-deck__card"
            style={{
              transform: c.transform,
              zIndex: c.z,
              opacity: c.opacity,
              borderColor: c.color,
              boxShadow: c.shadow,
              pointerEvents: c.opacity === 0 ? "none" : "auto",
            }}
            aria-label={c.venue ? `${c.title} at ${c.venue}` : c.title}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (c.front) onOpen(c.id);
              else setActive(c.index);
            }}
          >
            <span className="feed-deck__daybar" style={{ background: c.color }} aria-hidden />
            <img className="feed-deck__poster" src={c.posterUrl} alt="" decoding="async" />
            <span className="feed-deck__scrim" aria-hidden />
            <span className="feed-deck__body">
              <span className="feed-deck__day" style={{ color: c.color }}>
                {c.day || "TBA"}
              </span>
              <span className="feed-deck__title">{c.title}</span>
              <span className="feed-deck__foot">
                <span className="feed-deck__venue">{c.venue}</span>
                {c.going ? <span className="feed-deck__going">{c.going} going</span> : null}
              </span>
            </span>
          </button>
        ))}
      </div>

      {n > 1 && (
        <div className="feed-deck__controls">
          <button
            type="button"
            className="feed-deck__nav"
            aria-label="Previous event"
            onClick={(e) => {
              e.stopPropagation();
              setActive((a) => (a - 1 + n) % n);
            }}
          >
            ‹
          </button>
          <div className="feed-deck__pos">
            {(((active % n) + n) % n) + 1} / {n}
          </div>
          <button
            type="button"
            className="feed-deck__nav"
            aria-label="Next event"
            onClick={(e) => {
              e.stopPropagation();
              setActive((a) => (a + 1) % n);
            }}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
