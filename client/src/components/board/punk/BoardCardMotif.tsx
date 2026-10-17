import { NetworkBackdrop } from "../../artwork/NetworkBackdrop";
import { boardMotionTiming } from "@shared/boardMotion";
import { useCardMotifParallax } from "@/components/resources/useCardMotifParallax";
import { memo, useId, type CSSProperties } from "react";
import type { BoardPost } from "@/lib/allBoards";
import { categoryMotifRecipe } from "@/lib/designMotifRecipes";
import { useMotifRecipes } from "../../artwork/useMotifRecipes";
import { LibraryMotifImage } from "../../artwork/LibraryMotifImage";

/** Published category companions reuse the approved Boardz artwork planes. */
export const BoardCardMotif = memo(function BoardCardMotif({ post, placement = "hero" }: { post: BoardPost; placement?: "hero" | "card" }) {
  const cardMotion = useCardMotifParallax<HTMLDivElement>();
  const heroMotion = useCardMotifParallax<SVGSVGElement>();
  const gradientId = useId().replace(/:/g, "");
  const recipes = useMotifRecipes();
  const recipe = categoryMotifRecipe(recipes, "boardz", post.category, post.intent);
  const companion = recipe && recipes?.assets[recipe.companionId];
  const hero = recipe && recipes?.assets[recipe.heroId];
  const housing = post.category === "housing";
  const paint = (part:string) => housing ? `url(#${gradientId}-${part})` : "currentColor";
  const gradient = (part:string) => housing ? <defs><linearGradient id={`${gradientId}-${part}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="var(--ab-accent,var(--day-thu))"/><stop offset="100%" stopColor="var(--day-thu)"/></linearGradient></defs> : null;
  if (placement === "card") {
    const clock=boardMotionTiming(post.key);
    const seed = Array.from(post.key).reduce((n, char) => (Math.imul(n, 31) + char.charCodeAt(0)) >>> 0, 7);
    return <div ref={cardMotion} className="ab-card-motif" aria-hidden="true" style={{ "--ab-motif-phase": `${-(seed % 29)}s`, "--network-glitch-cycle": `${clock.networkCycle}s`, "--network-glitch-phase": `${clock.networkPhase}s` } as CSSProperties}>
      <NetworkBackdrop identity={post.key}/>
      <svg data-motif-depth="front" className="ab-card-motif__object ab-card-motif__object--main" viewBox="0 0 400 500" fill="none" stroke="currentColor">
        {gradient("main")}
        {companion && <LibraryMotifImage asset={companion} paint={paint("main")} />}
      </svg>
    </div>;
  }
  return <svg ref={heroMotion} data-motif-depth="front" className={`ab-motif ab-motif--${post.category}`} viewBox="0 0 400 500" fill="none" stroke="currentColor" aria-hidden="true">
    {gradient("hero")}
    <g className="ab-motif__main" transform="translate(200 230) scale(1.365) translate(-200 -250)">
      {hero && <LibraryMotifImage asset={hero} paint={paint("hero")} />}
    </g>
  </svg>;
});
