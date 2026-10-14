import test from 'node:test';
import assert from 'node:assert/strict';
import {groupBoardPins,pinMaterial} from '../client/public/mapz-map/board-pins.js';
import {mizzedNotificationActive} from '../client/public/mapz-map/venue-attachments.js';
const item=(key,x,y,venue)=>({feature:{properties:{key,venueWaypointKey:venue}},p:{x,y}});
test('overlapping board families share one pin, distant posts remain separate',()=>{
 const groups=groupBoardPins([item('gigz:1',100,100),item('giftz:2',102,102),item('mizzed:3',500,500)]);
 assert.deepEqual(groups.map(g=>g.items.length).sort(),[1,2]);
 assert.equal(groupBoardPins([item('mizzed:1',100,100,'p-1'),item('mizzed:2',180,100,'p-1')]).length,1);
});
test('pin material clocks vary and reduced motion has no flicker',()=>{
 const timelines=Array.from({length:20},(_,i)=>Array.from({length:80},(_,t)=>Number(pinMaterial(`gigz:${i}`,t/4).wire)).join(''));
 assert.ok(new Set(timelines).size>15);
 for(let t=0;t<20;t++){assert.equal(pinMaterial('gigz:1',t,true).wire,false);assert.equal(pinMaterial('gigz:1',t,true).jitter,0);}
});
test('board pins honor their own expiry instead of the legacy eight-day branch lifetime',()=>{
 const now=Date.parse('2026-10-14T00:00:00Z'),row={boardPin:true,waypointFamily:'mizzed',createdAt:'2026-10-01T00:00:00Z',expiresAt:'2026-10-15T00:00:00Z'};
 assert.equal(mizzedNotificationActive(row,now),true);assert.equal(mizzedNotificationActive(row,Date.parse(row.expiresAt)),false);
 assert.equal(mizzedNotificationActive({...row,expiresAt:null},now),false);
});
