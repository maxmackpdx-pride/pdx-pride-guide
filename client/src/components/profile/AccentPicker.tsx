import { useEffect, useState, type CSSProperties } from "react";
import { PROFILE_ACCENT_COLORS } from "@shared/profileTheme";
import { Link } from "wouter";

type Props = {
  open: boolean;
  accent: string;
  /** Resolved image path for legacy photo banners; null = solid gradient. */
  banner: string | null;
  /** True when a custom cover photo is active (overrides solid banners). */
  hasCustomCover?: boolean;
  isOwner: boolean;
  onClose: () => void;
  onAccent: (hex: string) => void;
  /** Select solid accent-gradient banner (clears custom cover when needed). */
  onSolidBanner: (hex: string) => void;
};

/** Mini day-flyer swatch: diagonal hatch + accent wash, no text. */
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

export default function AccentPicker({
  open,
  accent,
  banner,
  hasCustomCover = false,
  isOwner,
  onClose,
  onAccent,
  onSolidBanner,
}: Props) {
  const [pending, setPending] = useState<string | null>(null);
  const [localAccent, setLocalAccent] = useState<string | null>(null);

  // Keep local selection in sync when parent data updates (or rolls back)
  useEffect(() => {
    setLocalAccent(null);
  }, [accent]);

  if (!open || !isOwner) return null;

  const activeAccent = (localAccent || accent || "#FF00CC").toUpperCase();
  const solidOn = !hasCustomCover && !banner;

  const pickAccent = (hex: string) => {
    const upper = hex.toUpperCase();
    setLocalAccent(upper);
    setPending(upper);
    onAccent(upper);
    window.setTimeout(() => {
      setPending(cur => (cur === upper ? null : cur));
    }, 600);
  };

  const pickSolid = (hex: string) => {
    const upper = hex.toUpperCase();
    setLocalAccent(upper);
    setPending(upper);
    onSolidBanner(upper);
    window.setTimeout(() => {
      setPending(cur => (cur === upper ? null : cur));
    }, 600);
  };

  return (
    <div className="pp-accent-pop" role="dialog" aria-label="Profile theme">
      <div className="pp-accent-pop__head">
        <span className="display pp-accent-pop__title">Theme</span>
        <button type="button" className="pp-accent-pop__done display" onClick={onClose}>
          Done
        </button>
      </div>

      <div className="display pp-accent-pop__section">Profile accent</div>
      <div className="pp-accent-pop__swatches">
        {PROFILE_ACCENT_COLORS.map(hex => {
          const on = activeAccent === hex;
          const busy = pending === hex;
          return (
            <button
              key={hex}
              type="button"
              className={`pp-accent-pop__swatch${on ? " is-on" : ""}${busy ? " is-pending" : ""}`}
              style={{ background: hex }}
              aria-label={`Accent ${hex}`}
              aria-pressed={on}
              disabled={!!pending && pending !== hex}
              onClick={() => pickAccent(hex)}
            />
          );
        })}
      </div>

      <div className="display pp-accent-pop__section">Banner</div>
      <p className="pp-accent-pop__hint">
        Solid colors match your accent — day-flyer vibe, no text. Or upload your own.
      </p>
      <div className="pp-accent-pop__banners">
        {PROFILE_ACCENT_COLORS.map(hex => {
          const on = solidOn && activeAccent === hex;
          return (
            <button
              key={`banner-${hex}`}
              type="button"
              title={`${hex} gradient`}
              className={`pp-accent-pop__banner${on ? " is-on" : ""}`}
              style={solidBannerStyle(hex)}
              aria-label={`Banner ${hex}`}
              aria-pressed={on}
              disabled={!!pending}
              onClick={() => pickSolid(hex)}
            />
          );
        })}
      </div>

      <Link
        href="/dashboard?edit=profile#cover"
        className="pp-accent-pop__upload display"
        onClick={onClose}
      >
        {hasCustomCover ? "Edit uploaded cover" : "Upload your own"}
      </Link>
    </div>
  );
}
