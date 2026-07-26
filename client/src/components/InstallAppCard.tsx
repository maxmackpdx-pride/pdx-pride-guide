import { useEffect, useState } from "react";
import { isAndroidDevice, isIosDevice, isStandalonePwa } from "@/lib/pwa";
import InstallModal from "@/components/pwa/InstallModal";

/**
 * Compact "Install app" card for the mobile web — sits above the weather widget
 * in the hub feed. Tapping it opens the shared install modal (Save as Web App /
 * Add to Home Screen). Hidden on desktop and inside the installed PWA.
 */
export default function InstallAppCard() {
  const [show, setShow] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Only on a phone browser — never on desktop, never inside the installed app.
    if (isStandalonePwa()) return;
    if (isIosDevice() || isAndroidDevice()) setShow(true);
  }, []);

  if (!show) return null;

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
            Add Zaylist to your home screen. Full-screen, one tap away.
          </span>
        </span>
        <span aria-hidden="true" style={{ color: "#19E3FF", fontSize: "1.1rem", flex: "none" }}>
          ›
        </span>
      </button>

      <InstallModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
