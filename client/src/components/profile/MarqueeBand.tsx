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

const DEFAULT_ITEMS = ["Pride Weekend", "Take care of each other", "Portland"];

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
          <button type="button" className="pp-marquee-edit display" onClick={() => setEditOpen(v => !v)}>
            Edit ticker
          </button>
          {editOpen && (
            <div className="pp-marquee-pop">
              <label className="pp-marquee-pop__label display">
                Ticker text
                <textarea
                  value={draftText}
                  onChange={e => setDraftText(e.target.value)}
                  rows={3}
                  placeholder="Comma-separated items"
                />
              </label>
              <label className="pp-marquee-pop__label display">
                Speed ({draftSpeed}s)
                <input type="range" min={8} max={60} value={draftSpeed} onChange={e => setDraftSpeed(Number(e.target.value))} />
              </label>
              <div className="pp-marquee-pop__colors">
                {MARQUEE_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`pp-marquee-pop__color${draftColor === c ? " is-on" : ""}`}
                    style={{ background: c === "rainbow" ? "var(--grad-rainbow)" : `var(--${c})` }}
                    onClick={() => setDraftColor(c)}
                    aria-label={`Marquee color ${c}`}
                  />
                ))}
              </div>
              <button
                type="button"
                className="pp-btn pp-btn--follow"
                onClick={() => persist({
                  items: draftText.split(",").map(s => s.trim()).filter(Boolean).slice(0, 12),
                  speed: draftSpeed,
                  color: draftColor,
                })}
              >
                Save ticker
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}