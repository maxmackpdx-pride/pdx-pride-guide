import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {build} from 'esbuild';
const {outputFiles}=await build({entryPoints:['client/src/components/placez/nativeModel.ts'],bundle:true,platform:'node',format:'esm',write:false,packages:'external'});
const {nativePlacezModel,hasPlacezArtwork}=await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`);
test('Q-Restaurant uses recovered immutable listing60 artwork and food token',()=>{
 const m=nativePlacezModel({id:60,name:'Q-Restaurant',type:'restaurant'});
 assert.equal(m.imageUrl,'/placez-recovered-batch/Q-Restaurant-building.png');assert.equal(m.accent,'var(--cat-food)');assert.equal(m.category,'Restaurant');
 for(const size of ['small','square','tall','wide-map','expanded'])assert.ok(fs.existsSync('client/public'+m.glassUrl(size)));
});
test('Q-Restaurant recovery is byte-verified and preserves previous artworks/fallback',()=>{
 const p=JSON.parse(fs.readFileSync('client/public/placez-recovered-batch/Q-Restaurant-provenance.json'));
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync('client/public/placez-recovered-batch/'+p.artwork)).digest('hex'),p.artworkSha256);
 for(const id of [2,3,5,9,23,30,31])assert.ok(hasPlacezArtwork(id));
 assert.equal(nativePlacezModel({id:9999,name:'Unknown Venue',type:'shop',imageUrl:'/existing.png'}).imageUrl,'/existing.png');
 assert.equal(hasPlacezArtwork(118),false);
});

test('Q-Restaurant source attribution and rights are visible in both expanded cards',()=>{for(const file of ['PlacezQuickCard.tsx','NativePlacezExpanded.tsx']){const s=fs.readFileSync('client/src/components/placez/'+file,'utf8');assert.ok(s.includes('===60&&'));assert.ok(s.includes('official Q Restaurant doorway photograph'));assert.ok(s.includes('current appearance may differ'));assert.ok(s.includes('/placez-recovered-batch/Q-Restaurant-provenance.json'));}});

