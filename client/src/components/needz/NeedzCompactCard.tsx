import type { CSSProperties } from "react";
import { NeedzLogo } from "./NeedzLogo";
import { NeedzTorn } from "./NeedzTorn";
import { formatPhone, type NeedzRow } from "./needzDeckModel";

/** NEEDZ discovery-compact face: 163.2 x 204 (needz-card-system.json), same torn accent paper as the tall card. */
export function NeedzCompactCard({ row, onOpen }: { row: NeedzRow; onOpen: (row: NeedzRow) => void }) {
  return <button type="button" className="nd-compact nd-torn pdx-glass-rebind" data-card-size="small" data-card-category="needz" style={{ "--c": row.color } as CSSProperties} onClick={() => onOpen(row)} aria-label={`${row.org.name}. Open in the deck`}>
    <NeedzTorn />
    <span className="nd-compact__media"><NeedzLogo row={row} /></span>
    <span className="nd-compact__scope">{row.category.name}</span>
    <span className="nd-compact__name">{row.caption}</span>
    <span className="nd-compact__contact">{row.phone ? formatPhone(row.phone) : row.org.url ? "Online" : "See details"}</span>
  </button>;
}
