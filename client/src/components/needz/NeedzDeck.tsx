import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import { NeedzDeckCard } from "./NeedzDeckCard";
import type { NeedzRow } from "./needzDeckModel";

const SWIPE = 70;

/** One tall card at a time. Back / Skip / Save, swipe right to save and left to skip, arrow keys on desktop. */
export function NeedzDeck({ deck, index, saved, onBack, onSkip, onSave, onChange, onDetails }: {
  deck: NeedzRow[]; index: number; saved: string[];
  onBack: () => void; onSkip: () => void; onSave: (row: NeedzRow) => void; onChange: () => void; onDetails: (row: NeedzRow) => void;
}) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const row = deck[index];
  const isSaved = saved.includes(row.id);
  const progress = Math.round(((index + 1) / Math.max(deck.length, 1)) * 100);
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("a,button")) return;
    start.current = { x: event.clientX, y: event.clientY };
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const origin = start.current;
    start.current = null;
    if (!origin) return;
    const dx = event.clientX - origin.x;
    const dy = event.clientY - origin.y;
    if (Math.abs(dx) < SWIPE || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx > 0) onSave(row); else onSkip();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") { event.preventDefault(); onSave(row); }
    else if (event.key === "ArrowLeft") { event.preventDefault(); onSkip(); }
  };
  return <section className="nd-deck" aria-label="Your deck">
    <div className="nd-deck__bar">
      <button type="button" className="pdx-glass-rebind pdxBtn nd-btn nd-btn--quiet" onClick={onChange}>Change answers</button>
      <span className="nd-deck__saved" role="status">Saved {saved.length}</span>
    </div>
    <div className="nd-deck__progress" role="progressbar" aria-label="Deck progress" aria-valuemin={1} aria-valuemax={deck.length} aria-valuenow={index + 1}><span style={{ width: `${progress}%` }} /></div>
    <div className="nd-deck__stage" tabIndex={0} aria-label="Card. Right arrow saves, left arrow skips." onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => { start.current = null; }} onKeyDown={onKeyDown}>
      <NeedzDeckCard key={row.id} row={row} position={index + 1} total={deck.length} onDetails={onDetails} />
    </div>
    <div className="nd-deck__controls">
      <button type="button" className="pdx-glass-rebind pdxBtn nd-btn nd-btn--tall" disabled={index === 0} onClick={onBack}>Back</button>
      <button type="button" className="pdx-glass-rebind pdxBtn nd-btn nd-btn--tall" onClick={onSkip}>Skip</button>
      <button type="button" className="pdx-glass-rebind pdxBtn pdxBtn--solid nd-btn nd-btn--tall nd-btn--save" aria-pressed={isSaved} onClick={() => onSave(row)}>{isSaved ? "Saved, next" : "Save"}</button>
    </div>
    <p className="nd-hint">Swipe right to save, left to skip.</p>
  </section>;
}
