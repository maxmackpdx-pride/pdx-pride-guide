import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const [host,fallback,page,html,renderer,server,routes]=await Promise.all([
 readFile(new URL('../client/src/components/ZaydarCanvas.tsx',import.meta.url),'utf8'),
 readFile(new URL('../client/src/components/ZaydarFallback.tsx',import.meta.url),'utf8'),
 readFile(new URL('../client/src/pages/ZaydarMapDemo.tsx',import.meta.url),'utf8'),
 readFile(new URL('../client/public/zaydar-map/index.html',import.meta.url),'utf8'),
 readFile(new URL('../client/public/zaydar-map/river-flight.js',import.meta.url),'utf8'),
 readFile(new URL('../server/mapzTiles.ts',import.meta.url),'utf8'),
 readFile(new URL('../server/routes.ts',import.meta.url),'utf8'),
]);

test('3D browser traffic uses same-origin Mapz tile routes',()=>{
 assert.match(renderer,/\/api\/mapz\/vector-tiles\/\{z\}\/\{x\}\/\{y\}\.pbf/);
 assert.match(renderer,/\/api\/mapz\/terrain-tiles\/\{z\}\/\{x\}\/\{y\}\.webp/);
 assert.match(renderer,/\/api\/mapz\/fonts\/\{fontstack\}\/\{range\}\.pbf/);
 assert.doesNotMatch(renderer,/https:\/\/tiles\.(?:openfreemap|mapterhorn)\.com/);
 assert.doesNotMatch(renderer,/https:\/\/tiles\.openfreemap\.org/);
 assert.doesNotMatch(html,/preconnect[^>]+(?:openfreemap|mapterhorn)/);
});

test('server registers constrained OpenFreeMap and terrain proxies',()=>{
 assert.match(server,/tiles\.openfreemap\.org/);
 assert.match(server,/tiles\.mapterhorn\.com/);
 assert.match(server,/tileIndex/);
 assert.match(server,/AbortSignal\.timeout/);
 assert.match(routes,/registerMapzTileRoutes\(app\)/);
});

test('terrain is optional and cannot block the base vector map',()=>{
 const initialStyle=renderer.slice(renderer.indexOf('const vectorStyle='),renderer.indexOf('applyMoonlight(vectorStyle)'));
 assert.match(initialStyle,/id:'skyline'/);
 assert.doesNotMatch(initialStyle,/elevation|terrain-shade|setTerrain/);
 assert.match(renderer,/function installTerrain\(\)/);
 assert.match(renderer,/window\.setTimeout\(\(\)=>\{if\(!disposed\)installSceneExtras\(\);\},0\)/);
});

test('3D recovery waits for a rendered city frame and preserves the actual error',()=>{
 assert.match(host,/event\.data\.type==='first-frame'/);
 assert.match(host,/MAX_3D_ATTEMPTS=3/);
 assert.match(host,/phase==='loading'\?25000:60000/);
 assert.match(host,/Restarting 3D/);
 assert.match(host,/event\.data\.message/);
 assert.doesNotMatch(host,/type==='booted'/);
 assert.match(renderer,/tell\('first-frame'\)/);
 assert.match(renderer,/queryRenderedFeatures\(\{layers:\['streets','water','skyline'\]\}\)/);
 assert.match(renderer,/ready&&baseFrameRendered&&!firstFrameSent/);
 assert.doesNotMatch(renderer,/webglProbe/);
});

test('3D base frame does not wait for optional waypoint assets',()=>{
 assert.match(renderer,/const ready=loaded;/);
 assert.match(renderer,/const overlaysReady=loaded&&assetsReady;/);
 assert.match(renderer,/classList\.toggle\('scene-ready',loaded\)/);
 assert.match(renderer,/if\(overlaysReady\)drawLights\(visibility\)/);
});

test('2D is retained but disconnected from both the map host and toggle',()=>{
 assert.doesNotMatch(host,/ZaydarFallback|onRendererChange|failTo2D|lazy\(|Suspense/);
 assert.doesNotMatch(page,/ZaydarFallback|setRenderer|Switch to.*2D/);
 assert.match(host,/<Zaydar3D key=\{generation\}/);
 assert.match(fallback,/preferCanvas/);
 assert.match(host,/>Retry 3D<\/button>/);
});
