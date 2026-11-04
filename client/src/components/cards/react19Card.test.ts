import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as React from "react";
import * as ReactDOM from "react-dom";
import {
  cardActivityMode,
  cardMorphName,
  cardMorphUpdate,
  cardResource,
  nextOptimisticFlag,
  openCardDescription,
  openCardTitle,
  resetCardResources,
} from "./react19CardModel";

test("installed React 19.3 exports the card runtime", () => {
  assert.equal(typeof React.ViewTransition, "symbol");
  assert.equal(typeof React.Activity, "symbol");
  assert.equal(typeof React.use, "function");
  assert.equal(typeof React.useOptimistic, "function");
  assert.equal(typeof ReactDOM.preload, "function");
  assert.equal(typeof ReactDOM.preinit, "function");
  assert.equal(typeof ReactDOM.preloadModule, "function");
  assert.equal(typeof ReactDOM.preinitModule, "function");
});

test("card morph names are css idents and beach magenta stays put", () => {
  assert.equal(cardMorphName(["outz", "outz:beach"]), "zay-card-outz-outz-beach");
  assert.equal(cardMorphUpdate(false).update["card-open"], "zay-card-morph");
  assert.equal(cardMorphUpdate(true).update["card-open"], "none");
  assert.equal(cardMorphUpdate(false).share.default, "none");
  assert.equal(cardActivityMode(true), "visible");
  assert.equal(cardActivityMode(false), "hidden");
  const today = readFileSync(new URL("../home/TodayLocationCard.tsx", import.meta.url), "utf8");
  const small = readFileSync(new URL("../home/OutzSmallCard.tsx", import.meta.url), "utf8");
  assert.match(today, /beach:\s*"--neon-magenta"/);
  assert.match(small, /beach:\s*"--neon-magenta"/);
});

test("open card metadata is a title and a short description", () => {
  assert.equal(openCardTitle("  Tamolitch Falls  "), "Tamolitch Falls · Zaylist");
  assert.equal(openCardTitle("   "), "Zaylist");
  assert.equal(openCardDescription("  River   trail  "), "River trail");
  assert.equal(openCardDescription("x".repeat(400)).length, 180);
  assert.doesNotMatch(openCardTitle("McKenzie"), /\u2014/);
});

test("card resources dedupe and optimistic flags toggle once", async () => {
  let calls = 0;
  const first = cardResource("demo", async () => {
    calls += 1;
    return "ready";
  });
  const second = cardResource("demo", async () => {
    calls += 1;
    return "other";
  });
  assert.equal(first, second);
  assert.equal(await first, "ready");
  assert.equal(calls, 1);
  resetCardResources();
  assert.equal(nextOptimisticFlag(false, "toggle"), true);
  assert.equal(nextOptimisticFlag(true, false), false);
});
