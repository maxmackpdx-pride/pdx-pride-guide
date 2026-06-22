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

export default function FeedbackForm({ compact = false }: { compact?: boolean }) {
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
    } catch {
      setStatus("error");
    }
  };

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 10, maxWidth: compact ? 560 : 720 }}>
      <div style={{ display: "grid", gridTemplateColumns: compact ? "1fr 1fr" : "repeat(3, 1fr)", gap: 8 }}>
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
        <input
          value={form.email}
          onChange={e => update("email", e.target.value)}
          placeholder="Email optional"
          type="email"
          style={{ ...fieldStyle, gridColumn: compact ? "1 / -1" : "auto" }}
        />
      </div>
      <textarea
        value={form.message}
        onChange={e => update("message", e.target.value)}
        required
        rows={compact ? 3 : 4}
        placeholder="What broke, looked weird, or felt confusing?"
        style={{ ...fieldStyle, resize: "vertical" }}
      />
      <textarea
        value={form.steps}
        onChange={e => update("steps", e.target.value)}
        rows={compact ? 2 : 3}
        placeholder="Steps to reproduce, device/browser, screenshots link, or what you expected."
        style={{ ...fieldStyle, resize: "vertical" }}
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="btn-neon"
        style={{ justifyContent: "center", color: "#00FFFF", borderColor: "#00FFFF", opacity: status === "sending" ? 0.65 : 1 }}
      >
        {status === "sending" ? "SENDING..." : "SUBMIT TECH FEEDBACK"}
      </button>
      {status === "sent" && <div className="display" style={{ color: "#CCFF00", fontSize: "0.78rem" }}>Got it. Thank you for helping us sand the sharp edges.</div>}
      {status === "error" && <div className="display" style={{ color: "#FF2400", fontSize: "0.78rem" }}>That did not send. Please try once more.</div>}
    </form>
  );
}
