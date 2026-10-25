import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import data from "./circuitWallpaperData.json" with { type: "json" };

const n = data.routes.length;

test("circuit wallpaper routes are well formed and inside the 3072 x 1536 map", () => {
  assert.ok(n > 200);
  for (const r of data.routes) {
    assert.ok(r.length >= 2);
    for (const [x, y] of r) {
      assert.ok(x >= -5 && x <= 3077 && y >= -5 && y <= 1541);
    }
  }
});

test("circuit wallpaper id tables point at real routes", () => {
  for (const id of [...data.desktopSideIds, ...data.dedicatedRoadIds, ...data.dedicatedRiverIds]) {
    assert.ok(Number.isInteger(id) && id >= 0 && id < n, `bad route id ${id}`);
  }
  assert.ok(data.firstRiverRoute > 0 && data.firstRiverRoute < n);
  assert.equal(data.conflicts.length, n);
  data.conflicts.forEach((row, i) => {
    assert.ok(row.includes(i), "a route always conflicts with itself");
    for (const j of row) assert.ok(j >= 0 && j < n);
  });
});

test("circuit wallpaper ships every texture it loads", () => {
  const src = readFileSync(new URL("./circuitWallpaperEngine.ts", import.meta.url), "utf8");
  const files = [...src.matchAll(/from "\.\/assets\/([\w-]+\.(?:jpg|png))"/g)].map((m) => m[1]);
  assert.equal(files.length, 7);
  for (const f of files) assert.ok(existsSync(new URL(`./assets/${f}`, import.meta.url)), `${f} missing`);
});

test("the wallpaper is mounted once in the app shell, not per page", () => {
  const app = readFileSync(new URL("../../App.tsx", import.meta.url), "utf8");
  assert.equal(app.split("<SiteWallpaper />").length - 1, 1);
});
