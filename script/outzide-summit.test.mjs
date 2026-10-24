import test from 'node:test';
import assert from 'node:assert/strict';
import {SUMMITS,opacityAt,addSummitSweep} from '../client/public/outzide-map/assets/summit-sweep.js';
import {shade,brightenOutzideTerrain} from '../client/public/outzide-map/assets/outzide-night-palette.js';
test('every summit has a unique id and a believable elevation',()=>{
 assert.equal(new Set(SUMMITS.map(s=>s.id)).size,SUMMITS.length);
 for(const s of SUMMITS){assert.ok(s.ft>7000&&s.ft<15000,s.id);assert.ok(s.lat>41&&s.lat<49.1&&s.lng<-120&&s.lng>-125)}
});
test('the pass lights lines at the head and fades them behind it',()=>{
 const e=opacityAt(10000,3000);
 assert.equal(e[0],'case');
 assert.ok(Array.isArray(e[1])&&e[1][0]==='<');
});
test('each summit adds a thick contour layer limited to its own mountain',()=>{
 const style={layers:[{id:'elevation-contours',source:'contours','source-layer':'contours'}]};
 addSummitSweep(style);
 assert.equal(style.layers.length,SUMMITS.length+1);
 for(const layer of style.layers.slice(1)){assert.equal(layer.filter[0],'within');assert.ok(layer.paint['line-width'][4]>=2)}
});
test('three shades darker keeps the hue and lowers lightness by about half',()=>{
 const light=h=>{const [r,g,b]=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);return (Math.max(r,g,b)+Math.min(r,g,b))/2};
 for(const hex of ['#123d16','#1c491b','#255c20','#39FF14']){
  const d=shade(hex);assert.ok(light(d)<light(hex)*0.55&&light(d)>light(hex)*0.47,hex);
  assert.ok(parseInt(d.slice(3,5),16)>=parseInt(d.slice(1,3),16),'still green '+hex);
 }
});
test('the landscape fills use the darker greens',()=>{
 const layers=['ground','land-relief','forest-landcover','forest-landuse','leaf-landcover','leaf-landuse','park-areas','developed-earth','water','streets'].map(id=>({id,paint:{}}));
 brightenOutzideTerrain({layers});
 assert.equal(layers.find(l=>l.id==='forest-landcover').paint['fill-color'],shade('#123d16'));
 assert.equal(layers.find(l=>l.id==='park-areas').paint['fill-color'],shade('#255c20'));
});
