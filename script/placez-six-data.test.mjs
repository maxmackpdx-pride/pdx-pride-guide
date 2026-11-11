import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const bundle=await build({entryPoints:[path.join(root,'client/src/components/placez/nativeDataModel.ts')],bundle:true,platform:'node',format:'esm',write:false,alias:{'@shared':path.join(root,'shared')}});
const {nativePlacezData,nearbyPlacezRestaurants}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
test('live native data supplies countdown, calendar and both active counts',()=>{
 const now=Date.now(),future=new Date(now+3600000).toISOString();const place={id:30,name:'Holocene',type:'venue',upcomingEvents:[{id:1,title:'Upcoming test',dateStart:future}],gigs:[{id:10}],spotted:[{id:20},{id:21}]};
 const result=nativePlacezData(place,now,'https://www.zaylist.com',now);assert.equal(result.nextEvent.title,'Upcoming test');assert.equal(result.calendarFeed.events.length,1);assert.equal(result.activity.gigzCount,1);assert.equal(result.activity.mizzedConnectionsCount,2);assert.equal(result.nextEvent.venueId,30);assert.equal(result.nextEvent.checkedAt,new Date(now).toISOString());
 const missing=nativePlacezData({id:30,name:'Holocene',type:'venue'},0,'https://www.zaylist.com',now);assert.equal(missing.calendarFeed,undefined);assert.equal(missing.activity.gigzCount,null);
 const empty=nativePlacezData({...place,gigs:[],spotted:[],upcomingEvents:[]},now,'https://www.zaylist.com',now);assert.equal(empty.activity.gigzCount,0);assert.equal(empty.nextEvent,undefined);assert.deepEqual(empty.calendarFeed.events,[]);
});
test('canonical Pacific parser handles wall time and excludes invalid or preview events',()=>{
 const now=Date.parse('2030-11-10T00:00:00Z');
 const r=nativePlacezData({id:30,name:'Holocene',type:'venue',upcomingEvents:[{id:1,title:'Pacific',dateStart:'2030-11-11T20:00:00'},{id:2,title:'Invalid',dateStart:'bad'},{id:3,title:'Preview',dateStart:'2030-11-11T20:00:00',previewExample:true}]},Date.now(),'https://www.zaylist.com',now);assert.equal(r.calendarFeed.events.length,1);assert.equal(r.calendarFeed.events[0].startsAt,'2030-11-12T04:00:00.000Z');
});
test('nearby restaurants derive from current directory and real shared coordinates',()=>{
 const place={id:30,name:'Holocene',type:'venue',lat:45.52,lng:-122.67};const rows=[{id:23,name:'Pizza Thief',type:'restaurant',queerFriendly:true,address:'Test',lat:45.521,lng:-122.671},{id:24,name:'Far',type:'restaurant',queerFriendly:true,address:'Far',lat:46,lng:-123},{id:25,name:'Closed',type:'restaurant',status:'CLOSED',queerFriendly:true,address:'Test',lat:45.52,lng:-122.67}];const nearby=nearbyPlacezRestaurants(place,rows);assert.equal(nearby.length,1);assert.equal(nearby[0].id,23);assert.ok(nearby[0].href.startsWith('/directory/23/'));assert.ok(nearby[0].distanceMiles<3);
});

test('shared clock rolls countdown from A to B without a data refetch',()=>{
 const checked=Date.parse('2030-11-11T20:00:00Z');
 const place={id:30,name:'Holocene',type:'venue',upcomingEvents:[{id:1,title:'Event A',dateStart:new Date(checked+60000).toISOString()},{id:2,title:'Event B',dateStart:new Date(checked+180000).toISOString()}]};
 const select=now=>nativePlacezData(place,checked,'https://www.zaylist.com',now);
 assert.equal(select(checked).nextEvent.title,'Event A');
 assert.equal(select(checked+60000).nextEvent.title,'Event B');
 assert.equal(select(checked+180000).nextEvent,undefined);
 // A frozen preview time is explicit and reproducible regardless of wall clock.
 assert.equal(select(checked).nextEvent.title,'Event A');
 assert.equal(select(checked+60000).calendarFeed.checkedAt,new Date(checked).toISOString());
});
