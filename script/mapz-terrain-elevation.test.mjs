import test from 'node:test';
import assert from 'node:assert/strict';
import {createTerrainSampler, approachBaseline} from '../client/public/zaydar-map/terrain-elevation.js';

test('shared anchors scale raw DEM once and avoid per-frame resampling', () => {
  let reads = 0;
  const terrain = createTerrainSampler(() => { reads++; return 200; });
  for (let frame = 0; frame < 1800; frame++) assert.equal(terrain.sample([-122.7, 45.5]).height, 70);
  assert.equal(reads, 1);
  assert.equal(terrain.sample({lng:-122.7, lat:45.5}).height, 70);
  assert.equal(reads, 1);
});
test('missing DEM retains last known elevation and newly available tiles refresh explicitly', () => {
  let raw = null;
  const terrain = createTerrainSampler(() => raw);
  assert.deepEqual(terrain.sample([0,0]), {revision:0, height:0, available:false});
  raw = 100; terrain.invalidate();
  assert.equal(terrain.sample([0,0]).height, 35);
  raw = null; terrain.invalidate();
  assert.equal(terrain.sample([0,0]).height, 35);
  raw = NaN; terrain.invalidate();
  assert.equal(terrain.sample([0,0]).height, 35);
});
test('terrain cache is bounded and preserves recently used anchors', () => {
  let reads = 0;
  const terrain = createTerrainSampler(() => { reads++; return 10; }, {capacity:2});
  terrain.sample([0,0]); terrain.sample([1,0]); terrain.sample([0,0]); terrain.sample([2,0]);
  assert.equal(terrain.size, 2);
  terrain.sample([0,0]); assert.equal(reads,3);
  terrain.sample([1,0]); assert.equal(reads,4);
});
test('deck baseline meets both approaches without dropping to river elevation', () => {
  assert.equal(approachBaseline(30,40,0),30);
  assert.equal(approachBaseline(30,40,1),40);
  for(let i=0;i<=100;i++) assert.equal(approachBaseline(30,40,i/100),30+i/10);
  assert.equal(approachBaseline(30,40,-1),30);
  assert.equal(approachBaseline(30,40,2),40);
});
test('exaggeration is rejected', () => {
  assert.throws(() => createTerrainSampler(() => 0, {strength:1.1}), RangeError);
});
