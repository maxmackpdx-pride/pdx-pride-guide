import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import test from 'node:test';
import {HOUSING_EVENT_HEIGHT_RATIO,HOUSING_HOLOGRAM_MODELS,HOUSING_ICON_SCALE,HOUSING_ROTATION_SPEED,parseHousingHologramGlb} from '../client/public/zaydar-map/housing-holograms.js';
import {standaloneDemoRows} from '../client/public/zaydar-map/standalone-demo.js';

const modelFiles={
  rent:new URL('../client/public/zaydar-map/models/housing/rent.glb',import.meta.url),
  'forming-hauz':new URL('../client/public/zaydar-map/models/housing/forming-hauz.glb',import.meta.url),
  'hous-purple':new URL('../client/public/zaydar-map/models/housing/hous-purple.glb',import.meta.url),
};

function arrayBuffer(buffer){return buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength);}
function glbJson(buffer){const length=buffer.readUInt32LE(12);return JSON.parse(buffer.toString('utf8',20,20+length).replace(/\0+$/,''));}

test('HOUS holograms use aggressively simplified local meshes',async()=>{
  for(const [id,url] of Object.entries(modelFiles)){
    const buffer=await readFile(url),definition=Object.values(HOUSING_HOLOGRAM_MODELS).find(model=>model.id===id);
    const parsed=parseHousingHologramGlb(arrayBuffer(buffer),definition.height);
    assert.equal(parsed.count,37500,`${id} triangle vertices`);
    assert.ok(Math.abs(parsed.height-definition.height)<1e-9);
    assert.ok((await stat(url)).size<500_000,`${id} stays below 500 KB`);
  }
});

test('HOUS icons are smaller, rotate slowly, and use a short zoom-responsive beam',async()=>{
  const renderer=await readFile(new URL('../client/public/zaydar-map/river-flight.js',import.meta.url),'utf8');
  const layer=await readFile(new URL('../client/public/zaydar-map/housing-holograms.js',import.meta.url),'utf8');
  assert.equal(HOUSING_ICON_SCALE,.6);
  assert.equal(HOUSING_EVENT_HEIGHT_RATIO,1/3);
  assert.ok(HOUSING_ROTATION_SPEED>0&&HOUSING_ROTATION_SPEED<.1);
  assert.match(renderer,/HOUSING_EVENT_HEIGHT_RATIO\*smoothRange\(13\.75,14\.75,target\.getZoom\(\)\)/);
  assert.match(renderer,/feature\.properties\.housingModel\?\.5:1/);
  assert.match(layer,/seconds\*HOUSING_ROTATION_SPEED/);
  assert.match(layer,/u_screen_shift/);
});

test('the managed-property house is purple in the asset and renderer mapping',async()=>{
  const buffer=await readFile(modelFiles['hous-purple']),json=glbJson(buffer);
  assert.deepEqual(json.materials[0].pbrMetallicRoughness.baseColorFactor.map(value=>Math.round(value*1000)/1000),[.533,0,1,.58]);
  assert.equal(HOUSING_HOLOGRAM_MODELS.MANAGED.id,'hous-purple');
});

test('standalone demo includes the four seeded HOUS listing roles at neighborhood anchors',()=>{
  const rows=standaloneDemoRows().filter(row=>row.kind==='housing');
  assert.deepEqual(rows.map(row=>row.housingModel).sort(),['FORMING','LOOKING','MANAGED','OFFERING']);
  assert.ok(rows.every(row=>row.demoOpen&&row.neighborhoodLabel&&row.coordinates.every(Number.isFinite)));
  assert.equal(rows.find(row=>row.housingModel==='MANAGED').color,'#8800FF');
});

test('HOUS is isolated from the existing Eventz, Placez, and sparkle pipelines',async()=>{
  const renderer=await readFile(new URL('../client/public/zaydar-map/river-flight.js',import.meta.url),'utf8');
  const layer=await readFile(new URL('../client/public/zaydar-map/housing-holograms.js',import.meta.url),'utf8');
  assert.match(renderer,/map\.addLayer\(housingHolograms\)/);
  assert.match(renderer,/map\.addLayer\(citySparkles\)/);
  assert.match(renderer,/kind==='event'/);
  assert.match(renderer,/clusterPlaceMarkers/);
  assert.match(layer,/float scan=/);
  assert.match(layer,/float snow=/);
  assert.match(layer,/float alpha=\(\.42/);
  assert.match(layer,/gl\.disable\(gl\.DEPTH_TEST\)/);
});
