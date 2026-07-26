import { useEffect, useState, type ReactNode } from "react";
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

    // iPhone/iPad in Safari, not yet installed → "Save as Web App" how-to.
    // Independent of push config: iOS can't do web push until it's a home-screen app.
    if (shouldShowInstallBeforePush()) {
      setInstallMode("ios");
      setVisible(true);
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
            className="btn-neon solid"
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
              className="btn-neon solid"
              disabled={busy}
              onClick={allow}
              style={{ borderColor: "#19E3FF", background: "#19E3FF", color: "#000" }}
            >
              {busy ? "ENABLING…" : "ALLOW NOTIFICATIONS"}
            </button>
          )}
          <button type="button" className="btn-neon" onClick={dismiss} style={{ color: "#aaa", borderColor: "#444" }}>
            {installFirst ? "GOT IT" : "NOT NOW"}
          </button>
        </div>
      </div>
    </div>
  );
}

const CYAN = "#19E3FF";

// The iOS Share glyph (up arrow out of a tray) - the button Apple uses for
// "Add to Home Screen"; it can't be triggered from a web page.
function ShareGlyph() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12" />
      <path d="M8 7l4-4 4 4" />
      <path d="M6 12H5a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2h-1" />
    </svg>
  );
}

// A rounded square with a plus - "Add to Home Screen".
function AddGlyph() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="4.5" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

// Android Chrome's ⋮ overflow-menu glyph (three vertical dots).
function MenuGlyph() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={CYAN} aria-hidden="true">
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
    </svg>
  );
}

// Download-into-tray glyph - Chrome's "Install app".
function InstallGlyph() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v11" />
      <path d="M8 10l4 4 4-4" />
      <path d="M5 19h14" />
    </svg>
  );
}

function HomeIcon({ src }: { src: string }) {
  return <img src={src} alt="" width={30} height={30} style={{ borderRadius: 8, display: "block" }} />;
}

type Step = { icon: ReactNode; title: ReactNode; sub: string };

const b = (t: string) => <strong style={{ color: "#fff" }}>{t}</strong>;

const IOS_STEPS: Step[] = [
  { icon: <ShareGlyph />, title: <>Tap the {b("Share")} button</>, sub: "In Safari's toolbar - the ⬆️ square, usually bottom-center." },
  { icon: <AddGlyph />, title: <>Choose {b("Add to Home Screen")}</>, sub: "Scroll the share menu down a little if you don't see it." },
  { icon: <HomeIcon src="/icons/zaylist-180.png" />, title: <>Open it from your {b("home screen")}</>, sub: "It launches full-screen, like a real app - icon and all." },
];

const ANDROID_STEPS: Step[] = [
  { icon: <MenuGlyph />, title: <>Tap the {b("⋮ menu")}</>, sub: "Top-right corner of Chrome." },
  { icon: <InstallGlyph />, title: <>Choose {b("Install app")}</>, sub: "Some phones label it \"Add to Home screen.\"" },
  { icon: <HomeIcon src="/icons/zaylist-180.png" />, title: <>Open it from your {b("home screen")}</>, sub: "It launches full-screen, like a real app - icon and all." },
];

// On-brand, self-contained visual how-to. No screenshots - the exact controls
// live in the browser's own chrome, so we point the user straight at them.
function InstallSteps({ steps }: { steps: Step[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {steps.map((s, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 13,
            padding: "11px 13px",
            background: "#0c0c0f",
            border: "1px solid rgba(25,227,255,0.28)",
            borderRadius: 12,
          }}
        >
          <div
            style={{
              position: "relative",
              width: 44,
              height: 44,
              flex: "none",
              display: "grid",
              placeItems: "center",
              background: "#08080a",
              border: "1px solid #23232a",
              borderRadius: 11,
            }}
          >
            {s.icon}
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                top: -7,
                left: -7,
                width: 20,
                height: 20,
                borderRadius: 999,
                background: CYAN,
                color: "#04141a",
                fontFamily: "var(--font-mono, monospace)",
                fontSize: 11,
                fontWeight: 700,
                display: "grid",
                placeItems: "center",
              }}
            >
              {i + 1}
            </span>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "#e8e8ea", fontSize: "0.95rem", lineHeight: 1.3 }}>{s.title}</div>
            <div style={{ color: "#8a8a92", fontSize: "0.8rem", lineHeight: 1.4, marginTop: 2 }}>{s.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
