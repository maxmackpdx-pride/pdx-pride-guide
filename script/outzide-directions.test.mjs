import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {directionsFor} from '../client/public/outzide-map/assets/directions.js';
const root=new URL('../client/public/outzide-map/',import.meta.url);
const {places}=JSON.parse(fs.readFileSync(new URL('places.json',root)));
test('every mapped destination offers both providers at the exact catalog coordinates',()=>{
 for(const p of places.filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lng))){const links=directionsFor(p),google=new URL(links.google),apple=new URL(links.apple),coords=`${p.lat},${p.lng}`;assert.equal(google.searchParams.get('api'),'1');assert.equal(google.searchParams.get(links.mapOnly?'query':'destination'),coords,p.name);assert.equal(apple.searchParams.get(links.mapOnly?'ll':'daddr'),coords,p.name);assert.equal(apple.hostname,'maps.apple.com');}
});
test('river-only island never creates a false road directions link',()=>{
 const p=places.find(p=>p.id==='glass-bar-island');const links=directionsFor(p);assert.equal(links.mapOnly,true);assert.equal(new URL(links.apple).searchParams.has('daddr'),false);assert.equal(new URL(links.google).pathname,'/maps/search/');
});
test('reject invalid or swapped coordinates',()=>{for(const p of [{lat:NaN,lng:3},{lat:-122,lng:45},{lat:45,lng:181}])assert.throws(()=>directionsFor(p));});
test('Snow Lake uses Washington trailhead and connected Washington geometry',()=>{
 const p=places.find(p=>p.id==='route-8569148'),routes=JSON.parse(fs.readFileSync(new URL('routes.json',root))).features.filter(f=>p.routeIds.includes(f.id));assert.equal(p.lat,47.44565);assert.equal(p.lng,-121.42365);assert.equal(routes.length,3);for(const f of routes)for(const [lng,lat] of f.geometry.coordinates){assert.ok(lng>-121.5&&lng<-121.4);assert.ok(lat>47.4&&lat<47.5);}
});
test('only marker artwork is scaled; MapLibre owns geographic translation',()=>{
 const css=fs.readFileSync(new URL('style.css',root),'utf8'),app=fs.readFileSync(new URL('app.js',root),'utf8');assert.ok(css.includes('.waypoint-icon{scale:none}'));assert.match(css,/\.waypoint-visuals\{[^}]*transform:scale\(1\.1\)/);assert.ok(app.includes("subpixelPositioning:true"));assert.ok(app.includes('visuals.append(...el.childNodes)'));assert.ok(app.includes('.setLngLat([p.lng,p.lat])'));
});

test('private residential community remains unlocated without published coordinates',()=>{const p=places.find(p=>p.id==='we-moon-land');assert.equal(p.lat,undefined);assert.equal(p.lng,undefined);assert.ok(p.accessNote.includes('private'));});
