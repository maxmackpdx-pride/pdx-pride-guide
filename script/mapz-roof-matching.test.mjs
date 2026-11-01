import test from 'node:test';
import assert from 'node:assert/strict';
import {createBuildingMatcher,matchBuilding} from '../client/public/mapz-map/venue-roofs.js';
// Pre-optimization algorithm retained as an independent geometry oracle.
function pointInRing(lng,lat,ring){
 let inside=false;
 for(let i=0,j=ring.length-1;i<ring.length;j=i++){
  const xi=ring[i][0],yi=ring[i][1],xj=ring[j][0],yj=ring[j][1];
  if(((yi>lat)!==(yj>lat))&&(lng<(xj-xi)*(lat-yi)/(yj-yi+1e-15)+xi))inside=!inside;
 }
 return inside;
}

function distToRing(lng,lat,ring){
 let best=Infinity;
 for(let i=0;i<ring.length-1;i++){
  const ax=ring[i][0],ay=ring[i][1],bx=ring[i+1][0],by=ring[i+1][1];
  const dx=bx-ax,dy=by-ay,len2=dx*dx+dy*dy||1e-15;
  let t=((lng-ax)*dx+(lat-ay)*dy)/len2;t=Math.max(0,Math.min(1,t));
  const px=ax+t*dx,py=ay+t*dy;
  const d=Math.hypot((px-lng)*.7,py-lat);
  if(d<best)best=d;
 }
 return best;
}

/** Prefer footprint containment, then nearest edge, then centroid. Wider search for street GPS. */
function referenceMatch(buildings,coordinates,maxDist=.0022){
 if(!Array.isArray(coordinates)||coordinates.length<2)return null;
 const [lng,lat]=coordinates;
 let inside=null,edge=null,edgeDist=maxDist,center=null,centerDist=maxDist;
 for(const building of buildings||[]){
  const ring=building.ring;
  if(!ring?.length)continue;
  if(pointInRing(lng,lat,ring)){
   if(!inside||(Number(building.height)||0)>(Number(inside.height)||0))inside=building;
   continue;
  }
  const de=distToRing(lng,lat,ring);
  if(de<edgeDist){edgeDist=de;edge=building;}
  const dc=Math.hypot((building.center[0]-lng)*.7,building.center[1]-lat);
  if(dc<centerDist){centerDist=dc;center=building;}
 }
 return inside||edge||center;
}


const box=(x,y,w,h,height=10)=>({center:[x+w/2,y+h/2],height,ring:[[x,y],[x+w,y],[x+w,y+h],[x,y+h],[x,y]]});
test('indexed roofs preserve the original winner across irregular city geometry',()=>{
 let seed=1234567;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
 const buildings=Array.from({length:400},()=>{
  const x=-122.69+random()*.04,y=45.5+random()*.04,w=.0001+random()*.001,h=.0001+random()*.001;
  const b=box(x,y,w,h,random()*120);b.ring.splice(2,0,[x+w*.4,y+h*.4]);return b;
 });
 const match=createBuildingMatcher(buildings);
 for(let i=0;i<1000;i++){
  const c=[-122.695+random()*.05,45.495+random()*.05],distance=[0,.0001,.0022,.01][i%4];
  assert.equal(match(c,distance),referenceMatch(buildings,c,distance));
 }
});
test('containment, height ties, nearest edges, and centroid fallback retain precedence',()=>{
 const low=box(0,0,2,2,10),high=box(.1,.1,1,1,20),tie={...high};
 assert.equal(matchBuilding([low,high,tie],[.5,.5]),high);
 const elongated=box(0,0,20,1),compact=box(-1.5,0,.1,.1);
 assert.equal(matchBuilding([compact,elongated],[-.01,.5],2),elongated);
 const point={center:[.0001,0],height:1,ring:[[50,50]]};
 assert.equal(matchBuilding([point],[0,0]),point);
 assert.equal(matchBuilding([low],null),null);
 assert.equal(matchBuilding([], [0,0]),null);
});
test('faraway roofs do not scan their edges after snapshot indexing',()=>{
 let reads=0;const far=box(100,100,1,1);far.ring=new Proxy(far.ring,{get(target,key){if(/^\d+$/.test(String(key)))reads++;return Reflect.get(target,key);}});
 const near=box(0,0,.001,.001);const match=createBuildingMatcher([far,near]);reads=0;
 assert.equal(match([.0005,.0005]),near);assert.equal(reads,0);
});
test('a new tile snapshot observes replaced geometry',()=>{
 const building=box(0,0,1,1);assert.equal(createBuildingMatcher([building])([.5,.5]),building);
 Object.assign(building,box(20,20,1,1));assert.equal(createBuildingMatcher([building])([.5,.5]),null);
});
