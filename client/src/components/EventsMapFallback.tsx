import { MAP_SURFACE_BG } from "@/components/ds/mapTheme";

export function MapViewFallback({ variant = "events" }: { variant?: "events" | "home" }) {
  if (variant === "events") {
    return (
      <div className="directory-map-wrap events-map-wrap" aria-hidden role="status" aria-label="Loading map">
        <div
          className="events-map-panel directory-map pdx-map-live pdx-map-surface"
          style={{ background: MAP_SURFACE_BG }}
        />
      </div>
    );
  }

  return (
    <div
      className="home-map-panel pdx-map-live pdx-map-surface"
      style={{ background: MAP_SURFACE_BG }}
      aria-hidden
      role="status"
      aria-label="Loading map"
    />
  );
}
