import assert from "node:assert/strict";
import { test } from "node:test";
import { createDemoApi, DEMO_EVENT, DEMO_NOW } from "./demo-api.ts";

const invites = "/api/afterz/gatherings",
  lantern = invites + "/demo-lantern-room";
const plan = "/api/events/2022/occurrences/2026-11-29/planning";
function fixture() {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
  const api = createDemoApi({ storage });
  const request = (path: string, method = "GET", body?: unknown) =>
    api.fetch(path, {
      method,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  const read = async (path: string) => (await request(path)).json();
  return { api, request, read, storage };
}

test("room discovery, approvals, capacity and chat are scoped to each fictional member", async () => {
  const { api, request, read, storage } = fixture();
  assert.equal((await read("/api/auth/session")).username, "demo-jules");
  assert.equal((await read("/api/events"))[0].id, DEMO_EVENT.id);
  const rooms = await read("/api/afterz/nights");
  assert.deepEqual(
    rooms.map((r: { id: string }) => r.id),
    ["demo-lantern-room", "demo-side-b", "demo-night-kitchen"],
  );
  assert.ok(rooms.every((r: Record<string, unknown>) => !("pin" in r) && !("requests" in r)));
  assert.equal((await request(lantern + "/chat/location")).status, 403);
  assert.equal((await request(lantern + "/request", "POST", { confirmed18: true })).status, 200);
  assert.equal((await read(lantern)).role, "pending");
  assert.equal((await request(invites + "/demo-night-kitchen/second", "POST", {})).status, 200);
  api.setPersona("host");
  assert.equal(
    (await read(lantern)).requests.find((g: { userId: number }) => g.userId === 901).status,
    "pending",
  );
  assert.equal(
    (await request(lantern + "/guests/901", "POST", { status: "accepted" })).status,
    200,
  );
  assert.equal((await request(lantern + "/capacity", "POST", { capacity: 1 })).status, 400);
  api.setPersona("member");
  assert.equal((await read(lantern)).role, "accepted");
  assert.match((await read(lantern + "/chat/location")).location.address, /fictional/);
  assert.equal(
    (
      await request(lantern + "/chat", "POST", {
        body: "See you there.",
        requestId: "one",
      })
    ).status,
    200,
  );
  await request(lantern + "/chat", "POST", {
    body: "See you there.",
    requestId: "one",
  });
  assert.equal(
    (await read(lantern + "/chat")).filter((m: { body: string }) => m.body === "See you there.")
      .length,
    1,
  );
  api.setPersona("host");
  await request(lantern + "/guests/901", "POST", { status: "revoked" });
  api.setPersona("member");
  assert.equal((await request(lantern + "/chat")).status, 404);
  assert.equal(
    (await read("/api/afterz/nights")).some((r: { id: string }) => r.id === "demo-lantern-room"),
    false,
  );
  assert.equal(
    (await read(invites)).some((r: { id: string }) => r.id === "demo-lantern-room"),
    false,
  );
  const reloaded = createDemoApi({ storage });
  assert.equal((await reloaded.fetch(lantern + "/chat/location")).status, 404);
  api.setPersona("guest");
  assert.equal((await request(invites)).status, 401);
  assert.equal((await request("/api/demo/profiles/demo-rowan")).status, 401);
  assert.equal((await read(plan)).rides, null);
  api.reset();
  assert.equal((await read(lantern)).role, "guest");
  assert.equal((await read("/api/demo/profiles/demo-rowan")).displayName, "Rowan Vale");
});

test("going and departing match separately; only the driver can accept a seat", async () => {
  const { api, read, request } = fixture();
  const initial = await read(plan);
  assert.deepEqual(
    initial.rides.map((r: { id: number }) => r.id),
    [301, 302, 303],
  );
  assert.deepEqual(
    initial.needs.map((n: { area: string }) => n.area),
    ["Sunnyside", "Kerns"],
  );
  assert.equal(initial.rides[0].requests.length, 0);
  assert.equal((await request(plan + "/rides/301/requests", "POST")).status, 201);
  assert.equal((await request(plan + "/rides/301/requests/901", "PUT")).status, 403);
  api.setPersona("host");
  assert.equal((await request(plan + "/rides/301/requests/901", "PUT")).status, 200);
  api.setPersona("member");
  const ride = (await read(plan)).rides[0];
  assert.equal(ride.myRequest, 1);
  assert.equal(ride.remaining, 1);
  await request(plan + "/rides/301/requests/me", "DELETE");
  assert.equal((await read(plan)).rides[0].remaining, 2);
  await request(plan + "/needs/arriving", "PUT", { area: "Kenton" });
  assert.ok(
    (await read(plan)).needs.some(
      (n: { mine: number; area: string }) => n.mine && n.area === "Kenton",
    ),
  );
  await request(plan + "/needs/arriving", "DELETE");
  await request(plan + "/rides", "POST", {
    kind: "home",
    area: "Kerns",
    meeting: "Staffed entrance",
    seats: 3,
    leaveBy: DEMO_NOW + 1800000,
  });
  const own = (await read(plan)).rides.find((r: { mine: boolean }) => r.mine);
  assert.equal(own.plan.kind, "home");
  await request(plan + "/rides/" + own.id, "DELETE");
  assert.equal(
    (await read(plan)).rides.some((r: { mine: boolean }) => r.mine),
    false,
  );
});

test("private-link rooms, reports and poster uploads stay on this device", async () => {
  const { api, read, request } = fixture();
  const payload = {
    title: "Demo breakfast club",
    confirmed18: true,
    requestId: "breakfast-1",
  };
  const { id } = await (await request(invites, "POST", payload)).json();
  assert.equal((await (await request(invites, "POST", payload)).json()).id, id);
  assert.ok((await read(invites)).some((r: { id: string }) => r.id === id));
  assert.equal(
    (await read("/api/afterz/nights")).some((r: { id: string }) => r.id === id),
    false,
  );
  const { receiptId } = await (
    await request("/api/feedback", "POST", { message: "Fixture report" })
  ).json();
  api.setPersona("host");
  assert.equal(
    (await read("/api/me/report-receipts")).some((r: { id: number }) => r.id === receiptId),
    false,
  );
  assert.equal((await request(invites + "/" + id + "/chat")).status, 403);
  api.setPersona("member");
  await request(invites + "/" + id + "/close", "POST", {});
  assert.equal((await request(invites + "/" + id)).status, 404);
  const form = new FormData();
  form.set("poster", new Blob(["sample"], { type: "image/png" }), "sample.png");
  const upload = await api.fetch("/api/upload/poster", {
    method: "POST",
    body: form,
  });
  assert.match((await upload.json()).url, /^data:image\/png;base64,/);
});
