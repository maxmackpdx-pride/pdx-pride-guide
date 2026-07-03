import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Event, GiftingPost, GigPost, MissedConnection } from "@shared/schema";
import type { EventListing } from "@shared/multiDayEvents";
import type { AdmissionType } from "@shared/admission";

import EventModal from "@/components/EventModal";
import ScrollReveal from "@/components/ScrollReveal";
import { usePageSeo } from "@/hooks/usePageSeo";
import { useAttendanceSummariesLive } from "@/hooks/useAttendanceSummariesLive";
import {
  Button,
  Countdown,
  Divider,
  EventCard,
  FilterChip,
  Marquee,
  PlaceCard,
  SectionHeader,
} from "@/components/ds";
import heroWallpaperImg from "@/assets/hero-wallpaper.jpg";
import {
  HOME_COUNTDOWN_TARGET,
  HOME_DAY_META,
  HOME_DAY_ORDER,
  HOME_MARQUEE_FALLBACK,
  countEventsByHomeDay,
  dayColorVar,
  eventsForHomeDay,
  homeListingProps,
  pickMarqueeItems,
  pickRandomBusinesses,
  prideDayChipDate,
  type HomeDayKey,
} from "@/lib/homeEvents";

type HomeSchedDay = HomeDayKey | "ALL";
import { lazyWithReload } from "@/lib/lazyWithReload";
import "./Home.css";

const DirectoryMap = lazyWithReload(() => import("@/components/DirectoryMap"));

const SAVED_KEY = "pdx-home-saved-event-ids";

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
};

const TYPE_TO_DS_CATEGORY: Record<string, string> = {
  bar: "bars",
  restaurant: "food",
  cafe: "cafes",
  venue: "venues",
  service: "services",
  shop: "shops",
  hotel: "hotels",
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
  hours: string | null;
  phone: string | null;
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

function readSavedIds(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(SAVED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.map(Number).filter(Number.isFinite) : []);
  } catch {
    return new Set();
  }
}

function writeSavedIds(ids: Set<number>) {
  window.localStorage.setItem(SAVED_KEY, JSON.stringify([...ids]));
}

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

function isCardActionTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest(".pdxBoard__rsvp, .pdxRow__save"));
}

