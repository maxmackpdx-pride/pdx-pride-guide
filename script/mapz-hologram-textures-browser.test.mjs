import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {webkit} from 'playwright';

test('hidden hologram rings allocate no textures while visible artwork remains populated',{timeout:30000},async()=>{
 const app=express();
 app.get('/fixture',(_req,res)=>res.type('html').send('<script type="importmap">{"imports":{"three":"/mapz-map/vendor/three/three.module.js","three/addons/":"/mapz-map/vendor/three/addons/"}}</script>'));
 app.use(express.static('client/public'));
 const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});let browser;
 try{
  browser=await webkit.launch();const page=await browser.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}/fixture`);
  const result=await page.evaluate(async()=>{
   const THREE=await import('three'),{createBlenderHologram}=await import('/mapz-map/e3-blender-model.js');
   const image=document.createElement('canvas');image.width=image.height=16;image.getContext('2d').fillRect(0,0,16,16);
   const model=createBlenderHologram(new THREE.Group());
   model.setContent({venueName:'Example Place',screens:[{name:'Example Event',time:'Tonight',ringName:'Example Event',ringSub:'Tonight',poster:{key:'poster',image,width:16,height:16}}],countdown:[{value:'12',unit:'MIN'}]});
   const rings=model.object.children.filter(node=>node.geometry?.type==='CylinderGeometry');
   let hidden=true;for(let stage=0;stage<=5;stage++){model.setStage(stage);model.update(stage,true);hidden&&=rings.every(node=>!node.visible);}
   const result={rings:rings.length,hidden,ringTextures:rings.filter(node=>node.material.map).length,hasRingText:model.hasRingText,hasVenueLabel:model.hasVenueLabel,hasCountdown:model.hasCountdown,slideKinds:model.slideKinds};
   model.dispose();return result;
  });
  assert.ok(result.rings>0);assert.equal(result.hidden,true);assert.equal(result.ringTextures,0);assert.equal(result.hasRingText,false);
  assert.equal(result.hasVenueLabel,true);assert.equal(result.hasCountdown,true);assert.deepEqual(result.slideKinds[0],['poster']);
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
});

test('hologram disposal releases private geometry and canvases without damaging shared art',{timeout:30000},async()=>{
 const app=express();
 app.get('/fixture',(_req,res)=>res.type('html').send('<script type="importmap">{"imports":{"three":"/mapz-map/vendor/three/three.module.js","three/addons/":"/mapz-map/vendor/three/addons/"}}</script>'));
 app.use(express.static('client/public'));
 const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});let browser;
 try{
  browser=await webkit.launch();const page=await browser.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}/fixture`);
  const result=await page.evaluate(async()=>{
   const THREE=await import('three'),{createBlenderHologram}=await import('/mapz-map/e3-blender-model.js');
   const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,1,0,0,0,1,0],3));
   const morph=new THREE.Float32BufferAttribute([0,1,0,0,1,0,0,1,0],3);morph.name='Ring 1 independent hover';geometry.morphAttributes.position=[morph];geometry.morphTargetsRelative=true;
   const template=new THREE.Group(),mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial());mesh.name='outline';mesh.userData.mapzRole='outline';template.add(mesh);
   const image=document.createElement('canvas');image.width=32;image.height=24;image.getContext('2d').fillRect(0,0,32,24);
   const logo={key:'shared',image,width:32,height:24};
   const first=createBlenderHologram(template,{logo}),second=createBlenderHologram(template,{logo});
   const content={venueName:'Place',screens:[{name:'Event',poster:logo}],countdown:[{value:'12',unit:'MIN'}]};first.setContent(content);second.setContent(content);
   const canvases=model=>{const found=new Set();model.object.traverse(n=>{const c=n.material?.map?.image;if(c instanceof HTMLCanvasElement&&c!==image)found.add(c);});return [...found];};
   const oldLabel=canvases(first).find(c=>c.width===1024),oldCountdown=canvases(first).find(c=>c.width===480);
   first.setContent({...content,venueName:'Updated Place',countdown:[{value:'11',unit:'MIN'}]});
   const replacedReleased=[oldLabel,oldCountdown].every(c=>c.width===1&&c.height===1);
   const owned=canvases(first),surviving=canvases(second),survivingSizes=surviving.map(c=>[c.width,c.height]);
   const privateGeometry=first.object.getObjectByName('outline').geometry,otherGeometry=second.object.getObjectByName('outline').geometry;
   let originalDisposals=0,privateDisposals=0,otherDisposals=0;geometry.addEventListener('dispose',()=>originalDisposals++);privateGeometry.addEventListener('dispose',()=>privateDisposals++);otherGeometry.addEventListener('dispose',()=>otherDisposals++);
   first.dispose();first.dispose();first.setContent({venueName:'Late update'});first.setLogo({...logo,key:'late'});
   const result={replacedReleased,ownedCount:owned.length,ownedReleased:owned.every(c=>c.width===1&&c.height===1)&&canvases(first).every(c=>c.width===1&&c.height===1),sharedSize:[image.width,image.height],otherCanvasesUnchanged:surviving.every((c,i)=>c.width===survivingSizes[i][0]&&c.height===survivingSizes[i][1]),privateClone:privateGeometry!==geometry&&privateGeometry!==otherGeometry,originalDisposals,privateDisposals,otherDisposals};
   second.dispose();geometry.dispose();mesh.material.dispose();return result;
  });
  assert.equal(result.replacedReleased,true);assert.ok(result.ownedCount>=4);assert.equal(result.ownedReleased,true);
  assert.deepEqual(result.sharedSize,[32,24]);assert.equal(result.otherCanvasesUnchanged,true);assert.equal(result.privateClone,true);
  assert.equal(result.originalDisposals,0);assert.equal(result.privateDisposals,1);assert.equal(result.otherDisposals,0);
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
});
