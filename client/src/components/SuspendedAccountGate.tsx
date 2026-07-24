import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

/**
 * Hard gate for suspended accounts: no dismiss. Appeal goes to Owner Desk queue.
 */
export default function SuspendedAccountGate() {
  const { user, loading, logout, refreshUser } = useAuth();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  if (loading || !user || user.accountStatus !== "suspended") return null;

  const until =
    user.suspendUntil && Number.isFinite(Date.parse(user.suspendUntil))
      ? new Date(user.suspendUntil).toLocaleString()
      : null;

  const onAppeal = async () => {
    setError("");
    if (body.trim().length < 20) {
      setError("Please write at least 20 characters so we can review your appeal.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/suspension-appeal", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not submit appeal");
      setSent(true);
    } catch (e: any) {
      setError(e?.message || "Could not submit appeal");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="suspend-gate-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 30000,
        background: "#06060a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          border: "2px solid #ff8c00",
          boxShadow: "0 0 40px rgba(255,140,0,0.25)",
          background: "#0c0c12",
          color: "#f4f1ea",
          padding: "24px 22px",
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: "ui-monospace, monospace",
            fontSize: 10,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#ff8c00",
          }}
        >
          Account suspended
        </p>
        <h1
          id="suspend-gate-title"
          style={{
            margin: "8px 0 0",
            fontFamily: "var(--font-display, sans-serif)",
            fontWeight: 900,
            fontSize: "1.6rem",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          You cannot use Zaylist right now
        </h1>
        <p style={{ margin: "12px 0 0", lineHeight: 1.5, color: "#c8c4bb" }}>
          {user.suspendReasonLabel || "Community standards"}
          {user.suspendNote ? `. ${user.suspendNote}` : "."}
        </p>
        {until ? (
          <p style={{ margin: "8px 0 0", fontSize: "0.9rem", color: "#8a8a96" }}>
            Timed until {until} (Pacific). It may lift automatically after that.
          </p>
        ) : (
          <p style={{ margin: "8px 0 0", fontSize: "0.9rem", color: "#8a8a96" }}>
            This suspension has no automatic end date.
          </p>
        )}

        {!sent ? (
          <>
            <label
              style={{
                display: "block",
                marginTop: 18,
                fontFamily: "ui-monospace, monospace",
                fontSize: 10,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#8a8a96",
              }}
            >
              Appeal to admin queue
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              placeholder="Explain what happened and why you believe the suspension should be reviewed…"
              style={{
                width: "100%",
                marginTop: 6,
                padding: 12,
                background: "#000",
                border: "1px solid #333",
                color: "#fff",
                fontSize: "0.95rem",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
            {error ? (
              <p style={{ color: "#ff6b6b", fontSize: "0.88rem", margin: "8px 0 0" }}>{error}</p>
            ) : null}
            <button
              type="button"
              disabled={busy}
              onClick={() => void onAppeal()}
              style={{
                width: "100%",
                marginTop: 12,
                padding: 14,
                background: "#c8fa3c",
                color: "#000",
                border: "none",
                fontFamily: "var(--font-display, sans-serif)",
                fontWeight: 900,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: busy ? "wait" : "pointer",
              }}
            >
              {busy ? "Sending…" : "Send appeal"}
            </button>
          </>
        ) : (
          <p style={{ marginTop: 16, color: "#c8fa3c", lineHeight: 1.45 }}>
            Appeal received. Admins will review it in the moderation queue. You can sign out below
            and come back later.
          </p>
        )}

        <button
          type="button"
          onClick={async () => {
            await logout();
            window.location.href = "/";
          }}
          style={{
            width: "100%",
            marginTop: 12,
            padding: 12,
            background: "transparent",
            color: "#8a8a96",
            border: "1px solid #333",
            fontFamily: "var(--font-display, sans-serif)",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Sign out
        </button>
        <button
          type="button"
          onClick={() => void refreshUser()}
          style={{
            width: "100%",
            marginTop: 8,
            padding: 8,
            background: "transparent",
            color: "#555",
            border: "none",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          Refresh status
        </button>
      </div>
    </div>
  );
}
