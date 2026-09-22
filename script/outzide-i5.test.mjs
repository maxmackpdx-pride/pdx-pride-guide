import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spectrumGradient,spectrumColor,addI5Spectrum} from '../client/public/outzide-map/assets/i5-spectrum.js';
const data=JSON.parse(await readFile(new URL('../client/public/outzide-map/i5-route.json',import.meta.url),'utf8'));
test('all I-5 gradient stops have valid, strictly increasing map distances',()=>{
 for(const feature of data.features){
  assert.equal(feature.geometry.type,'LineString');
  const gradient=spectrumGradient(feature.geometry.coordinates);
  const stops=gradient.filter((_,i)=>i>=3&&i%2===1);
  assert.equal(stops[0],0);assert.equal(stops.at(-1),1);
  stops.forEach((stop,i)=>assert.ok(Number.isFinite(stop)&&(i===0||stop>stops[i-1])));
 }
});
test('joining and reversed road components keep the same geographic colors',()=>{
 const a=[-122.7,45.5],b=[-122.5,46],c=[-122.4,46.5];
 assert.equal(spectrumGradient([a,b]).at(-1),spectrumGradient([b,c])[4]);
 assert.equal(spectrumGradient([a,b]).at(-1),spectrumGradient([b,a])[4]);
 assert.equal(spectrumGradient([a,a]),spectrumColor(a[1]));
});
test('neon stays under labels, uses terrain geometry, and fades at street zoom',()=>{
 const style={sources:{},layers:[{id:'land',type:'fill'},{id:'labels',type:'symbol'}]};
 addI5Spectrum(style,data);
 assert.equal(style.layers.at(-1).id,'labels');
 for(const layer of style.layers.slice(1,-1)){
  assert.equal(style.sources[layer.source].lineMetrics,true);
  assert.equal(layer.maxzoom,13);
  assert.equal(layer.paint['line-opacity'].at(-1),0);
 }
});
test('northern quarter blends trans colors continuously and preserves the southern rainbow',()=>{
 const latitude=p=>41.25+p*(49.01-41.25);
 assert.equal(spectrumColor(latitude(0)),'rgb(255,22,22)');
 assert.equal(spectrumColor(latitude(1)),'rgb(66,220,255)');
 assert.equal(spectrumColor(latitude(.895)),'rgb(245,253,255)');
 const channels=p=>spectrumColor(latitude(p)).match(/\d+/g).map(Number);
 for(const stop of [.75,.79,.84,.895,.95]){
  const before=channels(stop-.000001),after=channels(stop+.000001);
  assert.ok(before.every((v,i)=>Math.abs(v-after[i])<=1),'continuous at '+stop);
 }
});
