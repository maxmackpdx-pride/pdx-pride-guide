import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {eventNight} from '../client/public/zaydar-map/event-night.js';
import {attachVenueRows,mizzedNotificationActive,extensionGeometry,MIZZED_NOTIFICATION_LIFETIME,TONIGHT_HEIGHT_MULTIPLIER} from '../client/public/zaydar-map/venue-attachments.js';

test('night identity changes at 2am Portland, including DST and year boundaries',()=>{
 for(const [time,day] of [
  ['2026-09-26T01:59:59-07:00','2026-09-25'],['2026-09-26T02:00:00-07:00','2026-09-26'],
  ['2026-01-01T01:00:00-08:00','2025-12-31'],['2026-03-08T03:00:00-07:00','2026-03-08'],
  ['2026-11-01T01:59:00-07:00','2026-10-31'],['2026-11-01T01:59:00-08:00','2026-10-31'],['2026-11-01T02:00:00-08:00','2026-11-01']
 ])assert.equal(eventNight(time),day);
 assert.equal(eventNight('invalid'),'');assert.equal(TONIGHT_HEIGHT_MULTIPLIER,1.2);
});
test('events and Mizzed share the exact venue waypoint, without merging neighboring venues',()=>{
 const venue={key:'directory-4',coordinates:[-122.677,45.523],name:'Badlands'};
 const rows=[{key:'p-4',kind:'place',logoKey:venue.key,coordinates:venue.coordinates},{key:'e1',kind:'event',coordinates:[0,0],venueAnchor:venue},{key:'m1',waypointFamily:'mizzed',coordinates:[1,1],venueAnchor:venue}];
 const result=attachVenueRows(rows);assert.equal(result.length,3);
 for(const row of result.slice(1)){assert.equal(row.venueWaypointKey,'p-4');assert.deepEqual(row.coordinates,venue.coordinates);}
 assert.deepEqual(rows[1].coordinates,[0,0]);
 const hiddenPlaces=attachVenueRows(rows.slice(1));assert.equal(hiddenPlaces.length,3);assert.equal(hiddenPlaces[2].attachmentOnly,true);
});
test('Mizzed signs expire exactly eight days after posting and respect earlier closure',()=>{
 const created=Date.parse('2026-09-25T21:00:00Z'),row={waypointFamily:'mizzed',createdAt:new Date(created).toISOString(),status:'ACTIVE'};
 assert.equal(mizzedNotificationActive(row,created+MIZZED_NOTIFICATION_LIFETIME-1),true);
 assert.equal(mizzedNotificationActive(row,created+MIZZED_NOTIFICATION_LIFETIME),false);
 assert.equal(mizzedNotificationActive({...row,status:'ARCHIVED'},created),false);
 assert.equal(mizzedNotificationActive({...row,closesAt:new Date(created+100).toISOString()},created+100),false);
 assert.equal(mizzedNotificationActive({...row,createdAt:''},created),false);
 const parent={x:200,y:300,size:28};const a=extensionGeometry(parent),b=extensionGeometry(parent,1,true);
 assert.equal(a.y,parent.y);assert.ok(a.right<parent.x-parent.size/2);assert.ok(b.right<a.x-a.size/2);
});
test('dense same-venue holograms separate without moving down onto their waypoint',async()=>{
 const renderer=await readFile(new URL('../client/public/zaydar-map/river-flight.js',import.meta.url),'utf8');
 const context=vm.createContext({});vm.runInContext(renderer.slice(renderer.indexOf('function separateHolograms('),renderer.indexOf('function hologramVariation(')),context);
 const items=Array.from({length:12},(_,i)=>({x:190,y:300,p:{x:190,y:550},halfWidth:45,halfHeight:80,attention:.5,maxY:400}));
 context.items=items;vm.runInContext('separateHolograms(items,390,760)',context);
 for(let i=0;i<items.length;i++){assert.ok(items[i].y<=400);for(let j=0;j<i;j++)assert.ok(Math.abs(items[i].x-items[j].x)>=90||Math.abs(items[i].y-items[j].y)>=160);}
});
