import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { AddressInfo } from "node:net";
import { test } from "node:test";
import express, { type RequestHandler } from "express";
import Database from "better-sqlite3";
import { afterzClosesAt, registerAfterzInvites } from "./afterzInvites";
import { registerMemberInbox } from "./memberInbox";
import {
  registerDevicePushCheck,
  supportsDeviceCheck,
} from "./devicePushCheck";

test("Afterz closes at 6 AM Pacific on each side of the clock change", () => {
  for (const [at, closes] of [
    ["2026-03-08T09:00:00Z", "2026-03-08T13:00:00Z"],
    ["2026-11-01T08:00:00Z", "2026-11-01T14:00:00Z"],
    ["2026-11-02T14:00:00Z", "2026-11-03T14:00:00Z"],
  ])
    assert.equal(afterzClosesAt(Date.parse(at)), Date.parse(closes));
});

test("private gathering, mailbox, receipt and device flows use the current account", async (t) => {
  const db = new Database(":memory:");
  db.exec(`CREATE TABLE users(id INTEGER PRIMARY KEY,status TEXT,username TEXT,display_name TEXT);
    CREATE TABLE member_blocks(blocker_user_id INTEGER,blocked_user_id INTEGER);
    CREATE TABLE messages(id INTEGER PRIMARY KEY, thread_id TEXT,from_user_id INTEGER,to_user_id INTEGER,deleted_by_to INTEGER DEFAULT 0,deleted_by_from INTEGER DEFAULT 0,is_read INTEGER DEFAULT 0);
    CREATE TABLE owner_desk_items(id INTEGER PRIMARY KEY,status TEXT,private_note TEXT);
    CREATE TABLE moderation_requests(id INTEGER PRIMARY KEY,status TEXT);
    INSERT INTO users VALUES(1,'active','first','Host'),(2,'active','second','Guest'),(3,'active','third','Third'),
      (4,'active','reviewer','Reviewer'),(5,'active','owner','Owner'),(6,'active','guide','Guide');
    INSERT INTO messages(id,thread_id,from_user_id,to_user_id,is_read)
      VALUES(1,'one',1,2,0),(2,'one',1,2,0),(3,'other',1,3,0),(4,'guide',2,6,0),(5,'read',1,2,0),(6,'read',1,2,1);
    INSERT INTO owner_desk_items VALUES(28,'OPEN','Internal review note');
    INSERT INTO moderation_requests VALUES(29,'PENDING');`);
  const app = express();
  app.use(express.json());
  let clock = Date.parse("2026-11-18T23:00:00-08:00");
  app.use((req, _res, next) => {
    req.session = {
      userId: Number(req.headers["fixture-account"]) || undefined,
    } as typeof req.session;
    next();
  });
  const auth: RequestHandler = (req, res, next) => {
    if (req.session.userId) next();
    else res.sendStatus(401);
  };
  const admin: RequestHandler = (req, res, next) => {
    if ([4, 5].includes(req.session.userId!)) next();
    else res.sendStatus(403);
  };
  const owner: RequestHandler = (req, res, next) => {
    if (req.session.userId === 5) next();
    else res.sendStatus(403);
  };
  const gatherings = registerAfterzInvites(app, db, auth, () => clock);
  const inbox = registerMemberInbox(app, db, auth, admin, owner, () => 6);
  const device = "https://fcm.googleapis.com/example-fixture";
  registerDevicePushCheck(app, db, auth, {
    getActivePushSubscriptions: (viewer) =>
      viewer === 1
        ? [{ id: 1, endpoint: device, auth: "fixture", p256dh: "fixture" }]
        : [],
    deactivatePushSubscription: () => {},
    touchPushSubscription: () => {},
  });
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  t.after(async () => {
    gatherings.dispose();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    db.close();
  });
  const base = "http://127.0.0.1:" + (server.address() as AddressInfo).port;
  const call = (path: string, account = 0, method = "GET", body?: object) =>
    fetch(base + path, {
      method,
      headers: {
        "content-type": "application/json",
        "fixture-account": String(account),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  await t.test(
    "archive and restore on a second session, including older device archives and independent guide folders",
    async () => {
      const path = "/api/messages/archive";
      assert.equal((await call(path)).status, 401);
      assert.equal(inbox.unreadThreads(2, 2, "personal"), 1);
      assert.equal((await call(path + "/one", 2, "PUT")).status, 200);
      assert.equal(inbox.unreadThreads(2, 2, "personal"), 0);
      assert.deepEqual(await (await call(path, 2)).json(), ["one"]);
      assert.deepEqual(await (await call(path, 1)).json(), []);
      assert.equal((await call(path + "/other", 2, "PUT")).status, 404);
      assert.equal((await call(path + "/one", 2, "DELETE")).status, 200);
      assert.equal(inbox.unreadThreads(2, 2, "personal"), 1);
      const imported = await call(path + "/import", 2, "POST", {
        ids: ["other", "one"],
      });
      assert.deepEqual(await imported.json(), { imported: ["one"] });
      const guide = "/api/admin/messages/archive";
      assert.equal((await call(guide, 2)).status, 403);
      assert.equal((await call(guide + "/guide", 4, "PUT")).status, 200);
      assert.equal(inbox.unreadThreads(6, 4, "guide"), 0);
      assert.equal(inbox.unreadThreads(6, 5, "guide"), 1);
      assert.deepEqual(await (await call(guide, 5)).json(), []);
      assert.equal((await call(guide + "/guide", 4, "DELETE")).status, 200);
      assert.equal(
        db.prepare("SELECT COUNT(*) AS n FROM messages").get()!.n,
        6,
      );
    },
  );
  await t.test(
    "owner and reporter share an opt-in conversation; members see their own appeals",
    async () => {
      const receipt = inbox.addReceipt("desk", 28, 2, "Missing date");
      const appeal = inbox.addReceipt("appeal", 29, 3, "Suspension appeal");
      const ownerPath = "/api/admin/owner-desk/28/conversation";
      const memberPath = "/api/me/report-receipts/" + receipt + "/conversation";
      assert.equal((await call(ownerPath, 4)).status, 403);
      assert.equal((await call(memberPath, 3)).status, 404);
      const text = { body: "Date corrected.", requestId: randomUUID() };
      assert.equal((await call(ownerPath, 5, "POST", text)).status, 200);
      const again = await (await call(ownerPath, 5, "POST", text)).json();
      assert.equal(again.replies.length, 1);
      assert.deepEqual(
        again.replies.map((row: { author: string }) => row.author),
        ["owner"],
      );
      const thread = await (
        await call(memberPath, 2, "POST", {
          body: "Thanks",
          requestId: randomUUID(),
        })
      ).json();
      assert.deepEqual(
        thread.replies.map((row: { body: string }) => row.body),
        ["Date corrected.", "Thanks"],
      );
      assert.equal(
        JSON.stringify(thread).includes("Internal review note"),
        false,
      );
      const receipts = await (
        await call("/api/auth/suspension-appeal/receipts", 3)
      ).json();
      assert.deepEqual(
        receipts.map((r: { id: number }) => r.id),
        [appeal],
      );
      assert.deepEqual(
        await (await call("/api/auth/suspension-appeal/receipts", 2)).json(),
        [],
      );
      db.prepare(
        "UPDATE owner_desk_items SET status='RESOLVED' WHERE id=28",
      ).run();
      assert.equal(
        (
          await call(memberPath, 2, "POST", {
            body: "Closed",
            requestId: randomUUID(),
          })
        ).status,
        409,
      );
    },
  );
  await t.test(
    "invite-only requests, host decisions, chat, blocks, withdrawal and expiry",
    async () => {
      const path = "/api/afterz/gatherings",
        create = {
          title: "After the show",
          confirmed18: true,
          requestId: randomUUID(),
        };
      assert.equal((await call(path, 0, "POST", create)).status, 401);
      assert.equal(
        (await call(path, 1, "POST", { ...create, confirmed18: false })).status,
        400,
      );
      const made = await call(path, 1, "POST", create);
      assert.equal(made.status, 201);
      const { id } = await made.json(),
        room = path + "/" + id;
      assert.equal((await (await call(path, 1, "POST", create)).json()).id, id);
      const preview = await (await call(room)).json();
      assert.deepEqual(Object.keys(preview).sort(), [
        "closesAt",
        "hostName",
        "id",
        "role",
        "title",
      ]);
      assert.deepEqual(await (await call(path, 3)).json(), []);
      assert.equal(
        (await call(room + "/request", 2, "POST", { confirmed18: true }))
          .status,
        200,
      );
      assert.equal((await call(room + "/chat", 2)).status, 403);
      assert.equal((await (await call(room, 3)).json()).requests, undefined);
      assert.equal(
        (await call(room + "/guests/2", 3, "POST", { status: "accepted" }))
          .status,
        403,
      );
      assert.equal(
        (await call(room + "/guests/2", 1, "POST", { status: "accepted" }))
          .status,
        200,
      );
      const privateLocation = room + "/chat/location";
      const address = {
        address: "Fixture private entrance",
        lat: 45.5,
        lng: -122.6,
        confirm: true,
      };
      assert.equal(
        (await call(privateLocation, 1, "PUT", { ...address, confirm: false }))
          .status,
        400,
      );
      assert.equal(
        (await call(privateLocation, 2, "PUT", address)).status,
        403,
      );
      assert.equal(
        (await call(privateLocation, 1, "PUT", address)).status,
        200,
      );
      assert.equal((await call(privateLocation, 3)).status, 403);
      assert.equal(
        (await call(privateLocation + "/directions", 3)).status,
        403,
      );
      assert.equal(
        (await (await call(privateLocation, 2)).json()).location.address,
        address.address,
      );
      assert.equal(
        JSON.stringify(await (await call(room, 3)).json()).includes(
          address.address,
        ),
        false,
      );
      assert.equal(
        JSON.stringify(await (await call(path, 2)).json()).includes(
          address.address,
        ),
        false,
      );
      const directions = await fetch(base + privateLocation + "/directions", {
        redirect: "manual",
        headers: { "fixture-account": "2" },
      });
      assert.equal(directions.status, 302);
      assert.equal(
        new URL(directions.headers.get("Location")!).searchParams.get("daddr"),
        "45.5,-122.6",
      );
      assert.equal(directions.headers.get("Referrer-Policy"), "no-referrer");
      const chat = { body: "Meet at the entrance", requestId: randomUUID() };
      await call(room + "/chat", 2, "POST", chat);
      await call(room + "/chat", 2, "POST", chat);
      assert.equal((await (await call(room + "/chat", 1)).json()).length, 1);
      await call(room + "/request", 3, "POST", { confirmed18: true });
      await call(room + "/guests/3", 1, "POST", { status: "accepted" });
      db.prepare("INSERT INTO member_blocks VALUES(2,3)").run();
      assert.deepEqual(await (await call(room + "/chat", 3)).json(), []);
      await call(room + "/leave", 3, "POST", {});
      assert.equal((await call(room + "/chat", 3)).status, 403);
      await call(room + "/guests/2", 1, "POST", { status: "revoked" });
      assert.equal((await call(room + "/chat", 2)).status, 403);
      assert.equal((await call(privateLocation, 2)).status, 403);
      assert.equal(
        (await call(privateLocation + "/directions", 2)).status,
        403,
      );
      assert.equal(
        (await call(room + "/request", 2, "POST", { confirmed18: true }))
          .status,
        403,
      );
      await call(room + "/close", 1, "POST", {});
      assert.equal((await call(room, 1)).status, 404);
      assert.equal(
        db.prepare("SELECT COUNT(*) AS n FROM afterz_chat").get()!.n,
        0,
      );
      assert.equal(
        db.prepare("SELECT COUNT(*) AS n FROM afterz_private_locations").get()!
          .n,
        0,
      );
      const another = await (
        await call(path, 1, "POST", { ...create, requestId: randomUUID() })
      ).json();
      clock = afterzClosesAt(clock);
      assert.equal((await call(path + "/" + another.id, 1)).status, 404);
      assert.deepEqual(await (await call(path, 1)).json(), []);
    },
  );
  await t.test(
    "device status is bound to the caller's registered endpoint",
    async () => {
      assert.equal(supportsDeviceCheck(device), true);
      assert.equal(supportsDeviceCheck("https://unrelated.example/"), false);
      assert.equal(
        (
          await (
            await call("/api/push/device-status", 1, "POST", {
              endpoint: device,
            })
          ).json()
        ).registered,
        true,
      );
      assert.deepEqual(
        await (
          await call("/api/push/device-status", 2, "POST", { endpoint: device })
        ).json(),
        { registered: false, canTest: false },
      );
      assert.equal(
        (await call("/api/push/device-check", 2, "POST", { endpoint: device }))
          .status,
        400,
      );
    },
  );
});
