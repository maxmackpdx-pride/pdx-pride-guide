import { useEffect, useState } from "react";
import { syncPushSubscriptionWithServer } from "@/lib/pushNotifications";
import { useAuth } from "@/context/AuthContext";
import { apiRequest, parseApiError } from "@/lib/queryClient";

export default function DeviceAlertStatus({
  active,
  supported,
}: {
  active: boolean | null;
  supported: boolean;
}) {
  const { user } = useAuth();
  const [registered, setRegistered] = useState<boolean | null>(null),
    [endpoint, setEndpoint] = useState(""),
    [canTest, setCanTest] = useState(false);
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [checkError, setCheckError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const key = "zaylist-push-check:" + user?.id;
  useEffect(() => {
    let live = true;
    setEndpoint("");
    setCanTest(false);
    setRegistered(null);
    setCheckError(false);
    const refresh = async () => {
      if (!supported || !active || !user) return;
      const registration = await navigator.serviceWorker.getRegistration();
      const sub = await registration?.pushManager.getSubscription();
      if (!sub) return;
      const data = await apiRequest("POST", "/api/push/device-status", {
        endpoint: sub.endpoint,
      }).then((r) => r.json());
      if (live) {
        setEndpoint(sub.endpoint);
        setRegistered(data.registered);
        setCanTest(data.canTest);
      }
    };
    void refresh().catch(() => {
      if (live) setCheckError(true);
    });
    return () => {
      live = false;
    };
  }, [active, supported, user?.id, attempt]);
  useEffect(() => {
    setMessage("");
    const id = new URLSearchParams(window.location.search).get("pushCheck");
    if (!id || !user) return;
    try {
      if (localStorage.getItem(key) === id) {
        setMessage("You opened the test alert on this device.");
        localStorage.removeItem(key);
      }
    } catch {
      /* Device storage may be disabled. */
    }
  }, [key, user?.id]);
  const send = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const data = await apiRequest("POST", "/api/push/device-check", {
        endpoint,
      }).then((r) => r.json());
      try {
        localStorage.setItem(key, data.checkId);
      } catch {
        /* Delivery does not require device storage. */
      }
      setMessage(
        "Your push service accepted the test. Tap the alert when it appears.",
      );
    } catch (error) {
      setMessage(parseApiError(error, "Could not send the device test."));
    } finally {
      setBusy(false);
    }
  };
  if (!supported || !user) return null;
  const permission =
    Notification.permission === "granted"
      ? "Allowed"
      : Notification.permission === "denied"
        ? "Blocked"
        : "Not requested";
  return (
    <div className="hub-settings-prefs__status">
      <p>
        Device permission: {permission}
        {active && registered !== null
          ? registered
            ? " · Subscribed to this account"
            : " · Enable alerts again for this account"
          : ""}
      </p>
      {active && registered === false && (
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await syncPushSubscriptionWithServer();
              setAttempt((n) => n + 1);
            } finally {
              setBusy(false);
            }
          }}
        >
          Connect this device to my account
        </button>
      )}
      {checkError && (
        <button type="button" onClick={() => setAttempt((n) => n + 1)}>
          Retry subscription check
        </button>
      )}
      {canTest && (
        <button type="button" disabled={busy} onClick={() => void send()}>
          {busy ? "Sending…" : "Send a test to this device"}
        </button>
      )}
      {message && <p role="status">{message}</p>}
    </div>
  );
}
