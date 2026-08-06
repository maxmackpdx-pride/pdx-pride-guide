#!/usr/bin/env node
// Onboarding acknowledgements.
//
// Keyed to a content hash of onboarding.md rather than a hand-kept version
// number. If the document changes, every prior acknowledgement goes stale by
// itself. Nobody has to remember to bump anything, which is the only kind of
// versioning that survives contact with a busy week.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DOC_REL = "foundation/agent-continuity/onboarding.md";
const REL = "foundation/agent-continuity/acknowledgements.json";
const FILE = join(ROOT, REL);
const now = () => new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
const die = (m) => { console.error(m); process.exit(1); };

const docHash = () => {
  const p = join(ROOT, DOC_REL);
  if (!existsSync(p)) die(`${DOC_REL} not found.`);
  return createHash("sha256").update(readFileSync(p)).digest("hex").slice(0, 12);
};
const load = () => existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8"))
  : { schemaVersion: 1, document: DOC_REL, note: "Keyed to a content hash of the document. Any edit invalidates every acknowledgement automatically.", acknowledgements: [] };
const save = (d) => writeFileSync(FILE, JSON.stringify(d, null, 2) + "\n");

function push(msg) {
  const git = (...a) => execFileSync("git", a, { cwd: ROOT, encoding: "utf8" }).trim();
  const foreign = git("diff", "--cached", "--name-only").split("\n").filter(Boolean).filter((f) => f !== REL);
  if (foreign.length) die(`Refusing to push: staged outside ${REL}:\n  ${foreign.slice(0,6).join("\n  ")}\nRun: git restore --staged .`);
  git("add", REL);
  if (!git("diff", "--cached", "--name-only")) return console.log("nothing to push");
  git("commit", "-m", msg); git("push", "origin", "master"); console.log("pushed");
}

function ack(agent, note) {
  if (!agent) die(`Usage: ack <agent> ["optional note"]`);
  const h = docHash();
  const d = load();
  d.acknowledgements = d.acknowledgements.filter((a) => a.agent !== agent);
  d.acknowledgements.push({ agent, hash: h, at: now(), ...(note ? { note } : {}) });
  d.acknowledgements.sort((a, b) => a.agent.localeCompare(b.agent));
  save(d);
  console.log(`${agent} acknowledged ${DOC_REL} @ ${h}`);
}

function status() {
  const h = docHash();
  const d = load();
  console.log(`${DOC_REL}\ncurrent hash: ${h}\n`);
  if (!d.acknowledgements.length) return console.log("No agent has acknowledged this document.");
  let stale = 0;
  for (const a of d.acknowledgements) {
    const cur = a.hash === h;
    if (!cur) stale++;
    console.log(`${cur ? "current" : "STALE  "}  ${a.agent.padEnd(7)} ${a.at}  ${a.hash}${a.note ? `  (${a.note})` : ""}`);
  }
  if (stale) {
    console.log(`\n${stale} agent(s) acknowledged an older version. The document changed since they read it.`);
    console.log(`They should re-read and run: node scripts/ack.mjs ack <agent> --push`);
  }
  process.exitCode = stale ? 1 : 0;
}

const [cmd, ...a] = process.argv.slice(2);
const doPush = a.includes("--push");
const args = a.filter((x) => x !== "--push");
if (cmd === "ack") { ack(args[0], args.slice(1).join(" ")); if (doPush) push(`ack: ${args[0]} acknowledged onboarding`); }
else if (cmd === "status") status();
else console.log(`Onboarding acknowledgements

  node scripts/ack.mjs status
  node scripts/ack.mjs ack <agent> ["note"] [--push]

Keyed to a content hash of ${DOC_REL}. Editing the document makes every prior
acknowledgement stale automatically. status exits 1 if anyone is behind.`);
