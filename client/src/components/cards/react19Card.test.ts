import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { deliveredImageUrl, slotPixels } from "@/lib/imageSlot";
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

test("preload picks the sized candidate and skips the full original", () => {
  const variants = [
    { src: "/api/poster-variants/image/a-640.webp", width: 640 },
    { src: "/api/poster-variants/image/b-1280.webp", width: 1280 },
    { src: "/uploads/new-daily-poster.png", width: 1500 },
  ];
  const original = "/uploads/new-daily-poster.png";
  const never = () => false;
  assert.equal(slotPixels("200px", 390, never), 200);
  assert.equal(slotPixels("144px", 390, never), 144);
  assert.equal(slotPixels("auto, (max-width: 800px) calc(100vw - 32px), 760px", 390, (query) => query === "(max-width: 800px)"), 358);
  assert.equal(deliveredImageUrl(variants, 200, 1, original), variants[0].src);
  assert.equal(deliveredImageUrl(variants, 200, 3, original), variants[0].src);
  assert.equal(deliveredImageUrl(variants, 358, 2, original), variants[1].src);
  assert.equal(deliveredImageUrl(variants, 1200, 2, original), null);
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
