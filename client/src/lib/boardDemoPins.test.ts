import test from 'node:test';
import assert from 'node:assert/strict';
import {boardDemoPoint} from './boardDemoPins';
import {mizzedNotificationActive} from '../../public/mapz-map/venue-attachments.js';
test('only explicit demo posts receive synthetic map locations',()=>{
 for(const world of ['mizzed','gigz','giftz','sellz']) {
  assert.equal(boardDemoPoint({id:10},world),null);
  assert.equal(boardDemoPoint({id:10,isDemo:'true'},world),null);
  const point=boardDemoPoint({id:10,isDemo:true},world)!;
  assert.ok(point.lat>45.5&&point.lat<45.55&&point.lng>-122.7&&point.lng<-122.6);
  assert.deepEqual(point,boardDemoPoint({id:10,isDemo:true},world));
 }
 assert.equal(boardDemoPoint({id:10,isDemo:true},'places'),null);
});
test('demo pins survive without a placement expiry while real pins still expire',()=>{
 assert.equal(mizzedNotificationActive({boardPin:true,demoPin:true}),true);
 assert.equal(mizzedNotificationActive({boardPin:true}),false);
 assert.equal(mizzedNotificationActive({boardPin:true,expiresAt:'2020-01-01'}),false);
});
