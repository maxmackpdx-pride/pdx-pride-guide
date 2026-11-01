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
