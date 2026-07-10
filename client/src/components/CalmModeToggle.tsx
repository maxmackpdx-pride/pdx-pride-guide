import { useTheme } from "@/context/ThemeContext";

type CalmModeToggleProps = {
  compact?: boolean;
  /** Header use: switch only, no pill chrome or label */
  minimal?: boolean;
};

export default function CalmModeToggle({
  compact = false,
  minimal = false,
}: CalmModeToggleProps) {
  const { calmMode, toggleCalmMode } = useTheme();

  return (
    <button
      type="button"
      className={`calm-mode-toggle${calmMode ? " calm-mode-toggle--on" : ""}${minimal ? " calm-mode-toggle--minimal" : compact ? " calm-mode-toggle--compact" : ""}`}
      onClick={toggleCalmMode}
      aria-pressed={calmMode}
      aria-label={
        calmMode
          ? "Switch to neon mode"
          : "Switch to calm mode. Turns down the color and the motion. Same guide, quieter."
      }
      title={
        calmMode
          ? "Neon mode"
          : "Turns down the color and the motion. Same guide, quieter."
      }
    >
      <span className="calm-mode-toggle__track" aria-hidden="true">
        <span className="calm-mode-toggle__thumb" />
      </span>
      {minimal ? (
        <span className="calm-mode-toggle__label calm-mode-toggle__label--minimal" aria-hidden="true">
          CALM
        </span>
      ) : (
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
      )}
    </button>
  );
}