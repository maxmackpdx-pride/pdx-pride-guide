/**
 * Owner-side QSearch pairing over real HTTP with a real signed owner session, against a disposable copy of the seed
 * database. Regression for: session middleware mounted after the event-research routes, so every owner request to
 * GET /api/admin/event-research/pairing (and approve) answered 401 and the panel showed "Could not load agent access".
 * Run: ALLOW_QSEARCH_TEST_DB=1 node --import tsx --test script/qsearch-owner-pairing-http.test.ts
 */
import test from "node:test";
import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { copyFileSync, mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { once } from "node:events";
import Database from "better-sqlite3";
import sign from "cookie-signature";

const SECRET = "disposable-owner-pairing-test";
const enabled = process.env.ALLOW_QSEARCH_TEST_DB === "1";

test("owner session: pair-start, list, approve, redeem, expiry, scope", { skip: !enabled && "set ALLOW_QSEARCH_TEST_DB=1 (disposable DB only)", timeout: 180_000 }, async () => {
  const directory = mkdtempSync(path.join(tmpdir(), "qsearch-owner-"));
  const databasePath = path.join(directory, "data.db");
  copyFileSync("data.db", databasePath);
  const seed = new Database(databasePath);
  const owner = seed.prepare("SELECT id FROM users WHERE username = 'tucker_pdmax'").get() as { id: number };
  const other = seed.prepare("SELECT id FROM users WHERE username != 'tucker_pdmax' AND id != ? LIMIT 1").get(owner.id) as { id: number };
  seed.exec("CREATE TABLE IF NOT EXISTS express_sessions (sid TEXT PRIMARY KEY, sess TEXT NOT NULL, expired INTEGER NOT NULL)");
  const put = seed.prepare("INSERT OR REPLACE INTO express_sessions (sid, sess, expired) VALUES (?, ?, ?)");
  const session = (userId: number) => JSON.stringify({ cookie: { originalMaxAge: 600000, httpOnly: true, path: "/" }, userId });
  put.run("owner-sid", session(owner.id), Date.now() + 3_600_000);
  put.run("member-sid", session(other.id), Date.now() + 3_600_000);
  seed.close();
  const cookieFor = (sid: string) => `connect.sid=${encodeURIComponent("s:" + sign.sign(sid, SECRET))}`;

  const probe = createServer(); probe.listen(0, "127.0.0.1"); await once(probe, "listening");
  const port = (probe.address() as { port: number }).port;
  await new Promise(resolve => probe.close(resolve));
  const child: ChildProcess = spawn(process.execPath, ["--import", "tsx", "server/index.ts"], {
    env: { PATH: process.env.PATH || "", DATABASE_PATH: databasePath, SESSION_SECRET: SECRET, NODE_ENV: "development", LOCAL_PREVIEW: "1", PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  for (const stream of [child.stdout!, child.stderr!]) stream.on("data", chunk => { output = (output + String(chunk)).slice(-3000); });
  const base = `http://127.0.0.1:${port}`;
  const call = async (method: string, route: string, opts: { sid?: string; token?: string; body?: unknown } = {}) => {
    const response = await fetch(base + route, {
      method,
      headers: {
        Accept: "application/json",
        ...(opts.body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(opts.sid ? { Cookie: cookieFor(opts.sid) } : {}),
        ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
      },
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    });
    return { status: response.status, body: await response.json().catch(() => ({})) as any };
  };

  try {
    for (let i = 0; i < 240; i += 1) {
      if (child.exitCode !== null) throw new Error(`server exited: ${output}`);
      try { if ((await fetch(`${base}/api/health`)).ok) break; } catch { /* booting */ }
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Anonymous and non-owner members stay locked out.
    assert.equal((await call("GET", "/api/admin/event-research/pairing")).status, 401);
    assert.equal((await call("GET", "/api/admin/event-research/pairing", { sid: "member-sid" })).status, 401);

    // pair-start -> owner sees it -> approve -> pair-complete (redeem) -> scoped credential.
    const start = await call("POST", "/api/admin/event-research/pairing/start");
    assert.equal(start.status, 201);
    const { id, claimSecret, displayCode } = start.body;
    assert.equal((await call("POST", "/api/admin/event-research/pairing/redeem", { body: { id, claimSecret } })).status, 202);

    const listed = await call("GET", "/api/admin/event-research/pairing", { sid: "owner-sid" });
    assert.equal(listed.status, 200, `owner GET failed: ${JSON.stringify(listed.body)} ${output}`);
    const row = listed.body.requests.find((r: any) => r.id === id);
    assert.equal(row.displayCode, displayCode);
    assert.equal(row.status, "pending");
    assert.ok(!JSON.stringify(listed.body).includes(claimSecret), "claim secret never leaves the server");

    assert.equal((await call("POST", `/api/admin/event-research/pairing/${id}/approve`, { sid: "member-sid" })).status, 401);
    assert.equal((await call("POST", `/api/admin/event-research/pairing/${id}/approve`, { sid: "owner-sid" })).status, 200);
    const approved = await call("GET", "/api/admin/event-research/pairing", { sid: "owner-sid" });
    assert.equal(approved.body.requests.find((r: any) => r.id === id).status, "approved");
    const twice = await call("POST", `/api/admin/event-research/pairing/${id}/approve`, { sid: "owner-sid" });
    assert.equal(twice.status, 409);
    assert.equal(twice.body.status, "approved");

    const redeemed = await call("POST", "/api/admin/event-research/pairing/redeem", { body: { id, claimSecret } });
    assert.equal(redeemed.status, 200);
    assert.equal(redeemed.body.status, "ready");
    const token = redeemed.body.token as string;
    const consumed = await call("GET", "/api/admin/event-research/pairing", { sid: "owner-sid" });
    assert.equal(consumed.body.requests.find((r: any) => r.id === id).status, "consumed");
    assert.ok(!JSON.stringify(consumed.body).includes(token), "token never listed");

    // Scope: the credential works on event-research routes only.
    assert.equal((await call("GET", "/api/admin/event-research/control", { token })).status, 200);
    assert.equal((await call("GET", "/api/admin/events", { token })).status, 401);
    assert.equal((await call("GET", "/api/admin/event-research/pairing", { token })).status, 401, "credential cannot manage pairing");

    // Expired path: still visible with status "expired", approve explains why, redeem is 410.
    const old = await call("POST", "/api/admin/event-research/pairing/start");
    const db = new Database(databasePath);
    db.prepare("UPDATE agent_pairing_requests SET expires_at = ? WHERE id = ?").run(new Date(Date.now() - 60_000).toISOString(), old.body.id);
    db.close();
    const afterExpiry = await call("GET", "/api/admin/event-research/pairing", { sid: "owner-sid" });
    assert.equal(afterExpiry.body.requests.find((r: any) => r.id === old.body.id).status, "expired");
    const late = await call("POST", `/api/admin/event-research/pairing/${old.body.id}/approve`, { sid: "owner-sid" });
    assert.equal(late.status, 409);
    assert.equal(late.body.status, "expired");
    assert.match(late.body.error, /expired/i);
    assert.equal((await call("POST", "/api/admin/event-research/pairing/redeem", { body: { id: old.body.id, claimSecret: old.body.claimSecret } })).status, 410);
  } finally {
    if (child.exitCode === null) { child.kill("SIGTERM"); await Promise.race([once(child, "exit"), new Promise(resolve => setTimeout(resolve, 5_000))]); if (child.exitCode === null) child.kill("SIGKILL"); }
    rmSync(directory, { recursive: true, force: true });
  }
});
