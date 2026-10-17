import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chromium} from 'playwright';
import sharp from 'sharp';
import {photoQuietStyle} from '../client/public/outzide-map/assets/destination-photos.js';
test('Chrome masks both graphics layers, leaves the base intact, and clears the spatial ellipse',async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:400,height:240},deviceScaleFactor:1});
  const css=fs.readFileSync('client/public/outzide-map/assets/destination-photos.css','utf8');
  const quiet={cx:.5,cy:.5,rx:.43,ry:.28};
  await page.setContent(`<style>${css}body{margin:0}.outz-photo{width:400px;height:240px}.outz-photo__base{background:#002040}.outz-photo__overlay{background:#ff0000}.outz-photo__nodes{background:#00ff00;animation:none;opacity:1}</style><span class="outz-photo" data-photo-quiet="true" style="${photoQuietStyle(quiet)}"><span class="outz-photo__base"></span><span class="outz-photo__graphics"><span class="outz-photo__overlay"></span><span class="outz-photo__nodes"></span></span></span>`);
  const screenshot=await page.screenshot();const {data,info}=await sharp(screenshot).raw().toBuffer({resolveWithObject:true});
  let clear=0,inside=0,feather=0;
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
   const i=(y*info.width+x)*info.channels;const distance=((x+.5-200)/172)**2+((y+.5-120)/67.2)**2;
   const isBase=data[i]===0&&data[i+1]===32&&data[i+2]===64;
   if(distance<=.93**2){inside++;assert.ok(isBase,`Art leaked inside quiet ellipse at ${x},${y}`)}
   if(isBase)clear++;
   if(distance>.95**2&&distance<.99**2&&data[i+1]>32&&data[i+1]<255)feather++;
  }
  assert.ok(clear/(400*240)>.33&&clear/(400*240)<.34,'Clear ellipse is not the authored 33.4% spatial area');
  assert.ok(inside>30000);assert.ok(feather>500,'Ellipse edge did not feather');
  const state=await page.locator('.outz-photo').evaluate(e=>({base:getComputedStyle(e.querySelector('.outz-photo__base')).maskImage,graphics:getComputedStyle(e.querySelector('.outz-photo__graphics')).maskImage}));
  assert.equal(state.base,'none');assert.match(state.graphics,/radial-gradient/);
  await page.locator('.outz-photo').evaluate(e=>e.removeAttribute('data-photo-quiet'));
  assert.equal(await page.locator('.outz-photo__graphics').evaluate(e=>getComputedStyle(e).maskImage),'none');
 }finally{await browser.close()}
});
