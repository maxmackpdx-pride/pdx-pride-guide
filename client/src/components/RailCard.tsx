import type { EventListing } from "@shared/multiDayEvents";
import { DAY_COLORS, DAY_TEXT_COLORS, fmtClock, hexA } from "@shared/prideWeek";
import type { ScheduleEvent } from "@/lib/scheduleEvents";
import { spawnRsvpSparks } from "@/components/RsvpSparks";
import LiveWave from "@/components/LiveWave";

export interface RailCardProps {
  event: ScheduleEvent;
  listing: EventListing;
  rsvped: boolean;
  live?: boolean;
  onToggleRsvp: (eventId: number) => void;
  onOpen: (listing: EventListing) => void;
  /** "full" = 230x300 poster card (headliner/rail use); "compact" = small thumb+text chip row. */
  variant?: "full" | "compact";
  /** When true (variant "full" only), stretches to 100% width/300h for a CSS grid cell instead of a fixed-width rail card. */
  fill?: boolean;
  /** Smaller full-poster card for dual-row marquees next to the map. */
  size?: "md" | "sm";
}

/**
 * Shared full-bleed poster card used by the Home headliner rail and the
 * Events page Happening Now / Up Next marquees. Day-color left border +
 * bottom scrim, ★ HEADLINER badge, live-now badge, RSVP heart.
 */
export default function RailCard({
  event,
  listing,
  rsvped,
  live = false,
  onToggleRsvp,
  onOpen,
  variant = "full",
  fill = false,
  size = "md",
}: RailCardProps) {
  const dc = DAY_COLORS[event.day] || "#00FFFF"; // fallback matches --neon-cyan; hexA() below needs a literal hex
  const dt = DAY_TEXT_COLORS[event.day] || dc;
  const showFeatBadge = !!event.feat && !live;
  const sm = size === "sm";
  const cardW = fill ? "100%" : sm ? 148 : 230;
  const cardH = fill ? 300 : sm ? 192 : 298;
  const titleSize = sm ? 14 : 17;
  const pad = sm ? "10px 11px 11px" : "14px 15px 15px";

  const heart = (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (!rsvped) spawnRsvpSparks(e.currentTarget);
        onToggleRsvp(event.id);
      }}
      aria-label={rsvped ? "Remove from my schedule" : "Add to my schedule"}
      style={{
        position: "absolute",
        top: variant === "full" ? 9 : undefined,
        right: variant === "full" ? 9 : undefined,
        zIndex: 5,
        width: variant === "full" ? 30 : 24,
        height: variant === "full" ? 30 : 24,
        borderRadius: 7,
        border: `1.5px solid ${hexA(dc, rsvped ? 1 : 0.6)}`,
        background: rsvped ? dc : "rgba(0,0,0,.5)",
        color: rsvped ? "var(--text-inverse)" : dc,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: variant === "full" ? 15 : 12,
        lineHeight: 1,
        padding: 0,
        flex: variant === "compact" ? "none" : undefined,
        alignSelf: variant === "compact" ? "center" : undefined,
        boxShadow: rsvped ? `0 0 12px -2px ${hexA(dc, 0.85)}` : "none",
        overflow: "visible",
      }}
    >
      {rsvped ? "♥" : "♡"}
    </button>
  );

  if (variant === "compact") {
    return (
      <div
        onClick={() => onOpen(listing)}
        style={{
          display: "flex",
          gap: 9,
          alignItems: "stretch",
          padding: 6,
          borderRadius: 7,
          cursor: "pointer",
          border: `1px solid ${hexA(dc, rsvped ? 0.55 : 0.14)}`,
          background: rsvped ? hexA(dc, 0.09) : "rgba(255,255,255,.02)",
        }}
      >
        <div
          style={{
            width: 42,
            height: 54,
            flex: "none",
            borderRadius: 4,
            overflow: "hidden",
            borderLeft: `3px solid ${dc}`,
            backgroundColor: "var(--ink-800)",
            backgroundImage: `url(${event.posterUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 2 }}>
          <span style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 10.5, letterSpacing: ".02em", color: dt }}>
            {fmtClock(event.s)}
          </span>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 12.5,
              lineHeight: 1.05,
              color: "var(--text-hi)",
              textTransform: "uppercase",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {event.title}
          </span>
        </div>
        {heart}
      </div>
    );
  }

  return (
    <div
      onClick={() => onOpen(listing)}
      style={{
        position: "relative",
        flex: fill ? undefined : "none",
        width: cardW,
        height: cardH,
        borderRadius: sm ? 8 : 9,
        overflow: "hidden",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        border: `1px solid ${hexA(dc, rsvped ? 0.85 : 0.28)}`,
        borderLeft: `${sm ? 3 : 4}px solid ${dc}`,
        backgroundColor: "var(--ink-800)",
        backgroundImage: `url(${event.posterUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center center",
        boxShadow: rsvped ? `0 0 22px -3px ${hexA(dc, 0.85)}` : showFeatBadge ? `0 0 22px -7px ${hexA(dc, 0.6)}` : "0 6px 20px -10px rgba(0,0,0,.9)",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, rgba(11,11,14,.95) 0%, rgba(11,11,14,.42) 52%, rgba(11,11,14,.02) 100%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      {live && (
        <div
          style={{
            position: "absolute",
            top: 9,
            left: 9,
            zIndex: 4,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 10,
            letterSpacing: ".06em",
            color: "var(--text-inverse)",
            background: "var(--neon-magenta)",
            padding: "3px 8px 2px",
            borderRadius: 3,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          ● LIVE NOW
          <LiveWave />
        </div>
      )}
      {showFeatBadge && (
        <div
          style={{
            position: "absolute",
            top: 9,
            left: 9,
            zIndex: 4,
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 10,
            letterSpacing: ".09em",
            color: "var(--text-inverse)",
            background: dc,
            padding: "4px 8px 3px",
            borderRadius: 3,
            boxShadow: `0 0 14px -2px ${hexA(dc, 0.85)}`,
          }}
        >
          ★ HEADLINER
        </div>
      )}
      {heart}
      <div style={{ position: "relative", zIndex: 2, padding: pad }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: sm ? 5 : 7, flexWrap: "wrap" }}>
          {!live && (
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: sm ? 9 : 10,
                letterSpacing: ".06em",
                color: "var(--text-inverse)",
                background: dc,
                padding: sm ? "2px 6px 1px" : "3px 7px 2px",
                borderRadius: 3,
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              {event.day} · {fmtClock(event.s)}
            </span>
          )}
          {!sm && (
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                fontSize: 10.5,
                color: "var(--text-hi)",
                background: "rgba(0,0,0,.5)",
                padding: "3px 7px",
                borderRadius: 999,
                whiteSpace: "nowrap",
              }}
            >
              {fmtClock(event.s)}
            </span>
          )}
        </div>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: titleSize,
            lineHeight: 1.04,
            color: "var(--text-hi)",
            textTransform: "uppercase",
            letterSpacing: ".01em",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textShadow: "0 2px 10px rgba(0,0,0,.9)",
          }}
        >
          {event.title}
        </div>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: sm ? 10.5 : 11.5,
            color: "rgba(230,227,218,.75)",
            marginTop: 3,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {event.venue}
        </div>
        {!sm && (
          <div style={{ fontFamily: "var(--font-body)", fontSize: 10.5, fontWeight: 600, color: "rgba(255,255,255,.6)", marginTop: 6 }}>
            ♥ {event.going} going
          </div>
        )}
      </div>
    </div>
  );
}
