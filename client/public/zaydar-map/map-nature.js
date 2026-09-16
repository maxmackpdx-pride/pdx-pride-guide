const EMPTY_COLLECTION={type:'FeatureCollection',features:[]};
const MAX_CANOPIES=6500;

function hash(value){
 let h=2166136261;
 for(const character of String(value)){h^=character.charCodeAt(0);h=Math.imul(h,16777619);}
 return (h>>>0)/4294967295;
}

function pointInRing(point,ring){
 let inside=false;
 for(let i=0,j=ring.length-1;i<ring.length;j=i++){
  const a=ring[i],b=ring[j];
  if(((a[1]>point[1])!==(b[1]>point[1]))&&(point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1]||1e-12)+a[0]))inside=!inside;
 }
 return inside;
}

function pointInPolygon(point,rings){
 if(!rings?.length||!pointInRing(point,rings[0]))return false;
 for(let index=1;index<rings.length;index++)if(pointInRing(point,rings[index]))return false;
 return true;
}

function polygons(feature){
 const geometry=feature?.geometry;
 if(geometry?.type==='Polygon')return [geometry.coordinates];
 if(geometry?.type==='MultiPolygon')return geometry.coordinates;
 return [];
}

function spacingForZoom(zoom){
 if(zoom<11.5)return 430;
 if(zoom<13.5)return 210;
 if(zoom<15.5)return 82;
 return 34;
}

function samplePolygon(rings,spacingMeters,density,toneSeed,points,seen){
 const outer=rings[0];if(!outer?.length)return;
 let west=Infinity,south=Infinity,east=-Infinity,north=-Infinity;
 for(const coordinate of outer){west=Math.min(west,coordinate[0]);east=Math.max(east,coordinate[0]);south=Math.min(south,coordinate[1]);north=Math.max(north,coordinate[1]);}
 const middleLatitude=(south+north)/2;
 const latitudeStep=spacingMeters/111320;
 const longitudeStep=spacingMeters/(111320*Math.max(.25,Math.cos(middleLatitude*Math.PI/180)));
 const columnStart=Math.floor(west/longitudeStep),columnEnd=Math.ceil(east/longitudeStep);
 const rowStart=Math.floor(south/latitudeStep),rowEnd=Math.ceil(north/latitudeStep);
 for(let row=rowStart;row<=rowEnd&&points.length<MAX_CANOPIES;row++)for(let column=columnStart;column<=columnEnd&&points.length<MAX_CANOPIES;column++){
  const seed=`${column}:${row}:${Math.round(spacingMeters)}`;
  if(hash(`${seed}:density`)>density)continue;
  const longitude=(column+.18+hash(`${seed}:x`)*.64)*longitudeStep;
  const latitude=(row+.18+hash(`${seed}:y`)*.64)*latitudeStep;
  const coordinate=[longitude,latitude];
  if(!pointInPolygon(coordinate,rings))continue;
  const key=`${longitude.toFixed(6)}:${latitude.toFixed(6)}`;if(seen.has(key))continue;seen.add(key);
  points.push({type:'Feature',properties:{tone:Math.floor(hash(`${seed}:${toneSeed}`)*3),scale:.76+hash(`${seed}:scale`)*.52},geometry:{type:'Point',coordinates:coordinate}});
 }
}

function classifiedFeatures(map,sourceLayer,classes){
 try{return map.querySourceFeatures('terrain',{sourceLayer}).filter(feature=>classes.has(String(feature.properties?.class||feature.properties?.subclass||'').toLowerCase()));}
 catch{return [];}
}

