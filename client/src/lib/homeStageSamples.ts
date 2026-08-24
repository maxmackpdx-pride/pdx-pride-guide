/**
 * Live sample cards for the home stage (one post per board slide).
 * Handoff: docs/design-handoff-home-2026-07-28/export/README.md
 *
 * Hrefs follow live app routes (not the handoff's aspirational slug paths):
 *   events  → eventPath(id, title, day)
 *   housing → /the-hauz/:id
 *   gifting → /gifting?post=:id
 *   gigs    → /pride-work?post=:id
 *   spotted → /spotted?post=:id
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { EventListing } from "@shared/multiDayEvents";
import type { HousingBoardResponse, HousingPostView } from "@shared/housing";
import {
  HOUSING_TYPE_KICKER,
  formingProgress,
  housingDisplayName,
} from "@shared/housing";
import { eventPath, slugifyEventTitle } from "@shared/eventSlug";
import { parsePacificDateTime } from "@shared/missedConnections";
import { eventsUpNext, dayColorVar } from "@/lib/homeEvents";
import { listingPosterUrl, formatListingWhen } from "@/lib/dsEvent";
import { timeAgo } from "@/lib/boardFeed";
import type { AttendanceSummaryMap } from "@/components/profile/mapAttendancePreviewToChips";

export type HomeStageBoardKey = "events" | "housing" | "gifting" | "gigs" | "spotted";

/** Normalized card props for every board slide sample. */
export type HomeStageCardData = {
  key: HomeStageBoardKey;
  href: string;
  kicker: string;
  title: string;
  line: string;
  meta: string;
  cta: string;
  /** CSS color / token for --c rebind */
  accent: string;
  thumbUrl?: string | null;
  /** Missed connections: quote tile instead of photo */
  quoteTile?: boolean;
  /** True when mapped from live API data (drop DEMO sticker) */
  isLive: boolean;
};

export type HomeStageSamples = Partial<Record<HomeStageBoardKey, HomeStageCardData>>;

export type GiftingRow = {
  id: number;
  postType: "GIFT" | "ISO" | string;
  title: string;
  description: string;
  neighborhood?: string | null;
  photoUrls?: string[] | null;
  status?: string;
  createdAt: string;
  interestCount?: number;
  /** Seeded records are displayed with an explicit demo treatment elsewhere. */
  username?: string | null;
};

export type GigRow = {
  id: number;
  postType: "LOOKING_FOR_WORK" | "POSTING_GIG" | string;
  title: string;
  description: string;
  compensation?: string | null;
  location?: string | null;
  status?: string;
  createdAt: string;
  imageUrl?: string | null;
  /** Seeded records are displayed with an explicit demo treatment elsewhere. */
  username?: string | null;
};

export type SpottedRow = {
  id: number;
  title: string;
  body: string;
  dayOfWeek?: string | null;
  venueHint?: string | null;
  eventTitle?: string | null;
  eventVenue?: string | null;
  eventDay?: string | null;
  beachId?: string | null;
  createdAt: string;
  status?: string;
  isDemo?: boolean;
};

const ACCENT: Record<HomeStageBoardKey, string> = {
  events: "var(--day-fri, #FF00CC)",
  housing: "var(--panel-cyan, #19e3ff)",
  gifting: "var(--panel-lime, #c8fa3c)",
  gigs: "var(--panel-purple, #b06bff)",
  spotted: "var(--panel-magenta, #ff1fa0)",
};

/** Path helpers matching live routes (used by cards + tests). */
export function giftingPostPath(id: number): string {
  return `/gifting?post=${id}`;
}

export function gigPostPath(id: number): string {
  return `/pride-work?post=${id}`;
}

export function spottedPostPath(id: number): string {
  return `/spotted?post=${id}`;
}

export function housingPostPath(id: number): string {
  return `/the-hauz/${id}`;
}

/** Prefer a currently-happening listing; else first live/upcoming. */
export function firstLiveEvent(
  events: EventListing[],
  nowMs: number = Date.now(),
): EventListing | null {
  const live = events.find((e) => {
    const start = parsePacificDateTime(e.dateStart);
    if (start == null) return false;
    const end = parsePacificDateTime(e.dateEnd) ?? start;
    return start <= nowMs && end >= nowMs;
  });
  if (live) return live;
  return eventsUpNext(events, 1, nowMs)[0] ?? null;
}

