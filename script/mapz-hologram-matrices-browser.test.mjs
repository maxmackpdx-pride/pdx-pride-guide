import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {webkit} from 'playwright';

test('hologram world transforms update once across actual per-object WebGL renders',{timeout:30000},async()=>{
 const app=express();
 app.get('/fixture',(_req,res)=>res.type('html').send('<script type="importmap">{"imports":{"three":"/mapz-map/vendor/three/three.module.js","three/addons/":"/mapz-map/vendor/three/addons/"}}</script>'));
 app.use(express.static('client/public'));
 const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});let browser;
 try{
  browser=await webkit.launch();const page=await browser.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}/fixture`);
  const result=await page.evaluate(async()=>{
   const THREE=await import('three'),{updateHologramWorldMatrices}=await import('/mapz-map/e3-blender-model.js');
   const renderer=new THREE.WebGLRenderer({preserveDrawingBuffer:true});renderer.setSize(48,48);document.body.append(renderer.domElement);
   const scene=new THREE.Scene(),root=new THREE.Group(),geometry=new THREE.PlaneGeometry(8,8),material=new THREE.MeshBasicMaterial({color:0x00ff00});
   scene.position.set(1,2,0);root.position.set(2,3,-4);scene.add(root);
   const visible=new THREE.Mesh(geometry,material),hidden=new THREE.Mesh(geometry,material);hidden.position.set(4,5,6);hidden.visible=false;root.add(visible,hidden);
   const camera=new THREE.PerspectiveCamera(45,1,.1,100);camera.position.set(3,5,12);
   const update=scene.updateMatrixWorld;let updates=0;scene.updateMatrixWorld=function(...args){updates++;return update.apply(this,args);};
   const position=object=>new THREE.Vector3().setFromMatrixPosition(object.matrixWorld).toArray();
   updateHologramWorldMatrices(scene);
   for(let i=0;i<8;i++)renderer.render(scene,camera);
   const first={updates,hidden:position(hidden),visible:position(visible),camera:position(camera)};
   scene.position.set(2,1,0);root.position.set(3,4,-4);camera.position.set(5,5,12);
   const cameraBefore=position(camera);updateHologramWorldMatrices(scene);
   for(let i=0;i<12;i++)renderer.render(scene,camera);
   const gl=renderer.getContext(),pixel=new Uint8Array(4);gl.readPixels(24,24,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);
   const second={updates,hidden:position(hidden),visible:position(visible),camera:position(camera),cameraBefore,pixel:[...pixel],sceneAuto:scene.matrixWorldAutoUpdate,cameraAuto:camera.matrixWorldAutoUpdate};
   geometry.dispose();material.dispose();renderer.dispose();return {first,second};
  });
  assert.equal(result.first.updates,1);assert.deepEqual(result.first.hidden,[7,10,2]);assert.deepEqual(result.first.visible,[3,5,-4]);
  assert.equal(result.second.updates,2);assert.deepEqual(result.second.hidden,[9,10,2]);assert.deepEqual(result.second.visible,[5,5,-4]);
  assert.deepEqual(result.second.cameraBefore,[3,5,12]);assert.deepEqual(result.second.camera,[5,5,12]);assert.equal(result.second.cameraAuto,true);assert.equal(result.second.sceneAuto,false);
  assert.ok(result.second.pixel[1]>200&&result.second.pixel[0]<20,'actual WebGL rendered the transformed green plane');
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
});
