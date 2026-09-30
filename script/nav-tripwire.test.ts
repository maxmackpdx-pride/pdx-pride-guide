import { test } from "node:test";
import assert from "node:assert/strict";
import { appRoutePatterns, checkNav } from "./nav-tripwire";

test("the live nav passes", () => {
  assert.deepEqual(checkNav(), []);
});

test("a nav link with no route trips", () => {
  const problems = checkNav('<Route path="/" component={Home} />');
  assert.ok(problems.some((p) => p.includes("which no App route serves")));
});

test("a placeholder Nav.tsx trips", () => {
  const problems = checkNav(undefined, "export default function Nav() { return null; }");
  assert.ok(problems.includes("Nav.tsx looks like a stub"));
  assert.ok(problems.includes("Nav.tsx no longer renders NavShell"));
});

test("route params match any segment", () => {
  const [re] = appRoutePatterns('<Route path="/u/:username" component={X} />');
  assert.ok(re.test("/u/rowan"));
  assert.ok(!re.test("/u/rowan/extra"));
});
