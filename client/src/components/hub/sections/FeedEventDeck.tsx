import { useMemo } from "react";
import { resolveEventPosterUrl } from "@shared/eventPoster";
import type { HubFeedEventEmbed } from "@shared/hubFeed";
import AppleCardCarousel, { type EventCarouselCard } from "@/components/ui/carousel-08";
import "./FeedEventDeck.css";

const DAY_COLOR: Record<string, string> = {
  MON: "#8800FF", TUE: "#0044FF", WED: "#FFEE00", THU: "#00FFFF",
  FRI: "#FF00CC", SAT: "#39FF14", SUN: "#FF6600",
};

export default function FeedEventDeck({ events, onOpen }: {
  events: HubFeedEventEmbed[];
  onOpen: (eventId: number) => void;
}) {
  const cards = useMemo<EventCarouselCard[]>(() => events.map(event => {
    const day = String(event.dayOfWeek || "").trim().toUpperCase().slice(0, 3);
    const date = /^\d{4}-\d{2}-\d{2}/.test(event.dateStart)
      ? new Date(`${event.dateStart.slice(0, 10)}T12:00:00`)
      : null;
    const dateLabel = date && !Number.isNaN(date.getTime())
      ? date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
      : "";
    return {
      id: event.id,
      category: [day, dateLabel].filter(Boolean).join(" · ") || "EVENT",
      title: event.title,
      src: resolveEventPosterUrl(event.id, event.posterImageUrl ?? null, event.dayOfWeek),
      alt: `${event.title} poster`,
      venue: event.venueName || "",
      detail: event.goingCount ? `${event.goingCount} going` : undefined,
      color: DAY_COLOR[day] || "#ffffff",
    };
  }), [events]);

  return <AppleCardCarousel cards={cards} onOpen={onOpen} />;
}
