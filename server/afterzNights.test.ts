import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import type { AddressInfo } from "node:net";
import Database from "better-sqlite3";
import express from "express";
import type { Event } from "@shared/schema";
import { registerAfterzInvites } from "./afterzInvites";

test("event Afterz enforce time, host capacity, one renewed request and opt-in reminders", async (t) => {
  const db = new Database(":memory:"),
    app = express();
  db.exec(`CREATE TABLE users(id INTEGER PRIMARY KEY,status TEXT,username TEXT,display_name TEXT);
    CREATE TABLE member_blocks(blocker_user_id INTEGER,blocked_user_id INTEGER);
    CREATE TABLE attendances(event_id INTEGER,user_id INTEGER,is_active INTEGER,expires_at TEXT);
    INSERT INTO users VALUES(1,'active','one','Host'),(2,'active','two','A'),(3,'active','three','B');
    INSERT INTO attendances VALUES(10,3,1,NULL);`);
  const evt = {
    id: 10,
    title: "The show",
    status: "LIVE",
    dateStart: "2026-11-20T20:00:00",
    dateEnd: "2026-11-20T23:00:00",
    isPublic: true,
    isPrivate: false,
    venueName: "Public theater",
  } as Event;
  let now = Date.parse("2026-11-19T20:00:00-08:00");
  app.use(express.json(), (req, _res, next) => {
    req.session = {
      userId: Number(req.get("account")) || undefined,
    } as typeof req.session;
    next();
  });
  const delivered: number[] = [];
  const service = registerAfterzInvites(
    app,
    db,
    (req, res, next) =>
      req.session.userId ? next() : void res.sendStatus(401),
    () => now,
    {
      events: () => [evt],
      event: (id) => (id === 10 ? evt : undefined),
      notify: (ids) => {
        delivered.push(...ids);
      },
    },
  );
  const srv = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => srv.once("listening", resolve));
  t.after(async () => {
    service.dispose();
    await new Promise<void>((r) => srv.close(() => r()));
    db.close();
  });
  const call = (
    suffix: string,
    account: number,
    method = "GET",
    body?: object,
  ) =>
    fetch(
      "http://127.0.0.1:" +
        (srv.address() as AddressInfo).port +
        "/api/afterz/" +
        suffix,
      {
        method,
        headers: {
          "Content-Type": "application/json",
          account: String(account),
        },
        body: body ? JSON.stringify(body) : undefined,
      },
    );
  const make = {
    eventId: 10,
    occurrence: "2026-11-20",
    title: "Night shift",
    vibe: "social",
    sexPositive: true,
    nudityOk: false,
    capacity: 1,
    confirmed18: true,
    requestId: randomUUID(),
  };
  assert.equal((await call("nights", 0)).status, 401);
  assert.equal(
    (await call("gatherings", 1, "POST", { ...make, occurrence: "2026-11-21" }))
      .status,
    400,
  );
  const { id } = await (await call("gatherings", 1, "POST", make)).json();
  const room = "gatherings/" + id;
  assert.deepEqual(await (await call("nights", 2)).json(), []);
  await call("discovery", 2, "POST", { confirmed18: true });
  assert.equal((await (await call("nights", 2)).json())[0].glow, true);
  evt.venueName = "Sub Rosa PDX";
  evt.lat = 45.501;
  evt.lng = -122.601;
  const hidden = (await (await call("nights", 2)).json())[0];
  assert.equal(hidden.lat, null);
  assert.equal(hidden.lng, null);
  evt.venueName = "Public theater";
  for (const who of [2, 3])
    await call(room + "/request", who, "POST", { confirmed18: true });
  await call(room + "/guests/2", 1, "POST", { status: "accepted" });
  assert.equal((await (await call(room, 3)).json()).role, "waitlisted");
  for (let i = 0; i < 2; i++)
    assert.equal((await call(room + "/second", 3, "POST", {})).status, 200);
  assert.equal(
    (
      db.prepare("SELECT count(*) AS n FROM afterz_seconds").get() as {
        n: number;
      }
    ).n,
    1,
  );
  assert.equal(
    (await call(room + "/capacity", 3, "POST", { capacity: 2 })).status,
    403,
  );
  await call(room + "/capacity", 1, "POST", { capacity: 2 });
  assert.equal(
    (await call(room + "/guests/3", 1, "POST", { status: "accepted" })).status,
    200,
  );
  assert.equal(
    (await call("consent/10", 3, "PUT", { source: "rsvp", enabled: true }))
      .status,
    200,
  );
  now = Date.parse("2026-11-20T21:30:00-08:00");
  await call("consent/10", 3, "PUT", { source: "checkin", enabled: false });
  service.remind();
  assert.deepEqual(delivered, []);
  await call("consent/10", 3, "PUT", { source: "checkin", enabled: true });
  service.remind();
  service.remind();
  assert.deepEqual(delivered, [3]);
  now = Date.parse("2026-11-20T23:30:00-08:00");
  assert.equal((await call(room, 1)).status, 404);
  assert.deepEqual(await (await call("nights", 1)).json(), []);
});