export default function Home() {
  usePageSeo(
    "PDX Pride Guide — Portland Pride 2026 Events",
    "A community-run guide to Portland Pride Week 2026. Find the parties, the parade, and your people, then dance til the sun comes up.",
  );

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [schedDay, setSchedDay] = useState<HomeSchedDay>("ALL");
  const [schedAtEnd, setSchedAtEnd] = useState(false);
  const schedScrollRef = useRef<HTMLDivElement>(null);
  const [savedIds, setSavedIds] = useState<Set<number>>(readSavedIds);
  const [marqueeItems, setMarqueeItems] = useState<string[]>([]);
  const [featuredPlaces, setFeaturedPlaces] = useState<DirectoryBusiness[]>([]);
  const [showSoftLaunch, setShowSoftLaunch] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("softLaunchWelcomeDismissed") !== "true";
  });

  useAttendanceSummariesLive();

  const { data: events = [] } = useQuery<EventListing[]>({
    queryKey: ["/api/events"],
    queryFn: () => apiRequest("GET", "/api/events").then(r => r.json()),
    staleTime: 60_000,
    refetchOnMount: "always",
  });

  const { data: attendanceSummaries = {} } = useQuery<Record<string, { count: number }>>({
    queryKey: ["/api/events/attendance-summaries"],
    queryFn: () => apiRequest("GET", "/api/events/attendance-summaries").then(r => r.json()),
    refetchInterval: 120_000,
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
    setFeaturedPlaces(prev => (prev.length > 0 ? prev : pickRandomBusinesses(businesses, 3)));
  }, [businesses]);

  const dayCounts = useMemo(() => countEventsByHomeDay(events), [events]);
  const totalPrideCount = useMemo(
    () => HOME_DAY_ORDER.reduce((sum, day) => sum + dayCounts[day], 0),
    [dayCounts],
  );
  const schedDays = useMemo(
    () => (schedDay === "ALL" ? [...HOME_DAY_ORDER] : [schedDay]),
    [schedDay],
  );

  const updateSchedFade = useCallback(() => {
    const sc = schedScrollRef.current;
    if (!sc) return;
    const atEnd =
      sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 4 ||
      sc.scrollHeight <= sc.clientHeight;
    setSchedAtEnd(atEnd);
  }, []);

  useEffect(() => {
    const sc = schedScrollRef.current;
    if (sc) sc.scrollTop = 0;
    updateSchedFade();
  }, [schedDay, events, updateSchedFade]);

  useEffect(() => {
    window.addEventListener("resize", updateSchedFade);
    return () => window.removeEventListener("resize", updateSchedFade);
  }, [updateSchedFade]);

  const mappedBusinesses = useMemo(
    () => businesses.filter(b => b.lat != null && b.lng != null),
    [businesses],
  );

  const dismissSoftLaunch = () => {
    window.localStorage.setItem("softLaunchWelcomeDismissed", "true");
    setShowSoftLaunch(false);
  };

  const toggleSaved = useCallback((eventId: number) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      writeSavedIds(next);
      return next;
    });
  }, []);

  const goingCount = useCallback(
    (eventId: number) =>
      attendanceSummaries[eventId]?.count ??
      attendanceSummaries[String(eventId)]?.count ??
      0,
    [attendanceSummaries],
  );

  const openEvent = useCallback((event: Event) => setSelectedEvent(event), []);

  const dismissSoftLaunchOnEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") dismissSoftLaunch();
  }, []);

  useEffect(() => {
    if (!showSoftLaunch) return;
    window.addEventListener("keydown", dismissSoftLaunchOnEscape);
    return () => window.removeEventListener("keydown", dismissSoftLaunchOnEscape);
  }, [showSoftLaunch, dismissSoftLaunchOnEscape]);

  return (
    <div className="home-main-stage">
      {showSoftLaunch && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="soft-launch-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            background: "rgba(0,0,0,0.72)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 18,
          }}
        >
          <div
            style={{
              width: "min(560px, 100%)",
              border: "3px solid var(--neon-yellow)",
              background: "#050505",
              boxShadow: "0 0 36px rgba(204,255,0,0.24), 0 0 60px rgba(255,0,204,0.16)",
              padding: 24,
              position: "relative",
            }}
          >
            <button
              type="button"
              aria-label="Close welcome"
              onClick={dismissSoftLaunch}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                background: "transparent",
                border: "1px solid #333",
                color: "#999",
                width: 30,
                height: 30,
                cursor: "pointer",
              }}
            >
              X
            </button>
            <div className="sticker" style={{ color: "#FF00CC", borderColor: "#FF00CC", marginBottom: 14 }}>
              SOFTIE LAUNCH
            </div>
            <h2
              id="soft-launch-title"
              className="display"
              style={{ color: "#fff", fontSize: "clamp(2rem, 8vw, 4rem)", lineHeight: 0.95, marginBottom: 14 }}
            >
              WELCOME
            </h2>
            <p style={{ color: "#bbb", fontSize: "1rem", lineHeight: 1.6, marginBottom: 18 }}>
              Welcome to the softie launch. A couple more days working out the bugs and we will be ready. Play around,
              and please submit feedback at the bottom of the website if you run into any issue.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button type="button" variant="solid" accent="lime" onClick={dismissSoftLaunch}>
                START EXPLORING
              </Button>
              <a href="#feedback" onClick={dismissSoftLaunch} style={{ textDecoration: "none" }}>
                <Button as="span" accent="cyan">
                  SEND FEEDBACK
                </Button>
              </a>
            </div>
          </div>
        </div>
      )}

      <section className="pg-hero" aria-label="Portland Pride Guide hero">
        <img className="pg-hero__img" src={heroWallpaperImg} alt="" />
        <div className="pg-hero__scrim" aria-hidden="true" />
        <div className="pg-hero__body">
          <div className="pg-hero__kicker">
            <span className="d" aria-hidden="true" />
            Portland Pride Week 2026 · July 13 to 19
          </div>
          <h1>
            <span>Portland</span>
            <span className="rainbow">
              <span className="rainbow__outline" aria-hidden="true">
                Pride
              </span>
              <span className="rainbow__fill">Pride</span>
            </span>
            <span>Guide</span>
          </h1>
          <p className="pg-hero__blurb">
            Three days, one city, every color. Find the parties, the parade, and your people, then{" "}
            <strong>dance til the sun comes up.</strong>
          </p>
          <div className="pg-hero__countdown">
            <span className="pg-hero__cdlabel">Doors to the weekend open in</span>
            <Countdown target={HOME_COUNTDOWN_TARGET} accent="lime" aria-label="Countdown to Pride weekend" />
          </div>
          <div className="pg-hero__actions">
            <Link href="/events">
              <Button as="span" accent="lime" arrow size="lg">
                View All Events
              </Button>
            </Link>
            <a href="#home-map" style={{ textDecoration: "none" }}>
              <Button as="span" accent="cyan" arrow size="lg">
                Open the Map
              </Button>
            </a>
          </div>
        </div>
      </section>

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

      <div className="pg-block" style={{ paddingTop: 58 }}>
        <ScrollReveal>
          <SectionHeader
            kicker="All Week"
            title="The Schedule"
            subtitle="Every party, march, and after-hours, Thursday to Sunday. Scroll the whole week, or tap a day to jump."
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
          <div className="pg-schedchips">
            <FilterChip
              selected={schedDay === "ALL"}
              fill={schedDay === "ALL"}
              accent="cyan"
              count={totalPrideCount}
              onToggle={() => setSchedDay("ALL")}
            >
              All Week
            </FilterChip>
            {HOME_DAY_ORDER.map(day => {
              const meta = HOME_DAY_META[day];
              const selected = schedDay === day;
              return (
                <FilterChip
                  key={day}
                  selected={selected}
                  fill={selected}
                  accent={meta.accent}
                  count={dayCounts[day]}
                  showDot
                  onToggle={() => setSchedDay(day)}
                >
                  {meta.label} {prideDayChipDate(day)}
                </FilterChip>
              );
            })}
          </div>
          <div className={`pg-schedwrap${schedAtEnd ? " is-end" : ""}`}>
            <div className="pg-sched" ref={schedScrollRef} onScroll={updateSchedFade}>
              {schedDays.map(day => {
                const meta = HOME_DAY_META[day];
                const dayEvents = eventsForHomeDay(events, day);
                return (
                  <div key={day} className="pg-schedgroup" data-group={day}>
                    <div className="pg-sched__day" style={{ "--_dc": meta.color } as CSSProperties}>
                      <span className="pg-sched__daynum">{meta.long}</span>
                      <span className="pg-sched__daydate">{meta.date}</span>
                      <span className="pg-sched__dayrule" />
                      <span className="pg-sched__daycount">{dayEvents.length} events</span>
                    </div>
                    {dayEvents.length === 0 && (
                      <p style={{ color: "var(--text-lo)", margin: 0 }}>
                        Nothing scheduled for {meta.long} yet.
                      </p>
                    )}
                    {dayEvents.map(event => {
                      const props = homeListingProps(event);
                      const going = goingCount(event.id);
                      return (
                        <div
                          key={event.listingInstanceKey ?? event.id}
                          className="pg-home-card"
                          onClick={e => {
                            if (isCardActionTarget(e.target)) return;
                            openEvent(event);
                          }}
                        >
                          <EventCard
                            title={event.title}
                            venue={event.venueName}
                            when=""
                            day={props.day}
                            image={props.image}
                            types={props.types}
                            admission={event.admission as AdmissionType | undefined}
                            age={event.ageRequirement as "ALL_AGES" | "18_PLUS" | "21_PLUS" | undefined}
                            going={going > 0 ? going : undefined}
                            saved={savedIds.has(event.id)}
                            onSave={() => toggleSaved(event.id)}
                            style={{ "--_day": dayColorVar(event.dayOfWeek) } as CSSProperties}
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
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
            kicker="The Community Board"
            title="Find Your People"
            subtitle="Missed connections, free stuff, and last-minute gigs, all week long."
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
                  <Link key={post.id} href={COMMUNITY_LINKS.spotted.href} className="pg-note pg-note--spot" style={{ "--_av": NOTE_ACCENTS[i % NOTE_ACCENTS.length] }}>
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
                  <Link href={COMMUNITY_LINKS.spotted.href} className="pg-note" style={{ "--_av": "var(--pink)" }}>
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
                  <Link key={post.id} href={COMMUNITY_LINKS.gifting.href} className="pg-note" style={{ "--_av": NOTE_ACCENTS[(i + 1) % NOTE_ACCENTS.length] }}>
                    <div className="pg-note__title">{post.title}</div>
                    <div className="pg-note__meta">
                      {post.category} · {post.neighborhood}
                    </div>
                    <p className="pg-note__text">{post.description}</p>
                    <span className="pg-note__reply">View on Gifting →</span>
                  </Link>
                ))}
                {gifting.length === 0 && (
                  <Link href={COMMUNITY_LINKS.gifting.href} className="pg-note" style={{ "--_av": "var(--lime)" }}>
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
                  <Link key={post.id} href={COMMUNITY_LINKS.gigs.href} className="pg-note" style={{ "--_av": NOTE_ACCENTS[(i + 2) % NOTE_ACCENTS.length] }}>
                    <div className="pg-note__title">{post.title}</div>
                    <div className="pg-note__meta">
                      {[post.compensation, post.location].filter(Boolean).join(" · ") || "Pride season gig"}
                    </div>
                    <p className="pg-note__text">{post.description}</p>
                    <span className="pg-note__reply">View on Gigs →</span>
                  </Link>
                ))}
                {gigs.length === 0 && (
                  <Link href={COMMUNITY_LINKS.gigs.href} className="pg-note" style={{ "--_av": "var(--cyan)" }}>
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
            subtitle="Bars, cafes, and venues run by and for the community. Three spots chosen at random — fresh picks every time you refresh."
            accent="cyan"
          />
          <div className="pg-places">
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
              {featuredPlaces.map(biz => (
                <PlaceCard
                  key={biz.id}
                  name={biz.name}
                  category={TYPE_TO_DS_CATEGORY[biz.type] || "venues"}
                  categoryLabel={TYPE_LABELS[biz.type] || biz.type}
                  address={[biz.address, biz.neighborhood].filter(Boolean).join(" · ") || undefined}
                  hours={biz.hours || undefined}
                  phone={biz.phone || undefined}
                  description={biz.description || undefined}
                  website={biz.website || undefined}
                  instagram={biz.instagram || undefined}
                  grandOpening={biz.isNew}
                />
              ))}
              {featuredPlaces.length === 0 && (
                <PlaceCard
                  name="Queer Portland"
                  category="venues"
                  categoryLabel="Directory"
                  description="The community directory is being built. Check back for bars, cafes, and venues."
                />
              )}
              <Link href="/directory" style={{ textDecoration: "none" }}>
                <Button as="span" accent="cyan" arrow>
                  Full directory
                </Button>
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>

      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEventUpdated={updated => setSelectedEvent(updated)}
        />
      )}


    </div>
  );
}