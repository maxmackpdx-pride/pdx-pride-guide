import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {eventNight} from '../client/public/mapz-map/event-night.js';
import {attachVenueRows,mizzedNotificationActive,extensionGeometry,MIZZED_NOTIFICATION_LIFETIME,TONIGHT_HEIGHT_MULTIPLIER} from '../client/public/mapz-map/venue-attachments.js';

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
test('gigs posted at a place branch for eight days; gigs without a place stay',()=>{
 const created=Date.parse('2026-09-25T21:00:00Z'),row={waypointFamily:'gigz',createdAt:new Date(created).toISOString(),status:'LIVE',venueWaypointKey:'p-4'};
 assert.equal(mizzedNotificationActive(row,created+MIZZED_NOTIFICATION_LIFETIME-1),true);
 assert.equal(mizzedNotificationActive(row,created+MIZZED_NOTIFICATION_LIFETIME),false);
 const {venueWaypointKey,...loose}=row;
 assert.equal(mizzedNotificationActive(loose,created+MIZZED_NOTIFICATION_LIFETIME*4),true);
});
test('dense same-venue holograms separate without moving down onto their waypoint',async()=>{
 const renderer=await readFile(new URL('../client/public/mapz-map/river-flight.js',import.meta.url),'utf8');
 const context=vm.createContext({});vm.runInContext(renderer.slice(renderer.indexOf('function separateHolograms('),renderer.indexOf('function hologramVariation(')),context);
 const items=Array.from({length:12},(_,i)=>({x:190,y:300,p:{x:190,y:550},halfWidth:45,halfHeight:80,attention:.5,maxY:400}));
 context.items=items;vm.runInContext('separateHolograms(items,390,760)',context);
 for(let i=0;i<items.length;i++){assert.ok(items[i].y<=400);for(let j=0;j<i;j++)assert.ok(Math.abs(items[i].x-items[j].x)>=90||Math.abs(items[i].y-items[j].y)>=160);}
});

test('branches count down in days, step down after day four, and cap at three heads',async()=>{
 const {branchDaysLeft,branchStrength,branchSlot}=await import('../client/public/mapz-map/venue-attachments.js');
 const posted=Date.parse('2026-07-13T20:00:00Z'),row={createdAt:new Date(posted).toISOString()},day=86400000;
 assert.equal(branchDaysLeft(row,posted+1),8);
 assert.equal(branchDaysLeft(row,posted+2*day+1),6);
 assert.equal(branchDaysLeft(row,posted+8*day),0);
 assert.equal(branchStrength(row,posted+3*day),1);
 assert.equal(branchStrength(row,posted+4*day),1);
 assert.ok(branchStrength(row,posted+6*day)<1&&branchStrength(row,posted+6*day)>.55);
 assert.ok(Math.abs(branchStrength(row,posted+8*day)-.55)<1e-9);
 assert.deepEqual([0,1,2].map(i=>branchSlot(i,3).kind),['head','head','head']);
 assert.deepEqual(branchSlot(3,5),{kind:'chip',more:2});
 assert.deepEqual(branchSlot(3,4),{kind:'chip',more:1});
 assert.equal(branchSlot(4,5).kind,'hidden');
});
