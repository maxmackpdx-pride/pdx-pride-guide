/**
 * Real-server regression: routes that read req.session must run after the session middleware.
 * /api/board-archive (Boards Archive "couldn't load") and /api/admin/event-research/pairing both answered 401 to
 * signed-in users because they were registered before it.
 * Run: ALLOW_QSEARCH_TEST_DB=1 node --import tsx --test script/session-routes-http.test.ts
 */
import test from "node:test";
import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { copyFileSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { once } from "node:events";
import Database from "better-sqlite3";
import sign from "cookie-signature";

const SECRET = "disposable-session-routes-test";

test("no session-guarded route is registered before the session middleware", () => {
  const src = readFileSync("server/routes.ts", "utf8");
  const mount = src.indexOf('app.use("/api", sessionMiddleware)');
  assert.ok(mount > 0, "session middleware is mounted at the top of registerRoutes");
  const lines = src.slice(0, mount).split("\n");
  const early = lines.filter(line => /^\s*(app\.(get|post|put|patch|delete|all)\(|register\w+\()/.test(line) && /require(Auth|Admin)/.test(line));
  assert.deepEqual(early, [], "guards must come after the session mount");
  const register = src.indexOf("registerBoardArchiveRoutes(app");
  assert.ok(register > mount, "board archive routes are registered after sessions");
});

test("signed-in session reaches /api/board-archive, /api/board-collection and the owner pairing list", { skip: process.env.ALLOW_QSEARCH_TEST_DB !== "1" && "set ALLOW_QSEARCH_TEST_DB=1 (disposable DB only)", timeout: 180_000 }, async () => {
  const directory = mkdtempSync(path.join(tmpdir(), "session-routes-"));
  const databasePath = path.join(directory, "data.db");
  copyFileSync("data.db", databasePath);
  const seed = new Database(databasePath);
  const owner = seed.prepare("SELECT id FROM users WHERE username = 'tucker_pdmax'").get() as { id: number };
  const member = seed.prepare("SELECT id FROM users WHERE username != 'tucker_pdmax' AND id != ? LIMIT 1").get(owner.id) as { id: number };
  seed.exec("CREATE TABLE IF NOT EXISTS express_sessions (sid TEXT PRIMARY KEY, sess TEXT NOT NULL, expired INTEGER NOT NULL)");
  const put = seed.prepare("INSERT OR REPLACE INTO express_sessions (sid, sess, expired) VALUES (?, ?, ?)");
  const session = (userId: number) => JSON.stringify({ cookie: { originalMaxAge: 600000, httpOnly: true, path: "/" }, userId });
  put.run("owner-sid", session(owner.id), Date.now() + 3_600_000);
  put.run("member-sid", session(member.id), Date.now() + 3_600_000);
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
  const get = async (route: string, sid?: string) => {
    const response = await fetch(base + route, { headers: sid ? { Cookie: cookieFor(sid) } : {} });
    return { status: response.status, headers: response.headers, body: await response.json().catch(() => null) as any };
  };
  try {
    for (let i = 0; i < 240; i += 1) {
      if (child.exitCode !== null) throw new Error(`server exited: ${output}`);
      try { if ((await fetch(`${base}/api/health`)).ok) break; } catch { /* booting */ }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    for (const route of ["/api/board-archive", "/api/board-collection"]) {
      assert.equal((await get(route)).status, 401, `${route} anonymous`);
      const signedIn = await get(route, "member-sid");
      assert.equal(signedIn.status, 200, `${route} signed in: ${JSON.stringify(signedIn.body)}`);
      assert.ok(Array.isArray(signedIn.body));
      assert.equal(signedIn.headers.get("cache-control"), "private, no-store");
    }
    assert.equal((await get("/api/admin/event-research/pairing", "member-sid")).status, 401, "non-admin member stays out");
    assert.equal((await get("/api/admin/event-research/pairing", "owner-sid")).status, 200);
    assert.equal((await get("/api/health")).status, 200);
  } finally {
    if (child.exitCode === null) { child.kill("SIGTERM"); await Promise.race([once(child, "exit"), new Promise(resolve => setTimeout(resolve, 5_000))]); if (child.exitCode === null) child.kill("SIGKILL"); }
    rmSync(directory, { recursive: true, force: true });
  }
});
