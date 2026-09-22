import test from 'node:test';import assert from 'node:assert/strict';
import {addCascadiaOutline,installCascadiaReveal,cascadiaCamera,cascadiaOutline} from '../client/public/outzide-map/assets/cascadia-reveal.js';
for(const [width,height] of [[1440,900],[390,844],[844,390]])test(`Cascadia fits and is the hard zoom floor at ${width}×${height}`,()=>{
 const camera=cascadiaCamera(width,height),scale=512*2**camera.zoom;
 const y=lat=>(1-Math.asinh(Math.tan(lat*Math.PI/180))/Math.PI)/2;
 for(const [lng,lat] of cascadiaOutline){assert.ok(Math.abs((lng-camera.center[0])/360*scale)<=(width-60)/2+.001);assert.ok(Math.abs((y(lat)-y(camera.center[1]))*scale)<=(height-160)/2+.001);}
 const old=globalThis.document,classes=new Set(),button={},sign={setAttribute(){},hidden:true};globalThis.document={getElementById:()=>button,addEventListener(){},createElement:()=>sign,body:{append(){},classList:{toggle:(name,on)=>on?classes.add(name):classes.delete(name)}}};
 try{let zoom=6,min=0,center={lng:-122,lat:45},stops=0,pitch=0;const handlers={},visibility={},style={sources:{},layers:[{id:'i5-spectrum-0-core'}]};addCascadiaOutline(style);
 const emit=e=>(handlers[e]||[]).forEach(fn=>fn());const setZoom=z=>{zoom=Math.max(min,z);emit('zoom')};
 const map={getContainer:()=>({clientWidth:width,clientHeight:height}),getZoom:()=>zoom,setMinZoom:z=>min=z,getCenter:()=>center,getPitch:()=>pitch,getBearing:()=>0,getStyle:()=>style,setLayoutProperty:(id,_,v)=>visibility[id]=v,on:(e,fn)=>(handlers[e]??=[]).push(fn),stop:()=>stops++,jumpTo:c=>{center={lng:c.center[0],lat:c.center[1]};pitch=c.pitch??pitch;setZoom(c.zoom);emit('moveend')},zoomOut:()=>setZoom(zoom-1)};
 installCascadiaReveal(map);assert.equal(min,camera.zoom,'floor installed before load');
 setZoom(-5);assert.equal(zoom,min);assert.equal(sign.hidden,false);assert.ok(classes.has('cascadia-mode'));assert.equal(visibility['i5-spectrum-0-core'],'none');assert.equal(visibility['cascadia-core'],'visible');assert.equal(pitch,0);
 const previous=stops;setZoom(-20);assert.equal(stops,previous,'continued pinch does not retrigger');assert.equal(zoom,min);
 setZoom(min+1);assert.equal(sign.hidden,true);assert.equal(visibility['i5-spectrum-0-core'],'visible');button.onclick();assert.equal(sign.hidden,false);assert.equal(zoom,min);
 center={lng:0,lat:0};emit('moveend');assert.equal(center.lng,camera.center[0],'cannot pan away from final outline');
 }finally{globalThis.document=old;}
});

test('3D reveal retains tilt and bearing while fitting perspective on desktop and mobile',()=>{
 for(const [width,height] of [[1440,900],[390,844],[844,390]])for(const pitch of [35,55,75])for(const bearing of [0,45,90]){
 const camera=cascadiaCamera(width,height,pitch,bearing);assert.equal(camera.pitch,pitch);assert.equal(camera.bearing,bearing);
 const scale=512*2**camera.zoom,angle=bearing*Math.PI/180,t=pitch*Math.PI/180;
 const y=lat=>(1-Math.asinh(Math.tan(lat*Math.PI/180))/Math.PI)/2;
 for(const [lng,lat] of cascadiaOutline){const dx=(lng-camera.center[0])/360*scale,dy=(y(lat)-y(camera.center[1]))*scale,rx=dx*Math.cos(angle)+dy*Math.sin(angle),ry=-dx*Math.sin(angle)+dy*Math.cos(angle),depth=1-Math.abs(ry)*Math.sin(t)/height;assert.ok(depth>0);assert.ok(Math.abs(rx/depth)<=(width-60)/2+.001);assert.ok(Math.abs(ry*Math.cos(t)/depth)<=(height-160)/2+.001);}
 }
});
