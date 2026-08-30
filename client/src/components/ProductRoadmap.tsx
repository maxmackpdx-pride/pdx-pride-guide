import { useEffect, useMemo, useState } from "react";
import "./ProductRoadmap.css";

type RoadmapStatus = "complete" | "live" | "building" | "active" | "next" | "planned" | "horizon";
type RoadmapSide = "left" | "right" | "center";

type RoadmapWaypoint = {
  id: number;
  title: string;
  era: string;
  status: RoadmapStatus;
  statusLabel: string;
  summary: string;
  wins?: string[];
  goals: string[];
  side: RoadmapSide;
};

const WAYPOINTS: readonly RoadmapWaypoint[] = [
  {
    id: 1,
    title: "PDX Pride Guide",
    era: "ORIGIN",
    status: "complete",
    statusLabel: "Complete",
    summary: "The original seasonal guide, built on Squarespace, proved there was demand for one place to find queer Portland.",
    wins: [
      "Created the original community guide",
      "Built a real audience around useful local information",
      "Established events as the product's strongest recurring need",
    ],
    goals: [
      "Preserve the useful history without carrying old platform assumptions forward",
      "Finish any remaining Pride Guide migration cleanup",
    ],
    side: "left",
  },
  {
    id: 2,
    title: "React Rebuild",
    era: "TECHNICAL RESET",
    status: "complete",
    statusLabel: "Complete",
    summary: "The move off Squarespace turned the guide into a custom React application and created room for a real product architecture.",
    wins: [
      "Moved from hosted-page constraints to a custom application",
      "Created reusable routes, components, data flows, and application state",
      "Made year-round expansion technically possible",
    ],
    goals: ["Continue retiring assumptions and code that only made sense in the old guide era"],
    side: "right",
  },
  {
    id: 3,
    title: "Modern Event Platform",
    era: "PRE-ZAYLIST",
    status: "live",
    statusLabel: "Live before Zaylist",
    summary: "Events were already a mature, useful system before the Zaylist identity arrived. Zaylist inherited a working event product rather than starting from zero.",
    wins: [
      "Modern event experience established in the React era",
      "Event discovery became a durable year-round capability",
      "Events became a proven foundation for the broader platform",
    ],
    goals: [
      "Complete event-curation security",
      "Harden authorization, validation, moderation, abuse prevention, and auditability",
      "Keep event data compatible with future shared platform objects and API contracts",
    ],
    side: "left",
  },
  {
    id: 4,
    title: "Zaylist Launch",
    era: "PLATFORM EXPANSION",
    status: "live",
    statusLabel: "Live",
    summary: "The Pride Guide became Zaylist: a year-round product with room for events, housing, gigs, gifting, places, connection, outdoors, community, and future services.",
    wins: [
      "Expanded beyond the original Pride Guide concept",
      "Created a broader product family instead of endlessly stretching one guide",
      "Started treating Zaylist as a platform rather than a seasonal publication",
    ],
    goals: [
      "Finish Pride Guide migration cleanup",
      "Retire remaining legacy naming, routing, content, and product assumptions",
    ],
    side: "right",
  },
  {
    id: 5,
    title: "THE HAÜZ",
    era: "SHIPPED PRODUCT",
    status: "live",
    statusLabel: "Live",
    summary: "Housing moved from concept to a real Zaylist product surface.",
    wins: ["THE HAÜZ is shipped and usable"],
    goals: [
      "Continue production QA and safety review",
      "Keep housing behavior aligned with shared account, search, and future API rules",
    ],
    side: "left",
  },
  {
    id: 6,
    title: "GIFTZ",
    era: "SHIPPED PRODUCT",
    status: "live",
    statusLabel: "Live",
    summary: "The gifting section is shipped as part of the Zaylist product family.",
    wins: ["GIFTZ is shipped and usable"],
    goals: ["Continue production QA", "Keep moderation and object behavior aligned with the rest of Zaylist"],
    side: "right",
  },
  {
    id: 7,
    title: "Foundation + Design System",
    era: "SYSTEM OF RECORD",
    status: "active",
    statusLabel: "Established / evolving",
    summary: "Zaylist now has governing product principles and a living visual system, so future work does not have to reinvent the product every time it is generated.",
    wins: [
      "Zaylist Foundation established",
      "Living Design Guide and design-system baseline established",
      "Product language, visual rules, and implementation guidance now have a source of truth",
      "Future AI-generated work can inherit rules instead of freelancing the architecture",
    ],
    goals: [
      "Expand, operationalize, and enforce the Foundation",
      "Keep tokens, typography, components, states, accessibility, and production examples synchronized",
      "Use the Foundation and Design Guide to govern every new build",
    ],
    side: "center",
  },
  {
    id: 8,
    title: "OUR PLACEZ",
    era: "CURRENT PRODUCTION",
    status: "building",
    statusLabel: "In production",
    summary: "Finish the places and directory experience as a first-class Zaylist section.",
    goals: [
      "Complete remaining product build",
      "Resolve product-versus-guide drift",
      "Finish QA, navigation, search, and launch readiness",
      "Complete section identity and logo if still outstanding",
    ],
    side: "left",
  },
  {
    id: 9,
    title: "GIGZ",
    era: "CURRENT PRODUCTION",
    status: "building",
    statusLabel: "In production",
    summary: "Finish the gigs and work surface and bring it fully into the shared Zaylist product model.",
    goals: [
      "Complete remaining product build",
      "Finish posting, discovery, moderation, and QA",
      "Align accounts and future shared listing schemas",
      "Complete section identity and logo if still outstanding",
    ],
    side: "right",
  },
  {
    id: 10,
    title: "MIZZED CONNECTION",
    era: "CURRENT PRODUCTION",
    status: "building",
    statusLabel: "In production",
    summary: "Finish the consent-aware connection surface without recreating anonymous cold-message dynamics.",
    goals: [
      "Complete remaining product build",
      "Finish consent, acceptance, privacy, reporting, and moderation behavior",
      "Finish QA and launch readiness",
      "Complete section identity and logo if still outstanding",
    ],
    side: "left",
  },
  {
    id: 11,
    title: "MY SQUADZ",
    era: "CURRENT PRODUCTION",
    status: "building",
    statusLabel: "In production",
    summary: "Finish the social and membership surface while keeping future community architecture in view.",
    goals: [
      "Complete remaining product build",
      "Define membership, privacy, discovery, and moderation behavior",
      "Avoid duplicating logic that should move into the future Z/ community model",
      "Complete section identity and logo if still outstanding",
    ],
    side: "right",
  },
  {
    id: 12,
    title: "OUTZ",
    era: "CURRENT PRODUCTION",
    status: "building",
    statusLabel: "In production",
    summary: "Finish outdoor discovery, conditions, check-ins, carpools, and related local utility without locking it to the old Z/ structure.",
    goals: [
      "Complete remaining product build",
      "Finish location, conditions, check-in, safety, and discovery behavior",
      "Prepare routes and data for the upcoming Z/ restructure",
      "Complete section identity and logo if still outstanding",
    ],
    side: "left",
  },
  {
    id: 13,
    title: "SELLZ",
    era: "CURRENT PRODUCTION",
    status: "building",
    statusLabel: "In production",
    summary: "Finish the marketplace surface with clear safety, moderation, and shared listing behavior.",
    goals: [
      "Complete remaining product build",
      "Finish listing lifecycle, discovery, reporting, and moderation",
      "Prepare for shared listing objects and future API access",
      "Complete section identity and logo if still outstanding",
    ],
    side: "right",
  },
  {
    id: 14,
    title: "Identity + Communications",
    era: "DURABILITY",
    status: "active",
    statusLabel: "Active",
    summary: "Make accounts and communications dependable enough for a platform that people can trust.",
    goals: [
      "Finish email and communications setup",
      "Add Google Sign-In",
      "Add Forgot Password",
      "Build secure account recovery",
      "Handle account linking and duplicate-account cases",
      "Finish verification and recovery email flows",
      "Configure deliverability and domain authentication",
      "Rate-limit and protect recovery flows from abuse",
    ],
    side: "left",
  },
  {
    id: 15,
    title: "Cloudflare + Production Hardening",
    era: "DURABILITY",
    status: "active",
    statusLabel: "Active / migration",
    summary: "Move from a site that works to infrastructure that is resilient, observable, secure, and inexpensive to operate.",
    goals: [
      "Set up Cloudflare hosting and infrastructure where it is the right production target",
      "Define the migration path from the current Railway deployment footprint without breaking production",
      "Configure DNS, CDN, caching, edge security, headers, and abuse controls",
      "Harden deployment and rollback reliability",
      "Continue bug testing and error handling",
      "Continue performance and security review",
      "Complete event-curation security",
      "Add production monitoring and alerting",
      "Track errors, performance, redirect failures, security failures, and platform health",
    ],
    side: "right",
  },
  {
    id: 16,
    title: "Governance + Synchronization",
    era: "DURABILITY",
    status: "active",
    statusLabel: "Ongoing",
    summary: "Keep the product, code, Foundation, Design Guide, and generated work from drifting into separate versions of Zaylist.",
    goals: [
      "Keep GitHub, production, Foundation, and guides synchronized",
      "Resolve product-versus-guide drift",
      "Automate Foundation, Design Guide, GitHub, and production consistency checks",
      "Make the repository increasingly authoritative for implementation",
      "Complete any remaining new-section logos and keep them inside the shared visual system",
      "Build coordinated AI-agent roles, validation, and handoffs around the same governing rules",
    ],
    side: "left",
  },
  {
    id: 17,
    title: "Z/ Becomes Communities",
    era: "MAJOR NEXT MIGRATION",
    status: "next",
    statusLabel: "Major next migration",
    summary: "Give Z/ one clear purpose: the Zaylist community layer, with a subtle Reddit-like mental model but its own local, visual, real-world identity.",
    goals: [
      "Audit every current Z/ route, component, data model, navigation reference, search behavior, and alias",
      "Classify what actually belongs in Communities and what belongs elsewhere",
      "Create the Community domain model",
      "Add memberships, moderators, rules, visibility, posts, and related content",
      "Create consistent Z/ routing and discovery",
      "Connect communities to Events, SELLZ, GIGZ, Places, Guides, and other shared objects without duplicating records",
      "Build redirect and compatibility maps for old routes",
      "Roll out behind feature flags with explicit rollback capability",
    ],
    side: "center",
  },
  {
    id: 18,
    title: "ZayDark + Legacy Contraction",
    era: "MAJOR NEXT MIGRATION",
    status: "next",
    statusLabel: "Next",
    summary: "Separate adult-content policy from navigation, then use the migration to remove architecture Zaylist no longer needs.",
    goals: [
      "Formalize ZayDark as a platform-wide content and access layer",
      "Create shared content classification and authorization policy",
      "Enforce ZayDark consistently across web, search, API, agents, media, and notifications",
      "Audit unused routes, stale components, abandoned feature flags, duplicate logic, and unused dependencies",
      "Remove obsolete schema fields only after proving they are unused",
      "Preserve redirects and compatibility records even when runtime code is deleted",
      "Require tests, instrumentation, and rollback plans before destructive cleanup",
    ],
    side: "right",
  },
  {
    id: 19,
    title: "Platform Core + API v1",
    era: "PLATFORMIZATION",
    status: "planned",
    statusLabel: "Planned",
    summary: "Turn Zaylist from a website with features into a platform with shared objects, relationships, permissions, search, and machine interfaces.",
    goals: [
      "Define Zaylist Platform Architecture v1",
      "Treat the website as one client of the platform rather than the entire platform",
      "Create stable IDs and shared schemas",
      "Build shared domain objects for Events, Communities, Listings, Gigs, Places, Guides, Profiles, Organizations, and Media",
      "Build cross-object relationships instead of section-specific copies",
      "Build unified Zaylist search with typed results",
      "Stand up an internal, versioned /api/v1 foundation",
      "Design permissions, scopes, capability rules, and auditability before external writes",
      "Reserve clean exit ramps for developers, integrations, apps, APIs, and agents without cluttering the current UX",
      "Add machine-readable discovery only when the current standard is verified and useful",
      "Add API, search, migration, and adoption observability",
    ],
    side: "left",
  },
  {
    id: 20,
    title: "Agent Landing Pad",
    era: "HORIZON",
    status: "horizon",
    statusLabel: "Horizon",
    summary: "Let humans and authorized software use the same underlying Zaylist instead of building a separate AI version of the product.",
    wins: [
      "Agent readiness is being designed at the platform level rather than bolted onto individual pages",
      "The Foundation and Design Guide already create governance for coordinated AI work",
    ],
    goals: [
      "Build coordinated Zaylist agents with defined roles, shared rules, validation, and handoffs",
      "Expose read, search, discovery, and recommendation capabilities first",
      "Add scoped save, follow, join, and RSVP actions only after permissions are proven",
      "Add create, submit, and update capabilities later with appropriate human confirmation",
      "Make external agents discover Zaylist capabilities through supported machine-readable interfaces",
      "Keep humans, the website, APIs, integrations, and agents on the same underlying product model",
    ],
    side: "right",
  },
] as const;

