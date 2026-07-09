import { Suspense, useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { GiftingPost, GigPost, MissedConnection } from "@shared/schema";
import type { EventListing } from "@shared/multiDayEvents";

import ScrollReveal from "@/components/ScrollReveal";
import HomeHero from "@/components/HomeHero";
import { usePageSeo } from "@/hooks/usePageSeo";
import {
  Button,
  Divider,
  Marquee,
  PlaceCard,
  SectionHeader,
} from "@/components/ds";
import {
  HOME_DAY_META,
  HOME_MARQUEE_FALLBACK,
  pickMarqueeItems,
  pickRandomBusinesses,
  type HomeDayKey,
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
  spotted: { href: "/spotted", label: "Spotted", color: "var(--pink)" },
  gifting: { href: "/gifting", label: "Gifting", color: "var(--lime)" },
  gigs: { href: "/pride-work", label: "Gigs", color: "var(--cyan)" },
} as const;

const NOTE_ACCENTS = ["var(--pink)", "var(--cyan)", "var(--purple)", "var(--lime)", "var(--amber)"];

const TYPE_LABELS: Record<string, string> = {
  bar: "Bars & Clubs",
  restaurant: "Restaurants",
  cafe: "Cafes",
  venue: "Venues",
  service: "Services",
  shop: "Shops",
  hotel: "Hotels",
  nonprofit: "Nonprofits",
};

const TYPE_TO_DS_CATEGORY: Record<string, string> = {
  bar: "bars",
  restaurant: "food",
  cafe: "cafes",
  venue: "venues",
  service: "services",
  shop: "shops",
  hotel: "hotels",
  nonprofit: "services",
};

type DirectoryBusiness = {
  id: number;
  name: string;
  type: string;
  description: string;
  address: string | null;
  neighborhood: string | null;
  website: string | null;
  instagram: string | null;
  donateUrl: string | null;
  hours: string | null;
  phone: string | null;
  imageUrl: string | null;
  isNew: boolean;
  lat: number | null;
  lng: number | null;
};

type GiftingFeedPost = GiftingPost & {
  neighborhood: string;
};

type GigFeedPost = GigPost & {
  location: string | null;
  compensation: string | null;
};

function formatSpottedWhen(post: MissedConnection): string {
  if (post.dayOfWeek) {
    const meta = HOME_DAY_META[post.dayOfWeek as HomeDayKey];
    return meta?.label ?? post.dayOfWeek;
  }
  if (!post.createdAt) return "";
  const ms = Date.parse(post.createdAt);
  if (!Number.isFinite(ms)) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(ms));
}

