import { PROFILE_ACCENT_COLORS, PROFILE_BANNERS } from "@shared/profileConstants";

type Props = {
  open: boolean;
  accent: string;
  banner: string | null;
  isOwner: boolean;
  onClose: () => void;
  onAccent: (hex: string) => void;
  onBanner: (path: string | null) => void;
};

export default function AccentPicker({ open, accent, banner, isOwner, onClose, onAccent, onBanner }: Props) {
  if (!open || !isOwner) return null;

  return (
    <div className="pp-accent-pop">
      <div className="pp-accent-pop__head">
        <span className="display pp-accent-pop__title">Theme</span>
        <button type="button" className="pp-accent-pop__done display" onClick={onClose}>Done</button>
      </div>
      <div className="display pp-accent-pop__section">Profile accent</div>
      <div className="pp-accent-pop__swatches">
        {PROFILE_ACCENT_COLORS.map(hex => (
          <button
            key={hex}
            type="button"
            className={`pp-accent-pop__swatch${accent.toUpperCase() === hex ? " is-on" : ""}`}
            style={{ background: hex }}
            aria-label={`Accent ${hex}`}
            onClick={() => onAccent(hex)}
          />
        ))}
      </div>
      <div className="display pp-accent-pop__section">Banner</div>
      <div className="pp-accent-pop__banners">
        {PROFILE_BANNERS.map(b => {
          const on = (banner || null) === b.path;
          return (
            <button
              key={b.key}
              type="button"
              title={b.label}
              className={`pp-accent-pop__banner${on ? " is-on" : ""}`}
              style={b.path
                ? { backgroundImage: `url('${b.path}')` }
                : { background: `radial-gradient(130% 120% at 20% -12%, color-mix(in srgb, ${accent} 60%, transparent), transparent 58%), linear-gradient(160deg, color-mix(in srgb, ${accent} 22%, #0b0b0b), #060606)` }}
              onClick={() => onBanner(b.path)}
            />
          );
        })}
      </div>
    </div>
  );
}