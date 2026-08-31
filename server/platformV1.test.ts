import assert from "node:assert/strict";
import test from "node:test";
import { platformOpenApi } from "./platformOpenApi";
import { PLATFORM_API_VERSION, parsePlatformId, platformId, platformListQuerySchema, platformObjectTypes, platformSearchQuerySchema, typedIdSchema } from "@shared/platform";

test("typed IDs preserve type and opaque source identity", () => {
  for (const type of platformObjectTypes) {
    const id = platformId(type, "abc_123");
    assert.equal(typedIdSchema.safeParse(id).success, true);
    assert.equal(parsePlatformId(id)?.type, type);
  }
});

test("v1 query schemas reject unknown and unsafe pagination input", () => {
  assert.equal(platformSearchQuerySchema.safeParse({ q: "po", limit: "100" }).success, true);
  assert.equal(platformSearchQuerySchema.safeParse({ q: "p" }).success, false);
  assert.equal(platformSearchQuerySchema.safeParse({ q: "portland", extra: "leak" }).success, false);
  assert.equal(platformListQuerySchema.safeParse({ limit: "101" }).success, false);
  assert.equal(platformListQuerySchema.safeParse({ cursor: "safe", offset: "1" }).success, false);
});

test("OpenAPI describes every resource list and detail route", () => {
  assert.equal(platformOpenApi.info.version, PLATFORM_API_VERSION);
  for (const type of platformObjectTypes) {
    const plural = type === "community" ? "communities" : type === "media" ? "media" : `${type}s`;
    assert.ok((platformOpenApi.paths as any)[`/api/v1/${plural}`]?.get);
    assert.ok((platformOpenApi.paths as any)[`/api/v1/${plural}/{id}`]?.get);
  }
  assert.ok(platformOpenApi.paths["/api/v1/search"].get);
  assert.ok(platformOpenApi.paths["/api/v1/relationships/{id}"].get);
});
