import type { ReactNode } from "react";

export type AttendanceVisibility = "anonymous" | "visible";

type AttendanceVibeModalProps = {
  open: boolean;
  isMobile: boolean;
  isPending: boolean;
  hasAttendance: boolean;
  title: string;
  visibility: AttendanceVisibility;
  onVisibilityChange: (value: AttendanceVisibility) => void;
  onClose: () => void;
  onSubmit: () => void;
  onRemove?: () => void;
  children: ReactNode;
};

export default function AttendanceVibeModal({
  open,
  isMobile,
  isPending,
  hasAttendance,
  title,
  visibility,
  onVisibilityChange,
  onClose,
  onSubmit,
  onRemove,
  children,
}: AttendanceVibeModalProps) {
  if (!open) return null;

  return (
    <>
      <div
        className="attendance-vibe-backdrop"
        onClick={onClose}
        data-testid="attendance-vibe-backdrop"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="attendance-vibe-title"
        data-testid="attendance-vibe-modal"
        className={`attendance-vibe-modal${isMobile ? " attendance-vibe-modal--sheet" : ""}`}
      >
        <div className="attendance-vibe-modal__head">
          <h3 id="attendance-vibe-title" className="display attendance-vibe-modal__title">
            {title}
          </h3>
          <button
            type="button"
            className="attendance-vibe-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <p className="attendance-vibe-modal__lede">Pick a vibe, then choose how you show up. Event chat stays open for 8 hours.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          data-testid="form-attendance"
        >
          {children}
          <fieldset className="attendance-visibility">
            <legend className="attendance-visibility__legend">Show as</legend>
            <div className="attendance-visibility__options">
              <label className={`attendance-visibility__option${visibility === "visible" ? " attendance-visibility__option--active" : ""}`}>
                <input
                  type="radio"
                  name="attendance-visibility"
                  value="visible"
                  checked={visibility === "visible"}
                  onChange={() => onVisibilityChange("visible")}
                  data-testid="attendance-visibility-visible"
                />
                <span className="attendance-visibility__label">@username visible</span>
                <span className="attendance-visibility__hint">Others going can see who you are</span>
              </label>
              <label className={`attendance-visibility__option${visibility === "anonymous" ? " attendance-visibility__option--active" : ""}`}>
                <input
                  type="radio"
                  name="attendance-visibility"
                  value="anonymous"
                  checked={visibility === "anonymous"}
                  onChange={() => onVisibilityChange("anonymous")}
                  data-testid="attendance-visibility-anonymous"
                />
                <span className="attendance-visibility__label">Stay anonymous</span>
                <span className="attendance-visibility__hint">Vibe only - no name or photo on the grid</span>
              </label>
            </div>
          </fieldset>
          <div className="attendance-vibe-modal__actions">
            <button
              type="submit"
              data-testid="button-submit-attendance"
              disabled={isPending}
              className="display attendance-vibe-modal__submit"
            >
              {isPending ? "SAVING..." : hasAttendance ? "UPDATE VIBE" : "I'LL BE THERE"}
            </button>
            {hasAttendance && onRemove && (
              <button type="button" className="attendance-vibe-modal__remove" onClick={onRemove}>
                REMOVE ME
              </button>
            )}
            <button type="button" className="attendance-vibe-modal__cancel" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
}