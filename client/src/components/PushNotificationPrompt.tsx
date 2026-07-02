import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  fetchPushConfig,
  hasPushSubscription,
  isPushPermissionPending,
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
    if (!user || !canUseWebPush()) return;
    if (sessionStorage.getItem(DISMISS_KEY) === "1") return;

    let cancelled = false;
    let showTimer: number | undefined;

    void (async () => {
      const config = await fetchPushConfig();
      if (!config.configured || !config.publicKey) return;

      if (await hasPushSubscription()) return;

      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        await subscribeToPush();
        return;
      }

      if (!isPushPermissionPending()) return;

      if (shouldShowInstallBeforePush()) {
        if (!cancelled) {
          setInstallFirst(true);
          setVisible(true);
        }
        return;
      }

      showTimer = window.setTimeout(() => {
        if (cancelled) return;
        setInstallFirst(false);
        setVisible(true);
      }, isStandalonePwa() ? 800 : 2200);
    })();

    return () => {
      cancelled = true;
      if (showTimer) window.clearTimeout(showTimer);
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
          description: "You can enable them later in Dashboard → Notifications or device settings.",
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
          {installFirst ? "ADD TO HOME SCREEN FIRST" : "ALLOW NOTIFICATIONS?"}
        </h2>

        <p style={{ color: "#bbb", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: 20 }}>
          {installFirst
            ? "On iPhone, push alerts only work from the installed Pride Guide app. Tap Share, then Add to Home Screen. Open it from your home screen and we'll ask again."
            : "Get alerts for inbox messages, host updates, and Pride weekend happenings. You can change this anytime in your Dashboard."}
        </p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
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
            NOT NOW
          </button>
        </div>
      </div>
    </div>
  );
}