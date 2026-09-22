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

test('HAÜZ icons are smaller, rotate slowly, and use a short zoom-responsive beam',async()=>{
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

test('standalone demo includes the four seeded HAÜZ listing roles at neighborhood anchors',()=>{
  const rows=standaloneDemoRows().filter(row=>row.kind==='housing');
  assert.deepEqual(rows.map(row=>row.housingModel).sort(),['FORMING','LOOKING','MANAGED','OFFERING']);
  assert.ok(rows.every(row=>row.demoOpen&&row.neighborhoodLabel&&row.coordinates.every(Number.isFinite)));
  assert.equal(rows.find(row=>row.housingModel==='MANAGED').color,'#8800FF');
});

test('HAÜZ labels use the event-title fitter beneath each icon',async()=>{
  const renderer=await readFile(new URL('../client/public/zaydar-map/river-flight.js',import.meta.url),'utf8');
  const labelComponent=await readFile(new URL('../client/src/components/ZaydarEventLabel.tsx',import.meta.url),'utf8');
  assert.deepEqual(HOUSING_HOLOGRAM_LABELS,{
    LOOKING:'LOOKING TO RENT',
    FORMING:'BUILDING A HAÜZ',
    OFFERING:'JOIN OUR HAÜZ',
    MANAGED:'COMMERCIAL RENTAL HAÜZ',
  });
  assert.match(renderer,/name:housingName,time:'',color/);
  assert.match(renderer,/kind:'housing'/);
  assert.match(renderer,/width:hologramLabelWidth\*1\.4,scale:beaconScale/);
  assert.match(renderer,/y:hologramCenterY\+housingIconHeight\/2\+3\*beaconScale/);
  assert.match(labelComponent,/const isHousing=label\.kind==='housing'/);
  assert.match(labelComponent,/!isHousing&&<DigitalClock time=\{label\.time\}/);
  assert.match(labelComponent,/className="zaydar-event-title"/);
  assert.match(labelComponent,/solveDynamicText\(isHousing\?twoLineTitle\(label\.name\):label\.name,240/);
});

test('HAÜZ is isolated from the existing Eventz, Placez, and sparkle pipelines',async()=>{
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

test('HAÜZ titles are 40% larger, use exactly two rows, and faces stay fixed on the rotating icon',async()=>{
  const renderer=await readFile(new URL('../client/public/zaydar-map/river-flight.js',import.meta.url),'utf8');
  const labelComponent=await readFile(new URL('../client/src/components/ZaydarEventLabel.tsx',import.meta.url),'utf8');
  assert.match(renderer,/width:hologramLabelWidth\*1\.4/);
  assert.match(renderer,/labelRows\(label\.name,label\.width,label\.kind==='housing'\?2:undefined\)/);
  assert.match(renderer,/stack\.style\.left=`\$\{label\.x\}px`/);
  assert.match(renderer,/stack\.style\.top=`\$\{label\.logoY\}px`/);
  assert.match(renderer,/--face-scale/);
  assert.doesNotMatch(renderer,/label\.logoY-label\.y/);
  assert.match(labelComponent,/twoLineTitle\(label\.name\)/);
  assert.match(labelComponent,/left:label\.x,top:label\.logoY/);
});
