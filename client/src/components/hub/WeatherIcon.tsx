import type { WeatherIconKind } from "@/lib/portlandWeather";

type Props = {
  kind: WeatherIconKind;
  className?: string;
  /** Accessible label; decorative if omitted. */
  label?: string;
  size?: number;
};

/**
 * Simple WMO weather glyphs for the hub 7-day strip.
 * Stroke icons - inherit `currentColor`.
 */
export default function WeatherIcon({ kind, className = "", label, size = 22 }: Props) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: `hub-weather-icon hub-weather-icon--${kind} ${className}`.trim(),
    "aria-hidden": label ? undefined : true,
    role: label ? ("img" as const) : undefined,
    "aria-label": label,
  };

  switch (kind) {
    case "clear":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" opacity="0.95" />
          <path d="M12 2v2.2M12 19.8V22M2 12h2.2M19.8 12H22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
        </svg>
      );
    case "mostly-clear":
      return (
        <svg {...common}>
          <circle cx="10" cy="10" r="3.2" fill="currentColor" stroke="none" opacity="0.9" />
          <path d="M10 3.2V4.8M3.2 10H4.8M5.2 5.2l1.1 1.1M5.2 14.8l1.1-1.1" opacity="0.85" />
          <path d="M9 16.5h7.2a3.3 3.3 0 0 0 .3-6.6 4.4 4.4 0 0 0-8.3 1.4A2.8 2.8 0 0 0 9 16.5z" fill="currentColor" fillOpacity="0.22" />
        </svg>
      );
    case "partly-cloudy":
      return (
        <svg {...common}>
          <circle cx="9" cy="9" r="3" fill="currentColor" stroke="none" opacity="0.85" />
          <path d="M8.5 17h8a3.5 3.5 0 0 0 .4-7 4.6 4.6 0 0 0-8.8 1.6A3 3 0 0 0 8.5 17z" fill="currentColor" fillOpacity="0.28" />
        </svg>
      );
    case "overcast":
      return (
        <svg {...common}>
          <path d="M7 17.5h10.5a3.8 3.8 0 0 0 .4-7.5 5 5 0 0 0-9.6 1.7A3.2 3.2 0 0 0 7 17.5z" fill="currentColor" fillOpacity="0.35" />
          <path d="M5.5 14h8.5a2.8 2.8 0 0 0 .2-5.5 3.8 3.8 0 0 0-7.2 1.1A2.5 2.5 0 0 0 5.5 14z" fill="currentColor" fillOpacity="0.22" />
        </svg>
      );
    case "fog":
      return (
        <svg {...common}>
          <path d="M4 9h16M5 12.5h14M6 16h12" opacity="0.9" />
        </svg>
      );
    case "drizzle":
      return (
        <svg {...common}>
          <path d="M7.5 13h9a3.2 3.2 0 0 0 .3-6.3 4.2 4.2 0 0 0-8 1.3A2.7 2.7 0 0 0 7.5 13z" fill="currentColor" fillOpacity="0.28" />
          <path d="M9 15.5v2M12 16v2.5M15 15.5v2" />
        </svg>
      );
    case "rain":
      return (
        <svg {...common}>
          <path d="M7 12.5h10a3.5 3.5 0 0 0 .3-6.9 4.6 4.6 0 0 0-8.8 1.5A3 3 0 0 0 7 12.5z" fill="currentColor" fillOpacity="0.28" />
          <path d="M8.5 15v3.5M12 15.5v4M15.5 15v3.5" />
        </svg>
      );
    case "showers":
      return (
        <svg {...common}>
          <path d="M7 12h10a3.4 3.4 0 0 0 .3-6.7 4.5 4.5 0 0 0-8.6 1.4A2.9 2.9 0 0 0 7 12z" fill="currentColor" fillOpacity="0.28" />
          <path d="M9 14.5l-1 3.5M12.5 15l-1 4M16 14.5l-1 3.5" />
        </svg>
      );
    case "snow":
      return (
        <svg {...common}>
          <path d="M12 4v16M5.5 8l13 8M5.5 16l13-8" />
          <circle cx="12" cy="8" r="1" fill="currentColor" stroke="none" />
          <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "thunder":
      return (
        <svg {...common}>
          <path d="M7 11.5h9.5a3.2 3.2 0 0 0 .3-6.3 4.3 4.3 0 0 0-8.2 1.3A2.7 2.7 0 0 0 7 11.5z" fill="currentColor" fillOpacity="0.25" />
          <path d="M13 11.5 9.5 17h3L11 21.5 16 14h-2.8L14.5 11.5z" fill="currentColor" stroke="none" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" />
        </svg>
      );
  }
}
