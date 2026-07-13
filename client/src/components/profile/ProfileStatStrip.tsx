import { useEffect, useRef, useState } from "react";
import type { PublicProfileData } from "./types";

type Props = { data: PublicProfileData };

function fmtK(n: number): string {
  if (n >= 1000) {
    const v = n / 1000;
    return (v >= 10 ? Math.round(v) : Math.round(v * 10) / 10) + "K";
  }
  return String(n);
}

/**
 * Stat strip order matches Profile Reimagined 3a:
 * FOLLOWERS · HOSTING · ATTENDED · GOING
 */
export default function ProfileStatStrip({ data }: Props) {
  const stats = data.stats || {};
  const followers = stats.followers ?? 0;
  const hosting = stats.hosting ?? data.events?.hosting?.upcoming?.length ?? 0;
  const attended =
    (data.events?.going?.past?.length ?? 0) ||
    (typeof stats.checkIns === "number" ? stats.checkIns : 0) ||
    (typeof stats.shows === "number" ? stats.shows : Number(stats.shows) || 0);
  const going = stats.going ?? data.events?.going?.upcoming?.length ?? 0;

  const prevFollowers = useRef(followers);
  const [popping, setPopping] = useState(false);
  useEffect(() => {
    if (followers > prevFollowers.current) {
      setPopping(true);
      const t = window.setTimeout(() => setPopping(false), 420);
      prevFollowers.current = followers;
      return () => window.clearTimeout(t);
    }
    prevFollowers.current = followers;
  }, [followers]);

  const items: { num: string; label: string; tone?: "magenta" | "yellow" | "default" }[] = [
    { num: fmtK(followers), label: "Followers", tone: "default" },
    { num: fmtK(hosting), label: "Hosting", tone: "magenta" },
    { num: fmtK(attended), label: "Attended", tone: "default" },
    { num: fmtK(going), label: "Going", tone: "yellow" },
  ];

  return (
    <div className="pp-stats pp-stats--reimagined" role="group" aria-label="Profile stats">
      {items.map((s, i) => (
        <div key={s.label} className="pp-stats__cell">
          {i > 0 ? <span className="pp-stats__divider" aria-hidden="true" /> : null}
          <div className="pp-stats__item">
            <span
              className={[
                "display",
                "pp-stats__num",
                s.tone === "magenta" ? "pp-stats__num--magenta" : "",
                s.tone === "yellow" ? "pp-stats__num--yellow" : "",
                s.label === "Followers" && popping ? "u-numpop" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {s.num}
            </span>
            <span className="pp-stats__label">{s.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