function clip(s: string, max = 110): string {
  const t = (s || "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

function isActiveGifting(p: GiftingRow): boolean {
  return p.username !== "hausing_demo" &&
    !["GIFTED", "FOUND", "EXPIRED", "PENDING", "REJECTED", "HIDDEN"].includes(
      (p.status || "").toUpperCase(),
    );
}

function isActiveGig(p: GigRow): boolean {
  return p.username !== "hausing_demo" &&
    !["FILLED", "FOUND", "EXPIRED", "PENDING", "REJECTED", "HIDDEN", "CLOSED"].includes(
      (p.status || "").toUpperCase(),
    );
}

export function mapEventSample(
  event: EventListing,
  goingCount?: number,
): HomeStageCardData {
  const now = Date.now();
  const start = parsePacificDateTime(event.dateStart);
  const end = parsePacificDateTime(event.dateEnd) ?? start;
  const happening = start != null && end != null && start <= now && end >= now;
  const day = event.dayOfWeek || null;
  const metaBits = [
    formatListingWhen(event),
    goingCount != null && goingCount > 0 ? `${goingCount} going` : null,
  ].filter(Boolean);
  return {
    key: "events",
    href: eventPath(event.id, event.title, event.dayOfWeek),
    kicker: happening ? "Happening now" : "Up next",
    title: event.title,
    line: clip(
      [event.venueName, event.neighborhood].filter(Boolean).join(", ") ||
        event.description ||
        "Portland",
    ),
    meta: metaBits.join(" · ") || "Events",
    cta: "I'm going →",
    accent: day ? dayColorVar(day) : ACCENT.events,
    thumbUrl: listingPosterUrl(event) ?? null,
    isLive: true,
  };
}

export function mapHousingSample(post: HousingPostView): HomeStageCardData {
  const kicker = HOUSING_TYPE_KICKER[post.type] || "THE HAÜZ";
  const title =
    post.displayName ||
    housingDisplayName(post.type, post.name) ||
    post.headline ||
    "THE HAÜZ post";
  const area = (post.areas || []).filter(Boolean).slice(0, 2).join(", ");
  const line = clip(post.headline || post.body || area || "Portland");
  const metaParts: string[] = [];
  if (post.rent) metaParts.push(post.rent);
  if (post.budget) metaParts.push(post.budget);
  if (post.moveIn) metaParts.push(post.moveIn);
  if (post.moveTimeline) metaParts.push(post.moveTimeline);
  if (post.type === "FORMING" && post.seeking != null) {
    const prog = formingProgress(post.household?.length ?? 0, post.seeking);
    metaParts.push(`${prog.filled} in, ${prog.open} to go`);
  } else if (area) {
    metaParts.push(area);
  }
  if (post.postedLabel) metaParts.push(post.postedLabel);
  const cta =
    post.type === "FORMING"
      ? "Ask to join →"
      : post.type === "LOOKING"
        ? "Say hi →"
        : "Open →";
  return {
    key: "housing",
    href: housingPostPath(post.id),
    kicker: kicker.replace(/_/g, " "),
    title,
    line,
    meta: metaParts.filter(Boolean).join(" · ") || "THE HAÜZ",
    cta,
    accent: ACCENT.housing,
    thumbUrl: post.photos?.[0] ?? null,
    isLive: true,
  };
}

export function mapGiftingSample(post: GiftingRow): HomeStageCardData {
  const hands = post.interestCount ?? 0;
  const handsMeta =
    post.postType === "GIFT"
      ? `${hands} of 3 hands up`
      : timeAgo(post.createdAt);
  return {
    key: "gifting",
    href: giftingPostPath(post.id),
    kicker: post.postType === "ISO" ? "In search of" : "On the board now",
    title: post.title,
    line: clip(
      [post.neighborhood, post.description].filter(Boolean).join(". ") || post.description,
    ),
    meta: [timeAgo(post.createdAt), handsMeta].filter(Boolean).join(" · "),
    cta: post.postType === "ISO" ? "I can help →" : "Raise hand →",
    accent: ACCENT.gifting,
    thumbUrl: post.photoUrls?.[0] ?? null,
    isLive: true,
  };
}

export function mapGigSample(post: GigRow): HomeStageCardData {
  const hiring = post.postType === "POSTING_GIG";
  return {
    key: "gigs",
    href: gigPostPath(post.id),
    kicker: hiring ? "Hiring" : "Talent available",
    title: post.title,
    line: clip(post.description),
    meta: [post.location, post.compensation, timeAgo(post.createdAt)]
      .filter(Boolean)
      .join(" · "),
    cta: "Say hi →",
    accent: ACCENT.gigs,
    thumbUrl: post.imageUrl ?? null,
    isLive: true,
  };
}

export function mapSpottedSample(post: SpottedRow): HomeStageCardData {
  const place =
    post.eventTitle ||
    post.eventVenue ||
    post.venueHint ||
    (post.beachId ? "At the beach" : null) ||
    "Around town";
  const day = post.eventDay || post.dayOfWeek || null;
  return {
    key: "spotted",
    href: spottedPostPath(post.id),
    kicker: "Missed connections",
    title: post.title,
    line: clip(post.body),
    meta: [timeAgo(post.createdAt), day, place].filter(Boolean).join(" · "),
    cta: "Reply →",
    accent: ACCENT.spotted,
    thumbUrl: null,
    quoteTile: true,
    isLive: true,
  };
}

export function buildHomeStageSamples(input: {
  events?: EventListing[];
  housingPosts?: HousingPostView[];
  gifting?: GiftingRow[];
  gigs?: GigRow[];
  spotted?: SpottedRow[];
  attendanceSummaries?: AttendanceSummaryMap;
  nowMs?: number;
}): HomeStageSamples {
  const out: HomeStageSamples = {};
  const events = input.events ?? [];
  const first = firstLiveEvent(events, input.nowMs);
  if (first) {
    const going = input.attendanceSummaries?.[String(first.id)]?.count;
    out.events = mapEventSample(first, going);
  }

  const housing = input.housingPosts?.find((post) => post.author?.username !== "hausing_demo");
  if (housing) out.housing = mapHousingSample(housing);

  const gift = (input.gifting ?? []).find(isActiveGifting);
  if (gift) out.gifting = mapGiftingSample(gift);

  const gig = (input.gigs ?? []).find(isActiveGig);
  if (gig) out.gigs = mapGigSample(gig);

  const spotted = input.spotted?.find((post) => !post.isDemo);
  if (spotted) out.spotted = mapSpottedSample(spotted);

  return out;
}

/** Soft demo fallbacks when boards are empty (hrefs go to boards, DEMO sticker on). */
export const HOME_STAGE_DEMO_SAMPLES: HomeStageSamples = {
  events: {
    key: "events",
    href: "/events",
    kicker: "Happening now",
    title: "Champagne's catch a rising star",
    line: "Darcelle XV, Pearl District. Tickets are at the door.",
    meta: "Fri · 9:00 PM",
    cta: "I'm going →",
    accent: "var(--day-fri, #FF00CC)",
    thumbUrl: "/home/flyers/sasha-colby-live.jpg",
    isLive: false,
  },
  housing: {
    key: "housing",
    href: "/the-hauz",
    kicker: "FORMING A HAÜS",
    title: "Wildrose haüs, 2 in, 2 to go",
    line: "Southeast. Big kitchen, one very polite beagle.",
    meta: "$850 · Feb 1 · 4 asks",
    cta: "Ask to join →",
    accent: ACCENT.housing,
    thumbUrl: "/home/hausing/room-forming.jpg",
    isLive: false,
  },
  gifting: {
    key: "gifting",
    href: "/gifting",
    kicker: "On the board now",
    title: "Free moving boxes (about 20)",
    line: "SE Portland. Take them all, they are clean and flat.",
    meta: "24m ago · 0 of 3 hands up",
    cta: "Raise hand →",
    accent: ACCENT.gifting,
    thumbUrl: "/home/gifting/gift-boxes.jpg",
    isLive: false,
  },
  gigs: {
    key: "gigs",
    href: "/pride-work",
    kicker: "Hiring",
    title: "Coat check, two people, 9pm to 2am",
    line: "Paid cash at the end of the night. Tips are yours.",
    meta: "Sat · Southeast · $25/hr",
    cta: "Say hi →",
    accent: ACCENT.gigs,
    thumbUrl: "/home/flyers/certified-freak-block-party.jpg",
    isLive: false,
  },
  spotted: {
    key: "spotted",
    href: "/spotted",
    kicker: "Missed connections",
    title: "Blue buzzcut, back patio, two waters",
    line: "You gave one to me. I did not get your name.",
    meta: "2h ago · Fri · Pearl District",
    cta: "Reply →",
    accent: ACCENT.spotted,
    quoteTile: true,
    isLive: false,
  },
};

/** Live samples with demo fill for any board that has no posts yet. */
export function withDemoFallbacks(live: HomeStageSamples): HomeStageSamples {
  return {
    events: live.events ?? HOME_STAGE_DEMO_SAMPLES.events,
    housing: live.housing ?? HOME_STAGE_DEMO_SAMPLES.housing,
    gifting: live.gifting ?? HOME_STAGE_DEMO_SAMPLES.gifting,
    gigs: live.gigs ?? HOME_STAGE_DEMO_SAMPLES.gigs,
    spotted: live.spotted ?? HOME_STAGE_DEMO_SAMPLES.spotted,
  };
}

/**
 * Fetch board feeds and map one sample card per home-stage slide.
 * Safe to call from HomeStage / Home even before the full stage UI lands.
 */
export function useHomeStageSamples(opts?: { includeDemoFallback?: boolean }) {
  const includeDemo = opts?.includeDemoFallback !== false;

  const { data: events = [] } = useQuery<EventListing[]>({
    queryKey: ["/api/events"],
    queryFn: () => apiRequest("GET", "/api/events").then((r) => r.json()),
    staleTime: 60_000,
  });

  const { data: housing } = useQuery<HousingBoardResponse>({
    queryKey: ["/api/housing", "home-stage-forming"],
    queryFn: async () => {
      // This slide is about building a household, not browsing managed units.
      // Ask the board for a real FORMING post so the utility card matches the story.
      const r = await fetch("/api/housing?type=FORMING&limit=1", { credentials: "include" });
      if (!r.ok) return { posts: [], stats: { activePosts: 0, formingHouses: 0, roomsOpen: 0 } };
      return r.json();
    },
    staleTime: 60_000,
  });

  const { data: gifting = [] } = useQuery<GiftingRow[]>({
    queryKey: ["/api/gifting"],
    queryFn: async () => {
      const r = await fetch("/api/gifting", { credentials: "include" });
      if (!r.ok) return [];
      return r.json();
    },
    staleTime: 60_000,
  });

  const { data: gigs = [] } = useQuery<GigRow[]>({
    queryKey: ["/api/gigs"],
    queryFn: async () => {
      const r = await fetch("/api/gigs", { credentials: "include" });
      if (!r.ok) return [];
      return r.json();
    },
    staleTime: 60_000,
  });

  const { data: spotted = [] } = useQuery<SpottedRow[]>({
    queryKey: ["/api/missed-connections"],
    queryFn: async () => {
      const r = await fetch("/api/missed-connections", { credentials: "include" });
      if (!r.ok) return [];
      return r.json();
    },
    staleTime: 60_000,
  });

  const { data: attendanceSummaries = {} } = useQuery<AttendanceSummaryMap>({
    queryKey: ["/api/events/attendance-summaries"],
    queryFn: () =>
      apiRequest("GET", "/api/events/attendance-summaries").then((r) => r.json()),
    staleTime: 60_000,
  });

  const live = useMemo(
    () =>
      buildHomeStageSamples({
        events,
        housingPosts: housing?.posts,
        gifting,
        gigs,
        spotted,
        attendanceSummaries,
      }),
    [events, housing?.posts, gifting, gigs, spotted, attendanceSummaries],
  );

  const samples = useMemo(
    () => (includeDemo ? withDemoFallbacks(live) : live),
    [includeDemo, live],
  );

  const stageLists = useMemo(() => {
    const activeGigs = gigs.filter(isActiveGig);
    const leadGig = activeGigs[0];
    const contrastingGig = leadGig
      ? activeGigs.find((gig) =>
          gig.id !== leadGig.id &&
          gig.postType !== leadGig.postType &&
          gig.title.trim().toLowerCase() !== "anything",
        )
      : undefined;

    return {
      gifting: gifting.filter(isActiveGifting).slice(0, 2).map(mapGiftingSample),
      gigs: [leadGig, contrastingGig].filter((gig): gig is GigRow => Boolean(gig)).map(mapGigSample),
      spotted: spotted.slice(0, 1).map(mapSpottedSample),
    };
  }, [gifting, gigs, spotted]);

  return { samples, live, events, attendanceSummaries, stageLists };
}

/** Shared slug helper if a future /board/:id/:slug route lands. */
export function boardSlug(title: string): string {
  return slugifyEventTitle(title);
}
