import { strict as assert } from "node:assert";
import { test } from "node:test";
import { safeMapReturnTo, safeGoogleReturnTo } from "./authReturn";
test("OAuth map return keeps filters and excludes external redirects", () => {
  assert.equal(safeMapReturnTo("/map?type=event"), "/map?type=event");
  for (const path of ["//evil.example/map", "https://evil.example/map", "/map/../admin", "/map\\evil", "/map\r\nLocation:evil", "/dashboard", null]) assert.equal(safeMapReturnTo(path), undefined);
});

test("Google return allows /map and exactly /admin only", () => {
  assert.equal(safeGoogleReturnTo("/admin"), "/admin");
  assert.equal(safeGoogleReturnTo("/map?type=event"), "/map?type=event");
  for (const path of ["/admin?x=1", "/admin/", "//evil.example/admin", "https://evil.example/admin", "/admin\\evil", "/admin\r\nLocation:evil", "/dashboard", undefined]) assert.equal(safeGoogleReturnTo(path), undefined);
});
