import { useEffect, useRef, useState, type ReactNode } from "react";
import TodayLocationCard, { type TodayLocation } from "@/components/home/TodayLocationCard";
import "./OutzideFeatured.css";

export { splitBlendedArt as splitFeatured } from "@/lib/outzBlendedArt";

/** Mount children only once the slot is near the viewport (a blended card draws a canvas; 15 at once is wasteful on phones). */
function NearViewport({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(() => typeof IntersectionObserver === "undefined");
  useEffect(() => {
    const el = ref.current;
    if (near || !el) return;
    const io = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { setNear(true); io.disconnect(); } }, { rootMargin: "600px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [near]);
  return <div ref={ref} className="outz-featured__slot eb-original-card" data-mounted={near ? "true" : "false"}>{near ? children : null}</div>;
}

/** Large (4:5, ~360px) cards for the Outzide places with the new blended art. Renders nothing when there are none. */
export default function OutzideFeatured({ places, toLocation, onRequireAuth, label = "Featured", count }: {
  places: { id: string }[]; toLocation: (place: any) => TodayLocation; onRequireAuth?: () => void; label?: string; count?: number;
}) {
  if (!places.length) return null;
  return (
    <section className="outz-featured" aria-labelledby="outz-featured-title" data-testid="outz-featured">
      <h3 className="placez-outzide__more outz-featured__label" id="outz-featured-title">{label} <b>{count ?? places.length}</b></h3>
      <div className="outz-featured__grid">
        {places.map(p => <NearViewport key={p.id}><TodayLocationCard location={toLocation(p)} onRequireAuth={onRequireAuth} /></NearViewport>)}
      </div>
    </section>
  );
}
