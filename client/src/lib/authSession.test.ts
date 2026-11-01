import assert from "node:assert/strict";
import test from "node:test";
import { QueryClient } from "@tanstack/react-query";
import { endSession, replaceAccountCache, resolveSession } from "./authSession";

test("account switch clears private data and cancels late responses", async () => {
  const client = new QueryClient();
  client.setQueryData(["/api/messages/inbox"], ["account A message"]);
  let resolve!: (value: string[]) => void;
  const pending = client.fetchQuery({ queryKey: ["thread"], queryFn: () => new Promise<string[]>(r => { resolve = r; }) }).catch(() => undefined);
  replaceAccountCache(client, 1, 2);
  resolve(["late account A message"]);
  await pending;
  assert.equal(client.getQueryData(["/api/messages/inbox"]), undefined);
  assert.equal(client.getQueryData(["thread"]), undefined);
  client.clear();
});

test("same-account refresh keeps data; logout clears it", () => {
  const client = new QueryClient();
  client.setQueryData(["private"], "saved");
  replaceAccountCache(client, 1, 1);
  assert.equal(client.getQueryData(["private"]), "saved");
  replaceAccountCache(client, 1, null);
  assert.equal(client.getQueryData(["private"]), undefined);
});

const sessionUser = { id: 7, username: "tucker" };
const jsonResponse = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
const instantly = async () => {};
function scripted(steps: Array<() => Promise<Response>>) {
  let calls = 0;
  const request = (async () => steps[Math.min(calls++, steps.length - 1)]()) as typeof fetch;
  return { request, calls: () => calls };
}

test("session resolves on the first successful request", async () => {
  const { request, calls } = scripted([async () => jsonResponse(200, sessionUser)]);
  const resolution = await resolveSession(request, { sleep: instantly });
  assert.deepEqual(resolution, { kind: "user", user: sessionUser });
  assert.equal(calls(), 1);
});

test("session recovers when a transient 503 precedes a valid session", async () => {
  const { request, calls } = scripted([
    async () => jsonResponse(503),
    async () => jsonResponse(200, sessionUser),
  ]);
  const resolution = await resolveSession(request, { sleep: instantly });
  assert.deepEqual(resolution, { kind: "user", user: sessionUser });
  assert.equal(calls(), 2);
});

test("session recovers when the network drops before a valid session", async () => {
  const { request, calls } = scripted([
    async () => { throw new Error("offline"); },
    async () => jsonResponse(200, sessionUser),
  ]);
  const resolution = await resolveSession(request, { sleep: instantly });
  assert.deepEqual(resolution, { kind: "user", user: sessionUser });
  assert.equal(calls(), 2);
});

test("a 401 is a confirmed sign-out and is never retried", async () => {
  const { request, calls } = scripted([async () => jsonResponse(401)]);
  const resolution = await resolveSession(request, { sleep: instantly, delaysMs: [1, 1, 1] });
  assert.deepEqual(resolution, { kind: "anonymous" });
  assert.equal(calls(), 1);
});

test("persistent transient failure stays unknown and the retries are bounded", async () => {
  const { request, calls } = scripted([async () => jsonResponse(503)]);
  const resolution = await resolveSession(request, { sleep: instantly, delaysMs: [1, 1] });
  assert.deepEqual(resolution, { kind: "unknown" });
  assert.equal(calls(), 3, "one attempt per delay plus the first try, then it stops");
});

test("a superseded refresh stops retrying instead of applying a stale result", async () => {
  const { request, calls } = scripted([
    async () => jsonResponse(503),
    async () => jsonResponse(200, sessionUser),
  ]);
  const resolution = await resolveSession(request, {
    sleep: instantly,
    shouldContinue: () => false,
  });
  assert.deepEqual(resolution, { kind: "unknown" });
  assert.equal(calls(), 1);
});

test("logout rejects HTTP and network failures and accepts success", async () => {
  await assert.rejects(endSession(async () => new Response(null, { status: 500 })), /Logout failed/);
  await assert.rejects(endSession(async () => { throw new Error("offline"); }), /offline/);
  await endSession(async (url, options) => {
    assert.equal(url, "/api/auth/logout");
    assert.equal(options?.credentials, "include");
    assert.equal(options?.method, "POST");
    return new Response(null, { status: 200 });
  });
});
