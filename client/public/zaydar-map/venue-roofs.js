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
    let best=null,dist=.00075;
    for(const building of buildings||[]){
     const d=Math.hypot((building.center[0]-c[0])*.7,building.center[1]-c[1]);
     if(d<dist){dist=d;best=building;}
    }
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
    map.setPaintProperty('venue-roofs','fill-extrusion-opacity',Math.max(0,Math.min(.88,amount*.88)));
   }
  }
 };
}
