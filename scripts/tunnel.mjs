#!/usr/bin/env node
// Live tunnels: temporary, topic-scoped agent chat rooms.
// See foundation/agent-continuity/tunnels/README.md
import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync, readdirSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = join(ROOT, "foundation/agent-continuity/tunnels");
const ACTIVE = join(DIR, "active");
const ARCHIVE = join(DIR, "archive");
const REG = join(DIR, "registry.json");

const reg = () => JSON.parse(readFileSync(REG, "utf8"));
const saveReg = (r) => writeFileSync(REG, JSON.stringify(r, null, 2) + "\n");
const now = () => new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
const pretty = (c) => `${c.slice(0, 3)}-${c.slice(3, 6)}-${c.slice(6)}`;
const die = (m) => { console.error(m); process.exit(1); };

const TUNNELS_REL = "foundation/agent-continuity/tunnels";
// Stage ONLY the tunnels directory and refuse if anything else is already
// staged. A tunnel turn must never carry product WIP along with it.
function pushTunnels(msg) {
  const git = (...a) => execFileSync("git", a, { cwd: ROOT, encoding: "utf8" }).trim();
  const staged = git("diff", "--cached", "--name-only").split("\n").filter(Boolean);
  const foreign = staged.filter((f) => !f.startsWith(TUNNELS_REL));
  if (foreign.length)
    die(`Refusing to push: ${foreign.length} file(s) already staged outside ${TUNNELS_REL}:\n  ` +
        foreign.slice(0, 8).join("\n  ") +
        `\n\nRun: git restore --staged .   then retry. A tunnel turn must not ship product WIP.`);
  git("add", TUNNELS_REL);
  if (!git("diff", "--cached", "--name-only")) return console.log("nothing to push");
  git("commit", "-m", msg);
  git("push", "origin", "master");
  console.log("pushed");
}

function allCodes() {
  const out = new Set();
  const walk = (d) => { if (!existsSync(d)) return;
    for (const e of readdirSync(d, { withFileTypes: true }))
      e.isDirectory() ? walk(join(d, e.name)) : e.name.endsWith(".jsonl") && out.add(e.name.replace(".jsonl", "")); };
  walk(ACTIVE); walk(ARCHIVE);
  return out;
}
const findActive = (code) => { const p = join(ACTIVE, `${code}.jsonl`); return existsSync(p) ? p : null; };
const turns = (p) => readFileSync(p, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));

function open(topic, subject) {
  const r = reg();
  if (!r.topics[topic]) die(`Unknown topic ${topic}. Known: ${Object.keys(r.topics).join(", ")}`);
  if (!subject) die("A one line subject is required.");
  const used = allCodes();
  let code;
  do { code = topic + String(Math.floor(Math.random() * 1e6)).padStart(6, "0"); } while (used.has(code));
  mkdirSync(ACTIVE, { recursive: true });
  const head = { type: "open", code, topic, topicName: r.topics[topic], subject, openedAt: now(), authority: "none" };
  writeFileSync(join(ACTIVE, `${code}.jsonl`), JSON.stringify(head) + "\n");
  r.active.push({ code, topic: r.topics[topic], subject, openedAt: head.openedAt });
  saveReg(r);
  console.log(`opened ${pretty(code)}  [${r.topics[topic]}]  ${subject}`);
  console.log(`code: ${code}`);
}

function say(code, from, ...body) {
  const p = findActive(code) || die(`No active tunnel ${code}.`);
  const doPush = body.includes("--push");
  body = body.filter((b) => b !== "--push");
  const text = body.join(" ").trim();
  if (!text) die("Empty message.");
  appendFileSync(p, JSON.stringify({ type: "turn", from, at: now(), body: text }) + "\n");
  console.log(`${pretty(code)} <- ${from}`);
  if (doPush) pushTunnels(`tunnel ${code.slice(0, 3)}: ${from} turn`);
}

function read(code) {
  const p = findActive(code) || (() => {
    const walk = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) { const r = walk(join(d, e.name)); if (r) return r; }
      else if (e.name === `${code}.jsonl`) return join(d, e.name); } return null; };
    return existsSync(ARCHIVE) ? walk(ARCHIVE) : null;
  })();
  if (!p) die(`No tunnel ${code}.`);
  for (const t of turns(p)) {
    if (t.type === "open") console.log(`\n== ${pretty(t.code)}  ${t.topicName}\n   ${t.subject}\n   opened ${t.openedAt}  (transcript carries no authority)\n`);
    else if (t.type === "turn") console.log(`[${t.at}] ${t.from}:\n  ${t.body}\n`);
    else if (t.type === "close") {
      console.log(`-- closed ${t.at} by ${t.by}\n   outcome: ${t.outcome}`);
      console.log(t.libraryUpdates.length ? `   library: ${t.libraryUpdates.join(", ")}` : `   library: none (${t.noUpdateReason})`);
    }
  }
}

function list() {
  const r = reg();
  if (!r.active.length) return console.log("No active tunnels.");
  for (const a of r.active) console.log(`${pretty(a.code)}  [${a.topic}]  ${a.subject}   opened ${a.openedAt}`);
}

function close(code, by, args) {
  const p = findActive(code) || die(`No active tunnel ${code}.`);
  const get = (f) => { const i = args.indexOf(f); return i === -1 ? null : args[i + 1]; };
  const outcome = get("--outcome");
  const reason = get("--no-update-reason");
  const updated = args.reduce((acc, a, i) => (a === "--updated" ? [...acc, args[i + 1]] : acc), []).filter(Boolean);
  if (!by) die("Closing agent required.");
  if (!outcome) die("--outcome is required. One line: what was resolved, or that nothing was.");
  if (!updated.length && !reason)
    die("Closing requires --updated <path> (repeatable), or --no-update-reason \"why nothing was written\".\nA tunnel that leaves nothing behind is the failure this is meant to prevent.");
  for (const u of updated) if (!existsSync(join(ROOT, u))) die(`--updated path does not exist: ${u}`);

  appendFileSync(p, JSON.stringify({ type: "close", by, at: now(), outcome, libraryUpdates: updated, noUpdateReason: updated.length ? null : reason }) + "\n");
  const month = now().slice(0, 7);
  mkdirSync(join(ARCHIVE, month), { recursive: true });
  renameSync(p, join(ARCHIVE, month, `${code}.jsonl`));
  const r = reg();
  r.active = r.active.filter((a) => a.code !== code);
  saveReg(r);
  console.log(`closed ${pretty(code)} -> archive/${month}/`);
  console.log(`outcome: ${outcome}`);
  console.log(updated.length ? `library: ${updated.join(", ")}` : `library: none (${reason})`);
  if (args.includes("--push")) pushTunnels(`tunnel ${code.slice(0, 3)}: closed by ${by}`);
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === "open") open(rest[0], rest.slice(1).join(" "));
else if (cmd === "say") say(rest[0], rest[1], ...rest.slice(2));
else if (cmd === "read") read(rest[0]);
else if (cmd === "list") list();
else if (cmd === "close") close(rest[0], rest[1], rest.slice(2));
else console.log(`Live tunnels - topic-scoped agent chat rooms

  node scripts/tunnel.mjs open <topic> "<subject>"
  node scripts/tunnel.mjs say <code> <agent> "<message>" [--push]
  node scripts/tunnel.mjs read <code>
  node scripts/tunnel.mjs list
  node scripts/tunnel.mjs close <code> <agent> --outcome "..." --updated <path>

Topics: see foundation/agent-continuity/tunnels/registry.json
Contract: foundation/agent-continuity/tunnels/README.md`);
