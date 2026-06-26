/**
 * Verifies Pacific calendar export strings for sample and live events.
 * Run: node script/audit-calendar-export.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Inline minimal copies of export helpers (no TS build required)
function parsePacificEventTime(value) {
  if (!value) return null;
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(value)) return new Date(value).getTime();
  return new Date(`${value}-07:00`).getTime();
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function pacificParts(iso) {
  const ts = parsePacificEventTime(iso);
  if (ts == null) return null;
  const d = new Date(ts);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = type => parts.find(p => p.type === type)?.value ?? "";
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour") === "24" ? "00" : get("hour"),
    minute: get("minute"),
  };
}

function fmtCalendar(iso) {
  const p = pacificParts(iso);
  if (!p) return "";
  return `${p.year}${p.month}${p.day}T${pad(Number(p.hour))}${pad(Number(p.minute))}00`;
}

function buildEventDetails(event) {
  const lines = [];
  if (event.description?.trim()) lines.push(event.description.trim());
  if (event.venueName) lines.push(`Venue: ${event.venueName}`);
  if (event.address) lines.push(`Address: ${event.address}`);
  if (event.ticketUrl) lines.push(`Tickets: ${event.ticketUrl}`);
  lines.push("via PDX Pride Guide — prideguidepdx.com");
  return lines.join("\n");
}

const sample = {
  id: 1,
  title: "Pride Parade Viewing Party",
  description: "Watch the parade from our patio.",
  dateStart: "2026-07-16T19:00:00",
  dateEnd: "2026-07-16T22:00:00",
  venueName: "The Eagle",
  address: "123 SW Stark St, Portland, OR",
  ticketUrl: "https://example.com/tickets",
};

const snapshot = {
  googleStart: fmtCalendar(sample.dateStart),
  googleEnd: fmtCalendar(sample.dateEnd),
  details: buildEventDetails(sample),
  location: sample.address,
};

console.log("=== Sample event (Pacific) ===");
console.log(JSON.stringify(snapshot, null, 2));

const expectedStart = "20260716T190000";
if (snapshot.googleStart !== expectedStart) {
  console.error(`FAIL: expected start ${expectedStart}, got ${snapshot.googleStart}`);
  process.exit(1);
}
if (!snapshot.details.includes(sample.venueName)) {
  console.error("FAIL: details missing venue");
  process.exit(1);
}
if (!snapshot.details.includes(sample.ticketUrl)) {
  console.error("FAIL: details missing ticket URL");
  process.exit(1);
}

let liveOk = false;
try {
  const res = await fetch("https://prideguidepdx.com/api/events?limit=1");
  if (res.ok) {
    const events = await res.json();
    const ev = Array.isArray(events) ? events[0] : events?.events?.[0];
    if (ev?.dateStart) {
      console.log("\n=== Live event from API ===");
      console.log(ev.title);
      console.log("Start:", fmtCalendar(ev.dateStart));
      console.log("End:", fmtCalendar(ev.dateEnd));
      console.log("Details preview:", buildEventDetails(ev).slice(0, 120) + "…");
      liveOk = true;
    }
  }
} catch (err) {
  console.warn("Could not fetch live events:", err.message);
}

console.log(liveOk ? "\nAudit passed (sample + live)." : "\nAudit passed (sample).");