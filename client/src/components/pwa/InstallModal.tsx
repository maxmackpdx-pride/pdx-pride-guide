import { useCallback, useEffect, useState } from "react";
import { hasInstallPrompt, isIosDevice, promptInstall } from "@/lib/pwa";
import { ANDROID_STEPS, InstallSteps, IOS_STEPS } from "@/components/pwa/installSteps";
import { useModalA11y } from "@/hooks/useModalA11y";

/**
 * Shared "Save as Web App" / "Add to Home Screen" modal. Opened by the hub
 * InstallAppCard and the home-hero DOWNLOAD APP button. Compact so it fits a
 * phone without feeling oversized. Renders nothing when closed.
 */
export default function InstallModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const isIos = isIosDevice();
  const [installReady, setInstallReady] = useState(false); // Android native prompt captured
  const [busy, setBusy] = useState(false);
  const handleClose = useCallback(() => onClose(), [onClose]);
  const dialogRef = useModalA11y({ open, onClose: handleClose, enabled: open });

  useEffect(() => {
    if (!open || isIos) return;
    setInstallReady(hasInstallPrompt());
    const onAvailable = () => setInstallReady(true);
    window.addEventListener("pdx-pwa-install-available", onAvailable);
    return () => window.removeEventListener("pdx-pwa-install-available", onAvailable);
  }, [open, isIos]);

  if (!open) return null;

  const installNative = async () => {
    setBusy(true);
    try {
      const outcome = await promptInstall();
      if (outcome === "accepted") onClose();
      if (outcome === "unavailable") setInstallReady(false); // fall back to manual steps
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2100,
        background: "rgba(0,0,0,0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(460px, 100%)",
          maxHeight: "88vh",
          overflowY: "auto",
          border: "3px solid var(--neon-cyan, #19E3FF)",
          background: "#050505",
          boxShadow: "0 0 30px rgba(25,227,255,0.22), 0 0 52px rgba(255,0,204,0.1)",
          padding: 18,
          position: "relative",
        }}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          style={{
            position: "absolute",
            top: 9,
            right: 9,
            background: "transparent",
            border: "1px solid #333",
            color: "#999",
            width: 28,
            height: 28,
            cursor: "pointer",
          }}
        >
          X
        </button>

        <div className="sticker" style={{ color: "#19E3FF", borderColor: "#19E3FF", marginBottom: 12 }}>
          {isIos ? "IPHONE SETUP" : "ANDROID"}
        </div>

        <h2
          id="install-modal-title"
          className="display"
          style={{ color: "#fff", fontSize: "clamp(1.35rem, 5vw, 1.9rem)", lineHeight: 1.05, marginBottom: 10 }}
        >
          Install Zaylist
        </h2>

        <p style={{ color: "#bbb", fontSize: "0.9rem", lineHeight: 1.5, marginBottom: isIos ? 8 : 14 }}>
          {isIos
            ? "Add Zaylist to your home screen. Opens full-screen like a real app, one tap away, and unlocks push alerts. iPhone does this from Safari's Share button:"
            : "Add Zaylist to your home screen for a full-screen app with a launcher badge:"}
        </p>

        {isIos && (
          <p style={{ color: "#FF00CC", fontSize: "0.82rem", fontStyle: "italic", lineHeight: 1.45, marginBottom: 14 }}>
            IYKYK, it's the same move as saving Sniffies to your home screen. 😏
          </p>
        )}

        {!isIos && installReady && (
          <button
            type="button"
            className="btn-neon solid pdx-glass-rebind"
            disabled={busy}
            onClick={installNative}
            style={{ borderColor: "#19E3FF", background: "#19E3FF", color: "#000", width: "100%", marginBottom: 14 }}
          >
            {busy ? "OPENING…" : "INSTALL APP"}
          </button>
        )}

        {!isIos && (
          <p style={{ color: "#8a8a92", fontSize: "0.8rem", lineHeight: 1.45, marginBottom: 10 }}>
            {installReady ? "Or do it yourself:" : "Your browser will offer a one-tap Install once it's ready, or do it now:"}
          </p>
        )}

        <InstallSteps steps={isIos ? IOS_STEPS : ANDROID_STEPS} compact />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
          <button
            type="button"
            className="btn-neon pdx-glass-rebind"
            onClick={onClose}
            style={{ color: "#aaa", borderColor: "#444" }}
          >
            GOT IT
          </button>
        </div>
      </div>
    </div>
  );
}
