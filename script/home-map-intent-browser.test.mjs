import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
const release=JSON.parse(readFileSync(new URL('../shared/mapReleaseLock.json',import.meta.url),'utf8'));
import {mapFixture} from './map-browser-helpers.mjs';
test('Home idle avoids maps; actual MAPZ pointer/focus/touch intent warms without delaying navigation',{timeout:180000},async()=>{
 for(const intent of ['pointer','keyboard','touch']){
  const f=await mapFixture('script/fixtures/home-map-intent-browser.tsx',{mobile:true,define:{__MAPZ_ASSETS__:JSON.stringify({script:'/qa-map-runtime.js',maplibre:'/qa-map-vendor.js',maplibreCss:'/qa-map-vendor.css',contour:'/qa-map-contour.js',style:'/qa-map-style.css',perf:'/qa-map-perf.js'})}});const {page,context,requests}=f;
  try{
   await context.route('**/*',r=>{const url=new URL(r.request().url());if(url.hostname!=='127.0.0.1')return r.abort();if(url.pathname.includes('/UnifiedMap.tsx'))return r.fulfill({contentType:'application/javascript',body:'export default function MapFixture(){return null}'});if(url.pathname.startsWith(release.base))return r.fulfill({contentType:url.pathname.endsWith('.css')?'text/css':'application/javascript',body:''});if(url.pathname==='/api/auth/me')return r.fulfill({status:401,json:{}});if(url.pathname==='/api/home/stats')return r.fulfill({json:{eventCount:0,placesCount:0,newUsers90Days:0}});if(url.pathname.startsWith('/api/'))return r.fulfill({json:[]});if(url.pathname.endsWith('/places.json'))return r.fulfill({json:{places:[]}});return r.continue();});
   await page.goto(`${f.base}__map-qa`,{waitUntil:'networkidle'});await page.locator('.home-main-stage').waitFor();const link=page.getByRole('link',{name:'MAPZ',exact:true});await link.waitFor();await page.waitForTimeout(500);
   const mapRequests=()=>requests.filter(url=>/map-assets\/|UnifiedMap|maplibre-gl|leaflet/.test(url));assert.deepEqual(mapRequests(),[],`${intent}: idle no maprequests`);await page.locator('#unrelated').focus();await page.waitForTimeout(50);assert.deepEqual(mapRequests(),[],`${intent}: unrelated focus no warm`);
   if(intent==='pointer')await link.hover();else if(intent==='keyboard')await link.focus();else await link.dispatchEvent('touchstart');await page.waitForFunction(href=>!!document.querySelector(`link[href="${href}"]`),release.base+release.entry);await page.waitForTimeout(100);assert.ok(mapRequests().some(url=>url.includes('UnifiedMap.tsx')));assert.ok(mapRequests().some(url=>url.includes(release.base+release.entry)));
   if(intent==='keyboard')await link.press('Enter');else if(intent==='touch')await link.tap();else await link.click();const world=page.locator('a[href="/map?mode=mapz"]');await world.waitFor({state:'visible'});if(intent==='keyboard')await world.press('Enter');else if(intent==='touch')await world.tap();else await world.click();await page.locator('#destination').waitFor();assert.equal(new URL(page.url()).pathname,'/map');assert.deepEqual(f.errors,[]);
  }finally{await f.close();}
 }
});
