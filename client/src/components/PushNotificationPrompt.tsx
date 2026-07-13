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
import { canUseWebPush, isStandalonePwa } from "@/lib/pwa";

const DISMISS_KEY = "pdx-push-prompt-dismissed";

export default function PushNotificationPrompt() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [visible, setVisible] = useState(false);
  const [installFirst, setInstallFirst] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (sessionStorage.getItem(DISMISS_KEY) === "1") return;

    // iPhone/iPad in Safari (not yet installed): show the "Save as Web App"
    // how-to right away, independent of push config. Installing is the goal,
    // and iOS can't do web push until the site is a home-screen app anyway —
    // so this must not be gated behind VAPID/push being configured.
    if (shouldShowInstallBeforePush()) {
      setInstallFirst(true);
      setVisible(true);
      return;
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
        setInstallFirst(false);
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
    };
  }, [user]);

  if (!visible) return null;

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  const allow = async () => {
    if (installFirst) {
      dismiss();
      return;
    }
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
          {installFirst ? "IPHONE SETUP" : isStandalonePwa() ? "INSTALLED APP" : "STAY IN THE LOOP"}
        </div>

        <h2
          id="push-prompt-title"
          className="display"
          style={{ color: "#fff", fontSize: "clamp(1.6rem, 6vw, 2.4rem)", lineHeight: 1.05, marginBottom: 14 }}
        >
          {installFirst ? "SAVE AS WEB APP" : "ALLOW NOTIFICATIONS?"}
        </h2>

        <p style={{ color: "#bbb", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: installFirst ? 18 : 20 }}>
          {installFirst
            ? "Add Pride Guide to your home screen — opens full-screen like a real app, one tap away, and unlocks push alerts. iPhone does this from Safari's Share button:"
            : "Get alerts for inbox messages, host updates, and Pride weekend happenings. You can change this anytime in the site footer."}
        </p>

        {installFirst && <InstallSteps />}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: installFirst ? 20 : 0 }}>
          {!installFirst && (
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

// The iOS Share glyph (up arrow out of a tray) — this is the button Apple uses
// for "Add to Home Screen"; it can't be triggered from a web page.
function ShareGlyph() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12" />
      <path d="M8 7l4-4 4 4" />
      <path d="M6 12H5a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2h-1" />
    </svg>
  );
}

// The "Add to Home Screen" row glyph — a rounded square with a plus.
function AddGlyph() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={CYAN} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="4.5" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

// On-brand, self-contained visual how-to for saving the site as a home-screen
// web app on iPhone. No screenshots, no fake buttons — iOS only allows this
// from Safari's own Share button, so we point the user straight at it.
function InstallSteps() {
  const steps: Array<{ icon: ReactNode; title: ReactNode; sub: string }> = [
    {
      icon: <ShareGlyph />,
      title: <>Tap the <strong style={{ color: "#fff" }}>Share</strong> button</>,
      sub: "In Safari's toolbar — the ⬆️ square, usually bottom-center.",
    },
    {
      icon: <AddGlyph />,
      title: <>Choose <strong style={{ color: "#fff" }}>Add to Home Screen</strong></>,
      sub: "Scroll the share menu down a little if you don't see it.",
    },
    {
      icon: (
        <img
          src="/icons/apple-touch-icon.png"
          alt=""
          width={30}
          height={30}
          style={{ borderRadius: 8, display: "block" }}
        />
      ),
      title: <>Open it from your <strong style={{ color: "#fff" }}>home screen</strong></>,
      sub: "It launches full-screen, like a real app — icon and all.",
    },
  ];

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