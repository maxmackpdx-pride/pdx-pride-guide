import { Suspense, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { GiftingPost, GigPost, MissedConnection } from "@shared/schema";
import type { EventListing } from "@shared/multiDayEvents";

import ScrollReveal from "@/components/ScrollReveal";
import HomeHero from "@/components/HomeHero";
import { usePageSeo } from "@/hooks/usePageSeo";
import AuthModal from "@/components/AuthModal";
import PlaceModal from "@/components/PlaceModal";
import { TYPE_LABELS, TYPE_TO_DS_CATEGORY, type Business } from "@/pages/Directory";
import {
  Button,
  Divider,
  Marquee,
  PlaceCard,
  SectionHeader,
} from "@/components/ds";
import {
  HOME_MARQUEE_FALLBACK,
  pickMarqueeItems,
  pickRandomBusinesses,
} from "@/lib/homeEvents";
import {
  directoryFallbackLogo,
  resolveDirectoryLogo,
} from "@/lib/directoryLogos";
import HomeSchedule from "@/components/HomeSchedule";
import { lazyWithReload } from "@/lib/lazyWithReload";
import "./Home.css";

const DirectoryMap = lazyWithReload(() => import("@/components/DirectoryMap"));

const COMMUNITY_LINKS = {
  spotted: { href: "/spotted", label: "Spotted" },
  gifting: { href: "/gifting", label: "Gifting" },
  gigs: { href: "/pride-work", label: "Gigs" },
} as const;

/** Static design placeholders when a board feed has not loaded any rows yet. */
const BOARD_COUNT_FALLBACK = {
  spotted: 128,
  gifting: 64,
  gigs: 37,
} as const;

type GiftingFeedPost = GiftingPost & {
  neighborhood: string;
};

type GigFeedPost = GigPost & {
  location: string | null;
  compensation: string | null;
};

export default function Home() {
  usePageSeo(
    "PDX Pride Guide | Portland Pride 2026 Events",
    "Every Portland Pride 2026 event in one place. Find the party, back the queer spaces that host it, and stick around after July 19.",
  );

  const [marqueeItems, setMarqueeItems] = useState<string[]>([]);
  const [featuredSpots, setFeaturedSpots] = useState<Business[]>([]);
  const [featuredNonprofits, setFeaturedNonprofits] = useState<Business[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Business | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  const { data: events = [] } = useQuery<EventListing[]>({
    queryKey: ["/api/events"],
    queryFn: () => apiRequest("GET", "/api/events").then(r => r.json()),
    staleTime: 60_000,
    refetchOnMount: "always",
  });

  const { data: spotted = [] } = useQuery<MissedConnection[]>({
    queryKey: ["/api/missed-connections"],
    queryFn: () => apiRequest("GET", "/api/missed-connections").then(r => r.json()),
    staleTime: 60_000,
  });

  const { data: gifting = [] } = useQuery<GiftingFeedPost[]>({
    queryKey: ["/api/gifting"],
    queryFn: () => apiRequest("GET", "/api/gifting").then(r => r.json()),
    staleTime: 60_000,
  });

  const { data: gigs = [] } = useQuery<GigFeedPost[]>({
    queryKey: ["/api/gigs"],
    queryFn: () => apiRequest("GET", "/api/gigs").then(r => r.json()),
    staleTime: 60_000,
  });

  const { data: businesses = [] } = useQuery<Business[]>({
    queryKey: ["/api/directory"],
    queryFn: () => apiRequest("GET", "/api/directory").then(r => r.json()),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (events.length === 0) return;
    setMarqueeItems(prev =>
      prev.length > 0 ? prev : pickMarqueeItems(events),
    );
  }, [events]);

  useEffect(() => {
    if (businesses.length === 0) return;
    setFeaturedSpots(prev =>
      prev.length > 0 ? prev : pickRandomBusinesses(businesses.filter(b => b.type !== "nonprofit"), 10),
    );
    setFeaturedNonprofits(prev =>
      prev.length > 0 ? prev : pickRandomBusinesses(businesses.filter(b => b.type === "nonprofit"), 10),
    );
  }, [businesses]);

  const mappedBusinesses = useMemo(
    () => businesses.filter(b => b.lat != null && b.lng != null),
    [businesses],
  );

  const spottedCount = spotted.length > 0 ? spotted.length : BOARD_COUNT_FALLBACK.spotted;
  const giftingCount = gifting.length > 0 ? gifting.length : BOARD_COUNT_FALLBACK.gifting;
  const gigsCount = gigs.length > 0 ? gigs.length : BOARD_COUNT_FALLBACK.gigs;

  return (
    <div className="home-main-stage">
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} defaultTab="register" />}
      {selectedPlace && (
        <PlaceModal
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
          onRequireAuth={() => setShowAuth(true)}
        />
      )}
      <HomeHero eventCount={events.length} />

      <div className="home-live-ticker" aria-label="Live event ticker">
        <Link href="/events" className="home-live-ticker__label">
          Live
        </Link>
        <Marquee
          color="rainbow"
          items={marqueeItems.length > 0 ? marqueeItems : HOME_MARQUEE_FALLBACK.slice(0, 12)}
          className="home-live-ticker__marquee pdxMarquee--band"
          speed={67}
          separator="★"
        />
      </div>

      <div className="pg-block pg-block--schedule" style={{ paddingTop: 36 }}>
        <ScrollReveal>
          <SectionHeader
            kicker="All Week"
            title="The Schedule"
            subtitle="Seven days, side by side, stacked hour by hour. Saturday is a wall of color. Scroll sideways, tap anything that looks like trouble."
            accent="cyan"
            style={{ marginBottom: 0 }}
            action={
              <Link href="/schedule">
                <Button as="span" accent="cyan" size="sm" arrow>
                  View all events
                </Button>
              </Link>
            }
          />
          <div className="pg-home-schedule">
            <HomeSchedule />
          </div>
        </ScrollReveal>
      </div>

      {/* Find Your People: community board tiles (isolated section) */}
      <section className="home-boards" aria-label="Community boards">
        <div className="home-boards__seam" aria-hidden="true" />
        <div className="home-boards__halftone" aria-hidden="true" />
        <div className="home-boards__tints" aria-hidden="true" />

        <div className="home-boards__inner">
          <ScrollReveal>
            <div className="home-boards__running">
              <div className="home-boards__kicker">
                <span className="home-boards__dot" aria-hidden="true" />
                The Community Boards
              </div>
              <Link href={COMMUNITY_LINKS.spotted.href} className="home-boards__all">
                All Boards →
              </Link>
            </div>

            <div className="home-boards__header">
              <h2 className="home-boards__title">
                <span className="home-boards__title-plain">Find Your </span>
                <span className="home-boards__title-grad">People</span>
              </h2>
              <p className="home-boards__sub">
                Miss a connection, give something away, or line up a gig. The boards where the scene looks out for each other.
              </p>
            </div>
          </ScrollReveal>

          <div className="home-boards__grid">
            <ScrollReveal delay={0} className="home-boards__reveal">
            <Link
              href={COMMUNITY_LINKS.spotted.href}
              className="home-boards__card home-boards__card--spotted"
              data-testid="home-board-spotted"
            >
              <img
                className="home-boards__img"
                src="/boards/board-spotted.png"
                alt=""
                width={800}
                height={800}
                decoding="async"
                loading="lazy"
              />
              <div className="home-boards__scrim" aria-hidden="true" />
              <span className="home-boards__chip">{spottedCount} this week</span>
              <div className="home-boards__body">
                <div className="home-boards__name-row">
                  <span className="home-boards__name-dot" aria-hidden="true" />
                  <h3 className="home-boards__name">Spotted</h3>
                </div>
                <p className="home-boards__desc">
                  Missed connections and &quot;saw you at the bar&quot; notes. Shoot your shot.
                </p>
                <span className="home-boards__cta">Browse Spotted →</span>
              </div>
            </Link>
            </ScrollReveal>

            <ScrollReveal delay={50} className="home-boards__reveal">
            <Link
              href={COMMUNITY_LINKS.gifting.href}
              className="home-boards__card home-boards__card--gifting"
              data-testid="home-board-gifting"
            >
              <img
                className="home-boards__img"
                src="/boards/board-gifting.png"
                alt=""
                width={800}
                height={800}
                decoding="async"
                loading="lazy"
              />
              <div className="home-boards__scrim" aria-hidden="true" />
              <span className="home-boards__chip">{giftingCount} up for grabs</span>
              <div className="home-boards__body">
                <div className="home-boards__name-row">
                  <span className="home-boards__name-dot" aria-hidden="true" />
                  <h3 className="home-boards__name">Gifting</h3>
                </div>
                <p className="home-boards__desc">
                  Free gear and hand-me-downs looking for a new home. Take what you need.
                </p>
                <span className="home-boards__cta">Browse Gifting →</span>
              </div>
            </Link>
            </ScrollReveal>

            <ScrollReveal delay={100} className="home-boards__reveal">
            <Link
              href={COMMUNITY_LINKS.gigs.href}
              className="home-boards__card home-boards__card--gigs"
              data-testid="home-board-gigs"
            >
              <img
                className="home-boards__img"
                src="/boards/board-gigs.png"
                alt=""
                width={800}
                height={800}
                decoding="async"
                loading="lazy"
              />
              <div className="home-boards__scrim" aria-hidden="true" />
              <span className="home-boards__chip">{gigsCount} open</span>
              <div className="home-boards__body">
                <div className="home-boards__name-row">
                  <span className="home-boards__name-dot" aria-hidden="true" />
                  <h3 className="home-boards__name">Gigs</h3>
                </div>
                <p className="home-boards__desc">
                  Performers, DJs, and helping hands for hire. Book the talent.
                </p>
                <span className="home-boards__cta">Browse Gigs →</span>
              </div>
            </Link>
            </ScrollReveal>
          </div>

          <ScrollReveal delay={150}>
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
          </ScrollReveal>
        </div>
      </section>

      <div className="pg-seam-wrap--sm">
        <Divider seam />
      </div>
      <div className="pg-block">
        <ScrollReveal>
          <SectionHeader
            kicker="Queer Places"
            title="Where to Go"
            subtitle="The bars, the cafes, the venues, the nonprofits keeping people housed and fed. All of it run by and for the community. Hit refresh for a whole new set of picks."
            accent="cyan"
          />
          <div className="pg-places pg-places--dual">
            <div id="home-map">
              <Suspense
                fallback={
                  <div
                    style={{ flex: 1, minHeight: 200, background: "var(--ink-900)" }}
                    role="status"
                    aria-label="Loading directory map"
                  />
                }
              >
                <DirectoryMap businesses={mappedBusinesses} height="100%" />
              </Suspense>
            </div>
            <div className="pg-placescol">
              <div className="pg-colhd">
                <span className="pg-colhd__t" style={{ color: "var(--cyan)" }}>Spots</span>
                <span className="pg-colhd__rule" style={{ background: "linear-gradient(to right, var(--cyan), transparent)" }} />
              </div>
              <div className="pg-placescroll">
                {featuredSpots.map(biz => (
                  <HomePlaceCard key={biz.id} biz={biz} onOpen={() => setSelectedPlace(biz)} />
                ))}
                {featuredSpots.length === 0 && (
                  <PlaceCard
                    name="Queer Portland"
                    category="venues"
                    donateUrl={undefined}
                    categoryLabel="Directory"
                    description="The community directory is being built. Check back for bars, cafes, and venues."
                  />
                )}
              </div>
              <Link href="/directory" className="pg-board-more" style={{ color: "var(--cyan)" }}>
                View more spots →
              </Link>
            </div>
            <div className="pg-placescol">
              <div className="pg-colhd">
                <span className="pg-colhd__t" style={{ color: "var(--purple)" }}>Nonprofits</span>
                <span className="pg-colhd__rule" style={{ background: "linear-gradient(to right, var(--purple), transparent)" }} />
              </div>
              <div className="pg-placescroll">
                {featuredNonprofits.map(biz => (
                  <HomePlaceCard key={biz.id} biz={biz} onOpen={() => setSelectedPlace(biz)} />
                ))}
                {featuredNonprofits.length === 0 && (
                  <PlaceCard
                    name="Community Nonprofits"
                    category="venues"
                    categoryLabel="Directory"
                    description="Nonprofit listings are being added. Check back for organizations doing the work."
                  />
                )}
              </div>
              <Link href="/directory?type=nonprofit" className="pg-board-more" style={{ color: "var(--purple)" }}>
                View more nonprofits →
              </Link>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 24 }}>
            <Link href="/directory" style={{ textDecoration: "none" }}>
              <Button as="span" accent="cyan" arrow>
                Full directory
              </Button>
            </Link>
            <Link href="/directory?add=1" style={{ textDecoration: "none" }}>
              <Button as="span" accent="magenta">
                Add your business
              </Button>
            </Link>
          </div>
        </ScrollReveal>
      </div>

    </div>
  );
}

