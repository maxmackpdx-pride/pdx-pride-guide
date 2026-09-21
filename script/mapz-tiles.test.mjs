import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const [host,fallback,page,html,renderer,home,routes,app]=await Promise.all([
 readFile(new URL('../client/src/components/ZaydarCanvas.tsx',import.meta.url),'utf8'),
 readFile(new URL('../client/src/components/ZaydarFallback.tsx',import.meta.url),'utf8'),
 readFile(new URL('../client/src/pages/ZaydarMapDemo.tsx',import.meta.url),'utf8'),
 readFile(new URL('../client/public/zaydar-map/index.html',import.meta.url),'utf8'),
 readFile(new URL('../client/public/zaydar-map/river-flight.js',import.meta.url),'utf8'),
 readFile(new URL('../client/public/home-flight/river-flight.js',import.meta.url),'utf8'),
 readFile(new URL('../server/routes.ts',import.meta.url),'utf8'),
 readFile(new URL('../client/src/App.tsx',import.meta.url),'utf8'),
]);

test('Mapz and the home flyover share the same natural surface renderer',()=>{
 assert.match(renderer,/mapzSurfaceStyle/);
 assert.match(renderer,/mlcontour\.DemSource/);
 assert.match(html,/maplibre-contour-0\.1\.0\.js/);
 assert.match(home,/import \{mapzSurfaceStyle,createWaterBloom\} from '\.\.\/zaydar-map\/natural-surfaces\.js/);
 assert.match(home,/mlcontour\.DemSource/);
 assert.doesNotMatch(renderer,/api\/mapz|deck-mobile/);
 assert.doesNotMatch(routes,/registerMapzTileRoutes/);
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

test('the public demo route loads Mapz directly while the main route keeps its gate',()=>{
 assert.match(app,/<Route path="\/map-demo" component=\{ZaydarMapDemo\} \/>/);
 assert.match(app,/<Route path="\/map" component=\{\(\) => <SignedInLivingMap \/>\} \/>/);
});
