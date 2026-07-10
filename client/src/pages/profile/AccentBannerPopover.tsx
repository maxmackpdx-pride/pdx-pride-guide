import { useState } from "react";
import { PROFILE_ACCENT_COLORS, PROFILE_BANNERS, type ProfileBanner } from "@shared/profileTheme";

const BANNER_LABELS: Record<ProfileBanner, string> = {
  "accent-gradient": "Accent color",
  "neon-collage": "Neon collage",
  "sticker-wall": "Sticker wall",
  "pride-guide-social": "Pride Guide",
};

export default function AccentBannerPopover({
  accentColor,
  banner,
  onClose,
  onSave,
}: {
  accentColor: string | null | undefined;
  banner: ProfileBanner | undefined;
  onClose: () => void;
  onSave: (patch: { accentColor?: string; banner?: ProfileBanner }) => void;
}) {
  const [saving, setSaving] = useState(false);
  const currentAccent = (accentColor || "#FF00CC").toUpperCase();
  const currentBanner = banner || "accent-gradient";

  const pickAccent = async (hex: string) => {
    setSaving(true);
    await onSave({ accentColor: hex });
    setSaving(false);
  };
  const pickBanner = async (b: ProfileBanner) => {
    setSaving(true);
    await onSave({ banner: b });
    setSaving(false);
  };

  return (
    <div className="mp-popover mp-popover--accent">
      <div className="mp-popover__head">
        <span className="mp-popover__title">Theme</span>
        <button type="button" className="mp-popover__done" onClick={onClose}>Done</button>
      </div>

      <div className="mp-popover__label">Profile accent</div>
      <div className="mp-swatch-row" style={{ marginBottom: 14 }}>
        {PROFILE_ACCENT_COLORS.map(hex => (
          <button
            key={hex}
            type="button"
            className={`mp-swatch${currentAccent === hex ? " mp-swatch--on" : ""}`}
            style={{ background: hex }}
            aria-label={hex}
            disabled={saving}
            onClick={() => void pickAccent(hex)}
          />
        ))}
      </div>

      <div className="mp-popover__label">Banner</div>
      <div className="mp-banner-row">
        {PROFILE_BANNERS.map(b => (
          <button
            key={b}
            type="button"
            className={`mp-banner-swatch mp-banner-swatch--${b}${currentBanner === b ? " mp-banner-swatch--on" : ""}`}
            title={BANNER_LABELS[b]}
            disabled={saving}
            onClick={() => void pickBanner(b)}
          />
        ))}
      </div>
    </div>
  );
}
