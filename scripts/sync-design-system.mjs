#!/usr/bin/env node
/**
 * Sync design-system/ from live app sources.
 * Run before every Grok push that touches colors, tokens, or Pride week styling.
 *
 * Source of truth chain:
 *   shared/prideWeek.ts → client/src/index.css + client/src/components/ds/tokens
 *   → design-system/tokens/tokens.css + previews/colors.html + chips-effects.html
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const prideWeekPath = join(root, "shared/prideWeek.ts");
const indexCssPath = join(root, "client/src/index.css");
const tokensPath = join(root, "design-system/tokens/tokens.css");
const colorsPreviewPath = join(root, "design-system/previews/colors.html");
const chipsPreviewPath = join(root, "design-system/previews/chips-effects.html");

function read(path) {
  return readFileSync(path, "utf8");
}

function extractPrideDays(ts) {
  const days = [];
  const re = /\{\s*value:\s*"(\w+)"[^}]*color:\s*"([^"]+)"[^}]*textColor:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(ts)) !== null) {
    days.push({ code: m[1], color: m[2], textColor: m[3] });
  }
  if (days.length !== 7) {
    throw new Error(`Expected 7 Pride days in prideWeek.ts, found ${days.length}`);
  }
  return days;
}

function extractCssVar(css, name) {
  const re = new RegExp(`--${name}:\\s*([^;]+);`);
  const m = css.match(re);
  return m ? m[1].trim() : null;
}

function extractNeonTokens(css) {
  const names = [
    "neon-yellow",
    "neon-cyan",
    "neon-magenta",
    "neon-orange",
    "neon-violet",
    "neon-red",
    "neon-green",
    "neon-blue",
    "accent-pop",
  ];
  const out = {};
  for (const name of names) {
    const val = extractCssVar(css, name);
    if (val) out[name] = val;
  }
  return out;
}

function buildTokensCss(days, neon, dayMulti) {
  const n = (k, fallback) => neon[k] ?? fallback;
  const dayLines = days
    .map((d) => `  --day-${d.code.toLowerCase()}: ${d.color};`)
    .join("\n");
  const textLines = days
    .filter((d) => d.textColor !== d.color)
    .map((d) => `  --day-${d.code.toLowerCase()}-text: ${d.textColor};`)
    .join("\n");
  const multi =
    dayMulti ||
    `linear-gradient(\n    90deg,\n    ${days.map((d) => d.color).join(",\n    ")}\n  )`;

  return `/* PDX Pride Guide — canonical design tokens
   Synced from shared/prideWeek.ts + client/src/index.css + client/src/components/ds/tokens.
   Source chain: prideWeek.ts → index.css / ds tokens → this file (npm run sync:design-system).
   Full modular tokens live in client/src/components/ds/tokens/ (colors, type, layout, effects).
*/
:root {
  /* ---- SURFACES ---------------------------------------- */
  --ink-1000: #050505;
  --ink-900: #0a0a0a;
  --ink-850: #111111;
  --ink-800: #0b0b0b;
  --ink-750: #141414;
  --ink-border: #2b2b2b;
  --ink-border-faint: #1a1a1a;
  --ink-border-strong: #333333;

  --bg: var(--ink-900);
  --bg-app: var(--ink-900);
  --bg-stage: var(--ink-1000);
  --surface: var(--ink-800);
  --surface-card: var(--ink-800);
  --surface-raised: var(--ink-750);
  --surface-card-hover: var(--ink-750);
  --border: var(--ink-border);
  --border-default: var(--ink-border);
  --border-faint: var(--ink-border-faint);
  --border-strong: var(--ink-border-strong);

  /* ---- NEON PALETTE ------------------------------------ */
  --neon-yellow: ${n("neon-yellow", "#CCFF00")};  /* PRIMARY action / RSVP — never a day color */
  --neon-cyan: ${n("neon-cyan", "#00FFFF")};
  --neon-magenta: ${n("neon-magenta", "#FF00CC")};
  --neon-orange: ${n("neon-orange", "#FF6600")};
  --neon-violet: ${n("neon-violet", "#8800FF")};
  --neon-red: ${n("neon-red", "#FF2400")};
  --neon-green: ${n("neon-green", "#00EE44")};
  --neon-blue: ${n("neon-blue", "#0044FF")};
  --accent-pop: ${n("accent-pop", "var(--neon-cyan)")};
  --accent: var(--neon-yellow);
  --link: var(--neon-cyan);
  --rsvp: var(--neon-yellow);

  /* Legacy aliases used across kit */
  --lime: var(--neon-yellow);
  --pink: var(--neon-magenta);
  --cyan: var(--neon-cyan);
  --green: #39FF14;       /* SAT day green (brighter) */
  --orange: var(--neon-orange);
  --purple: var(--neon-violet);
  --blue: var(--neon-blue);
  --yellow: #FFEE00;      /* WED day + highlighter */
  --amber: #FFB23D;
  --red: var(--neon-red);

  /* ---- DAY COLORS (Pride Week Jul 13–19 2026) ---------- */
  /* Semantic data — pins, filters, tags, glows. From prideWeek.ts */
${dayLines}
${textLines ? `${textLines}\n` : ""}  --day-unknown: #ffffff;
  --day-multi: ${multi};

  /* ---- TEXT -------------------------------------------- */
  --text: #ffffff;
  --text-hi: #ffffff;
  --text-heading: #ffffff;
  --text-body: #e6e3da;
  --text-mid: #e6e3da;
  --text-meta: #999999;
  --text-lo: #999999;
  --text-faint: #666666;
  --text-disabled: #4a4a4a;
  --text-inverse: #000000;

  /* ---- TYPE -------------------------------------------- */
  --font-display: "Barlow Condensed", "Arial Narrow", system-ui, sans-serif;
  --font-body: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: ui-monospace, "SFMono-Regular", Menlo, monospace;
  --fw-regular: 400;
  --fw-medium: 500;
  --fw-semibold: 600;
  --fw-bold: 700;
  --fw-heavy: 800;
  --fw-black: 900;
  --display-hero: clamp(3.5rem, 11vw, 9rem);
  --display-1: clamp(2.75rem, 7vw, 5.5rem);
  --display-2: clamp(2rem, 4.5vw, 3.5rem);
  --display-3: 1.75rem;
  --lh-display: 0.95;
  --tracking-display: 0.005em;
  --tracking-chrome: 0.06em;
  --tracking-kicker: 0.14em;
  --chrome-lg: 1.25rem;
  --chrome-md: 1rem;
  --chrome-sm: 0.85rem;
  --chrome-xs: 0.7rem;
  --body-md: 1rem;
  --body-sm: 0.875rem;
  --meta: 0.8125rem;

  /* ---- SPACING / RADIUS / Z ---------------------------- */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --gap-card: var(--space-4);
  --gap-list: var(--space-3);
  --gap-section: var(--space-16);
  --pad-card: var(--space-5);
  --pad-page: clamp(16px, 5vw, 48px);
  --w-content: 1180px;
  --w-prose: 680px;
  --radius: 0.25rem;
  --radius-xs: 2px;
  --radius-sm: 3px;
  --radius-md: 4px;
  --radius-lg: 6px;
  --radius-xl: 8px;
  --radius-pill: 999px;
  --bw-bold: 2px;
  --z-sticky: 100;
  --z-nav: 200;
  --z-modal: 900;
  --z-toast: 1000;

  /* ---- SIGNATURE EFFECTS ------------------------------- */
  --rainbow-bar: linear-gradient(
    90deg,
    var(--neon-cyan),
    var(--neon-yellow),
    var(--neon-magenta),
    var(--neon-orange)
  );
  --grad-flag: var(--rainbow-bar);
  --grad-rainbow: linear-gradient(
    100deg,
    var(--neon-cyan) 0%,
    var(--green) 24%,
    var(--neon-yellow) 44%,
    var(--neon-orange) 70%,
    var(--neon-magenta) 100%
  );
  --grad-hot: linear-gradient(120deg, var(--neon-magenta) 0%, var(--neon-orange) 100%);
  --grad-electric: linear-gradient(120deg, var(--neon-cyan) 0%, var(--neon-violet) 100%);
  --grad-acid: linear-gradient(115deg, var(--neon-cyan) 0%, var(--neon-yellow) 100%);

  --brutal-shadow: 4px 4px 0 rgba(255, 0, 204, 0.36);
  --brutal-shadow-lg: 6px 6px 0 rgba(255, 0, 204, 0.5);
  --brutal-shadow-cyan: 4px 4px 0 rgba(0, 255, 255, 0.32);
  --brutal-shadow-lime: 4px 4px 0 rgba(204, 255, 0, 0.3);

  --glow: 0 0 14px color-mix(in srgb, var(--neon-cyan) 18%, transparent);
  --glow-pink: 0 0 16px color-mix(in srgb, var(--neon-magenta) 26%, transparent);
  --glow-cyan: 0 0 16px color-mix(in srgb, var(--neon-cyan) 26%, transparent);
  --glow-lime: 0 0 16px color-mix(in srgb, var(--neon-yellow) 24%, transparent);
  --card-glow-idle: 0 0 14px color-mix(in srgb, var(--dc, var(--neon-cyan)) 18%, transparent);
  --card-glow-hot: 0 0 28px color-mix(in srgb, var(--dc, var(--neon-cyan)) 40%, transparent);

  --dur-fast: 150ms;
  --dur-base: 220ms;
  --dur-slow: 360ms;
  --dur-pulse: 4s;
  --ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);
  --hover-lift: -2px;
  --focus-ring: var(--neon-cyan);

  /* ---- SEMANTIC TAGS / DIRECTORY CATEGORIES ------------ */
  --tag-free: var(--neon-yellow);
  --tag-ticketed: var(--neon-cyan);
  --tag-donation: var(--amber);
  --cat-bars: var(--neon-magenta);
  --cat-food: var(--neon-orange);
  --cat-cafes: var(--neon-green);
  --cat-venues: var(--neon-cyan);
  --cat-services: var(--neon-violet);
  --cat-shops: var(--amber);
  --cat-hotels: var(--neon-blue);

  /* Schedule event cards cycle these (NOT day colors) */
  --schedule-accent-1: #19e3ff;
  --schedule-accent-2: #ff6600;
  --schedule-accent-3: #39ff14;
  --schedule-accent-4: #a855f7;
  --schedule-accent-5: #ff00cc;
}
`;
}

function daySwatchHtml(days) {
  return days
    .map((d) => {
      const textNote = d.textColor !== d.color ? ` · text ${d.textColor}` : "";
      return `  <div class="sw"><div class="chip" style="background:${d.color}"></div><div class="lbl"><b>${d.code}</b>${d.color}${textNote}</div></div>`;
    })
    .join("\n");
}

function dayChipHtml(days) {
  return days
    .map((d) => {
      const text = d.color === "#8800FF" || d.color === "#0044FF" ? "#fff" : "#000";
      return `<span class="day" style="background:${d.color};color:${text}">${d.code}</span>`;
    })
    .join("\n");
}

function patchPreview(path, startMarker, endMarker, replacement) {
  const html = read(path);
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker, start);
  if (start === -1 || end === -1) {
    throw new Error(`Markers not found in ${path}`);
  }
  const next =
    html.slice(0, start + startMarker.length) + "\n" + replacement + "\n" + html.slice(end);
  writeFileSync(path, next);
}

const prideWeek = read(prideWeekPath);
const indexCss = read(indexCssPath);
const days = extractPrideDays(prideWeek);
const neon = extractNeonTokens(indexCss);
const dayMulti =
  extractCssVar(indexCss, "day-multi") ??
  `linear-gradient(90deg, ${days.map((d) => d.color).join(", ")})`;

writeFileSync(tokensPath, buildTokensCss(days, neon, dayMulti));

// Markers must stay unique in the preview HTML so re-sync can rewrite day swatches.
patchPreview(
  colorsPreviewPath,
  "<!-- @day-swatches-start -->",
  "<!-- @day-swatches-end -->",
  `<div class="row">\n${daySwatchHtml(days)}\n</div>`,
);

patchPreview(
  chipsPreviewPath,
  "<!-- @day-chips-start -->",
  "<!-- @day-chips-end -->",
  dayChipHtml(days),
);

console.log("✓ design-system synced");
console.log(`  tokens: ${tokensPath}`);
console.log(`  previews: colors.html, chips-effects.html`);
console.log(`  days: ${days.map((d) => d.code).join(", ")}`);
