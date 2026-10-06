import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const renderer=readFileSync(new URL('../client/public/mapz-map/river-flight.js',import.meta.url),'utf8');
const sparkles=readFileSync(new URL('../client/public/home-flight/roof-sparkles.js',import.meta.url),'utf8');
const surfaces=readFileSync(new URL('../client/public/mapz-map/natural-surfaces.js',import.meta.url),'utf8');
const outz=readFileSync(new URL('../client/public/outzide-map/app.js',import.meta.url),'utf8');
const palette=readFileSync(new URL('../client/public/outzide-map/assets/outzide-night-palette.js',import.meta.url),'utf8');

test('Mapz keeps holograms, landmarks, waypoint height, building chrome, and zoom sparkles',()=>{
 assert.match(renderer,/createHologramMaterials/);
 assert.match(renderer,/drawProjectionBeam/);
 assert.match(renderer,/createPortlandLandmarkLayer/);
 assert.match(renderer,/createBuildingChrome/);
 assert.match(renderer,/drawWaypointHead/);
 assert.match(renderer,/function waypointHeightScale/);
 assert.match(renderer,/heightScale:waypointHeightScale/);
 assert.match(renderer,/CITY_SPARKLE_MAX_ZOOM/);
 assert.match(renderer,/createCitySparkles/);
 assert.match(renderer,/overview\?1:5/);
 assert.match(sparkles,/export const CITY_SPARKLE_MAX_ZOOM=16/);
 assert.match(surfaces,/hillshade-shadow-color':'#07110d'/);
 assert.match(surfaces,/hillshade-highlight-color':'#53675d'/);
 assert.doesNotMatch(renderer,/new maplibregl\.Marker\(/);
});

test('Outzide recolors the same surface and keeps its own holograms',()=>{
 assert.match(outz,/brightenOutzideTerrain\(mapzSurfaceStyle/);
 assert.match(outz,/tiles\.mapterhorn\.com/);
 assert.match(outz,/function drawHolograms/);
 assert.match(outz,/drawProjectionBeam/);
 assert.match(palette,/export function brightenOutzideTerrain/);
 assert.doesNotMatch(outz,/tiles\.openfreemap\.org\/styles\/(?!dark)/);
});
