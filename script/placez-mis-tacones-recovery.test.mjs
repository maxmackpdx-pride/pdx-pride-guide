import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {build} from 'esbuild';
const {outputFiles}=await build({entryPoints:['client/src/components/placez/nativeModel.ts'],bundle:true,platform:'node',format:'esm',write:false,packages:'external'});
const {nativePlacezModel,hasPlacezArtwork}=await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`);
test('Mis-Tacones uses recovered immutable listing10 artwork and food token',()=>{
 const m=nativePlacezModel({id:10,name:'Mis Tacones',type:'restaurant'});
 assert.equal(m.imageUrl,'/placez-recovered-batch/Mis-Tacones-building.png');assert.equal(m.accent,'var(--cat-food)');assert.equal(m.category,'Restaurant');
 for(const size of ['small','square','tall','wide-map','expanded'])assert.ok(fs.existsSync('client/public'+m.glassUrl(size)));
});
test('Mis-Tacones recovery is byte-verified and preserves previous artworks/fallback',()=>{
 const p=JSON.parse(fs.readFileSync('client/public/placez-recovered-batch/Mis-Tacones-provenance.json'));
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync('client/public/placez-recovered-batch/'+p.artwork)).digest('hex'),p.artworkSha256);
 for(const id of [2,3,5,9,23,30,31])assert.ok(hasPlacezArtwork(id));
 assert.equal(nativePlacezModel({id:9999,name:'Unknown Venue',type:'shop',imageUrl:'/existing.png'}).imageUrl,'/existing.png');
 assert.equal(hasPlacezArtwork(118),false);
});

test('Mis Tacones source attribution and rights are visible in both expanded cards',()=>{for(const file of ['PlacezQuickCard.tsx','NativePlacezExpanded.tsx']){const s=fs.readFileSync('client/src/components/placez/'+file,'utf8');assert.ok(s.includes('===10&&'));assert.ok(s.includes('April 20, 2022 photographs'));assert.ok(s.includes('current appearance may differ'));assert.ok(s.includes('/placez-recovered-batch/Mis-Tacones-provenance.json'));}});

test('Mis compact focal crop is data-scoped and leaves other venues unchanged',()=>{
 assert.equal(nativePlacezModel({id:10,name:'Mis Tacones',type:'restaurant'}).compactImageScale,2);
 for(const id of [2,3,5,9,11,23,30,31,50])assert.equal(nativePlacezModel({id,name:'Other',type:'restaurant'}).compactImageScale,undefined);
 const css=fs.readFileSync('client/src/components/placez/PlacezQuickCard.css','utf8');
 assert.ok(css.includes('scale(var(--pz-compact-photo-scale,1))'));
});
