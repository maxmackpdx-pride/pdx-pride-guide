import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import type { AddressInfo } from "node:net";
import Database from "better-sqlite3";
import express from "express";
import type { Event } from "@shared/schema";
import { isAfterzWindowOpen } from "@shared/afterzWindow";
import { registerAfterzInvites } from "./afterzInvites";

test("Afterz drawer plumbing: window, host, hostName, and RSVP Yes/No hit live endpoints", async t => {
  const db = new Database(":memory:");
  const app = express();
  db.exec(`CREATE TABLE users(id INTEGER PRIMARY KEY,status TEXT,username TEXT,display_name TEXT);
    CREATE TABLE member_blocks(blocker_user_id INTEGER,blocked_user_id INTEGER);
    CREATE TABLE attendances(event_id INTEGER,user_id INTEGER,is_active INTEGER,expires_at TEXT);
    INSERT INTO users VALUES(1,'active','one','Jordan Host'),(2,'active','two','Riley Guest');`);
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
  let now = Date.parse("2026-11-20T22:00:00-08:00");
  app.use(express.json(), (req, _res, next) => {
    req.session = { userId: Number(req.get("account")) || undefined } as typeof req.session;
    next();
  });
  const service = registerAfterzInvites(
    app,
    db,
    (req, res, next) => (req.session.userId ? next() : void res.sendStatus(401)),
    () => now,
    {
      events: () => [evt],
      event: id => (id === 10 ? evt : undefined),
      notify: () => {},
    },
  );
  const srv = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => srv.once("listening", resolve));
  t.after(async () => {
    service.dispose();
    await new Promise<void>(r => srv.close(() => r()));
    db.close();
  });
  const call = (suffix: string, account: number, method = "GET", body?: object) =>
    fetch("http://127.0.0.1:" + (srv.address() as AddressInfo).port + "/api/afterz/" + suffix, {
      method,
      headers: { "Content-Type": "application/json", account: String(account) },
      body: body ? JSON.stringify(body) : undefined,
    });

  const afternoon = Date.parse("2026-11-20T15:00:00-08:00");
  now = afternoon;
  const closed = await (await call("window", 0)).json();
  assert.equal(closed.open, false);
  assert.equal(closed.startLocal, "21:00");
  assert.equal(closed.endLocal, "06:00");
  assert.equal(closed.timeZone, "America/Los_Angeles");
  assert.equal(isAfterzWindowOpen(afternoon), false);

  now = Date.parse("2026-11-20T22:00:00-08:00");
  const opened = await (await call("window", 0)).json();
  assert.equal(opened.open, true);
  assert.equal(isAfterzWindowOpen(now), true);

  const created = await call("gatherings", 1, "POST", {
    eventId: 10,
    occurrence: "2026-11-20",
    title: "Night shift",
    vibe: "party",
    sexPositive: false,
    nudityOk: false,
    capacity: 8,
    confirmed18: true,
    requestId: randomUUID(),
  });
  assert.equal(created.status, 201);
  const { id } = await created.json();
  assert.ok(id);

  await call("discovery", 2, "POST", { confirmed18: true });
  const nights = await (await call("nights", 2)).json();
  assert.equal(nights[0].id, id);
  assert.equal(nights[0].hostName, "Jordan Host");
  assert.equal(nights[0].vibe, "party");
  assert.equal(nights[0].title, "Night shift");

  const yes = await call("gatherings/" + id + "/request", 2, "POST", { confirmed18: true });
  assert.equal(yes.status, 200);
  const requested = await (await call("gatherings/" + id, 2)).json();
  assert.ok(["waitlisted", "pending", "accepted"].includes(requested.role));

  const no = await call("gatherings/" + id + "/leave", 2, "POST", {});
  assert.equal(no.status, 200);
  assert.deepEqual(await no.json(), { left: true });
});
