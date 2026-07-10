import { useState } from "react";
import type { ProfileMarquee } from "./types";

const MARQUEE_COLORS = ["rainbow", "pink", "cyan", "lime", "orange", "purple", "green"];

export default function MarqueeEditPopover({
  marquee,
  onClose,
  onSave,
}: {
  marquee: ProfileMarquee;
  onClose: () => void;
  onSave: (next: ProfileMarquee) => void;
}) {
  const [text, setText] = useState(marquee.items.join(", "));
  const [speed, setSpeed] = useState(marquee.speed);
  const [color, setColor] = useState(marquee.color);

  const commit = (next: Partial<ProfileMarquee>) => {
    const merged = {
      items: next.items ?? text.split(",").map(x => x.trim()).filter(Boolean),
      speed: next.speed ?? speed,
      color: next.color ?? color,
    };
    onSave(merged);
  };

  return (
    <div className="mp-popover mp-popover--marquee">
      <div className="mp-popover__head">
        <span className="mp-popover__title">Edit marquee</span>
        <button type="button" className="mp-popover__done" onClick={onClose}>Done</button>
      </div>

      <label className="mp-popover__label" htmlFor="mp-marquee-text">Text (comma separated)</label>
      <input
        id="mp-marquee-text"
        type="text"
        value={text}
        onChange={e => setText(e.target.value)}
        onBlur={() => commit({ items: text.split(",").map(x => x.trim()).filter(Boolean) })}
        className="mp-popover__input"
      />

      <label className="mp-popover__label mp-popover__label--row" htmlFor="mp-marquee-speed">
        <span>Speed</span>
        <span className="mp-popover__label-faint">Faster to slower</span>
      </label>
      <input
        id="mp-marquee-speed"
        type="range"
        min={12}
        max={60}
        step={2}
        value={speed}
        onChange={e => {
          const v = Number(e.target.value);
          setSpeed(v);
          commit({ speed: v });
        }}
        className="mp-popover__range"
      />

      <div className="mp-popover__label">Colors</div>
      <div className="mp-swatch-row">
        {MARQUEE_COLORS.map(c => (
          <button
            key={c}
            type="button"
            className={`mp-marquee-swatch mp-marquee-swatch--${c}${color === c ? " mp-marquee-swatch--on" : ""}`}
            aria-label={c}
            title={c}
            onClick={() => { setColor(c); commit({ color: c }); }}
          />
        ))}
      </div>
    </div>
  );
}
