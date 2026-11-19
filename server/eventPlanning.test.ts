import assert from "node:assert/strict";
import { test } from "node:test";
import Database from "better-sqlite3";
import express from "express";
import type { AddressInfo } from "node:net";
import type { IStorage } from "./storage";
import { registerEventPlanning } from "./eventPlanning";

test("planning is occurrence-, owner-, participant- and host-scoped", async (t) => {
  const db = new Database(":memory:");
  t.after(() => db.close());
  db.exec(`CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT,email TEXT,status TEXT);
    CREATE TABLE events(id INTEGER PRIMARY KEY,title TEXT,date_start TEXT,status TEXT,claimed_by TEXT,submitted_by TEXT,source TEXT,is_claimable INTEGER DEFAULT 0);
    CREATE TABLE event_hosts(event_id INTEGER,user_id INTEGER);
    CREATE TABLE member_blocks(blocker_user_id INTEGER,blocked_user_id INTEGER);
    CREATE TABLE gig_posts(id INTEGER PRIMARY KEY,title TEXT,status TEXT,post_type TEXT,created_at TEXT,location TEXT,description TEXT,compensation TEXT,gig_date TEXT,gig_time TEXT);
    CREATE TABLE attendances(event_id INTEGER,user_id INTEGER,is_active INTEGER,expires_at TEXT);
    CREATE TABLE event_saves(user_id INTEGER,event_id INTEGER);
    INSERT INTO users VALUES(1,'driver','d@example.test','active'),(2,'rider','r@example.test','active'),(3,'other','o@example.test','active');
    INSERT INTO events(id,title,date_start,status) VALUES(10,'First','2099-07-01T16:00:00','LIVE'),(11,'Other','2099-07-01T16:00:00','LIVE');
    INSERT INTO events(id,title,date_start,status,submitted_by,source) VALUES(12,'Tip','2099-07-01T16:00:00','LIVE','rider','community_tip');
    INSERT INTO event_hosts VALUES(10,1),(11,3);
    INSERT INTO gig_posts(id,title,status,post_type) VALUES(20,'legacy','LIVE','POSTING_GIG'),(21,'linked','LIVE','POSTING_GIG'),(22,'hidden','PENDING','POSTING_GIG');
    INSERT INTO attendances VALUES(10,2,1,NULL),(10,3,0,NULL),(10,1,1,'2020-01-01'),(11,1,1,NULL);
    INSERT INTO event_saves VALUES(2,10);`);
  const app = express();
  app.use(express.json());
  app.use((req, res, next) => {
    req.session = {
      userId: Number(req.headers["fixture-viewer"]) || undefined,
    } as typeof req.session;
    next();
  });
  const dbEvent = {
    id: 10,
    status: "LIVE",
    isPublic: true,
    isPrivate: false,
    title: "First",
    venueName: "Community room",
    dayOfWeek: "WED",
    dateStart: "2099-07-01T16:00:00",
    dateEnd: "2099-07-02T18:00:00",
  };
  const storage = {
    getEvent: (id: number) => (id === 10 ? dbEvent : null),
    getUserById: (id: number) =>
      db.prepare("SELECT * FROM users WHERE id=?").get(id),
    getMemberBlockStatus: (a: number, b: number) => ({
      interactionBlocked: !!db
        .prepare(
          "SELECT 1 FROM member_blocks WHERE (blocker_user_id=? AND blocked_user_id=?) OR (blocked_user_id=? AND blocker_user_id=?)",
        )
        .get(a, b, a, b),
    }),
    isUserEventHost: (id: number, user: number) =>
      !!db
        .prepare("SELECT 1 FROM event_hosts WHERE event_id=? AND user_id=?")
        .get(id, user),
  } as unknown as IStorage;
  const { store } = registerEventPlanning(
    app,
    db,
    storage,
    (req, res, next) => {
      if (!req.session.userId) {
        res.sendStatus(401);
        return;
      }
      next();
    },
    () => true,
    () => false,
  );
  store.linkGig(21, 10, "2099-07-02");
  store.linkGig(22, 10, "2099-07-02");
  assert.deepEqual(store.hostedCandidates(2), []);
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((done) => server.once("listening", done));
  t.after(() => new Promise<void>((done) => server.close(() => done())));
  const base = "http://127.0.0.1:" + (server.address() as AddressInfo).port;
  const request = (path: string, user = 0, method = "GET", body?: unknown) =>
    fetch(base + path, {
      method,
      headers: {
        "fixture-viewer": String(user),
        "content-type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  const first = "/api/events/10/occurrences/2099-07-01/planning",
    second = first.replace("07-01", "07-02");
  const guest = await (await request(second)).json();
  assert.equal(guest.rides, null);
  assert.deepEqual(
    guest.gigs.map((g: { id: number }) => g.id),
    [21],
  );
  assert.deepEqual((await (await request(first, 1)).json()).gigs, []);
  assert.equal((await (await request(second, 1)).json()).canPostGig, true);
  assert.equal((await (await request(second, 2)).json()).canPostGig, false);
  assert.equal((await request(second.replace("07-02", "07-03"))).status, 404);
  assert.equal(
    (await request(second + "/rides", 0, "POST", { area: "North", seats: 1 }))
      .status,
    401,
  );
  assert.equal(
    (await request(second + "/rides", 1, "POST", { area: "North", seats: 1 }))
      .status,
    201,
  );
  const ride = second + "/rides/1";
  assert.equal(
    (await request(first + "/rides/1/requests", 2, "POST")).status,
    404,
  );
  assert.equal((await request(ride + "/requests", 2, "POST")).status, 201);
  assert.equal((await request(ride + "/requests", 3, "POST")).status, 201);
  assert.equal((await request(ride + "/requests/2", 3, "PUT")).status, 403);
  assert.equal((await request(ride + "/requests/2", 1, "PUT")).status, 200);
  assert.equal((await request(ride + "/requests/3", 1, "PUT")).status, 409);
  const riderView = await (await request(second, 2)).json();
  assert.equal(riderView.rides[0].myRequest, 1);
  assert.equal(riderView.rides[0].remaining, 0);
  assert.deepEqual(riderView.rides[0].requests, []);
  assert.equal((await request(ride, 2, "DELETE")).status, 403);
  assert.equal((await request(ride + "/requests/me", 2, "DELETE")).status, 200);
  assert.equal((await request(ride + "/requests/3", 1, "PUT")).status, 200);
  db.prepare("INSERT INTO member_blocks VALUES(?,?)").run(1, 2);
  assert.deepEqual((await (await request(second, 2)).json()).rides, []);
  assert.equal((await request(ride + "/requests", 2, "POST")).status, 404);
  assert.equal((await request("/api/organizer/events/metrics")).status, 401);
  assert.deepEqual(
    await (await request("/api/organizer/events/metrics", 1)).json(),
    { events: [{ id: 10, title: "First", activeGoing: 1 }] },
  );
  assert.deepEqual(
    await (await request("/api/organizer/events/metrics", 2)).json(),
    { events: [] },
  );
  assert.equal((await request(ride, 1, "DELETE")).status, 200);
  assert.equal(
    (
      db.prepare("SELECT COUNT(*) AS n FROM event_ride_requests").get() as {
        n: number;
      }
    ).n,
    0,
  );
});
