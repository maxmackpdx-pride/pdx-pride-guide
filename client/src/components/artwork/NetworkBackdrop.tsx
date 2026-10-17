import { memo, useId, useLayoutEffect, useState, type CSSProperties } from "react";
import { useCardMotifParallax } from "../resources/useCardMotifParallax";
import { networkSeed, networkStack } from "./networkStack";
import { useMotifRecipes } from "./useMotifRecipes";
import "./NetworkBackdrop.css";

// DOM order follows filtering/reordering as well as separate card implementations.
// Only child-list changes are observed: motion/style updates never trigger a scan.
const mounted = new Map<HTMLElement, (index: number) => void>();
let ordering: MutationObserver | undefined;
let orderQueued = false;
function scheduleOrder() {
  if (orderQueued) return;
  orderQueued = true;
  queueMicrotask(() => {
    orderQueued = false;
    [...mounted.keys()].filter(node => node.isConnected)
      .sort((a, b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1)
      .forEach((node, index) => mounted.get(node)?.(index));
  });
}

/** Uploaded triptychs: one shared orientation, three independent depth movements. */
export const NetworkBackdrop = memo(function NetworkBackdrop({ identity, cardPair = false }: { identity: string; cardPair?: boolean }) {
  const ref = useCardMotifParallax<HTMLDivElement>();
  const maskId = useId().replace(/:/g, "");
  const recipes = useMotifRecipes();
  const seed = networkSeed(identity);
  const [sequence, setSequence] = useState(seed % 8);
  const { set, orientation } = networkStack(sequence);
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    mounted.set(node, setSequence);
    if (!ordering) {
      ordering = new MutationObserver(scheduleOrder);
      ordering.observe(document.body, { childList: true, subtree: true });
    }
    scheduleOrder();
    return () => {
      mounted.delete(node);
      if (mounted.size) scheduleOrder();
      else { ordering?.disconnect(); ordering = undefined; }
    };
  }, [ref]);
  const depths = cardPair ? (["back", "middle"] as const) : (["back", "middle", "front"] as const);
  return <div ref={ref} className={`card-network${cardPair ? " card-network--pair" : ""}`} data-network-set={set} data-network-orientation={orientation} aria-hidden="true" style={{
    "--network-stack-phase": `${-(seed % 37)}s`,
  } as CSSProperties}>
    <div className="card-network__orientation">
      {depths.map((depth, index) => {
        const asset = recipes?.assets[recipes.networkSets[set === "a" ? "a" : "b"][index]];
        return <div key={depth} className={`card-network__plane card-network__plane--${depth}`} data-network-depth={depth}>
          <svg viewBox="0 0 1280 1066" preserveAspectRatio="none" data-network-glitch={index === seed % 3 ? "true" : undefined}>
            {asset?.alpha ? <image href={asset.url} crossOrigin="anonymous" x="0" y="0" width="1280" height="1066" preserveAspectRatio="none" data-native-alpha="true"/> : <><defs><mask id={`${maskId}-${depth}`} maskUnits="userSpaceOnUse" x="0" y="0" width="1280" height="1066" style={{ maskType: "luminance" }}>
              <image href={asset?.url} crossOrigin="anonymous" x="0" y="0" width="1280" height="1066" preserveAspectRatio="none"/>
            </mask></defs>
            <rect width="1280" height="1066" fill="white" mask={`url(#${maskId}-${depth})`}/></>}
          </svg>
        </div>;})}
    </div>
  </div>;
});
