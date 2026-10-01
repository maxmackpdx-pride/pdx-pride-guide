import { type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useOpenCardClose } from "@/hooks/useOpenCardClose";
import "./OpenBoardCard.css";

type Props = {
  label: string;
  accent: string;
  onClose: () => void;
  children: ReactNode | ((requestClose: () => void) => ReactNode);
};

/** ReZources' open-card motion and edge, around each board's own expanded card. */
export default function OpenBoardCard({ label, accent, onClose, children }: Props) {
  const { dialogRef, requestClose } = useOpenCardClose(onClose);

  return createPortal(
    <div className="board-detail-backdrop board-open-backdrop" onClick={requestClose}>
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className="board-open-card pdx-glass-rebind"
        style={{ "--c": accent, "--listing-accent": accent } as CSSProperties}
        onClick={event => event.stopPropagation()}
      >
        <button type="button" className="board-open-card__close" onClick={requestClose} aria-label={`Close ${label}`}><X size={18} /></button>
        {typeof children === "function" ? children(requestClose) : children}
      </section>
    </div>,
    document.body,
  );
}
