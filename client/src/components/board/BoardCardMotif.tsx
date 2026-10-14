import { memo, type CSSProperties } from "react";
import type { BoardPost } from "@/lib/allBoards";
import { placeWireframe, type PlaceWireframe } from "../resources/placeWireframeGeometry";

function Volume({ form }: { form: PlaceWireframe }) {
  return <>
    <path className="ab-motif__rear" d={form.rearGrid} />
    <path className="ab-motif__grid" d={form.grid} />
    <path className="ab-motif__edge" d={form.outline} />
  </>;
}

/** The same projected 3D meshes as Placez/Needz, with board-specific objects. */
export const BoardCardMotif = memo(function BoardCardMotif({ post, placement = "hero" }: { post: BoardPost; placement?: "hero" | "card" }) {
  const subject = `${post.title} ${post.detail} ${post.itemCategory || ""}`.toLowerCase();
  const pair = post.category === "housing" ? ["keysHome", "keyRing"]
    : post.category === "gigz" ? (/dj|music|sound|perform/.test(subject) ? ["karaoke", "soundRoom"] : ["webConsole", "designPlanes"])
    : post.category === "giftz" ? ["boardParcel", "plantHouse"]
    : post.category === "sellz" ? [/cloth|shirt|jacket|wear/.test(subject) ? "garment" : "lounge", "boardTag"]
    : ["boardMessages", "coffeeMix"];
  const yaw = post.id % 2 ? -.42 : .32;
  if (placement === "card") {
    const seed = Array.from(post.key).reduce((n, char) => (Math.imul(n, 31) + char.charCodeAt(0)) >>> 0, 7);
    const nodes = Array.from({ length: 27 }, (_, i) => ({
      x: ((seed % 67) + i * 137) % 840 - 20,
      y: ((seed % 43) + i * 83) % 440 - 20,
    }));
    return <div className="ab-card-motif" aria-hidden="true" style={{ "--ab-motif-phase": `${-(seed % 29)}s` } as CSSProperties}>
      <svg className="ab-card-motif__network" viewBox="0 0 800 400" preserveAspectRatio="none" fill="none" stroke="currentColor">
        <g className="ab-card-motif__mesh">
          {Array.from({ length: 12 }, (_, i) => <path key={`h${i}`} d={`M-60 ${-20 + i * 40} Q400 ${-150 + i * 44} 860 ${40 + i * 40}`} />)}
          {Array.from({ length: 17 }, (_, i) => <path key={`v${i}`} d={`M${-100 + i * 70} 450 Q${40 + i * 45} 230 ${-30 + i * 60} -50`} />)}
        </g>
        <g className="ab-card-motif__links">
          {nodes.flatMap((node, i) => nodes.slice(i + 1).filter(other => Math.hypot(node.x - other.x, node.y - other.y) < 180).map(other => <path key={`${i}-${other.x}`} d={`M${node.x} ${node.y}L${other.x} ${other.y}`} />))}
        </g>
        <g className="ab-card-motif__nodes" fill="currentColor" stroke="none">
          {nodes.map((node, i) => <circle key={i} cx={node.x} cy={node.y} r={i % 5 === 0 ? 3 : 1.5} />)}
        </g>
      </svg>
      <svg className="ab-card-motif__object ab-card-motif__object--support" viewBox="0 0 400 500" fill="none" stroke="currentColor">
        <Volume form={placeWireframe(pair[1], .6, -yaw)} />
      </svg>
      <svg className="ab-card-motif__object ab-card-motif__object--main" viewBox="0 0 400 500" fill="none" stroke="currentColor">
        <Volume form={placeWireframe(pair[0], .8, yaw)} />
      </svg>
    </div>;
  }
  return <svg className={`ab-motif ab-motif--${post.category}`} viewBox="0 0 400 500" fill="none" stroke="currentColor" aria-hidden="true">
    <g className="ab-motif__main" transform="translate(200 230) scale(1.05) translate(-200 -250)">
      <Volume form={placeWireframe(pair[0], .8, yaw)} />
    </g>
  </svg>;
});
