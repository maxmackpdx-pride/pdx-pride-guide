import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "./RiverBratsIntroPopup.css";

/** Bump when copy changes so returning visitors see the update once. */
const DISMISS_KEY = "zaylist:river-brats-intro:v1";

/** `?rbIntro=1` force-shows for preview (ignores dismissal). */
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

/**
 * One-time explainer for River Brats when someone hits Nude Beaches.
 * Dismiss = never show again (localStorage). Preview: ?rbIntro=1
 */
export default function RiverBratsIntroPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const forced = forcedPreview();
    if (!forced && alreadyDismissed()) return;
    const t = window.setTimeout(() => setOpen(true), forced ? 0 : 500);
    return () => window.clearTimeout(t);
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

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
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="rbi-backdrop" role="presentation" onClick={dismiss}>
      <div
        className="rbi-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rbi-title"
        onClick={e => e.stopPropagation()}
      >
        <button type="button" className="rbi-x" onClick={dismiss} aria-label="Close">
          ✕
        </button>

        <p className="rbi-kicker">Nude beaches · River Brats</p>
        <h2 id="rbi-title" className="rbi-title display">
          How this works
        </h2>
        <p className="rbi-lede">
          River Brats is the check-in + group chat for people heading to{" "}
          <strong>Rooster Rock</strong> or <strong>Collins Beach</strong>. Weather and logistics
          stay above; this is the social layer.
        </p>

        <ol className="rbi-steps">
          <li>
            <span className="rbi-step-n" aria-hidden>
              1
            </span>
            <div>
              <strong>Check in</strong>
              <span>Say you&apos;re going, up to 7 days ahead. Pick arrive + leave times.</span>
            </div>
          </li>
          <li>
            <span className="rbi-step-n" aria-hidden>
              2
            </span>
            <div>
              <strong>Chat opens immediately</strong>
              <span>
                The moment you check in (with your @username), you join that beach&apos;s group
                chat. No waiting.
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
                Everyone going any day this week shares the same chat. Day chips under names show
                when each person is going.
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
                Check in for more days and your chat access extends until 12 hours after your last
                beach day ends.
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
                You can check in anonymously to count as going without joining the chat. Chat is
                never anonymous.
              </span>
            </div>
          </li>
        </ol>

        <p className="rbi-note">
          Be kind. Keep exact meetups and personal details in DMs. GPS &quot;I&apos;m here&quot; is
          separate from the chat count.
        </p>

        <button
          type="button"
          className="rbi-btn"
          onClick={dismiss}
          data-testid="river-brats-intro-got-it"
        >
          Got it · let&apos;s go
        </button>
        <p className="rbi-foot">You&apos;ll only see this once</p>
      </div>
    </div>,
    document.body,
  );
}
