import assert from "node:assert/strict";
import test from "node:test";
import { activeOutzOfficialNotice, type OutzOfficialNotice } from "./outz";

const notice: OutzOfficialNotice = {
  summary: "Closed for construction.",
  sourceUrl: "https://example.test/official-notice",
  checkedAt: "2026-09-10",
  expiresAt: "2026-09-17T00:00:00-07:00",
};

test("OUTZ official notices are withheld after their evidence expiry", () => {
  assert.equal(activeOutzOfficialNotice(notice, Date.parse("2026-09-16T23:59:59-07:00"))?.summary, notice.summary);
  assert.equal(activeOutzOfficialNotice(notice, Date.parse("2026-09-17T00:00:00-07:00")), null);
  assert.equal(activeOutzOfficialNotice({ ...notice, expiresAt: "not-a-date" }), null);
});
