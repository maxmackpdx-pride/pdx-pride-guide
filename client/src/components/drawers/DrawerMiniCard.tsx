import { useEffect, useState, type CSSProperties } from "react";
import { CardHeartButton } from "@/components/CardHeartButton";
import RailShareButton from "@/components/home/RailShareButton";
import VenueFollowButton from "@/components/VenueFollowButton";
import EventFlyerArt from "@/components/events/EventFlyerArt";
import { listingDay, listingPosterUrl } from "@/lib/dsEvent";
import { dayAccentToken } from "@/lib/dsColors";
import { eventPath } from "@shared/eventSlug";
import { placePath } from "@shared/placeSlug";
import { DIRECTORY_TYPE_LABELS } from "@shared/directoryTheme";
import { directoryFallbackLogo, resolveDirectoryLogo } from "@shared/directoryLogos";
import { DRAWER_CATEGORY_FILTERS } from "@shared/drawerFilters";
import { nativePlacezModel } from "@/components/placez/nativeModel";
import { formatDrawerCountdown, remainingToStart, type DrawerTopEvent } from "@shared/drawerTop";
import type { Event } from "@shared/schema";
import "./DrawerTop.css";

/** Place payload for the same mini card used by events. Additive; event usage is unchanged. */
export type DrawerMiniPlace = {
  id: number;
  name: string;
  type?: string | null;
  imageUrl?: string | null;
  neighborhood?: string | null;
  isFollowing?: boolean;
  lat?: number | null;
  lng?: number | null;
};

function placeAccent(type?: string | null): string {
  return DRAWER_CATEGORY_FILTERS.find(chip => chip.id === type)?.accent || "var(--room-placez)";
}

/** Existing Placez photo / logo / fallback pipeline. Never a flat category color block. */
function placeMiniArt(place: DrawerMiniPlace): { src: string; fit: "cover" | "contain"; position?: string } {
  try {
    const model = nativePlacezModel({
      id: place.id,
      name: place.name,
      type: place.type || "venue",
      imageUrl: place.imageUrl,
    });
    if (model.imageUrl) {
      return {
        src: model.imageUrl,
        fit: model.imageFit === "contain" ? "contain" : "cover",
        position: model.imagePosition || "top center",
      };
    }
    if (model.logoUrl) return { src: model.logoUrl, fit: "contain" };
  } catch {
    // Invalid or incomplete records still get a logo or the standard placeholder.
  }
  const logo = resolveDirectoryLogo(place.name, place.imageUrl);
  if (logo) return { src: logo, fit: "contain" };
  return { src: directoryFallbackLogo(place.type || "venue"), fit: "contain" };
}

/**
 * Full-bleed mini card for every drawer rail. Same chrome on events, restaurants,
 * venues, and past events: share circle top-right, heart bottom-right. Hearts
 * mean interested (save to stack and notifications) through existing APIs.
 */
export default function DrawerMiniCard({
  event,
  place,
  saved = false,
  onToggleSave,
  onOpen,
  onOpenPlace,
  onRequireAuth,
}: {
  event?: DrawerTopEvent;
  place?: DrawerMiniPlace;
  saved?: boolean;
  onToggleSave?: (id: number) => void;
  onOpen?: (event: DrawerTopEvent) => void;
  onOpenPlace?: (place: DrawerMiniPlace) => void;
  onRequireAuth?: () => void;
}) {
  "use memo";
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, []);
  if (!event && !place) return null;
  if (place && !event) {
    const accent = placeAccent(place.type);
    const kind = DIRECTORY_TYPE_LABELS[place.type || ""] || place.type || "Place";
    const art = placeMiniArt(place);
    return (
      <article
        data-card-size="small"
        data-card-category="placez"
        data-testid="drawer-mini-card"
        className="drawer-mini pdx-glass-rebind"
        style={{ "--c": accent } as CSSProperties}
      >
        <div
          className={`drawer-mini__art${art.fit === "contain" ? " is-mark" : ""}`}
          style={{ "--mini-fit": art.fit, "--mini-position": art.position || "top center" } as CSSProperties}
          aria-hidden="true"
        >
          <img src={art.src} alt="" />
        </div>
        <button
          type="button"
          className="drawer-mini__open"
          onClick={() => onOpenPlace ? onOpenPlace(place) : window.location.assign(placePath(place.id, place.name))}
          aria-label={`Open ${place.name}`}
        >
          <span className="drawer-mini__meta">
            <span className="drawer-mini__title">{place.name}</span>
            <span className="drawer-mini__count">{kind}</span>
          </span>
        </button>
        <RailShareButton href={placePath(place.id, place.name)} title={place.name} />
        <VenueFollowButton
          variant="small-card"
          businessId={place.id}
          initialFollowing={Boolean(place.isFollowing)}
          onRequireAuth={onRequireAuth}
        />
      </article>
    );
  }
  const listing = event as DrawerTopEvent;
  const poster = listingPosterUrl(listing as unknown as Event);
  const accent = listing.accentColor || dayAccentToken(listingDay(listing as unknown as Event));
  const remaining = remainingToStart(listing.dateStart, now);
  return (
    <article
      data-card-size="small"
      data-card-category="eventz"
      data-testid="drawer-mini-card"
      className="drawer-mini pdx-glass-rebind"
      style={{ "--c": accent } as CSSProperties}
    >
      <div className="drawer-mini__art" aria-hidden="true">
        <EventFlyerArt src={poster} day={listingDay(listing as unknown as Event)} showDay={false} title={listing.title} venueName={listing.venueName || ""} />
      </div>
      <button type="button" className="drawer-mini__open" onClick={() => onOpen?.(listing)} aria-label={`Open ${listing.title}`}>
        <span className="drawer-mini__meta">
          <span className="drawer-mini__title">{listing.title}</span>
          {remaining ? <span className="drawer-mini__count">{formatDrawerCountdown(remaining)}</span> : null}
        </span>
      </button>
      <RailShareButton href={eventPath(listing.id, listing.title, listing.dayOfWeek)} title={listing.title} />
      <CardHeartButton
        active={saved}
        aria-label={`${saved ? "Remove" : "Add"} ${listing.title} ${saved ? "from" : "to"} my schedule`}
        onClick={click => {
          click.stopPropagation();
          if (onToggleSave) onToggleSave(listing.id);
        }}
      />
    </article>
  );
}
