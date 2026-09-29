const EMPTY={type:'FeatureCollection',features:[]};
// Keep the tint's faces in front of the vector-tile extrusion. Coplanar faces
// flicker as the depth buffer changes precision during zoom and pitch.
function tintShell(ring,center){
 const meters=.35,lat=center[1]*Math.PI/180;
 const dx=meters/(111320*Math.cos(lat)),dy=meters/111320;
 return ring.map(([lng,latitude])=>[
  lng+(lng>=center[0]?dx:-dx),
  latitude+(latitude>=center[1]?dy:-dy)
 ]);
}

export function extrusionAmount(target){
 const zoom=Math.max(0,Math.min(1,(target.getZoom()-14.25)/1.1));
 const pitch=Math.max(0,Math.min(1,(target.getPitch()-16)/18));
 const z=zoom*zoom*(3-2*zoom),p=pitch*pitch*(3-2*pitch);
 return z*p;
}

export function roofAnchor(point,roofPixels,amount){
 return {x:point.x,y:point.y-roofPixels*amount};
}

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
export function matchBuilding(buildings,coordinates,maxDist=.0022){
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

/** Placez only — no boards, housing, mizzed, pure events. */
export function isPlacezRow(row){
 if(!row)return false;
 if(row.kind==='event')return false;
 if(row.housingModel)return false;
 const family=row.waypointFamily||'';
 if(family==='mizzed'||family==='houz'||family==='giftz'||family==='gigz'||family==='board')return false;
 if(row.kind==='place'||row.kind==='places')return true;
 if(row.type==='bar'||row.type==='adult'||row.type==='cafe'||row.type==='club')return true;
 if(!family||family==='places'||family==='placez')return true;
 return false;
}

export function createVenueRoofs(map){
 if(!map.getSource('venue-roofs')){
  map.addSource('venue-roofs',{type:'geojson',data:EMPTY});
  map.addLayer({
   id:'venue-roofs',
   type:'fill-extrusion',
   source:'venue-roofs',
   minzoom:13.5,
   paint:{
    'fill-extrusion-color':['get','color'],
    'fill-extrusion-height':['get','height'],
    'fill-extrusion-base':0,
    'fill-extrusion-opacity':0,
    'fill-extrusion-vertical-gradient':true
   }
  });
 }
 return {
  update(buildings,features,amount,matches){
   const list=[],used=new Map();
   for(const feature of features||[]){
    const props=feature.properties||{};
    if(!isPlacezRow(props))continue;
    const color=props.color,c=feature.geometry?.coordinates;
    if(!color||!Array.isArray(c)||c.length<2)continue;
    const best=matches?.has(feature)?matches.get(feature):matchBuilding(buildings,c);
    if(!best)continue;
    const key=`${best.center[0].toFixed(6)}:${best.center[1].toFixed(6)}:${best.height}`;
    // Last Placez on a building wins the tint; every Placez still snaps to that roof.
    used.set(key,{
     type:'Feature',
     properties:{color,height:Math.max(8,Number(best.height)||9)+.5},
     geometry:{type:'Polygon',coordinates:[tintShell(best.ring,best.center)]}
    });
   }
   for(const [key,feature] of [...used].sort(([a],[b])=>a.localeCompare(b)))list.push(feature);
   const data={type:'FeatureCollection',features:list};
   const key=JSON.stringify(data);
   if(key!==this.dataKey){
    this.dataKey=key;
    map.getSource('venue-roofs')?.setData(data);
   }
   if(map.getLayer('venue-roofs')){
    const opacity=Math.max(0,Math.min(1,amount));
    if(opacity!==this.opacity){
     this.opacity=opacity;
     map.setPaintProperty('venue-roofs','fill-extrusion-opacity',opacity);
    }
   }
  }
 };
}
