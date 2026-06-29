export function MapViewFallback({ variant = "events" }: { variant?: "events" | "home" }) {
  return (
    <div
      className={variant === "events" ? "events-map-panel" : "home-map-panel"}
      style={{ background: "#0a0a0a", borderBottom: "2px solid #1a1a1a" }}
      aria-hidden="true"
    />
  );
}