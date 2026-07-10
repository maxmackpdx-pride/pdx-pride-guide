import { useState } from "react";
import { Marquee } from "@/components/ds";
import MarqueeEditPopover from "./MarqueeEditPopover";
import type { ProfileMarquee as ProfileMarqueeData } from "./types";

const DEFAULT_MARQUEE: ProfileMarqueeData = {
  items: ["Made by the scene", "Take care of each other"],
  speed: 30,
  color: "rainbow",
};

export default function ProfileMarquee({
  marquee,
  isOwner,
  onSave,
}: {
  marquee: ProfileMarqueeData | null | undefined;
  isOwner: boolean;
  onSave: (next: ProfileMarqueeData) => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const current = marquee && marquee.items.length > 0 ? marquee : DEFAULT_MARQUEE;

  if (!marquee && !isOwner) return null;

  return (
    <div className="mp-marquee-wrap">
      <Marquee items={current.items} color={current.color} speed={current.speed} className="mp-marquee" />
      {isOwner && (
        <button type="button" className="mp-marquee-edit-btn" onClick={() => setEditOpen(v => !v)} aria-label="Edit marquee">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
          </svg>
          Edit
        </button>
      )}
      {isOwner && editOpen && (
        <MarqueeEditPopover
          marquee={current}
          onClose={() => setEditOpen(false)}
          onSave={next => onSave(next)}
        />
      )}
    </div>
  );
}
