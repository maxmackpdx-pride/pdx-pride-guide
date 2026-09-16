import {MapboxOverlay} from '@deck.gl/mapbox';
import {ColumnLayer,PathLayer,ScatterplotLayer} from '@deck.gl/layers';
import {TripsLayer} from '@deck.gl/geo-layers';

const CENTER=[-122.676,45.523];
const RAINBOW=[[25,227,255],[255,0,204],[255,102,0],[204,255,0],[136,0,255]];
const OPTIONS=[
 ['tonight','Tonight','Events happening today'],
 ['routes','Night routes','Rainbow route following Portland roads'],
 ['weather','Live weather','Portland conditions as atmosphere'],
 ['architecture','Venue architecture','Extrude activity at venues'],
];
const color=(hex,a=220)=>{const v=/^#[0-9a-f]{6}$/i.test(hex||'')?hex:'#19e3ff';return[parseInt(v.slice(1,3),16),parseInt(v.slice(3,5),16),parseInt(v.slice(5,7),16),a]};
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles'}).format(new Date());
const valid=features=>features.filter(f=>f?.geometry?.coordinates?.every(Number.isFinite));
const events=features=>features.filter(f=>f.properties.kind==='event').sort((a,b)=>Date.parse(a.properties.startsAt)-Date.parse(b.properties.startsAt));
const routeKey=points=>points.map(point=>point.map(value=>value.toFixed(5)).join(',')).join(';');
function sampleRoute(path,limit=500){
 if(path.length<=limit)return path;
 return Array.from({length:limit},(_,i)=>path[Math.round(i*(path.length-1)/(limit-1))]);
}
function rainbowSegments(path){
 const sampled=sampleRoute(path);
 return sampled.slice(1).map((point,index)=>({path:[sampled[index],point],timestamps:[index*8,(index+1)*8],color:RAINBOW[index%RAINBOW.length]}));
}

function weatherPoints(kind){
 const count=kind==='rain'?180:kind==='snow'?130:70;
 return Array.from({length:count},(_,i)=>{const angle=i*2.399963,r=.006+.055*Math.sqrt(((i*47)%count)/count);return{position:[CENTER[0]+Math.cos(angle)*r,CENTER[1]+Math.sin(angle)*r*.7],size:kind==='rain'?18:kind==='snow'?32:55}});
}
function weatherKind(code){if(code>=71&&code<=77)return'snow';if(code>=51)return'rain';if(code<=1)return'clear';return'cloud';}

function makeUi(toggle){
 const root=document.createElement('section');root.className='deck-lab';root.setAttribute('aria-label','Optional deck.gl layers');
 root.innerHTML=`<button class="deck-lab__trigger" type="button" aria-expanded="false"><span>✦</span> Deck layers</button><div class="deck-lab__panel" hidden><div class="deck-lab__head"><div><small>ADDITIVE DEMO</small><strong>Your map + deck.gl</strong></div><button class="deck-lab__close" type="button" aria-label="Close">×</button></div><p>The original 3D map and holograms stay untouched. Switch on only the added layers you want to inspect.</p><div class="deck-lab__layers"></div><div class="deck-lab__status" role="status"></div></div>`;
 const trigger=root.querySelector('.deck-lab__trigger'),panel=root.querySelector('.deck-lab__panel'),list=root.querySelector('.deck-lab__layers'),status=root.querySelector('.deck-lab__status');
 for(const [key,label,detail]of OPTIONS){const button=document.createElement('button');button.type='button';button.className='deck-lab__layer';button.dataset.layer=key;button.setAttribute('aria-pressed','false');button.innerHTML=`<span><strong>${label}</strong><small>${detail}</small></span><i></i>`;button.onclick=()=>toggle(key);list.append(button);}
 trigger.onclick=()=>{const open=panel.hidden;panel.hidden=!open;trigger.setAttribute('aria-expanded',String(open))};
 root.querySelector('.deck-lab__close').onclick=()=>{panel.hidden=true;trigger.setAttribute('aria-expanded','false')};
 document.body.append(root);
 return{set(key,on){list.querySelector(`[data-layer="${key}"]`)?.setAttribute('aria-pressed',String(on))},status(text){status.textContent=text},weather(text){const el=list.querySelector('[data-layer="weather"] small');if(el)el.textContent=text},destroy(){root.remove()}};
}

export function attachDeckMobileDemo(map){
 const state={features:[],on:Object.fromEntries(OPTIONS.map(([k])=>[k,false])),weather:null,weatherData:[],routePath:[],routeKey:'',routeLoading:false,clock:0,dead:false};
 const overlay=new MapboxOverlay({interleaved:true,layers:[]});map.addControl(overlay);let frame=0,last=0;
 function render(){
  const all=valid(state.features),upcoming=events(all).slice(0,10),tonight=upcoming.filter(f=>f.properties.eventDay===today()),layers=[];
  if(state.on.tonight)layers.push(new ScatterplotLayer({id:'tonight',data:tonight,getPosition:d=>d.geometry.coordinates,getRadius:95,radiusUnits:'meters',stroked:true,filled:true,getFillColor:d=>color(d.properties.color,35),getLineColor:d=>color(d.properties.color),lineWidthMinPixels:2}));
  const fallback=upcoming.map(f=>f.geometry.coordinates),route=state.routePath.length>1?state.routePath:fallback,segments=state.on.routes&&route.length>1?rainbowSegments(route):[];
  if(segments.length){
   layers.push(new PathLayer({id:'route-rainbow-base',data:segments,getPath:d=>d.path,getColor:d=>[...d.color,185],getWidth:3,widthMinPixels:3,capRounded:true,jointRounded:true}));
   layers.push(new TripsLayer({id:'route-rainbow-motion',data:segments,getPath:d=>d.path,getTimestamps:d=>d.timestamps,getColor:d=>d.color,widthMinPixels:6,trailLength:96,currentTime:state.clock%(segments.length*8),fadeTrail:true,capRounded:true,jointRounded:true,opacity:1}));
  }
  if(state.on.weather&&state.weatherData.length)layers.push(new ScatterplotLayer({id:'weather',data:state.weatherData,getPosition:d=>d.position,getRadius:d=>d.size,radiusUnits:'meters',getFillColor:state.weather==='clear'?[255,193,74,38]:state.weather==='snow'?[225,245,255,110]:[142,217,255,70]}));
  if(state.on.architecture)layers.push(new ColumnLayer({id:'architecture',data:all,getPosition:d=>d.geometry.coordinates,diskResolution:8,radius:32,extruded:true,getElevation:d=>d.properties.kind==='event'?150:85,getFillColor:d=>color(d.properties.color,110),getLineColor:d=>color(d.properties.color),stroked:true,lineWidthMinPixels:1}));
  overlay.setProps({layers});
 }
 function animate(now){frame=0;if(state.dead)return;if(now-last>45){last=now;state.clock+=7;render()}if(state.on.routes)frame=requestAnimationFrame(animate);}
 async function loadWeather(){try{const r=await fetch('https://api.open-meteo.com/v1/forecast?latitude=45.523&longitude=-122.676&current=temperature_2m,weather_code&temperature_unit=fahrenheit&timezone=America%2FLos_Angeles');const d=await r.json(),kind=weatherKind(Number(d.current?.weather_code)||0),temp=Math.round(Number(d.current?.temperature_2m));state.weather=kind;state.weatherData=weatherPoints(kind);ui.weather(`${temp}°F in Portland · ${kind}`);render()}catch{ui.weather('Portland weather unavailable')}}
 async function loadRoadRoute(){
  const points=events(valid(state.features)).slice(0,10).map(f=>f.geometry.coordinates),key=routeKey(points);
  if(points.length<2||state.routeLoading||key===state.routeKey)return;
  state.routeLoading=true;ui.status('Snapping the night route to Portland roads…');
  try{
   const coordinates=points.map(point=>point.join(',')).join(';');
   const response=await fetch(`https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=false`);
   if(!response.ok)throw new Error('Road routing failed');
   const data=await response.json(),path=data.routes?.[0]?.geometry?.coordinates;
   if(!Array.isArray(path)||path.length<2)throw new Error('Road route missing');
   state.routePath=path;state.routeKey=key;ui.status('Rainbow route is following Portland roads.');
  }catch{state.routePath=points;state.routeKey=key;ui.status('Road routing is unavailable. Showing the event route.');}
  finally{state.routeLoading=false;render();}
 }
 function toggle(key){state.on[key]=!state.on[key];ui.set(key,state.on[key]);render();if(key==='routes'&&state.on[key]){void loadRoadRoute();if(!frame)frame=requestAnimationFrame(animate)}if(key==='weather'&&state.on[key]&&!state.weather)void loadWeather();}
 const ui=makeUi(toggle);
 return{setListings(features){state.features=features||[];if(state.on.routes)void loadRoadRoute();render()},dispose(){state.dead=true;cancelAnimationFrame(frame);ui.destroy();try{map.removeControl(overlay)}catch{}}};
}
