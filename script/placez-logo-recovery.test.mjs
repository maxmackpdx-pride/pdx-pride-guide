import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {build} from 'esbuild';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const bundle=await build({entryPoints:[path.join(root,'client/src/components/placez/nativeModel.ts')],bundle:true,platform:'node',format:'esm',write:false,alias:{'@shared':path.join(root,'shared')}});
const {nativePlacezModel}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const record=(name,id=999)=>({id,name,type:'shop',imageUrl:'/photos/test.jpg'});
test('native directory cards restore saved reviewed logos without changing photo or dimensions',()=>{
 for(const name of ['UnderU4Men','CC Slaughters','Badlands']){
  const model=nativePlacezModel(record(name));
  assert.ok(model.logoUrl, name);
  assert.ok(existsSync(path.join(root,'client/public',model.logoUrl.split('?')[0])), model.logoUrl);
  assert.equal(model.imageUrl,'/photos/test.jpg');
 }
});
test('approved embedded logos and independent wide logos are never double overlaid',()=>{
 const holocene=nativePlacezModel(record('Holocene',30));
 assert.equal(holocene.logoUrl,undefined);
 assert.equal(holocene.wideLogoUrl,'/placez-six/Holocene-wide-logo.svg');
 assert.equal(nativePlacezModel(record('Pizza Thief',23)).logoUrl,'/placez-six/Pizza-Thief-logo.svg');
 assert.equal(nativePlacezModel(record('The Sports Bra',9)).logoUrl,'/directory-logos/thesportsbra-white.svg');
});
test('unknown venues do not invent logos or treat arbitrary photographs as logos',()=>{
 assert.equal(nativePlacezModel(record('Unmapped Test Venue')).logoUrl,undefined);
 assert.equal(nativePlacezModel({...record('Unmapped Test Venue'),imageUrl:'/directory-logos/UnderU4Men.png'}).logoUrl.split('?')[0],'/directory-logos/UnderU4Men.png');
});

const scenes=await build({entryPoints:[path.join(root,'client/src/components/scenez/sceneModel.ts')],bundle:true,platform:'node',format:'esm',write:false,alias:{'@shared':path.join(root,'shared')}});
const {sceneModel}=await import('data:text/javascript;base64,'+Buffer.from(scenes.outputFiles[0].text).toString('base64'));
test('SceneZ uses saved directory logos when an API image is absent, preserves approved treatments',()=>{
 assert.ok(sceneModel({slug:'bad-girls',name:'Bad Girls PDX',imageUrl:null}).logo);
 assert.equal(sceneModel({slug:'pink-ponies',name:'Pink Ponies',imageUrl:null}).logo,'/scenez-native/pink-ponies.png');
 assert.equal(sceneModel({slug:'bearracuda',name:'Bearracuda',imageUrl:null}).customArt,'/scenez-native/party-collage.png');
 assert.equal(sceneModel({slug:'test',name:'Test Club',imageUrl:'/community-logos/custom.png'}).logo,'/community-logos/custom.png');
});
