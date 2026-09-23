import test from 'node:test';
import assert from 'node:assert/strict';
import {visibleHologramLabels} from '../client/public/zaydar-map/label-visibility.js';
const label = (key,x,y) => ({key,x,y,width:70,scale:1,logoY:y-30,logoWidth:40,logoHeight:30,opacity:1});
test('selected event wins when titles collide regardless of input order',()=>{
  const labels=[label('other',200,200),label('selected',210,200)];
  assert.deepEqual(visibleHologramLabels(labels,'selected',390,760).map(x=>x.key),['selected']);
});
test('hide titles intersecting another logo, offscreen titles and transparent labels',()=>{
  const hidden=label('behind',200,200), logo=label('logo',200,230), offscreen=label('edge',0,100), faded={...label('faded',100,400),opacity:0};
  assert.deepEqual(visibleHologramLabels([hidden,logo,offscreen,faded],null,390,760).map(x=>x.key),['logo']);
});
test('separated titles remain visible without mutating source data',()=>{
  const labels=[label('a',100,100),label('b',300,300)];
  assert.equal(visibleHologramLabels(labels,null,390,760).length,2);
  assert.equal(labels[0].key,'a');
});