/** Same logo resolution as Directory cards (neon pack + DB imageUrl + type fallback). */
function HomePlaceCard({ biz, onOpen }: { biz: Business; onOpen: () => void }) {
  const isNonprofit = biz.type === "nonprofit";
  const logoUrl = resolveDirectoryLogo(biz.name, biz.imageUrl) || undefined;
  const fallbackLogoUrl = directoryFallbackLogo(biz.type);
  return (
    <PlaceCard
      name={biz.name}
      onClick={onOpen}
      category={TYPE_TO_DS_CATEGORY[biz.type] || "venues"}
      className={`pdxPlace--clickable${isNonprofit ? " pdxPlace--rainbow" : ""}`}
      isNonprofit={isNonprofit}
      logoUrl={logoUrl}
      fallbackLogoUrl={fallbackLogoUrl}
      lat={biz.lat}
      lng={biz.lng}
      promoters={biz.promoters}
      donateUrl={biz.donateUrl || undefined}
      categoryLabel={TYPE_LABELS[biz.type] || biz.type}
      address={[biz.address, biz.neighborhood].filter(Boolean).join(" · ") || undefined}
      hours={biz.hours || undefined}
      phone={biz.phone || undefined}
      description={biz.description || undefined}
      website={biz.website || undefined}
      instagram={biz.instagram || undefined}
      grandOpening={biz.isNew}
    />
  );
}