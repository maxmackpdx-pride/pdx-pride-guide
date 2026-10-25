import { useEffect, useState } from "react";

/** Phones, and touch devices with a narrow viewport: no fly-out cards. The globe hero stays; nothing is fetched for cards. */
export const NO_FLYOUT_QUERY = "(max-width: 700px), (max-width: 900px) and (pointer: coarse)";

export function useMedia(query: string, initial = false) {
  const [match, setMatch] = useState(() => (typeof window === "undefined" ? initial : window.matchMedia(query).matches));
  useEffect(() => {
    const mq = window.matchMedia(query);
    const sync = () => setMatch(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [query]);
  return match;
}

/** True where the hero flies cards (desktop and wide viewports). */
export const useFlyOutEnabled = () => !useMedia(NO_FLYOUT_QUERY);
