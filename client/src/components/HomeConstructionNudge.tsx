import { Coffee } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTipLinks } from "@/hooks/useTipLinks";
import { claimFirstRun, releaseFirstRun, rememberDismissed, wasDismissed } from "@/lib/firstRunBanner";
import FirstRunBanner from "./FirstRunBanner";

// Bump when the rebrand welcome copy or CTA order changes so returning visitors see the update once.
const DISMISS_KEY = "pgpdx:construction-nudge:v3-zaylist";

/** `?constructNudge=1` force-shows the banner for previewing (ignores dismissal). */
function forcedPreview(): boolean {
  try {
    return new URLSearchParams(window.location.search).get("constructNudge") === "1";
  } catch {
    return false;
  }
}

/**
 * Welcome note for the rebrand. A compact bottom banner, never a modal: it is shown once per device (remembered as soon
 * as it appears), owns the first-run slot so the notification prompt waits for it, and the page behind stays usable.
 */
export default function HomeConstructionNudge() {
  const { venmoUrl } = useTipLinks();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const forced = forcedPreview();
    if (!forced && wasDismissed(DISMISS_KEY)) return;
    // Hold the slot from mount so the notification prompt cannot slip in ahead of Welcome.
    if (!claimFirstRun("welcome")) return;
    const t = window.setTimeout(() => {
      if (!forced) rememberDismissed(DISMISS_KEY); // shown once; reopening Home never nags again
      setOpen(true);
    }, forced ? 0 : 650);
    return () => { window.clearTimeout(t); releaseFirstRun("welcome"); };
  }, []);

  const dismiss = useCallback(() => {
    rememberDismissed(DISMISS_KEY);
    setOpen(false);
    releaseFirstRun("welcome");
  }, []);

  if (!open) return null;

  return (
    <FirstRunBanner
      id="welcome-banner"
      titleId="zfr-welcome-title"
      kicker="Same home · new name"
      title="Welcome to Zaylist"
      onDismiss={dismiss}
      actions={<>
        <button type="button" className="pgc-btn pgc-btn--primary" onClick={dismiss} data-testid="construction-explore-zaylist">Explore Zaylist</button>
        <a className="pgc-btn pgc-btn--tip" href={venmoUrl} target="_blank" rel="noopener noreferrer" data-testid="construction-buy-coffee-venmo" onClick={dismiss}>
          <Coffee size={16} aria-hidden="true" /> Buy me a coffee
        </a>
      </>}
    >
      <p>Thanks for using <strong>Pride Guide</strong> these past years. I&apos;m renaming it <strong>Zaylist</strong>: same home, new name, year-round for Portland&apos;s LGBTQ+ community.</p>
    </FirstRunBanner>
  );
}
