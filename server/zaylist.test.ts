import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import Database from "better-sqlite3";
import express from "express";
import type { AddressInfo } from "node:net";
import { createGuestListOperations } from "./guestListOperations";
import { registerHostWorkspace } from "./hostWorkspace";
import type { IStorage } from "./storage";
import { registerZaylist, type ZaylistStore } from "./zaylist";

// Users: 1 owner (PRIMARY host) · 2 promoter (COHOST) · 3 staff · 4 talent
// 5/6/7 RSVPs · 8 outsider · 9 full-access candidate · 10 barkeep · 12 walk-in
async function setup(t: { after: (fn: () => unknown) => void }, databasePath = ":memory:") {
  const db = new Database(databasePath);
  t.after(() => db.close());
  db.exec(`CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT,email TEXT,display_name TEXT,photo_url TEXT,status TEXT);
    CREATE TABLE events(id INTEGER PRIMARY KEY,title TEXT,venue_name TEXT,address TEXT,lat REAL,lng REAL,date_start TEXT,date_end TEXT,status TEXT,claimed_by TEXT,submitted_by TEXT,source TEXT,is_claimable INTEGER DEFAULT 0,is_public INTEGER DEFAULT 1,is_private INTEGER DEFAULT 0,admission TEXT,ticket_url TEXT);
    CREATE TABLE event_hosts(event_id INTEGER,user_id INTEGER,role TEXT);
    CREATE TABLE event_talent(id INTEGER PRIMARY KEY,event_id INTEGER,user_id INTEGER,role TEXT,status TEXT);
    CREATE TABLE attendances(id INTEGER PRIMARY KEY,event_id INTEGER,user_id INTEGER,handle TEXT,message TEXT,avatar_seed TEXT,photo_url TEXT,is_anonymous INTEGER DEFAULT 0,visibility TEXT DEFAULT 'public',expires_at TEXT,is_active INTEGER DEFAULT 1,created_at TEXT);
    CREATE TABLE card_hearts(user_id INTEGER,kind TEXT,ref TEXT);
    CREATE TABLE missed_connections(id INTEGER PRIMARY KEY,user_id INTEGER,event_id INTEGER,place_id INTEGER,title TEXT,body TEXT,status TEXT,created_at TEXT);
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
      VALUES(10,'Paid Night','Eastbank Hall','2099-07-01T16:00:00','2099-07-02T02:00:00','LIVE','TICKETED','https://tickets.example.test/10');
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
    venueName: "Eastbank Hall",
    dateStart: "2099-07-01T16:00:00",
    dateEnd: "2099-07-02T02:00:00",
  };
  const venueOwners = new Set<number>();
  const storage = {
    isPrimarySiteOwner:(user:{id:number})=>user.id===12,
    getUserOwnedBusinesses: (id:number) => venueOwners.has(id) ? [{id:77,name:"Eastbank Hall",ownerId:id,active:true}] : [],
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
  const { store, operations, accessFor } = registerZaylist(
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
  registerHostWorkspace(app,db,storage,(req,res,next)=>req.session.userId ? next() : res.sendStatus(401),store,accessFor,()=>true);
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
      body: text && res.headers.get("content-type")?.includes("json") ? (JSON.parse(text) as Record<string, any>) : {},
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
  return { db, store, storage, dbEvent, operations, request, list, setConfig, venueOwners };
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
  assert.equal(attendance, undefined, "a private guest pass must not create a public Going RSVP");
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

test("VIP broadcasts use accepted guests, honor the editor role, and replay without duplicating messages",async t=>{
  const {db,request,setConfig}=await setup(t);
  const path="/api/events/10/zaylist";
  await setConfig(1,4);
  for(const id of [6,7,8]) {
    const add=await request(path+"/entries",1,"POST",{userId:id});
    if(id!==7) await request(`/api/zaylist/entries/${add.body.entry.id}/${id===8?"accept":"decline"}`,id,"POST");
  }
  const body={body:"Doors at eight.",requestKey:crypto.randomUUID()};
  assert.equal((await request(path+"/broadcasts",8,"POST",body)).status,403);
  const first=await request(path+"/broadcasts",1,"POST",body);
  assert.equal(first.status,201);
  assert.equal(first.body.recipientCount,1);
  const replay=await request(path+"/broadcasts",1,"POST",body);
  assert.deepEqual(replay.body,first.body);
  assert.equal((await request(path+"/broadcasts",1,"POST",{...body,body:"Other update."})).status,409);
  assert.deepEqual(db.prepare("SELECT recipient FROM fixture_messages WHERE body=?").pluck().all(body.body),[8]);
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

test("host workspace separates interest, going and private saves, and shows only authorized team work",async t=>{
  const {db,request,list,setConfig,venueOwners}=await setup(t);
  db.exec("INSERT INTO card_hearts VALUES(5,'event','10'),(12,'event','10'),(8,'place','10'); CREATE TABLE event_saves(user_id INTEGER,event_id INTEGER); INSERT INTO event_saves VALUES(8,10)");
  const owner=await request("/api/hub/workspace",1);
  assert.equal(owner.body.events[0].metrics.interested,2);
  assert.equal(owner.body.events[0].metrics.going,3);
  assert.equal(owner.body.events[0].metrics.saves,undefined);
  const stranger=await request("/api/hub/workspace",8);
  assert.deepEqual(stranger.body.events,[]);
  assert.equal(stranger.body.personal.interested,0);
  await setConfig(1,5);
  await request("/api/events/10/zaylist/allowances/3",1,"PUT",{role:"staff",spots:1});
  const staff=await request("/api/hub/workspace",3);
  assert.equal(staff.body.events[0].canEditEvent,false);
  assert.equal(staff.body.events[0].role,"staff");
  venueOwners.add(9);
  assert.equal((await list(9)).body.permissions.allocator,true);
  assert.equal((await request("/api/hub/workspace",9)).body.events[0].role,"Owner");
  assert.equal((await request("/api/hub/workspace",9)).body.events[0].canEditEvent,false);
  assert.equal((await request("/api/events/10/zaylist/allowances/3",1,"DELETE")).status,200);
  assert.deepEqual((await request("/api/hub/workspace",3)).body.events,[]);
});

test("a host can moderate the linked event without seeing the author or affecting another event",async t=>{
  const {db,request}=await setup(t);
  db.exec("INSERT INTO missed_connections VALUES(90,5,10,NULL,'A title','A post','ACTIVE','2099-07-01'),(91,8,11,NULL,'Other','Other post','ACTIVE','2099-07-01')");
  const path="/api/hub/workspace/events/10/connections";
  const view=await request(path,1);
  assert.equal(view.body.items.length,1);
  assert.equal(view.body.items[0].user_id,undefined);
  assert.equal(view.body.alerts,true);
  await request(path+"/alerts",1,"PUT",{enabled:false});
  assert.equal((await request(path,1)).body.alerts,false);
  await request(path+"/90",1,"DELETE");
  assert.deepEqual((await request(path,1)).body.items,[]);
  assert.equal((db.prepare("SELECT status FROM missed_connections WHERE id=91").get() as {status:string}).status,"ACTIVE");
});

test("invites preserve proof across retries and bounded resends, with no historical delivery sweep", async t => {
  const { db, store, storage, request, setConfig } = await setup(t);
  await setConfig(1,4);
  const add = (contact:string) => request("/api/events/10/zaylist/entries",1,"POST",{contact});
  const legacy = await add("old@example.test");
  db.prepare("DELETE FROM zaylist_invite_deliveries WHERE entry_id=?").run(legacy.body.entry.id);
  const queued = await add("new@example.test");
  assert.equal((await add("NEW@example.test")).status,409);
  const id = queued.body.entry.id;
  const attempts:{contact:string;token:string;version:number}[] = [];
  const queue = createGuestListOperations(db,store,storage,()=>true,()=>true,async (_kind,contact,token,_id,version=1) => {
    attempts.push({contact,token,version});
    return attempts.length > 1;
  });
  const now = Date.UTC(2026,9,1);
  await Promise.all([queue.deliverInvites(now),queue.deliverInvites(now)]);
  await queue.deliverInvites(now+30000);
  assert.equal(attempts.length,1);
  await queue.deliverInvites(now+60000);
  queue.queueInvite(id,true,now+120000);
  await queue.deliverInvites(now+120000);
  assert.equal(attempts.length,2);
  queue.queueInvite(id,true,now+660000);
  queue.queueInvite(id,true,now+660000);
  await queue.deliverInvites(now+660000);
  await queue.deliverInvites(now+999000);
  assert.deepEqual(attempts.map(a=>a.version),[1,1,2]);
  assert.equal(new Set(attempts.map(a=>a.token)).size,1);
  assert.ok(attempts.every(a=>a.contact==="new@example.test"));
});

test("bar inspection and serving preserve admission, separate grant limits, and reject revoked access",async t=>{
  const {request,setConfig,dbEvent} = await setup(t);
  await setConfig(1,4);
  const base="/api/events/10/zaylist";
  await request(base+"/allowances/10",1,"PUT",{role:"staff",spots:0});
  await request(base+"/privileges/10",1,"PUT");
  assert.equal((await request(base+"/privileges/8",1,"PUT")).status,409);
  const entry=(await request(base+"/entries",1,"POST",{userId:7})).body.entry.id;
  const add=(body:object)=>request(`/api/zaylist/entries/${entry}/drinks`,10,"POST",body);
  const a=(await add({kind:"comp",total:2})).body.id;
  const b=(await add({kind:"discount",total:1,percent:20})).body.id;
  const token=(await request(`/api/zaylist/entries/${entry}/accept`,7,"POST")).body.token;
  const scan=(suffix:string,user=10,more={})=>request("/api/zaylist/scan"+suffix,user,"POST",{token,eventId:10,...more});
  assert.equal((await scan("/inspect",7)).status,403);
  assert.equal((await scan("/inspect",10,{eventId:11})).status,404);
  assert.equal((await scan("/inspect")).body.state,"accepted");
  const served=await scan("/drink",10,{drinkGrantId:b});
  assert.deepEqual(served.body.drinks.map((d:{remaining:number})=>d.remaining),[2,0]);
  assert.equal((await scan("/inspect")).body.state,"accepted");
  assert.equal((await scan("/drink",10,{drinkGrantId:b})).status,409);
  assert.equal((await scan("")).body.result,"admitted");
  assert.equal((await scan("/inspect")).body.state,"redeemed");
  assert.equal((await scan("/drink",10,{drinkGrantId:a})).body.remaining,1);
  await request(base+"/privileges/10",1,"DELETE");
  assert.equal((await request(`/api/zaylist/drinks/${a}`,10,"DELETE")).status,403);
  assert.equal((await request(`/api/zaylist/drinks/${a}`,1,"DELETE")).status,200);
  assert.equal((await scan("/drink",10,{drinkGrantId:a})).status,409);
  await request(`/api/zaylist/entries/${entry}/drinks`,1,"POST",{kind:"comp",total:4});
  assert.equal((await request(base,1)).body.counts.drinksOutstanding,4);
  dbEvent.isPublic=false;
  assert.equal((await scan("/inspect")).status,404);
  assert.equal((await request(`/api/zaylist/entries/${entry}/pass`,7)).status,404);
  assert.equal((await request("/api/me/zaylist",7)).body.entries.length,0);
});

test("an owner can freeze and reopen the list; admitted guests retain bar service and the scan ledger stays scoped",async t=>{
  const {db,request,setConfig,operations,store}=await setup(t);
  const base="/api/events/10/zaylist";
  await setConfig(1,5);
  await request(base+"/allowances/3",1,"PUT",{role:"staff",spots:2});
  await request(base+"/grants/9",1,"PUT",{});
  const id=(await request(base+"/entries",1,"POST",{userId:5})).body.entry.id;
  await request(`/api/zaylist/entries/${id}/drinks`,1,"POST",{kind:"discount",total:1,percent:25});
  const freeze=(actor:number,frozen:boolean)=>request(base+"/freeze",actor,"PUT",{frozen});
  assert.equal((await freeze(9,true)).status,403);
  assert.equal((await freeze(1,true)).status,200);
  assert.equal((await freeze(1,true)).status,200);
  assert.equal((db.prepare("SELECT COUNT(*) AS n FROM zaylist_door_freezes").get() as {n:number}).n,1);
  assert.equal((await request(base,3)).body.frozen,true);
  assert.equal((await request(base+"/entries",3,"POST",{userId:6})).status,409);
  assert.equal((await request(base+"/entries",1,"POST",{userId:7})).status,201);
  assert.equal((await request(`/api/zaylist/entries/${id}/gift`,5,"POST",{userId:8})).status,409);
  assert.equal(operations.draw(10,1,1,Date.now()).ok,false);
  const token=(await request(`/api/zaylist/entries/${id}/accept`,5,"POST")).body.token;
  const scan=(suffix:string)=>request("/api/zaylist/scan"+suffix,3,"POST",{token,eventId:10});
  await scan("");await scan("/drink");
  assert.equal((await request(base+"/scans",3)).status,403);
  assert.equal((await request(base+"/scans",5)).status,403);
  const rows=(await request(base+"/scans",2)).body.items;
  assert.deepEqual(rows.map((r:{kind:string;scanner:string})=>[r.kind,r.scanner]),[["drink","Staff"],["entry","Staff"]]);
  assert.equal(rows[0].percent,25);
  assert.equal((await request(base+"/scans?before="+rows[0].id,1)).body.items.length,1);
  assert.equal((await request(base+"/scans?before=-2",1)).status,400);
  await freeze(1,false);
  assert.equal(store.frozen(10),false);
  assert.equal((await request(base+"/entries",3,"POST",{userId:6})).status,201);
});

test("an empty scheduled draw waits for an RSVP and a gifted winner cannot redraw",async t=>{
  const {db,request,operations,store}=await setup(t);
  await request("/api/events/10/zaylist/config",1,"PUT",{poolSize:4,maxCap:4,drawDaysBefore:2,dripPerDay:1});
  db.prepare("UPDATE attendances SET is_active=0").run();
  const now = Date.parse("2099-06-29T18:00:00Z");
  operations.dueDraws(now);
  assert.equal(store.draws(10).length,0);
  db.prepare("UPDATE attendances SET is_active=1 WHERE user_id=5").run();
  operations.dueDraws(now+60000);
  assert.equal(store.draws(10).length,1);
  const winner = store.holderEntry(10,5)!;
  assert.equal((await request(`/api/zaylist/entries/${winner.id}/gift`,5,"POST",{userId:8})).status,201);
  const again=operations.draw(10,1,1,now+120000);
  assert.ok(again.ok && again.awarded===0);
});

test("paid organizer planning requires verified eligibility, a positive discount, settled payment and current event authority",async t=>{
  const {request,db,dbEvent}=await setup(t);
  const plan="/api/events/10/organizer-plan",desk="/api/hub/planning-owner",review=desk+"/requests/10";
  const task={title:"Soundcheck",scheduledAt:"2099-07-01T16:30",requestKey:crypto.randomUUID()};
  const state=await request(plan,1);
  assert.equal(state.body.prices,null);
  assert.equal((await request(plan,8)).status,403);
  assert.equal((await request(plan+"/items",2,"POST",task)).status,403);
  assert.equal((await request(desk,1)).status,403);
  assert.equal((await request(desk+"/prices",1,"PUT",{standard:5000,nonprofit:2500})).status,403);
  assert.equal((await request(desk+"/prices",12,"PUT",{standard:5000,nonprofit:0})).status,400);
  assert.equal((await request(desk+"/prices",12,"PUT",{standard:5000,nonprofit:5000})).status,400);
  assert.equal((await request(desk+"/prices",12,"PUT",{standard:5000,nonprofit:2500})).status,200);
  assert.equal((await request(plan+"/request",1,"POST",{organization:"Fixture group",ein:"bogus"})).status,400);
  const application={organization:"Fixture group",ein:"12-3456789"};
  assert.equal((await request(plan+"/request",1,"POST",application)).status,201);
  assert.equal((await request(plan+"/request",1,"POST",application)).status,200);
  assert.equal((await request(plan+"/request",1,"POST",{})).status,409);
  assert.equal((await request(plan,2)).body.application.ein,undefined);
  assert.equal((await request(desk,12)).body.applications[0].ein,"123456789");
  const payment={action:"activate",reference:"local-test-invoice",amount:2500};
  assert.equal((await request(review,12,"PUT",payment)).status,409);
  assert.equal((await request(review,1,"PUT",{action:"verify",note:"Fake member approval"})).status,403);
  assert.equal((await request(review,12,"PUT",{action:"verify",note:"Local fixture decision"})).status,200);
  assert.equal((await request(plan,1)).body.application.quote,2500);
  assert.equal((await request(review,12,"PUT",{...payment,amount:0})).status,400);
  assert.equal((await request(review,12,"PUT",{...payment,amount:5000})).status,409);
  assert.equal((await request(plan+"/request",2,"POST",{organization:"Corrected local name",ein:"123456789"})).status,403);
  assert.equal((await request(plan+"/request",1,"POST",{organization:"Corrected local name",ein:"123456789"})).status,200);
  assert.equal((await request(plan,1)).body.application.verification,"pending");
  assert.equal((await request(review,12,"PUT",payment)).status,409);
  assert.equal((await request(review,12,"PUT",{action:"verify",note:"Corrected name confirmed"})).status,200);
  assert.equal((await request(review,12,"PUT",payment)).status,200);
  assert.equal((await request(review,12,"PUT",payment)).status,200);
  assert.equal((await request(plan+"/items",2,"POST",task)).status,201);
  assert.equal((await request(plan+"/items",2,"POST",task)).status,200);
  assert.equal((await request(plan+"/items",2,"POST",{...task,title:"Other title"})).status,409);
  assert.equal((await request(plan+"/items",2,"POST",{...task,requestKey:crypto.randomUUID(),scheduledAt:"2099-02-30T11:00"})).status,400);
  const items=(await request(plan,1)).body.items;
  assert.equal(items.length,1);
  assert.equal((await request(plan+"/items/"+items[0].id,1,"PATCH",{completed:true})).status,200);
  assert.equal((await request(plan,2)).body.items[0].completed,1);
  assert.equal((await request(review,12,"PUT",{action:"revoke"})).status,200);
  assert.deepEqual((await request(plan,2)).body.items,[]);
  assert.equal((await request(plan+"/items/"+items[0].id,2,"PATCH",{completed:false})).status,403);
  assert.equal((db.prepare("SELECT COUNT(*) AS n FROM organizer_planning_decisions").get() as {n:number}).n,4);
  dbEvent.isPrivate=true;
  assert.equal((await request(plan,1)).status,404);
});

test("private member stats use only the current account, its bookmarks and visible conversations",async t=>{
  const {db,request,dbEvent}=await setup(t);
  db.exec(`CREATE TABLE event_saves(user_id INTEGER,event_id INTEGER);
    CREATE TABLE follows(follower_user_id INTEGER,following_user_id INTEGER);
    CREATE TABLE messages(to_user_id INTEGER,from_user_id INTEGER,thread_id TEXT,context_type TEXT,is_read INTEGER,deleted_by_to INTEGER);
    INSERT INTO event_saves VALUES(5,10),(6,10),(6,12);
    INSERT INTO follows VALUES(6,5),(8,5);
    INSERT INTO member_blocks VALUES(5,8);
    INSERT INTO messages VALUES(5,6,'gigOne','GIG',0,0),(5,6,'gigOne','GIG',0,0),(5,8,'other','GIG',0,0),(6,5,'gigTwo','GIG',0,0);
    INSERT INTO card_hearts VALUES(8,'event','10');`);
  const path="/api/hub/member-stats";
  assert.equal((await request(path)).status,401);
  const read=(await request(path+"?userId=6",5)).body;
  assert.equal(read.privateEventSaves,1);
  assert.equal(read.interested,0);
  assert.equal(read.followers,1);
  assert.equal(read.gigReplies,1);
  assert.deepEqual(read.going,[{id:10,title:"Paid Night"}]);
  assert.equal((await request(path,6)).body.privateEventSaves,2);
  dbEvent.isPrivate=true;
  assert.deepEqual((await request(path,5)).body.going,[]);
});

test("host stages derive from event records; host notes stay private and cannot silently overwrite a newer draft",async t=>{
  const {db,request,dbEvent}=await setup(t);
  db.exec("CREATE TABLE event_gig_links(gig_id INTEGER,event_id INTEGER); CREATE TABLE gig_posts(id INTEGER,status TEXT); INSERT INTO gig_posts VALUES(1,'LIVE'),(2,'HIDDEN'); INSERT INTO event_gig_links VALUES(1,10),(2,10)");
  const path="/api/events/10/host-signal";
  assert.equal((await request(path,5)).status,403);
  const read=await request(path,1);
  assert.equal(read.body.openGigs,1);
  assert.equal(read.body.stage,"Commitment");
  assert.equal(read.body.repeatGuests,0);
  const draft={stage:"Interest",body:"Doors briefing",revision:0};
  assert.equal((await request(path+"/note",1,"PUT",draft)).body.revision,1);
  assert.equal((await request(path+"/note",1,"PUT",draft)).body.revision,1);
  assert.equal((await request(path+"/note",1,"PUT",{...draft,body:"Stale"})).status,409);
  assert.deepEqual((await request(path,2)).body.notes,[]);
  assert.equal((await request(path,1)).body.notes[0].body,"Doors briefing");
  assert.equal((await request(path+"/note",1,"PUT",{...draft,body:"Final briefing",revision:1})).body.revision,2);
  dbEvent.dateStart="2024-01-01T18:00:00";dbEvent.dateEnd="2024-01-02T02:00:00";
  assert.equal((await request(path,1)).body.stage,"After");
  dbEvent.isPrivate=true;
  assert.equal((await request(path,1)).status,404);
});

test("a stale concurrent gift cannot split a single guest spot or be revoked by its former holder",async t=>{
  const {store,request,setConfig,list}=await setup(t);
  await setConfig(1,1);
  const added=await request("/api/events/10/zaylist/entries",1,"POST",{userId:8});
  const original=store.entry(added.body.entry.id)!;
  const accepted=await request(`/api/zaylist/entries/${original.id}/accept`,8,"POST");
  assert.equal(accepted.status,200);
  const gifted=await request(`/api/zaylist/entries/${original.id}/gift`,8,"POST",{userId:12});
  assert.equal(gifted.status,201);
  assert.equal(store.gift(original,{userId:6,contact:null},8).ok,false);
  assert.equal((await list(1)).body.counts.pending,1);
  assert.equal(store.liveCount(10),1);
  assert.equal((await request(`/api/events/10/zaylist/entries/${gifted.body.entry.id}`,8,"DELETE")).status,403);
  assert.equal((await request("/api/events/10/zaylist/draw",1,"POST",{count:1})).status,409);
});

test("door and bar scans validate the token while holding the write lock against a second worker", async t => {
  const folder = mkdtempSync(join(tmpdir(),"zaylist-door-race-"));
  t.after(() => rmSync(folder,{recursive:true,force:true}));
  const file = join(folder,"fixture.db");
  const {storage,request,setConfig} = await setup(t,file);
  const concurrent = new Database(file,{timeout:0});
  t.after(() => concurrent.close());
  await setConfig(1,1);
  const entry=(await request("/api/events/10/zaylist/entries",1,"POST",{userId:7})).body.entry.id;
  const token=(await request(`/api/zaylist/entries/${entry}/accept`,7,"POST")).body.token;
  await request(`/api/zaylist/entries/${entry}/drinks`,1,"POST",{kind:"comp",total:1});
  const readEvent=storage.getEvent;
  const revoke=()=>concurrent.prepare("UPDATE zaylist_tokens SET revoked_at=CURRENT_TIMESTAMP WHERE token=?").run(token);
  let blocked=false;
  storage.getEvent=id=>{
    try {revoke();} catch (error) {
      if ((error as {code?:string}).code !== "SQLITE_BUSY") throw error;
      blocked=true;
    }
    return readEvent(id);
  };
  for(const suffix of ["/drink",""]) {
    blocked=false;
    assert.equal((await request("/api/zaylist/scan"+suffix,1,"POST",{token})).status,200);
    assert.ok(blocked,"token validation and the redemption must commit together");
  }
  storage.getEvent=readEvent;
  revoke();
  assert.equal((await request("/api/zaylist/scan",1,"POST",{token})).status,404);
});
