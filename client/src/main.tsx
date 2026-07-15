import { createRoot } from "react-dom/client";
import ErrorBoundary from "./components/ErrorBoundary";
import App from "./App";

import {
  installScrollRecenterListeners,
  resetPageScroll,
} from "./lib/resetPageScroll";
import { captureInstallPrompt, registerServiceWorker } from "./lib/pwa";
import { listenForPushSubscriptionChanges } from "./lib/pushNotifications";
import "./fonts.css";
import "./index.css";
import "@/components/hub/hub-shell.css";
import "@/components/ds/tokens/index.css";
import "@/components/ds/adapters/listing-card.css";

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
window.addEventListener("load", () => {
  resetPageScroll();
  requestAnimationFrame(resetPageScroll);
}, { once: true });
installScrollRecenterListeners();

document.querySelector("[data-crawler-feed]")?.remove();

captureInstallPrompt();
const localPreview =
  typeof window !== "undefined"
  && (window as Window & { __PDX_LOCAL_PREVIEW__?: number }).__PDX_LOCAL_PREVIEW__ === 1;
if (import.meta.env.PROD && !localPreview) {
  void registerServiceWorker().then(() => listenForPushSubscriptionChanges());
}

createRoot(document.getElementById("root")!).render(<ErrorBoundary><App /></ErrorBoundary>);
document.getElementById("boot-fallback")?.setAttribute("hidden", "");