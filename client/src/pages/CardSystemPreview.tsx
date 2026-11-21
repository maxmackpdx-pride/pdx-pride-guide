import { useState } from "react";
import "./CardSystemPreview.css";

const surfaces = [
  ["Event card", "/dev/card-fronts"],
  ["Events + Placez", "/placez/map?mode=mapz"],
  ["Outzide", "/outzide"],
  ["Afterz", "/map?mode=afterz"],
] as const;

/** The preview runs the same routes and permissions as each standalone page. */
export default function CardSystemPreview() {
  const [selected, setSelected] = useState(0);
  const [name, path] = surfaces[selected];
  return <main className="card-system-preview">
    <nav aria-label="Preview surface">{surfaces.map(([label], index) =>
      <button key={label} type="button" aria-pressed={selected === index} onClick={() => setSelected(index)}>{label}</button>
    )}</nav>
    <iframe key={path} src={path} title={name} />
  </main>;
}
