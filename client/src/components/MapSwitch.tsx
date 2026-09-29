import { Link } from "wouter";
import "./MapSwitch.css";

/** Mapz and OutZide are one map family: a switch in the same spot on both maps crosses between them. */
export default function MapSwitch({ current }: { current: "mapz" | "outz" }) {
  return (
    <nav className="map-switch pdx-liquid-overlay" aria-label="Switch map">
      <Link href="/map" className="map-switch__option map-switch__option--mapz" aria-current={current === "mapz" ? "page" : undefined}>Mapz</Link>
      <Link href="/outzide" className="map-switch__option map-switch__option--outz" aria-current={current === "outz" ? "page" : undefined}>OutZide</Link>
    </nav>
  );
}
