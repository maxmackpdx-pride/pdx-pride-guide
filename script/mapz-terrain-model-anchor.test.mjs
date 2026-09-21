import test from 'node:test';
import assert from 'node:assert/strict';
import {createPortlandLandmarkLayer} from '../client/public/zaydar-map/portland-landmarks.js';

test('landmark elevation translates its base without scaling or tilting its model',()=>{
  let elevation=0;const matrices=[];
  const gl=new Proxy({uniformMatrix4fv:(_location,_transpose,value)=>matrices.push([...value]),isEnabled:()=>false,getParameter:()=>0},{get:(target,key)=>target[key]??(()=>{})});
  const maplibre={MercatorCoordinate:{fromLngLat:()=>({x:3,y:4,meterInMercatorCoordinateUnits:()=>.01})}};
  const layer=createPortlandLandmarkLayer(maplibre,()=>elevation,{matches:true},[{id:'fixture',center:[-122.67,45.53],scale:3,bearing:20,baseOffset:22}]);
  layer.models[0].count=3;
  layer.map={getZoom:()=>18,project:()=>({x:100,y:100}),getCanvas:()=>({clientWidth:600,clientHeight:600})};
  const input={defaultProjectionData:{mainMatrix:[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}};
  layer.render(gl,input);elevation=70;layer.render(gl,input);
  assert.equal(matrices.length,2);
  assert.deepEqual(matrices[0].slice(0,12),matrices[1].slice(0,12));
  assert.deepEqual(matrices[0].slice(12,14),matrices[1].slice(12,14));
  assert.ok(Math.abs(matrices[0][14]-.22)<1e-6);
  assert.ok(Math.abs(matrices[1][14]-.92)<1e-6);
});
