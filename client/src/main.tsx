import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const claimRoute = decodeURIComponent(window.location.hash || "").match(/^#\/submit\?mode=claim&eventId=(\d+)/);

if (claimRoute) {
  window.location.hash = `#/submit/claim/${claimRoute[1]}`;
} else if (!window.location.hash) {
  window.location.hash = "#/";
}

createRoot(document.getElementById("root")!).render(<App />);
