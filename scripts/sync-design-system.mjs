#!/usr/bin/env node
/**
 * Mirror the canonical Zaylist Design System into design-system/.
 *
 * Source of truth: maxmackpdx-pride/zaylist-design-system
 *   live → https://maxmackpdx-pride.github.io/zaylist-design-system/
 *
 * This is NOT the old "extract colors from index.css into tokens.css" sync.
 * That kit was removed so the repo has one design guide with no contradictions.
 *
 * Usage (from pdx-pride-guide root):
 *   npm run sync:design-system
 *
 * Env:
 *   ZAYLIST_DS_SRC  path to a checkout of zaylist-design-system
 *                   default: ../zaylist-design-system
 */
import { existsSync, mkdirSync, rmSync, writeFileSync, cpSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dest = join(root, "design-system");
const src = resolve(process.env.ZAYLIST_DS_SRC || join(root, "..", "zaylist-design-system"));

const EXCLUDES = new Set([
  ".git",
  ".DS_Store",
  "uploads",
  "_eb",
  ".thumbnail",
  "aurora-upscaler-precise_-0-mryqsbzb-bzgc.jpg",
  "_probe2.html",
  "_probe2.bundle.html",
  "_export_assets.html",
  "_export_assets_eb.html",
  "_export_panels.html",
  "_export_panels_eb.html",
  "_export_sources.html",
  "_export_fonts.css",
  "_sa-styles.css",
  "_adherence.oxlintrc.json",
]);

function shouldSkip(name) {
  return EXCLUDES.has(name) || name === ".DS_Store";
}

function copyTree(from, to) {
  mkdirSync(to, { recursive: true });
  for (const name of readdirSync(from)) {
    if (shouldSkip(name)) continue;
    const a = join(from, name);
    const b = join(to, name);
    const st = statSync(a);
    if (st.isDirectory()) copyTree(a, b);
    else cpSync(a, b);
  }
}

if (!existsSync(src)) {
  console.error(`
✗ Design system source not found:
  ${src}

Clone or set ZAYLIST_DS_SRC:
  git clone https://github.com/maxmackpdx-pride/zaylist-design-system.git ../zaylist-design-system
  npm run sync:design-system

Public guide (always current):
  https://maxmackpdx-pride.github.io/zaylist-design-system/
`);
  process.exit(1);
}

console.log(`Mirroring design system\n  from: ${src}\n  to:   ${dest}`);

// Prefer rsync when available (faster, cleaner)
const rsync = spawnSync(
  "rsync",
  [
    "-a",
    "--delete",
    ...[...EXCLUDES].flatMap((e) => (e.includes(".") ? ["--exclude", e] : ["--exclude", `${e}/`, "--exclude", e])),
    "--exclude",
    ".git/",
    "--exclude",
    "**/.DS_Store",
    `${src}/`,
    `${dest}/`,
  ],
  { encoding: "utf8" },
);

if (rsync.status !== 0) {
  console.warn("rsync unavailable or failed; using node copy");
  rmSync(dest, { recursive: true, force: true });
  copyTree(src, dest);
}

writeFileSync(
  join(dest, ".mirror-excludes.md"),
  `# Mirror notes

This folder mirrors the public design guide
[\`maxmackpdx-pride/zaylist-design-system\`](https://github.com/maxmackpdx-pride/zaylist-design-system)
(live: https://maxmackpdx-pride.github.io/zaylist-design-system/).

**Source of truth:** that package / this folder.

Omitted from the main app repo (still on the public Pages repo):

- \`uploads/\` — Claude export working dumps
- \`_eb/\` — export build artifacts
- probe/export helper HTML
- oversized one-off aurora source JPG

**Always keep:** \`.nojekyll\` on the public Pages repo (and here). Without it,
Jekyll strips \`_ds_bundle.js\` / \`guidelines/_spec.js\` and specimen iframes
render blank. This script re-creates the empty file after every mirror.

Refreshed by: \`npm run sync:design-system\`
`,
  "utf8",
);

// GitHub Pages + Jekyll: never ship without this (underscore assets must be public)
writeFileSync(join(dest, ".nojekyll"), "");
if (existsSync(src)) {
  try {
    writeFileSync(join(src, ".nojekyll"), "");
  } catch {
    /* source may be read-only */
  }
}

// Ensure README documents main-repo context (public package readme is Pages-oriented)
const mainReadme = join(dest, "README.md");
if (!existsSync(mainReadme)) {
  // rsync may have only readme.md on case-sensitive volumes
  console.warn("Note: write design-system/README.md if missing on your FS");
}

console.log("✓ design-system mirrored from canonical package");
console.log("  Public: https://maxmackpdx-pride.github.io/zaylist-design-system/");
console.log("  .nojekyll ensured (Pages must not run Jekyll on _ds_bundle.js)");
