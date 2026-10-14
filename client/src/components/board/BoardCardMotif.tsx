import { memo } from "react";
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
export const BoardCardMotif = memo(function BoardCardMotif({ post }: { post: BoardPost }) {
  const subject = `${post.title} ${post.detail} ${post.itemCategory || ""}`.toLowerCase();
  const pair = post.category === "housing" ? ["keysHome", "keyRing"]
    : post.category === "gigz" ? (/dj|music|sound|perform/.test(subject) ? ["karaoke", "soundRoom"] : ["webConsole", "designPlanes"])
    : post.category === "giftz" ? ["boardParcel", "plantHouse"]
    : post.category === "sellz" ? [/cloth|shirt|jacket|wear/.test(subject) ? "garment" : "lounge", "boardTag"]
    : ["boardMessages", "coffeeMix"];
  const yaw = post.id % 2 ? -.42 : .32;
  return <svg className={`ab-motif ab-motif--${post.category}`} viewBox="0 0 400 500" fill="none" stroke="currentColor" aria-hidden="true">
    <g className="ab-motif__mesh">
      {Array.from({ length: 11 }, (_, i) => <path key={`h${i}`} d={`M-40 ${160 + i * 26} Q180 ${65 + i * 29} 440 ${190 + i * 26}`} />)}
      {Array.from({ length: 9 }, (_, i) => <path key={`v${i}`} d={`M${-120 + i * 70} 520 Q${65 + i * 30} 290 ${85 + i * 35} 15`} />)}
    </g>
    <g className="ab-motif__support" transform="translate(265 135) scale(.55) translate(-200 -250)">
      <Volume form={placeWireframe(pair[1], .6, -yaw)} />
    </g>
    <g className="ab-motif__main" transform="translate(180 270) scale(.88) translate(-200 -250)">
      <Volume form={placeWireframe(pair[0], .8, yaw)} />
    </g>
  </svg>;
});
