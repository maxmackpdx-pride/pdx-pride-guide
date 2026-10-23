import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { copyFileSync, mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { once } from "node:events";
import Database from "better-sqlite3";

if (process.env.ALLOW_QSEARCH_TEST_DB !== "1") {
  throw new Error("Run only with ALLOW_QSEARCH_TEST_DB=1 and a disposable database.");
}

const directory = mkdtempSync(path.join(tmpdir(), "qsearch-http-smoke-"));
const databasePath = path.join(directory, "data.db");
copyFileSync("data.db", databasePath);

const probe = createServer();
probe.listen(0, "127.0.0.1");
await once(probe, "listening");
const port = probe.address().port;
await new Promise((resolve) => probe.close(resolve));

const child = spawn(process.execPath, ["dist/index.cjs"], {
  env: {
    PATH: process.env.PATH || "",
    DATABASE_PATH: databasePath,
    SESSION_SECRET: "disposable-qsearch-http-test",
    NODE_ENV: "production",
    LOCAL_PREVIEW: "1",
    PORT: String(port),
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let serverOutput = "";
for (const stream of [child.stdout, child.stderr]) {
  stream.on("data", (chunk) => {
    serverOutput = (serverOutput + String(chunk)).slice(-3000);
  });
}

const baseUrl = `http://127.0.0.1:${port}`;
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function call(method, route, body, token) {
  const response = await fetch(`${baseUrl}${route}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  const payload = await response.json();
  return { status: response.status, payload };
}

try {
  let healthy = false;
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`Local server exited during startup: ${serverOutput}`);
    try {
      const response = await fetch(`${baseUrl}/api/health`, { signal: AbortSignal.timeout(1_000) });
      if (response.ok) { healthy = true; break; }
    } catch { /* boot is still in progress */ }
    await pause(250);
  }
  assert.ok(healthy, `Local server did not start: ${serverOutput}`);

  assert.equal((await call("GET", "/api/admin/event-research/control")).status, 401);
  const start = await call("POST", "/api/admin/event-research/pairing/start", {});
  assert.equal(start.status, 201);
  const { id, claimSecret, displayCode } = start.payload;
  assert.equal(displayCode.length, 10);
  assert.equal((await call("GET", "/api/admin/event-research/pairing")).status, 401);
  assert.equal((await call("POST", "/api/admin/event-research/pairing/redeem", { id, claimSecret })).status, 202);
  assert.equal((await call("POST", "/api/admin/event-research/pairing/redeem", { id, claimSecret: "wrong" })).status, 401);

  // The owner-session HTTP gate is checked above; the unit test covers the
  // approval function. Mark this disposable request approved for the HTTP path.
  const db = new Database(databasePath);
  try {
    db.prepare("UPDATE agent_pairing_requests SET approved_by = 1, approved_at = ? WHERE id = ?")
      .run(new Date().toISOString(), id);
  } finally { db.close(); }
  const redeemed = await call("POST", "/api/admin/event-research/pairing/redeem", { id, claimSecret });
  assert.equal(redeemed.status, 200);
  assert.equal(redeemed.payload.status, "ready");
  const { token, credentialId } = redeemed.payload;
  assert.equal((await call("POST", "/api/admin/event-research/pairing/redeem", { id, claimSecret })).status, 410);
  assert.equal((await call("GET", "/api/admin/event-research/control", undefined, token)).status, 200);
  assert.equal((await call("GET", "/api/admin/events", undefined, token)).status, 401, "agent is not a human admin");

  const run = await call("POST", "/api/admin/event-research/runs", {}, token);
  assert.equal(run.status, 201);
  const { runId } = run.payload;
  const candidateKey = `candidate:http-smoke:${randomUUID()}`;
  const event = { title: `Disposable HTTP test ${randomUUID()}`, venueName: "Disposable Test Venue", dateStart: "2027-11-15T19:00:00" };
  const sourceUrl = "https://example.com/disposable-test-only";
  const checkedAt = new Date().toISOString();
  for (const [field, observedValue] of Object.entries(event)) {
    const recorded = await call("POST", "/api/admin/event-research/evidence", {
      runId, entityKey: candidateKey, field, observedValue, sourceUrl, checkedAt,
    }, token);
    assert.equal(recorded.status, 201);
  }
  const gate = await call("POST", "/api/admin/event-research/decision-gate", {
    runId, candidateKey, fields: Object.keys(event), proposedValues: event,
  }, token);
  assert.equal(gate.status, 200);
  assert.equal(gate.payload.publishable, true);

  const input = {
    runId, candidateKey, event,
    evidenceReceipts: Object.keys(event).map((field) => ({ field, sourceUrl, checkedAt })),
    reason: "Publish only three synthetic verified facts in a disposable local database.",
    mistakeTestsPassed: false,
    idempotencyKey: randomUUID(),
  };
  const preview = await call("POST", "/api/admin/event-research/events", { ...input, dryRun: true }, token);
  assert.equal(preview.status, 201);
  assert.equal(preview.payload.dryRun, true);
  const created = await call("POST", "/api/admin/event-research/events", { ...input, dryRun: false }, token);
  assert.equal(created.status, 201);
  assert.equal(created.payload.event.status, "LIVE");
  assert.equal(created.payload.event.source, "qsearch-3");
  assert.equal(created.payload.event.ageRequirement, "UNVERIFIED");
  assert.equal(created.payload.event.admission, "UNKNOWN");
  assert.equal((await call("GET", "/api/admin/event-research/events?from=2027-11-15", undefined, token))
    .payload.events.some((item) => item.id === created.payload.event.id), true);
  const rolledBack = await call("POST", `/api/admin/event-research/changes/${encodeURIComponent(created.payload.rollback.token)}/rollback`, { confirm: true }, token);
  assert.equal(rolledBack.status, 200);
  assert.equal(rolledBack.payload.event.status, "HIDDEN");
  assert.equal((await call("POST", `/api/admin/event-research/runs/${runId}/finish`, {}, token)).status, 200);

  const revokeDb = new Database(databasePath);
  try {
    revokeDb.prepare("UPDATE agent_credentials SET revoked_at = ? WHERE id = ?")
      .run(new Date().toISOString(), credentialId);
  } finally { revokeDb.close(); }
  assert.equal((await call("GET", "/api/admin/event-research/control", undefined, token)).status, 401);
  console.log("QSearch local HTTP pairing, scoped read, synthetic publish, rollback, and revocation passed.");
} finally {
  if (child.exitCode === null) {
    child.kill("SIGTERM");
    await Promise.race([once(child, "exit"), pause(5_000)]);
    if (child.exitCode === null) child.kill("SIGKILL");
  }
  rmSync(directory, { recursive: true, force: true });
}
