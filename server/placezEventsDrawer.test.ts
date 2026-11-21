import assert from "node:assert/strict";
import { test } from "node:test";
import Database from "better-sqlite3";
import express from "express";
import type { AddressInfo } from "node:net";
import type { Event } from "@shared/schema";
import type { IStorage } from "./storage";
import { collectDrawerPlans, registerPlacezEventsDrawer } from "./placezEventsDrawer";

const START = "2099-07-01T21:00:00";
const END = "2099-07-02T02:00:00";
const PAST_START = "2026-11-13T21:00:00";
const PAST_END = "2026-11-14T02:00:00";

function schema(db: Database.Database) {
  db.exec(`
    CREATE TABLE users(id INTEGER PRIMARY KEY, username TEXT, status TEXT);
    CREATE TABLE events(id INTEGER PRIMARY KEY, title TEXT, date_start TEXT, date_end TEXT, status TEXT, is_public INTEGER, is_private INTEGER, venue_name TEXT, poster_image_url TEXT);
    CREATE TABLE attendances(event_id INTEGER, user_id INTEGER, is_active INTEGER, expires_at TEXT);
    CREATE TABLE gig_posts(id INTEGER PRIMARY KEY, user_id INTEGER, title TEXT, status TEXT, post_type TEXT);
    CREATE TABLE event_gig_links(gig_id INTEGER PRIMARY KEY, event_id INTEGER, occurrence TEXT);
    CREATE TABLE event_ride_offers(id INTEGER PRIMARY KEY, event_id INTEGER, occurrence TEXT, driver_id INTEGER, area TEXT, seats INTEGER);
    CREATE TABLE event_ride_requests(offer_id INTEGER, rider_id INTEGER, accepted INTEGER, PRIMARY KEY(offer_id, rider_id));
    CREATE TABLE night_ride_plans(offer_id INTEGER PRIMARY KEY, kind TEXT, meeting TEXT, leave_by INTEGER, one_way INTEGER, gathering TEXT, departed INTEGER);
    CREATE TABLE afterz_gatherings(id TEXT PRIMARY KEY, host_id INTEGER, title TEXT, closes_at INTEGER);
    CREATE TABLE afterz_nights(gathering_id TEXT PRIMARY KEY, event_id INTEGER, occurrence TEXT, capacity INTEGER);
    CREATE TABLE afterz_guests(gathering_id TEXT, user_id INTEGER, status TEXT, PRIMARY KEY(gathering_id, user_id));
    INSERT INTO users VALUES(1,'driver','active'),(2,'guest','active'),(3,'blocked','disabled');
  `);
}

const catalog: Record<number, Event> = {
  10: {
    id: 10,
    status: "LIVE",
    isPublic: true,
    isPrivate: false,
    title: "Yes Coach",
    venueName: "Sanctuary",
    dateStart: START,
    dateEnd: END,
  } as Event,
  11: {
    id: 11,
    status: "LIVE",
    isPublic: true,
    isPrivate: false,
    title: "Past dance",
    venueName: "Cleveland",
    dateStart: PAST_START,
    dateEnd: PAST_END,
  } as Event,
  12: {
    id: 12,
    status: "LIVE",
    isPublic: false,
    isPrivate: false,
    title: "Hidden",
    dateStart: START,
    dateEnd: END,
  } as Event,
};

function storage(): IStorage {
  return {
    getEvent: (id: number) => catalog[id] ?? null,
    getUserById: (id: number) =>
      id === 3 ? { id, status: "disabled" } : { id, status: "active" },
  } as unknown as IStorage;
}

test("drawer plans API joins RSVP, gigz, arriving and departing carpools, and Afterz", async (t) => {
  const db = new Database(":memory:");
  t.after(() => db.close());
  schema(db);
  db.exec(`
    INSERT INTO attendances VALUES(10,1,1,NULL),(11,1,1,NULL),(12,1,1,NULL),(11,2,1,NULL);
    INSERT INTO gig_posts VALUES(20,1,'Door host','LIVE','POSTING_GIG'),(21,2,'Other gig','LIVE','POSTING_GIG');
    INSERT INTO event_gig_links VALUES(20,10,'2099-07-01'),(21,10,'2099-07-01');
    INSERT INTO event_ride_offers VALUES(30,10,'2099-07-01',1,'Alberta',3),(31,10,'2099-07-01',2,'Division',2);
    INSERT INTO night_ride_plans VALUES(30,'carpool','The lot',NULL,1,NULL,NULL),(31,'home','Bar door',NULL,0,NULL,NULL);
    INSERT INTO event_ride_requests VALUES(31,1,1);
    INSERT INTO afterz_gatherings VALUES('g1',1,'After hours',${Date.now() + 86400000});
    INSERT INTO afterz_nights VALUES('g1',10,'2099-07-01',8);
  `);

  const plans = collectDrawerPlans(db, storage(), 1, () => true, Date.parse("2026-11-20T20:00:00Z"));
  assert.equal(plans.upcoming.length, 1);
  assert.equal(plans.upcoming[0].event.title, "Yes Coach");
  assert.deepEqual(plans.upcoming[0].plans.gigz, [{ id: 20, title: "Door host" }]);
  assert.deepEqual(
    plans.upcoming[0].plans.carpools.map((r) => ({ direction: r.direction, area: r.area, role: r.role })),
    [
      { direction: "Arriving", area: "Alberta", role: "driver" },
      { direction: "Departing", area: "Division", role: "rider" },
    ],
  );
  assert.deepEqual(plans.upcoming[0].plans.afterz, [{ id: "g1", title: "After hours", role: "host" }]);
  assert.equal(plans.past.length, 1);
  assert.equal(plans.past[0].event.title, "Past dance");
  assert.ok(plans.past[0].mizzedClosesAt);
  assert.equal(Date.parse(plans.past[0].mizzedClosesAt!) > Date.parse("2026-11-20T20:00:00Z"), true);

  const hidden = collectDrawerPlans(db, storage(), 1, () => true, Date.parse("2099-01-01T00:00:00Z"));
  assert.equal(hidden.upcoming.some((row) => row.event.id === 12), false);

  const app = express();
  app.use((req, _res, next) => {
    req.session = { userId: Number(req.headers["fixture-viewer"]) || undefined } as typeof req.session;
    next();
  });
  registerPlacezEventsDrawer(
    app,
    db,
    storage(),
    (req, res, next) => {
      if (!req.session.userId) {
        res.sendStatus(401);
        return;
      }
      next();
    },
    () => true,
  );
  const server = app.listen(0, "127.0.0.1");
  t.after(() => server.close());
  await new Promise<void>((resolve) => server.on("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const call = (user?: number) =>
    fetch(`${base}/api/events/mine/drawer-plans`, {
      headers: user ? { "fixture-viewer": String(user) } : {},
    });
  assert.equal((await call()).status, 401);
  assert.equal((await call(3)).status, 403);
  const body = await (await call(1)).json();
  assert.equal(body.upcoming[0].plans.gigz[0].title, "Door host");
  assert.equal(body.past[0].event.id, 11);
  const guest = await (await call(2)).json();
  assert.equal(guest.upcoming.length, 1);
  assert.deepEqual(guest.upcoming[0].plans.gigz, [{ id: 21, title: "Other gig" }]);
  assert.deepEqual(guest.upcoming[0].plans.carpools.map((r) => r.direction), ["Departing"]);
  assert.equal(guest.past[0].event.id, 11);
});
