import { useEffect, useState } from "react";
import {
  hasInstallPrompt,
  isAndroidDevice,
  isIosDevice,
  isStandalonePwa,
  promptInstall,
} from "@/lib/pwa";
import { ANDROID_STEPS, InstallSteps, IOS_STEPS } from "@/components/pwa/installSteps";

type Platform = "ios" | "android";

/**
 * Compact "Install app" card for the mobile web — sits above the weather widget
 * in the hub feed. Tapping it opens an on-brand instructions card (Save as Web
 * App / Add to Home Screen). Hidden on desktop and inside the installed PWA.
 */
export default function InstallAppCard() {
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [open, setOpen] = useState(false);
  const [installReady, setInstallReady] = useState(false); // Android native prompt captured
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Only on a phone browser — never on desktop, never inside the installed app.
    if (isStandalonePwa()) return;
    if (isIosDevice()) setPlatform("ios");
    else if (isAndroidDevice()) setPlatform("android");
    else return;

    setInstallReady(hasInstallPrompt());
    const onAvailable = () => setInstallReady(true);
    window.addEventListener("pdx-pwa-install-available", onAvailable);
    return () => window.removeEventListener("pdx-pwa-install-available", onAvailable);
  }, []);

  if (!platform) return null;

  const isIos = platform === "ios";

  const installNative = async () => {
    setBusy(true);
    try {
      const outcome = await promptInstall();
      if (outcome === "accepted") setOpen(false);
      if (outcome === "unavailable") setInstallReady(false); // fall back to manual steps
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="install-app-card"
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
          padding: "12px 14px",
          textAlign: "left",
          cursor: "pointer",
          background:
            "linear-gradient(135deg, rgba(25,227,255,0.12) 0%, rgba(5,5,5,0.6) 60%)",
          border: "1px solid rgba(25,227,255,0.4)",
          borderRadius: 14,
          color: "#fff",
        }}
      >
        <img
          src="/icons/apple-touch-icon.png"
          alt=""
          width={38}
          height={38}
          style={{ borderRadius: 9, display: "block", flex: "none" }}
        />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span
            className="display"
            style={{ display: "block", fontSize: "0.95rem", color: "#fff", lineHeight: 1.15 }}
          >
            Install app
          </span>
          <span style={{ display: "block", fontSize: "0.76rem", color: "#9a9aa2", marginTop: 2 }}>
            Add Zaylist to your home screen — full-screen, one tap away.
          </span>
        </span>
        <span aria-hidden="true" style={{ color: "#19E3FF", fontSize: "1.1rem", flex: "none" }}>
          ›
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="install-card-title"
          onClick={() => setOpen(false)}
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
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(520px, 100%)",
              maxHeight: "90vh",
              overflowY: "auto",
              border: "3px solid var(--neon-cyan, #19E3FF)",
              background: "#050505",
              boxShadow: "0 0 36px rgba(25,227,255,0.24), 0 0 60px rgba(255,0,204,0.12)",
              padding: 24,
              position: "relative",
            }}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
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

            <div
              className="sticker"
              style={{ color: "#19E3FF", borderColor: "#19E3FF", marginBottom: 14 }}
            >
              {isIos ? "IPHONE SETUP" : "ANDROID"}
            </div>

            <h2
              id="install-card-title"
              className="display"
              style={{
                color: "#fff",
                fontSize: "clamp(1.6rem, 6vw, 2.4rem)",
                lineHeight: 1.05,
                marginBottom: 14,
              }}
            >
              {isIos ? "SAVE AS WEB APP" : "INSTALL PRIDE GUIDE"}
            </h2>

            <p style={{ color: "#bbb", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: isIos ? 10 : 16 }}>
              {isIos
                ? "Add Zaylist to your home screen — opens full-screen like a real app, one tap away, and unlocks push alerts. iPhone does this from Safari's Share button:"
                : "Add Zaylist to your home screen for a full-screen app with a launcher badge:"}
            </p>

            {isIos && (
              <p
                style={{
                  color: "#FF00CC",
                  fontSize: "0.86rem",
                  fontStyle: "italic",
                  lineHeight: 1.5,
                  marginBottom: 18,
                }}
              >
                IYKYK — it's the same move as saving Sniffies to your home screen. 😏
              </p>
            )}

            {!isIos && installReady && (
              <button
                type="button"
                className="btn-neon solid"
                disabled={busy}
                onClick={installNative}
                style={{
                  borderColor: "#19E3FF",
                  background: "#19E3FF",
                  color: "#000",
                  width: "100%",
                  marginBottom: 16,
                }}
              >
                {busy ? "OPENING…" : "INSTALL APP"}
              </button>
            )}

            {!isIos && (
              <p style={{ color: "#8a8a92", fontSize: "0.82rem", lineHeight: 1.5, marginBottom: 12 }}>
                {installReady
                  ? "Or do it yourself:"
                  : "Your browser will offer a one-tap Install once it's ready — or do it now:"}
              </p>
            )}

            <InstallSteps steps={isIos ? IOS_STEPS : ANDROID_STEPS} />

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
              <button
                type="button"
                className="btn-neon"
                onClick={() => setOpen(false)}
                style={{ color: "#aaa", borderColor: "#444" }}
              >
                GOT IT
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
