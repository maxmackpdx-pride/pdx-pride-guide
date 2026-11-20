import { createRoot } from "react-dom/client";
import ErrorBoundary from "./components/ErrorBoundary";
import App from "./App";

import {
  installScrollRecenterListeners,
  scheduleScrollReset,
  ensurePageCentered,
} from "./lib/resetPageScroll";
import { captureInstallPrompt, registerServiceWorker } from "./lib/pwa";
import { listenForPushSubscriptionChanges } from "./lib/pushNotifications";
import { installStaleAssetRecovery } from "./lib/lazyWithReload";
import "./fonts.css";
import "./index.css";
import "./layout-end.css";
// hub-shell.css must load globally: the shared site header's mobile auth
// controls (the Join / sign-in button, hub and inbox links, profile menu)
// are styled by it on every route, not just inside HubShell. Removing
// this import (Nov 19 perf pass) left the Join button unstyled — black
// default text on transparent, a 25px ghost — on every page.
import "./components/hub/hub-shell.css";
import "@/components/ds/tokens/index.css";
import "@/components/ds/adapters/listing-card.css";
import "./fluent2-m3-cards.css";
import "./components/nav.css";
import "./section-consistency.css";
import "./polish-continuity.css";
import "@/components/ds/tokens/buttons.css";
import "@/components/ds/card-secondary.css";
import "@/components/CardInteractionMotion.css";

// Fluent 2 depth + Material 3 states, governed by Zaylist color semantics.
document.documentElement.dataset.zaylistCards = "fluent2-m3";

// Install before React renders and requests any route-level JS or CSS chunks.
installStaleAssetRecovery();

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

// Pin once on boot; delayed top:0 spam was causing pages to jump upward while scrolling
scheduleScrollReset();
window.addEventListener("load", () => {
  ensurePageCentered();
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
