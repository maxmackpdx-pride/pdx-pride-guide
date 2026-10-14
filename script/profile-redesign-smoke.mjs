/** Synthetic fixtures only; every API is intercepted. No production writes. */
import { createRequire } from 'node:module';
const testRequire=createRequire(process.env.PLAYWRIGHT_PACKAGE_ROOT || '/Users/tuckercasey/Projects/Zaylist/zaylist-foundation-library/package.json');
const {chromium,expect}=testRequire('@playwright/test');
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
const results=[];
const base=process.env.PROFILE_TEST_URL || 'http://localhost:5076';
const fixture={username:'profile_demo',displayName:'River Demo',bio:'Synthetic queer community profile for testing.',photoUrl:'/brand/family/giftz.png',avatarRing:'none',pronouns:'they/them',location:'Portland',memberSince:'2026-01-01',talents:['DJ'],roles:['Host'],standFor:['Chosen family'],socialLinks:{website:'https://example.com',instagram:'riverdemo'},profilePhotos:[{url:'/brand/family/giftz.png',caption:'Synthetic photo fixture'}],profileEmbeds:[{id:'sound',src:'https://w.soundcloud.com/player/?url=https://api.soundcloud.com/tracks/1',title:'Example player'}],top8:[],stats:{followers:3,hosting:0,going:0,posts:0,gigs:0,gifting:0,checkIns:0},activity:{hostedEvents:[],hostedEventsPast:[],goingTo:[],attendedPast:[],gigs:[],gifting:[],spotted:[]},outzAdventures:{upcoming:[],previous:[]}};
try {
 for(const width of (process.env.PROFILE_TEST_WIDTHS || "320,390,1320").split(",").map(Number)) for(const state of (process.env.PROFILE_TEST_STATES || 'rich,owner,blocked,empty,error').split(',')) {
  console.log("SCENARIO",width,state);
  const context=await browser.newContext({viewport:{width,height:900}}); const page=await context.newPage();page.setDefaultTimeout(10000);page.setDefaultNavigationTimeout(15000);let followCalls=0,rsvpCalls=0;
  await page.route('**/api/**',async route=>{const path=new URL(route.request().url()).pathname;
   if(path==='/api/users/profile_demo')return route.fulfill({status:state==='error'?500:200,json:state==='error'?{error:'Synthetic failure'}:{...fixture,isOwner:state==='owner',...(state==='empty'?{bio:null,talents:[],roles:[],standFor:[],socialLinks:{},profilePhotos:[],profileEmbeds:[]}:{}),...(state==='board'?{activity:{...fixture.activity,gigs:[{id:888,title:'Synthetic Community Gig',description:'Fictional opportunity',status:'LIVE',createdAt:'2026-10-13T12:00:00Z'}]}}:{}),...(state==='activity'?{activity:{...fixture.activity,hostedEvents:[{id:999,title:'Synthetic Pride Dance',venueName:'Example Venue',dateStart:'2030-10-20T20:00:00Z',dateEnd:'2030-10-21T01:00:00Z',dayOfWeek:'SUN',posterImageUrl:'/brand/family/giftz.png'}],goingTo:[{id:999,title:'Synthetic Pride Dance',venueName:'Example Venue',dateStart:'2030-10-20T20:00:00Z',dateEnd:'2030-10-21T01:00:00Z',dayOfWeek:'SUN',posterImageUrl:'/brand/family/giftz.png'}]}}:{}),blockStatus:{blockedByViewer:state==='blocked',interactionBlocked:state==='blocked',blockedViewer:false}}});
   if(path==='/api/gigs/888')return route.fulfill({json:{id:888,userId:2,name:'Synthetic Poster',username:'viewer_demo',skills:'Community',location:'Portland',compensation:'Volunteer',title:'Synthetic Community Gig',description:'Fictional opportunity',postType:'POSTING_GIG',status:'LIVE',createdAt:'2026-10-13T12:00:00Z',isMine:false}});
   if(path==='/api/events/999/attendance'){rsvpCalls++;return route.fulfill({json:{success:true}});}
   if(path==='/api/events/999')return route.fulfill({json:{id:999,title:'Synthetic Pride Dance',venueName:'Example Venue',dateStart:'2030-10-20T20:00:00Z',dateEnd:'2030-10-21T01:00:00Z',dayOfWeek:'SUN',posterImageUrl:'/brand/family/giftz.png',status:'LIVE'}});
   if(path==='/api/auth/me')return route.fulfill({json:{id:state==='owner'?1:2,username:state==='owner'?'profile_demo':'viewer_demo',displayName:'Test Viewer',avatarChoice:1,avatarRing:'none'}});
   if(path.endsWith('/follow')){followCalls++;await new Promise(r=>setTimeout(r,1000));return route.fulfill({json:{success:true}});}
   if(path.startsWith('/api/hub/feed'))return route.fulfill({json:{items:[],nextCursor:null}});
   if(path.includes('attendance-summaries'))return route.fulfill({json:{}});
   return route.fulfill({json:[]});
  });
  await page.route('https://w.soundcloud.com/**',route=>route.fulfill({contentType:'text/html',body:'<p>Mock player</p>'}));
  const start=Date.now();await page.goto(`${base}/u/profile_demo`,{waitUntil:"domcontentloaded"});console.log("LOADED",width,state);
  if(state==='error'){await page.getByText('We couldn’t load this profile.',{exact:true}).waitFor();results.push({width,state,elapsed:Date.now()-start});await context.close();continue;}
  await page.locator('.pp-hero').waitFor().catch(async error=>{console.log('PAGE',await page.locator('body').innerText());await page.screenshot({path:'/private/tmp/profile-redesign-failure.png'});throw error;});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`overflow ${width}/${state}`);
  assert.equal(await page.locator('.pp-about__embed').count(),0,'player must not load before disclosure');
  if(state==='board'){await page.getByText('Synthetic Community Gig',{exact:true}).first().click();await page.getByRole('dialog',{name:'Gigz listing',exact:true}).waitFor().catch(async error=>{console.log('BOARD PAGE',await page.locator('body').innerText());throw error;});await page.keyboard.press('Escape');await expect(page.getByRole('dialog',{name:'Gigz listing',exact:true})).toHaveCount(0);}
  if(state==='activity'){const rsvp=page.getByRole('button',{name:'RSVP',exact:true});if(await rsvp.count()){await rsvp.first().click();await expect.poll(()=>rsvpCalls).toBe(1);}
   await page.getByText('Synthetic Pride Dance',{exact:false}).first().waitFor();await page.getByText('Synthetic Pride Dance',{exact:false}).first().click();await page.locator('.event-modal').waitFor();await page.getByLabel('Close event',{exact:true}).click();await expect(page.locator('.event-modal')).toHaveCount(0);}
  if(state==='blocked'){assert.equal(await page.getByTestId('profile-message').count(),0);assert.equal(await page.locator('.pp-btn--follow').isDisabled(),true);}
  if(state==='rich'){
   const follow=page.locator('.pp-btn--follow');await follow.click();await expect(follow).toBeDisabled();await page.waitForTimeout(1100);assert.equal(followCalls,1);
   const message=page.getByTestId('profile-message');await message.click();await page.getByRole('dialog',{name:/Message River/}).waitFor();await page.keyboard.press('Escape');await message.waitFor();assert.equal(await message.evaluate(el=>el===document.activeElement),true);
   await page.getByText('Example player',{exact:true}).click();await page.locator('.pp-about__embed').waitFor();assert.equal(await page.locator('.pp-about__embed').getAttribute('sandbox'),'allow-scripts allow-same-origin allow-popups');
   await page.getByTestId('profile-share').click();await page.locator('.pp-share-pop__image img').waitFor();assert.match(await page.locator('.pp-share-pop__image img').getAttribute('alt'),/Follow .* on Zaylist/);await page.keyboard.press('Escape');
  }
  if(state==='owner'){await page.getByRole('button',{name:'Set your Top 8',exact:true}).click();await page.getByRole('dialog',{name:'Edit Top 8',exact:true}).waitFor();await page.getByRole('dialog',{name:'Edit Top 8',exact:true}).getByLabel('Close',{exact:true}).click();await expect(page.getByRole('dialog',{name:'Edit Top 8',exact:true})).toHaveCount(0);assert.equal(await page.getByLabel('Edit profile',{exact:true}).count()>0,true);await page.getByLabel('Profile accent',{exact:true}).click();await page.keyboard.press('Escape');}
  if(state!=='empty'){
   await page.getByRole('button',{name:'Arrange view',exact:true}).click();const item=page.locator('[data-widget-id]').first();await item.waitFor();await item.focus();await page.keyboard.press('Alt+ArrowDown');await page.getByRole('button',{name:'Reset layout',exact:true}).click();assert.ok(await page.evaluate(()=>localStorage.getItem('zaylist:profile-layout:v1:profile_demo')));await page.getByRole('button',{name:'Done arranging',exact:true}).click();
  }
  if(state!=='owner')assert.equal(await page.locator('.pp-adventures').count(),0,'private adventures owner only');
  if(state==='rich'){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`/private/tmp/profile-redesign-${width}.png`});}
  results.push({width,state,elapsed:Date.now()-start});await context.close();
 }
 console.log(JSON.stringify({fixture:'synthetic mocked APIs',results},null,2));
}finally{await browser.close();}