export default function Home() {
  usePageSeo(
    "PDX Pride Guide — Portland Pride 2026 Events",
    "Every Portland Pride 2026 event in one place. Find the party, back the queer spaces that host it, and stick around after July 19.",
  );

  const [marqueeItems, setMarqueeItems] = useState<string[]>([]);
  const [featuredSpots, setFeaturedSpots] = useState<DirectoryBusiness[]>([]);
  const [featuredNonprofits, setFeaturedNonprofits] = useState<DirectoryBusiness[]>([]);

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

  const { data: businesses = [] } = useQuery<DirectoryBusiness[]>({
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

  return (
    <div className="home-main-stage">
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

      <div className="pg-seam-wrap--sm">
        <Divider seam />
      </div>
      <div className="pg-block">
        <ScrollReveal>
          <SectionHeader
            kicker="The Community Board"
            title="Find Your People"
            subtitle="Somebody is looking for you. Somebody is giving away a couch. Somebody needs a bartender by Friday. It's all right here."
            accent="purple"
          />
          <div className="pg-board3">
            <div>
              <Link href={COMMUNITY_LINKS.spotted.href} className="pg-colhd pg-colhd--link">
                <span className="pg-colhd__t" style={{ color: COMMUNITY_LINKS.spotted.color }}>
                  {COMMUNITY_LINKS.spotted.label}
                </span>
                <span className="pg-colhd__rule" style={{ background: "linear-gradient(to right, var(--pink), transparent)" }} />
              </Link>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {spotted.slice(0, 3).map((post, i) => {
                  const spottedWhen = formatSpottedWhen(post);
                  return (
                  <Link key={post.id} href={COMMUNITY_LINKS.spotted.href} className="pg-note pg-note--spot" style={{ ["--_av" as string]: NOTE_ACCENTS[i % NOTE_ACCENTS.length] } as CSSProperties}>
                    <div className="pg-note__where">
                      <span className="d" aria-hidden="true" />
                      {post.venueHint || post.title}
                      {spottedWhen && (
                        <span style={{ color: "var(--text-faint)" }}> · {spottedWhen}</span>
                      )}
                    </div>
                    <p className="pg-note__text">{post.body}</p>
                    <span className="pg-note__reply">View on Spotted →</span>
                  </Link>
                  );
                })}
                {spotted.length === 0 && (
                  <Link href={COMMUNITY_LINKS.spotted.href} className="pg-note" style={{ ["--_av" as string]: "var(--pink)" } as CSSProperties}>
                    <p className="pg-note__text">No spotted posts yet. Be the first to leave a note.</p>
                    <span className="pg-note__reply">Go to Spotted →</span>
                  </Link>
                )}
              </div>
              <Link href={COMMUNITY_LINKS.spotted.href} className="pg-board-more" style={{ color: COMMUNITY_LINKS.spotted.color }}>
                All Spotted posts →
              </Link>
            </div>
            <div>
              <Link href={COMMUNITY_LINKS.gifting.href} className="pg-colhd pg-colhd--link">
                <span className="pg-colhd__t" style={{ color: COMMUNITY_LINKS.gifting.color }}>
                  {COMMUNITY_LINKS.gifting.label}
                </span>
                <span className="pg-colhd__rule" style={{ background: "linear-gradient(to right, var(--lime), transparent)" }} />
              </Link>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {gifting.slice(0, 3).map((post, i) => (
                  <Link key={post.id} href={COMMUNITY_LINKS.gifting.href} className="pg-note" style={{ ["--_av" as string]: NOTE_ACCENTS[(i + 1) % NOTE_ACCENTS.length] } as CSSProperties}>
                    <div className="pg-note__title">{post.title}</div>
                    <div className="pg-note__meta">
                      {post.category} · {post.neighborhood}
                    </div>
                    <p className="pg-note__text">{post.description}</p>
                    <span className="pg-note__reply">View on Gifting →</span>
                  </Link>
                ))}
                {gifting.length === 0 && (
                  <Link href={COMMUNITY_LINKS.gifting.href} className="pg-note" style={{ ["--_av" as string]: "var(--lime)" } as CSSProperties}>
                    <p className="pg-note__text">The gift board is quiet. Post something queer homes need.</p>
                    <span className="pg-note__reply">Post a gift →</span>
                  </Link>
                )}
              </div>
              <Link href={COMMUNITY_LINKS.gifting.href} className="pg-board-more" style={{ color: COMMUNITY_LINKS.gifting.color }}>
                All Gifting posts →
              </Link>
            </div>
            <div>
              <Link href={COMMUNITY_LINKS.gigs.href} className="pg-colhd pg-colhd--link">
                <span className="pg-colhd__t" style={{ color: COMMUNITY_LINKS.gigs.color }}>
                  {COMMUNITY_LINKS.gigs.label}
                </span>
                <span className="pg-colhd__rule" style={{ background: "linear-gradient(to right, var(--cyan), transparent)" }} />
              </Link>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {gigs.slice(0, 3).map((post, i) => (
                  <Link key={post.id} href={COMMUNITY_LINKS.gigs.href} className="pg-note" style={{ ["--_av" as string]: NOTE_ACCENTS[(i + 2) % NOTE_ACCENTS.length] } as CSSProperties}>
                    <div className="pg-note__title">{post.title}</div>
                    <div className="pg-note__meta">
                      {[post.compensation, post.location].filter(Boolean).join(" · ") || "Pride season gig"}
                    </div>
                    <p className="pg-note__text">{post.description}</p>
                    <span className="pg-note__reply">View on Gigs →</span>
                  </Link>
                ))}
                {gigs.length === 0 && (
                  <Link href={COMMUNITY_LINKS.gigs.href} className="pg-note" style={{ ["--_av" as string]: "var(--cyan)" } as CSSProperties}>
                    <p className="pg-note__text">No gigs posted yet. Workers and hosts both belong here.</p>
                    <span className="pg-note__reply">Browse gigs →</span>
                  </Link>
                )}
              </div>
              <Link href={COMMUNITY_LINKS.gigs.href} className="pg-board-more" style={{ color: COMMUNITY_LINKS.gigs.color }}>
                All Gigs →
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>

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
                    style={{ flex: 1, minHeight: 200, background: "#0a0a0a" }}
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
                  <HomePlaceCard key={biz.id} biz={biz} />
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
                  <HomePlaceCard key={biz.id} biz={biz} />
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
function HomePlaceCard({ biz }: { biz: DirectoryBusiness }) {
  const isNonprofit = biz.type === "nonprofit";
  const logoUrl = resolveDirectoryLogo(biz.name, biz.imageUrl) || undefined;
  const fallbackLogoUrl = directoryFallbackLogo(biz.type);
  return (
    <PlaceCard
      name={biz.name}
      category={TYPE_TO_DS_CATEGORY[biz.type] || "venues"}
      className={isNonprofit ? "pdxPlace--rainbow" : undefined}
      isNonprofit={isNonprofit}
      logoUrl={logoUrl}
      fallbackLogoUrl={fallbackLogoUrl}
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