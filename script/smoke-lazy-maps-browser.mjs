import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { chromium, webkit } from 'playwright';
const html=`<!doctype html><html><body><div id="root"></div><style>.pdxPlaceMap__live,.event-location-map__canvas{height:220px;width:400px}</style><script type="module">
import React, {lazy,Suspense,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {PlaceCardMap} from '/src/components/ds/PlaceCardMap.tsx';
const EventMap=lazy(()=>import('/src/components/EventLocationMap.tsx'));
const h=React.createElement;
function Maps(){const [expanded,setExpanded]=useState(false);const [event,setEvent]=useState(false);return h('main',null,
 h(PlaceCardMap,{name:'Fixture place',latitude:45.5,longitude:-122.6,expanded,onToggle:()=>setExpanded(v=>!v)}),
 h('button',{id:'event',onClick:()=>setEvent(true)},'Event map'),
 event&&h(Suspense,{fallback:'Loading'},h(EventMap,{event:{id:1,title:'Fixture',venueName:'Fixture place',lat:45.5,lng:-122.6,address:'Fixture address'},primary:'#00ffff',complementary:'#ff00ff',scheduled:false,schedulePending:false,onSchedule:()=>{}})));
}
createRoot(document.getElementById('root')).render(h(Maps));
</script></body></html>`;
const server=await createServer({server:{host:'127.0.0.1',port:0},plugins:[{name:'map-fixture',configureServer(server){server.middlewares.use('/__map-check',async(_req,res,next)=>{try{res.setHeader('Content-Type','text/html');res.end(await server.transformIndexHtml('/__map-check',html));}catch(e){next(e);}});}}]});
await server.listen();
const origin=`http://127.0.0.1:${server.httpServer.address().port}`;
try {
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]) {
  const browser=await engine.launch({headless:true,...(name==='chromium'&&process.env.CHROME_CHANNEL?{channel:process.env.CHROME_CHANNEL}:{})});
  try {
   const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://basemaps.cartocdn.com/**',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({version:8,sources:{},layers:[{id:'background',type:'background',paint:{'background-color':'#101014'}}]})}));
   await page.goto(origin+'/__map-check');
   await page.getByRole('button',{name:'Show map for Fixture place',exact:true}).click();
   await page.locator('.leaflet-container .maplibregl-canvas').waitFor();
   await page.locator('#event').click();
   await page.locator('.event-location-map .maplibregl-canvas').waitFor();
   assert.equal(errors.length,0,errors.join('\n'));
   await page.screenshot({path:`/tmp/zaylist-maps-${name}.png`});
   console.log(name+': deferred place and event maps mount with live WebGL canvases PASS');
  } finally {await browser.close();}
 }
} finally {await server.close();}
