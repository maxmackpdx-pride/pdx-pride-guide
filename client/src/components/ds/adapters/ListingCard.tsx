import type React from "react";
import type { Event } from "@shared/schema";
import { EventCard as DsEventRow, PosterCard } from "@/components/ds";
import ScrollReveal from "@/components/ScrollReveal";
import EventAttendancePreview from "@/components/EventAttendancePreview";
import EventWorkHereTag from "@/components/EventWorkHereTag";
import type { AttendanceSummary } from "@/lib/attendanceBubble";
import type { UserEventTalentCard } from "@shared/eventTalent";
import {
  formatListingWhen,
  listingDay,
  listingPosterUrl,
  listingTypeTags,
} from "@/lib/dsEvent";
import { Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { shareEventLink } from "@/lib/shareEvent";

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

function EventShareLink({ href, title }: { href: string; title: string }) {
  const { toast } = useToast();
  return (
    <button
      type="button"
      title={`Share ${title}`}
      aria-label={`Share ${title}`}
      onClick={async (e) => {
        e.stopPropagation();
        try {
          const result = await shareEventLink(href, title);
          toast({ title: result === "shared" ? "Shared" : "Link copied to clipboard" });
        } catch (err) {
          if ((err as DOMException)?.name !== "AbortError") {
            toast({ title: "Could not share link", variant: "destructive" });
          }
        }
      }}
      className="ds-listing-share"
    >
      <Link2 size={14} />
    </button>
  );
}

type Props = {
  event: Event;
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
  const day = listingDay(event);
  const when = formatListingWhen(event);
  const types = listingTypeTags(event);
  const image = listingPosterUrl(event);
  const claimable = Boolean(event.isClaimable && !event.claimedBy);
  const showAttendance = attendanceSummary && attendanceSummary.count > 0;

  if (viewMode === "list") {
    return (
      <ScrollReveal delay={revealDelay}>
        <div
          className="ds-listing-card ds-listing-card--list"
          data-testid={`event-card-${event.id}`}
          {...eventCardA11yProps(onClick)}
        >
          <EventShareLink href={shareHref} title={event.title} />
          <DsEventRow
            title={event.title}
            venue={event.venueName}
            when={when}
            day={day}
            image={image}
            types={types}
            admission={event.admission as "FREE" | "TICKETED" | "SUGGESTED_DONATION" | undefined}
            age={event.ageRequirement as "ALL_AGES" | "18_PLUS" | "21_PLUS" | undefined}
            going={showAttendance ? attendanceSummary!.count : undefined}
            style={{ cursor: "pointer" }}
          />
          <div className="ds-listing-card__extras" onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
            <EventWorkHereTag talent={myTalent} compact />
            {!showAttendance && (
              <EventAttendancePreview summary={attendanceSummary} compact selfUserId={selfUserId} />
            )}
          </div>
        </div>
      </ScrollReveal>
    );
  }

  return (
    <ScrollReveal delay={revealDelay}>
      <div
        className="ds-listing-card ds-listing-card--grid"
        data-testid={`event-card-${event.id}`}
        {...eventCardA11yProps(onClick)}
      >
        <EventShareLink href={shareHref} title={event.title} />
        <PosterCard
          title={event.title}
          venue={event.venueName}
          when={when}
          day={day}
          image={image}
          types={types}
          admission={event.admission as "FREE" | "TICKETED" | "SUGGESTED_DONATION" | undefined}
          age={event.ageRequirement as "ALL_AGES" | "18_PLUS" | "21_PLUS" | undefined}
          claimable={claimable}
          going={showAttendance ? attendanceSummary!.count : undefined}
          showLink={false}
          style={{ cursor: "pointer", height: "100%" }}
        />
        <div className="ds-listing-card__extras" onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
          <EventWorkHereTag talent={myTalent} compact />
          {!showAttendance && (
            <EventAttendancePreview summary={attendanceSummary} compact selfUserId={selfUserId} />
          )}
        </div>
      </div>
    </ScrollReveal>
  );
}