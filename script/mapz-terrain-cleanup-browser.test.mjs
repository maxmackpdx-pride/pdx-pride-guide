import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {webkit} from 'playwright';

test('vendored terrain releases actual WebGL ownership across replacement, disable, restore and removal',{timeout:45000},async()=>{
 const app=express();
 app.get('/fixture',(_req,res)=>res.type('html').send('<style>body{margin:0}#map{width:256px;height:256px}</style><div id="map"></div><script src="/home-flight/vendor/maplibre-gl-5.6.2.js"></script>'));
 app.use(express.static('client/public'));
 const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});let browser;
 try{
  browser=await webkit.launch();const page=await browser.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}/fixture`);
  const result=await page.evaluate(async()=>{
   const {createMapWithStyleRecovery}=await import('/map-foundation/lifecycle.js');
   const check=(value,message)=>{if(!value)throw Error(message);};
   check(maplibregl.getVersion()==='5.6.2',`vendor version ${maplibregl.getVersion()}`);
   const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
   const until=async(predicate)=>{for(let n=0;n<250;n++){if(predicate())return;await pause(20);}throw Error('Terrain fixture did not settle');};
   const tile=document.createElement('canvas');tile.width=tile.height=256;
   const ctx=tile.getContext('2d');ctx.fillStyle='rgb(128,0,0)';ctx.fillRect(0,0,256,256);
   const blob=await new Promise(resolve=>tile.toBlob(resolve));const bytes=await blob.arrayBuffer();
   maplibregl.addProtocol('fixture-dem',async()=>({data:bytes.slice(0)}));
   const source={type:'raster-dem',tiles:['fixture-dem://tile/{z}/{x}/{y}'],tileSize:256,maxzoom:0,encoding:'terrarium'};
   const map=createMapWithStyleRecovery({container:'map',center:[0,0],zoom:1,pitch:35,interactive:false,fadeDuration:0,style:{version:8,sources:{dem:source,other:{...source}},layers:[{id:'background',type:'background',paint:{'background-color':'#226644'}}]}});
   await new Promise(resolve=>map.once('load',resolve));
   const gl=map.painter.context.gl,deleted=new Map();
   for(const method of ['deleteTexture','deleteFramebuffer','deleteRenderbuffer','deleteBuffer']){
    const original=gl[method].bind(gl);gl[method]=handle=>{if(handle)deleted.set(handle,(deleted.get(handle)||0)+1);return original(handle);};
   }
   const materialize=()=>{
    const terrain=map.terrain;terrain.getFramebuffer('coords');terrain.getFramebuffer('depth');terrain.getCoordsTexture();
    terrain.getTerrainMesh({canonical:{z:0,y:0}});
    const textures=['_fboCoordsTexture','_fboDepthTexture','_coordsTexture','_emptyDepthTexture','_emptyDemTexture'].map(key=>terrain[key]?.texture).filter(Boolean);
    const buffers=Object.values(terrain._meshCache).flatMap(mesh=>[mesh.vertexBuffer.buffer,mesh.indexBuffer.buffer]);
    const fbo=terrain._fbo.framebuffer,depth=terrain._fbo.depthAttachment.get();
    check(textures.length>=3&&buffers.length>=2,'actual terrain allocations exist');
    for(const t of textures)check(gl.isTexture(t),'texture live before disposal');
    for(const b of buffers)check(gl.isBuffer(b),'mesh buffer live before disposal');
    check(gl.isFramebuffer(fbo)&&gl.isRenderbuffer(depth),'terrain framebuffer/depth live');
    return {textures,buffers,fbo,depth};
   };
   const released=handles=>{
    for(const t of handles.textures)check(!gl.isTexture(t)&&deleted.get(t)===1,`owned texture deleted exactly once (live=${gl.isTexture(t)}, deletes=${deleted.get(t)})`);
    for(const b of handles.buffers)check(!gl.isBuffer(b)&&deleted.get(b)===1,'mesh buffer deleted exactly once');
    check(!gl.isFramebuffer(handles.fbo)&&deleted.get(handles.fbo)===1,'framebuffer deleted once');
    check(!gl.isRenderbuffer(handles.depth)&&deleted.get(handles.depth)===1,'depth renderbuffer deleted once');
   };
   map.setTerrain({source:'dem'});map.triggerRepaint();await until(()=>map.terrain.sourceCache.getRenderableTiles().length>0);await pause(100);
   let handles=materialize();
   // Bind a different real FBO before disabling. Cleanup must detach its own FBO.
   const foreign=map.painter.context.createFramebuffer(1,1,false,false),foreignTexture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,foreignTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,null);foreign.colorAttachment.set(foreignTexture);
   map.setTerrain(null);released(handles);
   map.painter.context.bindFramebuffer.set(foreign.framebuffer);
   check(gl.getFramebufferAttachmentParameter(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME)===foreignTexture,'foreign framebuffer attachment preserved');foreign.destroy();
   for(let i=0;i<3;i++){
    map.setTerrain({source:'dem'});handles=materialize();map.setTerrain({source:'dem'});released(handles);
    check(map.style.sourceCaches.dem.usedForTerrain,'same-source replacement remains active');
    handles=materialize();map.setTerrain({source:'other'});released(handles);
    check(!map.style.sourceCaches.dem.usedForTerrain&&map.style.sourceCaches.other.usedForTerrain,'different-source flags transferred');
    handles=materialize();let failed=false;try{map.setTerrain({source:'missing'});}catch{failed=true;}
    check(failed&&gl.isTexture(handles.textures[0]),'validation failure preserves live resources');map.setTerrain(null);released(handles);
   }
   map.setTerrain({source:'dem'});materialize();
   const extension=gl.getExtension('WEBGL_lose_context');check(extension,'context loss supported');
   const lost=new Promise(resolve=>map.getCanvas().addEventListener('webglcontextlost',resolve,{once:true}));extension.loseContext();await Promise.race([lost,pause(5000).then(()=>{throw Error('lost event timeout');})]);
   const restored=new Promise(resolve=>map.getCanvas().addEventListener('webglcontextrestored',resolve,{once:true}));await pause(250);extension.restoreContext();await Promise.race([restored,pause(5000).then(()=>{throw Error('restore event timeout');})]);
   await until(()=>map.isStyleLoaded()&&map.terrain&&!gl.isContextLost());map.triggerRepaint();await pause(100);
   handles=materialize();map.setTerrain(null);released(handles);
   map.setTerrain({source:'dem'});handles=materialize();map.remove();
   // Context is now lost, so deletion counters prove release happened before loss.
   for(const handle of [...handles.textures,...handles.buffers,handles.fbo,handles.depth])check(deleted.get(handle)===1,'active terrain explicitly deleted on map removal');
   return {version:maplibregl.getVersion(),cycles:3,restored:true};
  });
  assert.equal(result.version,'5.6.2');assert.equal(result.cycles,3);assert.equal(result.restored,true);
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
});
