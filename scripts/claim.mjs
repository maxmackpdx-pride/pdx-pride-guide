#!/usr/bin/env node
// Work claims: say what you are about to touch before you touch it.
// Prevents two agents doing the same work, or one overwriting the other's
// in-flight change. Cheap to run, cheap to ignore at your own risk.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REL = "foundation/agent-continuity/claims.json";
const FILE = join(ROOT, REL);
const now = () => new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
const die = (m) => { console.error(m); process.exit(1); };
const load = () => existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8")) : { schemaVersion: 1, claims: [] };
const save = (d) => writeFileSync(FILE, JSON.stringify(d, null, 2) + "\n");
const AGE_H = (t) => (Date.now() - new Date(t)) / 36e5;

function push(msg) {
  const git = (...a) => execFileSync("git", a, { cwd: ROOT, encoding: "utf8" }).trim();
  const foreign = git("diff", "--cached", "--name-only").split("\n").filter(Boolean).filter((f) => f !== REL);
  if (foreign.length) die(`Refusing to push: files staged outside ${REL}:\n  ${foreign.slice(0,6).join("\n  ")}\nRun: git restore --staged .`);
  git("add", REL);
  if (!git("diff", "--cached", "--name-only")) return console.log("nothing to push");
  git("commit", "-m", msg); git("push", "origin", "master"); console.log("pushed");
}

function list(showStale = false) {
  const d = load();
  const live = d.claims.filter((c) => showStale || AGE_H(c.at) < 12);
  if (!live.length) return console.log("No open claims.");
  for (const c of live) {
    const h = AGE_H(c.at).toFixed(1);
    console.log(`${c.agent.padEnd(7)} ${h.padStart(5)}h  ${c.intent}`);
    for (const p of c.paths) console.log(`         ${p}`);
    if (AGE_H(c.at) > 12) console.log(`         (stale, opened ${c.at})`);
  }
}

function claim(agent, intent, paths) {
  if (!agent || !intent || !paths.length) die(`Usage: claim <agent> "<intent>" <path> [path...]`);
  const d = load();
  const conflicts = d.claims.filter((c) => c.agent !== agent && AGE_H(c.at) < 12 &&
    c.paths.some((p) => paths.some((q) => q.startsWith(p) || p.startsWith(q))));
  if (conflicts.length) {
    console.error("CONFLICT. Someone else has these open:\n");
    for (const c of conflicts) console.error(`  ${c.agent} (${AGE_H(c.at).toFixed(1)}h ago): ${c.intent}\n    ${c.paths.join("\n    ")}`);
    console.error("\nOpen a tunnel and sort it before proceeding. Do not just take it.");
    process.exit(1);
  }
  d.claims = d.claims.filter((c) => !(c.agent === agent && c.paths.join() === paths.join()));
  d.claims.push({ agent, intent, paths, at: now() });
  save(d);
  console.log(`claimed by ${agent}: ${intent}\n  ${paths.join("\n  ")}`);
}

function release(agent, ...rest) {
  const d = load();
  const before = d.claims.length;
  d.claims = d.claims.filter((c) => c.agent !== agent || (rest.length && !rest.some((p) => c.paths.includes(p))));
  save(d);
  console.log(`released ${before - d.claims.length} claim(s) for ${agent}`);
}

const [cmd, ...a] = process.argv.slice(2);
const doPush = a.includes("--push");
const args = a.filter((x) => x !== "--push");
if (cmd === "list") list(args.includes("--all"));
else if (cmd === "claim") { claim(args[0], args[1], args.slice(2)); if (doPush) push(`claims: ${args[0]} claimed work`); }
else if (cmd === "release") { release(args[0], ...args.slice(1)); if (doPush) push(`claims: ${args[0]} released`); }
else console.log(`Work claims - say what you are about to touch

  node scripts/claim.mjs list [--all]
  node scripts/claim.mjs claim <agent> "<intent>" <path> [path...] [--push]
  node scripts/claim.mjs release <agent> [path...] [--push]

Run list at the start of every session. Claims older than 12h show as stale.
A conflicting claim is not a lock you can break; open a tunnel instead.`);
