import { strict as assert } from "node:assert";
import { test } from "node:test";
import { safeMapReturnTo } from "./authReturn";
test("OAuth map return keeps filters and excludes external redirects", () => {
  assert.equal(safeMapReturnTo("/map?type=event"), "/map?type=event");
  for (const path of ["//evil.example/map", "https://evil.example/map", "/map/../admin", "/map\\evil", "/map\r\nLocation:evil", "/dashboard", null]) assert.equal(safeMapReturnTo(path), undefined);
});
