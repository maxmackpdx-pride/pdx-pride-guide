import type { ReactNode } from "react";

/** Client mirror of shared AttendanceVisibility (+ legacy "visible" accepted server-side). */
export type AttendanceVisibility = "public" | "friends" | "anonymous";

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

const VISIBILITY_OPTIONS: Array<{
  value: AttendanceVisibility;
  label: string;
  hint: string;
  testId: string;
}> = [
  {
    value: "public",
    label: "Public (@username)",
    hint: "Others going can see who you are",
    testId: "attendance-visibility-public",
  },
  {
    value: "friends",
    label: "Friends only",
    hint: "People you follow / who follow you see your name",
    testId: "attendance-visibility-friends",
  },
  {
    value: "anonymous",
    label: "Anonymous",
    hint: "Vibe only - no name or photo on the grid",
    testId: "attendance-visibility-anonymous",
  },
];

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
              {VISIBILITY_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`attendance-visibility__option${
                    visibility === opt.value ? " attendance-visibility__option--active" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="attendance-visibility"
                    value={opt.value}
                    checked={visibility === opt.value}
                    onChange={() => onVisibilityChange(opt.value)}
                    data-testid={opt.testId}
                  />
                  <span className="attendance-visibility__label">{opt.label}</span>
                  <span className="attendance-visibility__hint">{opt.hint}</span>
                </label>
              ))}
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
