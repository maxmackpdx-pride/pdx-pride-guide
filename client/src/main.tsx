import { createRoot } from "react-dom/client";
import App from "./App";
import { resetPageScroll } from "./lib/resetPageScroll";
import "./index.css";

// Prevent the browser from restoring a previous scroll position on
// reload / back-forward navigation so every page load starts at the top.
if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

const claimRoute = decodeURIComponent(window.location.hash || "").match(/^#\/submit\?mode=claim&eventId=(\d+)/);

if (claimRoute) {
  window.location.hash = `#/submit/claim/${claimRoute[1]}`;
} else if (!window.location.hash) {
  window.location.hash = "#/";
}

resetPageScroll();
requestAnimationFrame(resetPageScroll);
window.addEventListener("load", resetPageScroll, { once: true });

document.querySelector("[data-crawler-feed]")?.remove();

createRoot(document.getElementById("root")!).render(<App />);
