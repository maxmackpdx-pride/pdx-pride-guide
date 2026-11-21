import { useState } from "react";
import { RIDEZ_CIRCLES, type RidezCircle } from "@shared/ridezCircle";
import CircleToggle from "./CircleToggle";

/**
 * Ridez circle toggle: a compact 3-way control in the top-right of a Ridez
 * section. Everybody / Friends / Friends of friends. Shared with the event
 * card Ridez panel (#115). Default Everybody.
 */
export const RIDEZ_CIRCLE_KEY = "zaylist:ridez-circle";

function readCircle(): RidezCircle {
  try {
    const value = localStorage.getItem(RIDEZ_CIRCLE_KEY);
    return value === "friends" || value === "fof" ? value : "everybody";
  } catch {
    return "everybody";
  }
}

export function useRidezCircle(): [RidezCircle, (circle: RidezCircle) => void] {
  const [circle, setCircle] = useState<RidezCircle>(readCircle);
  const set = (next: RidezCircle) => {
    setCircle(next);
    try { localStorage.setItem(RIDEZ_CIRCLE_KEY, next); } catch { /* private mode: session only */ }
  };
  return [circle, set];
}

export function RidezCircleToggle({
  value,
  onChange,
  label = "Show rides from",
}: {
  value: RidezCircle;
  onChange: (circle: RidezCircle) => void;
  label?: string;
}) {
  "use memo";
  return (
    <CircleToggle
      value={value}
      onChange={onChange}
      options={RIDEZ_CIRCLES}
      label={label}
      accent="var(--neon-orange)"
      testId="ridez-circle-toggle"
    />
  );
}

export default RidezCircleToggle;
