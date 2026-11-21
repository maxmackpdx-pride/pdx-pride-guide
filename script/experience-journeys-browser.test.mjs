import assert from 'node:assert/strict';
import test from 'node:test';
import {chromium} from 'playwright';

const baseURL = process.env.ZAYLIST_JOURNEY_TEST_URL;

test('Eventz restores poster history, search paginates and failed sources remain distinct from empty results', {skip:!baseURL,timeout:90_000}, async () => {
  const browser = await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined});
  try {
    const page = await browser.newPage({baseURL,viewport:{width:900,height:830},reducedMotion:'reduce'});
    const now=Date.now()+3_600_000;
    const event={id:83420,title:'Portland Fixture Night',venueName:'Fixture Hall',dateStart:new Date(now).toISOString(),dateEnd:new Date(now+86_400_000).toISOString(),dayOfWeek:'FRI',admission:'UNKNOWN',ageRequirement:'UNVERIFIED',description:'Fixture event',address:'12 Test Ave',isPublic:true,isPrivate:false,isClaimable:true,eventTypes:'[]',status:'LIVE'};
    const hit=id=>({type:'event',id,name:`Fixture result ${id}`,url:`/events/${id}`});
    const writes=[],errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.route('**/api/**',async route=>{
      const request=route.request(),url=new URL(request.url()),path=url.pathname;
      if(request.method()!=='GET'&&!path.startsWith('/api/analytics')) writes.push(path);
      if(path==='/api/auth/session') return route.fulfill({contentType:'application/json',body:'null'});
      if(path==='/api/events') return route.fulfill({json:[event]});
      if(path==='/api/events/83420/detail'||path==='/api/directory') return route.fulfill({status:503,json:{error:'temporarily unavailable'}});
      if(path==='/api/events/83420') return route.fulfill({json:event});
      if(path==='/api/v1/search') {
        if(url.searchParams.get('q')==='failme') return route.fulfill({status:503,json:{}});
        return route.fulfill({json:url.searchParams.get('cursor')?{data:[hit(3)],meta:{}}:{data:[hit(1),hit(2)],meta:{nextCursor:'2'}}});
      }
      if(path==='/api/ads/serve') return route.fulfill({json:{ads:[]}});
      if(path==='/api/card-notifications') return route.fulfill({json:{placez:[],scenez:[],outzide:[]}});
      if(path.endsWith('/planning')) return route.fulfill({json:{title:event.title,open:true,canPostGig:false,gigs:[],rides:null}});
      return route.fulfill({json:[]});
    });
    await page.goto('/events');
    const poster=page.locator('.poster[data-event-id="83420"]').first();
    await poster.waitFor();
    await page.getByRole('textbox',{name:'Search events'}).fill('Portland');
    await page.waitForURL(/q=Portland/);
    await poster.click();
    const dialog=page.getByRole('dialog',{name:event.title});
    await dialog.getByRole('button',{name:/Going · Public/}).waitFor();
    await dialog.getByRole('button',{name:/Save privately/}).waitFor();
    await dialog.getByRole('tab',{name:'PEOPLE'}).click();
    await dialog.getByRole('button',{name:'Try again'}).first().waitFor();
    assert.equal(await dialog.getByText('Open to claim',{exact:true}).isVisible(),false);
    await page.goBack();
    await dialog.waitFor({state:'hidden'});
    assert.match(page.url(),/q=Portland/);
    await page.goForward();
    await dialog.getByRole('button',{name:'Close event',exact:true}).click();
    await dialog.waitFor({state:'hidden'});

    await page.keyboard.press('Control+k');
    const input=page.getByRole('combobox');
    await input.fill('fixture');
    await page.getByRole('option',{name:/Fixture result 1/}).waitFor();
    await page.getByRole('button',{name:/Load more results/}).click();
    await page.getByRole('option',{name:/Fixture result 3/}).waitFor();
    await input.fill('failme');
    await page.getByRole('button',{name:'Try again'}).waitFor();
    await page.keyboard.press('Escape');

    await page.goto('/directory');
    await page.getByRole('button',{name:'Try again'}).first().waitFor();
    assert.equal(await page.getByText('No places match these filters.').count(),0);
    assert.deepEqual(writes,[]);
    assert.deepEqual(errors,[]);
  } finally {
    await browser.close();
  }
});
