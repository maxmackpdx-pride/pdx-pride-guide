import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTipLinks } from "@/hooks/useTipLinks";
import "./HomeConstructionNudge.css";

const DISMISS_KEY = "pgpdx:construction-nudge:v1";

/** `?constructNudge=1` force-shows the pop-up for previewing (ignores dismissal). */
function forcedPreview(): boolean {
  try {
    return new URLSearchParams(window.location.search).get("constructNudge") === "1";
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
 * Friendly "under construction" pop-up for the home screen. Tells visitors the
 * Pride guide is growing into a year-round Portland LGBTQ+ events home, thanks
 * them, and invites an optional tip. Shows on every visit until the visitor
 * dismisses it (localStorage), then stays hidden.
 */
export default function HomeConstructionNudge() {
  const { venmoUrl } = useTipLinks();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const forced = forcedPreview();
    if (!forced && alreadyDismissed()) return;
    const t = window.setTimeout(() => setOpen(true), forced ? 0 : 650);
    return () => window.clearTimeout(t);
  }, []);

  // Dismiss = remember it so it never nags again.
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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="pgc-backdrop" role="presentation" onClick={dismiss}>
      <div
        className="pgc-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pgc-title"
        onClick={e => e.stopPropagation()}
      >
        <button type="button" className="pgc-x" onClick={dismiss} aria-label="Close">
          ✕
        </button>

        <div className="pgc-emoji" aria-hidden="true">🚧</div>
        <p className="pgc-kicker">Under construction</p>
        <h2 id="pgc-title" className="pgc-title display">
          Something bigger is coming
        </h2>

        <div className="pgc-body">
          <p>
            Thanks for using the PDX Pride Guide this year — we hope it helped you find your
            people and your parties. 🌈
          </p>
          <p>
            We're rebuilding it into a <strong>year-round</strong> home for Portland's LGBTQ+
            events — all 365 days, not just Pride Week. Pardon our dust while we make it better.
          </p>
          <p className="pgc-tip">
            Keeping the lights on isn't free. If this was useful, you're welcome to toss a couple
            bucks toward a coffee or a muffin. Truly no pressure — every little bit helps. 💛
          </p>
        </div>

        <div className="pgc-actions">
          <a
            className="pgc-btn pgc-btn--primary"
            href={venmoUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="construction-buy-coffee-venmo"
            onClick={dismiss}
          >
            ☕ Buy me a coffee
          </a>
          <button type="button" className="pgc-btn pgc-btn--ghost" onClick={dismiss}>
            Maybe later
          </button>
        </div>

        <p className="pgc-foot">Made with 🖤 in Portland</p>
      </div>
    </div>,
    document.body,
  );
}
