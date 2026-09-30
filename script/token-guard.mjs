/**
 * Token hygiene guard (board 10). Counts raw hex colors and local monospace
 * stacks in every stylesheet under client/src (token definitions excepted) and
 * fails when any file's count grows past script/token-guard.baseline.json.
 * New CSS should reach for var(--*) tokens; the baseline only ever shrinks.
 *
 * Runs inside `npm run build`.
 *   node script/token-guard.mjs            check
 *   node script/token-guard.mjs --update   rewrite the baseline (after migrating)
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const SRC = join(ROOT, "client", "src");
const TOKENS = join(SRC, "components", "ds", "tokens") + sep;
const BASELINE = join(ROOT, "script", "token-guard.baseline.json");

function cssFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) cssFiles(full, out);
    else if (name.endsWith(".css") && !full.startsWith(TOKENS)) out.push(full);
  }
  return out;
}

export function countCss(src) {
  const css = src.replace(/\/\*[\s\S]*?\*\//g, "");
  const hex = (css.match(/#[0-9a-fA-F]{3,8}\b(?![\w-])/g) || []).filter((h) => [4, 5, 7, 9].includes(h.length)).length;
  const mono = (css.match(/font-family\s*:[^;{}]*monospace[^;{}]*/g) || []).filter((d) => !d.includes("var(")).length;
  return { hex, mono };
}

export function measure() {
  const counts = {};
  for (const file of cssFiles(SRC).sort()) {
    const c = countCss(readFileSync(file, "utf8"));
    if (c.hex || c.mono) counts[relative(ROOT, file).split(sep).join("/")] = c;
  }
  return counts;
}

export function compare(counts, baseline) {
  const problems = [];
  for (const [file, c] of Object.entries(counts)) {
    const b = baseline[file] || { hex: 0, mono: 0 };
    if (c.hex > b.hex) problems.push(`${file}: ${c.hex} raw hex colors (baseline ${b.hex}). Use a var(--*) token.`);
    if (c.mono > b.mono) problems.push(`${file}: ${c.mono} local mono stacks (baseline ${b.mono}). Use var(--font-mono).`);
  }
  return problems;
}

export function assertTokens() {
  const counts = measure();
  const problems = compare(counts, JSON.parse(readFileSync(BASELINE, "utf8")));
  if (problems.length) throw new Error(`token guard:\n  ${problems.join("\n  ")}`);
  return Object.values(counts).reduce((n, c) => n + c.hex, 0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--update")) {
    writeFileSync(BASELINE, JSON.stringify(measure(), null, 2) + "\n");
    console.log(`token guard baseline written`);
  } else {
    try {
      console.log(`token guard ok (${assertTokens()} raw hexes, none new)`);
    } catch (err) {
      console.error(err.message);
      process.exit(1);
    }
  }
}
