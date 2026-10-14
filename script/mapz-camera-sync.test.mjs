import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile(new URL('../client/public/mapz-map/river-flight.js',import.meta.url),'utf8');
const handler=source.slice(source.indexOf('function renderSceneOverlays(){'),source.indexOf("map.on('render',renderSceneOverlays);")+"map.on('render',renderSceneOverlays);".length);
test('overlay paints the current map frame even between animation ticks and pauses when hidden',()=>{
 let now=100,camera=0;const painted=[],events=new Map();
 const state={disposed:false,mapActivity:{visible:true},loaded:true,assetsReady:true,overlayVisibility:1,lastOverlayFrame:0,overlayPending:false,motionDelta:0,pulseTime:0,reduced:{matches:false},firstPinsPainted:true,hitTargets:[],performance:{now:()=>now},map:{on:(name,fn)=>events.set(name,fn),isMoving:()=>true},drawLights:alpha=>painted.push({camera,alpha})};
 vm.runInNewContext(handler,state);
 for(let frame=0;frame<6;frame++){camera=frame*17;now+=1000/60;events.get('render')();}
 assert.deepEqual(painted.map(p=>p.camera),[0,17,34,51,68,85]);
 assert.ok(Math.abs(state.motionDelta-1/60)<1e-10);
 state.mapActivity.visible=false;events.get('render')();assert.equal(painted.length,6);
 state.mapActivity.visible=true;state.reduced.matches=true;const pulse=state.pulseTime;camera=120;events.get('render')();assert.equal(painted.at(-1).camera,120);assert.equal(state.pulseTime,pulse);
 state.map.isMoving=()=>false;events.get('render')();assert.equal(painted.length,7);
 state.overlayPending=true;events.get('render')();assert.equal(painted.length,8);
 events.get('render')();assert.equal(painted.length,8);
});
test('pushpins reset beam transform and opacity before drawing at their projected anchor',()=>{
 const start=source.indexOf('  if(pass===1)for(const group of boardPins){');
 const block=source.slice(start,source.indexOf('\n  for(const {feature,p,offset',start));
 const calls=[];
 vm.runInNewContext(block,{pass:1,boardPins:[{x:73,y:91,items:[{feature:{properties:{key:'board',color:'red'}}}]}],dpr:2,coreAlpha:1,lightsContext:{setTransform:(...args)=>calls.push(args),globalAlpha:.2},drawBoardPin:(ctx,x,y)=>{assert.equal(ctx.globalAlpha,1);calls.push([x,y]);return {};},pulseTime:0,reduced:{matches:false},waypointHeadSize:()=>31,target:{getZoom:()=>16},hitTargets:[]});
 assert.deepEqual(calls,[[2,0,0,2,0,0],[73,91]]);
});
