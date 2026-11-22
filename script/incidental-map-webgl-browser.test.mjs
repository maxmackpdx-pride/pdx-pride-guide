import assert from "node:assert/strict";
import { test } from "node:test";
import { mapFixture, visibility } from "./map-browser-helpers.mjs";

test("native incidental map loads its style and releases WebGL on hide and unmount", { timeout: 120000 }, async () => {
  const fixture = await mapFixture("script/fixtures/incidental-map-browser.tsx", { webgl: true });
  const { page } = fixture;
  try {
    await page.goto(fixture.base + "__map-qa?kind=card", { waitUntil: "domcontentloaded" });
    await page.locator("#toggle").waitFor();
    await page.evaluate(() => { window.vectorEvidence = []; document.querySelector("#toggle").click(); });
    await page.locator("#slot").scrollIntoViewIfNeeded();

    async function capture() {
      await page.waitForFunction(() => [...window.mapStats.active].some(map => map.loaded()));
      const evidence = await page.evaluate(() => {
        const [map] = window.mapStats.active;
        const canvas = map.getCanvas();
        const gl = canvas.getContext("webgl2");
        const record = { canvas, gl, removed: false };
        map.once("remove", () => { record.removed = true; });
        window.vectorEvidence.push(record);
        return {
          connected: canvas.isConnected,
          liveContext: !!gl && !gl.isContextLost(),
          layers: map.getStyle().layers.map(layer => layer.id),
          canvases: document.querySelectorAll("canvas.maplibregl-canvas").length,
        };
      });
      assert.equal(evidence.connected, true);
      assert.equal(evidence.liveContext, true);
      assert.ok(evidence.layers.includes("background"));
      assert.equal(evidence.canvases, 1);
    }

    const released = () => page.waitForFunction(() =>
      window.mapStats.active.size === 0 &&
      !document.querySelector("canvas.maplibregl-canvas") &&
      window.vectorEvidence.every(record => record.removed && !record.canvas.isConnected && record.gl.isContextLost())
    );
    await capture();
    const view = await page.evaluate(() => {
      const [map] = window.mapStats.active;
      const zoom = map.getZoom() + 1;
      map.jumpTo({ zoom });
      map.resize();
      return [map.getZoom(), zoom];
    });
    assert.equal(view[0], view[1]);
    await page.evaluate(() => document.querySelector("#toggle").click());
    await released();
    await page.evaluate(() => document.querySelector("#toggle").click());
    await capture();
    await page.evaluate(() => scrollTo(0, 0));
    await released();
    await page.locator("#slot").scrollIntoViewIfNeeded();
    await capture();
    await visibility(page, true);
    await released();
    await visibility(page, false);
    await capture();

    // Remove immediately after scheduling native resize and repaint.
    await page.evaluate(() => {
      const [map] = window.mapStats.active;
      map.resize();
      map.triggerRepaint();
      window.setMounted(false);
    });
    await released();
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const counts = await page.evaluate(() => ({
      captures: window.vectorEvidence.length, created: window.mapStats.created, removed: window.mapStats.removed,
    }));
    assert.equal(counts.captures, 4);
    assert.equal(counts.created, counts.removed);
    assert.deepEqual(fixture.errors, []);
  } finally {
    await fixture.close();
  }
});