const STATUS_LABELS: Record<RoadmapStatus, string> = {
  complete: "Complete",
  live: "Live",
  building: "In production",
  active: "Active",
  next: "Major next",
  planned: "Planned",
  horizon: "Horizon",
};

function WaypointDetail({ waypoint, onClose }: { waypoint: RoadmapWaypoint; onClose: () => void }) {
  return (
    <section className="product-roadmap__detail" aria-label={`${waypoint.title} goals`}>
      <div className="product-roadmap__detail-top">
        <div>
          <span className={`product-roadmap__status product-roadmap__status--${waypoint.status}`}>
            {waypoint.statusLabel}
          </span>
          <p className="product-roadmap__detail-id">{String(waypoint.id).padStart(2, "0")} / {waypoint.era}</p>
        </div>
        <button type="button" className="product-roadmap__detail-close" onClick={onClose} aria-label="Close waypoint details">
          ×
        </button>
      </div>
      <h3>{waypoint.title}</h3>
      <p className="product-roadmap__detail-summary">{waypoint.summary}</p>
      {waypoint.wins?.length ? (
        <div className="product-roadmap__detail-group">
          <h4>Already earned</h4>
          <ul>
            {waypoint.wins.map(win => <li key={win} className="is-win">{win}</li>)}
          </ul>
        </div>
      ) : null}
      <div className="product-roadmap__detail-group">
        <h4>{waypoint.status === "complete" || waypoint.status === "live" ? "Keep moving" : "Sub-goals"}</h4>
        <ul>
          {waypoint.goals.map(goal => <li key={goal}>{goal}</li>)}
        </ul>
      </div>
    </section>
  );
}

