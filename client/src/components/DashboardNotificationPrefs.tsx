import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  hasPushSubscription,
  PUSH_STATE_EVENT,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/pushNotifications";
import { canUseWebPush } from "@/lib/pwa";
import type { NotificationPrefs } from "@shared/pushCategories";

const LABELS: Record<keyof NotificationPrefs, { title: string; body: string }> = {
  messages: {
    title: "Direct messages",
    body: "Mizzed Connection, GiftZ, Gigz, check-ins, and event messages.",
  },
  my_events: {
    title: "My events",
    body: "Host updates, lineup requests, and talent tags on events you follow.",
  },
  account: {
    title: "Account updates",
    body: "Submission results, claims, and promoter status from Zaylist.",
  },
  admin: {
    title: "Admin alerts",
    body: "New submissions and moderation items needing review.",
  },
};

export default function DashboardNotificationPrefs({
  isAdmin,
  embedded = false,
}: {
  isAdmin: boolean;
  /** Strip outer card chrome when nested in Hub Settings */
  embedded?: boolean;
}) {
  const { toast } = useToast();
  const supported = canUseWebPush();
  const [pushActive, setPushActive] = useState<boolean | null>(null);

  const refreshPushState = useCallback(async () => {
    setPushActive(await hasPushSubscription());
  }, []);

  useEffect(() => {
    void refreshPushState();
    const onChange = () => void refreshPushState();
    const onVisible = () => {
      if (document.visibilityState === "visible") void refreshPushState();
    };
    window.addEventListener(PUSH_STATE_EVENT, onChange);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener(PUSH_STATE_EVENT, onChange);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refreshPushState]);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/users/me/notification-prefs"],
    queryFn: () => fetch("/api/users/me/notification-prefs", { credentials: "include" }).then(r => r.json()),
  });

  const prefs: NotificationPrefs = data?.prefs || {
    messages: true,
    my_events: true,
    account: true,
    admin: false,
  };
  const pushConfigured = Boolean(data?.pushConfigured);

  const saveMutation = useMutation({
    mutationFn: async (patch: Partial<NotificationPrefs>) => {
      const res = await fetch("/api/users/me/notification-prefs", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Could not save notification preferences");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me/notification-prefs"] });
    },
  });

  const enablePushMutation = useMutation({
    mutationFn: subscribeToPush,
    onSuccess: (result) => {
      if (result === "granted") {
        void refreshPushState();
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
        toast({ title: "Notifications blocked", description: "Enable them in browser or device settings.", variant: "destructive" });
      }
    },
    onError: () => toast({ title: "Could not enable notifications", variant: "destructive" }),
  });

  const disablePush = async () => {
    await unsubscribeFromPush();
    await refreshPushState();
    toast({ title: "Push disabled on this device" });
  };

  const toggle = (key: keyof NotificationPrefs) => {
    if (key === "admin" && !isAdmin) return;
    saveMutation.mutate({ [key]: !prefs[key] });
  };

  const showEnableAsk = supported && pushActive === false;

  const rootClass = embedded ? "hub-settings-prefs" : "dashboard-notification-prefs";
  const ledeClass = embedded ? "hub-settings-prefs__lede" : "dashboard-notification-prefs__lede";

  return (
    <section
      id="notifications"
      className={rootClass}
      style={
        embedded
          ? undefined
          : {
              marginBottom: 24,
              padding: "16px 18px",
              border: "1px solid #222",
              background: "#080808",
            }
      }
    >
      {!embedded && (
        <div className="display" style={{ fontSize: "0.9rem", color: "#fff", marginBottom: 6 }}>
          Notifications
        </div>
      )}
      <p className={ledeClass} style={embedded ? undefined : { margin: "0 0 14px", fontSize: "0.78rem", color: "#8c8980", lineHeight: 1.45 }}>
        {!supported
          ? "Choose which email and in-app alerts you want. Push is not available on this browser or device."
          : pushActive
            ? "Push is on for this device. Choose which alerts you want below."
            : "Get alerts for inbox messages and host updates during Pride weekend. Preferences are saved to your account."}
      </p>

      {showEnableAsk && (
        <div className={embedded ? "hub-settings-prefs__enable-row" : undefined} style={embedded ? undefined : { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          <button
            type="button"
            className={embedded ? "hub-settings-prefs__enable-btn" : undefined}
            disabled={enablePushMutation.isPending}
            onClick={() => enablePushMutation.mutate()}
            style={
              embedded
                ? undefined
                : {
                    background: "var(--neon-cyan)",
                    color: "#000",
                    border: "none",
                    padding: "8px 14px",
                    cursor: "pointer",
                    fontFamily: "var(--font-display)",
                    fontSize: "0.72rem",
                  }
            }
          >
            Enable push on this device
          </button>
          {!pushConfigured && (
            <span
              className={embedded ? "hub-settings-prefs__pending" : undefined}
              style={embedded ? undefined : { fontSize: "0.72rem", color: "#FF8C00", alignSelf: "center" }}
            >
              Server push keys pending (Railway)
            </span>
          )}
        </div>
      )}

      {supported && pushActive && (
        <p className={embedded ? "hub-settings-prefs__status" : undefined} style={embedded ? undefined : { margin: "0 0 16px", fontSize: "0.75rem", color: "#6f736c" }}>
          Push active on this device.{" "}
          <button
            type="button"
            className={embedded ? "hub-settings-prefs__status-btn" : undefined}
            onClick={() => void disablePush()}
            style={
              embedded
                ? undefined
                : {
                    background: "none",
                    border: "none",
                    padding: 0,
                    color: "#8c8980",
                    textDecoration: "underline",
                    cursor: "pointer",
                    font: "inherit",
                  }
            }
          >
            Turn off
          </button>
        </p>
      )}

      {isLoading ? (
        <p className={embedded ? "hub-settings-prefs__loading" : undefined} style={embedded ? undefined : { fontSize: "0.75rem", color: "#6f736c" }}>
          Loading preferences…
        </p>
      ) : (
        <div className={embedded ? "hub-settings-prefs__grid" : undefined} style={embedded ? undefined : { display: "grid", gap: 10 }}>
          {(Object.keys(LABELS) as Array<keyof NotificationPrefs>)
            .filter(key => key !== "admin" || isAdmin)
            .map(key => (
              <label
                key={key}
                className={embedded ? "hub-settings-prefs__item" : undefined}
                style={
                  embedded
                    ? undefined
                    : {
                        display: "flex",
                        gap: 12,
                        alignItems: "flex-start",
                        cursor: "pointer",
                        padding: "10px 0",
                        borderTop: "1px solid #151515",
                      }
                }
              >
                <input
                  type="checkbox"
                  checked={Boolean(prefs[key])}
                  onChange={() => toggle(key)}
                  disabled={saveMutation.isPending}
                  style={embedded ? undefined : { marginTop: 3 }}
                />
                <span>
                  <span
                    className={embedded ? "hub-settings-prefs__item-title" : "display"}
                    style={embedded ? undefined : { display: "block", fontSize: "0.78rem", color: "#fff" }}
                  >
                    {LABELS[key].title}
                  </span>
                  <span
                    className={embedded ? "hub-settings-prefs__item-body" : undefined}
                    style={embedded ? undefined : { fontSize: "0.72rem", color: "#8c8980" }}
                  >
                    {LABELS[key].body}
                  </span>
                </span>
              </label>
            ))}
        </div>
      )}
    </section>
  );
}