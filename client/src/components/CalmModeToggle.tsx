import { useTheme } from "@/context/ThemeContext";

type CalmModeToggleProps = {
  compact?: boolean;
};

export default function CalmModeToggle({ compact = false }: CalmModeToggleProps) {
  const { calmMode, toggleCalmMode } = useTheme();

  return (
    <button
      type="button"
      className={`calm-mode-toggle${calmMode ? " calm-mode-toggle--on" : ""}${compact ? " calm-mode-toggle--compact" : ""}`}
      onClick={toggleCalmMode}
      aria-pressed={calmMode}
      aria-label={
        calmMode
          ? "Switch to neon mode"
          : "Switch to calm mode — high contrast, easier to read"
      }
    >
      <span className="calm-mode-toggle__track" aria-hidden="true">
        <span className="calm-mode-toggle__thumb" />
      </span>
      <span className="calm-mode-toggle__copy">
        <span className="calm-mode-toggle__label">
          {calmMode ? "Neon" : "Calm"}
        </span>
        {!compact && (
          <span className="calm-mode-toggle__hint">
            {calmMode ? "full color" : "easier to read"}
          </span>
        )}
      </span>
    </button>
  );
}