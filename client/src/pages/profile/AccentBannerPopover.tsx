import { useState, type CSSProperties } from "react";
import { PROFILE_ACCENT_COLORS, type ProfileBanner } from "@shared/profileTheme";
import { Link } from "wouter";

function solidBannerStyle(hex: string): CSSProperties {
  return {
    background: [
      `radial-gradient(ellipse 55% 70% at 50% 48%, color-mix(in srgb, ${hex} 18%, transparent), transparent 72%)`,
      `repeating-linear-gradient(-45deg, transparent, transparent 5px, color-mix(in srgb, ${hex} 22%, transparent) 5px, color-mix(in srgb, ${hex} 22%, transparent) 6px)`,
      `radial-gradient(120% 110% at 15% -10%, color-mix(in srgb, ${hex} 55%, transparent), transparent 58%)`,
      `linear-gradient(160deg, color-mix(in srgb, ${hex} 28%, #0b0b0b), #060300 85%)`,
    ].join(", "),
  };
}

export default function AccentBannerPopover({
  accentColor,
  banner,
  onClose,
  onSave,
}: {
  accentColor: string | null | undefined;
  banner: ProfileBanner | undefined;
  onClose: () => void;
  onSave: (patch: { accentColor?: string; banner?: ProfileBanner; coverImageUrl?: null; coverCrop?: null }) => void;
}) {
  const [saving, setSaving] = useState(false);
  const currentAccent = (accentColor || "#FF00CC").toUpperCase();
  const currentBanner = banner || "accent-gradient";
  const solidOn = currentBanner === "accent-gradient";

  const pickAccent = async (hex: string) => {
    setSaving(true);
    await onSave({ accentColor: hex });
    setSaving(false);
  };
  const pickSolid = async (hex: string) => {
    setSaving(true);
    await onSave({
      accentColor: hex,
      banner: "accent-gradient",
      coverImageUrl: null,
      coverCrop: null,
    });
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
        {PROFILE_ACCENT_COLORS.map(hex => (
          <button
            key={`b-${hex}`}
            type="button"
            className={`mp-banner-swatch${solidOn && currentAccent === hex ? " mp-banner-swatch--on" : ""}`}
            style={solidBannerStyle(hex)}
            title={`${hex} gradient`}
            disabled={saving}
            onClick={() => void pickSolid(hex)}
          />
        ))}
      </div>

      <Link href="/dashboard?edit=profile#cover" className="mp-popover__upload" onClick={onClose}>
        Upload your own
      </Link>
    </div>
  );
}
