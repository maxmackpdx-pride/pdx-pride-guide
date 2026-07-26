import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import "./RiverBratsIntroPopup.css";

/** Bump to re-show for everyone after a broken ship. */
const DISMISS_KEY = "zaylist:river-brats-intro:v3";
export const RIVER_BRATS_INTRO_OPEN_EVENT = "zaylist:river-brats-intro:open";

function forcedPreview(): boolean {
  try {
    return new URLSearchParams(window.location.search).get("rbIntro") === "1";
  } catch {
    return false;
  }
}

function alreadyDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function shouldAutoOpen(): boolean {
  if (typeof window === "undefined") return false;
  if (forcedPreview()) return true;
  return !alreadyDismissed();
}

/**
 * One-time River Brats explainer on Nude Beaches.
 * Opens synchronously on first visit (no delayed effect — previous version
 * was easy to miss). Reopen: How it works button or ?rbIntro=1
 */
export default function RiverBratsIntroPopup() {
  // Open on first paint when not dismissed — no useEffect race / cleanup cancel.
  const [open, setOpen] = useState(shouldAutoOpen);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
      // Clear older keys so they don't confuse debugging
      localStorage.removeItem("zaylist:river-brats-intro:v1");
      localStorage.removeItem("zaylist:river-brats-intro:v2");
    } catch {
      /* ignore */
    }
    setOpen(false);
  }, []);

  // Manual reopen from shell button
  useEffect(() => {
    const openNow = () => setOpen(true);
    window.addEventListener(RIVER_BRATS_INTRO_OPEN_EVENT, openNow);
    return () => window.removeEventListener(RIVER_BRATS_INTRO_OPEN_EVENT, openNow);
  }, []);

  // Escape + body scroll lock
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, dismiss]);

  if (!open) return null;

  const node =
    typeof document !== "undefined" && document.body ? document.body : null;
  if (!node) return null;

  // Inline critical layout so the overlay is visible even if CSS chunk is late/cached wrong.
  const backdropStyle: CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 2147483000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    background: "rgba(0,0,0,0.82)",
    boxSizing: "border-box",
  };

  const cardStyle: CSSProperties = {
    position: "relative",
    width: "100%",
    maxWidth: 440,
    maxHeight: "min(92vh, 740px)",
    overflowY: "auto",
    padding: "28px 22px 20px",
    background: "#0b0b0e",
    border: "1px solid #3a3a48",
    borderRadius: 20,
    color: "#fff",
    boxShadow: "0 28px 64px rgba(0,0,0,0.85)",
    boxSizing: "border-box",
  };

  return createPortal(
    <div
      className="rbi-backdrop"
      style={backdropStyle}
      role="presentation"
      data-testid="river-brats-intro-backdrop"
      onClick={dismiss}
    >
      <div
        className="rbi-card"
        style={cardStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rbi-title"
        data-testid="river-brats-intro-dialog"
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          className="rbi-x"
          onClick={dismiss}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 32,
            height: 32,
            border: "none",
            borderRadius: 8,
            background: "rgba(255,255,255,0.08)",
            color: "#ccc",
            cursor: "pointer",
          }}
        >
          ✕
        </button>

        <p className="rbi-kicker">Nude beaches · River Brats</p>
        <h2 id="rbi-title" className="rbi-title display">
          How River Brats works
        </h2>
        <p className="rbi-lede">
          Check-in + group chat for people heading to <strong>Rooster Rock</strong> or{" "}
          <strong>Collins Beach</strong>. Weather stays above; this is the social layer.
        </p>

        <ol className="rbi-steps">
          <li>
            <span className="rbi-step-n" aria-hidden>
              1
            </span>
            <div>
              <strong>Check in</strong>
              <span>Say you&apos;re going (up to 7 days ahead). Pick arrive + leave times.</span>
            </div>
          </li>
          <li>
            <span className="rbi-step-n" aria-hidden>
              2
            </span>
            <div>
              <strong>Chat opens immediately</strong>
              <span>
                Check in with your @username and you&apos;re in that beach&apos;s group chat right
                away.
              </span>
            </div>
          </li>
          <li>
            <span className="rbi-step-n" aria-hidden>
              3
            </span>
            <div>
              <strong>One room per beach</strong>
              <span>
                Everyone going any day this week shares one chat. Day chips under names show when
                each person is going.
              </span>
            </div>
          </li>
          <li>
            <span className="rbi-step-n" aria-hidden>
              4
            </span>
            <div>
              <strong>Multi-day keeps you in</strong>
              <span>
                Extra days extend access until 12 hours after your last beach day ends.
              </span>
            </div>
          </li>
          <li>
            <span className="rbi-step-n" aria-hidden>
              5
            </span>
            <div>
              <strong>Anonymous option</strong>
              <span>
                Anonymous check-in counts you as going but stays out of chat. Chat is never
                anonymous.
              </span>
            </div>
          </li>
        </ol>

        <p className="rbi-note">
          Be kind. Exact meetups and personal details stay in DMs. GPS &quot;I&apos;m here&quot; is
          separate from the chat.
        </p>

        <button
          type="button"
          className="rbi-btn"
          onClick={dismiss}
          data-testid="river-brats-intro-got-it"
        >
          Got it · let&apos;s go
        </button>
        <p className="rbi-foot">One-time · reopen with How it works under the title</p>
      </div>
    </div>,
    node,
  );
}

export function openRiverBratsIntro() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(RIVER_BRATS_INTRO_OPEN_EVENT));
}
