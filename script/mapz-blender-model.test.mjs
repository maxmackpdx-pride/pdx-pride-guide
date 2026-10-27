import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {blenderStageWeights,E3_BLENDER_STAGES} from '../client/public/mapz-map/e3-blender-model.js';

const binary=await readFile(new URL('../client/public/mapz-map/models/holograms/e3-blender-morph.glb',import.meta.url));
const json=JSON.parse(binary.subarray(20,20+binary.readUInt32LE(12)).toString());
test('the Blender export has real geometry, five stage morphs and independent hover controls',()=>{
 assert.equal(binary.readUInt32LE(0),0x46546c67);
 assert.equal(binary.readUInt32LE(4),2);
 assert.equal(binary.readUInt32LE(8),binary.length);
 assert.ok(binary.length<600_000,'the shared model stays small enough for the map');
 assert.equal(json.images,undefined,'no video frames or render textures replace the mesh');
 const outline=json.meshes.find(mesh=>mesh.name.startsWith('Shared outline'));
 assert.deepEqual(outline.extras.targetNames.slice(0,5),['Full waypoint','Compressed','Logo coin','Single vortex','Double stack']);
 assert.equal(outline.extras.targetNames.filter(name=>name.includes('hover')).length,6);
 assert.ok(json.nodes.some(node=>node.extras?.mapzRole==='icon'));
 assert.ok(json.nodes.some(node=>node.extras?.mapzRole==='beam'));
 assert.ok(json.nodes.some(node=>node.extras?.mapzRole==='ring-fill'));
 const panel=json.meshes.find(mesh=>mesh.name.startsWith('Shared dark'));
 assert.ok(panel.primitives[0].attributes.TEXCOORD_0!==undefined,'real event artwork can map onto the 3D panel');
});
test('pose weights interpolate a single shared mesh instead of overlapping whole models',()=>{
 assert.equal(E3_BLENDER_STAGES.length,6);
 assert.deepEqual(blenderStageWeights(0),[0,0,0,0,0]);
 assert.deepEqual(blenderStageWeights(1),[1,0,0,0,0]);
 assert.deepEqual(blenderStageWeights(4),[0,0,0,1,0]);
 assert.deepEqual(blenderStageWeights(4.5),[0,0,0,.5,.5]);
 assert.deepEqual(blenderStageWeights(5),[0,0,0,0,1]);
 for(let stage=0;stage<=5;stage+=.025){
  const weights=blenderStageWeights(stage);
  assert.ok(weights.every(value=>value>=0&&value<=1));
  assert.ok(weights.reduce((sum,value)=>sum+value,0)<=1+1e-12);
  assert.ok(weights.filter(value=>value>0).length<=2);
 }
});
