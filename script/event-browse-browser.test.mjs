import assert from 'node:assert/strict';
import test from 'node:test';
import {chromium} from 'playwright';
const base=process.env.EVENT_FILTER_TEST_URL;
const fixtures=Array.from({length:70},(_,index)=>{const id=index+1;const date=id<=35?'2026-10-13':'2026-10-14';return {id,title:`${String(id).padStart(2,'0')} ${id===7||id===8?'Needle':'Fixture'}`,venueName:'Fixture venue',description:'Fixture only',dateStart:`${date}T19:00:00-07:00`,dateEnd:`${date}T21:00:00-07:00`,dayOfWeek:id<=35?'TUE':'WED',admission:id%2===0?'FREE':'TICKETED',ageRequirement:id%3===0?'ALL_AGES':'21_PLUS',isPublic:true,isSexPositive:id%2===0,isHouseParty:false,nudityOk:false,eventTypes:[],posterImageUrl:null};});
fixtures.push({...fixtures[0],id:71,title:'71 Past fixture',dateStart:'2026-10-10T19:00:00-07:00',dateEnd:'2026-10-10T21:00:00-07:00',admission:'FREE'});
test('Eventz filters return exact mocked records across deep links, history, clear and progressive grids',{skip:!base,timeout:90000},async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined});
 try{
  const page=await browser.newPage({viewport:{width:1320,height:900}});
  await page.clock.install({time:new Date('2026-10-13T20:00:00Z')});
  const writes=[];const errors=[];
  page.on("pageerror",error=>{errors.push(error.message);console.log("PAGEERROR",error.message);});
  await page.route('**/api/**',async route=>{
   const request=route.request(),path=new URL(request.url()).pathname;
   if(!['GET','HEAD'].includes(request.method())){if(!path.startsWith("/api/analytics/"))writes.push(path);return route.fulfill({json:{ok:true}});}
   if(path==='/api/auth/me')return route.fulfill({json:{id:999999,username:'fixture',displayName:'Fixture',avatarChoice:2,avatarRing:"pride"}});
   if(path==='/api/hub/feed')return route.fulfill({json:{items:[],nextCursor:null}});
   if(path==='/api/events')return route.fulfill({json:fixtures});
   if(path==='/api/events/mine/saved')return route.fulfill({json:[2,8]});
   if(path==='/api/events/mine'||path.includes('/attendance'))return route.fulfill({json:path.includes('/attendance')?{}:fixtures.filter(e=>[2,8].includes(e.id))});
   if(path==='/api/ads/serve')return route.fulfill({json:{ads:[]}});
   return route.fulfill({json:[]});
  });
  const url=query=>new URL(`/events?${query}`,base).href;
  const ids=async()=>page.locator('.events-card-feed .tonight-card__open,.events-rail-sec:not(.events-rail-sec--tomorrow):not(.events-week) .tonight-card__open,.events-rail-sec:not(.events-rail-sec--tomorrow):not(.events-week) .event-rail-card__open').evaluateAll(nodes=>nodes.map(node=>Number(node.getAttribute('aria-label')?.match(/^Open (\d+)/)?.[1])));
  async function expectIds(expected){
   try { await page.waitForFunction(n=>document.querySelector('[data-testid="events-result-count"]')?.textContent?.trim().startsWith(`${n} `),expected.length,{timeout:15000}); }
   catch(error){console.log('FIXTURE STATE',await page.locator('body').innerText());throw error;}
   for(let attempt=0;attempt<8&&(await ids()).length<expected.length;attempt++){await page.locator('.events-page').evaluate(node=>node.scrollIntoView({block:'end'})).catch(()=>{});await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));await page.waitForTimeout(120);}
   assert.deepEqual((await ids()).sort((a,b)=>a-b),[...expected].sort((a,b)=>a-b));
  }
  await page.goto(url('type=free'),{waitUntil:'domcontentloaded'});
  await expectIds(fixtures.filter(e=>e.id<=70&&e.admission==='FREE').map(e=>e.id));
  await page.goto(url('type=21%2B'),{waitUntil:'domcontentloaded'});
  await expectIds(fixtures.filter(e=>e.id<=70&&e.ageRequirement==='21_PLUS').map(e=>e.id));
  await page.goto(url('type=21%2B%7Call%20ages'),{waitUntil:'domcontentloaded'});
  await expectIds(Array.from({length:70},(_,i)=>i+1));
  await page.goto(url('type=21%2B%7Call%20ages&q=Needle'),{waitUntil:'domcontentloaded'});
  await expectIds([7,8]);
  await page.goBack({waitUntil:'domcontentloaded'});
  await page.goBack({waitUntil:'domcontentloaded'});
  await page.goBack({waitUntil:'domcontentloaded'});
  await expectIds(fixtures.filter(e=>e.id<=70&&e.admission==='FREE').map(e=>e.id));
  await page.goto(url('window=D%3A2026-10-14&type=FREE'),{waitUntil:'domcontentloaded'});
  await expectIds(fixtures.filter(e=>e.id>35&&e.id<=70&&e.admission==='FREE').map(e=>e.id));
  await page.goto(url('window=ALL&sort=title_za'),{waitUntil:'domcontentloaded'});
  await expectIds(Array.from({length:70},(_,i)=>i+1));
  assert.equal((await ids())[0],70,'sort must affect actual record order');
  await page.getByRole('button',{name:'Clear filters',exact:true}).click();
  await expectIds(Array.from({length:35},(_,i)=>i+1));
  assert.equal((await ids())[0],1,'clear resets sort to start time');
  await page.getByTestId('side-filter-type-FREE').click();
  await expectIds(fixtures.filter(e=>e.id<=70&&e.admission==='FREE').map(e=>e.id));
  await page.goto(url('past=1&window=ALL'),{waitUntil:'domcontentloaded'});await expectIds([71]);
  await page.goto(url('window=ALL'),{waitUntil:'domcontentloaded'});
  await page.getByTestId('toggle-calendar-view').click();
  await page.waitForURL(/tab=schedule/);
  assert.ok(await page.locator('.events-page__body--schedule').count(),'saved doorway opens native schedule');
  assert.deepEqual(writes,[],'read-only filter smoke must not mutate product data; analytics is mocked');
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
});
