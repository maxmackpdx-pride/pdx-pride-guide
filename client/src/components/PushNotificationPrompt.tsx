import { useEffect, useState } from "react";
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
import { ANDROID_STEPS, InstallSteps, IOS_STEPS } from "@/components/pwa/installSteps";

const DISMISS_KEY = "pdx-push-prompt-dismissed";
type InstallMode = "ios" | "android";

export default function PushNotificationPrompt() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [visible, setVisible] = useState(false);
  const [installMode, setInstallMode] = useState<InstallMode | null>(null);
  const [installReady, setInstallReady] = useState(false); // Android: native prompt captured
  const [busy, setBusy] = useState(false);
  const installFirst = installMode === "ios";
  const androidOptionalInstall = installMode === "android";

  useEffect(() => {
    if (!user) return;
    if (sessionStorage.getItem(DISMISS_KEY) === "1") return;

    // iPhone/iPad in Safari, not yet installed: DON'T auto-pop the install modal.
    // The hub Install-app card and the home-hero DOWNLOAD APP button cover this on
    // demand now, so the automatic nag is removed. (iOS can't web-push until it's a
    // home-screen app anyway, so there's no push flow to fall through to here.)
    if (shouldShowInstallBeforePush()) {
      return;
    }

    // Android in the browser: optional install section, but push still works in
    // Chrome without installing - fall through to the permission flow below.
    const androidBrowser = isAndroidDevice() && !isStandalonePwa();
    let onInstallAvailable: (() => void) | undefined;
    if (androidBrowser) {
      setInstallMode("android");
      setInstallReady(hasInstallPrompt());
      onInstallAvailable = () => setInstallReady(true);
      window.addEventListener("pdx-pwa-install-available", onInstallAvailable);
    }

    let cancelled = false;
    let showTimer: number | undefined;

    void (async () => {
      const config = await fetchPushConfig();
      if (!config.configured || !config.publicKey) return;

      // The notification-permission flow below requires the web-push APIs.
      if (!canUseWebPush()) return;

      if (await hasPushSubscription()) return;

      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        await subscribeToPush();
        return;
      }

      if (!isPushPermissionPending()) return;

      showTimer = window.setTimeout(() => {
        if (cancelled) return;
        setVisible(true);
      }, isStandalonePwa() ? 800 : 2200);
    })();

    const hideIfSubscribed = () => {
      void hasPushSubscription().then((active) => {
        if (active) setVisible(false);
      });
    };

    window.addEventListener(PUSH_STATE_EVENT, hideIfSubscribed);

    return () => {
      cancelled = true;
      if (showTimer) window.clearTimeout(showTimer);
      window.removeEventListener(PUSH_STATE_EVENT, hideIfSubscribed);
      if (onInstallAvailable) {
        window.removeEventListener("pdx-pwa-install-available", onInstallAvailable);
      }
    };
  }, [user]);

  if (!visible) return null;

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  // Android one-tap install via the captured beforeinstallprompt.
  const installNative = async () => {
    setBusy(true);
    try {
      const outcome = await promptInstall();
      if (outcome === "accepted") {
        toast({ title: "Installing Zaylist", description: "Look for it on your home screen in a moment." });
        setVisible(false);
        return;
      }
      if (outcome === "unavailable") {
        setInstallReady(false); // fall back to the manual steps
      }
      // "dismissed": leave the popup open so they can use the manual steps.
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
        setVisible(false);
        return;
      }
      if (result === "denied") {
        toast({
          title: "Notifications blocked",
          description: "You can enable them later in the site footer or device settings.",
          variant: "destructive",
        });
        setVisible(false);
        return;
      }
      if (result === "not_configured") {
        toast({ title: "Push not ready yet", description: "Try again after the next deploy.", variant: "destructive" });
      }
    } finally {
      setBusy(false);
    }
  };

  const sticker =
    installMode === "ios" ? "IPHONE SETUP"
    : installMode === "android" ? "ANDROID"
    : isStandalonePwa() ? "INSTALLED APP" : "STAY IN THE LOOP";

  const intro =
    installMode === "ios"
      ? "Add Zaylist to your home screen - opens full-screen like a real app, one tap away, and unlocks push alerts. iPhone does this from Safari's Share button:"
      : installMode === "android"
      ? "Allow notifications for inbox and host updates. You can also install the app for a full-screen home-screen experience and launcher badge:"
      : "Get alerts for inbox messages, host updates, and Pride weekend happenings. You can change this anytime in the site footer.";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="push-prompt-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2100,
        background: "rgba(0,0,0,0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
      }}
    >
      <div
        style={{
          width: "min(520px, 100%)",
          border: "3px solid var(--neon-cyan)",
          background: "#050505",
          boxShadow: "0 0 36px rgba(25,227,255,0.24), 0 0 60px rgba(255,0,204,0.12)",
          padding: 24,
          position: "relative",
        }}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={dismiss}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            background: "transparent",
            border: "1px solid #333",
            color: "#999",
            width: 30,
            height: 30,
            cursor: "pointer",
          }}
        >
          X
        </button>

        <div className="sticker" style={{ color: "#19E3FF", borderColor: "#19E3FF", marginBottom: 14 }}>
          {sticker}
        </div>

        <h2
          id="push-prompt-title"
          className="display"
          style={{ color: "#fff", fontSize: "clamp(1.6rem, 6vw, 2.4rem)", lineHeight: 1.05, marginBottom: 14 }}
        >
          {installFirst ? "SAVE AS WEB APP" : androidOptionalInstall ? "NOTIFICATIONS & INSTALL" : "ALLOW NOTIFICATIONS?"}
        </h2>

        <p style={{ color: "#bbb", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: installFirst ? 10 : 20 }}>
          {intro}
        </p>

        {installFirst && (
          <p style={{ color: "#FF00CC", fontSize: "0.86rem", fontStyle: "italic", lineHeight: 1.5, marginBottom: 18 }}>
            IYKYK - it's the same move as saving Sniffies to your home screen. 😏
          </p>
        )}

        {/* Android: the real one-tap install, shown when Chrome has offered it. */}
        {installMode === "android" && installReady && (
          <button
            type="button"
            className="btn-neon solid pdx-glass-rebind"
            disabled={busy}
            onClick={installNative}
            style={{ borderColor: "#19E3FF", background: "#19E3FF", color: "#000", width: "100%", marginBottom: 16 }}
          >
            {busy ? "OPENING…" : "INSTALL APP"}
          </button>
        )}

        {installMode === "android" && (
          <p style={{ color: "#8a8a92", fontSize: "0.82rem", lineHeight: 1.5, marginBottom: 12 }}>
            {installReady ? "Or do it yourself:" : "Your browser will offer a one-tap Install once it's ready - or do it now:"}
          </p>
        )}

        {installMode === "ios" && <InstallSteps steps={IOS_STEPS} />}
        {androidOptionalInstall && <InstallSteps steps={ANDROID_STEPS} />}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: (installFirst || androidOptionalInstall) ? 20 : 0 }}>
          {(!installFirst) && (
            <button
              type="button"
              className="btn-neon solid pdx-glass-rebind"
              disabled={busy}
              onClick={allow}
              style={{ borderColor: "#19E3FF", background: "#19E3FF", color: "#000" }}
            >
              {busy ? "ENABLING…" : "ALLOW NOTIFICATIONS"}
            </button>
          )}
          <button type="button" className="btn-neon pdx-glass-rebind" onClick={dismiss} style={{ color: "#aaa", borderColor: "#444" }}>
            {installFirst ? "GOT IT" : "NOT NOW"}
          </button>
        </div>
      </div>
    </div>
  );
}
