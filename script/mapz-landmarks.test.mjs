import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import test from 'node:test';
import {PORTLAND_LANDMARKS,PORTLAND_LANDMARK_MIN_ZOOM,parseLandmarkGlb} from '../client/public/zaydar-map/portland-landmarks.js';

const expected={
  'benson-bubbler':[1.17,1.17,1],
  'chinatown-friendship-gate':[19.9,3.84,11.324],
  'darcelle-plaza-rainbow-hydrants':[5.3,.755,1.09],
  'darcelle-xv-marquee':[4.68,.985,2.095],
  'harvey-milk-street-sign':[2.1,.245,2.985],
  'paul-bunyan-kenton':[3.5,2.818,8.84],
  'skidmore-fountain':[4.7,4.7,5.21],
  'weather-machine':[2.07,1.8,9.993],
  'white-stag-portland-sign':[12.537,3.299,14.617],
};
const arrayBuffer=buffer=>buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength);

test('all nine Portland landmarks keep true meter dimensions and lightweight local geometry',async()=>{
  assert.equal(PORTLAND_LANDMARKS.length,9);assert.equal(PORTLAND_LANDMARK_MIN_ZOOM,14);
  for(const landmark of PORTLAND_LANDMARKS){
    const url=new URL(`../client/public/zaydar-map/models/landmarks/${landmark.id}.glb`,import.meta.url),buffer=await readFile(url),parsed=parseLandmarkGlb(arrayBuffer(buffer),landmark.dimensions);
    assert.ok((await stat(url)).size<850_000,`${landmark.id} stays under 850 KB`);
    assert.ok(parsed.count<=24_000,`${landmark.id} stays under the triangle budget`);
    expected[landmark.id].forEach((value,index)=>assert.ok(Math.abs(parsed.dimensions[index]-value)<.08,`${landmark.id} dimension ${index}`));
    const colors=new Set();for(let index=0;index<parsed.vertices.length;index+=9)colors.add(parsed.vertices.slice(index+6,index+9).join(','));
    assert.ok(colors.size>=2,`${landmark.id} preserves recognizable neon material colors`);
  }
});

test('landmarks use requested scale, fixed GPS anchors, and the R2-D2 scan/static shader',async()=>{
  const welcome=PORTLAND_LANDMARKS.find(landmark=>landmark.id==='white-stag-portland-sign');
  assert.equal(welcome.scale,3);assert.deepEqual(welcome.center,[-122.67052,45.52339]);
  assert.ok(PORTLAND_LANDMARKS.filter(landmark=>landmark!==welcome).every(landmark=>landmark.scale===1.75&&landmark.center.every(Number.isFinite)));
  const layer=await readFile(new URL('../client/public/zaydar-map/portland-landmarks.js',import.meta.url),'utf8'),renderer=await readFile(new URL('../client/public/zaydar-map/river-flight.js',import.meta.url),'utf8');
  assert.match(layer,/float scan=/);assert.match(layer,/float snow=/);assert.match(layer,/float dropout=/);assert.match(layer,/depthMask\(false\)/);
  assert.match(renderer,/map\.addLayer\(portlandLandmarks\)/);
});
