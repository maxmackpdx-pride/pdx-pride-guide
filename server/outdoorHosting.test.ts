import assert from "node:assert/strict";
import { test } from "node:test";
import type { AddressInfo } from "node:net";
import express, { type RequestHandler } from "express";
import Database from "better-sqlite3";
import type { IStorage } from "./storage";
import type { Event } from "@shared/schema";
import { registerCommunityBoard } from "./communityBoard";
import { registerOutdoorHosting } from "./outdoorHosting";

test("outings respect catalog approval and cohost permissions; board titles respect community privacy", async (t) => {
  const db = new Database(":memory:"),
    app = express(),
    date = new Date(Date.now() + 86400000).toISOString();
  db.exec(`CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT,status TEXT,display_name TEXT);
 CREATE TABLE card_hearts (user_id INTEGER,kind TEXT,ref TEXT);
 CREATE TABLE attendances (event_id INTEGER,user_id INTEGER,is_active INTEGER,expires_at TEXT);
 CREATE TABLE member_blocks(blocker_user_id INTEGER,blocked_user_id INTEGER);CREATE TABLE submissions(id INTEGER PRIMARY KEY,event_id INTEGER,status TEXT);
 CREATE TABLE communities(id TEXT PRIMARY KEY,slug TEXT,visibility TEXT);
 CREATE TABLE community_memberships(community_id TEXT,user_id INTEGER,role TEXT,status TEXT);
 INSERT INTO users VALUES(1,'host','active','Host'),(2,'visitor','active','Guest'),(3,'moderator','active','Mod');
 INSERT INTO submissions VALUES(1,11,'PENDING');INSERT INTO communities VALUES('group','hidden','private');
 INSERT INTO community_memberships VALUES('group',1,'owner','active'),('group',2,'member','active');`);
  const event = {
    id: 11,
    title: "Group hike",
    venueName: "Public park",
    dateStart: date,
    dateEnd: date,
    status: "LIVE",
    isPublic: true,
    isPrivate: false,
  } as Event;
  let added = "";
  const storage = {
    getEvents: () => [event],
    getEvent: (id: number) => (id === 11 ? event : undefined),
    isUserEventHost: (_id: number, u: number) => u === 1,
    getEventHosts: () => [{ userId: 1 }],
    getMemberBlockStatus: () => ({ interactionBlocked: false }),
    getUserById: (id: number) =>
      db.prepare("SELECT * FROM users WHERE id=?").get(id),
    addEventCoHost: (_e: number, _u: number, name: string) => {
      added = name;
      return { host: 1 };
    },
  } as unknown as IStorage;
  app.use(express.json(), (req, _res, next) => {
    req.session = {
      userId: Number(req.get("u")) || undefined,
    } as typeof req.session;
    next();
  });
  const auth: RequestHandler = (req, res, next) =>
    req.session.userId ? next() : void res.sendStatus(401);
  const out = registerOutdoorHosting(app, db, storage, auth, {
    catalog: async () => [{id:"park",name:"Public park"}],
    place: async (id) =>
      id === "park" ? { id, name: "Public park" } : undefined,
    details: async () => null,
    visible: () => true,
    remind: () => {},
  });
  registerCommunityBoard(app, db, auth);
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  t.after(async () => {
    out.dispose();
    await new Promise<void>((r) => server.close(() => r()));
    db.close();
  });
  const call = (path: string, user: number, method = "GET", body?: object) =>
    fetch("http://127.0.0.1:" + (server.address() as AddressInfo).port + path, {
      method,
      headers: { "Content-Type": "application/json", u: String(user) },
      body: body ? JSON.stringify(body) : undefined,
    });
  const place = await out.placeForSubmission("park");
  assert.throws(() => out.checkOverlap(place, date, false), /Another event/);
  assert.equal(out.checkOverlap(place, date, true).id, "park");
  const upcoming = "/api/outz/upcoming";
  assert.deepEqual((await (await call(upcoming + "?place=park", 0)).json()).map((e:Event) => e.id), [11]);
  assert.deepEqual(await (await call(upcoming + "?mine=1", 2)).json(), []);
  db.exec("INSERT INTO card_hearts VALUES(2,'outz','park')");
  assert.equal((await (await call(upcoming + "?mine=1", 2)).json())[0].id, 11);
  assert.deepEqual(await (await call(upcoming + "?mine=1", 3)).json(), []);
  db.exec("INSERT INTO attendances VALUES(11,3,1,NULL)");
  assert.equal((await (await call(upcoming + "?mine=1", 3)).json())[0].id, 11);
  out.link(1, "park");
  assert.deepEqual(await (await call(upcoming, 0)).json(), []);
  assert.deepEqual(await (await call("/api/outz/buddies", 0)).json(), []);
  db.exec("UPDATE submissions SET status='APPROVED'");
  assert.equal((await (await call("/api/outz/buddies", 0)).json())[0].id, 11);
  const co = "/api/outz/buddies/event/11/cohost";
  assert.equal((await call(co, 2, "POST", { action: "request" })).status, 200);
  assert.equal(
    (await call(co, 3, "POST", { action: "approve", userId: 2 })).status,
    403,
  );
  assert.equal(
    (await call(co, 1, "POST", { action: "approve", userId: 2 })).status,
    200,
  );
  assert.equal(added, "visitor");
  const board = "/api/communities/hidden/board";
  assert.equal((await call(board, 3)).status, 404);
  assert.equal(
    (await call(board + "/1", 2, "PUT", { title: "Treasurer" })).status,
    403,
  );
  assert.equal(
    (await call(board + "/2", 1, "PUT", { title: "Treasurer" })).status,
    200,
  );
  assert.equal((await (await call(board, 2)).json())[0].title, "Treasurer");
  db.exec("UPDATE community_memberships SET status='removed' WHERE user_id=2");
  assert.deepEqual(await (await call(board, 1)).json(), []);
});
