import assert from "node:assert/strict";
import { test } from "node:test";
import type { AddressInfo } from "node:net";
import express from "express";
import Database from "better-sqlite3";
import type { IStorage } from "./storage";
import type { ZaylistAccess } from "./zaylist";
import { registerRosterChats } from "./rosterChats";

test("role changes, invitations, blocks and owner-selected rooms govern every team message", async (t) => {
  const db = new Database(":memory:");
  db.exec(
    "CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT,status TEXT);",
  );
  for (let i = 1; i <= 6; i++)
    db.prepare("INSERT INTO users VALUES(?,?,'active')").run(i, "member" + i);
  const ids = new Set([1, 2, 3, 4, 5, 6]);
  let isStaff = true,
    blocked = false,
    venueOwner = 1;
  const storage = {
    getEvent: (id: number) =>
      id === 11 ? { id, title: "Night crew", status: "LIVE" } : undefined,
    getBusiness: (id: number) =>
      id === 12
        ? {
            id,
            name: "Venue",
            status: "ACTIVE",
            active: true,
            ownerId: venueOwner,
          }
        : undefined,
    getUserById: (id: number) =>
      ids.has(id)
        ? { id, username: "member" + id, status: "active" }
        : undefined,
    getUserByUsername: (s: string) => {
      const id = Number(s.slice(6));
      return ids.has(id) ? { id, username: s, status: "active" } : undefined;
    },
    isMemberInteractionBlocked: (a: number, b: number) =>
      blocked && [a, b].includes(2) && [a, b].includes(4),
  } as unknown as IStorage;
  const app = express();
  app.use(express.json());
  registerRosterChats(
    app,
    db,
    storage,
    (req, res, next) => {
      const id = Number(req.header("fixture-user"));
      if (!id) return res.sendStatus(401);
      req.session = { userId: id } as typeof req.session;
      next();
    },
    (_id, user) =>
      ({
        isOwner: user === 1,
        allowance:
          user === 2 && isStaff ? { role: "staff", spots: 0 } : undefined,
        promoter: user === 3,
        talent: user === 4,
      }) as ZaylistAccess,
  );
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  t.after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    db.close();
  });
  const url =
    "http://127.0.0.1:" +
    (server.address() as AddressInfo).port +
    "/api/hub/roster-chats";
  const call = (path: string, user: number, method = "GET", body?: object) =>
    fetch(url + path, {
      method,
      headers: {
        "fixture-user": String(user),
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  const event = "/events/11",
    place = "/places/12";
  const post = (path: string, user: number, key = "rewrite-unique-key") =>
    call(path, user, "POST", { body: "private message", requestKey: key });
  assert.equal((await call(event, 0)).status, 401);
  assert.equal((await call(event, 6)).status, 404);
  assert.equal(
    (await call(event + "/mode", 2, "PUT", { mode: "off" })).status,
    403,
  );
  assert.equal(
    (await call(event + "/mode", 1, "PUT", { mode: "separate" })).status,
    204,
  );
  assert.deepEqual((await (await call(event, 3)).json()).rooms, ["combined"]);
  assert.deepEqual((await (await call(event, 4)).json()).rooms, [
    "team",
    "combined",
  ]);
  assert.equal((await post(event + "/rooms/team", 3)).status, 403);
  assert.equal((await post(event + "/rooms/team", 4)).status, 204);
  assert.equal((await post(event + "/rooms/team", 4)).status, 204);
  const history = await call(event + "/rooms/team", 2);
  assert.equal(history.headers.get("Cache-Control"), "private, no-store");
  assert.equal((await history.json()).items.length, 1);
  blocked = true;
  assert.equal(
    (await (await call(event + "/rooms/team", 2)).json()).items.length,
    0,
  );
  blocked = false;
  isStaff = false;
  assert.equal((await call(event + "/rooms/team", 2)).status, 404);
  assert.equal((await post(event + "/rooms/team", 2)).status, 404);
  assert.equal(
    (await call(place + "/mode", 1, "PUT", { mode: "team" })).status,
    204,
  );
  assert.equal(
    (
      await call(place + "/invitations", 1, "POST", {
        role: "staff",
        username: "member6",
      })
    ).status,
    201,
  );
  assert.equal((await (await call("/mine", 6)).json())[0].pending, true);
  assert.equal((await post(place + "/rooms/team", 6)).status, 403);
  assert.equal(
    (await call(place + "/respond", 6, "PUT", { accept: false })).status,
    204,
  );
  assert.equal((await call(place, 6)).status, 404);
  await call(place + "/invitations", 1, "POST", {
    role: "staff",
    username: "member6",
  });
  await call(place + "/respond", 6, "PUT", { accept: true });
  assert.equal((await post(place + "/rooms/team", 6)).status, 204);
  assert.equal((await call(place + "/rooms/combined", 6)).status, 403);
  venueOwner = 5;
  assert.equal((await call(place, 6)).status, 404);
  assert.deepEqual(await (await call("/mine", 6)).json(), []);
  venueOwner = 1;
  assert.equal(
    (await call(place + "/invitations/member6", 1, "DELETE")).status,
    204,
  );
  assert.equal((await call(place, 6)).status, 404);
  await call(event + "/mode", 1, "PUT", { mode: "off" });
  assert.equal((await call(event + "/rooms/combined", 4)).status, 403);
});
