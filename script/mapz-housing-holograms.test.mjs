import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import test from 'node:test';
import {HOUSING_EVENT_HEIGHT_RATIO,HOUSING_HOLOGRAM_LABELS,HOUSING_HOLOGRAM_MODELS,HOUSING_ICON_SCALE,HOUSING_ROTATION_SPEED,parseHousingHologramGlb} from '../client/public/zaydar-map/housing-holograms.js';
import {standaloneDemoRows} from '../client/public/zaydar-map/standalone-demo.js';

const modelFiles={
  rent:new URL('../client/public/zaydar-map/models/housing/rent.glb',import.meta.url),
  'forming-hauz':new URL('../client/public/zaydar-map/models/housing/forming-hauz.glb',import.meta.url),
  'hous-purple':new URL('../client/public/zaydar-map/models/housing/hous-purple.glb',import.meta.url),
};

function arrayBuffer(buffer){return buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength);}
function glbJson(buffer){const length=buffer.readUInt32LE(12);return JSON.parse(buffer.toString('utf8',20,20+length).replace(/\0+$/,''));}

test('HAÜZ holograms use aggressively simplified local meshes',async()=>{
  for(const [id,url] of Object.entries(modelFiles)){
    const buffer=await readFile(url),definition=Object.values(HOUSING_HOLOGRAM_MODELS).find(model=>model.id===id);
    const parsed=parseHousingHologramGlb(arrayBuffer(buffer),definition.height);
    assert.equal(parsed.count,37500,`${id} triangle vertices`);
    assert.ok(Math.abs(parsed.height-definition.height)<1e-9);
    assert.ok((await stat(url)).size<500_000,`${id} stays below 500 KB`);
  }
});

test('the managed-property house is purple in the asset and renderer mapping',async()=>{
  const buffer=await readFile(modelFiles['hous-purple']),json=glbJson(buffer);
  assert.deepEqual(json.materials[0].pbrMetallicRoughness.baseColorFactor.map(value=>Math.round(value*1000)/1000),[.533,0,1,.58]);
  assert.equal(HOUSING_HOLOGRAM_MODELS.MANAGED.id,'hous-purple');
});

test('standalone demo includes the four seeded HAÜZ listing roles at neighborhood anchors',()=>{
  const rows=standaloneDemoRows().filter(row=>row.kind==='housing');
  assert.deepEqual(rows.map(row=>row.housingModel).sort(),['FORMING','LOOKING','MANAGED','OFFERING']);
  assert.ok(rows.every(row=>row.demoOpen&&row.neighborhoodLabel&&row.coordinates.every(Number.isFinite)));
  assert.equal(rows.find(row=>row.housingModel==='MANAGED').color,'#8800FF');
});

test('HAÜZ projection keeps a readable event-relative envelope at every camera distance',async()=>{
  const {housingScreenFit,housingIconSize,createHousingHologramLayer}=await import('../client/public/zaydar-map/housing-holograms.js');
  const bounds={min:[-40,-10,0],max:[40,10,80]},viewport={width:1000,height:800};
  for(const distance of [.01,1,100,10000])for(const scale of [.08,.3,1,1.65]){
    const matrix=[1,0,0,0,0,.5,0,0,0,1,1,0,0,0,0,distance];
    const size=housingIconSize(scale),fit=housingScreenFit(matrix,bounds,viewport,size);
    const width=80/distance*viewport.width/2*fit.fit,height=90/distance*viewport.height/2*fit.fit;
    assert.ok(width<=size.width+1e-8&&height<=size.height+1e-8);
    assert.ok(Math.abs(width-size.width)<1e-8||Math.abs(height-size.height)<1e-8);
    assert.ok(width<78.75*scale&&height<66.15*scale);
  }
  const layer=createHousingHologramLayer({});
  layer.map={getZoom:()=>0,project:()=>({x:50,y:50}),getCanvas:()=>({clientWidth:100,clientHeight:100})};
  assert.equal(layer.visible({demoOpen:true,coordinates:[0,0]}),true);
  assert.equal(layer.visible({demoOpen:false,key:'closed',coordinates:[0,0]}),false);
});
