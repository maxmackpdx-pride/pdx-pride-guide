export function MapViewFallback({ variant = "events" }: { variant?: "events" | "home" }) {
  if (variant === "events") {
    return (
      <div className="directory-map-wrap events-map-wrap" aria-hidden role="status" aria-label="Loading map">
        <div className="events-map-panel directory-map" style={{ background: "#0a0a0a" }} />
      </div>
    );
  }

  return (
    <div
      className="home-map-panel"
      style={{ background: "#0a0a0a" }}
      aria-hidden
      role="status"
      aria-label="Loading map"
    />
  );
}