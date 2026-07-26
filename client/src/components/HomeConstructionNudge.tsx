import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTipLinks } from "@/hooks/useTipLinks";
import "./HomeConstructionNudge.css";

// Bump when the rebrand welcome copy or CTA order changes so returning visitors see the update once.
const DISMISS_KEY = "pgpdx:construction-nudge:v3-zaylist";

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
 * Welcome pop-up for the rebrand: thanks visitors for Pride Guide years,
 * introduces Zaylist, and invites an optional tip. Shows until dismissed
 * (localStorage). Preview: ?constructNudge=1
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

        <img
          className="pgc-app-icon"
          src="/icons/zaylist-192.png"
          alt=""
          width={72}
          height={72}
          decoding="async"
        />
        <p className="pgc-kicker">Same home · new name</p>
        <h2 id="pgc-title" className="pgc-title display">
          Welcome to Zaylist
        </h2>

        <div className="pgc-body">
          <p>
            Thanks for using <strong>Pride Guide</strong> these past years. I hope it helped
            you find your people and your parties. 🌈
          </p>
          <p>
            I&apos;m renaming it <strong>Zaylist</strong>: same home, new name. Year-round
            for Portland&apos;s LGBTQ+ community: events, boards, directory, and more, all
            365 days, not just Pride Week.
          </p>
          <p className="pgc-tip">
            Keeping the lights on isn&apos;t free. If this was useful, you&apos;re welcome to
            toss me a couple bucks toward a coffee or a muffin. Truly no pressure. Every
            little bit helps. 💛
          </p>
        </div>

        <div className="pgc-actions">
          <button
            type="button"
            className="pgc-btn pgc-btn--primary"
            onClick={dismiss}
            data-testid="construction-explore-zaylist"
          >
            Explore Zaylist
          </button>
          <a
            className="pgc-btn pgc-btn--tip"
            href={venmoUrl}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="construction-buy-coffee-venmo"
            onClick={dismiss}
          >
            ☕ Buy me a coffee
          </a>
        </div>

        <p className="pgc-foot">Made with 🖤 in Portland</p>
      </div>
    </div>,
    document.body,
  );
}
