import type { CSSProperties } from "react";

export type GlassAccent = string;

/** Imperative consumers share the same landed paint tokens as the CSS API.
 * The accent binds locally even when the style is applied inside a portal. */
export function glass(accent: GlassAccent): string {
  return [
    `--piece:${accent}`,
    "position:relative",
    "overflow:visible",
    "border-radius:var(--glass-lens-radius)",
    "background:var(--glass-dark-fill)",
    "border:1px solid var(--piece)",
    "box-shadow:0 0 0 2px var(--z-black), inset 0 1px 0 color-mix(in srgb,var(--text-hi) 51%,transparent), 0 0 35px color-mix(in srgb,var(--piece) 18.7%,transparent), inset 0 0 30px color-mix(in srgb,var(--piece) 17%,transparent)",
    "backdrop-filter:var(--glass-filter)",
    "-webkit-backdrop-filter:var(--glass-filter)",
    `--c:${accent}`,
  ].join("; ");
}

export function glassNeutral(): string { return glass("var(--glass-neutral-c2)"); }
export const glassGrey = glassNeutral;

export function glassSheenPrimary(): string {
  return "position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:2;background:var(--glass-sheen)";
}
export function glassSheenSpecular(accent?: GlassAccent): string {
  return `position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:2;background:radial-gradient(70% 55% at 108% 112%,color-mix(in srgb,${accent ?? "var(--c)"} 6%,transparent),transparent 70%)`;
}

export function glassBtn(accent: GlassAccent): string {
  return `--piece:${accent}; color:var(--text-inverse); background:var(--piece); border:1px solid var(--piece); box-shadow:var(--glass-btn-shadow)`;
}
export function glassBtnOutline(accent: GlassAccent): string {
  return `--piece:${accent}; color:var(--piece); background:var(--glass-dark-fill); border:1px solid var(--piece); box-shadow:var(--glass-btn-shadow); backdrop-filter:var(--glass-filter)`;
}

/** React-friendly style objects (same recipes). */
export function glassStyle(accent: GlassAccent): CSSProperties {
  return cssStringToObject(glass(accent));
}

export function glassNeutralStyle(): CSSProperties {
  return cssStringToObject(glassNeutral());
}

export function glassBtnStyle(accent: GlassAccent): CSSProperties {
  return cssStringToObject(glassBtn(accent));
}

export function glassBtnOutlineStyle(accent: GlassAccent): CSSProperties {
  return cssStringToObject(glassBtnOutline(accent));
}

function cssStringToObject(css: string): CSSProperties {
  const out: Record<string, string> = {};
  for (const part of css.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const colon = trimmed.indexOf(":");
    if (colon < 0) continue;
    const key = trimmed.slice(0, colon).trim();
    const val = trimmed.slice(colon + 1).trim();
    if (key.startsWith("--")) {
      out[key] = val;
    } else {
      const camel = key.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
      out[camel] = val;
    }
  }
  return out as CSSProperties;
}
