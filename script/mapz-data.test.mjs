import {attachVenueRows} from '../client/public/zaydar-map/venue-attachments.js';
import {eventNight} from '../client/public/zaydar-map/event-night.js';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
const renderer=await readFile(new URL('../client/public/zaydar-map/river-flight.js',import.meta.url),'utf8');
const source=renderer.slice(renderer.indexOf('async function setListings(rows)'),renderer.indexOf("window.addEventListener('message',event=>",renderer.indexOf('async function setListings(rows)')));
test('live waypoint updates preserve coordinates and remove filtered-out pins',async()=>{
 const context=vm.createContext({Map,Set,Intl,Date,Promise,setTimeout,console,
  attachVenueRows,eventNight,dataGeneration:0,typeIcons:new Map(),baseColors:['#00FFFF'],adultVenueColor:'#FF0000',ensureLightSprite(){},paletteKey:'',hologramMaterials:{dispose(){}},createHologramMaterials:()=>({dispose(){}}),housingHolograms:{update(){}},worldWaypoints:{update(){}},selectedKey:null,viewTime:Date.parse('2026-09-20T18:00:00-07:00'),phases:new Map(),sequence:0,waypointHeightScale:()=>1,createSpatialIndex:()=>()=>[],surfaceCache:new WeakMap(),map:{getCenter:()=>({lng:-122.676,lat:45.523})},assetsReady:false,lightFeatures:[],nearbyLights:null,refreshNearbyLights(){},updateSceneStatus(){},scheduleFrame(){},loadVenueLogo:async()=>{},disposed:false,
 });
 vm.runInContext(source,context);
 context.rows=[{key:'venue-1',coordinates:[-122.676,45.523],color:'#00FFFF'},{key:'event-1',coordinates:[-122.65,45.51],color:'#FF00CC'}];
 await vm.runInContext('setListings(rows)',context);
 assert.deepEqual(JSON.parse(JSON.stringify(context.lightFeatures.map(f=>f.geometry.coordinates))),[[-122.676,45.523],[-122.65,45.51]]);
 context.rows=context.rows.slice(1);await vm.runInContext('setListings(rows)',context);
 assert.equal(context.lightFeatures.length,1);assert.equal(context.lightFeatures[0].properties.key,'event-1');
 context.rows=[];await vm.runInContext('setListings(rows)',context);assert.equal(context.lightFeatures.length,0);
});
