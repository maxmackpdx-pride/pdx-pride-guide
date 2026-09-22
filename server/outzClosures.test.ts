import test from 'node:test';import assert from 'node:assert/strict';
import {closureState,matchStatuses,sourceId} from './outzClosures';
const place={id:'test',name:'Test Campground',officialUrl:'https://www.fs.usda.gov/recarea/test/?recid=123'};
const feature=(name:string,status:string)=>({attributes:{recareaid:123,recareaname:name,openstatus:status}});
test('only explicit whole-site statuses change the closure state',()=>{
 assert.equal(closureState('closed'),'closed');assert.equal(closureState('temporarily closed'),'closed');assert.equal(closureState('seasonally closed'),'seasonal');assert.equal(closureState('open'),'open');for(const s of ['EXISTING','none','2 lifts closed','partially closed',undefined])assert.equal(closureState(s),'unknown');
});
test('incorrect identities and conflicting records never report a closure',()=>{
 assert.deepEqual(matchStatuses([place],[feature('Different Campground','closed')],'2026-09-22'),[]);
 assert.equal(matchStatuses([place],[feature(place.name,'closed'),feature(place.name,'open')],'2026-09-22')[0].status,'unknown');
 assert.equal(sourceId({...place,officialUrl:'https://example.com/?recid=123'}),null);
});
test('a later open report replaces a closure without waiting for a season date',()=>{
 assert.equal(matchStatuses([place],[feature(place.name,'closed')],'2026-09-22')[0].status,'closed');
 assert.equal(matchStatuses([place],[feature(place.name,'open')],'2026-09-23')[0].status,'open');
});
test('client expires stale data and clears the indicator on verified reopening',async()=>{
 const originalFetch=globalThis.fetch,originalNow=Date.now;let now=Date.parse('2026-09-22T20:00:00Z'),status='closed';
 Date.now=()=>now;globalThis.fetch=async()=>new Response(JSON.stringify({checkedAt:new Date(now).toISOString(),statuses:[{placeId:'test',status,checkedAt:new Date(now).toISOString()}]}));
 try{const client=await import('../client/public/outzide-map/assets/closures.js');await client.refreshClosures();assert.equal(client.isClosed('test'),true);status='open';await client.refreshClosures();assert.equal(client.closureFor('test')?.status,'open');assert.equal(client.isClosed('test'),false);now+=16*60_000;assert.equal(client.closureFor('test'),null);}finally{globalThis.fetch=originalFetch;Date.now=originalNow;}
});
