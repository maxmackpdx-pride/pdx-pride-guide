import assert from "node:assert/strict";
import test from "node:test";
import { getTuckerHostedArchiveRows, tuckerHostedArchiveAsEvent } from "../shared/tuckerHostedArchive";

test("private event notes remain in the event read and leave the public Mizzed board and pickers", async t => {
  process.env.DATABASE_PATH = ":memory:";
  const { storage, sqlite } = await import("./storage");
  t.after(() => sqlite.close());
  const { id, createdAt, updatedAt, ...fixture } = tuckerHostedArchiveAsEvent(getTuckerHostedArchiveRows()[0]);
  const event = storage.createEvent({
    ...fixture, status: "LIVE", isPublic: true, isPrivate: false,
    dateStart: new Date(Date.now() - 3600000).toISOString(),
    dateEnd: new Date(Date.now() + 3600000).toISOString(),
  });
  const note = storage.createMissedConnection({ eventId: event.id, userId: 1, title: "The red jacket", body: "We met by the stage." });
  const mayPost = () => storage.getPostableEventsForMissedConnections(false).some(item => item.id === event.id);
  const canLink = () => storage.getLinkableEventsForMissedConnections().some(item => item.id === event.id);
  const onBoard = () => storage.getMissedConnections("ACTIVE").some(item => item.id === note.id);
  assert.ok(mayPost() && canLink() && onBoard());
  storage.updateEvent(event.id, { isPrivate: true, isPublic: false });
  assert.equal(mayPost(), false);
  assert.equal(canLink(), false);
  assert.equal(onBoard(), false);
  assert.ok(storage.getMissedConnectionsByEvent(event.id, 1).some(item => item.id === note.id));
});
