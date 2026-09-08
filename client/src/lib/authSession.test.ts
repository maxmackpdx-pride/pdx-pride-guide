import assert from "node:assert/strict";
import test from "node:test";
import { QueryClient } from "@tanstack/react-query";
import { endSession, replaceAccountCache } from "./authSession";

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
