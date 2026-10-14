import test from 'node:test';
import assert from 'node:assert/strict';
import {eventCountdown} from '../client/public/mapz-map/event-countdown.js';
import {visibleHologramLabels} from '../client/public/mapz-map/label-visibility.js';
const start=Date.parse('2026-10-13T21:30:00-07:00');
test('event countdown rounds up and follows the displayed map clock',()=>{
 assert.equal(eventCountdown(start,start-1),'IN 1 MIN');
 assert.equal(eventCountdown(start,start-12*60000),'IN 12 MIN');
 assert.equal(eventCountdown(start,start-60*60000),'IN 1H');
 assert.equal(eventCountdown(start,start-72*60000),'IN 1H 12M');
 assert.equal(eventCountdown(start,start-25*3600000),'IN 1D 1H');
 assert.equal(eventCountdown(start,start),'STARTED');
 assert.equal(eventCountdown(start,start+3600000),'STARTED');
 assert.equal(eventCountdown(undefined,start),'');
 assert.equal(eventCountdown(NaN,start),'');
 assert.equal(eventCountdown('2026-10-13T21:30',start),'');
});
test('countdown footprint protects text below the time from neighboring titles',()=>{
 const base={width:62,scale:1,logoWidth:0,logoHeight:0,logoY:0,opacity:1,x:150};
 const first={...base,key:'first',y:100,countdown:'IN 12 MIN'};
 const second={...base,key:'second',y:164};
 assert.deepEqual(visibleHologramLabels([first,second],'first',400,400).map(x=>x.key),['first']);
 assert.equal(visibleHologramLabels([{...first,countdown:''},second],'first',400,400).length,2);
});
