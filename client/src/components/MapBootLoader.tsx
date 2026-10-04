import SpectrumLoader from "./SpectrumLoader";
import "./MapBootLoader.css";

export default function MapBootLoader({ map, overlay = false, error, onRetry, onBrowse }: {
  map: "mapz" | "outz";
  overlay?: boolean;
  error?: string;
  onRetry?: () => void;
  onBrowse?: () => void;
}) {
  return <div className={`map-boot-loader${overlay ? " map-boot-loader--overlay" : ""}`} role={error ? "alert" : "status"} aria-live="polite">
    {error ? <>
      <p className="map-boot-loader__error">{error}</p>
      <div className="map-boot-loader__actions">
        {onRetry && <button type="button" onClick={onRetry}>Reload map</button>}
        {onBrowse && <button type="button" onClick={onBrowse}>Browse destinations</button>}
      </div>
    </> : <>
      <SpectrumLoader variant="ring" label={`Loading ${map === "mapz" ? "Mapz" : "Outzide"}`} />
      {map === "mapz" && <p className="map-boot-loader__message">yes, you’re weird<br />and we love you for it.</p>}
    </>}
  </div>;
}
