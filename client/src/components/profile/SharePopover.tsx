import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  copied: boolean;
  onClose: () => void;
  onCopy: () => void;
  onMessage?: () => void;
  profileUrl: string;
  displayName: string;
  /** Anchor (Share button wrap) for fixed positioning above page content. */
  anchorRef?: RefObject<HTMLElement | null>;
};

type PopPos = { top: number; left: number };

export default function SharePopover({
  open,
  copied,
  onClose,
  onCopy,
  onMessage,
  profileUrl,
  displayName,
  anchorRef,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<PopPos | null>(null);

  const placePanel = () => {
    const anchor = anchorRef?.current;
    if (!anchor || typeof window === "undefined") return;
    const r = anchor.getBoundingClientRect();
    const width = Math.min(230, window.innerWidth - 24);
    const pad = 12;
    let left = r.left;
    left = Math.max(pad, Math.min(left, window.innerWidth - width - pad));
    // Prefer below the Share button; flip above if clipped
    const spaceBelow = window.innerHeight - r.bottom - pad;
    const preferBelow = spaceBelow >= 140;
    const top = preferBelow ? r.bottom + 8 : Math.max(pad, r.top - 8 - 140);
    setPos({ top, left });
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

  if (!open || typeof document === "undefined" || !pos) return null;

  const igUrl = `https://www.instagram.com/?url=${encodeURIComponent(profileUrl)}`;

  return createPortal(
    <div
      className="pp-share-pop pp-share-pop--portal"
      ref={panelRef}
      style={{ top: pos.top, left: pos.left }}
      role="menu"
      aria-label={`Share ${displayName}`}
    >
      <button
        type="button"
        className="pp-share-pop__item"
        role="menuitem"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onCopy();
        }}
      >
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="var(--neon-cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
        <span>{copied ? "Copied to clipboard" : "Copy link"}</span>
      </button>
      <a className="pp-share-pop__item" href={igUrl} target="_blank" rel="noopener noreferrer" role="menuitem">
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="var(--neon-magenta)" strokeWidth="2" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" />
        </svg>
        Share to Instagram
      </a>
      {onMessage && (
        <button
          type="button"
          className="pp-share-pop__item"
          role="menuitem"
          onClick={() => {
            onClose();
            onMessage();
          }}
        >
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="var(--neon-orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 4h16v13H5.2L4 18.5z" />
          </svg>
          Send in a message
        </button>
      )}
    </div>,
    document.body,
  );
}
