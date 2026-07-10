import { useState } from "react";
import { Marquee } from "@/components/ds";
import { MARQUEE_COLORS } from "@shared/profileConstants";
import type { ProfileMarquee } from "./types";

type Props = {
  marquee: ProfileMarquee;
  isOwner: boolean;
  isPromoter: boolean;
  onSave: (marquee: ProfileMarquee) => void;
};

const DEFAULT_ITEMS = ["Techno", "Disco", "Drag", "Est. 2019", "Made by the scene", "Take care of each other"];

export default function MarqueeBand({ marquee, isOwner, isPromoter, onSave }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [draftText, setDraftText] = useState(marquee.items.join(", "));
  const [draftSpeed, setDraftSpeed] = useState(marquee.speed);
  const [draftColor, setDraftColor] = useState(marquee.color);

  if (!isPromoter) return null;

  const items = marquee.items.length ? marquee.items : DEFAULT_ITEMS;

  const persist = (next: ProfileMarquee) => {
    onSave(next);
    setEditOpen(false);
  };

  return (
    <div className="pp-marquee-wrap">
      <Marquee items={items} color={marquee.color as any} speed={marquee.speed} className="pp-marquee" />
      {isOwner && (
        <>
          <button type="button" className="pp-marquee-edit display" onClick={() => setEditOpen(v => !v)} aria-label="Edit marquee">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
            </svg>
            Edit
          </button>
          {editOpen && (
            <div className="pp-marquee-pop">
              <div className="pp-marquee-pop__head">
                <span className="display pp-marquee-pop__title">Edit marquee</span>
                <button
                  type="button"
                  className="pp-marquee-pop__done display"
                  onClick={() => persist({
                    items: draftText.split(",").map(s => s.trim()).filter(Boolean).slice(0, 12),
                    speed: draftSpeed,
                    color: draftColor,
                  })}
                >
                  Done
                </button>
              </div>
              <label className="pp-marquee-pop__label display">
                Text (comma separated)
                <input
                  type="text"
                  value={draftText}
                  onChange={e => setDraftText(e.target.value)}
                  placeholder="Techno, Disco, Drag"
                />
              </label>
              <label className="pp-marquee-pop__label display">
                <span>Speed</span>
                <span className="pp-marquee-pop__hint">Faster to slower</span>
                <input type="range" min={12} max={60} step={2} value={draftSpeed} onChange={e => setDraftSpeed(Number(e.target.value))} />
              </label>
              <div className="display pp-marquee-pop__colors-label">Colors</div>
              <div className="pp-marquee-pop__colors">
                {MARQUEE_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`pp-marquee-pop__color${draftColor === c ? " is-on" : ""}`}
                    style={{ background: c === "rainbow" ? "var(--grad-rainbow)" : `var(--${c})` }}
                    onClick={() => setDraftColor(c)}
                    aria-label={`Marquee color ${c}`}
                    title={c}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}