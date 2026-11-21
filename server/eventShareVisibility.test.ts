import assert from "node:assert/strict";
import { once } from "node:events";
import { copyFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import express from "express";
import test from "node:test";
import { eventShareImagePath } from "../shared/eventSlug";
import { getTuckerHostedArchiveRows, tuckerHostedArchiveAsEvent } from "../shared/tuckerHostedArchive";

test("social images and HTML expose only a currently shareable event", async t => {
  process.env.DATABASE_PATH = ":memory:";
  const { storage, sqlite } = await import("./storage");
  t.after(() => sqlite.close());
  const { getLiveEventsForSeo } = await import("./seo");
  const { serveStatic } = await import("./static");
  const { renderEventOgCard } = await import("./ogCards");
  const { default: sharp } = await import("sharp");
  const archived = tuckerHostedArchiveAsEvent(getTuckerHostedArchiveRows()[0]);
  const publicEvent = { ...archived, id: 70, title: "Public shared night", description: "Public performance.", status: "LIVE", isPublic: true };
  const privateEvent = { ...publicEvent, id: 71, title: "Private listing fixture", isPrivate: true };
  const hidden = { ...publicEvent, id: 72, title: "Hidden listing fixture", status: "HIDDEN" };
  const unlisted = { ...publicEvent, id: 73, title: "Unlisted listing fixture", isPublic: false };
  const events = [publicEvent, privateEvent, hidden, unlisted, archived];
  t.mock.method(storage, "getEvent", (id: number) => events.find(event => event.id === id));
  t.mock.method(storage, "getEvents", () => events);
  const directory = await mkdtemp(join(tmpdir(), "zaylist-share-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await copyFile("client/index.html", join(directory, "index.html"));
  const app = express();
  serveStatic(app, directory);
  const server = app.listen(0, "127.0.0.1");
  t.after(() => new Promise<void>((resolve, reject) => server.close(err => err ? reject(err) : resolve())));
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const readSharePage = async (id: number) => {
    const response = await fetch(`http://127.0.0.1:${address.port}/events/${id}/night`);
    assert.equal(response.status, 200);
    return response.text();
  };
  const positive = await readSharePage(70);
  assert.ok(positive.includes(eventShareImagePath(70)));
  assert.ok(positive.includes(publicEvent.title));
  const image = await renderEventOgCard(70);
  assert.ok(image);
  const info = await sharp(image).metadata();
  assert.deepEqual([info.width, info.height, info.format], [1200, 630, "png"]);
  for (const event of [privateEvent, hidden, unlisted, archived]) {
    assert.equal(await renderEventOgCard(event.id), null);
    const html = await readSharePage(event.id);
    assert.ok(!html.includes(event.title), event.title);
    assert.ok(!html.includes(eventShareImagePath(event.id)));
  }
  assert.ok(getLiveEventsForSeo().every(event => event.id === publicEvent.id));
  const inFlight = renderEventOgCard(publicEvent.id);
  publicEvent.isPublic = false;
  assert.equal(await inFlight, null);
});
