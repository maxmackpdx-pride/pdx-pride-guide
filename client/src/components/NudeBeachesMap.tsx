import { lazy, Suspense, type CSSProperties } from "react";
import { BEACH_MAP_LOCATIONS, type NudeBeachTab } from "@shared/nudeBeaches";
import { LIVE_MAP_CHROME_CSS } from "@/components/ds/mapTheme";
import { useIncidentalMap } from "@/hooks/useIncidentalMap";

const BeachMapCanvas = lazy(() => import("./NudeBeachesMapCanvas"));

type Props = {
  tab: NudeBeachTab;
  height?: number | string;
};

export default function NudeBeachesMap({ tab, height }: Props) {
  const location = BEACH_MAP_LOCATIONS[tab];
  const { ref, active, memory } = useIncidentalMap(true, tab);
  const fillParent = height === "100%";
  const style = {
    "--beach-map-accent": location.pinColor,
    height,
    minHeight: fillParent ? height : undefined,
  } as CSSProperties;

  return (
    <div ref={ref} className="directory-map-wrap nude-beaches-map">
      <div
        className={`directory-map nude-beaches-map__canvas pdx-map-live pdx-map-surface${fillParent ? " directory-map--fill" : ""}`}
        style={style}
      >
        <style>{LIVE_MAP_CHROME_CSS}</style>
        <div className="pdx-map-live__vignette" aria-hidden="true" />
        <div className="pdx-map-live__shaft" aria-hidden="true" />
        <div className="nude-beaches-map__chip" aria-hidden="true">
          <span className="nude-beaches-map__chip-dot" />
          <span>
            <span className="nude-beaches-map__chip-title">{location.label}</span>
            <span className="nude-beaches-map__chip-sub">{location.subtitle}</span>
          </span>
        </div>
        {active && (
          <Suspense fallback={<p role="status">Loading beach map…</p>}>
            <BeachMapCanvas key={tab} location={location} memory={memory} />
          </Suspense>
        )}
      </div>
    </div>
  );
}
