import assert from "node:assert/strict";
import test from "node:test";
import { mirrorEventPosters } from "./mirrorEventPosters";

const future = "2099-01-01T12:00:00.000Z";

test("mirrors remote event and candidate flyers without touching local or past art", async () => {
  const eventUpdates: Array<[number, string]> = [];
  const candidateUpdates: Array<[string, string]> = [];
  const captured: string[] = [];

  const summary = await mirrorEventPosters({
    events: [
      { id: 1, posterImageUrl: "https://img.example/event.jpg", dateStart: future, dateEnd: future, ticketUrl: null },
      { id: 2, posterImageUrl: "/posters/local.jpg", dateStart: future, dateEnd: future, ticketUrl: null },
      { id: 3, posterImageUrl: "https://img.example/past.jpg", dateStart: "2020-01-01", dateEnd: "2020-01-01", ticketUrl: null },
    ] as any,
    pendingCandidates: [
      {
        id: "candidate-1",
        sourceUrl: "https://events.example/listing",
        draft: { posterImageUrl: "https://img.example/candidate.jpg", dateStart: future, dateEnd: future },
      },
    ],
    capture: async (url) => {
      captured.push(String(url));
      return { url: `/uploads/${String(url).includes("candidate") ? "candidate" : "event"}.jpg`, captured: true };
    },
    updateEventPoster: (id, url) => eventUpdates.push([id, url]),
    updateCandidatePoster: (id, url) => {
      candidateUpdates.push([id, url]);
      return true;
    },
    now: Date.parse("2026-08-15T00:00:00Z"),
  });

  assert.deepEqual(summary, { checked: 2, captured: 2, retainedRemote: 0 });
  assert.deepEqual(captured, ["https://img.example/event.jpg", "https://img.example/candidate.jpg"]);
  assert.deepEqual(eventUpdates, [[1, "/uploads/event.jpg"]]);
  assert.deepEqual(candidateUpdates, [["candidate-1", "/uploads/candidate.jpg"]]);
});

test("retains the remote URL when capture fails", async () => {
  let updates = 0;
  const summary = await mirrorEventPosters({
    events: [
      { id: 1, posterImageUrl: "https://img.example/event.jpg", dateStart: future, dateEnd: future, ticketUrl: null },
    ] as any,
    pendingCandidates: [],
    capture: async () => ({ url: "https://img.example/event.jpg", captured: false, warning: "network" }),
    updateEventPoster: () => { updates += 1; },
    updateCandidatePoster: () => false,
    now: Date.parse("2026-08-15T00:00:00Z"),
  });

  assert.deepEqual(summary, { checked: 1, captured: 0, retainedRemote: 1 });
  assert.equal(updates, 0);
});
