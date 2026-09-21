import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mapzSurfaceStyle,forestPattern,FOREST_COLORS,inwardDistances} from '../client/public/zaydar-map/natural-surfaces.js';
import {vectorStyle} from '../client/public/home-flight/city-map.js';
const require=createRequire(import.meta.url),mapRequire=createRequire(require.resolve('maplibre-gl'));
const {validateStyleMin}=mapRequire('@maplibre/maplibre-gl-style-spec');
test('terrain and forest style validates, keeps building color and isolates home styling',()=>{
 const before=JSON.stringify(vectorStyle),style=mapzSurfaceStyle();
 assert.deepEqual(validateStyleMin(style).map(e=>e.message),[]);
 assert.equal(style.sources.elevation.encoding,'terrarium');
 assert.equal(style.terrain.exaggeration,1);
 const skyline=style.layers.find(l=>l.id==='skyline');
 assert.equal(skyline.paint['fill-extrusion-color'],vectorStyle.layers.find(l=>l.id==='skyline').paint['fill-extrusion-color']);
 assert.equal(skyline.paint['fill-extrusion-opacity'],1);
 assert.equal(JSON.stringify(vectorStyle),before);
});
test('forest texture uses exactly the requested three tones and stays deterministic',()=>{
 const image=forestPattern(),colors=new Set();
 for(let i=0;i<image.data.length;i+=4){colors.add('#'+[...image.data.slice(i,i+3)].map(c=>c.toString(16).padStart(2,'0')).join(''));assert.equal(image.data[i+3],255);}
 assert.deepEqual([...colors].sort(),[...FOREST_COLORS].sort());
 assert.deepEqual(image.data,forestPattern().data);
});
test('water glow stays inside water and decays from shore toward the center',()=>{
 const size=11,mask=new Uint8Array(size*size);
 for(let y=1;y<10;y++)for(let x=1;x<10;x++)mask[y*size+x]=1;
 const d=inwardDistances(mask,size,size);
 assert.equal(d[0],0);assert.equal(d[5*size+1],1);assert.equal(d[5*size+5],5);
 const alpha=i=>mask[i]?Math.exp(-d[i]/4):0;
 assert.equal(alpha(0),0);assert.ok(alpha(5*size+1)>alpha(5*size+5));
 // An island is land: no glow inside it, with an inward water edge beside it.
 mask[5*size+5]=0;const island=inwardDistances(mask,size,size);
 assert.equal(island[5*size+5],0);assert.equal(island[5*size+4],1);
});

test('ground and water are opaque and cyan is 25 percent darker',()=>{
 const style=mapzSurfaceStyle(),layer=id=>style.layers.find(l=>l.id===id);
 assert.equal(style.layers[0].id,'ground');
 assert.equal(layer('ground').paint['background-opacity'],1);
 assert.equal(layer('water').paint['fill-opacity'],1);
 assert.equal(layer('banks').paint['line-color'],'#00bfbf');
 assert.deepEqual(layer('streets').filter.slice(-2),[
  ['!=',['get','brunnel'],'tunnel'],['>=',['coalesce',['get','layer'],0],0]
 ]);
});
