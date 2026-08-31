import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { EventListing } from "@shared/multiDayEvents";

import HomeStage from "@/components/home/HomeStage";
import HomeStatStrip from "@/components/HomeStatStrip";
import HomeConstructionNudge from "@/components/HomeConstructionNudge";
import { usePageSeo } from "@/hooks/usePageSeo";
import { countEventsNext7Days } from "@/lib/homeEvents";
import { prefersStillMotion } from "@/lib/motion";
import "./Home.css";
import { shareCardUrl } from "@shared/shareCards";

/**
 * `beta` marks a board that is built and reachable but still settling. Set on
 * every card so the `as const` union keeps the field and card.beta stays
 * type-safe on all six.
 */
const NEXT_PREVIEW_CARDS = [
  { name: "THE HAÜZ", logo: "/brand/family/the-hauz.svg", tone: "cyan", delay: ".17s", duration: "6.35s", drift: "1.2px", y: "15px", mobileY: "6px", angle: "-3deg", beta: true },
  { name: "Z/SPACE", logo: "/brand/family/z-space.svg", tone: "violet", delay: ".03s", duration: "5.62s", drift: "-1.7px", y: "32px", mobileY: "14px", angle: "-1.6deg", beta: true },
  { name: "ZAYDARK", logo: "/brand/family/zaydark.svg", tone: "red", delay: ".26s", duration: "6.78s", drift: ".9px", y: "8px", mobileY: "2px", angle: "-.5deg", beta: false },
  { name: "AFTERZ", logo: "/brand/family/afterz.svg", tone: "gold", delay: ".08s", duration: "5.94s", drift: "-1.1px", y: "22px", mobileY: "10px", angle: ".65deg", beta: false },
  { name: "ZENEGADES", logo: "/brand/family/zenegades.svg", tone: "scarlet", delay: ".21s", duration: "6.56s", drift: "1.6px", y: "44px", mobileY: "18px", angle: "1.8deg", beta: false },
  { name: "OUTZ", logo: "/brand/family/outz.svg", tone: "orange", delay: ".12s", duration: "5.76s", drift: "-.8px", y: "18px", mobileY: "7px", angle: "3deg", beta: true },
] as const;

function NextPreviewCardStack() {
  const sectionRef = useRef<HTMLElement>(null);
  const [landed, setLanded] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (prefersStillMotion()) {
      setLanded(true);
      return;
    }
    const revealIfVisible = () => {
      const rect = section.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) setLanded(true);
    };
    const frame = window.requestAnimationFrame(revealIfVisible);
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setLanded(true);
      observer.disconnect();
    }, { threshold: .04, rootMargin: "0px 0px 6% 0px" });
    observer.observe(section);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return (
    <section ref={sectionRef} id="next-preview" className={`home-next-preview${landed ? " home-next-preview--landed" : ""}`} aria-labelledby="home-next-preview-title">
      <span className="home-next-preview__map-wallpaper" aria-hidden="true">
        <svg viewBox="0 0 1600 760" preserveAspectRatio="xMidYMid slice" focusable="false">
          <g className="home-next-preview__contours">
            <path d="M-120 650C80 482 190 666 390 514S704 286 914 378s340 28 806-252" />
            <path d="M-146 574C42 420 190 584 370 448S680 222 894 312s356 14 798-232" />
            <path d="M-94 718C112 548 250 742 450 574S760 356 976 448s354 46 776-204" />
            <path d="M92 810C246 644 394 790 560 650s426-166 602-92 322 24 548-102" />
            <path d="M-180 486C32 342 168 486 340 356s414-214 598-132 360 44 786-184" />
            <path d="M-206 396C14 258 160 388 326 274s406-194 604-116 386 38 824-178" />
            <path d="M-130 300C72 186 206 304 376 198s404-158 608-76 368 40 776-138" />
            <path d="M24 208C188 102 320 228 490 132s386-116 560-42 342 30 632-90" />
          </g>
          <path className="home-next-preview__trail" d="M-40 622C144 552 186 380 352 424s218 180 394 44 260-254 430-204 236 2 454-164" />
          <g className="home-next-preview__trail-points">
            <circle cx="352" cy="424" r="7" /><circle cx="746" cy="468" r="7" /><circle cx="1176" cy="264" r="7" />
          </g>
        </svg>
        <img className="home-next-preview__ghost home-next-preview__ghost--a1" src="/brand/waypoints/next-blueprint-reference-a.png" alt="" loading="lazy" />
        <img className="home-next-preview__ghost home-next-preview__ghost--a2" src="/brand/waypoints/next-blueprint-reference-a.png" alt="" loading="lazy" />
        <img className="home-next-preview__ghost home-next-preview__ghost--a3" src="/brand/waypoints/next-blueprint-reference-a.png" alt="" loading="lazy" />
        <img className="home-next-preview__ghost home-next-preview__ghost--b1" src="/brand/waypoints/next-blueprint-reference-b.png" alt="" loading="lazy" />
        <img className="home-next-preview__ghost home-next-preview__ghost--b2" src="/brand/waypoints/next-blueprint-reference-b.png" alt="" loading="lazy" />
        <img className="home-next-preview__ghost home-next-preview__ghost--b3" src="/brand/waypoints/next-blueprint-reference-b.png" alt="" loading="lazy" />
        <i className="home-next-preview__orb home-next-preview__orb--cyan" />
        <i className="home-next-preview__orb home-next-preview__orb--navy" />
        <i className="home-next-preview__orb home-next-preview__orb--orange" />
      </span>
      <div className="home-next-preview__head">
        <p className="home-next-preview__kicker pdx-kicker"><span aria-hidden="true" /> Zaylist / Next</p>
        <h2 id="home-next-preview-title" className="pdx-display">
          See what I&apos;m building <span className="hl">Next.</span>
        </h2>
        <p>New ways to find your people, make plans, and keep more of queer Portland in one place.</p>
      </div>
      <Link className="home-next-preview__link" href="/next" aria-label="Explore what Zaylist is building next">
        <span className="home-next-preview__viewport" aria-hidden="true">
          <span className="home-next-preview__track">
            {NEXT_PREVIEW_CARDS.map((card, index) => (
              <span
                className="home-next-preview__card pdx-glass-card pdx-glass-rebind"
                data-tone={card.tone}
                key={card.name}
                style={{
                  ["--stack-index" as string]: index,
                  ["--float-delay" as string]: card.delay,
                  ["--float-duration" as string]: card.duration,
                  ["--silly-x" as string]: card.drift,
                  ["--gallery-y" as string]: card.y,
                  ["--gallery-y-mobile" as string]: card.mobileY,
                  ["--gallery-angle" as string]: card.angle,
                }}
              >
                {card.beta ? <span className="home-next-preview__beta">Beta</span> : null}
                <img src={card.logo} alt="" loading="lazy" decoding="async" />
              </span>
            ))}
          </span>
        </span>
        <span className="home-next-preview__cta">Explore Next <span aria-hidden="true">-&gt;</span></span>
      </Link>
    </section>
  );
}

