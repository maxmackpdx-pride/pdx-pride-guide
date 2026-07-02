import { createRoot } from "react-dom/client";
import ErrorBoundary from "./components/ErrorBoundary";
import App from "./App";

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