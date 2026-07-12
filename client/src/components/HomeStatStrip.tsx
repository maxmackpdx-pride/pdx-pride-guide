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
  return Math.max(0, new Date(target).getTime() - Date.now());
}

/** Three-column stat band: kickoff countdown, directory places, RSVPs going. */
export default function HomeStatStrip({ placesCount, goingCount, countdownTarget }: Props) {
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
          {live ? (
            <span>Live</span>
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
        <div className="home-stat-strip__label">{live ? "Pride Week" : "Kickoff in"}</div>
      </div>
      <div className="home-stat-strip__cell">
        <div className="home-stat-strip__value home-stat-strip__value--lime">{placesCount}</div>
        <div className="home-stat-strip__label">Queer places to back</div>
      </div>
      <div className="home-stat-strip__cell home-stat-strip__cell--last">
        <div className="home-stat-strip__value home-stat-strip__value--orange">{goingCount}</div>
        <div className="home-stat-strip__label">Going to events</div>
      </div>
    </div>
  );
}