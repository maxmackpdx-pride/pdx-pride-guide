import assert from "node:assert/strict";
import { mkdtempSync, copyFileSync, rmSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { test } from "node:test";
import express from "express";

test("native clients use the real session, private save and public attendance contracts", async (t) => {
  const tmp = mkdtempSync(path.join(tmpdir(), "zay-native-events-"));
  process.env.DATABASE_PATH = path.join(tmp, "data.db");
  process.env.LOCAL_PREVIEW = "1";
  process.env.NODE_ENV = "test";
  copyFileSync("data.db", process.env.DATABASE_PATH);
  let server: Server | undefined;
  const { storage, sqlite } = await import("./storage");
  t.after(async () => {
    if (server?.listening)
      await new Promise<void>((done) => server!.close(() => done()));
    sqlite.close();
    rmSync(tmp, { recursive: true, force: true });
  });
  const { registerRoutes } = await import("./routes");
  const once = randomBytes(8).toString("hex"),
    password = randomBytes(16).toString("hex");
  const member = storage.createUser({
    username: "planner" + once,
    email: once + "@fixture.invalid",
    passwordHash: password,
  });
  const other = storage.createUser({
    username: "reader" + once,
    email: "reader" + once + "@fixture.invalid",
    passwordHash: password,
  });
  const eventId = (
    sqlite.prepare("SELECT id FROM events WHERE id>0 LIMIT 1").get() as {
      id: number;
    }
  ).id;
  sqlite
    .prepare(
      "UPDATE events SET status='LIVE', is_public=1, is_private=0, title='Fixture open studio',date_start=?,date_end=?,claimed_by=NULL,submitted_by=NULL WHERE id=?",
    )
    .run("2099-07-01T16:00:00", "2099-07-02T18:00:00", eventId);
  sqlite.prepare("DELETE FROM event_hosts WHERE event_id=?").run(eventId);
  sqlite.prepare("DELETE FROM attendances WHERE event_id=?").run(eventId);
  storage.setPrimaryEventHost(eventId, member.id);
  const app = express();
  app.use(express.json());
  server = createServer(app);
  registerRoutes(server, app);
  await new Promise<void>((done) => server!.listen(0, "127.0.0.1", done));
  const origin = "http://127.0.0.1:" + (server.address() as AddressInfo).port;
  const jars = new Map<number, string>();
  async function call(
    user: number,
    method: string,
    route: string,
    data?: unknown,
  ) {
    const response = await fetch(origin + route, {
      method,
      headers: {
        "Content-Type": "application/json",
        Cookie: jars.get(user) || "",
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    const session = response.headers
      .getSetCookie()
      .find((cookie) => cookie.startsWith("connect.sid="));
    if (session) jars.set(user, session.split(";")[0]);
    return {
      status: response.status,
      data: await response.json().catch(() => null),
    };
  }
  const route = "/api/events/" + eventId;
  const date = "2099-07-02",
    planning = route + "/occurrences/" + date + "/planning";
  assert.equal((await call(0, "GET", "/api/auth/me")).status, 401);
  const detail = await call(0, "GET", route + "?date=" + date);
  assert.equal(detail.status, 200);
  assert.equal(detail.data.dateStart.slice(0, 10), date);
  assert.equal((await call(0, "GET", route + "?date=2099-07-03")).status, 404);
  for (const user of [member, other]) {
    const signed = await call(user.id, "POST", "/api/auth/login", {
      email: user.username,
      password,
    });
    assert.equal(signed.status, 200);
    assert.equal((await call(user.id, "GET", "/api/auth/me")).data.id, user.id);
  }
  assert.equal((await call(member.id, "PUT", route + "/save")).status, 200);
  assert.ok(
    (await call(member.id, "GET", "/api/events/mine/saved")).data.includes(
      eventId,
    ),
  );
  assert.ok(
    !(await call(other.id, "GET", "/api/events/mine/saved")).data.includes(
      eventId,
    ),
  );
  assert.ok(
    !(await call(member.id, "GET", "/api/events/mine/check-ins")).data.some(
      (e: { eventId: number }) => e.eventId === eventId,
    ),
  );
  const going = await call(other.id, "POST", route + "/attendance", {
    message: "Going",
    visibility: "public",
  });
  assert.equal(going.status, 200);
  assert.ok(
    (await call(other.id, "GET", "/api/events/mine/check-ins")).data.some(
      (e: { eventId: number; visibility: string }) =>
        e.eventId === eventId && e.visibility === "public",
    ),
  );
  const metrics = await call(member.id, "GET", "/api/organizer/events/metrics");
  assert.equal(
    metrics.data.events.find((e: { id: number }) => e.id === eventId)
      ?.activeGoing,
    1,
  );
  const gig = {
    postType: "POSTING_GIG",
    title: "Sound technician",
    description: "Mix live sound for this community performance.",
    name: "Stage manager",
    contactEmail: member.email,
    acceptRules: true,
    eventId,
    occurrenceDate: date,
  };
  assert.equal((await call(other.id, "POST", "/api/gigs", gig)).status, 403);
  assert.equal(
    (
      await call(member.id, "POST", "/api/gigs", {
        ...gig,
        occurrenceDate: "2099-07-03",
      })
    ).status,
    400,
  );
  const posted = await call(member.id, "POST", "/api/gigs", gig);
  assert.equal(posted.status, 200);
  assert.deepEqual(
    (await call(0, "GET", planning)).data.gigs.map((g: { id: number }) => g.id),
    [posted.data.id],
  );
  assert.deepEqual(
    (await call(0, "GET", route + "/occurrences/2099-07-01/planning")).data
      .gigs,
    [],
  );
  assert.equal(
    (await call(other.id, "DELETE", route + "/attendance")).status,
    200,
  );
  const visibility = sqlite.prepare("UPDATE events SET is_public=?, is_private=? WHERE id=?");
  for (const [published, privateFlag] of [[0, 0], [1, 1]]) {
    visibility.run(published, privateFlag, eventId);
    const filteredFeed = await call(0, "GET", "/api/events?visibility=public");
    assert.equal(filteredFeed.status, 200);
    assert.ok(!filteredFeed.data.some((e: { id: number }) => e.id === eventId));
    const legacyFeed = await call(0, "GET", "/api/events");
    assert.ok(legacyFeed.data.some((e: { id: number }) => e.id === eventId));
    for (const viewer of [0, other.id, member.id]) {
      assert.equal((await call(viewer, "GET", route + "?visibility=public")).status, 404);
      assert.equal((await call(viewer, "GET", route + "?visibility=public&date=" + date)).status, 404);
      assert.equal((await call(viewer, "GET", planning)).status, 404);
    }
    assert.equal((await call(other.id, "GET", route + "?date=" + date)).status, 404);
    assert.equal((await call(0, "GET", route + "/detail?date=" + date)).status, 404);
    assert.equal((await call(member.id, "GET", route + "?date=" + date)).status, 200);
    assert.deepEqual((await call(member.id, "GET", route + "/detail?date=" + date)).data.gigs, []);
    assert.equal((await call(member.id, "POST", "/api/gigs", gig)).status, 400);
    sqlite.prepare("UPDATE users SET sub_admin=1 WHERE id=?").run(other.id);
    assert.equal((await call(other.id, "GET", route + "?date=" + date)).status, 200);
    assert.equal((await call(other.id, "GET", route + "?visibility=public&date=" + date)).status, 404);
    sqlite.prepare("UPDATE users SET sub_admin=0 WHERE id=?").run(other.id);
    assert.equal((await call(other.id, "GET", route + "?date=" + date)).status, 404);
  }
  visibility.run(1, 0, eventId);
  const publicFeed = await call(0, "GET", "/api/events?visibility=public");
  assert.ok(publicFeed.data.some((e: { id: number }) => e.id === eventId));
  const { getTuckerHostedArchiveRow } = await import("../shared/tuckerHostedArchive");
  const archived = getTuckerHostedArchiveRow(-900001)!;
  const archiveRoute = "/api/events/" + archived.id + "?date=" + archived.dateStart.slice(0, 10);
  assert.equal((await call(0, "GET", archiveRoute)).status, 200);
  assert.equal((await call(0, "GET", archiveRoute + "&visibility=public")).status, 404);
  assert.equal((await call(member.id, "DELETE", route + "/save")).status, 200);
  assert.equal((await call(member.id, "POST", "/api/auth/logout")).status, 200);
  assert.equal(
    (await call(member.id, "GET", "/api/events/mine/saved")).status,
    401,
  );
});
