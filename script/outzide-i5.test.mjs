import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spectrumColor,interstatePieces,addI5Spectrum} from '../client/public/outzide-map/assets/i5-spectrum.js';
const data=JSON.parse(await readFile(new URL('../client/public/outzide-map/interstates-route.json',import.meta.url),'utf8'));
const refs=new Set(data.features.map(f=>f.properties.ref));
test('the line carries I-5 and the other major PNW interstates',()=>{
 for(const ref of ['I-5','I-84','I-82','I-90','I-205','I-405'])assert.ok(refs.has(ref),ref);
 for(const feature of data.features)assert.equal(feature.geometry.type,'LineString');
});
test('color runs dark orange to Zaylist orange to dark orange and is the same wherever roads meet',()=>{
 assert.equal(spectrumColor(0,0),'rgb(154,58,10)');
 assert.equal(spectrumColor(1.5,0),'rgb(255,102,0)');
 assert.equal(spectrumColor(3,0),'rgb(154,58,10)');
 assert.equal(spectrumColor(45.5,-122.7),spectrumColor(45.5,-122.7));
});
test('every piece is a short line with a color',()=>{
 const pieces=interstatePieces(data);
 assert.ok(pieces.features.length>0);
 for(const piece of pieces.features){assert.ok(piece.geometry.coordinates.length>=2);assert.match(piece.properties.c,/^rgb\(\d+,\d+,\d+\)$/)}
});
test('neon stays under labels, keeps the i5-spectrum layer ids, and fades at street zoom',()=>{
 const style={sources:{},layers:[{id:'land',type:'fill'},{id:'labels',type:'symbol'}]};
 addI5Spectrum(style,data);
 assert.equal(style.layers.at(-1).id,'labels');
 assert.deepEqual(style.layers.slice(1,-1).map(l=>l.id),['i5-spectrum-0-bloom','i5-spectrum-0-halo','i5-spectrum-0-core']);
 for(const layer of style.layers.slice(1,-1)){
  assert.equal(layer.maxzoom,13);
  assert.equal(layer.paint['line-opacity'].at(-1),0);
 }
 const core=style.layers.find(l=>l.id.endsWith('core'));assert.ok(core.paint['line-width'][4]<=2.4);
});
