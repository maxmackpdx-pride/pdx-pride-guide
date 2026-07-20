/**
 * Nightly QSearch scan — ~3am America/Los_Angeles.
 * Lands candidates in review queue (pending), never LIVE.
 *
 * Enable: QSEARCH_NIGHTLY=1 (or production default on)
 * Disable: QSEARCH_NIGHTLY=0
 *
 * Railway: single dyno runs setInterval tick; also safe if multiple ticks
 * no-op when a scan is already active.
 */
import { storage } from "../storage";
import { startScan, getLatestScanJob } from "./scanJob";
import { recoverOrphanScans } from "./scanJob";

const CHECK_MS = 60_000;
let started = false;
let lastNightlyKey: string | null = null;

function pacificNowParts(d = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(d);
  const get = (t: string) => parts.find(p => p.type === t)?.value || "00";
  let hour = Number(get("hour"));
  if (hour === 24) hour = 0;
  return {
    key: `${get("year")}-${get("month")}-${get("day")}`,
    hour,
  };
}

function nightlyEnabled(): boolean {
  const v = process.env.QSEARCH_NIGHTLY?.trim();
  if (v === "0" || v === "false") return false;
  if (v === "1" || v === "true") return true;
  // Default on in production, off in local dev unless set
  return process.env.NODE_ENV === "production";
}

export function startQSearchNightly() {
  if (started) return;
  started = true;
  recoverOrphanScans();

  const timer = setInterval(() => {
    void tick().catch(err => console.error("[qsearch-nightly] tick failed:", err));
  }, CHECK_MS);
  timer.unref?.();
  console.log(
    `[qsearch-nightly] scheduler armed (enabled=${nightlyEnabled()} target=03:00 America/Los_Angeles)`,
  );
}

async function tick() {
  if (!nightlyEnabled()) return;
  const { key, hour } = pacificNowParts();
  // Run once in the 3am hour Pacific
  if (hour !== 3) return;
  if (lastNightlyKey === key) return;

  // Avoid double-run if last job was nightly today
  const latest = getLatestScanJob();
  if (latest?.kind === "nightly" && latest.startedAt?.startsWith(key.slice(0, 10))) {
    // startedAt is ISO UTC — fall back to lastNightlyKey only
  }

  lastNightlyKey = key;
  console.log(`[qsearch-nightly] starting scan for ${key}`);

  const businesses = storage.getBusinesses({}).map((b: any) => ({
    id: b.id,
    name: b.name,
    website: b.website,
    type: b.type,
    active: b.active,
  }));
  const existingEvents = storage.getEvents({});

  const result = startScan({
    kind: "nightly",
    businesses,
    existingEvents,
    tryVision: process.env.QSEARCH_NIGHTLY_VISION === "1",
  });

  if ("error" in result) {
    console.error("[qsearch-nightly] did not start:", result.error);
    // allow retry later same hour if failed to start due to concurrent
    if (result.error.includes("already running")) {
      lastNightlyKey = null;
    }
    return;
  }
  console.log(`[qsearch-nightly] job ${result.jobId} total=${result.total}`);
}

/** Test helper / admin trigger for “run nightly priority now”. */
export function triggerNightlyPriorityScan() {
  const businesses = storage.getBusinesses({}).map((b: any) => ({
    id: b.id,
    name: b.name,
    website: b.website,
    type: b.type,
    active: b.active,
  }));
  return startScan({
    kind: "nightly",
    businesses,
    existingEvents: storage.getEvents({}),
  });
}
