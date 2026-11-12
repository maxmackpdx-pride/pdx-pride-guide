/** Torn punk-paper edge. Both layers are masked by the Boardz torn-card scan; the rim is filled with the
 * card's own accent token (--c), so the ripped fibers always match the card's edge color. Pure CSS, no state. */
export function NeedzTorn() {
  return <>
    <span className="nd-torn__rim" aria-hidden="true" />
    <span className="nd-torn__face" aria-hidden="true" />
  </>;
}
