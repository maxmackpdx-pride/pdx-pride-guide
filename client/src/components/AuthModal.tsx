import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface AuthModalProps {
  onClose: () => void;
  defaultTab?: "login" | "register";
}

export default function AuthModal({ onClose, defaultTab = "login" }: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "register">(defaultTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await login(email, password);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await register(username, email, password, displayName || undefined);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(4px)",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#fff", color: "#000",
        border: "3px solid #000",
        boxShadow: "6px 6px 0 #CCFF00",
        width: "100%", maxWidth: 420, padding: "36px 32px",
        position: "relative",
      }}>
        {/* Close */}
        <button onClick={onClose} style={{
          position: "absolute", top: 12, right: 16,
          background: "none", border: "none", fontSize: "1.4rem", cursor: "pointer", color: "#000",
        }}>×</button>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, marginBottom: 28, borderBottom: "2px solid #000" }}>
          {(["login", "register"] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setError(""); setConfirmPassword(""); }} style={{
              flex: 1, fontFamily: "var(--font-display)", fontWeight: 900,
              fontSize: "1rem", letterSpacing: "0.1em", textTransform: "uppercase",
              padding: "10px 0", border: "none", cursor: "pointer",
              background: tab === t ? "#CCFF00" : "transparent",
              color: "#000", borderBottom: tab === t ? "2px solid #000" : "none",
              marginBottom: -2,
            }}>{t === "login" ? "LOG IN" : "JOIN"}</button>
          ))}
        </div>

        {tab === "login" ? (
          <form onSubmit={handleLogin}>
            <a href="/api/auth/google" style={googleButtonStyle}>
              CONTINUE WITH GOOGLE
            </a>
            <div style={dividerStyle}><span>OR</span></div>
            <label style={labelStyle}>Username or Email</label>
            <input style={inputStyle} type="text" value={email} onChange={e => setEmail(e.target.value)} required placeholder="username or you@example.com" autoComplete="username" />
            <label style={labelStyle}>Password</label>
            <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
            {error && <div style={errorStyle}>{error}</div>}
            <button type="submit" disabled={loading} style={submitStyle}>
              {loading ? "LOGGING IN..." : "LOG IN →"}
            </button>
            <div style={{ textAlign: "center", marginTop: 16, fontSize: "0.82rem", color: "var(--text-meta)" }}>
              No account?{" "}
              <span onClick={() => { setTab("register"); setError(""); }} style={{ color: "#000", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>
                Join free
              </span>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <a href="/api/auth/google" style={googleButtonStyle}>
              JOIN WITH GOOGLE
            </a>
            <div style={dividerStyle}><span>OR</span></div>
            <label style={labelStyle}>Username</label>
            <input style={inputStyle} type="text" value={username} onChange={e => setUsername(e.target.value)} required placeholder="queerbabe99" minLength={3} />
            <label style={labelStyle}>Display Name <span style={{ color: "#aaa", fontWeight: 400 }}>(optional)</span></label>
            <input style={inputStyle} type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="How you want to appear" />
            <label style={labelStyle}>Email</label>
            <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
            <label style={labelStyle}>Password</label>
            <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min 6 characters" minLength={6} />
            <label style={labelStyle}>Enter Password Again</label>
            <input style={inputStyle} type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="Repeat password" minLength={6} />
            {error && <div style={errorStyle}>{error}</div>}
            <button type="submit" disabled={loading} style={submitStyle}>
              {loading ? "JOINING..." : "JOIN THE GUIDE →"}
            </button>
            <div style={{ textAlign: "center", marginTop: 16, fontSize: "0.82rem", color: "var(--text-meta)" }}>
              Already have an account?{" "}
              <span onClick={() => { setTab("login"); setError(""); }} style={{ color: "#000", fontWeight: 700, cursor: "pointer", textDecoration: "underline" }}>
                Log in
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", fontFamily: "var(--font-display)", fontWeight: 900,
  fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase",
  marginBottom: 4, marginTop: 14, color: "#000",
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", border: "2px solid #000",
  fontSize: "0.95rem", fontFamily: "var(--font-body)", background: "#fff",
  color: "#000", outline: "none", boxSizing: "border-box",
};
const googleButtonStyle: React.CSSProperties = {
  display: "block", width: "100%", padding: "13px", boxSizing: "border-box",
  background: "#fff", color: "#000", border: "2px solid #000",
  fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "0.95rem",
  letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer",
  textAlign: "center", textDecoration: "none", boxShadow: "3px 3px 0 #00FFFF",
};
const dividerStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center",
  margin: "18px 0 4px", color: "var(--text-muted)", fontFamily: "var(--font-display)",
  fontSize: "0.68rem", letterSpacing: "0.12em",
};
const submitStyle: React.CSSProperties = {
  width: "100%", marginTop: 20, padding: "14px",
  background: "#CCFF00", color: "#000", border: "2px solid #000",
  fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "1rem",
  letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
  boxShadow: "3px 3px 0 #000",
};
const errorStyle: React.CSSProperties = {
  marginTop: 10, padding: "8px 12px", background: "#FF0040",
  color: "#fff", fontSize: "0.82rem", fontFamily: "var(--font-body)",
};
