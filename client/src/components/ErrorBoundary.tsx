import { Component, type ReactNode } from "react";

export default class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) {
    // Self-report crashes so they show up in admin feedback reports.
    try {
      fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "CRASH",
          severity: "HIGH",
          message: `${error.message}\n${(error.stack || "").slice(0, 1500)}`,
          pageUrl: window.location.href,
          userAgent: navigator.userAgent,
        }),
      }).catch(() => {});
    } catch { /* never let reporting throw */ }
  }
  render() {
    const error = this.state.error;
    if (error) {
      return (
        <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0a0a0a", color: "#fff", fontFamily: "sans-serif", textAlign: "center", padding: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏳️‍🌈</div>
          <h1 style={{ marginBottom: 8 }}>Something went sideways</h1>
          <p style={{ opacity: 0.6, marginBottom: 24 }}>An unexpected error occurred. Try refreshing the page.</p>
          <button onClick={() => window.location.reload()} style={{ background: "#C8FA3C", color: "#000", border: "none", borderRadius: 6, padding: "10px 24px", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
            Reload page
          </button>
          <pre style={{ marginTop: 28, maxWidth: "100%", overflow: "auto", textAlign: "left", fontSize: 10, lineHeight: 1.5, color: "#888", background: "#111", border: "1px solid #222", borderRadius: 6, padding: "10px 14px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {error.message}
            {"\n"}
            {(error.stack || "").split("\n").slice(1, 4).join("\n")}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
