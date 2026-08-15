/**
 * Flyer audit: which events are missing real promoter art, and which stored
 * poster URLs no longer resolve.
 *
 * Scope defaults to current and future events, because a past event's flyer is
 * history and not worth chasing. Pass --all to include past events.
 *
 * Usage:
 *   node script/audit-event-flyers.mjs [baseUrl] [--all] [--json]
 *
 * Point it at production to audit the real calendar:
 *   node script/audit-event-flyers.mjs https://www.zaylist.com
 *
 * Three outcomes per event:
 *   REAL        poster_image_url is promoter art and the asset resolves
 *   BROKEN      poster_image_url is set but the asset does not resolve (404)
 *   PLACEHOLDER no real art; the day-coloured stand-in is being shown
 *
 * It also lists poster files on disk that no event references, which is where
 * an already-downloaded flyer goes missing: present in the repo, wired to
 * nothing.
 */
import { readdirSync, existsSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const BASE = (args.find(a => !a.startsWith("--")) || "http://localhost:5070").replace(/\/$/, "");
const INCLUDE_PAST = args.includes("--all");
const AS_JSON = args.includes("--json");

const PLACEHOLDER_RE = /\/placeholders\/event-(placeholder|day)-/i;
const isPlaceholder = (url) => !url || PLACEHOLDER_RE.test(url);

const POSTER_DIR = path.resolve(import.meta.dirname, "..", "client", "public", "posters");

async function getEvents() {
  const res = await fetch(`${BASE}/api/events`);
  if (!res.ok) throw new Error(`${BASE}/api/events responded ${res.status}`);
  return res.json();
}

/** Current or future: it has not finished yet. */
function isUpcoming(event, nowMs) {
  const end = Date.parse(event.dateEnd || "") || Date.parse(event.dateStart || "") || 0;
  return end >= nowMs;
}

/** Local paths are checked on disk; absolute URLs are checked over the network. */
async function posterResolves(url) {
  if (/^https?:\/\//i.test(url)) {
    try {
      const res = await fetch(url, { method: "HEAD" });
      return res.ok;
    } catch {
      return false;
    }
  }
  const clean = url.split("?")[0];
  if (clean.startsWith("/posters/")) {
    // Keep the subpath. Posters nest (camp/, stank-slides/, tucker-archive/),
    // so flattening to a basename looks in the wrong folder and reports a file
    // that is present as missing.
    return existsSync(path.join(POSTER_DIR, clean.slice("/posters/".length)));
  }
  try {
    const res = await fetch(`${BASE}${clean}`, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

const nowMs = Date.now();
const all = await getEvents();
const scoped = INCLUDE_PAST ? all : all.filter(e => isUpcoming(e, nowMs));

const real = [];
const broken = [];
const placeholder = [];

for (const event of scoped) {
  const url = event.posterImageUrl;
  if (isPlaceholder(url)) {
    placeholder.push(event);
    continue;
  }
  if (await posterResolves(url)) real.push({ event, url });
  else broken.push({ event, url });
}

// Poster files present in the repo that nothing points at.
const referenced = new Set(
  all
    .map(e => e.posterImageUrl)
    .filter(u => u && !isPlaceholder(u) && u.split("?")[0].startsWith("/posters/"))
    .map(u => u.split("?")[0].slice("/posters/".length)),
);
/** Walk the poster tree; subfolders hold archives and slide sets. */
function posterFiles(dir, prefix = "") {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    if (entry.isDirectory()) out.push(...posterFiles(path.join(dir, entry.name), `${prefix}${entry.name}/`));
    else if (/\.(png|jpe?g|webp|avif|gif)$/i.test(entry.name)) out.push(`${prefix}${entry.name}`);
  }
  return out;
}

const onDisk = posterFiles(POSTER_DIR);
const orphans = onDisk.filter(f => !referenced.has(f));

if (AS_JSON) {
  console.log(JSON.stringify({
    base: BASE,
    scope: INCLUDE_PAST ? "all" : "current-and-future",
    counts: { scoped: scoped.length, real: real.length, broken: broken.length, placeholder: placeholder.length },
    broken: broken.map(b => ({ id: b.event.id, title: b.event.title, url: b.url })),
    placeholder: placeholder.map(e => ({ id: e.id, title: e.title, venue: e.venueName, when: e.dateStart, source: e.source })),
    orphanPosters: orphans,
  }, null, 2));
  process.exit(broken.length ? 1 : 0);
}

const line = (s) => console.log(s);
line(`flyer audit  ${BASE}`);
line(`scope: ${INCLUDE_PAST ? "all events" : "current and future only"}`);
line(`events in scope: ${scoped.length} of ${all.length}\n`);

if (!scoped.length) {
  line("Nothing in scope. Every event in this dataset has already finished,");
  line("so there is no current or future flyer to audit. Point this at a");
  line("dataset with live events, or pass --all to audit past ones anyway.\n");
}

line(`REAL flyer:   ${real.length}`);
line(`BROKEN link:  ${broken.length}`);
line(`PLACEHOLDER:  ${placeholder.length}\n`);

if (broken.length) {
  line("BROKEN - poster is set but the file is gone. Fix these first, they");
  line("render as a missing image rather than falling back cleanly:");
  for (const b of broken) line(`  #${b.event.id}  ${b.event.title.slice(0, 46)}\n        ${b.url}`);
  line("");
}

if (placeholder.length) {
  line("NEEDS A FLYER - showing the day-coloured stand-in. Venue and source");
  line("are listed so the real art can be found:");
  for (const e of placeholder) {
    line(`  #${e.id}  ${(e.title || "").slice(0, 46)}`);
    line(`        ${(e.dateStart || "?").slice(0, 16)}  ${e.venueName || "venue unknown"}  ${e.source ? `[${e.source}]` : ""}`);
  }
  line("");
}

if (orphans.length) {
  line(`ORPHAN POSTERS - ${orphans.length} file(s) in client/public/posters that no`);
  line("event references. A flyer already downloaded but wired to nothing:");
  for (const f of orphans) line(`  ${f}`);
  line("");
}

process.exit(broken.length ? 1 : 0);
