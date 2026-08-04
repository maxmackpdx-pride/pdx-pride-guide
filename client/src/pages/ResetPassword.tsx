import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";

export default function ResetPassword() {
  const token = useMemo(() => new URLSearchParams(window.location.search).get("token") || "", []);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Reset password · Zaylist";
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!token) return setError("This reset link is invalid or expired.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({})) as { error?: string };
      if (!res.ok) throw new Error(data.error || "This reset link is invalid or expired.");
      window.history.replaceState({}, "", "/reset-password");
      setDone(true);
    } catch (err: any) {
      setError(err.message || "This reset link is invalid or expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={pageStyle}>
      <div style={cardStyle}>
        <p style={kickerStyle}>ACCOUNT RECOVERY</p>
        <h1 style={titleStyle}>{done ? "PASSWORD UPDATED" : "RESET PASSWORD"}</h1>
        {done ? (
          <>
            <p>Your password has been changed. Return to Zaylist and log in with the new password.</p>
            <Link href="/" style={actionStyle}>RETURN TO ZAYLIST →</Link>
          </>
        ) : (
          <form onSubmit={submit}>
            <p style={{ color: "#c8c4bb" }}>Choose a new password. This one-time link expires after use.</p>
            <label style={labelStyle}>New password</label>
            <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={6} required autoComplete="new-password" />
            <label style={labelStyle}>Enter it again</label>
            <input style={inputStyle} type="password" value={confirm} onChange={e => setConfirm(e.target.value)} minLength={6} required autoComplete="new-password" />
            {error && <div role="alert" style={errorStyle}>{error}</div>}
            <button style={buttonStyle} disabled={loading}>{loading ? "UPDATING..." : "UPDATE PASSWORD →"}</button>
          </form>
        )}
      </div>
    </section>
  );
}

const pageStyle: React.CSSProperties = { minHeight: "70vh", display: "grid", placeItems: "center", padding: "48px 20px", background: "#050505", color: "#f4eee1" };
const cardStyle: React.CSSProperties = { width: "100%", maxWidth: 520, padding: 32, background: "#0c0c0f", border: "1px solid #2b2b2b", boxShadow: "0 0 0 2px #000" };
const kickerStyle: React.CSSProperties = { color: "#00ffff", fontFamily: "var(--font-display)", fontWeight: 900, letterSpacing: ".12em", fontSize: 12 };
const titleStyle: React.CSSProperties = { margin: "8px 0 24px", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "clamp(2.5rem, 8vw, 4.5rem)", lineHeight: .9 };
const labelStyle: React.CSSProperties = { display: "block", margin: "18px 0 6px", fontFamily: "var(--font-display)", fontWeight: 900, textTransform: "uppercase", letterSpacing: ".08em" };
const inputStyle: React.CSSProperties = { width: "100%", minHeight: 48, padding: "10px 12px", background: "#050505", color: "#fff", border: "1px solid #666", fontSize: 16 };
const buttonStyle: React.CSSProperties = { width: "100%", minHeight: 48, marginTop: 22, border: "2px solid #000", background: "#ccff00", color: "#050505", fontFamily: "var(--font-display)", fontWeight: 900, letterSpacing: ".08em", cursor: "pointer" };
const actionStyle: React.CSSProperties = { ...buttonStyle, display: "grid", placeItems: "center", textDecoration: "none" };
const errorStyle: React.CSSProperties = { marginTop: 14, padding: 12, background: "#ff244d", color: "#fff" };
