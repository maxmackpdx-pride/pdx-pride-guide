import assert from 'node:assert/strict';
import test from 'node:test';
import {chromium} from 'playwright';
const base=process.env.OUTZ_CARD_TEST_URL;
test('Outzide native open cards retain art, fixed glass and readable touch controls across viewports',{skip:!base,timeout:90000},async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage();
  const errors=[];page.on('pageerror',error=>{errors.push(error.message);console.log('PAGEERROR STACK',error.stack);});
  await page.goto(new URL('/outzide-map/index.html?card=1&place=rooster-rock&guestPlace=rooster-rock',base).href,{waitUntil:'domcontentloaded'});
  await page.locator('#detail-title').waitFor({state:'visible'});
  for(const width of [320,390,1320]){
   await page.setViewportSize({width,height:844});
   const state=await page.evaluate(()=>{
    const hero=document.querySelector('.detail-hero'),title=document.querySelector('#detail-title'),art=hero.querySelector('.detail-art');
    const glass=getComputedStyle(hero,'::after');
    const controls=[...document.querySelectorAll('#detail .detail-tools button,#detail .detail-tabs button,#detail .detail-footer button,#detail .directions-choice>summary')].filter(node=>node.getBoundingClientRect().width&&node.getBoundingClientRect().height);
    return {title:title.textContent,art:art?.getAttribute('src'),font:getComputedStyle(title).fontFamily,glassBlur:glass.backdropFilter||glass.webkitBackdropFilter,glassTransform:glass.transform,overflow:document.documentElement.scrollWidth>innerWidth,controlHeights:controls.map(node=>node.getBoundingClientRect().height)};
   });
   assert.match(state.title,/Rooster Rock/);assert.ok(state.art,'authored hero artwork retained');assert.match(state.font,/Barlow Condensed/);assert.match(state.glassBlur,/0\.45px/);assert.equal(state.glassTransform,'none');assert.equal(state.overflow,false,`${width}px horizontal overflow`);assert.ok(state.controlHeights.every(height=>height>=43.5),`${width}px controls below44px`);
   await page.screenshot({path:`/private/tmp/outzide-card-${width}.png`,fullPage:false});
   console.log(JSON.stringify({environment:'local software Chromium',width,...state}));
  }
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
