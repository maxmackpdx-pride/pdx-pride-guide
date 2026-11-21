import { useRef, useState, type KeyboardEvent } from "react";
import { RIDEZ_CIRCLES, type RidezCircle } from "@shared/ridezCircle";
import "./ridez.css";

/**
 * Ridez circle toggle (owner, Nov 20): a compact 3-way segmented control in
 * the top-right of a Ridez section: Everybody / Friends / Friends of friends.
 * Shared by the event card Ridez panel and the Afterz/Ridez drawer (#117).
 * Accessible radiogroup (roving tabindex, arrow keys), Ridez orange accent,
 * choice persisted per device. Default Everybody.
 */
export const RIDEZ_CIRCLE_KEY = "zaylist:ridez-circle";

function readCircle(): RidezCircle {
  try {
    const v = localStorage.getItem(RIDEZ_CIRCLE_KEY);
    return v === "friends" || v === "fof" ? v : "everybody";
  } catch { return "everybody"; }
}

export function useRidezCircle(): [RidezCircle, (c: RidezCircle) => void] {
  const [circle, setCircle] = useState<RidezCircle>(readCircle);
  const set = (c: RidezCircle) => {
    setCircle(c);
    try { localStorage.setItem(RIDEZ_CIRCLE_KEY, c); } catch { /* private mode: session only */ }
  };
  return [circle, set];
}

export function RidezCircleToggle({ value, onChange, label = "Show rides from" }: { value: RidezCircle; onChange: (c: RidezCircle) => void; label?: string }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    const to = e.key === "Home" ? 0 : e.key === "End" ? RIDEZ_CIRCLES.length - 1 : step ? (i + step + RIDEZ_CIRCLES.length) % RIDEZ_CIRCLES.length : -1;
    if (to < 0) return;
    e.preventDefault();
    onChange(RIDEZ_CIRCLES[to].value);
    refs.current[to]?.focus();
  };
  return (
    <div className="zrc" role="radiogroup" aria-label={label} data-ridez-circle={value}>
      {RIDEZ_CIRCLES.map((c, i) => {
        const on = c.value === value;
        return (
          <button key={c.value} ref={el => { refs.current[i] = el; }} type="button" role="radio" aria-checked={on} tabIndex={on ? 0 : -1}
            className={`zrc-opt${on ? " is-on" : ""}`} data-action={`ridez-circle-${c.value}`} title={c.label} aria-label={c.label}
            onClick={() => onChange(c.value)} onKeyDown={e => onKey(e, i)}>
            {c.short}
          </button>
        );
      })}
    </div>
  );
}

export default RidezCircleToggle;
