import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mapFixture} from './map-browser-helpers.mjs';
const near=(a,b,label)=>assert.ok(Math.abs(a-b)<=1.1,`${label}: ${a} vs ${b}`);
test('real PlaceModal carousel preserves camera, pinned phone, anchors and viewport geometry',{timeout:150000},async()=>{
 const f=await mapFixture('script/fixtures/place-map-carousel-browser.tsx',{mobile:true,prefix:'/directory'});const {page,context}=f;
 try{
  const business={id:100,name:'QA Carousel Cafe',type:'cafe',description:Array(35).fill('Community events, accessible seating, coffee and neighborhood resources.').join(' '),address:'123 Main St',neighborhood:'Portland',website:null,instagram:null,donateUrl:null,hours:'Daily 7am–9pm',phone:'503-555-0123',queerOwned:true,queerFriendly:true,imageUrl:'/directory-logos/coffeebeer-white.svg',lat:45.52,lng:-122.67,isNew:false};
  const businesses=Array.from({length:6},(_,i)=>({...business,id:100+i,name:`QA Carousel Cafe ${i+1}`}));
  await context.route('**/outzide-map/places.json*',r=>r.fulfill({json:{places:[]}}));
  await context.route('**/api/**',r=>{const req=r.request(),p=new URL(req.url()).pathname;if(req.method()!=='GET')return r.abort();if(p==='/api/auth/me')return r.fulfill({status:401,json:{}});if(p==='/api/directory')return r.fulfill({json:businesses});if(/^\/api\/directory\/\d+$/.test(p))return r.fulfill({json:businesses.find(b=>b.id===Number(p.split('/').pop()))});return r.fulfill({json:[]});});
  const active=n=>page.waitForFunction(n=>window.mapStats?.active.size===n,n),settle=()=>page.waitForTimeout(500);
  const box=loc=>loc.evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom,docX:r.x+scrollX,docY:r.y+scrollY};});
  const snapshot=async()=>({panel:await box(page.locator('.event-modal.eb-detail--place')),hero:await box(page.locator('.place-modal-panel__hero')),phone:await box(page.locator('.place-modal-panel__contacts')),host:await box(page.locator('[data-card-expanded=true]')),pageY:await page.evaluate(()=>scrollY)});
  function same(a,b,label){for(const key of ['panel','hero','phone','host'])for(const axis of ['x','y','width','height'])near(a[key][axis],b[key][axis],`${label} ${key}.${axis}`);near(a.pageY,b.pageY,label+' scroll');}
  await page.goto(`${f.base}directory?type=ALL&layout=grid`,{waitUntil:'networkidle'});const card=page.locator('.eb-grid .rd-card[data-card-category="placez"]').first();if(!(await card.count()))console.log('MAP_CAROUSEL_DIRECTORY_PROBE',JSON.stringify(await page.evaluate(()=>({url:location.href,results:document.querySelector('[data-testid=directory-result-count]')?.textContent,gridCount:document.querySelectorAll('.eb-grid').length,cardCount:document.querySelectorAll('[data-card-size]').length,visibleText:document.body.innerText.slice(0,950)}))),f.errors.slice(-5));await card.waitFor();await card.scrollIntoViewIfNeeded();await settle();const original=await box(card);
  for(let cycle=0;cycle<2;cycle++){
   await card.locator('button[aria-label^="View details for "]').click();await page.locator('.place-modal-panel__content-scroll').waitFor();await settle();await active(0);
   const before=await snapshot(),top=await box(page.locator('.site-header')),bottom=await box(page.locator('.z-mobile-dock'));near(before.host.docX,original.docX,'left anchor');near(before.host.docY,original.docY,'top anchor');assert.ok(before.panel.x>=-1&&before.panel.right<=391&&before.panel.y>=top.bottom-1&&before.panel.bottom<=bottom.y+1,'all corners clear chrome');
   await page.getByRole('button',{name:'Show place map',exact:true}).click();await active(1);await settle();same(before,await snapshot(),'map dot');assert.equal(await page.getByRole('button',{name:'Show place map',exact:true}).getAttribute('aria-pressed'),'true');await page.evaluate(()=>{[...window.mapStats.active][0].setView([45.61,-122.71],16,{animate:false});});
   await page.getByRole('button',{name:'Show place artwork',exact:true}).click();await active(0);await settle();same(before,await snapshot(),'art dot');
   const r=await page.locator('.place-modal-panel__hero-rail').boundingBox(),session=await context.newCDPSession(page),x=r.x+r.width*.82,y=r.y+r.height*.35;await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let i=1;i<=6;i++){await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-r.width*.65*i/6,y}]});await page.waitForTimeout(25);}await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await session.detach();await active(1);await settle();same(before,await snapshot(),'native swipe');
   const restored=await page.evaluate(()=>{const m=[...window.mapStats.active][0];return {lat:m.getCenter().lat,zoom:m.getZoom()};});assert.ok(Math.abs(restored.lat-45.61)<.0001);assert.equal(restored.zoom,16);
   const scroll=page.locator('.place-modal-panel__content-scroll');await scroll.evaluate(el=>{el.scrollTop=el.scrollHeight;});await settle();same(before,await snapshot(),'body scroll');assert.ok(await scroll.evaluate(el=>el.scrollTop>0));
   await page.locator('.event-modal.eb-detail--place button[aria-label*="Close"]').first().click();await page.locator('[data-card-expanded=true]').waitFor({state:'detached'});await active(0);await settle();const after=await box(card);near(after.docX,original.docX,'closed x');near(after.docY,original.docY,'closed y');near(after.width,original.width,'discovery face width after close');
  }
  const count=await page.evaluate(()=>({a:window.mapStats.created,b:window.mapStats.removed}));assert.equal(count.a,count.b);assert.deepEqual(f.errors,[]);
 }finally{await f.close();}
});