export default function Home() {
  usePageSeo(
    "Zaylist | Queer Portland, all in one place",
    "Every Portland night worth knowing, in one place. Find the party, the room, the gig, and the people.",
    { image: shareCardUrl("home"), imageAlt: "Zaylist — Portland queer events and community" },
  );

  const { data: events = [], isPending: eventsPending } = useQuery<EventListing[]>({
    queryKey: ["/api/events"],
    queryFn: () => apiRequest("GET", "/api/events").then(r => r.json()),
    staleTime: 60_000,
    refetchOnMount: "always",
  });

  const { data: businesses = [], isPending: placesPending } = useQuery<{ id: number }[]>({
    queryKey: ["/api/directory"],
    queryFn: () => apiRequest("GET", "/api/directory").then(r => r.json()),
    staleTime: 60_000,
  });

  const { data: attendanceSummaries = {}, isPending: goingPending } = useQuery<Record<string, { count?: number }>>({
    queryKey: ["/api/events/attendance-summaries"],
    queryFn: () => apiRequest("GET", "/api/events/attendance-summaries").then(r => r.json()),
    staleTime: 60_000,
  });

  // Rolling next-7-days total (expanded LIVE listings from GET /api/events).
  const eventCount = useMemo(() => countEventsNext7Days(events), [events]);
  const placesCount = businesses.length;
  const goingCount = useMemo(
    () => Object.values(attendanceSummaries).reduce((sum, s) => sum + (s?.count ?? 0), 0),
    [attendanceSummaries],
  );

  return (
    <div className="home-main-stage">
      <HomeConstructionNudge />
      <HomeStage
        afterWelcome={(
          <div className="home-hero-stats-boundary">
            <HomeStatStrip
              eventCount={eventCount}
              placesCount={placesCount}
              goingCount={goingCount}
              pending={{ events: eventsPending, places: placesPending, going: goingPending }}
            />
            <div
              className="rainbow-bar rainbow-bar--thick rainbow-bar--bleed home-rainbow-seam"
              aria-hidden="true"
            />
          </div>
        )}
      />

      <div
        className="rainbow-bar rainbow-bar--thick rainbow-bar--bleed home-rainbow-seam home-rainbow-seam--before-next"
        aria-hidden="true"
      />

      <NextPreviewCardStack />
    </div>
  );
}
