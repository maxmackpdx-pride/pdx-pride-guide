import test from 'node:test';import assert from 'node:assert/strict';
import {addCascadiaOutline,installCascadiaReveal,CASCADIA_MIN_ZOOM} from '../client/public/outzide-map/assets/cascadia-reveal.js';
test('max zoom reveal toggles once and restores normal layers when zooming in',()=>{
 const old=globalThis.document;const classes=new Set();const sign={setAttribute(){},hidden:true};globalThis.document={addEventListener(){},createElement:()=>sign,body:{append(){},classList:{toggle:(name,on)=>on?classes.add(name):classes.delete(name)}}};
 try{const style={sources:{},layers:[{id:'i5-spectrum-0-core'},{id:'ordinary-road'},{id:'place-label',type:'symbol'}]};addCascadiaOutline(style);const handlers={};const visibility={};let zoom=6,jumps=0;const map={getCenter:()=>[-122,45],getZoom:()=>zoom,getStyle:()=>style,setLayoutProperty:(id,_,v)=>visibility[id]=v,on:(name,fn)=>handlers[name]=fn,jumpTo:()=>{jumps++;handlers.zoom();}};
 installCascadiaReveal(map);zoom=CASCADIA_MIN_ZOOM;handlers.zoom();assert.equal(jumps,1);assert.equal(sign.hidden,false);assert.ok(classes.has('cascadia-mode'));assert.equal(visibility['i5-spectrum-0-core'],'none');assert.equal(visibility['cascadia-core'],'visible');assert.equal(visibility['ordinary-road'],undefined);
 handlers.zoom();assert.equal(jumps,1);zoom=4;handlers.zoom();assert.equal(sign.hidden,true);assert.equal(visibility['i5-spectrum-0-core'],'visible');assert.equal(visibility['cascadia-core'],'none');assert.equal(classes.size,0);
 }finally{globalThis.document=old;}
});
