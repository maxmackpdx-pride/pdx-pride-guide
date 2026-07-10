import { useState } from "react";
import { Marquee } from "@/components/ds";
import type { ProfileMarquee as MarqueeData, PublicProfile } from "./types";

const DEFAULT_ITEMS = [
  "Pride is a protest",
  "Take care of each other",
  "Keep Portland weird",
];

type Props = {
  profile: PublicProfile;
  onSave?: (next: MarqueeData) => Promise<void> | void;
};

export default function ProfileMarquee({ profile, onSave }: Props) {
  const isPromoter = !!(profile.isPromoter || profile.verifiedHost);
  const initial = profile.marquee?.items?.length
    ? profile.marquee
    : { items: DEFAULT_ITEMS, speed: 30, color: "rainbow" };

  const [editOpen, setEditOpen] = useState(false);
  const [text, setText] = useState(initial.items.join(", "));
  const [speed, setSpeed] = useState(initial.speed ?? 30);
  const [color, setColor] = useState(initial.color ?? "rainbow");
  const [saving, setSaving] = useState(false);

  const items = text
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  const marqueeColor =
    color === "rainbow"
      ? "rainbow"
      : color === "cyan"
        ? "cyan"
        : color === "lime" || color === "yellow"
          ? "lime"
          : "pink";

  // Map speed 12-60 (higher = faster design) to Marquee duration (higher = slower)
  const duration = Math.max(12, Math.min(60, 72 - (speed || 30)));

  const save = async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave({ items: items.length ? items : DEFAULT_ITEMS, speed, color });
      setEditOpen(false);
    } finally {
      setSaving(false);
    }
  };

  if (!isPromoter && !(profile.marquee?.items?.length)) return null;

  return (
    <div className="profile-marquee-wrap">
      <Marquee items={items.length ? items : DEFAULT_ITEMS} color={marqueeColor as any} speed={duration} />
      {profile.isOwner && onSave && (
        <button type="button" className="profile-marquee__edit" onClick={() => setEditOpen(o => !o)}>
          Edit
        </button>
      )}
      {editOpen && profile.isOwner && (
        <div className="profile-marquee__panel">
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", fontSize: 13 }}>
            Marquee
          </div>
          <label htmlFor="profile-marquee-text">Items (comma separated)</label>
          <input
            id="profile-marquee-text"
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
          />
          <label htmlFor="profile-marquee-speed">Speed</label>
          <input
            id="profile-marquee-speed"
            type="range"
            min={12}
            max={60}
            step={2}
            value={speed}
            onChange={e => setSpeed(Number(e.target.value))}
          />
          <label>Color</label>
          <div className="profile-chips">
            {["rainbow", "pink", "cyan", "yellow"].map(c => (
              <button
                key={c}
                type="button"
                className="profile-talent"
                style={{
                  borderColor: color === c ? "var(--profile-accent)" : "#333",
                  color: color === c ? "var(--profile-accent-text)" : "#fff",
                }}
                onClick={() => setColor(c)}
              >
                {c}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button type="button" className="profile-btn profile-btn--primary" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
            <button type="button" className="profile-btn profile-btn--ghost" onClick={() => setEditOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
