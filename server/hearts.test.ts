import test from "node:test";
import assert from "node:assert/strict";
import { addHeart, removeHeart, hasHeart, listHearts, isHeartKind, safeHeartHref } from "./hearts";

const user = 987654;

test("a heart is stored once per card and removed cleanly", () => {
  removeHeart(user, "event", "1");
  addHeart(user, "event", "1", { title: "Pride Night", href: "/events/1" });
  addHeart(user, "event", "1", { title: "Pride Night!", href: "/events/1" });
  assert.equal(listHearts(user).filter(h => h.kind === "event" && h.ref === "1").length, 1);
  assert.equal(listHearts(user).find(h => h.ref === "1")?.title, "Pride Night!");
  assert.equal(hasHeart(user, "event", "1"), true);
  removeHeart(user, "event", "1");
  assert.equal(hasHeart(user, "event", "1"), false);
});

test("only known kinds and in-site links are accepted", () => {
  assert.equal(isHeartKind("outz"), true);
  assert.equal(isHeartKind("anything"), false);
  assert.equal(safeHeartHref("/outzide?place=x"), "/outzide?place=x");
  assert.equal(safeHeartHref("//evil.example"), null);
  assert.equal(safeHeartHref("https://evil.example"), null);
});
