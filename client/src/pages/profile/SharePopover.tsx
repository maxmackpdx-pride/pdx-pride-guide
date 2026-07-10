import { useState } from "react";

function CopyIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--neon-cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
function InstagramIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--neon-magenta)" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="var(--neon-magenta)" stroke="none" />
    </svg>
  );
}
function MessageIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--neon-orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 4h16v13H5.2L4 18.5z" />
    </svg>
  );
}

export default function SharePopover({
  profileUrl,
  onClose,
  onOpenMessage,
}: {
  profileUrl: string;
  onClose: () => void;
  onOpenMessage?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
    } catch {
      /* clipboard unavailable, still show confirmation for visual feedback */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const shareToInstagram = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ url: profileUrl });
        return;
      } catch (err) {
        if ((err as DOMException)?.name === "AbortError") return;
      }
    }
    window.open("https://instagram.com", "_blank", "noopener");
  };

  return (
    <div className="mp-popover mp-popover--share">
      <button type="button" className="mp-popover__row" onClick={() => void copyLink()}>
        <CopyIcon />
        <span>{copied ? "Copied to clipboard" : "Copy link"}</span>
      </button>
      <button type="button" className="mp-popover__row" onClick={() => void shareToInstagram()}>
        <InstagramIcon />
        <span>Share to Instagram</span>
      </button>
      {onOpenMessage && (
        <button
          type="button"
          className="mp-popover__row"
          onClick={() => {
            onClose();
            onOpenMessage();
          }}
        >
          <MessageIcon />
          <span>Send in a message</span>
        </button>
      )}
    </div>
  );
}
