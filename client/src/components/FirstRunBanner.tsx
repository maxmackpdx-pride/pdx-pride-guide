import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { modalDialogOpen } from "@/lib/firstRunBanner";
import "./FirstRunBanner.css";

/**
 * Compact, non-modal bottom banner for first-run messages. No scrim, no focus trap, no inert page: the page behind
 * stays fully usable. Dismiss with the X, the secondary button, Escape, or a swipe-down touch on the banner.
 */
export default function FirstRunBanner({ id, titleId, kicker, title, onDismiss, children, actions }: {
  id: string; titleId: string; kicker: string; title: string; onDismiss: () => void; children: ReactNode; actions: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const touchY = useRef<number | null>(null);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented || modalDialogOpen()) return;
      onDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDismiss]);
  return (
    <section
      ref={ref}
      id={id}
      className="zfr-banner"
      role="region"
      aria-labelledby={titleId}
      onTouchStart={event => { touchY.current = event.touches[0]?.clientY ?? null; }}
      onTouchEnd={event => {
        const start = touchY.current; touchY.current = null;
        if (start != null && (event.changedTouches[0]?.clientY ?? start) - start > 48) onDismiss();
      }}
    >
      <button type="button" className="zfr-x" onClick={onDismiss} aria-label="Dismiss"><X size={16} aria-hidden="true" /></button>
      <p className="zfr-kicker">{kicker}</p>
      <h2 id={titleId} className="zfr-title display">{title}</h2>
      <div className="zfr-body">{children}</div>
      <div className="zfr-actions">{actions}</div>
    </section>
  );
}
