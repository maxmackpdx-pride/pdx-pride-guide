import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
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
  /** Anchor element for fixed positioning (palette button wrap). */
  anchorRef?: RefObject<HTMLElement | null>;
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

type PopPos = { top: number; left: number; maxHeight: number };

export default function AccentPicker({
  open,
  accent,
  banner,
  hasCustomCover = false,
  isOwner,
  onClose,
  onAccent,
  onSolidBanner,
  anchorRef,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [localAccent, setLocalAccent] = useState<string | null>(null);
  const [pos, setPos] = useState<PopPos | null>(null);

  // Keep local selection in sync when parent data updates (or rolls back)
  useEffect(() => {
    setLocalAccent(null);
  }, [accent]);

  const placePanel = () => {
    const anchor = anchorRef?.current;
    if (!anchor || typeof window === "undefined") return;
    const r = anchor.getBoundingClientRect();
    const width = Math.min(300, window.innerWidth - 24);
    const pad = 12;
    // Prefer below the button; flip above if not enough room
    const spaceBelow = window.innerHeight - r.bottom - pad;
    const spaceAbove = r.top - pad;
    const preferBelow = spaceBelow >= 220 || spaceBelow >= spaceAbove;
    const maxHeight = Math.max(180, Math.min(420, preferBelow ? spaceBelow - 8 : spaceAbove - 8));
    let left = r.right - width;
    left = Math.max(pad, Math.min(left, window.innerWidth - width - pad));
    const top = preferBelow ? r.bottom + 8 : Math.max(pad, r.top - maxHeight - 8);
    setPos({ top, left, maxHeight });
  };

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    placePanel();
    const onWin = () => placePanel();
    window.addEventListener("resize", onWin);
    window.addEventListener("scroll", onWin, true);
    return () => {
      window.removeEventListener("resize", onWin);
      window.removeEventListener("scroll", onWin, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- place when open / anchor
  }, [open, anchorRef]);

  // Click outside + Escape to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onPointer = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node | null;
      if (!t) return;
      if (panelRef.current?.contains(t)) return;
      if (anchorRef?.current?.contains(t)) return;
      onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
    };
  }, [open, onClose, anchorRef]);

  if (!open || !isOwner || typeof document === "undefined") return null;

  const activeAccent = (localAccent || accent || "#FF00CC").toUpperCase();
  const solidOn = !hasCustomCover && !banner;

  const pickAccent = (hex: string) => {
    const upper = hex.toUpperCase();
    setLocalAccent(upper);
    onAccent(upper);
  };

  const pickSolid = (hex: string) => {
    const upper = hex.toUpperCase();
    setLocalAccent(upper);
    onSolidBanner(upper);
  };

  const panel = (
    <div
      ref={panelRef}
      className="pp-accent-pop pp-accent-pop--portal"
      role="dialog"
      aria-label="Profile theme"
      style={
        pos
          ? {
              position: "fixed",
              top: pos.top,
              left: pos.left,
              maxHeight: pos.maxHeight,
              width: Math.min(300, typeof window !== "undefined" ? window.innerWidth - 24 : 300),
            }
          : { visibility: "hidden" as const }
      }
    >
      <div className="pp-accent-pop__head">
        <span className="pp-accent-pop__title">Theme</span>
        <button type="button" className="pp-accent-pop__done" onClick={onClose}>
          Done
        </button>
      </div>

      <div className="pp-accent-pop__section">Profile accent</div>
      <div className="pp-accent-pop__swatches" role="group" aria-label="Accent colors">
        {PROFILE_ACCENT_COLORS.map(hex => {
          const on = activeAccent === hex;
          return (
            <button
              key={hex}
              type="button"
              className={`pp-accent-pop__swatch${on ? " is-on" : ""}`}
              style={{ background: hex }}
              aria-label={`Accent ${hex}`}
              aria-pressed={on}
              onClick={() => pickAccent(hex)}
            />
          );
        })}
      </div>

      <div className="pp-accent-pop__section">Banner</div>
      <p className="pp-accent-pop__hint">Solid accent gradients, or upload your own cover.</p>
      <div className="pp-accent-pop__banners" role="group" aria-label="Banner styles">
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
              onClick={() => pickSolid(hex)}
            />
          );
        })}
      </div>

      <Link
        href="/dashboard?edit=profile#cover"
        className="pp-accent-pop__upload"
        onClick={onClose}
      >
        {hasCustomCover ? "Edit cover photo" : "Upload cover photo"}
      </Link>
    </div>
  );

  return createPortal(panel, document.body);
}
