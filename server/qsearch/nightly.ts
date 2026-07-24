/**
 * Nightly QSearch scan - ~3am America/Los_Angeles.
 * Lands candidates in review queue (pending), never LIVE.
 *
 * Trusted venue auto-publish sync also runs once per day at 3am Pacific
 * (fire-and-forget after scan start; requires Agent C trustedSync.ts).
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
/** YYYY-MM-DD Pacific day we last fired trusted auto-sync */
let lastTrustedSyncKey: string | null = null;

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

/**
 * Fire-and-forget trusted venue pull (once per Pacific day).
 * Queues into Review (same as manual) - never auto-LIVE at night.
 */
function fireTrustedSync(dayKey: string) {
  if (lastTrustedSyncKey === dayKey) return;
  lastTrustedSyncKey = dayKey;
  console.log(`[qsearch-nightly] starting trusted venue review-sync for ${dayKey}`);
  void import("./trustedSync")
    .then(mod => {
      if (typeof mod.syncAllTrustedVenues !== "function") {
        console.warn("[qsearch-nightly] trustedSync.syncAllTrustedVenues missing - skip");
        return;
      }
      return mod.syncAllTrustedVenues({ mode: "review" }).then(
        result => console.log("[qsearch-nightly] trusted review-sync done:", result),
        err => console.error("[qsearch-nightly] trusted sync failed:", err),
      );
    })
    .catch(err => {
      console.error("[qsearch-nightly] trusted sync import failed:", err);
    });
}

async function tick() {
  if (!nightlyEnabled()) return;
  const { key, hour } = pacificNowParts();
  // Run once in the 3am hour Pacific
  if (hour !== 3) return;

  // Trusted auto-publish: same 3am window, independent of scan success
  fireTrustedSync(key);

  if (lastNightlyKey === key) return;

  // Avoid double-run if last job was nightly today
  const latest = getLatestScanJob();
  if (latest?.kind === "nightly" && latest.startedAt?.startsWith(key.slice(0, 10))) {
    // startedAt is ISO UTC - fall back to lastNightlyKey only
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
