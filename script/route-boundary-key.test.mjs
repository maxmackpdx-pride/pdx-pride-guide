import test from "node:test";
import assert from "node:assert/strict";
import { routeBoundaryKey } from "../client/src/lib/routeBoundaryKey.ts";

test("event and place overlays stay on the board key", () => {
  assert.equal(routeBoundaryKey("/events"), "/events");
  assert.equal(routeBoundaryKey("/events?window=ALL"), "/events");
  assert.equal(routeBoundaryKey("/events/111/sapphic-takeover"), "/events");
  assert.equal(routeBoundaryKey("/events/111/sapphic-takeover?day=THU"), "/events");
  assert.equal(routeBoundaryKey("/directory"), "/directory");
  assert.equal(routeBoundaryKey("/directory/1/cc-slaughters"), "/directory");
  assert.equal(routeBoundaryKey("/directory/1/cc-slaughters?type=bar"), "/directory");
});

test("other rooms, including maps, keep their own key", () => {
  assert.equal(routeBoundaryKey("/"), "/");
  assert.equal(routeBoundaryKey("/boardz?board=housing&post=housing:13"), "/boardz");
  assert.equal(routeBoundaryKey("/needz"), "/needz");
  assert.equal(routeBoundaryKey("/map"), "/map");
  assert.equal(routeBoundaryKey("/map?layer=events"), "/map");
  assert.equal(routeBoundaryKey("/outzide"), "/outzide");
  assert.equal(routeBoundaryKey("/outzide/rooster-rock"), "/outzide/rooster-rock");
  assert.equal(routeBoundaryKey("/about/"), "/about");
});
