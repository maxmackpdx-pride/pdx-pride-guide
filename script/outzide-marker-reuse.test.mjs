import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {clusterWaypoints} from '../client/public/outzide-map/assets/waypoint-clusters.js';

const app=readFileSync(new URL('../client/public/outzide-map/app.js',import.meta.url),'utf8');
const fn=app.slice(app.indexOf('function renderMarkers()'),app.indexOf('\n// Mizzed branches'));

function harness(places){
 let constructed=0,added=0,removed=0,draws=0;
 const markers=[];
 class Marker{
  constructor(options){this.options=options;this.place=null;this.stamp='';constructed++;}
  setLngLat(value){this.lngLat=value;return this;}
  addTo(){added++;return this;}
  remove(){removed++;}
  getElement(){return this.options.element;}
 }
 function createElement(){
  return {
   className:'',title:'',dataset:{},innerHTML:'',attrs:{},childNodes:[],
   setAttribute(key,value){this.attrs[key]=value;},
   getAttribute(key){return this.attrs[key]??null;},
   insertAdjacentHTML(_where,html){this.innerHTML+=html;},
   querySelector(){return {insertAdjacentHTML(_where,html){this.innerHTML+=html;},remove(){}};},
   append(...nodes){this.childNodes.push(...nodes);},
  };
 }
 const context={
  markers,clusterWaypoints,places,
  filtered:()=>places,
  map:{project:([lng,lat])=>({x:lng*100,y:lat*100}),getZoom:()=>12},
  state:{selected:null},
  matchMedia:()=>({matches:false}),
  document:{createElement},
  kinds:{trail:'Trail',beach:'Beach',mixed:'Mixed'},
  icon:kind=>`<svg data-kind="${kind}"></svg>`,
  waypointAccent:()=>'var(--neon-orange)',
  waypointColor:()=>'#ff7900',
  esc:value=>value,
  uiIcon:()=>'',
  mapCheckins:new Map(),
  activeWinterEvents:()=>[],
  isClosed:()=>false,
  closureFor:()=>null,
  winterOpeningLabel:()=>'',
  closureLabel:()=>'',
  prohibitionIcon:'',
  waypointAccess:{run(fn){fn();}},
  stillMotion:()=>true,
  selectPlace(){},
  maplibregl:{Marker,LngLatBounds:class{extend(){}},},
  drawHolograms(){draws++;},
 };
 vm.createContext(context);
 vm.runInContext(fn+'\nrenderMarkers();',context);
 return {context,counts:()=>({constructed,added,removed,draws,live:context.markers.length})};
}

test('unchanged Outzide waypoints keep their marker nodes',()=>{
 const places=[
  {id:'a',name:'Alpha Trail',kind:'trail',lat:45,lng:-122,special:false},
  {id:'b',name:'Beta Beach',kind:'beach',lat:46.2,lng:-121,special:false},
 ];
 const {context,counts}=harness(places);
 const first=counts();
 assert.equal(first.live,2);
 assert.equal(first.constructed,2);
 assert.equal(first.added,2);
 assert.equal(first.removed,0);
 assert.equal(first.draws,1);
 const kept=context.markers.map(marker=>marker.options.element);
 vm.runInContext('renderMarkers();',context);
 const second=counts();
 assert.equal(second.constructed,2);
 assert.equal(second.added,2);
 assert.equal(second.removed,0);
 assert.deepEqual(context.markers.map(marker=>marker.options.element),kept);
 for(const marker of context.markers){
  assert.match(marker.options.element.className,/waypoint-icon/);
  assert.match(marker.options.element.innerHTML,/waypoint-head/);
 }
});

test('selection changes only the marker whose artwork changed',()=>{
 const places=[
  {id:'a',name:'Alpha Trail',kind:'trail',lat:45,lng:-122,special:false},
  {id:'b',name:'Beta Beach',kind:'beach',lat:46.2,lng:-121,special:false},
 ];
 const {context,counts}=harness(places);
 context.state.selected={id:'a'};
 vm.runInContext('renderMarkers();',context);
 const after=counts();
 assert.equal(after.constructed,3);
 assert.equal(after.removed,1);
 assert.equal(context.markers.length,2);
 assert.equal(context.markers.filter(marker=>marker.options.element.className.includes('selected')).length,1);
});
