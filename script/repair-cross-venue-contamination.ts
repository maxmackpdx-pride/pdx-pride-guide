/**
 * Manual / ops: apply contamination clear via storage + re-enrich Sanctuary flyers.
 *
 * Boot migration does the SQL clear on deploy. This script is for:
 * - local data.db after code pull
 * - re-running Sanctuary page re-enrich without restart
 *
 * Usage:
 *   npx tsx script/repair-cross-venue-contamination.ts
 *   npx tsx script/repair-cross-venue-contamination.ts --dry-run
 */
import { storage } from "../server/storage";
import {
  planCrossVenueContaminationRepairs,
  applyContaminationClearPatches,
  reenrichSanctuaryContaminatedFlyers,
  type ContaminationRepairInput,
} from "../server/ingest/crossVenueContaminationRepair";

const dry = process.argv.includes("--dry-run");

async function main() {
  const events = storage.getEvents({});
  const inputs: ContaminationRepairInput[] = events.map(e => ({
    id: e.id,
    title: e.title,
    venueName: e.venueName,
    posterImageUrl: e.posterImageUrl,
    ticketUrl: e.ticketUrl,
    adminNotes: e.adminNotes,
    status: e.status,
  }));
  const patches = planCrossVenueContaminationRepairs(inputs);
  console.log(`planned patches: ${patches.length}`);
  for (const p of patches.slice(0, 40)) {
    console.log(`  #${p.id} ${p.reason} poster→${p.posterImageUrl === null ? "null" : p.posterImageUrl}`);
  }

  if (dry) {
    console.log("dry-run: no writes");
    return;
  }

  const byId = new Map(inputs.map(r => [r.id, r]));
  const stats = applyContaminationClearPatches(storage, patches, byId);
  console.log("cleared:", stats);

  console.log("re-enriching Sanctuary flyers from event pages…");
  const re = await reenrichSanctuaryContaminatedFlyers(storage, { concurrency: 3, limit: 80 });
  console.log("re-enrich:", re);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
