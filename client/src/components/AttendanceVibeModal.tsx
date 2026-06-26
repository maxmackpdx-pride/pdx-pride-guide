import type { ReactNode } from "react";

type AttendanceVibeModalProps = {
  open: boolean;
  isMobile: boolean;
  isPending: boolean;
  hasAttendance: boolean;
  title: string;
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
        <p className="attendance-vibe-modal__lede">Pick a vibe — it shows on your bubble.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          data-testid="form-attendance"
        >
          {children}
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