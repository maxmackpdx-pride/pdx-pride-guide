import type { CSSProperties } from "react";
import { outzPlaceHref, type OutzBrowseCatalogRow } from "@shared/outz";
import { easeMapTo } from "@/lib/placezEventsDrawerApi";
import "@/components/drawers/DrawerTop.css";
import "./OutzideDrawer.css";

export type OutdoorDestination = OutzBrowseCatalogRow & {
  photo?: { src?: string };
  art?: string;
  region?: string;
};

export default function OutzideInViewRail({ destinations, onOpen, emptyMessage = "No destinations in view." }: {
  destinations: OutdoorDestination[];
  emptyMessage?: string;
  onOpen?: (place: OutdoorDestination) => void;
}) {
  if (!destinations.length) return <p className="outz-drawer-status" role="status" tabIndex={-1}>{emptyMessage}</p>;
  return <div className="outz-drawer-lead" data-testid="outzide-in-view-rail" aria-label="Outdoor destinations">
    {destinations.map(place => {
      const art = place.photo?.src || place.art;
      return <article key={place.id} data-testid="drawer-mini-card" className="drawer-mini pdx-glass-rebind" style={{"--piece": "var(--neon-orange)", "--c": "var(--neon-orange)"} as CSSProperties}>
        {art && <div className="drawer-mini__art"><img src={`/outzide-map/${art}`} loading="lazy" alt=""/></div>}
        <a className="drawer-mini__open" href={outzPlaceHref(place)} aria-label={`Open ${place.name}`} onClick={async event => {
          if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          if (onOpen) { onOpen(place); return; }
          if (place.lat != null && place.lng != null) await easeMapTo(place.lng, place.lat);
          window.location.assign(outzPlaceHref(place));
        }}>
          <span className="drawer-mini__meta"><strong className="drawer-mini__title">{place.name}</strong><span className="drawer-mini__count">{place.region || place.kind}</span></span>
        </a>
      </article>;
    })}
  </div>;
}
