import test from "node:test";
import assert from "node:assert/strict";
import { parseEventLink, eventLink, occurrenceDate, isPublicListing } from "./eventLinks.mjs";
test("the public and installed app links keep the exact occurrence", () => {
  assert.deepEqual(parseEventLink(eventLink(234, "2026-11-21")), {
    id: 234,
    date: "2026-11-21",
  });
  assert.deepEqual(
    parseEventLink("zaylistevents://events/234?date=2026-11-21"),
    { id: 234, date: "2026-11-21" },
  );
  assert.deepEqual(
    parseEventLink("exp://localhost:8081/--/events/234?date=2026-11-21"),
    { id: 234, date: "2026-11-21" },
  );
  assert.equal(parseEventLink("https://unknown.example/events/234"), null);
  assert.equal(
    parseEventLink("https://www.zaylist.com/events/234?date=yesterday"),
    null,
  );
  assert.equal(occurrenceDate("2026-11-19T03:30:00Z"), "2026-11-18");
});

test("native listing and detail require a live, explicitly public, non-private event", () => {
  const publicRow = {status:"LIVE", isPublic:true, isPrivate:false};
  assert.equal(isPublicListing(publicRow), true);
  assert.equal(isPublicListing({status:"LIVE", isPublic:1, isPrivate:0}), true);
  for (const row of [null, {}, {status:"LIVE"}, {...publicRow, status:"HIDDEN"},
    {...publicRow, isPrivate:true}, {...publicRow, isPublic:false},
    {...publicRow, isPrivate:null}, {...publicRow, isPublic:"1"}]) {
    assert.equal(isPublicListing(row), false);
  }
});
