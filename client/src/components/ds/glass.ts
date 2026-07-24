/**
 * Deep-glass / OLED-neon surface helpers.
 *
 * Source of truth: docs/handoffs/deep-glass-2026-07-16/
 * (GROK_MIGRATION_PROMPT.md §1 + Card System.html glass()/glassGrey()).
 * Overrides prior locked lite-glass + default brutal CTA chrome.
 *
 * Layout, radii-as-structure, fonts, and type scale are out of scope -
 * these only set fill / edge / bloom / sheen / button chrome.
 *
 * Prefer CSS utilities in tokens/glass.css (set --c / --_c on the node).
 * Use these helpers when you need an inline style string (portal overlays, etc.).
 */

import type { CSSProperties } from "react";

export type GlassAccent = string;

const NEUTRAL_C1 = "#4a4a52";
const NEUTRAL_C2 = "#b8b8c2";

/** Master accented OLED card (reference: glass(c)). */
export function glass(accent: GlassAccent): string {
  const c = accent;
  return [
    "position:relative",
    "border-radius:14px",
    "overflow:visible",
    `--c:${c}`,
    `background:radial-gradient(90% 70% at 50% 46%, #000 0%, #000 34%, #030304 70%, color-mix(in srgb,${c} 6%, #050408) 100%), radial-gradient(120% 78% at 50% 122%, color-mix(in srgb,${c} 18%, transparent), transparent 56%)`,
    `border:1px solid color-mix(in srgb,${c} 55%, #101014)`,
    `box-shadow:0 0 0 2px #000, 0 34px 66px -24px rgba(0,0,0,.95), 0 0 26px -8px color-mix(in srgb,${c} 78%, transparent), 0 0 13px -5px color-mix(in srgb,${c} 78%, transparent), inset 0 1px 0 color-mix(in srgb,${c} 55%, rgba(255,255,255,.12)), inset 0 0 34px -26px color-mix(in srgb,${c} 40%, transparent)`,
    "backdrop-filter:blur(12px)",
    "-webkit-backdrop-filter:blur(12px)",
  ].join("; ");
}

/** Neutral / grey glass (no semantic accent) - glassGrey(). */
export function glassNeutral(): string {
  const c1 = NEUTRAL_C1;
  const c2 = NEUTRAL_C2;
  return [
    "position:relative",
    "border-radius:14px",
    "overflow:visible",
    `--c:${c2}`,
    `background:radial-gradient(90% 70% at 50% 46%, #000 0%, #000 34%, #030304 70%, color-mix(in srgb,${c1} 8%, #050408) 100%), radial-gradient(120% 78% at 50% 122%, color-mix(in srgb,${c1} 20%, transparent), transparent 56%)`,
    `border:1px solid color-mix(in srgb,${c2} 50%, #101014)`,
    `box-shadow:0 0 0 2px #000, 0 34px 66px -24px rgba(0,0,0,.95), 0 0 26px -8px color-mix(in srgb,${c2} 70%, transparent), 0 0 13px -5px color-mix(in srgb,${c2} 70%, transparent), inset 0 1px 0 color-mix(in srgb,${c2} 55%, rgba(255,255,255,.12)), inset 0 0 34px -26px color-mix(in srgb,${c1} 45%, transparent)`,
    "backdrop-filter:blur(12px)",
    "-webkit-backdrop-filter:blur(12px)",
  ].join("; ");
}

/** @deprecated alias - same as glassNeutral */
export const glassGrey = glassNeutral;

/** Top-left diagonal sheen layer (absolute child). */
export function glassSheenPrimary(): string {
  return "position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:2;background:linear-gradient(133deg,rgba(255,255,255,.15),rgba(255,255,255,.03) 12%,transparent 34%)";
}

/** Bottom-right specular sheen (optional second layer). */
export function glassSheenSpecular(accent?: GlassAccent): string {
  const c = accent ?? "var(--c, #fff)";
  return `position:absolute;inset:0;border-radius:inherit;pointer-events:none;z-index:2;background:radial-gradient(70% 55% at 108% 112%,rgba(255,255,255,.1),color-mix(in srgb,${c} 12%,transparent) 40%,transparent 70%)`;
}

/** Primary solid glass button. */
export function glassBtn(accent: GlassAccent): string {
  const c = accent;
  return [
    `color:#050506`,
    `background:linear-gradient(150deg, rgba(255,255,255,.55), rgba(255,255,255,0) 42%), ${c}`,
    `border:1px solid rgba(255,255,255,.35)`,
    `box-shadow:0 0 22px -6px ${c}, inset 0 1px 0 rgba(255,255,255,.7), inset 0 -6px 12px -6px rgba(0,0,0,.35)`,
  ].join("; ");
}

/** Outlined / secondary glass button. */
export function glassBtnOutline(accent: GlassAccent): string {
  const c = accent;
  return [
    `border:1px solid color-mix(in srgb,${c} 55%, transparent)`,
    `color:${c}`,
    `background:linear-gradient(150deg, color-mix(in srgb,${c} 16%, transparent), color-mix(in srgb,${c} 2%, transparent) 46%), rgba(255,255,255,.015)`,
    `box-shadow:inset 0 1px 0 rgba(255,255,255,.14), inset 0 -6px 12px -8px rgba(0,0,0,.5), 0 0 18px -12px ${c}`,
  ].join("; ");
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
