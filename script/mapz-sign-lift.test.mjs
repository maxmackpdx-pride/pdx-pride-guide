import test from 'node:test';
import assert from 'node:assert/strict';
import {createSignLift,SIGN_LIFT_HOLD_MS} from '../client/public/mapz-map/screen-neighbors.js';

// A neighbor jittering across the 220 px edge while panning: distance 215..230 px each frame.
function run(frames,dt,distanceAt){
 const lift=createSignLift(),out=[];
 for(let i=0;i<frames;i++){const d=distanceAt(i);out.push(lift.step('a',d<220?1:0,d<275?1:0,50,i*dt*1000,dt));}
 return out;
}

test('sign lift does not flicker when a neighbor sits on the edge', () => {
 const out=run(180,1/60,i=>222.5+7.5*Math.sin(i*1.7));
 const flips=out.slice(1).filter((v,i)=>Math.abs(v-out[i])>5).length;
 assert.equal(flips,0);
 const ups=out.slice(1).filter((v,i)=>v<out[i]-.01).length;
 assert.equal(ups,0,'it rises once and never goes back and forth');
});

test('sign lift eases the same at 30 and 120 fps', () => {
 const a=run(30,1/30,i=>i<1?300:100),b=run(120,1/120,i=>i<4?300:100);
 assert.ok(Math.abs(a.at(-1)-b.at(-1))<1.5,`${a.at(-1)} vs ${b.at(-1)}`);
 assert.ok(a.at(-1)>0&&a.at(-1)<50,'still easing, no jump');
});

test('sign lift holds before switching and only drops past the exit radius', () => {
 const lift=createSignLift();
 lift.step('a',0,0,50,0,1/60);
 assert.equal(lift.step('a',1,1,50,SIGN_LIFT_HOLD_MS/2,1/60),0,'too soon to rise');
 let v=0;for(let t=SIGN_LIFT_HOLD_MS;t<SIGN_LIFT_HOLD_MS+4000;t+=16)v=lift.step('a',1,1,50,t,.016);
 assert.ok(v>49);
 for(let t=6000;t<10000;t+=16)v=lift.step('a',0,1,50,t,.016);
 assert.ok(v>49,'inside the exit band it stays up');
 for(let t=10000;t<14000;t+=16)v=lift.step('a',0,0,50,t,.016);
 assert.ok(v<1,'clearly apart, it settles back down');
});
