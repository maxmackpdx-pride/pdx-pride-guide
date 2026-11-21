import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import Database from "better-sqlite3";
import express from "express";
import type { AddressInfo } from "node:net";
import type { IStorage } from "./storage";
import { registerEventPlanning, validateAdminGigEventLink } from "./eventPlanning";
import { ridezOfferBody, ridezPlanningBase } from "../client/src/lib/ridezForm";

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
    INSERT INTO users VALUES(1,'driver','d@example.test','active'),(2,'rider','r@example.test','active'),(3,'other','o@example.test','active'),(4,'loner','l@example.test','active');
    CREATE TABLE follows(follower_user_id INTEGER,following_user_id INTEGER);
    INSERT INTO follows VALUES(1,3),(3,1),(2,3),(3,2),(4,1);
    CREATE TABLE afterz_gatherings(id TEXT PRIMARY KEY,host_id INTEGER,closes_at INTEGER);
    CREATE TABLE afterz_guests(gathering_id TEXT,user_id INTEGER,status TEXT);
    INSERT INTO afterz_gatherings VALUES('g1',3,4102444800000);
    INSERT INTO afterz_guests VALUES('g1',2,'accepted');
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
    lat: 45.5231,
    lng: -122.6765,
  };
  const notices: { ids: number[]; sender: number; title: string; path: string; tag: string }[] = [];
  const inbox: { from: number; to: number; subject: string }[] = [];
  const storage = {
    sendMessage: (from: number, to: number, subject: string) => { inbox.push({ from, to, subject }); },
    getEvent: (id: number) => (id === 10 ? dbEvent : null),
    getUserById: (id: number) =>
      db.prepare("SELECT * FROM users WHERE id=?").get(id),
    getUserByUsername: (username: string) => {
      const row = db.prepare("SELECT * FROM users WHERE username=?").get(username) as Record<string, unknown> | undefined;
      return row ? { ...row, photoUrl: username === "driver" ? "/uploads/profile/driver.webp" : null } : undefined;
    },
    getMemberBlockStatus: (a: number, b: number) => ({
      interactionBlocked: !!db
        .prepare(
          "SELECT 1 FROM member_blocks WHERE (blocker_user_id=? AND blocked_user_id=?) OR (blocked_user_id=? AND blocker_user_id=?)",
        )
        .get(a, b, a, b),
    }),
    isFollowing: (a: number, b: number) =>
      !!db.prepare("SELECT 1 FROM follows WHERE follower_user_id=? AND following_user_id=?").get(a, b),
    getFollowingList: (user: number) =>
      db.prepare("SELECT following_user_id AS id FROM follows WHERE follower_user_id=?").all(user),
    isUserEventHost: (id: number, user: number) =>
      !!db
        .prepare("SELECT 1 FROM event_hosts WHERE event_id=? AND user_id=?")
        .get(id, user),
  } as unknown as IStorage;
  const planning = registerEventPlanning(
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
    (ids, sender, title, _body, path, tag) => notices.push({ ids, sender, title, path, tag }),
  );
  const { store } = planning;
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
  const adminLink = { eventId: 10, occurrenceDate: "2099-07-01", ownerId: 1, postType: "POSTING_GIG" };
  assert.deepEqual(validateAdminGigEventLink(adminLink, planning, storage), {
    eventId: 10, occurrenceDate: "2099-07-01", ownerId: 1,
  });
  for (const change of [
    { eventId: "10" }, { eventId: 11 }, { occurrenceDate: "2099-07-03" },
    { occurrenceDate: undefined }, { ownerId: 2 }, { ownerId: null },
    { postType: "LOOKING_FOR_WORK" },
  ]) {
    assert.ok("error" in validateAdminGigEventLink({ ...adminLink, ...change }, planning, storage));
  }
  assert.ok("error" in validateAdminGigEventLink(adminLink, { ...planning, acceptsPlanning: () => false }, storage));
  assert.ok("error" in validateAdminGigEventLink(adminLink, planning, {
    ...storage, getUserById: () => ({ status: "suspended" }) as ReturnType<IStorage["getUserById"]>,
  }));
  store.relinkGig(20, 10, "2099-07-01");
  assert.deepEqual(store.gigLink(20), { eventId: 10, occurrenceDate: "2099-07-01" });
  assert.deepEqual((await (await request(first)).json()).gigs.map((gig: { id: number }) => gig.id), [20]);
  store.relinkGig(20, 10, "2099-07-02");
  store.relinkGig(20, 10, "2099-07-02");
  assert.deepEqual(store.gigLink(20), { eventId: 10, occurrenceDate: "2099-07-02" });
  assert.deepEqual((await (await request(first)).json()).gigs, []);
  assert.deepEqual((await (await request(second)).json()).gigs.map((gig: { id: number }) => gig.id), [21, 20]);
  assert.equal((db.prepare("SELECT count(*) AS count FROM gig_posts").get() as {count: number}).count, 3);
  const riderView = await (await request(second, 2)).json();
  assert.equal(riderView.rides[0].myRequest, 1);
  assert.equal(riderView.rides[0].remaining, 0);
  // Carpool card fields (owner, Nov 20): avatar, neighborhood (area), seats left. No attendee list.
  assert.equal(riderView.rides[0].driverPhotoUrl, "/uploads/profile/driver.webp");
  assert.equal(riderView.rides[0].area, "North");
  assert.deepEqual(riderView.rides[0].requests, []);
  // Ridez circle filter (owner, Nov 20): rider and driver share a mutual friend (other).
  assert.equal(riderView.rides[0].circle, "fof");
  assert.equal((await (await request(second, 3)).json()).rides[0].circle, "friend");
  assert.equal((await (await request(second, 1)).json()).rides[0].circle, "you");
  // loner follows the driver one way only: not a friend, no shared mutual friend.
  assert.equal((await (await request(second, 4)).json()).rides[0].circle, "everybody");
  // OFFER A RIDE plumbing (owner, Nov 20): the shared RidezFormCard body against the real route.
  assert.equal(ridezPlanningBase(10, "2099-07-02T16:00:00"), second);
  const formOffer = ridezOfferBody({ direction: "arriving", area: "Alberta", meeting: "NE 15th & Alberta", seats: "3", leaveTime: "" }, "2099-07-02", "2099-07-01T16:00:00");
  assert.equal((await request(second + "/rides", 3, "POST", formOffer)).status, 201);
  const offered = (await (await request(second, 4)).json()).rides.find((r: { area: string }) => r.area === "Alberta");
  assert.equal(offered.plan.kind, "carpool");
  assert.equal(offered.plan.oneWay, true);
  // I NEED A RIDE plumbing: a seat request on that ride.
  assert.equal((await request(`${second}/rides/${offered.id}/requests`, 4, "POST")).status, 201);
  assert.equal((await request(`${second}/rides/${offered.id}`, 3, "DELETE")).status, 200);
  // NEEDS A RIDE (owner, Nov 20): event needs + anyone within 2 mi right now; no coordinates out.
  assert.equal((await request(second + "/needs", 0, "POST", { direction: "departing", area: "Alberta" })).status, 401);
  assert.equal((await request(second + "/needs", 2, "POST", { direction: "sideways", area: "Alberta" })).status, 400);
  assert.equal((await request(second + "/needs", 2, "POST", { direction: "departing", area: "Alberta" })).status, 201);
  assert.equal((await request(second + "/needs", 2, "POST", { direction: "arriving", area: "Alberta Arts" })).status, 201, "one need per person per occurrence (upsert)");
  assert.equal((await request("/api/ridez/needs", 4, "POST", { lat: 45.5245, lng: -122.6765, area: "Pearl bar" })).status, 201);
  assert.equal((await request("/api/ridez/needs", 1, "POST", { lat: 45.62, lng: -122.6765, area: "Vancouver" })).status, 201);
  assert.equal((await request("/api/ridez/needs", 1, "POST", { lat: 999, lng: 0, area: "Nowhere" })).status, 400);
  const hostView = (await (await request(second, 3)).json()).needs as Array<Record<string, unknown>>;
  assert.deepEqual(hostView.map(n => n.user).sort(), ["loner", "rider"], "same event + within 2 mi now; far need excluded");
  const riderNeed = hostView.find(n => n.user === "rider")!;
  assert.equal(riderNeed.direction, "arriving");
  assert.equal(riderNeed.area, "Alberta Arts");
  assert.equal(riderNeed.sameEvent, true);
  assert.equal(riderNeed.sameAfterz, true, "host 3 and accepted guest 2 share Afterz g1");
  assert.equal(riderNeed.circle, "friend");
  const nearby = hostView.find(n => n.user === "loner")!;
  assert.equal(nearby.sameEvent, false);
  assert.equal(nearby.sameAfterz, false);
  assert.equal(nearby.direction, "now");
  assert.ok(typeof nearby.distanceMi === "number" && nearby.distanceMi <= 0.2);
  assert.ok(!("lat" in nearby) && !("lng" in nearby), "exact coordinates never leave the server");
  assert.equal((await (await request(second)).json()).needs, null, "guests see no needs");
  const drawer = await (await request("/api/ridez/needs?lat=45.62&lng=-122.6765", 3)).json();
  assert.deepEqual(drawer.needs.map((n: { user: string }) => n.user), ["driver"]);
  assert.equal(drawer.radiusMi, 2);
  // I'M COMING + who's coming + safety check-in (owner, Nov 20).
  const riderNeedId = riderNeed.id as number;
  assert.equal((await request(`/api/ridez/needs/${riderNeedId}/coming`, 2, "POST")).status, 404, "not on your own need");
  assert.equal((await request(`/api/ridez/needs/${riderNeedId}/coming`, 3, "POST", { lat: 45.5300, lng: -122.6765 })).status, 201);
  assert.equal((await (await request(`/api/ridez/needs/${riderNeedId}/coming`, 3, "POST")).json()).already, true, "no repeat notice");
  assert.deepEqual(inbox, [{ from: 3, to: 2, subject: "@other is coming" }], "rider gets one in-app note");
  assert.deepEqual(notices.filter(n => n.tag.startsWith("need-coming")).map(n => [n.ids, n.sender, n.path]), [[[2], 3, "/events/10?night=rides"]]);
  const coming = (await (await request("/api/ridez/needs/mine/coming", 2)).json()).needs;
  assert.equal(coming[0].needId, riderNeedId);
  assert.equal(coming[0].drivers[0].user, "other");
  assert.equal(coming[0].drivers[0].ridesGiven, 0);
  assert.ok(Math.abs(coming[0].drivers[0].distanceMi - 0.5) <= 0.1, "rounded driver distance for the ETA");
  assert.ok(!("lat" in coming[0].drivers[0]), "driver coordinates stay server-side");
  assert.deepEqual((await (await request("/api/ridez/needs/mine/coming", 3)).json()).needs, [], "only the rider sees who's coming");
  assert.equal((await request(`/api/ridez/needs/${riderNeedId}/coming/location`, 3, "PUT", { lat: 45.5240, lng: -122.6765 })).status, 200);
  assert.equal((await (await request("/api/ridez/needs/mine/coming", 2)).json()).needs[0].drivers[0].distanceMi, 0.1);
  assert.equal((await request(`/api/ridez/needs/${riderNeedId}/watch`, 3, "POST", { contact: "other", minutes: 30, consent: true })).status, 404, "only the rider starts a check-in");
  assert.equal((await request(`/api/ridez/needs/${riderNeedId}/watch`, 2, "POST", { contact: "driver", minutes: 30, consent: true })).status, 400, "trusted contact must be a mutual follow");
  const watch = await (await request(`/api/ridez/needs/${riderNeedId}/watch`, 2, "POST", { contact: "other", minutes: 30, consent: true })).json();
  assert.equal(watch.check, -riderNeedId, JSON.stringify(watch));
  assert.ok(watch.dueAt > Date.now());
  const checks = await (await request("/api/night/ride-checks", 2)).json();
  assert.deepEqual(checks.map((c: { ride: number }) => c.ride), [-riderNeedId], "the existing ride-check list carries the need ride");
  assert.equal((await request(`/api/night/ride-checks/${-riderNeedId}`, 2, "DELETE")).status, 200);
  assert.equal((await request(`/api/ridez/needs/${riderNeedId}/coming/arrived`, 3, "POST")).status, 200);
  assert.equal((await request(`/api/ridez/needs/${riderNeedId}/coming/arrived`, 3, "POST")).status, 409);
  assert.equal((await (await request("/api/ridez/needs/mine/coming", 2)).json()).needs[0].drivers[0].arrived, true);
  assert.equal((await request("/api/ridez/fuel")).status, 200);
  assert.equal((await request(second + "/needs/me", 2, "DELETE")).status, 200);
  assert.equal((await request("/api/ridez/needs/me", 4, "DELETE")).status, 200);
  assert.equal((await request("/api/ridez/needs/me", 1, "DELETE")).status, 200);
  assert.deepEqual((await (await request(second, 3)).json()).needs, []);
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

test("existing-gig relinking is registered behind the existing admin guard", () => {
  const routes = readFileSync(new URL("./routes.ts", import.meta.url), "utf8");
  const adminStart = routes.indexOf('app.put("/api/admin/gigs/:id", requireAdmin,');
  assert.notEqual(adminStart, -1);
  const adminEdit = routes.slice(adminStart, routes.indexOf('  // GET admin inbox summary', adminStart));
  assert.match(adminEdit, /sqlite\.transaction\(\(\) => \{[\s\S]*storage\.adminUpdateGigPost[\s\S]*eventPlanning\.store\.relinkGig/);
  assert.equal(routes.match(/eventPlanning\.store\.relinkGig\(/g)?.length, 1);
});
