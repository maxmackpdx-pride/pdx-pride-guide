import { createRoot } from "react-dom/client";
import { Component, type ReactNode } from "react";
import App from "./App";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0a0a0a", color: "#fff", fontFamily: "sans-serif", textAlign: "center", padding: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏳️‍🌈</div>
          <h1 style={{ marginBottom: 8 }}>Something went sideways</h1>
          <p style={{ opacity: 0.6, marginBottom: 24 }}>An unexpected error occurred. Try refreshing the page.</p>
          <button onClick={() => window.location.reload()} style={{ background: "#C8FA3C", color: "#000", border: "none", borderRadius: 6, padding: "10px 24px", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
import { resetPageScroll } from "./lib/resetPageScroll";
import "./fonts.css";
import "./index.css";

// Prevent the browser from restoring a previous scroll position on
// reload / back-forward navigation so every page load starts at the top.
if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

// Migrate legacy hash routes (#/events → /events) and claim query URLs.
if (typeof window !== "undefined") {
  const { pathname, search, hash } = window.location;

  const hashClaim = decodeURIComponent(hash || "").match(/^#\/submit\?mode=claim&eventId=(\d+)/);
  if (hashClaim) {
    window.history.replaceState(null, "", `/submit/claim/${hashClaim[1]}`);
  } else if (hash.startsWith("#/")) {
    const target = hash.slice(1) + search;
    window.history.replaceState(null, "", target);
  } else {
    const params = new URLSearchParams(search);
    if (pathname === "/submit" && params.get("mode") === "claim" && params.get("eventId")) {
      window.history.replaceState(null, "", `/submit/claim/${params.get("eventId")}`);
    }
  }
}

resetPageScroll();
requestAnimationFrame(resetPageScroll);
window.addEventListener("load", resetPageScroll, { once: true });

document.querySelector("[data-crawler-feed]")?.remove();

createRoot(document.getElementById("root")!).render(<ErrorBoundary><App /></ErrorBoundary>);