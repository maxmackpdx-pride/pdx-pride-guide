import { useEffect, useState } from "react";
import { hasInstallPrompt, isAndroidDevice, isIosDevice, isStandalonePwa, promptInstall } from "@/lib/pwa";

const DISMISS_KEY = "pdx-pwa-install-dismissed";

export default function PwaInstallBanner() {
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (isStandalonePwa()) return;
    if (sessionStorage.getItem(DISMISS_KEY) === "1") return;

    const sync = () => {
      if (isStandalonePwa()) {
        setVisible(false);
        return;
      }
      if (hasInstallPrompt()) {
        setIosHint(false);
        setVisible(true);
        return;
      }
      if (isIosDevice() || isAndroidDevice()) {
        setIosHint(isIosDevice());
        setVisible(true);
      }
    };

    sync();
    window.addEventListener("pdx-pwa-install-available", sync);
    return () => window.removeEventListener("pdx-pwa-install-available", sync);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  const install = async () => {
    const outcome = await promptInstall();
    if (outcome === "accepted") setVisible(false);
    if (outcome === "unavailable") dismiss();
  };

  return (
    <div
      className="pwa-install-banner"
      role="region"
      aria-label="Install app"
      style={{
        marginBottom: 16,
        padding: "14px 16px",
        border: "1px solid #333",
        background: "#0a0a0a",
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ flex: 1, minWidth: 200 }}>
        <div className="display" style={{ fontSize: "0.85rem", color: "#fff", marginBottom: 4 }}>
          {iosHint ? "Add to Home Screen" : "Install Pride Guide"}
        </div>
        <p style={{ margin: 0, fontSize: "0.78rem", color: "#8c8980", lineHeight: 1.45 }}>
          {iosHint
            ? "Tap Share, then Add to Home Screen for the full app, required for push notifications on iPhone."
            : "Tap ⋮ in Chrome → Install app for full-screen Pride Guide and home-screen badge."}
        </p>
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        {!iosHint && hasInstallPrompt() && (
          <button
            type="button"
            onClick={install}
            style={{
              background: "var(--neon-magenta)",
              color: "#000",
              border: "none",
              padding: "8px 14px",
              cursor: "pointer",
              fontFamily: "var(--font-display)",
              fontSize: "0.72rem",
              letterSpacing: "0.06em",
            }}
          >
            Install
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install banner"
          style={{
            background: "transparent",
            color: "#8c8980",
            border: "1px solid #333",
            padding: "8px 12px",
            cursor: "pointer",
            fontSize: "0.72rem",
          }}
        >
          Not now
        </button>
      </div>
    </div>
  );
}