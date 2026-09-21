import test from 'node:test';
import assert from 'node:assert/strict';
import {bridgeNetwork,bridgeMesh,deckHeight} from '../client/public/home-flight/bridge-roads.js';
const road=coordinates=>({type:'Feature',properties:{brunnel:'bridge',class:'primary'},geometry:{type:'LineString',coordinates}});
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
test('a subdivided deck samples only approaches and ignores the valley floor',()=>{
  const sampled=[];
  const graph=bridgeNetwork([road([[0,0],[10,0],[30,0],[100,0]])],p=>p,p=>{sampled.push(p);return p[0]===0?20:p[0]===100?40:-80;});
  assert.deepEqual(sampled,[[0,0],[100,0]]);
  graph.nodes.forEach(n=>near(n.baseline,20+n.x*.2));
  const mesh=bridgeMesh(graph,true);
  for(let i=2;i<mesh.length;i+=5)assert.ok(mesh[i]>=19.6);
});
test('branched approaches share one continuous junction elevation',()=>{
  const graph=bridgeNetwork([road([[0,0],[100,0],[200,0]]),road([[100,0],[100,100]])],p=>p,p=>p[0]===0?10:p[0]===200?30:50);
  const junction=graph.nodes.find(n=>n.x===100&&n.y===0);
  assert.equal(junction.edges.length,3);near(junction.baseline,30);
});
test('tile fragments and duplicate segments produce the same baseline',()=>{
  const sample=p=>p[0]/10+10;
  const whole=bridgeNetwork([road([[0,0],[200,0]])],p=>p,sample);
  const split=bridgeNetwork([road([[0,0],[100,0]]),road([[100,0],[200,0]]),road([[0,0],[200,0]])],p=>p,sample);
  assert.equal(split.edges.length,2);
  split.nodes.forEach(n=>near(n.baseline,sample(n.coordinate)));
  near(whole.nodes[0].baseline,split.nodes[0].baseline);
});
test('closed elevated loop remains finite without sampling every ground vertex',()=>{
  let samples=0;
  const graph=bridgeNetwork([road([[0,0],[100,0],[100,100],[0,100],[0,0]])],p=>p,()=>{samples++;return 12;});
  assert.equal(samples,1);graph.nodes.forEach(n=>near(n.baseline,12));
});
const levelRoad=(coordinates,layer,ramp=0)=>({...road(coordinates),properties:{...road(coordinates).properties,layer,ramp}});
test('stacked freeway crossings do not merge at a common map coordinate',()=>{
  const graph=bridgeNetwork([levelRoad([[-300,0],[0,0],[300,0]],1),levelRoad([[0,-300],[0,0],[0,300]],3)],p=>p,()=>0);
  const crossing=graph.nodes.filter(n=>n.x===0&&n.y===0);
  assert.equal(crossing.length,2);assert.deepEqual(crossing.map(n=>n.edges.length),[2,2]);
  near(deckHeight(crossing[1].distance,true,3)-deckHeight(crossing[0].distance,true,1),12);
});
test('an explicit ramp joins the upper road without a duplicate junction',()=>{
  const graph=bridgeNetwork([levelRoad([[0,0],[100,0]],1,1),levelRoad([[100,-100],[100,0],[100,100]],2)],p=>p,()=>10);
  const junction=graph.nodes.filter(n=>n.x===100&&n.y===0);
  assert.equal(junction.length,1);assert.equal(junction[0].edges.length,3);assert.equal(junction[0].layer,2);
  near(junction[0].baseline,10);
});
test('a straight shared bridge endpoint survives an untagged layer change',()=>{
  const graph=bridgeNetwork([
    levelRoad([[-300,0],[0,0]],1),
    levelRoad([[0,0],[300,0]],2),
  ],p=>p,()=>10);
  assert.equal(graph.nodes.filter(node=>Math.hypot(node.x,node.y)<.01).length,1);
  assert.equal(graph.edges.length,2);
  assert.equal(graph.nodes.find(node=>Math.hypot(node.x,node.y)<.01).edges.length,2);
});
test('overlaid different-level tile fragments remain separate',()=>{
  const graph=bridgeNetwork([levelRoad([[0,0],[200,0]],1),levelRoad([[0,0],[100,0],[200,0]],2)],p=>p);
  assert.equal(graph.edges.length,3);
  assert.equal(graph.nodes.filter(n=>n.x===0).length,2);
});
