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
   const oldLabel=canvases(first).find(c=>c.width===1024),oldCountdown=canvases(first).find(c=>c.width===960);
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

test('projected occlusion hides only background pixels, including overlapping screens',{timeout:30000},async()=>{
 const app=express();app.get('/fixture',(_req,res)=>res.type('html').send('<!doctype html><title>Occlusion fixture</title>'));app.use(express.static('client/public'));
 const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});let browser;
 try{
  browser=await webkit.launch();const page=await browser.newPage();await page.goto(`http://127.0.0.1:${server.address().port}/fixture`);
  const result=await page.evaluate(async()=>{
   const {projectedHologramQuad,clipBehindHolograms,pointBehindHologram}=await import('/mapz-map/hologram-occlusion.js');
   const matrix=[.8,0,0,0,.4,.8,0,0,0,0,1,0,0,0,-.2,1],region=projectedHologramQuad(matrix,100,100);
   const canvas=document.createElement('canvas');canvas.width=canvas.height=100;const ctx=canvas.getContext('2d');
   const draw=depth=>{ctx.clearRect(0,0,100,100);ctx.save();clipBehindHolograms(ctx,depth,[region,region],100,100);ctx.fillStyle='red';ctx.fillRect(0,0,100,100);ctx.restore();return {inside:ctx.getImageData(50,50,1,1).data[3],gap:ctx.getImageData(23,32,1,1).data[3]};};
   const foreground={...region,foreground:true};ctx.clearRect(0,0,100,100);ctx.save();clipBehindHolograms(ctx,-.4,[foreground],100,100);ctx.fillRect(0,0,100,100);ctx.restore();const coveredNearPin=ctx.getImageData(50,50,1,1).data[3]===0;
   return {coveredNearPin,coveredNearHit:pointBehindHologram({x:50,y:50},-.4,[foreground]),behind:draw(.4),front:draw(-.4),blockedHit:pointBehindHologram({x:50,y:50},.4,[region]),foregroundHit:pointBehindHologram({x:50,y:50},-.4,[region])};
  });
  assert.equal(result.coveredNearPin,true);assert.equal(result.coveredNearHit,true);
  assert.deepEqual(result.behind,{inside:0,gap:255});assert.deepEqual(result.front,{inside:255,gap:255});assert.equal(result.blockedHit,true);assert.equal(result.foregroundHit,false);
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
});

test('hologram text and tint changes retain unchanged artwork textures',{timeout:30000},async()=>{
 const app=express();app.get('/fixture',(_req,res)=>res.type('html').send('<script type="importmap">{"imports":{"three":"/mapz-map/vendor/three/three.module.js","three/addons/":"/mapz-map/vendor/three/addons/"}}</script>'));app.use(express.static('client/public'));
 const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});let browser;
 try{
  browser=await webkit.launch();const page=await browser.newPage();await page.goto(`http://127.0.0.1:${server.address().port}/fixture`);
  const result=await page.evaluate(async()=>{
   const THREE=await import('three'),{createBlenderHologram}=await import('/mapz-map/e3-blender-model.js');
   const image=document.createElement('canvas');image.width=image.height=16;
   const replacement=document.createElement('canvas');replacement.width=replacement.height=32;
   const model=createBlenderHologram(new THREE.Group()),poster={key:'poster',image,width:16,height:16};
   const set=(name,art=poster)=>{model.setContent({venueName:name,screens:[{name,poster:art}]});model.setStage(4);model.update(5,true);};
   const texture=()=>model.object.children.find(node=>node.material?.uniforms?.map0?.value?.image===image)?.material.uniforms.map0.value;
   set('First');const first=texture();let disposals=0;first.addEventListener('dispose',()=>disposals++);
   model.setColor('#00FFFF');set('Changed text');const retained=texture()===first,beforeReplacement=disposals;
   set('Replacement',{key:'new',image:replacement,width:32,height:32});const replacementTexture=model.object.children.find(node=>node.material?.uniforms?.map0?.value?.image===replacement)?.material.uniforms.map0.value;
   let replacementDisposals=0;replacementTexture.addEventListener('dispose',()=>replacementDisposals++);
   model.setContent({venueName:'No artwork',screens:[]});model.dispose();
   return {retained,beforeReplacement,disposals,replacementDisposals,borrowedSizes:[image.width,replacement.width]};
  });
  assert.equal(result.retained,true);assert.equal(result.beforeReplacement,0);assert.equal(result.disposals,1);assert.equal(result.replacementDisposals,1);assert.deepEqual(result.borrowedSizes,[16,32]);
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
});

test('a separate live clock removes the duplicate glowing time from poster artwork',{timeout:30000},async()=>{
 const app=express();app.get('/fixture',(_req,res)=>res.type('html').send('<script type="importmap">{"imports":{"three":"/mapz-map/vendor/three/three.module.js","three/addons/":"/mapz-map/vendor/three/addons/"}}</script>'));app.use(express.static('client/public'));
 const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});let browser;
 try{browser=await webkit.launch();const page=await browser.newPage();await page.goto(`http://127.0.0.1:${server.address().port}/fixture`);
  const result=await page.evaluate(async()=>{
   const THREE=await import('three'),{createBlenderHologram}=await import('/mapz-map/e3-blender-model.js');
   const calls=[],original=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(text,...args){if(text==='8PM')calls.push({color:this.fillStyle,blur:this.shadowBlur});return original.call(this,text,...args);};
   const model=createBlenderHologram(new THREE.Group());const screens=[{name:'Readable Event',time:'8PM'}];
   try{model.setContent({screens,countdown:[{value:'8PM',live:true}]});const withClock=[...calls];calls.length=0;model.setContent({screens,countdown:[]});return {withClock,withoutClock:calls.length};}finally{model.dispose();CanvasRenderingContext2D.prototype.fillText=original;}
  });assert.deepEqual(result.withClock,[{color:'#ffffff',blur:0}]);assert.ok(result.withoutClock>0,'time remains available when there is no clock plate');
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
});
