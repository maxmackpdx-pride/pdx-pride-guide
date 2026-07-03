import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  hasPushSubscription,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/pushNotifications";
import { canUseWebPush } from "@/lib/pwa";

export default function PushNotificationToggle() {
  const { user } = useAuth();
  const { toast } = useToast();
  const supported = canUseWebPush();
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!user || !supported) {
      setReady(true);
      return;
    }
    const subscribed = await hasPushSubscription();
    setEnabled(subscribed);
    setReady(true);
  }, [user, supported]);

  useEffect(() => {
    setReady(false);
    void refresh();
  }, [refresh]);

  if (!supported || !user) return null;

  const toggle = async () => {
    if (!ready || busy) return;
    setBusy(true);
    try {
      if (enabled) {
        await unsubscribeFromPush();
        setEnabled(false);
        toast({ title: "Notifications off on this device" });
        return;
      }

      const result = await subscribeToPush();
      if (result === "granted") {
        setEnabled(true);
        toast({ title: "Notifications enabled" });
        return;
      }
      if (result === "install_required") {
        toast({
          title: "Add to Home Screen first",
          description: "On iPhone, install the app to your Home Screen before enabling push.",
        });
        return;
      }
      if (result === "not_configured") {
        toast({
          title: "Push not configured yet",
          description: "VAPID keys still need to be added on Railway.",
          variant: "destructive",
        });
        return;
      }
      if (result === "denied") {
        toast({
          title: "Notifications blocked",
          description: "Enable them in browser or device settings.",
          variant: "destructive",
        });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      className={`push-notification-toggle${enabled ? " push-notification-toggle--on" : ""}`}
      onClick={toggle}
      disabled={!ready || busy}
      aria-pressed={enabled}
      aria-busy={busy}
      aria-label={
        enabled
          ? "Turn off push notifications on this device"
          : "Turn on push notifications for inbox and event alerts"
      }
      title={enabled ? "Notifications on" : "Notifications off"}
    >
      <span className="push-notification-toggle__track" aria-hidden="true">
        <span className="push-notification-toggle__thumb" />
      </span>
      <span className="push-notification-toggle__copy">
        <span className="push-notification-toggle__label">
          {busy ? "…" : "Alerts"}
        </span>
        <span className="push-notification-toggle__hint">
          {enabled ? "push on" : "inbox & events"}
        </span>
      </span>
    </button>
  );
}