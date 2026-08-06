#!/usr/bin/env node
// Enforces the Foundation release-id discipline.
//
// Every governed Foundation area has an llms.txt with a `Release:` line that
// agents use to tell whether their cached view is current. If the content
// changes and the release id does not, agents cannot detect the change.
//
// This check fails when an area's content changed in the diff range without its
// governing llms.txt release id changing too.
//
// Usage:
//   node scripts/check-foundation-release.mjs                 (compare HEAD~1..HEAD)
//   node scripts/check-foundation-release.mjs <base> <head>
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const git = (...a) =>
  execFileSync("git", a, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();

// Most specific prefix wins. Everything else under foundation/ falls to the root.
const AREAS = [
  { name: "tech-stack",   prefix: "foundation/tech-stack/",   llms: "foundation/tech-stack/llms.txt" },
  { name: "trust-safety", prefix: "foundation/trust-safety/", llms: "foundation/trust-safety/llms.txt" },
  { name: "foundation",   prefix: "foundation/",              llms: "foundation/llms.txt" },
];

const RELEASE_RE = /^Release:\s*(zaylist-[a-z0-9-]+-\d{4}-\d{2}-\d{2}\.\d+)\s*$/m;

const areaFor = (file) => AREAS.find((a) => file.startsWith(a.prefix));
const releaseAt = (ref, path) => {
  let text;
  try {
    text = ref === null ? readFileSync(path, "utf8") : git("show", `${ref}:${path}`);
  } catch {
    return null; // file did not exist at that ref
  }
  const m = text.match(RELEASE_RE);
  return m ? m[1] : { malformed: true };
};

const base = process.argv[2] || "HEAD~1";
const head = process.argv[3] || "HEAD";

let changed;
try {
  changed = git("diff", "--name-only", `${base}..${head}`).split("\n").filter(Boolean);
} catch {
  console.log("check-foundation-release: cannot diff, skipping.");
  process.exit(0);
}

const foundationChanges = changed.filter((f) => f.startsWith("foundation/"));
if (foundationChanges.length === 0) {
  console.log("check-foundation-release: no foundation/ changes. OK.");
  process.exit(0);
}

const touched = new Map();
for (const file of foundationChanges) {
  const area = areaFor(file);
  if (!area) continue;
  if (file === area.llms) continue; // the manifest itself is not content
  if (!touched.has(area.name)) touched.set(area.name, { area, files: [] });
  touched.get(area.name).files.push(file);
}

const errors = [];
const ok = [];

for (const { area, files } of touched.values()) {
  if (!existsSync(area.llms)) {
    errors.push(`${area.name}: content changed but ${area.llms} does not exist.\n  Create it with a Release line before changing this area.`);
    continue;
  }
  const before = releaseAt(base, area.llms);
  const after = releaseAt(head === "HEAD" ? null : head, area.llms);

  if (after === null || after?.malformed) {
    errors.push(
      `${area.name}: ${area.llms} has no valid Release line.\n` +
      `  Expected: Release: zaylist-${area.name}-YYYY-MM-DD.N\n` +
      `  Changed files: ${files.slice(0, 4).join(", ")}${files.length > 4 ? ` (+${files.length - 4} more)` : ""}`
    );
    continue;
  }
  if (before !== null && !before?.malformed && before === after) {
    errors.push(
      `${area.name}: ${files.length} file(s) changed but the release id did not move.\n` +
      `  ${area.llms} still reads: ${after}\n` +
      `  Changed: ${files.slice(0, 4).join(", ")}${files.length > 4 ? ` (+${files.length - 4} more)` : ""}\n` +
      `  Bump the trailing number, or roll the date and reset to .1.`
    );
    continue;
  }
  ok.push(`${area.name}: ${before ?? "(new)"} -> ${after}  [${files.length} file(s)]`);
}

for (const line of ok) console.log(`ok   ${line}`);
if (errors.length) {
  console.error("\ncheck-foundation-release FAILED\n");
  for (const e of errors) console.error(`  ${e}\n`);
  console.error("Why this matters: agents use the release id to detect that a guide moved.");
  console.error("Silent content changes leave every cached agent view stale and undetectable.\n");
  process.exit(1);
}
console.log("\ncheck-foundation-release passed.");
