import assert from "node:assert/strict";
import { test } from "node:test";
import type { AddressInfo } from "node:net";
import Database from "better-sqlite3";
import express from "express";
import type { IStorage } from "./storage";
import type { Event } from "@shared/schema";
import { pacificCalendarDate } from "@shared/missedConnections";
import { registerEventPlanning } from "./eventPlanning";

test("ride-home checks attendance, destination, party size, capacity, contact consent and missed-check escalation", async (t) => {
  const db = new Database(":memory:"),
    app = express(),
    now = Date.now();
  const event = {
    id: 10,
    title: "Show",
    isPublic: true,
    isPrivate: false,
    status: "LIVE",
    venueName: "Public hall",
    lat: 45.5,
    lng: -122.6,
    dateStart: new Date(now - 5 * 60000).toISOString(),
    dateEnd: new Date(now + 100 * 60000).toISOString(),
  } as Event;
  const date = pacificCalendarDate(event.dateStart);
  db.exec(`CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT,status TEXT);CREATE TABLE events(id INTEGER PRIMARY KEY);
   CREATE TABLE gig_posts(id INTEGER PRIMARY KEY,title TEXT,post_type TEXT,status TEXT,created_at TEXT,location TEXT,description TEXT,compensation TEXT,gig_date TEXT,gig_time TEXT);
   CREATE TABLE member_blocks(blocker_user_id INTEGER,blocked_user_id INTEGER);
   CREATE TABLE attendances(event_id INTEGER,user_id INTEGER,is_active INTEGER,expires_at TEXT);
   INSERT INTO users VALUES(1,'driver','active'),(2,'one','active'),(3,'two','active'),(4,'contact','active');
   INSERT INTO events VALUES(10);INSERT INTO attendances VALUES(10,1,1,NULL),(10,2,1,NULL),(10,3,1,NULL)`);
  const inbox: string[] = [],
    push: number[][] = [];
  const storage = {
    getEvent: () => event,
    getUserById: (id: number) =>
      db.prepare("SELECT * FROM users WHERE id=?").get(id),
    getUserByUsername: (name: string) =>
      db.prepare("SELECT * FROM users WHERE username=?").get(name),
    getMemberBlockStatus: () => ({ interactionBlocked: false }),
    isUserEventHost: () => false,
    isFollowing: () => true,
    sendMessage: (_from: number, _to: number, _subject: string, body: string) =>
      inbox.push(body),
  } as unknown as IStorage;
  app.use(express.json(), (req, _res, next) => {
    req.session = { userId: Number(req.get("u")) } as typeof req.session;
    next();
  });
  const { night } = registerEventPlanning(
    app,
    db,
    storage,
    (req, res, next) =>
      req.session.userId ? next() : void res.sendStatus(401),
    () => true,
    () => false,
    (ids) => {
      push.push(ids);
    },
  );
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  t.after(async () => {
    night.dispose();
    await new Promise<void>((r) => server.close(() => r()));
    db.close();
  });
  const base = "/api/events/10/occurrences/" + date + "/planning",
    call = (path: string, user: number, method = "GET", body?: object) =>
      fetch(
        "http://127.0.0.1:" + (server.address() as AddressInfo).port + path,
        {
          method,
          headers: { "Content-Type": "application/json", u: String(user) },
          body: body ? JSON.stringify(body) : undefined,
        },
      );
  const data = {
    kind: "home",
    area: "Kerns",
    seats: 2,
    meeting: "Staffed door",
    leaveBy: now + 30 * 60000,
    oneWay: true,
  };
  assert.equal((await call(base + "/rides", 1, "POST", data)).status, 400);
  assert.equal(
    (
      await call(base + "/presence", 1, "POST", {
        lat: 0,
        lng: 0,
        accuracy: 20,
        area: "Kerns",
      })
    ).status,
    400,
  );
  for (const u of [1, 2, 3])
    await call(base + "/presence", u, "POST", {
      lat: 45.5,
      lng: -122.6,
      accuracy: 15,
      area: u === 3 ? "Kent" : "Kerns",
    });
  assert.equal((await call(base + "/rides", 1, "POST", data)).status, 201);
  const ride = (await (await call(base, 2)).json()).rides[0];
  assert.deepEqual((await (await call(base, 3)).json()).rides, []);
  assert.deepEqual((await (await call(base, 4)).json()).rides, []);
  night.announce();
  assert.deepEqual(push, [[2]]);
  const maps = "/api/night/ride-waypoints";
  assert.equal((await call(maps, 0)).status, 401);
  assert.deepEqual(await (await call(maps, 3)).json(), []);
  const pin = (await (await call(maps, 2)).json())[0];
  assert.equal(pin.lat, event.lat);
  assert.equal(pin.lng, event.lng);
  assert.deepEqual(pin.faces, []);
  const path = base + "/rides/" + ride.id;
  assert.equal((await call(path + "/requests", 3, "POST")).status, 404);
  await call(base + "/presence", 3, "POST", {
    lat: 45.5,
    lng: -122.6,
    accuracy: 15,
    area: "Kerns",
  });
  await call(path + "/requests", 2, "POST");
  await call(path + "/requests/2", 1, "PUT");
  assert.equal(
    (await call(path + "/depart", 1, "POST", { metTogether: true })).status,
    409,
  );
  await call(path + "/requests", 3, "POST");
  await call(path + "/requests/3", 1, "PUT");
  assert.equal(
    (await call(path + "/depart", 1, "POST", { metTogether: true })).status,
    200,
  );
  assert.equal((await call(path + "/watch", 4, "POST", {})).status, 404);
  const watch = {
    minutes: 10,
    contact: "contact",
    lat: 45.5,
    lng: -122.6,
    consent: true,
  };
  assert.equal(
    (await call(path + "/watch", 2, "POST", { ...watch, consent: false }))
      .status,
    400,
  );
  assert.equal((await call(path + "/watch", 2, "POST", watch)).status, 200);
  for (let i = 0; i < 3; i++) {
    db.prepare("UPDATE night_ride_watches SET next_at=0").run();
    night.watches();
    assert.equal(inbox.length, 0);
  }
  db.prepare("UPDATE night_ride_watches SET next_at=0").run();
  night.watches();
  assert.equal(inbox.length, 1);
  assert.match(inbox[0], /45.5,-122.6/);
  assert.deepEqual(await (await call("/api/night/ride-checks", 2)).json(), []);
});
