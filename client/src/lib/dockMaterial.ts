import { createContext } from "react";
export type DockMaterial = "m3" | "hybrid";
export const DockMaterialContext = createContext<DockMaterial>("m3");
// CSS.supports alone is a false positive in WebKit: bug 245510.
export function supportsDockRefraction() {
  return typeof navigator !== "undefined" && /Chrome\//.test(navigator.userAgent)
    && !/iPhone|iPad|iPod/.test(navigator.userAgent)
    && !(navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    && typeof CSS !== "undefined" && CSS.supports("backdrop-filter", "url(#dock-probe)");
}
export function dockOpticalParameters(height: number, speed: number, material: DockMaterial) {
  const motion = Math.min(1, Math.abs(speed) / 1.8);
  return {
    // 80% stronger bending without clipping the normalized displacement map.
    scale: Math.min(material === "m3" ? 23 : 40, height * .5) * 1.8,
    separation: (material === "m3" ? .6 : 1.6) + motion * (material === "m3" ? 1.2 : 3.4),
    stretch: 1 + motion * (material === "m3" ? .10 : .28),
  };
}