function canopyCollection(map){
 const zoom=map.getZoom(),spacing=spacingForZoom(zoom),points=[],seen=new Set();
 const woodland=classifiedFeatures(map,'landcover',new Set(['wood','forest','scrub']));
 const parks=classifiedFeatures(map,'landuse',new Set(['park','recreation_ground','cemetery','grass']));
 const unique=new Set();
 for(const [features,density,tone] of [[woodland,.88,'wood'],[parks,.54,'park']])for(const feature of features){
  for(const rings of polygons(feature)){
   const signature=JSON.stringify(rings[0]?.slice(0,6));if(unique.has(signature))continue;unique.add(signature);
   samplePolygon(rings,spacing,density,tone,points,seen);
  }
 }
 return {type:'FeatureCollection',features:points};
}

export function createMapNature(map){
 let disposed=false,lastSignature='',refreshFrame=0;
 function refresh(){
  refreshFrame=0;if(disposed||!map.getSource('nature-canopies')||!map.isSourceLoaded('terrain'))return;
  const collection=canopyCollection(map);
  const signature=collection.features.map(feature=>feature.geometry.coordinates.map(value=>value.toFixed(5)).join(',')).join('|');
  if(signature===lastSignature)return;lastSignature=signature;
  map.getSource('nature-canopies').setData(collection);
 }
 function queueRefresh(){
  if(!refreshFrame)refreshFrame=requestAnimationFrame(refresh);
 }
 function add(){
  if(map.getSource('nature-canopies'))return;
  map.addSource('nature-canopies',{type:'geojson',data:EMPTY_COLLECTION});
  map.addLayer({id:'canopy-shadows',type:'circle',source:'nature-canopies',minzoom:9.5,paint:{
   'circle-pitch-alignment':'map','circle-pitch-scale':'map',
   'circle-radius':['interpolate',['linear'],['zoom'],9.5,['*',['get','scale'],1.15],12,['*',['get','scale'],1.65],14,['*',['get','scale'],2.7],16,['*',['get','scale'],5.2],17.75,['*',['get','scale'],8.2]],
   'circle-color':'#01070a','circle-opacity':['interpolate',['linear'],['zoom'],9.5,.42,13,.58,16,.72],
   'circle-blur':.28,'circle-translate':[.7,1.1]
  }},'streets');
  map.addLayer({id:'canopy-crowns',type:'circle',source:'nature-canopies',minzoom:9.5,paint:{
   'circle-pitch-alignment':'map','circle-pitch-scale':'map',
   'circle-radius':['interpolate',['linear'],['zoom'],9.5,['*',['get','scale'],.85],12,['*',['get','scale'],1.25],14,['*',['get','scale'],2.15],16,['*',['get','scale'],4.4],17.75,['*',['get','scale'],7.1]],
   'circle-color':['match',['get','tone'],0,'#0b302b',1,'#104039','#155049'],
   'circle-opacity':['interpolate',['linear'],['zoom'],9.5,.66,12,.75,15,.88],
   'circle-blur':['interpolate',['linear'],['zoom'],10,.32,15,.12],
   'circle-stroke-color':'#2d7366','circle-stroke-opacity':['interpolate',['linear'],['zoom'],10,.08,15,.24],
   'circle-stroke-width':['interpolate',['linear'],['zoom'],10,.1,16,.55]
  }},'streets');
  map.addLayer({id:'canopy-highlights',type:'circle',source:'nature-canopies',minzoom:13,paint:{
   'circle-pitch-alignment':'map','circle-pitch-scale':'map',
   'circle-radius':['interpolate',['linear'],['zoom'],13,['*',['get','scale'],.35],16,['*',['get','scale'],1.25],17.75,['*',['get','scale'],2.2]],
   'circle-color':'#63a989','circle-opacity':['interpolate',['linear'],['zoom'],13,.08,16,.22],
   'circle-blur':.34,'circle-translate':[-.45,-.6]
  }},'streets');
  map.on('idle',queueRefresh);map.on('moveend',queueRefresh);queueRefresh();
 }
 return {add,dispose(){disposed=true;cancelAnimationFrame(refreshFrame);map.off('idle',queueRefresh);map.off('moveend',queueRefresh);}};
}
