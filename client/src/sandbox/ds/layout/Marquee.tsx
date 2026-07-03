import type { CSSProperties, HTMLAttributes } from "react";

export interface MarqueeProps extends HTMLAttributes<HTMLDivElement> {
  items?: string[];
  color?: "pink" | "cyan" | "purple" | "lime" | "amber" | "rainbow" | string;
  separator?: string;
  speed?: number;
}

export function Marquee({
  items = ["Pride Weekend", "July 16 to 19", "Keep Portland Weird", "Take Care of Each Other"],
  color = "pink",
  separator = "✦",
  speed = 26,
  className = "",
  ...rest
}: MarqueeProps) {
  const loop = [...items, ...items];
  const isRainbow = color === "rainbow";

  const style = {
    "--_bg": isRainbow ? undefined : `var(--${color})`,
    "--_dur": `${speed}s`,
  } as CSSProperties;

  return (
    <div
      className={`pdxMarquee ${isRainbow ? "pdxMarquee--rainbow" : ""} ${className}`.trim()}
      style={style}
      {...rest}
    >
      <div className="pdxMarquee__track">
        {loop.map((it, i) => (
          <span className="pdxMarquee__item" key={`${it}-${i}`}>
            {it}
            <span className="pdxMarquee__star" aria-hidden="true">
              {separator}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}