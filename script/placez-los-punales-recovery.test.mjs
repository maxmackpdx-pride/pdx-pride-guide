import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {build} from 'esbuild';
const {outputFiles}=await build({entryPoints:['client/src/components/placez/nativeModel.ts'],bundle:true,platform:'node',format:'esm',write:false,packages:'external'});
const {nativePlacezModel,hasPlacezArtwork}=await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`);
test('Los-Punales uses recovered immutable listing11 artwork and food token',()=>{
 const m=nativePlacezModel({id:11,name:'Taqueria Los Puñales',type:'restaurant'});
 assert.equal(m.imageUrl,'/placez-recovered-batch/Los-Punales-building.png');assert.equal(m.accent,'var(--cat-food)');assert.equal(m.category,'Restaurant');
 for(const size of ['small','square','tall','wide-map','expanded'])assert.ok(fs.existsSync('client/public'+m.glassUrl(size)));
});
test('Los-Punales recovery is byte-verified and preserves previous artworks/fallback',()=>{
 const p=JSON.parse(fs.readFileSync('client/public/placez-recovered-batch/Los-Punales-provenance.json'));
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync('client/public/placez-recovered-batch/'+p.artwork)).digest('hex'),p.sha256);
 for(const id of [2,3,5,9,23,30,31])assert.ok(hasPlacezArtwork(id));
 assert.equal(nativePlacezModel({id:9999,name:'Unknown Venue',type:'shop',imageUrl:'/existing.png'}).imageUrl,'/existing.png');
 assert.equal(hasPlacezArtwork(118),false);
});

test("Los Puñales expanded card visibly credits source and historical appearance",()=>{const s=fs.readFileSync("client/src/components/placez/PlacezQuickCard.tsx","utf8");assert.match(s,/m.id===11&&<p className="pz-native-credit"/);assert.ok(s.includes("January 25, 2025 photographs"));assert.ok(s.includes("patio has since been redesigned"));assert.ok(s.includes("/placez-recovered-batch/Los-Punales-provenance.json"));});

test("Full native expanded info also exposes Los Puñales credit",()=>{const s=fs.readFileSync("client/src/components/placez/NativePlacezExpanded.tsx","utf8");assert.ok(s.includes("{place.id===11&&"));assert.ok(s.includes("January 25, 2025 photographs"));assert.ok(s.includes("/placez-recovered-batch/Los-Punales-provenance.json"));});
