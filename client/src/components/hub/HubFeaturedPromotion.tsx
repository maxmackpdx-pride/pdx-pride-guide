import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { EventListing } from "@shared/multiDayEvents";
import FeaturedEventAd from "./sections/FeaturedEventAd";

type FeaturedConfig = {
  key: string;                       // unique id (drives dismiss key + slides folder)
  anchor?: boolean;                  // the every-other-slot event (Yes Coach)
  match: (title: string) => boolean; // how to find the event by title
  slides: string[];                  // extra slideshow frames after the poster
  /** Full-screen easter egg (slideshow/countdown click). */
  easterEggUrl?: string;
  mediaAspectRatio?: string;
};

const STANK_SLIDES = Array.from({ length: 11 }, (_, i) =>
  `/posters/stank-slides/slide-${String(i + 1).padStart(2, "0")}.jpg`,
);

const FEATURED: FeaturedConfig[] = [
  {
    key: "stank",
    anchor: true,
    // "stank" + "yes coach" in any order, tolerating any separators.
    match: (t) => /stank\W*yes\W*coach|yes\W*coach\W*stank/i.test(t) || /\bstank\b/i.test(t),
    slides: STANK_SLIDES,
    easterEggUrl: "/easter-eggs/stank-secret-story.html",
  },
  {
    key: "little-shop-of-ponies-2026",
    mediaAspectRatio: "1239 / 1536",
    match: (t) => /little\W+shop\W+of\W+ponies/i.test(t),
    slides: [],
  },
  // Add more featured events here - they rotate through the non-anchor slots.
];

const dismissKeyFor = (key: string) => `hub-promo-${key}-dismissed-day`;
const ROTATION_KEY = "hub-featured-rotation";

function pacificDayKey(ms = Date.now()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ms));
}

function withPacificTz(raw: string): string {
  return /[zZ]|[+-]\d\d:?\d\d$/.test(raw) ? raw : `${raw}-07:00`;
}

function eventEndMs(e: EventListing): number {
  const start = new Date(withPacificTz(e.dateStart)).getTime();
  if (e.dateEnd) {
    let end = new Date(withPacificTz(e.dateEnd)).getTime();
    if (end < start) end += 86_400_000; // end time crosses midnight (e.g. 9pm–2am)
    return end;
  }
  return start + 6 * 3_600_000; // no end time: assume a ~6h run
}


export default function HubFeaturedPromotion({ enabled }: { enabled: boolean }) {
  const [chosenKey, setChosenKey] = useState<string | null>(null);
  const [dismissTick, setDismissTick] = useState(0);

  const today = pacificDayKey();
  const isDismissedToday = (key: string) => {
    try { return window.localStorage.getItem(dismissKeyFor(key)) === today; } catch { return false; }
  };
  // Only fetch events if at least one featured ad could still show today.
  const anyFeaturedPossible = FEATURED.some((f) => !isDismissedToday(f.key));

  const { data: events = [] } = useQuery<EventListing[]>({
    queryKey: ["/api/events"],
    queryFn: () => fetch("/api/events", { credentials: "include" }).then((r) => r.json()),
    staleTime: 300_000,
    enabled: enabled && anyFeaturedPossible,
  });

  // Eligible = has a matching event, not dismissed today, event hasn't ended.
  const eligibleFeatured = useMemo(() => {
    const now = Date.now();
    return FEATURED
      .map((f) => ({ ...f, event: events.find((e) => f.match(e.title || "")) }))
      .filter((f) => f.event && !isDismissedToday(f.key) && now <= eventEndMs(f.event));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, dismissTick, today]);

  // Pick once per mount: anchor every other time, otherwise a random other one.
  useEffect(() => {
    if (chosenKey || eligibleFeatured.length === 0) return;
    const anchors = eligibleFeatured.filter((f) => f.anchor);
    const others = eligibleFeatured.filter((f) => !f.anchor);
    let n = 0;
    try {
      n = Number(window.localStorage.getItem(ROTATION_KEY) || "0") || 0;
      window.localStorage.setItem(ROTATION_KEY, String(n + 1));
    } catch { /* ignore */ }
    const randomOther = () => others[Math.floor(Math.random() * others.length)];
    const preferAnchor = n % 2 === 0;
    const pick = preferAnchor
      ? (anchors[0] ?? randomOther())
      : (others.length ? randomOther() : anchors[0]);
    setChosenKey(pick?.key ?? null);
  }, [eligibleFeatured, chosenKey]);

  const featured = eligibleFeatured.find((f) => f.key === chosenKey) ?? null;

  const dismissFeatured = (key: string) => {
    try { window.localStorage.setItem(dismissKeyFor(key), pacificDayKey()); } catch { /* ignore */ }
    // Hide the slot for the rest of this load; it re-rotates on the next visit.
    setChosenKey("__dismissed__");
    setDismissTick((t) => t + 1);
  };

  if (!featured?.event) return null;
  return <section className="hub-reader__promotion" aria-label="Featured event"><FeaturedEventAd event={featured.event} slides={featured.slides} easterEggUrl={featured.easterEggUrl} mediaAspectRatio={featured.mediaAspectRatio} onDismiss={() => dismissFeatured(featured.key)} /></section>;
}
