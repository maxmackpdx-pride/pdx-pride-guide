import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {chromium} from 'playwright';

// Opt-in browser regression: exercise the real frame and face-switch renderer.
test('poster covers the whole hologram during transitions and rear glitches', {skip:!process.env.MAPZ_POSTER_BROWSER,timeout:30000}, async()=>{
 const app=express();app.use(express.static('client/public'));
 const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
 let browser;
 try {
  browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined});
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.goto(`http://127.0.0.1:${server.address().port}/mapz-map/studio.css`);
  await page.setContent('<style>body{margin:0;background:#000}#fixture{position:relative;width:224px;height:224px;margin:40px;--projection-color:#CCFF00;--glitch-accent:#FF00CC}</style><div id="fixture" class="standalone-hologram-label--event"></div>');
  await page.addStyleTag({path:'client/public/mapz-map/studio.css'});
  await page.evaluate(async()=>{
   const {appendEventCardFrame,updateEventCardGlitch}=await import('/mapz-map/event-hologram-card.js');
   const {updateEventArtwork}=await import('/mapz-map/event-card-artwork.js');
   const card=document.querySelector('#fixture');
   appendEventCardFrame(card);
   const brand=document.createElement('span');brand.className='event-hologram-brand';brand.dataset.posterReady='true';
   const poster=document.createElement('img');poster.className='event-hologram-poster';
   poster.src='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="224" height="224"><path fill="#00FFFF" d="M0 0h224v224H0z"/><path fill="#FF00CC" d="M0 70h224v40H0z"/></svg>');
   brand.append(poster);card.append(brand);await poster.decode();
   card.artworkState={face:'info',next:1,changed:-Infinity};card.dataset.glitchPhase='0';
   window.drawPoster=(time,glitchTime)=>{updateEventArtwork(card,time,false);updateEventCardGlitch(card,glitchTime,false);};
   window.drawPoster(1.3,0);
  });
  const card=page.locator('#fixture');
  const steady=await card.screenshot();
  for(const glitch of [0,5.8,6.2]) {
   await page.evaluate(t=>{window.drawPoster(1.31,t);document.querySelector('#fixture').classList.add('is-artwork-switching');},glitch);
   const state=await card.evaluate(el=>{
    const brand=el.querySelector('.event-hologram-brand'),style=getComputedStyle(brand),a=el.getBoundingClientRect(),b=brand.getBoundingClientRect();
    return {clip:style.clipPath,filter:style.filter,bounds:[a.left,a.top,a.right,a.bottom],art:[b.left,b.top,b.right,b.bottom]};
   });
   assert.equal(state.clip,'none');assert.equal(state.filter,'none');assert.deepEqual(state.art,state.bounds);
   assert.deepEqual(await card.screenshot(),steady,`rear frame exposed during glitch ${glitch}`);
  }
  await card.screenshot({path:'/tmp/mapz-poster-transition-fixed.png'});
 } finally {await browser?.close();await new Promise(resolve=>server.close(resolve));}
});
