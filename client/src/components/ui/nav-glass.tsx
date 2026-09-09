import type { PointerEvent } from "react";
import "./zaylist-glass.css";

/** Shared optical layers from Tucker's approved 21st-inspired React demo.
 * Host keeps layout, semantics, routing and focus; only the background is blurred. */
export function NavGlassLayers() {
  return <>
    <span className="z-glass__blur" aria-hidden="true" />
    <span className="z-glass__tint" aria-hidden="true" />
    <span className="z-glass__edge" aria-hidden="true" />
    <span className="z-glass__pointer" aria-hidden="true" />
    <span className="z-glass__rainbow" aria-hidden="true" />
  </>;
}

export function navGlassPointer(event: PointerEvent<HTMLElement>) {
  const host = event.currentTarget;
  if (event.type === "pointerleave") { host.style.setProperty("--pointer-presence", "0"); return; }
  if (event.pointerType !== "mouse" || matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.matches(".calm-mode, [data-calm=true]")) return;
  const box = host.getBoundingClientRect();
  host.style.setProperty("--pointer-x", `${event.clientX - box.left}px`);
  host.style.setProperty("--pointer-y", `${event.clientY - box.top}px`);
  host.style.setProperty("--pointer-presence", "1");
}
