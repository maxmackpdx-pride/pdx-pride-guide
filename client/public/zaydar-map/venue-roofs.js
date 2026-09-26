const EMPTY={type:'FeatureCollection',features:[]};

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

/** Prefer footprint containment, then nearest edge, then centroid. */
export function matchBuilding(buildings,coordinates,maxDist=.0014){
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

export function createVenueRoofs(map){
 if(!map.getSource('venue-roofs')){
  map.addSource('venue-roofs',{type:'geojson',data:EMPTY});
  map.addLayer({
   id:'venue-roofs',
   type:'fill-extrusion',
   source:'venue-roofs',
   minzoom:14,
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
  update(buildings,features,amount){
   const list=[],used=new Set();
   for(const feature of features||[]){
    const color=feature.properties?.color,c=feature.geometry?.coordinates;
    if(!color||!Array.isArray(c)||c.length<2)continue;
    const best=matchBuilding(buildings,c);
    if(!best)continue;
    const key=`${best.center[0].toFixed(6)}:${best.center[1].toFixed(6)}:${best.height}`;
    if(used.has(key))continue;
    used.add(key);
    list.push({
     type:'Feature',
     properties:{color,height:Math.max(8,Number(best.height)||9)+1.2},
     geometry:{type:'Polygon',coordinates:[best.ring]}
    });
   }
   map.getSource('venue-roofs')?.setData({type:'FeatureCollection',features:list});
   if(map.getLayer('venue-roofs')){
    map.setPaintProperty('venue-roofs','fill-extrusion-opacity',Math.max(0,Math.min(.88,amount*.88));
   }
  }
 };
}
