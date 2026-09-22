export const FIRE_SOURCES = {
 OR:{name:'Oregon ODF',url:'https://gis.odf.oregon.gov/odfags/rest/services/Hosted/Fire_Danger_Level_View/FeatureServer/0',link:'https://gisapps.odf.oregon.gov/firerestrictions/PFR.html'},
 WA:{name:'Washington DNR',url:'https://gis.dnr.wa.gov/site3/rest/services/Public_Wildfire/WADNR_PUBLIC_WD_WildfireDanger/MapServer/0',link:'https://www.dnr.wa.gov/burn-restrictions'}
};
export const FIRE_COLORS={'Low':'#73b967','Moderate':'#62b9ef','High':'#ead85a','Very High':'#f3943e','Extreme':'#ec535b','Not reported':'#899798'};
export function normalizeFireFeature(feature,state){
 const p=feature.properties,level=state==='OR'?({1:'Low',2:'Moderate',3:'High',4:'Extreme'}[p.firedanger]):p.FIRE_DANGER_LEVEL_NM;
 return {...feature,properties:{state,level:Object.hasOwn(FIRE_COLORS,level)?level:'Not reported',area:state==='OR'?p.regusearea:p.FIREDANGER_AREA_NM,burn:state==='WA'?p.BURN_BAN_LEVEL_NM||'Not reported':null,notes:state==='WA'?p.NOTES_TXT||'':'',color:FIRE_COLORS[level]||FIRE_COLORS['Not reported']}};
}
function inRing([x,y],ring){let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const [ax,ay]=ring[i],[bx,by]=ring[j];if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)inside=!inside}return inside}
export function containsPoint(geometry,point){const polygons=geometry?.type==='Polygon'?[geometry.coordinates]:geometry?.type==='MultiPolygon'?geometry.coordinates:[];return polygons.some(p=>inRing(point,p[0])&&!p.slice(1).some(hole=>inRing(point,hole)))}
export async function fetchFireState(state){
 const source=FIRE_SOURCES[state];
 const params=new URLSearchParams({where:'1=1',outFields:state==='OR'?'regusearea,firedanger':'FIREDANGER_AREA_NM,FIRE_DANGER_LEVEL_NM,BURN_BAN_LEVEL_NM,NOTES_TXT',outSR:'4326',f:'geojson',returnGeometry:'true'});
 const response=await fetch(source.url+'/query?'+params,{signal:AbortSignal.timeout(25000)});
 if(!response.ok)throw Error('Feed unavailable');const data=await response.json();
 if(data.type!=='FeatureCollection'||!Array.isArray(data.features)||data.exceededTransferLimit)throw Error('Incomplete fire feed');
 return {features:data.features.map(f=>normalizeFireFeature(f,state)),checkedAt:Date.now(),error:false};
}
