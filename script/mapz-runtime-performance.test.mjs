import test from 'node:test';
import assert from 'node:assert/strict';
import {createProjectionCache} from '../client/public/mapz-map/projection-cache.js';
import {createMapActivity} from '../client/public/map-foundation/lifecycle.js';
import {createPortlandLandmarkLayer} from '../client/public/mapz-map/portland-landmarks.js';
import {createMapHover} from '../client/public/mapz-map/map-hover.js';

test('stationary frames reuse projections, camera and edited rows invalidate immediately',()=>{
 const handlers=new Map();let projections=0;
 const map={on:(name,fn)=>handlers.set(name,fn),off:(name)=>handlers.delete(name),project:point=>{projections++;return {x:point[0],y:point[1]}}};
 const rows=Array.from({length:2000},(_,id)=>({geometry:{coordinates:[id,id]}}));
 const cache=createProjectionCache(map);
 for(let frame=0;frame<60;frame++)for(const row of rows)cache.project(row);
 assert.equal(projections,rows.length); // 120,000 original calls become 2,000.
 handlers.get('move')();assert.deepEqual(cache.project(rows[0]),{x:0,y:0});assert.equal(projections,2001);
 rows[0].geometry.coordinates[0]=9;assert.equal(cache.project(rows[0]).x,9);assert.equal(projections,2002);
 handlers.get('resize')();cache.project(rows[0]);assert.equal(projections,2003);
 handlers.get('terrain')();cache.project(rows[0]);assert.equal(projections,2004);
 cache.dispose();assert.equal(handlers.size,0);
});

test('host hidden state dominates onscreen intersections and resumes unchanged map',()=>{
 let intersect,visibility;const changes=[];
 const scope={document:{hidden:false,addEventListener:(_,fn)=>visibility=fn,removeEventListener(){}},IntersectionObserver:class{constructor(fn){intersect=fn}observe(){}disconnect(){}}};
 const map={getContainer:()=>({}),on(){},off(){}};
 const activity=createMapActivity(map,{scope,onChange:value=>changes.push(value)});
 activity.setActive(false);intersect([{isIntersecting:true}]);assert.equal(activity.visible,false);
 scope.document.hidden=true;visibility();activity.setActive(true);assert.equal(activity.visible,false);
 scope.document.hidden=false;visibility();assert.equal(activity.visible,true);
 assert.deepEqual(changes,[false,true]);activity.dispose();
});

test('hidden landmark layer does no projection, asset loading or GL work',()=>{
 const layer=createPortlandLandmarkLayer({},()=>0,{matches:false});let repaints=0;
 layer.map={triggerRepaint:()=>repaints++};layer.setActive(false);
 layer.render(null,null);assert.equal(repaints,0);
 layer.setActive(true);assert.equal(repaints,1);
});

test('unchanged hover hit does not repeat DOM writes and hide clears once',()=>{
 const before=globalThis.document;let writes=0;
 const style=new Proxy({setProperty(){writes++}},{set(target,key,value){writes++;target[key]=value;return true}});
 const ring={style,setAttribute(){},remove(){}};
 globalThis.document={createElement:()=>ring,body:{appendChild(){}}};
 try{
  const canvas={style:{}};const hover=createMapHover(canvas),target={x:30,y:40,r:22,color:'#fff'};
  const pointer={active:true,x:30,y:40};hover.update([target],pointer);const initial=writes;
  for(let i=0;i<60;i++)hover.update([target],pointer);
  assert.equal(writes,initial);hover.update([],{active:false});assert.equal(ring.hidden,true);assert.equal(canvas.style.cursor,'');hover.dispose();
 }finally{globalThis.document=before;}
});
