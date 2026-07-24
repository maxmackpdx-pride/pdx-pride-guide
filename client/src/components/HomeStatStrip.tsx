import { useEffect, useState } from "react";

type Props = {
  placesCount: number;
  goingCount: number;
  countdownTarget: string;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function diffMs(target: string) {
  const t = new Date(target).getTime();
  if (!Number.isFinite(t)) return 0;
  return Math.max(0, t - Date.now());
}

/** Three-column stat band: next-event countdown, directory places, RSVPs going. */
export default function HomeStatStrip({ placesCount, goingCount, countdownTarget }: Props) {
  const hasTarget = !!countdownTarget && Number.isFinite(new Date(countdownTarget).getTime());
  const [left, setLeft] = useState(() => diffMs(countdownTarget));

  useEffect(() => {
    setLeft(diffMs(countdownTarget));
    const id = window.setInterval(() => setLeft(diffMs(countdownTarget)), 1000);
    return () => window.clearInterval(id);
  }, [countdownTarget]);

  const live = left === 0;

  let diff = Math.floor(left / 1000);
  const days = Math.floor(diff / 86400);
  diff -= days * 86400;
  const hrs = Math.floor(diff / 3600);
  diff -= hrs * 3600;
  const min = Math.floor(diff / 60);
  const sec = diff - min * 60;

  return (
    <div className="home-stat-strip" aria-label="Live site stats">
      <div className="home-stat-strip__cell">
        <div className="home-stat-strip__value home-stat-strip__value--countdown" aria-live="polite">
          {!hasTarget ? (
            <span>-</span>
          ) : live ? (
            <span>Now</span>
          ) : (
            <>
              <span>{days}</span>
              <span className="home-stat-strip__unit">D</span>
              <span className="home-stat-strip__sep"> </span>
              <span>{pad(hrs)}</span>
              <span className="home-stat-strip__colon">:</span>
              <span className="home-stat-strip__min">{pad(min)}</span>
              <span className="home-stat-strip__colon">:</span>
              <span className="home-stat-strip__sec">{pad(sec)}</span>
            </>
          )}
        </div>
        <div className="home-stat-strip__label">{live ? "Happening now" : "Next event in"}</div>
      </div>
      <div className="home-stat-strip__cell">
        <div className="home-stat-strip__value home-stat-strip__value--lime">{placesCount}</div>
        <div className="home-stat-strip__label">Places to back</div>
      </div>
      <div className="home-stat-strip__cell home-stat-strip__cell--last">
        <div className="home-stat-strip__value home-stat-strip__value--orange">{goingCount}</div>
        <div className="home-stat-strip__label">Going to events</div>
      </div>
    </div>
  );
}