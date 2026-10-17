import { boardMotionTiming } from "@shared/boardMotion";
import { useCardMotifParallax } from "@/components/resources/useCardMotifParallax";
import { memo, useId, type CSSProperties } from "react";
import { resolveHousingMotif, type HousingMotifType, resolveBoardMotif } from "@shared/boardMotifs";
import type { BoardPost } from "@/lib/allBoards";
import { placeWireframe, type PlaceWireframe } from "@/components/resources/placeWireframeGeometry";

function Volume({ form, stroke }: { form: PlaceWireframe; stroke?: string }) {
  return <>
    <path className="ab-motif__rear" d={form.rearGrid} style={stroke?{stroke}:undefined} />
    <path className="ab-motif__grid" d={form.grid} style={stroke?{stroke}:undefined} />
    <path className="ab-motif__edge" d={form.outline} style={stroke?{stroke}:undefined} />
  </>;
}

/** The same projected 3D meshes as Placez/Needz, with board-specific objects. */
export const BoardCardMotif = memo(function BoardCardMotif({ post, placement = "hero" }: { post: BoardPost; placement?: "hero" | "card" }) {
  const cardMotion = useCardMotifParallax<HTMLDivElement>();
  const heroMotion = useCardMotifParallax<SVGSVGElement>();
  const gradientId = useId().replace(/:/g, "");
  const housing = post.category === "housing";
  const paint = (part:string) => housing ? `url(#${gradientId}-${part})` : "currentColor";
  const gradient = (part:string) => housing ? <defs><linearGradient id={`${gradientId}-${part}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="var(--ab-accent,var(--day-thu))"/><stop offset="100%" stopColor="var(--day-thu)"/></linearGradient></defs> : null;
  const subject = `${post.title} ${post.detail} ${post.itemCategory || ""}`.toLowerCase();
  const motif = housing
    ? resolveHousingMotif(post.intent.toUpperCase() as HousingMotifType, post.motifChoice, !!post.hasPets, post.id)
    : resolveBoardMotif(post.category, post.motifChoice, subject);
  const pair = [motif.main, motif.support];
  const yaw = post.id % 2 ? -.42 : .32;
  if (placement === "card") {
    const clock=boardMotionTiming(post.key);
    const seed = Array.from(post.key).reduce((n, char) => (Math.imul(n, 31) + char.charCodeAt(0)) >>> 0, 7);
    const nodes = Array.from({ length: 27 }, (_, i) => ({
      x: ((seed % 67) + i * 137) % 840 - 20,
      y: ((seed % 43) + i * 83) % 440 - 20,
    }));
    return <div ref={cardMotion} className="ab-card-motif" aria-hidden="true" style={{ "--ab-motif-phase": `${-(seed % 29)}s`, "--network-glitch-cycle": `${clock.networkCycle}s`, "--network-glitch-phase": `${clock.networkPhase}s` } as CSSProperties}>
      <svg data-ambient-layer="lines" className="ab-card-motif__network ab-card-motif__network--lines" viewBox="0 0 800 400" preserveAspectRatio="none" fill="none" stroke={paint("network")}>
        {gradient("network")}
        <g data-network-glitch={clock.plane==='lines'?'true':undefined}>
        <g className="ab-card-motif__mesh">
          {Array.from({ length: 12 }, (_, i) => <path key={`h${i}`} d={`M-60 ${-20 + i * 40} Q400 ${-150 + i * 44} 860 ${40 + i * 40}`} />)}
          {Array.from({ length: 17 }, (_, i) => <path key={`v${i}`} d={`M${-100 + i * 70} 450 Q${40 + i * 45} 230 ${-30 + i * 60} -50`} />)}
        </g>
        <g className="ab-card-motif__links">
          {nodes.flatMap((node, i) => nodes.slice(i + 1).filter(other => Math.hypot(node.x - other.x, node.y - other.y) < 180).map(other => <path key={`${i}-${other.x}`} d={`M${node.x} ${node.y}L${other.x} ${other.y}`} />))}
        </g>
        </g>
      </svg>
      <svg data-ambient-layer="nodes" className="ab-card-motif__network ab-card-motif__network--nodes" viewBox="0 0 800 400" preserveAspectRatio="none">
        <g data-network-glitch={clock.plane==='nodes'?'true':undefined} className="ab-card-motif__nodes" fill={paint("network")} stroke="none">
          {nodes.map((node, i) => <circle key={i} cx={node.x} cy={node.y} r={i % 5 === 0 ? 3 : 1.5} />)}
        </g>
      </svg>
      <svg data-motif-depth="support" className="ab-card-motif__object ab-card-motif__object--support" viewBox="0 0 400 500" fill="none" stroke="currentColor">
        {gradient("support")}
        <Volume form={placeWireframe(pair[1], .6, -yaw)} stroke={housing?paint("support"):undefined} />
      </svg>
      <svg data-motif-depth="front" className="ab-card-motif__object ab-card-motif__object--main" viewBox="0 0 400 500" fill="none" stroke="currentColor">
        {gradient("main")}
        <Volume form={placeWireframe(pair[0], .8, yaw)} stroke={housing?paint("main"):undefined} />
      </svg>
    </div>;
  }
  return <svg ref={heroMotion} data-motif-depth="front" className={`ab-motif ab-motif--${post.category}`} viewBox="0 0 400 500" fill="none" stroke="currentColor" aria-hidden="true">
    {gradient("hero")}
    <g className="ab-motif__main" transform="translate(200 230) scale(1.365) translate(-200 -250)">
      <Volume form={placeWireframe(pair[0], .8, yaw)} stroke={housing?paint("hero"):undefined} />
    </g>
  </svg>;
});
