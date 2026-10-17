import { NetworkBackdrop } from "../artwork/NetworkBackdrop";
import { useCardMotifParallax } from "../resources/useCardMotifParallax";
import { memo, useId, type CSSProperties } from "react";
import { resolveHousingMotif, type HousingMotifType, resolveBoardMotif } from "@shared/boardMotifs";
import type { BoardPost } from "@/lib/allBoards";
import { placeWireframe, type PlaceWireframe } from "../resources/placeWireframeGeometry";

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
    const seed = Array.from(post.key).reduce((n, char) => (Math.imul(n, 31) + char.charCodeAt(0)) >>> 0, 7);
    return <div ref={cardMotion} className="ab-card-motif" aria-hidden="true" style={{ "--ab-motif-phase": `${-(seed % 29)}s` } as CSSProperties}>
      <NetworkBackdrop identity={post.key}/>
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
