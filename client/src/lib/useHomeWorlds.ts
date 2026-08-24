/**
 * Live wiring for the home destination rail.
 *
 * One hook feeds all ten cards. Every slot follows the same rule: live records
 * from the board's own API come first, sorted newest first, and the demo
 * material in `homeWorlds.ts` only fills the slots live data did not reach.
 * Anything that came from demo keeps `isLive: false` so the card can sticker
 * it DEMO, per the live-is-truth rule in docs/LIVE_DESIGN_STANDARD.md.
 *
 * Two feeds are deliberately capped rather than paged:
 *   EVENTZ  - the next 10 events, so the flyer rotation is tonight and soon,
 *             never the whole calendar.
 *   Z/SPACE - the next 10 things still to come today, so "Happening today"
 *             cannot drift into tomorrow.
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { EventListing } from "@shared/multiDayEvents";
import type { HousingBoardResponse, HousingPostView } from "@shared/housing";
import type { NudeBeachesSnapshot } from "@shared/nudeBeaches";
import type { OutzSnapshot } from "@shared/outz";
import { outzPlaceHref } from "@shared/outz";
import { pacificCalendarDate, parsePacificDateTime } from "@shared/missedConnections";
import { eventPath } from "@shared/eventSlug";
import { placePath } from "@shared/placeSlug";
import { eventsUpNext, dayColorVar } from "@/lib/homeEvents";
import { formatListingWhen, listingDay, listingPosterUrl } from "@/lib/dsEvent";
import { directoryFallbackLogo, resolveDirectoryLogo } from "@/lib/directoryLogos";
import {
  mapGiftingSample,
  mapGigSample,
  mapHousingSample,
  mapSpottedSample,
  type GiftingRow,
  type GigRow,
  type HomeStageCardData,
  type SpottedRow,
} from "@/lib/homeStageSamples";
import {
  DEMO_FLYER,
  DEMO_ITEMS,
  DEMO_OUTZ_ROWS,
  DEMO_PILLS,
  DEMO_PLACE_LOGOS,
  DEMO_POSTINGS,
  WORLD_FEED_LIMITS,
  type WorldFlyer,
  type WorldItem,
  type WorldPanel,
  type WorldPill,
  type WorldPosting,
  type WorldRow,
} from "@/lib/homeWorlds";

const PACIFIC_TZ = "America/Los_Angeles";

type DirectoryPlace = { id: number; name: string; imageUrl?: string | null; type?: string | null };

type SellzRow = {
  id: number;
  title: string;
  condition: string;
  priceCents: number;
  neighborhood: string;
  photoUrls?: string[] | null;
  status?: string;
  createdAt: string;
};

type BeachCheckin = { id: number };

/**
 * Pill colours rotate through the board tokens so a day's worth of events reads
 * as the rainbow. Using the day token instead would paint the whole column one
 * colour, because every pill is the same day by definition.
 */
const PILL_ACCENTS = [
  "var(--day-thu, #00ffff)",
  "var(--board-gigs, #6e3dff)",
  "var(--neon-green, #39ff14)",
  "var(--board-spotted, #ff00cc)",
  "var(--board-gifting, #ccff00)",
];

function newestFirst<T>(rows: T[], at: (row: T) => string | null | undefined): T[] {
  const ms = (row: T) => Date.parse(at(row) || "") || 0;
  return [...rows].sort((a, b) => ms(b) - ms(a));
}

/**
 * Live records first, demo material only for the slots they did not fill.
 * `key` keeps a demo row from doubling a live one that describes the same
 * thing: OUTZ builds its live Rooster Rock row from the demo row, so without
 * the check a half-live card would list Rooster Rock twice.
 */
function fillWithDemo<T>(live: T[], demo: T[], limit: number, key?: (row: T) => string): T[] {
  if (live.length >= limit) return live.slice(0, limit);
  const taken = key ? new Set(live.map(key)) : null;
  const spare = taken ? demo.filter(row => !taken.has(key!(row))) : demo;
  return [...live, ...spare.slice(0, limit - live.length)];
}

function clockLabel(dateStart: string): string {
  const ms = parsePacificDateTime(dateStart);
  if (ms == null) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: PACIFIC_TZ,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(ms));
}

