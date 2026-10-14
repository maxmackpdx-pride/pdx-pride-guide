import test from 'node:test';
import assert from 'node:assert/strict';
import {artworkDuration,advanceArtwork} from '../client/public/mapz-map/event-card-artwork.js';
import {eventCountdown} from '../client/public/mapz-map/event-countdown.js';
test('each face has the requested duration and independently advances',()=>{
 assert.equal(artworkDuration('info',()=>0),6);assert.equal(artworkDuration('info',()=>1),8);
 assert.equal(artworkDuration('poster'),5);assert.equal(artworkDuration('logo',()=>0),4);assert.equal(artworkDuration('logo',()=>1),7);
 const a={face:'info',next:6},b={face:'info',next:8};
 assert.equal(advanceArtwork(a,6,true,false,()=>0),'poster');assert.equal(advanceArtwork(b,6,true),'info');
 assert.equal(advanceArtwork(a,11,true,false,()=>0),'logo');assert.equal(advanceArtwork(a,15,true,false,()=>0),'info');
 assert.equal(advanceArtwork(a,22,false,false,()=>0),'logo');assert.equal(advanceArtwork(a,23,true,true),'info');
});
test('seconds count down across minute boundary and end at Live',()=>{
 assert.equal(eventCountdown(61000,0,true),'IN 1M 1S');assert.equal(eventCountdown(61000,1000,true),'IN 1M 0S');
 assert.equal(eventCountdown(61000,2000,true),'IN 0M 59S');assert.equal(eventCountdown(61000,61000,true),'STARTED');
});
