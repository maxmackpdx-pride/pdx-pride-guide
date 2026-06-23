import { useState } from "react";

const fieldStyle = {
  width: "100%",
  background: "#050505",
  border: "1px solid #222",
  color: "#fff",
  padding: "9px 10px",
  fontSize: "0.82rem",
  boxSizing: "border-box" as const,
};

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="display"
        style={{
          background: "none",
          border: "1px solid #333",
          color: "#00FFFF",
          padding: "8px 18px",
          fontSize: "0.78rem",
          letterSpacing: "0.08em",
          cursor: "pointer",
          transition: "border-color 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = "#00FFFF")}
        onMouseLeave={e => (e.currentTarget.style.borderColor = "#333")}
      >
        REPORT A BUG / SEND FEEDBACK
      </button>
      {open && <FeedbackModal onClose={() => setOpen(false)} />}
    </>
  );
}

function FeedbackModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    category: "BUG",
    severity: "MEDIUM",
    message: "",
    steps: "",
    email: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const update = (key: keyof typeof form, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          pageUrl: window.location.href,
          userAgent: navigator.userAgent,
        }),
      });
      if (!res.ok) throw new Error("Feedback failed");
      setForm(prev => ({ ...prev, message: "", steps: "" }));
      setStatus("sent");
      setTimeout(onClose, 1800);
    } catch {
      setStatus("error");
    }
  };

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.82)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
      }}
    >
      <div style={{
        background: "#0a0a0a",
        border: "2px solid #00FFFF",
        maxWidth: 520, width: "100%",
        padding: "28px 24px",
        position: "relative",
      }}>
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 12, right: 14,
            background: "none", border: "none", color: "#555",
            fontSize: "1.2rem", cursor: "pointer", lineHeight: 1,
          }}
        >✕</button>
        <div className="display" style={{ color: "#00FFFF", fontSize: "1.1rem", marginBottom: 6 }}>
          SOFT LAUNCH TECH FEEDBACK
        </div>
        <p style={{ color: "#888", fontSize: "0.82rem", lineHeight: 1.5, marginBottom: 16 }}>
          Hit a broken button, weird mobile layout, wrong event detail, login issue, or confusing flow?
        </p>
        <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <select value={form.category} onChange={e => update("category", e.target.value)} style={fieldStyle} aria-label="Feedback category">
              <option value="BUG">Bug / broken thing</option>
              <option value="MOBILE">Mobile layout</option>
              <option value="DATA">Wrong event data</option>
              <option value="AUTH">Login/account</option>
              <option value="IDEA">Idea / polish</option>
            </select>
            <select value={form.severity} onChange={e => update("severity", e.target.value)} style={fieldStyle} aria-label="Feedback severity">
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="BLOCKER">Blocker</option>
            </select>
          </div>
          <input
            value={form.email}
            onChange={e => update("email", e.target.value)}
            placeholder="Email (optional)"
            type="email"
            style={fieldStyle}
          />
          <textarea
            value={form.message}
            onChange={e => update("message", e.target.value)}
            required
            rows={3}
            placeholder="What broke, looked weird, or felt confusing?"
            style={{ ...fieldStyle, resize: "vertical" }}
          />
          <textarea
            value={form.steps}
            onChange={e => update("steps", e.target.value)}
            rows={2}
            placeholder="Steps to reproduce, device/browser, or what you expected."
            style={{ ...fieldStyle, resize: "vertical" }}
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="btn-neon"
            style={{ justifyContent: "center", color: "#00FFFF", borderColor: "#00FFFF", opacity: status === "sending" ? 0.65 : 1 }}
          >
            {status === "sending" ? "SENDING..." : "SUBMIT FEEDBACK"}
          </button>
          {status === "sent" && <div className="display" style={{ color: "#CCFF00", fontSize: "0.78rem" }}>Got it. Thank you for helping us sand the sharp edges.</div>}
          {status === "error" && <div className="display" style={{ color: "#FF2400", fontSize: "0.78rem" }}>That did not send. Please try once more.</div>}
        </form>
      </div>
    </div>
  );
}

export default FeedbackModal;
