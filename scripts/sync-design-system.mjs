#!/usr/bin/env node
/**
 * Sync design-system/ from live app sources.
 * Run before every Grok push that touches colors, tokens, or Pride week styling.
 *
 * Source of truth chain:
 *   shared/prideWeek.ts → client/src/index.css → design-system/tokens/tokens.css
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
  const dayLines = days
    .map((d) => `  --day-${d.code.toLowerCase()}: ${d.color};`)
    .join("\n");
  const textLines = days
    .filter((d) => d.textColor !== d.color)
    .map((d) => `  --day-${d.code.toLowerCase()}-text: ${d.textColor};`)
    .join("\n");

  return `/* PDX Pride Guide — canonical design tokens (synced from index.css + prideWeek.ts) */
:root {
  /* Surfaces */
  --bg: #0a0a0a;
  --surface: #0b0b0b;
  --surface-raised: #141414;
  --border: #2b2b2b;
  --border-faint: #1a1a1a;

  /* Neon palette */
  --neon-yellow: ${neon["neon-yellow"] ?? "#CCFF00"};
  --neon-cyan: ${neon["neon-cyan"] ?? "#00FFFF"};
  --neon-magenta: ${neon["neon-magenta"] ?? "#FF00CC"};
  --neon-orange: ${neon["neon-orange"] ?? "#FF6600"};
  --neon-violet: ${neon["neon-violet"] ?? "#8800FF"};
  --neon-red: ${neon["neon-red"] ?? "#FF2400"};
  --neon-green: ${neon["neon-green"] ?? "#00EE44"};
  --neon-blue: ${neon["neon-blue"] ?? "#0044FF"};
  --accent-pop: ${neon["accent-pop"] ?? "var(--neon-cyan)"};

  /* Day colors (event system) — mirror of shared/prideWeek.ts */
${dayLines}
${textLines ? `${textLines}\n` : ""}  --day-multi: ${dayMulti};

  /* Text */
  --text: #ffffff;
  --text-body: #e6e3da;
  --text-meta: #999999;
  --text-faint: #666666;

  /* Type */
  --font-display: 'Barlow Condensed', sans-serif; /* 700–900, uppercase */
  --font-body: 'Inter', sans-serif;

  /* Signature effects */
  --rainbow-bar: linear-gradient(90deg, var(--neon-cyan), var(--neon-yellow), var(--neon-magenta), var(--neon-orange));
  --brutal-shadow: 4px 4px 0 rgba(255, 0, 204, 0.36);
  --glow: 0 0 14px color-mix(in srgb, var(--neon-cyan) 18%, transparent);

  --radius: 0.25rem;
}
`;
}

function daySwatchHtml(days) {
  return days
    .map(
      (d) =>
        `  <div class="sw"><div class="chip" style="background:${d.color}"></div><div class="lbl"><b>${d.code}</b>${d.color}</div></div>`,
    )
    .join("\n");
}

function dayChipHtml(days) {
  return days
    .map((d) => `<span class="day" style="background:${d.color}">${d.code}</span>`)
    .join("\n");
}

function patchPreview(path, startMarker, endMarker, replacement) {
  const html = read(path);
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker, start);
  if (start === -1 || end === -1) {
    throw new Error(`Markers not found in ${path}`);
  }
  const next = html.slice(0, start + startMarker.length) + "\n" + replacement + "\n" + html.slice(end);
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

patchPreview(
  colorsPreviewPath,
  "<h2>Day colors</h2>\n<div class=\"row\">",
  "</div>\n<h2>Surfaces</h2>",
  daySwatchHtml(days),
);

patchPreview(
  chipsPreviewPath,
  "<div class=\"lbl\">Day chips</div>\n",
  "\n<div class=\"lbl\">Live pill",
  dayChipHtml(days),
);

console.log("✓ design-system synced");
console.log(`  tokens: ${tokensPath}`);
console.log(`  previews: colors.html, chips-effects.html`);
console.log(`  days: ${days.map((d) => d.code).join(", ")}`);