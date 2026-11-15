import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { DatabaseSync } from "node:sqlite";
import { randomUUID, createHash } from "node:crypto";
import vm from "node:vm";
import express from "express";
import * as platform from "@shared/platform";
import { eventPath } from "@shared/eventSlug";
import { placePath } from "@shared/placeSlug";
import { platformOpenApi } from "./platformOpenApi";

// Execute the production router with real schemas/Express/SQL, but isolated storage.
// Never import storage.ts here: it seeds/migrates the configured application database.
async function fixture() {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE events(id INTEGER,title TEXT,description TEXT,status TEXT,is_public INTEGER,is_private INTEGER,poster_image_url TEXT,date_start TEXT,date_end TEXT,venue_name TEXT);
    CREATE TABLE communities(id TEXT,visibility TEXT,slug TEXT,name TEXT,membership_policy TEXT);
    CREATE TABLE community_memberships(community_id TEXT,user_id INTEGER,status TEXT,role TEXT);
    CREATE TABLE community_relationships(community_id TEXT,target_type TEXT,target_id INTEGER,relationship_type TEXT,created_at TEXT);
    CREATE TABLE businesses(id INTEGER,name TEXT,active INTEGER,image_url TEXT);
    CREATE TABLE users(id INTEGER); CREATE TABLE sellz_posts(id INTEGER); CREATE TABLE gig_posts(id INTEGER);
    INSERT INTO communities VALUES('com_fixture','public','fixture','Fixture community','open');
  `);
  const insert = db.prepare("INSERT INTO events VALUES(?,?,?,?,?,?,?,?,?,?)");
  for (const [id, title, status, isPublic, isPrivate] of [
    [1, "PUBLIC", "LIVE", 1, 0], [2, "PRIVATE", "LIVE", 0, 1],
    [3, "NONPUBLIC", "LIVE", 0, 0], [4, "CONFLICT", "LIVE", 1, 1],
    [5, "DRAFT", "DRAFT", 1, 0], [6, "UNKNOWN", "LIVE", null, null],
  ] as const) {
    insert.run(id, `Fixture ${title}`, `${title} body`, status, isPublic, isPrivate, `/fixture-${id}.png`, "2026-12-01T12:00:00Z", "2026-12-01T13:00:00Z", "Fixture venue");
    db.prepare("INSERT INTO community_relationships VALUES('com_fixture','event',?,'hosts','now')").run(id);
  }
  const sqlite = {
    exec: (sql: string) => db.exec(sql), prepare: (sql: string) => db.prepare(sql),
    transaction: (fn: () => unknown) => () => {
      db.exec("BEGIN"); try { const result = fn(); db.exec("COMMIT"); return result; }
      catch (error) { db.exec("ROLLBACK"); throw error; }
    },
  };
  const source = readFileSync(new URL("./platformV1.ts", import.meta.url), "utf8")
    .replace(/^import .*;\n/gm, "")
    .replace("export function registerPlatformV1", "function registerPlatformV1");
  const context = vm.createContext({ ...platform, platformOpenApi, sqlite, eventPath, placePath,
    randomUUID, createHash, Buffer, console, process: { env: {} }, ensureCommunityTables() {} });
  vm.runInContext(stripTypeScriptTypes(source), context);
  const app = express();
  app.use((req: any, _res, next) => { req.session = req.get("x-fixture-user") ? { userId: 999 } : {}; next(); });
  context.registerPlatformV1(app, { requireAuth: (_req: any, _res: any, next: () => void) => next(), readNotificationPrefs: () => ({}), updateNotificationPrefs: () => ({}) });
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.once("listening", resolve));
  const address = server.address() as { port: number };
  const get = async (path: string, signedIn = false) => {
    const response = await fetch(`http://127.0.0.1:${address.port}${path}`, { headers: signedIn ? { "x-fixture-user": "1" } : {} });
    return { status: response.status, body: await response.json() as any };
  };
  const eventId = (id: number) => String((db.prepare("SELECT typed_id FROM platform_identities WHERE resource_type='event' AND legacy_id=?").get(String(id)) as any).typed_id);
  return { db, get, eventId, close: async () => { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); db.close(); } };
}

test("v1 public lists/search/media exclude private, non-public, conflicting and unknown events", async () => {
  const f = await fixture();
  try {
    for (const signedIn of [false, true]) {
      for (const path of ["/api/v1/events", "/api/v1/search?q=Fixture&types=event"]) {
        const r = await f.get(path, signedIn); assert.equal(r.status, 200);
        assert.deepEqual(r.body.data.map((x: any) => x.sourceId), [1]);
      }
      for (const path of ["/api/v1/media", "/api/v1/search?q=Fixture&types=media"]) {
        const r = await f.get(path, signedIn); assert.equal(r.status, 200);
        assert.deepEqual(r.body.data.map((x: any) => x.name), ["Fixture PUBLIC poster"]);
      }
    }
  } finally { await f.close(); }
});

test("v1 direct objects, capabilities and relationship edges enforce event privacy", async () => {
  const f = await fixture();
  try {
    for (const signedIn of [false, true]) {
      for (const id of [1, 2, 3, 4, 5, 6]) {
        for (const path of [`/api/v1/objects/${f.eventId(id)}`, `/api/v1/events/${f.eventId(id)}`, `/api/v1/objects/${f.eventId(id)}/capabilities`, `/api/v1/relationships/${f.eventId(id)}`]) {
          const r = await f.get(path, signedIn); assert.equal(r.status, id === 1 ? 200 : 404, path);
        }
      }
      const r = await f.get("/api/v1/relationships/com_fixture", signedIn);
      assert.equal(r.status, 200); assert.deepEqual(r.body.data.map((x: any) => x.to), [f.eventId(1)]);
    }
  } finally { await f.close(); }
});

test("v1 stale event/media identities cannot reveal an event after visibility changes", async () => {
  const f = await fixture();
  try {
    const mediaId = (await f.get("/api/v1/media")).body.data[0].id;
    assert.equal((await f.get(`/api/v1/media/${mediaId}`)).status, 200);
    f.db.exec("UPDATE events SET is_private=1 WHERE id=1");
    for (const signedIn of [false, true]) {
      for (const id of [f.eventId(1), mediaId]) {
        for (const path of [`/api/v1/objects/${id}`, `/api/v1/objects/${id}/capabilities`, `/api/v1/relationships/${id}`])
          assert.equal((await f.get(path, signedIn)).status, 404, path);
      }
      assert.equal((await f.get(`/api/v1/media/${mediaId}`, signedIn)).status, 404);
      assert.deepEqual((await f.get("/api/v1/relationships/com_fixture", signedIn)).body.data, []);
      assert.deepEqual((await f.get("/api/v1/media", signedIn)).body.data, []);
    }
  } finally { await f.close(); }
});
