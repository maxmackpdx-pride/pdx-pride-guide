import test from 'node:test';import assert from 'node:assert/strict';import sharp from 'sharp';import {chromium} from 'playwright';
async function render(svg,width,height){const browser=await chromium.launch({channel:'chrome',headless:true});try{const page=await browser.newPage({viewport:{width:Math.max(100,width),height:Math.max(100,height)},deviceScaleFactor:1});await page.setContent('<style>body{margin:0}img{display:block}</style><img src="data:image/svg+xml;base64,'+Buffer.from(svg).toString('base64')+'">');await page.locator('img').evaluate(i=>i.decode());return await sharp(await page.screenshot({omitBackground:true,clip:{x:0,y:0,width,height},animations:"disabled"})).ensureAlpha().raw().toBuffer({resolveWithObject:true});}finally{await browser.close();}}
import {wrapOutzideArtwork} from './lib/outzide-art-wrapper.mjs';
test('native artwork mask clears the union of authored regions and preserves bright graphic cores',async()=>{
 const pixels=Buffer.alloc(100*100*4);for(let i=0;i<pixels.length;i+=4){pixels[i]=255;pixels[i+1]=120;pixels[i+2]=30;pixels[i+3]=255;}
 const webp=await sharp(pixels,{raw:{width:100,height:100,channels:4}}).webp({lossless:true}).toBuffer();
 const exclusions=[[[.1,.1],[.5,.1],[.5,.7],[.1,.7]],[[.3,.3],[.7,.3],[.7,.9],[.3,.9]]];
 const svg=wrapOutzideArtwork({webp,width:100,height:100,exclusions});
 const {data,info}=await render(svg,100,100);
 const alpha=(x,y)=>data[(y*info.width+x)*4+3];assert.equal(alpha(20,20),0);assert.equal(alpha(40,40),0);assert.equal(alpha(60,80),0);assert.equal(alpha(90,50),255);
 assert.doesNotMatch(svg,/<script|foreignObject|https?:\/\/(?!www\.w3\.org)/i);assert.match(svg,/href="data:image\/webp;base64,/);
});
test('static alpha transfer clears faint non-graphic haze without fading opaque nodes',async()=>{
 const pixels=Buffer.from([255,120,30,8,255,120,30,255]);const webp=await sharp(pixels,{raw:{width:2,height:1,channels:4}}).webp({lossless:true}).toBuffer();
 const {data}=await render(wrapOutzideArtwork({webp,width:2,height:1}),2,1);assert.equal(data[3],0);assert.equal(data[7],255);
 assert.throws(()=>wrapOutzideArtwork({webp,width:2,height:1,exclusions:[[[0,0],[1,0],[Infinity,1]]]}),/exclusion/);
});
