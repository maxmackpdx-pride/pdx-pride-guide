import { useEffect, useRef, useState } from "react";
import { apiRequest, parseApiError } from "@/lib/queryClient";
import { askAfterzConsent } from "../afterz/NightConsent";

export function useForegroundCheck(
  base: string,
  eventId: number,
  refresh: () => void,
) {
  const [consent, setConsent] = useState<{ area: string } | null>(null);
  const [status, setStatus] = useState("");
  const onRefresh = useRef(refresh);
  onRefresh.current = refresh;

  useEffect(() => {
    if (!consent) return;
    let active = true;
    let lease: string | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let expiry: ReturnType<typeof setTimeout> | undefined;
    let watch: number | undefined;
    let permission: PermissionStatus | undefined;
    let prompted = false;

    const revoke = (id: string) => {
      // Keepalive covers closing the dialog or leaving the page. Last confirmed
      // presence also expires server-side if the browser goes offline.
      void fetch(base + "/presence/foreground/" + encodeURIComponent(id), {
        method: "DELETE",
        credentials: "same-origin",
        keepalive: true,
      })
        .then(() => onRefresh.current())
        .catch(() => {});
    };
    const clearWatch = () => {
      if (watch !== undefined) navigator.geolocation.clearWatch(watch);
      watch = undefined;
    };
    const end = (message: string) => {
      if (!active) return;
      active = false;
      clearWatch();
      clearTimeout(timer);
      clearTimeout(expiry);
      if (lease) revoke(lease);
      setConsent(null);
      setStatus(message);
    };
    const visibility = () => {
      if (document.visibilityState !== "visible")
        end("Automatic check-in ended when you left this screen.");
    };
    const permissionChanged = () => {
      if (permission?.state === "denied")
        end("Location permission is off. Automatic check-in ended.");
    };
    const sample = () => {
      if (!active || !lease || document.visibilityState !== "visible") return;
      watch = navigator.geolocation.watchPosition(
        async ({ coords }) => {
          clearWatch();
          if (!active || document.visibilityState !== "visible") return;
          try {
            const response = await apiRequest("POST", base + "/presence", {
              lease,
              lat: coords.latitude,
              lng: coords.longitude,
              accuracy: coords.accuracy,
            });
            const { near } = await response.json();
            if (!active) return;
            setStatus(
              near
                ? "At the venue · ride matching is active."
                : "Waiting for an accurate location near the venue.",
            );
            if (near && !prompted) {
              prompted = true;
              askAfterzConsent(eventId, "checkin");
            }
            onRefresh.current();
            timer = setTimeout(sample, 45_000);
          } catch (error) {
            end(
              parseApiError(
                error,
                "Automatic check-in ended. You can try again.",
              ),
            );
          }
        },
        (error) => {
          clearWatch();
          if (!active) return;
          if (error.code === 1)
            return end("Location permission is off. Automatic check-in ended.");
          setStatus("Waiting for your device to find an accurate location.");
          timer = setTimeout(sample, 45_000);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15_000 },
      );
    };
    document.addEventListener("visibilitychange", visibility);
    const pageLeft = () => end("Automatic check-in ended.");
    window.addEventListener("pagehide", pageLeft);
    void (async () => {
      if (!navigator.geolocation || document.visibilityState !== "visible")
        return end("Foreground location is unavailable.");
      try {
        const response = await apiRequest(
          "POST",
          base + "/presence/foreground",
          { area: consent.area, consent: true },
        );
        const session: { lease: string; expiresAt: number } =
          await response.json();
        if (!active) return revoke(session.lease);
        lease = session.lease;
        expiry = setTimeout(
          () => end("Automatic check-in expired."),
          Math.max(0, session.expiresAt - Date.now()),
        );
        if (navigator.permissions) {
          try {
            permission = await navigator.permissions.query({
              name: "geolocation",
            });
          } catch {
            /* The browser can prompt on the first sample. */
          }
          if (!active) return;
          permission?.addEventListener("change", permissionChanged);
          if (permission?.state === "denied") return permissionChanged();
        }
        sample();
      } catch (error) {
        end(parseApiError(error, "Automatic check-in could not start."));
      }
    })();
    return () => {
      const needsRevocation = active;
      active = false;
      clearWatch();
      clearTimeout(timer);
      clearTimeout(expiry);
      permission?.removeEventListener("change", permissionChanged);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", pageLeft);
      if (needsRevocation && lease) revoke(lease);
    };
  }, [base, eventId, consent]);
  return {
    active: Boolean(consent),
    status,
    begin: (area: string) => {
      setStatus("Checking for your arrival…");
      setConsent({ area });
    },
    stop: () => {
      setConsent(null);
      setStatus("Automatic check-in stopped.");
    },
  };
}