export default function ProductRoadmap() {
  const [expanded, setExpanded] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(17);
  const selected = useMemo(
    () => WAYPOINTS.find(waypoint => waypoint.id === selectedId) ?? null,
    [selectedId],
  );

  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [expanded]);

  const openWaypoint = (id: number) => {
    setSelectedId(current => current === id ? null : id);
  };

  return (
    <section className="product-roadmap" aria-labelledby="product-roadmap-title">
      <div className="product-roadmap__shell">
        <div className="product-roadmap__eyebrow">PRODUCT ROADMAP / LIVE OPERATING VIEW</div>
        <div className="product-roadmap__heading-row">
          <div>
            <h2 id="product-roadmap-title">THE ROUTE FROM<br /><span>LIVE TO DURABLE.</span></h2>
            <p>Zaylist is already live. This is the route from a working product to a durable platform.</p>
          </div>
          <button type="button" className="product-roadmap__expand" onClick={() => setExpanded(true)}>
            Expand roadmap <span aria-hidden="true">↗</span>
          </button>
        </div>

        <button type="button" className="product-roadmap__preview" onClick={() => setExpanded(true)} aria-label="Open full product roadmap">
          <span className="product-roadmap__preview-line" aria-hidden="true" />
          {WAYPOINTS.map(waypoint => (
            <span
              key={waypoint.id}
              className={`product-roadmap__preview-dot product-roadmap__preview-dot--${waypoint.status}`}
              title={`${waypoint.id}. ${waypoint.title}`}
            />
          ))}
          <span className="product-roadmap__preview-start">ORIGIN</span>
          <span className="product-roadmap__preview-now">NOW</span>
          <span className="product-roadmap__preview-end">AGENT READY</span>
        </button>

        <div className="product-roadmap__legend" aria-label="Roadmap status legend">
          {(["complete", "live", "building", "active", "next", "planned", "horizon"] as RoadmapStatus[]).map(status => (
            <span key={status}><i className={`product-roadmap__legend-dot product-roadmap__legend-dot--${status}`} />{STATUS_LABELS[status]}</span>
          ))}
        </div>
      </div>

      {expanded ? (
        <div className="product-roadmap__overlay" role="dialog" aria-modal="true" aria-labelledby="product-roadmap-full-title">
          <div className="product-roadmap__overlay-topbar">
            <div>
              <span>PRODUCT ROADMAP / LIVE OPERATING VIEW</span>
              <strong id="product-roadmap-full-title">THE ROUTE FROM LIVE TO DURABLE.</strong>
            </div>
            <button type="button" onClick={() => setExpanded(false)} aria-label="Close full roadmap">Close ×</button>
          </div>

          <div className="product-roadmap__overlay-scroll">
            <div className="product-roadmap__map-intro">
              <p className="product-roadmap__map-kicker">20 WAYPOINTS / ONE OPERATING VIEW</p>
              <h3>Built in public.<br />Hardened on purpose.</h3>
              <p>Completed work stays on the map. Current production stays visible. The major Z/ migration is the turning point into platform architecture.</p>
            </div>

            <div className="product-roadmap__map">
              <div className="product-roadmap__trail" aria-hidden="true" />
              {WAYPOINTS.map(waypoint => (
                <div key={waypoint.id} className={`product-roadmap__row product-roadmap__row--${waypoint.side}`}>
                  <button
                    type="button"
                    className={`product-roadmap__waypoint product-roadmap__waypoint--${waypoint.status} ${selectedId === waypoint.id ? "is-selected" : ""}`}
                    onClick={() => openWaypoint(waypoint.id)}
                    aria-expanded={selectedId === waypoint.id}
                  >
                    <span className="product-roadmap__waypoint-number">{String(waypoint.id).padStart(2, "0")}</span>
                    <span className="product-roadmap__waypoint-copy">
                      <small>{waypoint.era}</small>
                      <strong>{waypoint.title}</strong>
                      <em>{waypoint.statusLabel}</em>
                    </span>
                    <span className="product-roadmap__waypoint-open" aria-hidden="true">+</span>
                  </button>
                  {selectedId === waypoint.id && selected ? (
                    <WaypointDetail waypoint={selected} onClose={() => setSelectedId(null)} />
                  ) : null}
                </div>
              ))}
            </div>

            <div className="product-roadmap__destination">
              <span>DESTINATION</span>
              <h3>DURABLE PLATFORM.</h3>
              <p>Humans use Zaylist. Software can understand Zaylist. Authorized agents can act through Zaylist. All of them use the same underlying system.</p>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
