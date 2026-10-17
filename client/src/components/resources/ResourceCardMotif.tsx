import { NetworkBackdrop } from "../artwork/NetworkBackdrop";
import { CardArtworkGlass } from "../CardArtworkGlass";
import "./ResourceCardMotif.css";
import { resourceGradientStops } from "./resourceGradient";
import { distinctPlaceMotif } from "./distinctPlaceMotifs";
import { memo, useId, useRef, useState, useEffect } from "react";
import { useCardMotifParallax } from "./useCardMotifParallax";
import { categoryMotifRecipe, placeMotifRecipe, resourceMotifCategory } from "@/lib/designMotifRecipes";
import { useMotifRecipes } from "../artwork/useMotifRecipes";
import { LibraryMotifImage } from "../artwork/LibraryMotifImage";

// The API supplies all visible artwork; legacy placement metadata only preserves geometry.
const MotifArtwork = memo(function MotifArtwork({ name, category, colors }: {name:string;category:string;colors?: string[]}) {
 const ref = useCardMotifParallax();
 const gradientId = `resource-motif-${useId().replace(/:/g, "")}`;
 const recipes = useMotifRecipes();
 const mappedCategory = resourceMotifCategory(category);
 const namedRecipe = mappedCategory?.room === "placez" ? placeMotifRecipe(recipes, name) : undefined;
 const recipe = namedRecipe ?? (mappedCategory && categoryMotifRecipe(recipes, mappedCategory.room, mappedCategory.category));
 const artworkFrame = namedRecipe ? { x: 0, y: 0, width: 400, height: 500 } : {};
 const hero = recipe && recipes?.assets[recipe.heroId];
 const companion = recipe && recipes?.assets[recipe.companionId];
 // Unregistered categories retain the registered network in the outer slot only.
 if (!hero || !companion) return null;
 const paint = colors && colors.length > 1 ? `url(#${gradientId})` : "currentColor";
 let seed = Array.from(name).reduce((n,c)=>Math.imul(n,31)+c.charCodeAt(0)|0,7) >>> 0;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const isPlace = category.startsWith("place-");
 for (let i = 0; i < 60; i++) random();
 const projected = Boolean(distinctPlaceMotif(name));
 const rightAtTop = Array.from(name).reduce((total, letter) => total + letter.charCodeAt(0), 0) % 2 === 0;
 const tilt=(random()-.5)*((isPlace || projected) ? 4 : 12);
 const cycle = 28 + Math.round(random() * 8);
 const phase = -Math.round(random() * cycle);
 return <svg ref={ref} className="rg-card-motif" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" data-motif={`${category}-${name}`} data-motif-material={projected ? "projected" : undefined}>
  {colors && colors.length > 1 && <defs><linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="400" y2="500">
   {resourceGradientStops(colors).map((stop, index) => <stop key={index} offset={`${stop.offset}%`} style={{ stopColor: stop.color }} />)}
  </linearGradient></defs>}
  <g data-motif-depth="support" className="rg-motif-layer rg-motif-layer--support">
   <g className="rg-motif-support-drift" style={{ animationDuration: `${cycle + 17}s`, animationDelay: `${phase - 13}s` }}>
    <g className="rg-motif-support-position" transform={`translate(${rightAtTop ? 230 : 170} 165) scale(.78) translate(-200 -250)`}>
     <g fill="none" stroke={paint} strokeLinejoin="round"><LibraryMotifImage asset={companion} paint={paint} {...artworkFrame} /></g>
    </g>
   </g>
  </g>
  <g data-motif-depth="front" className="rg-motif-layer rg-motif-layer--object">
   <g className="rg-motif-object-drift" style={{ animationDuration: `${cycle + 9}s`, animationDelay: `${phase - 7}s` }}>
    <g className="rg-motif-breathe" style={{ animationDuration: `${cycle + 4}s`, animationDelay: `${phase}s` }}>
     <g className="rg-motif-object" fill="none" stroke={paint} strokeLinejoin="round" transform={`${isPlace ? `translate(${rightAtTop ? -22 : 22} 46) ` : ""}rotate(${tilt} 200 250)`}>
      <LibraryMotifImage asset={hero} paint={paint} {...artworkFrame} />
     </g>
    </g>
   </g>
  </g>
 </svg>;
});


const motifVisibility = new Map<Element, (visible: boolean) => void>();
let motifObserver: IntersectionObserver | undefined;
export const ResourceCardMotif = memo(function ResourceCardMotif({ glass = false, ...props }: { name: string; category: string; colors?: string[]; glass?: boolean }) {
 const slot = useRef<HTMLDivElement>(null);
 const [visible, setVisible] = useState(false);
 useEffect(() => {
  const element = slot.current;
  if (!element) return;
  if (!motifObserver) motifObserver = new IntersectionObserver(entries => {
   for (const entry of entries) motifVisibility.get(entry.target)?.(entry.isIntersecting);
  }, { rootMargin: "200px" });
  const card = element.closest<HTMLElement>(".rg-directory-card, .rg-safety-summary, .room-doorways__door");
  if (card) card.dataset.artVisible = "false";
  motifVisibility.set(element, visible => {
   if (card) card.dataset.artVisible = String(visible);
   setVisible(visible);
  });
  motifObserver.observe(element);
  return () => {
   motifObserver?.unobserve(element);
   motifVisibility.delete(element);
   if (!motifVisibility.size) { motifObserver?.disconnect(); motifObserver = undefined; }
  };
 }, []);
 return <div ref={slot} className="rg-motif-slot" aria-hidden="true"><NetworkBackdrop identity={`${props.category}:${props.name}`}/>{visible && <MotifArtwork {...props} />}{glass && <CardArtworkGlass />}</div>;
});
