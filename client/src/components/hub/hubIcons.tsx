import type { ReactNode } from "react";

type IconProps = { size?: number };

function Svg({ children, size = 18 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function HubIconFeed({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </Svg>
  );
}

export function HubIconPost({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </Svg>
  );
}

export function HubIconProfile({ size }: IconProps) {
  return (
    <Svg size={size}>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 20a6.5 6.5 0 0113 0" />
    </Svg>
  );
}

export function HubIconEvents({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M8 3v4" />
      <path d="M16 3v4" />
      <path d="M3.5 9h17" />
      <path d="M4 6h16v14H4z" />
    </Svg>
  );
}

export function HubIconPeople({ size }: IconProps) {
  return (
    <Svg size={size}>
      <circle cx="9" cy="8" r="3" />
      <path d="M2.5 20a6.5 6.5 0 0113 0" />
      <path d="M16 5.5a3 3 0 010 5.8" />
      <path d="M18 20a6.5 6.5 0 00-3-5.5" />
    </Svg>
  );
}

export function HubIconSettings({ size }: IconProps) {
  return (
    <Svg size={size}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 00-.1-1l2-1.6-2-3.4-2.4 1a7 7 0 00-1.7-1l-.4-2.5h-4l-.4 2.5a7 7 0 00-1.7 1l-2.4-1-2 3.4 2 1.6a7 7 0 000 2l-2 1.6 2 3.4 2.4-1a7 7 0 001.7 1l.4 2.5h4l.4-2.5a7 7 0 001.7-1l2.4 1 2-3.4-2-1.6c.07-.33.1-.66.1-1" />
    </Svg>
  );
}

export function HubIconAdmin({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M3 13h8V3H3z" />
      <path d="M13 21h8V11h-8z" />
      <path d="M13 3v6h8V3z" />
      <path d="M3 21h8v-4H3z" />
    </Svg>
  );
}

export function HubIconWerk({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M4 8h16v12H4z" />
      <path d="M9 8V5h6v3" />
      <path d="M4 13h16" />
    </Svg>
  );
}

export function HubIconClaims({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M4 9l1-4h14l1 4" />
      <path d="M5 9v11h14V9" />
      <path d="M4 9h16" />
      <path d="M10 20v-6h4v6" />
    </Svg>
  );
}