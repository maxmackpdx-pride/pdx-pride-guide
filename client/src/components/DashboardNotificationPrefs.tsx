import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { subscribeToPush, unsubscribeFromPush } from "@/lib/pushNotifications";
import { canUseWebPush } from "@/lib/pwa";
import type { NotificationPrefs } from "@shared/pushCategories";

const LABELS: Record<keyof NotificationPrefs, { title: string; body: string }> = {
  messages: {
    title: "Direct messages",
    body: "Missed connections, gifting, gigs, check-ins, and event messages.",
  },
  my_events: {
    title: "My events",
    body: "Host updates, lineup requests, and talent tags on events you follow.",
  },
  account: {
    title: "Account updates",
    body: "Submission results, claims, and promoter status from PDX Pride Guide.",
  },
  admin: {
    title: "Admin alerts",
    body: "New submissions and moderation items needing review.",
  },
};

export default function DashboardNotificationPrefs({ isAdmin }: { isAdmin: boolean }) {
  const { toast } = useToast();
  const supported = canUseWebPush();

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

  const toggle = (key: keyof NotificationPrefs) => {
    if (key === "admin" && !isAdmin) return;
    saveMutation.mutate({ [key]: !prefs[key] });
  };

  if (!supported) return null;

  return (
    <section
      id="notifications"
      style={{
        marginBottom: 24,
        padding: "16px 18px",
        border: "1px solid #222",
        background: "#080808",
      }}
    >
      <div className="display" style={{ fontSize: "0.9rem", color: "#fff", marginBottom: 6 }}>
        Notifications
      </div>
      <p style={{ margin: "0 0 14px", fontSize: "0.78rem", color: "#8c8980", lineHeight: 1.45 }}>
        Get alerts for inbox messages and host updates during Pride weekend. Preferences are saved to your account.
      </p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <button
          type="button"
          disabled={enablePushMutation.isPending}
          onClick={() => enablePushMutation.mutate()}
          style={{
            background: "var(--neon-cyan)",
            color: "#000",
            border: "none",
            padding: "8px 14px",
            cursor: "pointer",
            fontFamily: "var(--font-display)",
            fontSize: "0.72rem",
          }}
        >
          Enable push on this device
        </button>
        <button
          type="button"
          onClick={() => unsubscribeFromPush().then(() => toast({ title: "Push disabled on this device" }))}
          style={{
            background: "transparent",
            color: "#8c8980",
            border: "1px solid #333",
            padding: "8px 12px",
            cursor: "pointer",
            fontSize: "0.72rem",
          }}
        >
          Disable on this device
        </button>
        {!pushConfigured && (
          <span style={{ fontSize: "0.72rem", color: "#FF8C00", alignSelf: "center" }}>
            Server push keys pending (Railway)
          </span>
        )}
      </div>

      {isLoading ? (
        <p style={{ fontSize: "0.75rem", color: "#6f736c" }}>Loading preferences…</p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {(Object.keys(LABELS) as Array<keyof NotificationPrefs>)
            .filter(key => key !== "admin" || isAdmin)
            .map(key => (
              <label
                key={key}
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  cursor: "pointer",
                  padding: "10px 0",
                  borderTop: "1px solid #151515",
                }}
              >
                <input
                  type="checkbox"
                  checked={Boolean(prefs[key])}
                  onChange={() => toggle(key)}
                  disabled={saveMutation.isPending}
                  style={{ marginTop: 3 }}
                />
                <span>
                  <span className="display" style={{ display: "block", fontSize: "0.78rem", color: "#fff" }}>
                    {LABELS[key].title}
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "#8c8980" }}>{LABELS[key].body}</span>
                </span>
              </label>
            ))}
        </div>
      )}
    </section>
  );
}