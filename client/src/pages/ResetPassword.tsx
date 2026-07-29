import { useState } from "react";
import { Link } from "wouter";

export default function ResetPassword() {
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) return setError("Passwords do not match.");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(data?.error || "Could not reset password");
      setDone(true);
    } catch (err: any) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  return (
    <section style={{ maxWidth: 520, margin: "64px auto", padding: "0 20px" }}>
      <div style={{ background: "#fff", color: "#000", border: "3px solid #000", boxShadow: "8px 8px 0 #00FFFF", padding: 32 }}>
        <p style={{ margin: 0, fontWeight: 900, letterSpacing: ".12em" }}>ZAYLIST</p>
        <h1 style={{ margin: "18px 0 10px", fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 900 }}>RESET PASSWORD</h1>
        {done ? (
          <>
            <p>Your password has been updated.</p>
            <Link href="/?auth=login" style={buttonStyle}>LOG IN →</Link>
          </>
        ) : (
          <form onSubmit={submit}>
            <label style={labelStyle}>New password</label>
            <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={6} required autoComplete="new-password" />
            <label style={labelStyle}>Enter password again</label>
            <input style={inputStyle} type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={6} required autoComplete="new-password" />
            {!token && <div style={errorStyle}>This reset link is incomplete.</div>}
            {error && <div style={errorStyle}>{error}</div>}
            <button type="submit" disabled={loading || !token} style={buttonStyle}>{loading ? "UPDATING..." : "UPDATE PASSWORD →"}</button>
          </form>
        )}
      </div>
    </section>
  );
}

const labelStyle: React.CSSProperties = { display: "block", margin: "16px 0 5px", fontWeight: 900, fontSize: ".75rem", letterSpacing: ".08em", textTransform: "uppercase" };
const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "2px solid #000", padding: "11px 12px", fontSize: "1rem" };
const buttonStyle: React.CSSProperties = { display: "inline-block", marginTop: 20, padding: "13px 18px", background: "#CCFF00", color: "#000", border: "2px solid #000", boxShadow: "3px 3px 0 #000", fontWeight: 900, textDecoration: "none", cursor: "pointer" };
const errorStyle: React.CSSProperties = { marginTop: 12, padding: "9px 12px", background: "#FF0040", color: "#fff" };
