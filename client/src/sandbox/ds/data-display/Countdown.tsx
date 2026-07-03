import { useEffect, useState } from "react";
import type { CssVarStyle, DivProps } from "../types";

const ACCENTS: Record<string, string> = {
  lime: "var(--lime)",
  pink: "var(--pink)",
  cyan: "var(--cyan)",
  purple: "var(--purple)",
  amber: "var(--amber)",
};

interface CountdownState {
  d: number;
  h: number;
  m: number;
  s: number;
  done: boolean;
}

function diff(target: string): CountdownState {
  const ms = Math.max(0, new Date(target).getTime() - Date.now());
  return {
    d: Math.floor(ms / 86400000),
    h: Math.floor((ms % 86400000) / 3600000),
    m: Math.floor((ms % 3600000) / 60000),
    s: Math.floor((ms % 60000) / 1000),
    done: ms === 0,
  };
}

export interface CountdownProps extends DivProps {
  target?: string;
  size?: "sm" | "md";
  accent?: "lime" | "pink" | "cyan" | "purple" | "amber" | string;
  doneLabel?: string;
}

export function Countdown({
  target = "2026-07-16T19:00:00",
  size = "md",
  accent = "lime",
  doneLabel = "It's Pride!",
  className = "",
  style,
  ...rest
}: CountdownProps) {
  const [t, setT] = useState<CountdownState>(() => diff(target));

  useEffect(() => {
    const id = setInterval(() => setT(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const accentVar = ACCENTS[accent] || accent;
  const cssStyle: CssVarStyle = { "--_c": accentVar, ...style };

  if (t.done) {
    return (
      <div className={`pdxCountdown ${className}`} style={cssStyle} {...rest}>
        <span className="pdxCountdown__done">{doneLabel}</span>
      </div>
    );
  }

  const pad = (n: number) => String(n).padStart(2, "0");
  const units = [
    { n: t.d, l: "Days" },
    { n: t.h, l: "Hrs" },
    { n: t.m, l: "Min" },
    { n: t.s, l: "Sec" },
  ];

  return (
    <div
      className={`pdxCountdown pdxCountdown--${size} ${className}`}
      role="timer"
      aria-live="off"
      style={cssStyle}
      {...rest}
    >
      {units.map((u, i) => (
        <div className="pdxCountdown__unit" key={u.l}>
          <span className="pdxCountdown__num">{i === 0 ? u.n : pad(u.n)}</span>
          <span className="pdxCountdown__label">{u.l}</span>
        </div>
      ))}
    </div>
  );
}