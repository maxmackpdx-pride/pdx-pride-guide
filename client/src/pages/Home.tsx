import { useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { EventListing } from "@shared/multiDayEvents";

import ScrollReveal from "@/components/ScrollReveal";
import HomeHero from "@/components/HomeHero";
import HomeStatStrip from "@/components/HomeStatStrip";
import HomeUpNext from "@/components/HomeUpNext";
import HomeBeachWidget from "@/components/HomeBeachWidget";
import HomeConstructionNudge from "@/components/HomeConstructionNudge";
import { usePageSeo } from "@/hooks/usePageSeo";
import {
  Button,
  Divider,
} from "@/components/ds";
import {
  countEventsNext7Days,
  eventsUpNext,
} from "@/lib/homeEvents";
import "./Home.css";

const COMMUNITY_LINKS = {
  spotted: { href: "/spotted", label: "Missed Connections" },
  gifting: { href: "/gifting", label: "Gifting" },
  gigs: { href: "/pride-work", label: "Gigs" },
} as const;

const PLACES_FALLBACK = 64;

const DIRECTORY_CHIPS = [
  { label: "Bars", color: "var(--cat-bars)" },
  { label: "Food", color: "var(--cat-food)" },
  { label: "Cafes", color: "var(--cat-cafes)" },
  { label: "Venues", color: "var(--cat-venues)" },
  { label: "Shops", color: "var(--cat-shops)" },
] as const;

export default function Home() {
  usePageSeo(
    "Zaylist | Portland Pride 2026 Events",
    "Every Portland night worth knowing, in one place. Find the party, back the rooms that host it, and stick around after July 19.",
  );

  const { data: events = [] } = useQuery<EventListing[]>({
    queryKey: ["/api/events"],
    queryFn: () => apiRequest("GET", "/api/events").then(r => r.json()),
    staleTime: 60_000,
    refetchOnMount: "always",
  });

  const { data: businesses = [] } = useQuery<{ id: number }[]>({
    queryKey: ["/api/directory"],
    queryFn: () => apiRequest("GET", "/api/directory").then(r => r.json()),
    staleTime: 60_000,
  });

  const { data: attendanceSummaries = {} } = useQuery<Record<string, { count?: number }>>({
    queryKey: ["/api/events/attendance-summaries"],
    queryFn: () => apiRequest("GET", "/api/events/attendance-summaries").then(r => r.json()),
    staleTime: 60_000,
  });

  const upNext = useMemo(() => eventsUpNext(events, 4), [events]);
  // Rolling next-7-days total (expanded LIVE listings from GET /api/events).
  const eventCount = useMemo(() => countEventsNext7Days(events), [events]);
  const placesCount = businesses.length > 0 ? businesses.length : PLACES_FALLBACK;
  const goingCount = useMemo(
    () => Object.values(attendanceSummaries).reduce((sum, s) => sum + (s?.count ?? 0), 0),
    [attendanceSummaries],
  );

  return (
    <div className="home-main-stage">
      <HomeConstructionNudge />
      <HomeHero />
      <HomeStatStrip
        eventCount={eventCount}
        placesCount={placesCount}
        goingCount={goingCount}
      />

      {/* Same animated rainbow seam as under the top nav (not the old event ticker) */}
      <div className="rainbow-bar rainbow-bar--thick rainbow-bar--bleed home-rainbow-seam" aria-hidden="true" />

      <div className="home-body">
        <ScrollReveal>
          <HomeUpNext events={upNext} posterBackdrop />
        </ScrollReveal>

        {/* Loop-safe site rainbow (cyan bookends)  -  not the hard orange→cyan seam line */}
        <div className="rainbow-bar rainbow-bar--thick home-body__seam" aria-hidden="true" />

        <section className="home-boards" aria-label="Community boards">
          <div className="home-boards__running">
            <div className="home-boards__kicker">
              <span className="home-boards__dot" aria-hidden />
              The Community Boards
            </div>
            <Link href={COMMUNITY_LINKS.spotted.href} className="home-boards__all">
              All Boards →
            </Link>
          </div>

          <div className="home-boards__header">
            <h2 className="home-boards__title">
              <span className="home-boards__title-plain">Show up for </span>
              <span className="home-boards__title-grad">each other</span>
            </h2>
            <p className="home-boards__sub">
              Miss a connection, give something away, or line up a gig. The boards where the scene looks out for each other.
            </p>
          </div>

          <div className="home-boards__utility-grid">
            <Link
              href={COMMUNITY_LINKS.spotted.href}
              className="home-boards__utility home-boards__utility--magenta pdx-glass-card pdx-glass-card--left-accent"
              style={{ ["--c" as string]: "#FF00CC" }}
              data-testid="home-board-spotted"
            >
              <div className="home-boards__utility-name">Missed Connections</div>
              <p className="home-boards__utility-desc">
                Anonymous missed connections. Say the thing you didn&apos;t get to say.
              </p>
              <div className="home-boards__utility-mantra">Stay kind · stay anonymous · reveal when ready</div>
            </Link>
            <Link
              href={COMMUNITY_LINKS.gifting.href}
              className="home-boards__utility home-boards__utility--lime pdx-glass-card pdx-glass-card--left-accent"
              style={{ ["--c" as string]: "#CCFF00" }}
              data-testid="home-board-gifting"
            >
              <div className="home-boards__utility-name">Gifting</div>
              <p className="home-boards__utility-desc">
                A free board. Give what you can, take what you need. No money changes hands.
              </p>
              <div className="home-boards__utility-mantra">Keep it free · keep it kind · keep it moving</div>
            </Link>
            <Link
              href={COMMUNITY_LINKS.gigs.href}
              className="home-boards__utility home-boards__utility--purple pdx-glass-card pdx-glass-card--left-accent"
              style={{ ["--c" as string]: "var(--board-gigs)" }}
              data-testid="home-board-gigs"
            >
              <div className="home-boards__utility-name">Gig Board</div>
              <p className="home-boards__utility-desc">
                Two-way work board. Performers, hosts, crew. Get paid, get help.
              </p>
              <div className="home-boards__utility-mantra">Need work? Need help? Both belong here.</div>
            </Link>
          </div>

          <div className="home-boards__foot">
            <Link href={COMMUNITY_LINKS.spotted.href} className="home-boards__post-link">
              <Button as="span" variant="solid" accent="lime" size="lg" arrow>
                Post to a Board
              </Button>
            </Link>
            <span className="home-boards__foot-note">
              Free to post. Be kind. Take care of each other.
            </span>
          </div>
        </section>

        <section className="home-directory-row" aria-label="Directory and nude beaches">
          <div className="home-directory-teaser">
            <div className="home-directory-teaser__kicker">THE DIRECTORY FOR US</div>
            <h3 className="home-directory-teaser__title">SPEND HERE, KEEP THE NIGHTS OPEN</h3>
            <p className="home-directory-teaser__copy">
              Bars, cafes, shops, and venues that are ours - or truly for us. Filter by category, find them on the map.
            </p>
            <div className="home-directory-teaser__chips">
              {DIRECTORY_CHIPS.map(chip => (
                <span
                  key={chip.label}
                  className="home-directory-teaser__chip"
                  style={{ color: chip.color, borderColor: chip.color }}
                >
                  {chip.label}
                </span>
              ))}
            </div>
            <Link href="/directory" className="home-directory-teaser__cta">
              Browse the directory →
            </Link>
          </div>
          <HomeBeachWidget showCollins />
        </section>
      </div>

      <div className="pg-seam-wrap--sm">
        <Divider seam />
      </div>
    </div>
  );
}