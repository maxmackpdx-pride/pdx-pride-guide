import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

// Regression guard for disappearing OutZide waypoints after graphics
// recovery. The lifecycle wrapper (map-foundation/lifecycle.js) recovers a
// lost WebGL context by replacing the whole style with setStyle(diff:false).
// MapLibre removes custom layers on a style swap and fires the layer's
// onRemove, which disposes the waypoint layer's scene and rows. The basemap
// and style images come back on their own; the waypoint layer only returns
// if app.js reinstalls it when the restored style loads.
//
// This runs the real ensureWaypointObjects() from app.js in a VM against a
// fake map with MapLibre's addLayer/style-swap semantics, plus a layer stub
// honoring the real layer contract (onAdd revives, onRemove disposes).

const app = await readFile(new URL('../client/public/outzide-map/app.js', import.meta.url), 'utf8');
const stateDecl = app.slice(app.indexOf('let waypointObjects=null'), app.indexOf('const objectKinds'));
let ensureSource = app.slice(app.indexOf('async function ensureWaypointObjects()'), app.indexOf('function renderMarkers()'));
ensureSource = ensureSource.replace("await import('../map-foundation/waypoint-objects.js')", 'await __waypointModule()');
assert.ok(stateDecl.includes('waypointObjects=null'), 'app.js waypoint state declaration located');
assert.ok(ensureSource.includes('__waypointModule()'), 'ensureWaypointObjects located and its import stubbed');

class FakeMap {
  constructor() { this.handlers = new Map(); this.layers = new Map(); this.added = 0; this.styleLoaded = true; }
  on(ev, fn) { const a = this.handlers.get(ev) || []; a.push(fn); this.handlers.set(ev, a); }
  once(ev, fn) { const wrap = (...x) => { this.off(ev, wrap); fn(...x); }; wrap.__orig = fn; this.on(ev, wrap); }
  off(ev, fn) { const a = this.handlers.get(ev) || []; this.handlers.set(ev, a.filter(f => f !== fn && f.__orig !== fn)); }
  fire(ev) { for (const fn of [...(this.handlers.get(ev) || [])]) fn(); }
  listenerCount(ev) { return (this.handlers.get(ev) || []).length; }
  isStyleLoaded() { return this.styleLoaded; }
  getLayer(id) { return this.layers.get(id); }
  addLayer(layer) {
    if (this.layers.has(layer.id)) throw new Error(`duplicate layer ${layer.id}`);
    this.added++; this.layers.set(layer.id, layer); layer.onAdd?.(this, {});
  }
  // What lifecycle.js recovery does to the map: setStyle drops every layer
  // (onRemove fires), then the restored style announces itself loaded.
  simulateStyleSwap() {
    for (const layer of [...this.layers.values()]) { layer.onRemove?.(this); this.layers.delete(layer.id); }
    this.fire('style.load');
  }
}

async function boot() {
  const map = new FakeMap();
  let syncCalls = 0, resolve, reject;
  const done = new Promise((res, rej) => { resolve = res; reject = rej; });
  const context = vm.createContext({
    map, maplibregl: {}, window: {}, mapActivity: {visible: true}, sceneDisposed: false, console,
    syncWaypointObjects: () => { syncCalls++; },
    __waypointModule: async () => ({createWaypointLayer: (_lib, opts) => ({
      id: opts.id, dead: true, rows: null,
      onAdd() { this.dead = false; }, onRemove() { this.dead = true; this.rows = null; },
      setRows(rows) { if (!this.dead) this.rows = rows; }, ready: () => false,
    })}),
    __resolve: resolve, __reject: reject,
  });
  vm.runInContext(stateDecl + ensureSource, context);
  vm.runInContext('ensureWaypointObjects().then(() => __resolve(), error => __reject(error))', context);
  await done;
  return {map, context, syncs: () => syncCalls};
}

test('waypoint layer returns after graphics-recovery style replacement', async () => {
  const {map} = await boot();
  const layer = map.getLayer('outzide-waypoint-objects');
  assert.ok(layer, 'waypoint layer installed at startup');
  assert.equal(layer.dead, false);
  assert.equal(map.added, 1);
  map.simulateStyleSwap();
  const restored = map.getLayer('outzide-waypoint-objects');
  assert.ok(restored, 'waypoint layer reinstalled when the restored style loads');
  assert.equal(restored, layer, 'the same layer object is re-added, not a replacement');
  assert.equal(restored.dead, false, 'reinstall revives the layer disposed by the style swap');
  assert.equal(map.added, 2);
});

test('repeated recovery never duplicates the layer or its listeners', async () => {
  const {map, context, syncs} = await boot();
  assert.equal(map.listenerCount('style.load'), 1, 'one recovery listener, registered once at creation');
  assert.equal(map.listenerCount('move'), 1);
  assert.equal(map.listenerCount('resize'), 1);
  const syncsAfterBoot = syncs();
  map.fire('style.load');
  assert.equal(map.added, 1, 'style.load with the layer present is a no-op');
  map.simulateStyleSwap();
  map.simulateStyleSwap();
  assert.equal(map.added, 3, 'each recovery reinstalls exactly once');
  assert.equal(map.layers.size, 1, 'still exactly one waypoint layer on the map');
  assert.ok(syncs() > syncsAfterBoot, 'each reinstall resyncs rows from the live markers');
  assert.equal(map.listenerCount('style.load'), 1, 'recovery does not stack listeners');
  vm.runInContext('ensureWaypointObjects().then(() => __resolve(), error => __reject(error))', context);
  await new Promise(res => setImmediate(res));
  assert.equal(map.added, 3, 'ensureWaypointObjects stays a no-op once the layer exists');
});