/** A board sample and a rail posting are the same shape, under other names. */
function postingFromSample(card: HomeStageCardData, id: string, wide?: boolean): WorldPosting {
  return {
    id,
    href: card.href,
    kicker: card.kicker,
    title: card.title,
    line: card.line,
    meta: card.meta,
    action: card.cta.replace(/\s*→\s*$/, ""),
    photo: card.quoteTile ? null : card.thumbUrl ?? null,
    wide,
    isLive: card.isLive,
  };
}

function isActiveStatus(status: string | undefined, closed: string[]): boolean {
  return !closed.includes((status || "").toUpperCase());
}

export type HomeWorldsData = {
  outzRows: WorldRow[];
  flyers: WorldFlyer[];
  panels: WorldPanel[];
  postings: Record<"hauz" | "giftz" | "gigz" | "mizzed", WorldPosting[]>;
  items: WorldItem[];
  pills: WorldPill[];
};

export function useHomeWorlds(): HomeWorldsData {
  const { data: events = [] } = useQuery<EventListing[]>({
    queryKey: ["/api/events"],
    queryFn: () => apiRequest("GET", "/api/events").then(r => r.json()),
    staleTime: 60_000,
  });

  const { data: directory = [] } = useQuery<DirectoryPlace[]>({
    queryKey: ["/api/directory"],
    queryFn: () => apiRequest("GET", "/api/directory").then(r => r.json()),
    staleTime: 60_000,
  });

  const { data: housing } = useQuery<HousingBoardResponse>({
    queryKey: ["/api/housing", "home-worlds"],
    queryFn: async () => {
      const r = await fetch("/api/housing?limit=12", { credentials: "include" });
      if (!r.ok) return { posts: [], stats: { activePosts: 0, formingHouses: 0, roomsOpen: 0 } };
      return r.json();
    },
    staleTime: 60_000,
  });

  const { data: gifting = [] } = useQuery<GiftingRow[]>({
    queryKey: ["/api/gifting"],
    queryFn: async () => {
      const r = await fetch("/api/gifting", { credentials: "include" });
      return r.ok ? r.json() : [];
    },
    staleTime: 60_000,
  });

  const { data: gigs = [] } = useQuery<GigRow[]>({
    queryKey: ["/api/gigs"],
    queryFn: async () => {
      const r = await fetch("/api/gigs", { credentials: "include" });
      return r.ok ? r.json() : [];
    },
    staleTime: 60_000,
  });

  const { data: spotted = [] } = useQuery<SpottedRow[]>({
    queryKey: ["/api/missed-connections"],
    queryFn: async () => {
      const r = await fetch("/api/missed-connections", { credentials: "include" });
      return r.ok ? r.json() : [];
    },
    staleTime: 60_000,
  });

  const { data: sellz = [] } = useQuery<SellzRow[]>({
    queryKey: ["/api/sellz"],
    queryFn: async () => {
      const r = await fetch("/api/sellz", { credentials: "include" });
      return r.ok ? r.json() : [];
    },
    staleTime: 60_000,
  });

  const { data: beaches } = useQuery<{ data: NudeBeachesSnapshot }>({
    queryKey: ["/api/nude-beaches"],
    queryFn: () => apiRequest("GET", "/api/nude-beaches").then(r => r.json()),
    staleTime: 5 * 60_000,
  });

  const { data: outz } = useQuery<{ data: OutzSnapshot }>({
    queryKey: ["/api/outz"],
    queryFn: () => apiRequest("GET", "/api/outz").then(r => r.json()),
    staleTime: 10 * 60_000,
  });

  const { data: roosterCheckins = [] } = useQuery<BeachCheckin[]>({
    queryKey: ["/api/river-brats/checkins", "rooster-rock"],
    queryFn: async () => {
      const r = await fetch("/api/river-brats/checkins?beach=rooster-rock", { credentials: "include" });
      if (!r.ok) return [];
      const rows = await r.json();
      return Array.isArray(rows) ? rows : [];
    },
    staleTime: 60_000,
  });

  const { data: sauvieCheckins = [] } = useQuery<BeachCheckin[]>({
    queryKey: ["/api/river-brats/checkins", "sauvie-island"],
    queryFn: async () => {
      const r = await fetch("/api/river-brats/checkins?beach=sauvie-island", { credentials: "include" });
      if (!r.ok) return [];
      const rows = await r.json();
      return Array.isArray(rows) ? rows : [];
    },
    staleTime: 60_000,
  });

  /* ── 01 OUTZ ────────────────────────────────────────────────────────────
     The two river beaches are their own live snapshot; the third row is the
     first featured OUTZ destination, so the card never hardcodes a place the
     namespace does not carry. Descriptors stay static because they describe
     the place, not the day; the temperature and the head count are live. */
  const outzRows = useMemo<WorldRow[]>(() => {
    const rooster = beaches?.data?.roosterRock;
    const sauvie = beaches?.data?.sauvieIsland;
    const rows: WorldRow[] = [];

    if (rooster) {
      rows.push({
        ...DEMO_OUTZ_ROWS[0],
        stats: [DEMO_OUTZ_ROWS[0].stats, rooster.airTempF != null ? `${rooster.airTempF}° AIR` : null]
          .filter(Boolean)
          .join(" · "),
        count: roosterCheckins.length,
        isLive: true,
      });
    }
    if (sauvie) {
      rows.push({
        ...DEMO_OUTZ_ROWS[1],
        stats: [DEMO_OUTZ_ROWS[1].stats, sauvie.airTempF != null ? `${sauvie.airTempF}° AIR` : null]
          .filter(Boolean)
          .join(" · "),
        count: sauvieCheckins.length,
        isLive: true,
      });
    }

    const featured = outz?.data?.destinations?.[0];
    if (featured) {
      rows.push({
        id: featured.id,
        href: outzPlaceHref(featured),
        name: featured.name,
        stats: featured.subtitle.toUpperCase(),
        sub: [featured.forecast, `Source: ${featured.sourceName}.`, "Join today's group chat here."]
          .filter(Boolean)
          .join(" "),
        count: null,
        isLive: true,
      });
    }

    return fillWithDemo(rows, DEMO_OUTZ_ROWS, WORLD_FEED_LIMITS.outzRows, row => row.id);
  }, [beaches, outz, roosterCheckins.length, sauvieCheckins.length]);

  /* ── 02 EVENTZ ──────────────────────────────────────────────────────────
     The next ten events only. The flyer rotation is meant to be tonight and
     soon; loading the full calendar here would put a November listing on the
     front door in July. */
  const flyers = useMemo<WorldFlyer[]>(() => {
    const live = eventsUpNext(events, WORLD_FEED_LIMITS.events).map<WorldFlyer>(event => ({
      id: String(event.id),
      href: eventPath(event.id, event.title, event.dayOfWeek),
      title: event.title,
      when: [formatListingWhen(event), event.venueName || event.neighborhood]
        .filter(Boolean)
        .join(" · "),
      poster: listingPosterUrl(event) ?? null,
      dayColor: dayColorVar(listingDay(event)),
      isLive: true,
    }));
    return live.length ? live : [DEMO_FLYER];
  }, [events]);

  /* ── 03 OUR PLACEZ ──────────────────────────────────────────────────────
     A lit marquee, not an index. Nine panels, live directory first. */
  const panels = useMemo<WorldPanel[]>(() => {
    const live = directory.slice(0, WORLD_FEED_LIMITS.panels).map<WorldPanel>(place => ({
      id: `place-${place.id}`,
      href: placePath(place.id, place.name),
      name: place.name,
      logo:
        resolveDirectoryLogo(place.name, place.imageUrl || undefined) ||
        directoryFallbackLogo(place.type || "venue"),
    }));
    const demo = DEMO_PLACE_LOGOS.slice(0, WORLD_FEED_LIMITS.panels).map<WorldPanel>(name => ({
      id: `demo-${name}`,
      href: "/directory",
      name: name.replace(/_/g, " "),
      logo: `/directory-logos/${name}.png`,
    }));
    return fillWithDemo(live, demo, WORLD_FEED_LIMITS.panels, panel => panel.name.toLowerCase());
  }, [directory]);

  /* ── 04 / 05 / 06 / 08 postings ─────────────────────────────────────────
     Two per board, newest first, demo topping up whatever is short. */
  const postings = useMemo(() => {
    const limit = WORLD_FEED_LIMITS.postings;

    const hauzLive = newestFirst(
      (housing?.posts ?? []).filter(
        (post: HousingPostView) =>
          post.author?.username !== "hausing_demo" && isActiveStatus(post.status, ["ARCHIVED", "HIDDEN", "CLOSED"]),
      ),
      post => post.createdAt,
    )
      .slice(0, limit)
      .map((post, index) => postingFromSample(mapHousingSample(post), `hauz-${post.id}-${index}`));

    const giftzLive = newestFirst(
      gifting.filter(
        post =>
          post.username !== "hausing_demo" &&
          isActiveStatus(post.status, ["GIFTED", "FOUND", "EXPIRED", "PENDING", "REJECTED", "HIDDEN"]),
      ),
      post => post.createdAt,
    )
      .slice(0, limit)
      .map((post, index) => postingFromSample(mapGiftingSample(post), `giftz-${post.id}-${index}`));

    const gigzLive = newestFirst(
      gigs.filter(
        post =>
          post.username !== "hausing_demo" &&
          isActiveStatus(post.status, ["FILLED", "FOUND", "EXPIRED", "PENDING", "REJECTED", "HIDDEN", "CLOSED"]),
      ),
      post => post.createdAt,
    )
      .slice(0, limit)
      .map((post, index) => postingFromSample(mapGigSample(post), `gigz-${post.id}-${index}`));

    const mizzedLive = newestFirst(
      spotted.filter(post => !post.isDemo && isActiveStatus(post.status, ["REJECTED", "HIDDEN", "EXPIRED"])),
      post => post.createdAt,
    )
      .slice(0, limit)
      .map((post, index) => postingFromSample(mapSpottedSample(post), `mizzed-${post.id}-${index}`, true));

    return {
      hauz: fillWithDemo(hauzLive, DEMO_POSTINGS.hauz, limit),
      giftz: fillWithDemo(giftzLive, DEMO_POSTINGS.giftz, limit),
      gigz: fillWithDemo(gigzLive, DEMO_POSTINGS.gigz, limit),
      mizzed: fillWithDemo(mizzedLive, DEMO_POSTINGS.mizzed, limit),
    };
  }, [housing?.posts, gifting, gigs, spotted]);

  /* ── 07 SELLZ ───────────────────────────────────────────────────────────
     Four tiles, newest first. Reserved listings keep their badge. */
  const items = useMemo<WorldItem[]>(() => {
    const live = newestFirst(
      sellz.filter(post => isActiveStatus(post.status, ["SOLD", "EXPIRED", "REMOVED"])),
      post => post.createdAt,
    )
      .slice(0, WORLD_FEED_LIMITS.items)
      .map<WorldItem>(post => ({
        id: `sellz-${post.id}`,
        href: `/sellz?post=${post.id}`,
        price: `$${Math.round(post.priceCents / 100)}`,
        cond: [post.condition, post.neighborhood].filter(Boolean).join(" · "),
        photo: post.photoUrls?.[0] ?? null,
        reserved: (post.status || "").toUpperCase() === "RESERVED",
        isLive: true,
      }));
    return fillWithDemo(live, DEMO_ITEMS, WORLD_FEED_LIMITS.items);
  }, [sellz]);

  /* ── 09 Z/SPACE ─────────────────────────────────────────────────────────
     Today only, and only the next ten. An event that already ended is not
     happening today any more, and tomorrow is not today. */
  const pills = useMemo<WorldPill[]>(() => {
    const now = Date.now();
    const todayKey = pacificCalendarDate(new Date(now).toISOString());
    const live = events
      .filter(event => {
        if (pacificCalendarDate(event.dateStart) !== todayKey) return false;
        const endMs = parsePacificDateTime(event.dateEnd) ?? parsePacificDateTime(event.dateStart);
        return endMs != null && endMs >= now;
      })
      .sort(
        (a, b) => (parsePacificDateTime(a.dateStart) ?? 0) - (parsePacificDateTime(b.dateStart) ?? 0),
      )
      .slice(0, WORLD_FEED_LIMITS.today)
      .map<WorldPill>((event, index) => ({
        id: `pill-${event.id}`,
        href: eventPath(event.id, event.title, event.dayOfWeek),
        label: [event.title, event.venueName].filter(Boolean).join(" · "),
        time: clockLabel(event.dateStart),
        accent: PILL_ACCENTS[index % PILL_ACCENTS.length],
        isLive: true,
      }));
    return live.length ? live : DEMO_PILLS;
  }, [events]);

  return { outzRows, flyers, panels, postings, items, pills };
}
