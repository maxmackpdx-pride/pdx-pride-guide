import assert from "node:assert/strict";
import test from "node:test";
import { QueryObserver } from "@tanstack/react-query";
import { queryClient } from "./queryClient";

test("expired listing data refetches on return", async () => {
  const key = ["listing-regression"];
  queryClient.setQueryData(key, ["old"], { updatedAt: Date.now() - 61_000 });
  const observer = new QueryObserver(queryClient, { queryKey: key, queryFn: async () => ["new"] });
  await new Promise<void>(resolve => {
    const unsubscribe = observer.subscribe(result => {
      if (result.data?.[0] === "new") { unsubscribe(); resolve(); }
    });
  });
  assert.deepEqual(queryClient.getQueryData(key), ["new"]);
  assert.equal(queryClient.getDefaultOptions().queries?.refetchOnWindowFocus, true);
  queryClient.clear();
});

test("client errors are not retried; transient server errors are", () => {
  const retry = queryClient.getDefaultOptions().queries!.retry as (count: number, error: Error) => boolean;
  assert.equal(retry(0, new Error("401: Unauthorized")), false);
  assert.equal(retry(0, new Error("500: Unavailable")), true);
  assert.equal(retry(2, new Error("500: Unavailable")), false);
});
