import assert from "node:assert/strict";
import { after, test } from "node:test";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import path from "node:path";

// The change feed (agent_event_change_log) must capture EVERY event mutation,
// not just the event-research API's own writes: creates, edits, hides and
// deletes from any path through storage, with a named actor per path. These
// tests drive the storage funnel the same way the bypassing writers do —
// most importantly the poster-mirror backfill that rewrites posterImageUrl
// with { source: "sync" } at startup — and assert the feed rows land.

mkdirSync(".local", { recursive: true });
const directory = mkdtempSync(path.resolve(".local/event-change-feed-"));
process.env.DATABASE_PATH = path.join(directory, "data.db");
copyFileSync("data.db", process.env.DATABASE_PATH);
const { storage, sqlite } = await import("./storage");
const { listEventResearchChanges } = await import("./eventResearchMemory");
// Let the existing asynchronous boot seed finish before closing the disposable DB.
await import("./qsearch/seedMissingYearround");
await new Promise<void>(resolve => setImmediate(resolve));
after(() => { sqlite.close(); rmSync(directory, { recursive: true, force: true }); });

type FeedRow = {
  operation: string;
  event_id: number;
  actor: string;
  reason: string | null;
  before_json: string;
  after_json: string;
  patch_json: string | null;
};
const feedRowsFor = (eventId: number): FeedRow[] =>
  sqlite
    .prepare(
      `SELECT operation, event_id, actor, reason, before_json, after_json, patch_json
       FROM agent_event_change_log WHERE event_id = ? ORDER BY id ASC`,
    )
    .all(eventId) as FeedRow[];

const baseEvent = {
  title: "Change Feed Fixture",
  description: "Fixture description",
  venueName: "Fixture Venue",
  dateStart: "2026-12-01T20:00:00",
  dateEnd: "2026-12-01T23:00:00",
  status: "LIVE",
  posterImageUrl: "https://cdn.example.com/flyers/original.avif",
  source: "change-feed-test",
};

test("create writes a feed record with the caller's actor", () => {
  const created = storage.createEvent(baseEvent as any, {
    actor: "test:create",
    reason: "change feed test create",
  }) as { id: number };
  assert.ok(created?.id);
  const rows = feedRowsFor(created.id);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].operation, "create");
  assert.equal(rows[0].actor, "test:create");
  const patch = JSON.parse(rows[0].patch_json || "{}");
  assert.equal(patch.posterImageUrl, "https://cdn.example.com/flyers/original.avif");
});

test("pipeline-style poster rewrite writes a record with before/after posterImageUrl", () => {
  const created = storage.createEvent(baseEvent as any, {
    actor: "test:create",
  }) as { id: number };
  // Exactly the call shape the startup poster-mirror backfill makes.
  storage.updateEvent(
    created.id,
    { posterImageUrl: "/uploads/posters/mirrored.webp" } as any,
    {
      source: "sync",
      actor: "poster-mirror",
      reason: "Startup poster mirror backfill: remote flyer captured to a local /uploads/ path",
    },
  );
  const rows = feedRowsFor(created.id).filter(row => row.operation === "update");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].actor, "poster-mirror");
  const before = JSON.parse(rows[0].before_json);
  const after = JSON.parse(rows[0].after_json);
  const patch = JSON.parse(rows[0].patch_json || "{}");
  assert.equal(before.posterImageUrl, "https://cdn.example.com/flyers/original.avif");
  assert.equal(after.posterImageUrl, "/uploads/posters/mirrored.webp");
  assert.equal(patch.posterImageUrl, "/uploads/posters/mirrored.webp");

  // The admin feed reader (GET /api/admin/event-research/changes) surfaces it.
  const feed = listEventResearchChanges(200) as Array<{
    operation: string;
    eventId: number;
    actor: string;
    beforeValues: Record<string, unknown>;
    afterValues: Record<string, unknown>;
  }>;
  const entry = feed.find(
    change => change.eventId === created.id && change.operation === "update",
  );
  assert.ok(entry, "poster rewrite must appear in the admin change feed");
  assert.equal(entry.actor, "poster-mirror");
  assert.equal(entry.beforeValues.posterImageUrl, "https://cdn.example.com/flyers/original.avif");
  assert.equal(entry.afterValues.posterImageUrl, "/uploads/posters/mirrored.webp");
});

test("edit writes an update record; a no-op write writes nothing", () => {
  const created = storage.createEvent(baseEvent as any, {
    actor: "test:create",
  }) as { id: number };
  storage.updateEvent(created.id, { title: "Change Feed Fixture (Renamed)" } as any, {
    actor: "admin:tester",
    reason: "Admin event edit",
  });
  const rows = feedRowsFor(created.id);
  const updates = rows.filter(row => row.operation === "update");
  assert.equal(updates.length, 1);
  assert.equal(updates[0].actor, "admin:tester");
  assert.equal(JSON.parse(updates[0].patch_json || "{}").title, "Change Feed Fixture (Renamed)");

  const countBefore = feedRowsFor(created.id).length;
  storage.updateEvent(created.id, { title: "Change Feed Fixture (Renamed)" } as any, {
    actor: "admin:tester",
  });
  assert.equal(feedRowsFor(created.id).length, countBefore, "no-op saves must not spam the feed");
});

test("hide via updateEventStatus writes a hide record with status before/after", () => {
  const created = storage.createEvent(baseEvent as any, {
    actor: "test:create",
  }) as { id: number };
  storage.updateEventStatus(created.id, "HIDDEN", {
    actor: "admin:tester",
    reason: "Admin event hide",
  });
  const rows = feedRowsFor(created.id);
  const hide = rows.find(row => row.operation === "hide");
  assert.ok(hide, "hide must be recorded");
  assert.equal(hide.actor, "admin:tester");
  assert.equal(JSON.parse(hide.before_json).status, "LIVE");
  assert.equal(JSON.parse(hide.after_json).status, "HIDDEN");
  assert.equal(JSON.parse(hide.patch_json || "{}").status, "HIDDEN");
});

test("changeFeed: false opts out (the event-research API records its own richer rows)", () => {
  const created = storage.createEvent(baseEvent as any, { changeFeed: false }) as { id: number };
  assert.ok(created?.id);
  assert.equal(feedRowsFor(created.id).length, 0);
});

test("hard delete still writes its delete record (Nov 5 deletion tracking preserved)", () => {
  const insert = sqlite.prepare(
    "INSERT INTO events (title, description, venue_name, date_start, date_end) VALUES ('Change Feed Expired Fixture','Fixture','Fixture',?,?)",
  );
  const expiredId = Number(insert.run("2026-06-01", "2026-06-02").lastInsertRowid);
  const purged = storage.purgeExpiredEvents(Date.parse("2026-09-23T18:00:00Z"));
  assert.ok(purged > 0);
  assert.equal(sqlite.prepare("SELECT id FROM events WHERE id=?").get(expiredId), undefined);
  const rows = feedRowsFor(expiredId);
  const deletion = rows.find(row => row.operation === "delete");
  assert.ok(deletion, "delete must be recorded");
  assert.equal(deletion.actor, "retention-purge");
  assert.equal(JSON.parse(deletion.before_json).title, "Change Feed Expired Fixture");
});
