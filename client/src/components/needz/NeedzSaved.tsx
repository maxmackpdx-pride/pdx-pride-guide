import { NeedzCompactCard } from "./NeedzCompactCard";
import type { NeedzRow } from "./needzDeckModel";

/** End of the deck: the saved cards as compact NEEDZ card faces (a saved summary, not a list view). */
export function NeedzSaved({ rows, onOpen, onRestart, onIntake, onClear }: {
  rows: NeedzRow[]; onOpen: (row: NeedzRow) => void; onRestart: () => void; onIntake: () => void; onClear: () => void;
}) {
  return <section className="nd-saved" aria-labelledby="nd-saved-title">
    <h2 id="nd-saved-title" className="nd-heading">Your list · {rows.length}</h2>
    <p className="nd-sub">{rows.length ? "Nice. Here's what you saved. Each card has the number and hours, so start with whichever is easiest." : "Nothing saved this time. Try a different need or just browse."}</p>
    {rows.length > 0 && <div className="nd-compact-grid">{rows.map(row => <NeedzCompactCard key={row.id} row={row} onOpen={onOpen} />)}</div>}
    <div className="nd-actions">
      <button type="button" className="pdx-glass-rebind pdxBtn nd-btn" onClick={onRestart}>Go through again</button>
      <button type="button" className="pdx-glass-rebind pdxBtn nd-btn" onClick={onIntake}>Look for something else</button>
    </div>
    {rows.length > 0 && <button type="button" className="nd-link" onClick={onClear}>Clear my list</button>}
    <p className="nd-fine">Your list stays on this device until you close the tab. Quick exit clears it.</p>
  </section>;
}
