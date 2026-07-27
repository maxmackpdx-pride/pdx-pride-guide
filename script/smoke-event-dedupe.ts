/**
 * Offline smoke for same-day/same-time event de-dupe (shared/eventDedupe.ts).
 *   npx tsx script/smoke-event-dedupe.ts
 */
import { dedupeEvents, findDuplicateEventGroups } from "../shared/eventDedupe";

let failures = 0;
function check(name: string, cond: boolean) {
  console.log(`${cond ? "✓" : "✗"} ${name}`);
  if (!cond) failures++;
}
const ev = (id: number, title: string, venueName: string, dateStart: string, extra: any = {}) =>
  ({ id, title, venueName, dateStart, description: "", ...extra });

// Same event, entered twice at the same day+time — one has a poster.
const a1 = ev(1, "Stank Yes Coach", "Sanctuary", "2026-08-01T21:00");
const a2 = ev(2, "STANK yes coach!", "sanctuary", "2026-08-01T21:00", { posterImageUrl: "/p.jpg" });
// Same title+venue but a different start time → NOT a dup (early vs late show).
const b1 = ev(3, "Drag Brunch", "Darcelle", "2026-08-02T11:00");
const b2 = ev(4, "Drag Brunch", "Darcelle", "2026-08-02T14:00");
// Same title+time but different venue → NOT a dup.
const c1 = ev(5, "Karaoke Night", "Crush", "2026-08-03T21:00");
const c2 = ev(6, "Karaoke Night", "Eagle", "2026-08-03T21:00");

const out = dedupeEvents([a1, a2, b1, b2, c1, c2]);
check("collapses the same-day/same-time pair", out.length === 5);
check("keeps the richer (poster) copy of the dup", out.some(e => e.id === 2) && !out.some(e => e.id === 1));
check("different start times both kept", out.some(e => e.id === 3) && out.some(e => e.id === 4));
check("different venues both kept", out.some(e => e.id === 5) && out.some(e => e.id === 6));
check("preserves first-seen order", out.map(e => e.id).join(",") === "2,3,4,5,6");

const groups = findDuplicateEventGroups([a1, a2, b1, b2, c1, c2]);
check("finds exactly one duplicate group", groups.length === 1 && groups[0].length === 2);

// No dupes at all ⇒ identity passthrough
const clean = dedupeEvents([b1, b2, c1]);
check("no-dup input returns all rows", clean.length === 3);

console.log(failures === 0 ? "\nALL PASS" : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
