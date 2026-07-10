import { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  copied: boolean;
  onClose: () => void;
  onCopy: () => void;
  onMessage?: () => void;
  profileUrl: string;
  displayName: string;
};

export default function SharePopover({ open, copied, onClose, onCopy, onMessage, profileUrl, displayName }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, onClose]);

  if (!open) return null;

  const igUrl = `https://www.instagram.com/?url=${encodeURIComponent(profileUrl)}`;

  return (
    <div className="pp-share-pop" ref={ref}>
      <button type="button" className="pp-share-pop__item" onClick={onCopy}>
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="var(--neon-cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
        <span>{copied ? "Copied to clipboard" : "Copy link"}</span>
      </button>
      <a className="pp-share-pop__item" href={igUrl} target="_blank" rel="noopener noreferrer">
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="var(--neon-magenta)" strokeWidth="2" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" />
        </svg>
        Share to Instagram
      </a>
      {onMessage && (
        <button type="button" className="pp-share-pop__item" onClick={() => { onClose(); onMessage(); }}>
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="var(--neon-orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 4h16v13H5.2L4 18.5z" />
          </svg>
          Send in a message
        </button>
      )}
      <span className="sr-only">Share {displayName}</span>
    </div>
  );
}