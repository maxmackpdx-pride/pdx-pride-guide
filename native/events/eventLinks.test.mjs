import test from "node:test";
import assert from "node:assert/strict";
import { parseEventLink, eventLink, occurrenceDate } from "./eventLinks.mjs";
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
