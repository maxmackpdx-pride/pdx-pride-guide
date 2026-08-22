import { useState } from "react";
import type React from "react";
import { useLocation } from "wouter";
import type { AdmissionType } from "@shared/admission";
import type { Event } from "@shared/schema";
import { EventCard as DsEventRow, PosterCard } from "@/components/ds";
import ScrollReveal from "@/components/ScrollReveal";
import AuthModal from "@/components/AuthModal";
import EventAttendancePreview from "@/components/EventAttendancePreview";
import EventWorkHereTag from "@/components/EventWorkHereTag";
import { useAuth } from "@/context/AuthContext";
import type { AttendanceSummary } from "@/lib/attendanceBubble";
import type { UserEventTalentCard } from "@shared/eventTalent";
import {
  formatListingWhen,
  listingDay,
  listingPosterUrl,
  listingTypeTags,
} from "@/lib/dsEvent";
import { admissionEventLinkLabel } from "@shared/admission";
import { resolveVenueWebsite } from "@shared/venueLinks";
import { Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { shareEventLink, shareToastTitle } from "@/lib/shareEvent";

type EventWithVenue = Event & {
  venueWebsite?: string | null;
  ticketUrl?: string | null;
  address?: string | null;
  isPrivate?: boolean | null;
  hasPendingClaim?: boolean;
};

function eventCardA11yProps(onClick: () => void) {
  return {
    role: "button" as const,
    tabIndex: 0,
    onClick,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick();
      }
    },
  };
}

function EventShareButton({ href, title }: { href: string; title: string }) {
  const { toast } = useToast();
  return (
    <button
      type="button"
      title="Share this event"
      aria-label="Share this event"
      onClick={async (e) => {
        e.stopPropagation();
        try {
          const result = await shareEventLink(href, title);
          toast({ title: shareToastTitle(result, "event") });
        } catch (err) {
          if ((err as DOMException)?.name !== "AbortError") {
            toast({ title: "Could not share event", variant: "destructive" });
          }
        }
      }}
      className="ds-listing-share"
    >
      <Share2 size={14} strokeWidth={2.3} aria-hidden />
    </button>
  );
}

type Props = {
  event: EventWithVenue;
  onClick: () => void;
  viewMode: "grid" | "list";
  revealDelay?: number;
  attendanceSummary?: AttendanceSummary | null;
  myTalent?: UserEventTalentCard | null;
  selfUserId?: number;
  shareHref: string;
};

export default function ListingCard({
  event,
  onClick,
  viewMode,
  revealDelay = 0,
  attendanceSummary,
  myTalent,
  selfUserId,
  shareHref,
}: Props) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showAuth, setShowAuth] = useState(false);

  const day = listingDay(event);
  const when = formatListingWhen(event);
  const types = listingTypeTags(event);
  const image = listingPosterUrl(event);
  const claimPending = Boolean(event.hasPendingClaim);
  // Public API strips claimedBy; isClaimable is the public signal for unclaimed listings.
  const claimable = Boolean(event.isClaimable && !event.claimedBy && !claimPending);
  const showAttendance = attendanceSummary && attendanceSummary.count > 0;
  const venueHref = event.venueWebsite || resolveVenueWebsite(event.venueName) || undefined;
  const ticketHref = event.ticketUrl?.trim() || undefined;
  const ticketLabel = admissionEventLinkLabel(event.admission || "");
  const address = !event.isPrivate && event.address ? event.address : undefined;

  const handleClaim = () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    setLocation(`/submit/claim/${event.id}`);
  };

  const claimProps = {
    claimable,
    claimPending,
    onClaimClick: claimable ? handleClaim : undefined,
  };

  const extras = (
    <div className="ds-listing-card__extras" onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
      <EventWorkHereTag talent={myTalent} compact />
      {!showAttendance && (
        <EventAttendancePreview summary={attendanceSummary} compact selfUserId={selfUserId} />
      )}
    </div>
  );

  if (viewMode === "list") {
    return (
      <ScrollReveal delay={revealDelay}>
        <div
          className="ds-listing-card ds-listing-card--list pdx-glass-rebind"
          data-testid={`event-card-${event.id}`}
          style={{ ["--i" as string]: Math.round((revealDelay || 0) / 40) }}
          {...eventCardA11yProps(onClick)}
        >
          <EventShareButton href={shareHref} title={event.title} />
          <DsEventRow
            title={event.title}
            venue={event.venueName}
            venueHref={venueHref}
            address={address}
            ticketHref={ticketHref}
            ticketLabel={ticketLabel}
            when={when}
            day={day}
            image={image}
            types={types}
            admission={event.admission as AdmissionType | undefined}
            age={event.ageRequirement as "ALL_AGES" | "18_PLUS" | "21_PLUS" | undefined}
            going={showAttendance ? attendanceSummary!.count : undefined}
            style={{ cursor: "pointer" }}
            {...claimProps}
          />
          {extras}
          {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
        </div>
      </ScrollReveal>
    );
  }

  return (
    <ScrollReveal delay={revealDelay}>
      <div
        className="ds-listing-card ds-listing-card--grid pdx-glass-rebind"
        data-testid={`event-card-${event.id}`}
        style={{ ["--i" as string]: Math.round((revealDelay || 0) / 40) }}
        {...eventCardA11yProps(onClick)}
      >
        <EventShareButton href={shareHref} title={event.title} />
        <PosterCard
          title={event.title}
          venue={event.venueName}
          venueHref={venueHref}
          /* Grid: no street address (neighborhood is in `when`); open modal for full details/tickets */
          address={undefined}
          ticketHref={undefined}
          when={when}
          day={day}
          image={image}
          types={types}
          admission={event.admission as AdmissionType | undefined}
          age={event.ageRequirement as "ALL_AGES" | "18_PLUS" | "21_PLUS" | undefined}
          going={showAttendance ? attendanceSummary!.count : undefined}
          showLink={false}
          showDetailsLink={false}
          dense
          style={{ cursor: "pointer", height: "100%" }}
          {...claimProps}
        />
        {extras}
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </div>
    </ScrollReveal>
  );
}
