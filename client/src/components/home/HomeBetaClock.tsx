import { useEffect, useState } from "react";

const portlandTime = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Los_Angeles",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export default function HomeBetaClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer = 0;
    const update = () => {
      window.clearTimeout(timer);
      if (document.hidden) return;
      setNow(new Date());
      timer = window.setTimeout(update, 60_000 - Date.now() % 60_000);
    };
    update();
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  const parts = portlandTime.formatToParts(now);
  const hour = Number(parts.find(part => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find(part => part.type === "minute")?.value ?? 0);
  const label = `Zaylist beta. Portland time ${portlandTime.format(now)}.`;

  return (
    <div className="home-front__beta" role="img" aria-label={label} title={label}>
      <svg className="home-front__beta-clock" viewBox="0 0 48 48" aria-hidden="true">
        <circle className="home-front__beta-clock-face" cx="24" cy="24" r="21" />
        <path className="home-front__beta-clock-rim" d="M24 3a21 21 0 0 1 21 21" />
        <g className="home-front__beta-clock-ticks">
          {Array.from({ length: 12 }, (_, index) => (
            <path key={index} d={index % 3 === 0 ? "M24 7v4" : "M24 7v2"} transform={`rotate(${index * 30} 24 24)`} />
          ))}
        </g>
        <path className="home-front__beta-clock-hour" d="M24 25V15" transform={`rotate(${hour % 12 * 30 + minute / 2} 24 24)`} />
        <path className="home-front__beta-clock-minute" d="M24 27V11" transform={`rotate(${minute * 6} 24 24)`} />
        <circle className="home-front__beta-clock-pin" cx="24" cy="24" r="2" />
      </svg>
      <span aria-hidden="true">BETA</span>
    </div>
  );
}
