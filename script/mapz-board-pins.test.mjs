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
test('spatial grouping preserves first-match behavior for dense pins and mixed venue anchors',()=>{
 const reference=(items,radius=30)=>{const groups=[];for(const item of [...items].sort((a,b)=>String(a.feature.properties.key).localeCompare(String(b.feature.properties.key)))){const venue=item.feature.properties.venueWaypointKey;const group=groups.find(g=>venue&&g.venue===venue||Math.hypot(g.x-item.p.x,g.y-item.p.y)<radius);if(group)group.items.push(item);else groups.push({x:item.p.x,y:item.p.y,venue,items:[item]});}return groups;};
 let seed=197;const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
 const items=Array.from({length:2000},(_,i)=>item(`pin-${i}`,random()*1600-800,random()*1000-500,i%7===0?`venue-${i%13}`:undefined));
 assert.deepEqual(groupBoardPins(items),reference(items));
});
test('drawing reuses paths across frames instead of reparsing every pin',async()=>{
 const {drawBoardPin}=await import('../client/public/mapz-map/board-pins.js');const original=globalThis.Path2D;let paths=0;
 globalThis.Path2D=class{constructor(){paths++;}};
 const context=new Proxy({}, {get:(_,key)=>key==='createLinearGradient'?()=>({addColorStop(){}}):()=>{},set:()=>true});
 try{drawBoardPin(context,0,0,'cyan','first',0);const initial=paths;assert.ok(initial>0);for(let i=0;i<100;i++)drawBoardPin(context,0,0,'cyan',`pin-${i}`,i/3,false,2);assert.equal(paths,initial);}finally{if(original)globalThis.Path2D=original;else delete globalThis.Path2D;}
});
