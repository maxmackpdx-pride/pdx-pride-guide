import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  fetchPushConfig,
  hasPushSubscription,
  isPushPermissionPending,
  PUSH_STATE_EVENT,
  shouldShowInstallBeforePush,
  subscribeToPush,
} from "@/lib/pushNotifications";
import {
  canUseWebPush,
  hasInstallPrompt,
  isAndroidDevice,
  isStandalonePwa,
  promptInstall,
} from "@/lib/pwa";
import { ANDROID_STEPS, InstallSteps } from "@/components/pwa/installSteps";
import FirstRunBanner from "@/components/FirstRunBanner";
import { afterFirstInteraction, claimFirstRun, releaseFirstRun, rememberDismissed, subscribeFirstRun, wasDismissed } from "@/lib/firstRunBanner";

/** Remembered per user on this device: "Not now" means not again, the footer still offers notifications. */
const dismissKey = (userId: number | string) => `pdx-push-prompt-dismissed:${userId}`;
type InstallMode = "ios" | "android";

/**
 * Notification prompt as a compact, non-modal bottom banner. It waits for the Welcome banner (one at a time), shows only
 * after the visitor has interacted with the page, and the browser permission dialog is only ever opened by tapping
 * "Allow notifications".
 */
export default function PushNotificationPrompt() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [eligible, setEligible] = useState(false); // everything about this device/user says the prompt makes sense
  const [interacted, setInteracted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [installMode, setInstallMode] = useState<InstallMode | null>(null);
  const [installReady, setInstallReady] = useState(false); // Android: native prompt captured
  const [busy, setBusy] = useState(false);
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    if (wasDismissed(dismissKey(userId))) return;
    // iPhone/iPad in Safari, not yet installed: never auto-pop an install prompt (hub Install card + home button cover it).
    if (shouldShowInstallBeforePush()) return;

    const androidBrowser = isAndroidDevice() && !isStandalonePwa();
    let onInstallAvailable: (() => void) | undefined;
    if (androidBrowser) {
      setInstallMode("android");
      setInstallReady(hasInstallPrompt());
      onInstallAvailable = () => setInstallReady(true);
      window.addEventListener("pdx-pwa-install-available", onInstallAvailable);
    }

    let cancelled = false;
    void (async () => {
      const config = await fetchPushConfig();
      if (!config.configured || !config.publicKey) return;
      if (!canUseWebPush()) return;
      if (await hasPushSubscription()) return;
      // Already granted in the browser: quietly finish subscribing. This is not a permission request.
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        await subscribeToPush();
        return;
      }
      if (!isPushPermissionPending()) return;
      if (!cancelled) setEligible(true);
    })();

    const hideIfSubscribed = () => {
      void hasPushSubscription().then((active) => { if (active) { setEligible(false); setVisible(false); } });
    };
    window.addEventListener(PUSH_STATE_EVENT, hideIfSubscribed);
    return () => {
      cancelled = true;
      window.removeEventListener(PUSH_STATE_EVENT, hideIfSubscribed);
      if (onInstallAvailable) window.removeEventListener("pdx-pwa-install-available", onInstallAvailable);
    };
  }, [userId]);

  // Later, not first: wait for the visitor to touch/scroll/type, then a beat.
  useEffect(() => {
    if (!eligible) return;
    let timer: number | undefined;
    const stop = afterFirstInteraction(() => { timer = window.setTimeout(() => setInteracted(true), isStandalonePwa() ? 800 : 2200); });
    return () => { stop(); if (timer) window.clearTimeout(timer); };
  }, [eligible]);

  // One at a time: take the shared slot when Welcome is not using it, retry when it frees up.
  useEffect(() => {
    if (!eligible || !interacted) return;
    let retry: number | undefined;
    const tryShow = () => { if (claimFirstRun("push")) setVisible(true); };
    tryShow();
    // When Welcome frees the slot, give the visitor a moment before the next note appears.
    const off = subscribeFirstRun(() => { if (retry) window.clearTimeout(retry); retry = window.setTimeout(tryShow, 4000); });
    return () => { off(); if (retry) window.clearTimeout(retry); releaseFirstRun("push"); };
  }, [eligible, interacted]);

  const dismiss = useCallback(() => {
    if (userId) rememberDismissed(dismissKey(userId));
    setVisible(false);
    setEligible(false);
    releaseFirstRun("push");
  }, [userId]);

  if (!visible || !userId) return null;

  // Android one-tap install via the captured beforeinstallprompt.
  const installNative = async () => {
    setBusy(true);
    try {
      const outcome = await promptInstall();
      if (outcome === "accepted") {
        toast({ title: "Installing Zaylist", description: "Look for it on your home screen in a moment." });
        dismiss();
        return;
      }
      if (outcome === "unavailable") setInstallReady(false); // fall back to the manual steps
    } finally {
      setBusy(false);
    }
  };

  const allow = async () => {
    setBusy(true);
    try {
      const result = await subscribeToPush();
      if (result === "granted") {
        toast({ title: "Notifications enabled", description: "We'll ping you for inbox and event updates." });
        dismiss();
        return;
      }
      if (result === "denied") {
        toast({
          title: "Notifications blocked",
          description: "You can enable them later in the site footer or device settings.",
          variant: "destructive",
        });
        dismiss();
        return;
      }
      if (result === "not_configured") {
        toast({ title: "Push not ready yet", description: "Try again after the next deploy.", variant: "destructive" });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <FirstRunBanner
      id="push-prompt-banner"
      titleId="push-prompt-title"
      kicker={isStandalonePwa() ? "Installed app" : "Stay in the loop"}
      title="Allow notifications?"
      onDismiss={dismiss}
      actions={<>
        <button type="button" className="pgc-btn pgc-btn--primary" disabled={busy} onClick={allow}>{busy ? "Enabling…" : "Allow notifications"}</button>
        {installMode === "android" && installReady && (
          <button type="button" className="pgc-btn pgc-btn--ghost" disabled={busy} onClick={installNative}>{busy ? "Opening…" : "Install app"}</button>
        )}
        <button type="button" className="pgc-btn pgc-btn--ghost" onClick={dismiss}>Not now</button>
      </>}
    >
      <p>Alerts for inbox messages, host updates, and event-week happenings. You can change this anytime in the site footer.</p>
      {installMode === "android" && !installReady && (
        <details><summary>Install the app instead</summary><InstallSteps steps={ANDROID_STEPS} /></details>
      )}
    </FirstRunBanner>
  );
}
