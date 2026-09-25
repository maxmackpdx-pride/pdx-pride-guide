import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {drawProjectionBeam} from '../client/public/outzide-map/assets/hologram-materials.js';
const app=readFileSync(new URL('../client/public/outzide-map/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../client/public/outzide-map/assets/waypoint-tokens.css',import.meta.url),'utf8');
const places=JSON.parse(readFileSync(new URL('../client/public/outzide-map/places.json',import.meta.url))).places;
const colors=Object.fromEntries([...css.matchAll(/(--[\w-]+):\s*(#[0-9a-f]{6})/gi)].map(m=>[m[1],m[2]]));

test('every waypoint token and mixed cluster can draw without missing canvas textures',()=>{
 let draws=0;
 const context={
  places,materials:null,markers:[],
  document:{documentElement:{},body:{classList:{contains:()=>false}},hidden:false},
  getComputedStyle:()=>({getPropertyValue:name=>colors[name]||''}),
  createHologramMaterials:values=>({beams:new Map(values.map(c=>[c,{color:c}])),orbs:new Map(values.map(c=>[c,{color:c}]))}),
  map:{getContainer:()=>({clientWidth:390,clientHeight:700,getBoundingClientRect:()=>({left:0,top:0})}),getZoom:()=>7},
  canvas:{width:390,height:700},mobileLightMode:true,state:{selected:null},
  matchMedia:()=>({matches:true}),fireVisible:false,steamFrame:null,
  performance:{now:()=>1000},clearTimeout:()=>{},isClosed:()=>false,
  groundDiskScale:()=>1,drawProjectionBeam,
  drawWinterSnow:()=>{},drawCoastalHologram:()=>{},drawGroundRipples:()=>{},
  springSteam:{draw:(_ctx,texture)=>assert.ok(texture,'spring texture')},
  ctx:{setTransform(){},clearRect(){},save(){},restore(){},transform(){},drawImage(texture){assert.ok(texture,'Canvas drawImage requires a texture');draws++}},
 };
 vm.createContext(context);
 vm.runInContext(app.slice(app.indexOf('const waypointToken='),app.indexOf('function renderMarkers')),context);
 vm.runInContext(app.match(/materials=createHologramMaterials\([^;]+;/)[0],context);
 const kinds=vm.runInContext('Object.keys(waypointToken)',context);
 for(const kind of kinds){
  context.markers=[{place:{id:kind,kind,lat:45,lng:-122,accent:vm.runInContext(`waypointColor('${kind}')`,context)},getElement:()=>({getBoundingClientRect:()=>({left:100,top:100,width:40,height:40}),style:{setProperty(){}},classList:{toggle(){}},querySelector:()=>null})}];
  assert.doesNotThrow(()=>vm.runInContext(app.slice(app.indexOf('function drawHolograms'),app.indexOf('function clearRoutes'))+';drawHolograms()',context),kind);
 }
 assert.ok(draws>=kinds.length);
});
