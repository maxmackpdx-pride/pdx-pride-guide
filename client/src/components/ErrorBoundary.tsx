import { Component, type ReactNode } from "react";
import PageRecovery from "@/components/PageRecovery";

export default class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) {
    // Self-report crashes to the private diagnostic stream. Machine telemetry
    // must never appear as a message from a person in the Owner Desk.
    try {
      fetch("/api/system-diagnostics/client-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: error.message,
          stack: (error.stack || "").slice(0, 8000),
          pageUrl: window.location.href,
          userAgent: navigator.userAgent,
        }),
      }).catch(() => {});
    } catch { /* never let reporting throw */ }
  }
  render() {
    const error = this.state.error;
    if (error) {
      const showStack = import.meta.env.DEV;
      return (
        <div>
          <PageRecovery section="Zaylist" title="This page needs a fresh start." description="Something interrupted this page. Try loading it again, or head home to explore another part of Zaylist." href="/" label="Back to Zaylist" missing={false} retry={() => window.location.reload()} />
          {showStack ? (
            <pre style={{ marginTop: 28, maxWidth: "100%", overflow: "auto", textAlign: "left", fontSize: 10, lineHeight: 1.5, color: "#888", background: "#111", border: "1px solid #222", borderRadius: 6, padding: "10px 14px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {error.message}
              {"\n"}
              {(error.stack || "").split("\n").slice(1, 4).join("\n")}
            </pre>
          ) : null}
        </div>
      );
    }
    return this.props.children;
  }
}
