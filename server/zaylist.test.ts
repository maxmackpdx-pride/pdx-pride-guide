import assert from "node:assert/strict";
import { test } from "node:test";
import Database from "better-sqlite3";
import express from "express";
import type { AddressInfo } from "node:net";
import type { IStorage } from "./storage";
import { registerZaylist, type ZaylistStore } from "./zaylist";

// Users: 1 owner (PRIMARY host) · 2 promoter (COHOST) · 3 staff · 4 talent
// 5/6/7 RSVPs · 8 outsider · 9 full-access candidate · 10 barkeep · 12 walk-in
async function setup(t: { after: (fn: () => unknown) => void }) {
  const db = new Database(":memory:");
  t.after(() => db.close());
  db.exec(`CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT,email TEXT,display_name TEXT,photo_url TEXT,status TEXT);
    CREATE TABLE events(id INTEGER PRIMARY KEY,title TEXT,venue_name TEXT,date_start TEXT,date_end TEXT,status TEXT,claimed_by TEXT,submitted_by TEXT,source TEXT,is_claimable INTEGER DEFAULT 0,is_public INTEGER DEFAULT 1,is_private INTEGER DEFAULT 0,admission TEXT,ticket_url TEXT);
    CREATE TABLE event_hosts(event_id INTEGER,user_id INTEGER,role TEXT);
    CREATE TABLE event_talent(id INTEGER PRIMARY KEY,event_id INTEGER,user_id INTEGER,role TEXT,status TEXT);
    CREATE TABLE attendances(id INTEGER PRIMARY KEY,event_id INTEGER,user_id INTEGER,handle TEXT,message TEXT,avatar_seed TEXT,photo_url TEXT,is_anonymous INTEGER DEFAULT 0,visibility TEXT DEFAULT 'public',expires_at TEXT,is_active INTEGER DEFAULT 1,created_at TEXT);
    CREATE TABLE member_blocks(blocker_user_id INTEGER,blocked_user_id INTEGER);
    INSERT INTO users VALUES
      (1,'owner','owner@example.test','Owner',NULL,'active'),
      (2,'promoter','promo@example.test','Promo',NULL,'active'),
      (3,'staff','staff@example.test','Staff',NULL,'active'),
      (4,'talent','talent@example.test','Talent',NULL,'active'),
      (5,'rsvpa','a@example.test','A',NULL,'active'),
      (6,'rsvpb','b@example.test','B',NULL,'active'),
      (7,'rsvpc','c@example.test','C',NULL,'active'),
      (8,'outsider','out@example.test','Out',NULL,'active'),
      (9,'delegate','del@example.test','Del',NULL,'active'),
      (10,'barkeep','bar@example.test','Bar',NULL,'active'),
      (12,'walkin','walk@example.test','Walk',NULL,'active');
    INSERT INTO events(id,title,venue_name,date_start,date_end,status,admission,ticket_url)
      VALUES(10,'Paid Night','The Club','2099-07-01T16:00:00','2099-07-02T02:00:00','LIVE','TICKETED','https://tickets.example.test/10');
    INSERT INTO event_hosts VALUES(10,1,'PRIMARY'),(10,2,'COHOST');
    INSERT INTO event_talent(event_id,user_id,role,status) VALUES(10,4,'DJ','LIVE');
    INSERT INTO attendances(event_id,user_id,handle,message,avatar_seed) VALUES(10,5,'A','', 'a'),(10,6,'B','','b'),(10,7,'C','','c');`);
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
    ticketUrl: "https://tickets.example.test/10",
    admission: "TICKETED",
    title: "Paid Night",
    venueName: "The Club",
    dateStart: "2099-07-01T16:00:00",
    dateEnd: "2099-07-02T02:00:00",
  };
  const storage = {
    getEvent: (id: number) => (id === 10 ? dbEvent : null),
    getUserById: (id: number) =>
      db.prepare("SELECT * FROM users WHERE id=?").get(id),
    isMemberInteractionBlocked: (a: number,b: number) => !!db.prepare("SELECT 1 FROM member_blocks WHERE (blocker_user_id=? AND blocked_user_id=?) OR (blocker_user_id=? AND blocked_user_id=?)").get(a,b,b,a),
    sendMessage: (sender: number, recipient: number, subject: string, body: string) => {
      db.exec("CREATE TABLE IF NOT EXISTS fixture_messages(sender INTEGER,recipient INTEGER,subject TEXT,body TEXT)");
      db.prepare("INSERT INTO fixture_messages VALUES(?,?,?,?)").run(sender,recipient,subject,body);
    },
    isUserEventHost: (eventId: number, userId: number) =>
      !!db
        .prepare("SELECT 1 FROM event_hosts WHERE event_id=? AND user_id=?")
        .get(eventId, userId),
  } as unknown as IStorage;
  const { store, operations } = registerZaylist(
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
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((done) => server.once("listening", done));
  t.after(() => new Promise<void>((done) => server.close(() => done())));
  const base = "http://127.0.0.1:" + (server.address() as AddressInfo).port;
  const request = async (
    path: string,
    user = 0,
    method = "GET",
    body?: unknown,
  ) => {
    const res = await fetch(base + path, {
      method,
      headers: {
        "fixture-viewer": String(user),
        "content-type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    return {
      status: res.status,
      body: text ? (JSON.parse(text) as Record<string, any>) : {},
    };
  };
  const list = (user: number) => request("/api/events/10/zaylist", user);
  const setConfig = (user: number, poolSize: number, maxCap = poolSize) =>
    request("/api/events/10/zaylist/config", user, "PUT", {
      poolSize,
      maxCap,
      drawDaysBefore: 7,
      dripPerDay: 1,
    });
  return { db, store, operations, request, list, setConfig };
}

test("draw respects the pool cap and one-per-person, and persists its record", async (t) => {
  const { request, list, setConfig } = await setup(t);
  assert.equal((await setConfig(8, 3)).status, 403);
  assert.equal((await setConfig(2, 3)).status, 403);
  assert.equal((await setConfig(1, 5, 3)).status, 400);
  assert.equal((await setConfig(1, 3)).status, 200);
  const first = await request("/api/events/10/zaylist/draw", 1, "POST", { count: 2 });
  assert.equal(first.status, 201);
  assert.equal(first.body.eligible, 3);
  assert.equal(first.body.awarded, 2);
  const second = await request("/api/events/10/zaylist/draw", 1, "POST", { count: 2 });
  assert.equal(second.body.awarded, 1);
  assert.equal(
    (await request("/api/events/10/zaylist/draw", 1, "POST", { count: 1 })).status,
    409,
  );
  const view = await list(1);
  assert.equal(view.body.draws.length, 2);
  assert.equal(view.body.draws[1].eligible, 3);
  assert.equal(view.body.draws[1].awarded, 2);
  assert.equal(view.body.counts.pending, 3);
  const winner = view.body.entries.find(
    (e: Record<string, any>) => e.source === "draw",
  );
  assert.equal(
    (
      await request("/api/events/10/zaylist/entries", 1, "POST", {
        userId: winner.userId,
      })
    ).status,
    409,
  );
  // Declining returns the spot to the pool but the decliner is not re-drawn.
  assert.equal(
    (
      await request(`/api/zaylist/entries/${winner.id}/decline`, winner.userId, "POST")
    ).status,
    200,
  );
  const redraw = await request("/api/events/10/zaylist/draw", 1, "POST", { count: 1 });
  assert.equal(redraw.status, 201);
  assert.equal(redraw.body.awarded, 0);
  assert.equal((await list(1)).body.counts.pending, 2);
});

test("allowances bound staff, promoter and talent adds; the pool binds everyone", async (t) => {
  const { db, request, list, setConfig } = await setup(t);
  await setConfig(1, 10);
  const allow = (userId: number, role: string, spots: number) =>
    request(`/api/events/10/zaylist/allowances/${userId}`, 1, "PUT", { role, spots });
  assert.equal((await allow(3, "staff", 1)).status, 200);
  assert.equal((await allow(2, "promoter", 1)).status, 200);
  assert.equal((await allow(4, "talent", 1)).status, 200);
  assert.equal(
    (await request("/api/events/10/zaylist/allowances/3", 2, "PUT", { role: "staff", spots: 9 })).status,
    403,
  );
  const staffAdd = await request("/api/events/10/zaylist/entries", 3, "POST", { userId: 8 });
  assert.equal(staffAdd.status, 201);
  assert.equal(
    (await request("/api/events/10/zaylist/entries", 3, "POST", { userId: 12 })).status,
    409,
  );
  const promoAdd = await request("/api/events/10/zaylist/entries", 2, "POST", {
    contact: "pal@example.test",
  });
  assert.equal(promoAdd.status, 201);
  assert.equal(promoAdd.body.entry.user_id, null);
  assert.equal(promoAdd.body.entry.source, "invite");
  assert.equal(
    (db.prepare("SELECT status FROM zaylist_invites").get() as { status: string }).status,
    "sent",
  );
  assert.equal(
    (await request("/api/events/10/zaylist/entries", 8, "POST", { userId: 12 })).status,
    403,
  );
  const staffView = await list(3);
  assert.equal(staffView.status, 200);
  assert.equal(staffView.body.permissions.allowance.used, 1);
  // Staff can remove their own add, never the promoter's.
  assert.equal(
    (await request(`/api/events/10/zaylist/entries/${promoAdd.body.entry.id}`, 3, "DELETE")).status,
    403,
  );
  assert.equal(
    (await request(`/api/events/10/zaylist/entries/${staffAdd.body.entry.id}`, 3, "DELETE")).status,
    200,
  );
  // A guest who is not team sees only their own spot.
  const guestView = await list(8);
  assert.equal(guestView.body.guest, undefined);
  const promoEntry = (await list(1)).body.entries.find(
    (e: Record<string, any>) => e.source === "invite",
  );
  assert.equal(promoEntry.state, "pending");
});

test("accepting a spot ensures event-chat membership; declining frees the pool", async (t) => {
  const { db, request, setConfig } = await setup(t);
  await setConfig(1, 1);
  const add = await request("/api/events/10/zaylist/entries", 1, "POST", { userId: 12 });
  assert.equal(add.status, 201);
  const entryId = add.body.entry.id;
  assert.equal(
    (await request("/api/events/10/zaylist/entries", 1, "POST", { userId: 8 })).status,
    409,
  );
  const mine = await request("/api/me/zaylist", 12);
  assert.equal(mine.body.entries.length, 1);
  const accept = await request(`/api/zaylist/entries/${entryId}/accept`, 12, "POST");
  assert.equal(accept.status, 200);
  assert.ok(accept.body.token);
  const attendance = db
    .prepare("SELECT is_active FROM attendances WHERE event_id=10 AND user_id=12")
    .get() as { is_active: number } | undefined;
  assert.equal(attendance?.is_active, 1);
  const pass = await request(`/api/zaylist/entries/${entryId}/pass`, 12);
  assert.equal(pass.body.token, accept.body.token);
  assert.equal(pass.body.state, "accepted");
  assert.equal(
    (await request(`/api/zaylist/entries/${entryId}/accept`, 8, "POST")).status,
    403,
  );
  assert.equal(
    (await request(`/api/zaylist/entries/${entryId}/decline`, 12, "POST")).status,
    200,
  );
  assert.equal(
    (await request("/api/events/10/zaylist/entries", 1, "POST", { userId: 8 })).status,
    201,
  );
});

test("gifting moves the spot, its token validity and its drinks to the new holder", async (t) => {
  const { request, setConfig } = await setup(t);
  await setConfig(1, 5);
  const add = await request("/api/events/10/zaylist/entries", 1, "POST", { userId: 5 });
  const entryId = add.body.entry.id;
  const accept = await request(`/api/zaylist/entries/${entryId}/accept`, 5, "POST");
  const oldToken = accept.body.token;
  assert.equal(
    (await request(`/api/zaylist/entries/${entryId}/drinks`, 1, "POST", { kind: "comp", total: 2 })).status,
    201,
  );
  const gift = await request(`/api/zaylist/entries/${entryId}/gift`, 5, "POST", { userId: 8 });
  assert.equal(gift.status, 201);
  assert.equal(gift.body.entry.state, "pending");
  assert.equal(gift.body.entry.source, "gift");
  assert.equal(gift.body.entry.gifted_from, entryId);
  assert.equal(gift.body.entry.drinks, undefined);
  assert.equal(
    (await request("/api/zaylist/scan", 1, "POST", { token: oldToken })).status,
    404,
  );
  const newId = gift.body.entry.id;
  const drinks = await request(`/api/zaylist/entries/${newId}/pass`, 8);
  assert.equal(drinks.body.drinks.length, 1);
  assert.equal(drinks.body.drinks[0].total, 2);
  const accept2 = await request(`/api/zaylist/entries/${newId}/accept`, 8, "POST");
  assert.equal(accept2.status, 200);
  const drinkScan = await request("/api/zaylist/scan/drink", 1, "POST", {
    token: accept2.body.token,
  });
  assert.equal(drinkScan.status, 200);
  assert.equal(drinkScan.body.remaining, 1);
});

test("the door scan redeems once, reports already-in, and token regeneration kills the old code", async (t) => {
  const { request, setConfig } = await setup(t);
  await setConfig(1, 5);
  await request("/api/events/10/zaylist/allowances/3", 1, "PUT", { role: "staff", spots: 0 });
  const add = await request("/api/events/10/zaylist/entries", 1, "POST", { userId: 6 });
  const entryId = add.body.entry.id;
  const accept = await request(`/api/zaylist/entries/${entryId}/accept`, 6, "POST");
  const token = accept.body.token;
  assert.equal(
    (await request("/api/zaylist/scan", 6, "POST", { token })).status,
    403,
  );
  assert.equal(
    (await request("/api/zaylist/scan", 8, "POST", { token })).status,
    403,
  );
  const first = await request("/api/zaylist/scan", 3, "POST", { token });
  assert.equal(first.status, 200);
  assert.equal(first.body.result, "admitted");
  const second = await request("/api/zaylist/scan", 1, "POST", { token });
  assert.equal(second.body.result, "already-in");
  assert.equal(second.body.firstScan.by, "staff");
  assert.equal(
    (await request("/api/zaylist/scan", 1, "POST", { token: "nope-not-a-token" })).status,
    404,
  );
  const regen = await request(`/api/zaylist/entries/${entryId}/token/regenerate`, 6, "POST");
  assert.equal(regen.status, 200);
  assert.notEqual(regen.body.token, token);
  assert.equal(
    (await request("/api/zaylist/scan", 1, "POST", { token })).status,
    404,
  );
  const third = await request("/api/zaylist/scan", 1, "POST", { token: regen.body.token });
  assert.equal(third.body.result, "already-in");
  const counts = (await request("/api/events/10/zaylist", 1)).body.counts;
  assert.equal(counts.arrived, 1);
});

test("drink comps need the assigned privilege and stop at their limit", async (t) => {
  const { db, request, setConfig } = await setup(t);
  await setConfig(1, 5);
  await request("/api/events/10/zaylist/allowances/10", 1, "PUT", { role: "staff", spots: 0 });
  const add = await request("/api/events/10/zaylist/entries", 1, "POST", { userId: 7 });
  const entryId = add.body.entry.id;
  const accept = await request(`/api/zaylist/entries/${entryId}/accept`, 7, "POST");
  const token = accept.body.token;
  assert.equal(
    (await request(`/api/zaylist/entries/${entryId}/drinks`, 3, "POST", { kind: "comp", total: 1 })).status,
    403,
  );
  assert.equal(
    (await request("/api/events/10/zaylist/privileges/10", 2, "PUT")).status,
    403,
  );
  assert.equal(
    (await request("/api/events/10/zaylist/privileges/10", 1, "PUT")).status,
    200,
  );
  assert.equal(
    (await request(`/api/zaylist/entries/${entryId}/drinks`, 10, "POST", { kind: "comp", total: 2 })).status,
    201,
  );
  assert.equal(
    (await request(`/api/zaylist/entries/${entryId}/drinks`, 10, "POST", { kind: "discount", total: 1 })).status,
    400,
  );
  assert.equal(
    (await request(`/api/zaylist/entries/${entryId}/drinks`, 10, "POST", { kind: "discount", total: 1, percent: 25 })).status,
    201,
  );
  const scan = () => request("/api/zaylist/scan/drink", 10, "POST", { token });
  assert.equal((await scan()).body.remaining, 1);
  assert.equal((await scan()).body.remaining, 0);
  const third = await scan();
  assert.equal(third.status, 200);
  assert.equal(third.body.kind, "discount");
  assert.equal((await scan()).status, 409);
  const used = db
    .prepare("SELECT COUNT(*) AS n FROM zaylist_redemptions WHERE kind='drink'")
    .get() as { n: number };
  assert.equal(used.n, 3);
});

test("full access is the owner's grant and delegates the allocation calls", async (t) => {
  const { request, setConfig } = await setup(t);
  assert.equal(
    (await request("/api/events/10/zaylist/grants/9", 2, "PUT")).status,
    403,
  );
  assert.equal((await setConfig(9, 2)).status, 403);
  assert.equal(
    (await request("/api/events/10/zaylist/grants/9", 1, "PUT")).status,
    200,
  );
  assert.equal((await setConfig(9, 2)).status, 200);
  const draw = await request("/api/events/10/zaylist/draw", 9, "POST", { count: 1 });
  assert.equal(draw.status, 201);
  assert.equal(draw.body.awarded, 1);
  assert.equal(
    (await request("/api/events/10/zaylist/grants/9", 1, "DELETE")).status,
    200,
  );
  assert.equal((await setConfig(9, 2)).status, 403);
});

test("an invite by email is claimed at sign-up and then accepted; phone adds invite too", async (t) => {
  const { db, request, setConfig } = await setup(t);
  await setConfig(1, 5);
  const add = await request("/api/events/10/zaylist/entries", 1, "POST", {
    contact: "future@example.test",
  });
  assert.equal(add.status, 201);
  assert.equal(add.body.entry.user_id, null);
  assert.equal(add.body.entry.source, "invite");
  const phone = await request("/api/events/10/zaylist/entries", 1, "POST", {
    contact: "503-555-1234",
  });
  assert.equal(phone.status, 201);
  const kinds = db
    .prepare("SELECT contact_kind AS kind FROM zaylist_invites ORDER BY id")
    .all() as { kind: string }[];
  assert.deepEqual(kinds.map((k) => k.kind), ["email", "phone"]);
  db.prepare(
    "INSERT INTO users VALUES(11,'newbie','future@example.test','New',NULL,'active')",
  ).run();
  const mine = await request("/api/me/zaylist", 11);
  assert.equal(mine.body.claimable, 1);
  const unverified = await request("/api/zaylist/invites/claim", 11, "POST");
  assert.equal(unverified.body.claimed, 0);
  const {secret} = db.prepare("SELECT secret FROM zaylist_invite_deliveries WHERE entry_id=?").get(add.body.entry.id) as {secret: string};
  assert.equal((await request("/api/zaylist/invites/claim", 12, "POST", {token:secret})).status,409);
  const claim = await request("/api/zaylist/invites/claim", 11, "POST", {token:secret});
  assert.equal(claim.body.claimed, 1);
  const entry = db
    .prepare("SELECT user_id AS userId, state FROM zaylist_entries WHERE id=?")
    .get(add.body.entry.id) as { userId: number; state: string };
  assert.equal(entry.userId, 11);
  const accept = await request(`/api/zaylist/entries/${add.body.entry.id}/accept`, 11, "POST");
  assert.equal(accept.status, 200);
  assert.ok(accept.body.token);
  // An email that belongs to a member adds them directly, no invite.
  const direct = await request("/api/events/10/zaylist/entries", 1, "POST", {
    contact: "a@example.test",
  });
  assert.equal(direct.body.entry.user_id, 5);
  assert.equal(direct.body.entry.source, "direct");
});

test("acceptance messages: everyone gets the general one, talent gets the saved one too", async (t) => {
  const { request, setConfig } = await setup(t);
  await setConfig(1, 5);
  const saved = await request("/api/events/10/zaylist/saved-messages", 1, "POST", {
    label: "Talent brief",
    body: "2 drinks comped, you get two people to put on the list",
  });
  assert.equal(saved.status, 201);
  assert.equal(
    (
      await request("/api/events/10/zaylist/messages", 1, "PUT", {
        generalBody: "You are on the Zay'list",
        talentMessageId: saved.body.id,
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await request("/api/events/10/zaylist/messages", 3, "PUT", {
        generalBody: "nope",
      })
    ).status,
    403,
  );
  const addTalent = await request("/api/events/10/zaylist/entries", 1, "POST", { userId: 4 });
  const talentAccept = await request(
    `/api/zaylist/entries/${addTalent.body.entry.id}/accept`,
    4,
    "POST",
  );
  assert.equal(talentAccept.body.message, "You are on the Zay'list");
  assert.equal(
    talentAccept.body.talentMessage,
    "2 drinks comped, you get two people to put on the list",
  );
  const addGuest = await request("/api/events/10/zaylist/entries", 1, "POST", { userId: 5 });
  const guestAccept = await request(
    `/api/zaylist/entries/${addGuest.body.entry.id}/accept`,
    5,
    "POST",
  );
  assert.equal(guestAccept.body.message, "You are on the Zay'list");
  assert.equal(guestAccept.body.talentMessage, null);
  const broadcast = await request("/api/events/10/zaylist/broadcasts", 1, "POST", {
    body: "Doors at 9",
  });
  assert.equal(broadcast.status, 201);
  assert.equal(broadcast.body.recipientCount, 2);
  assert.equal(broadcast.body.delivery, "inbox");
});

test("scheduled draws spend a daily drip once per Pacific day and notify the drawn accounts", async t => {
  const {db,request,list,operations} = await setup(t);
  await request("/api/events/10/zaylist/config",1,"PUT",{poolSize:3,maxCap:3,drawDaysBefore:2,dripPerDay:1});
  operations.dueDraws(Date.parse("2099-06-28T18:00:00Z"));
  assert.equal((await list(1)).body.counts.pending,0);
  operations.dueDraws(Date.parse("2099-06-29T18:00:00Z"));
  operations.dueDraws(Date.parse("2099-06-30T01:00:00Z"));
  assert.equal((await list(1)).body.counts.pending,1);
  operations.dueDraws(Date.parse("2099-06-30T18:00:00Z"));
  assert.equal((await list(1)).body.counts.pending,2);
  assert.equal((db.prepare("SELECT COUNT(*) AS n FROM fixture_messages").get() as {n:number}).n,2);
});

test("a verified text invitation matches the next add; contact search hides unrelated addresses", async t => {
  const {db,request,setConfig} = await setup(t);
  await setConfig(1,5);
  const phone = await request("/api/events/10/zaylist/entries",1,"POST",{contact:"(503) 555-1111"});
  assert.equal(phone.status,201);
  const {secret} = db.prepare("SELECT secret FROM zaylist_invite_deliveries WHERE entry_id=?").get(phone.body.entry.id) as {secret:string};
  assert.equal((await request("/api/zaylist/invites/claim",12,"POST",{token:secret})).body.claimed,1);
  assert.equal((await request("/api/zaylist/invites/claim",8,"POST",{token:secret})).status,409);
  const search = await request("/api/events/10/zaylist/search?q=5035551111",1);
  assert.equal(search.body.results[0].id,12);
  assert.equal("email" in search.body.results[0],false);
  await request(`/api/zaylist/entries/${phone.body.entry.id}/decline`,12,"POST");
  const direct = await request("/api/events/10/zaylist/entries",1,"POST",{contact:"+1 503 555 1111"});
  assert.equal(direct.body.entry.user_id,12);
});

test("drink privilege readback and access control survive refresh",async t => {
  const {request,list,setConfig} = await setup(t);
  await setConfig(1,3);
  await request("/api/events/10/zaylist/allowances/3",1,"PUT",{role:"staff",spots:1});
  await request("/api/events/10/zaylist/privileges/3",1,"PUT",{});
  assert.equal((await list(1)).body.allowances[0].drinkPrivilege,1);
  assert.equal((await list(3)).body.permissions.canGrantDrinks,true);
  assert.equal((await list(3)).body.grants,undefined);
  await request("/api/events/10/zaylist/privileges/3",1,"DELETE");
  assert.equal((await list(1)).body.allowances[0].drinkPrivilege,0);
  assert.equal((await list(3)).body.permissions.canGrantDrinks,false);
});
