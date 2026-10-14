/** Synthetic inventory; every API request is intercepted, including writes. */
import {createRequire} from 'node:module';import assert from 'node:assert/strict';
const {chromium,expect}=createRequire(process.env.PLAYWRIGHT_PACKAGE_ROOT || '/Users/tuckercasey/Projects/Zaylist/zaylist-foundation-library/package.json')('@playwright/test');
const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:390,height:900}});
page.setDefaultTimeout(10000);page.setDefaultNavigationTimeout(15000);
const base=process.env.BOARD_FILTER_TEST_URL || 'http://localhost:5087';
const common={userId:7,username:'fixture',name:'Fixture',description:'Fixture description',createdAt:'2026-10-13T12:00:00Z',isDemo:true};
const gigs=Array.from({length:30},(_,i)=>({...common,id:i+1,title:`Gig ${i+1}`,postType:i===0?'LOOKING_FOR_WORK':'POSTING_GIG',status:'LIVE',skills:'Design',location:i===1?'North':'SE',isRemote:i===1,compensation:'$25'}));
const gifts=[{...common,id:101,title:'Give chair',postType:'GIFT',status:'OPEN',category:'Furniture',neighborhood:'SE',pickupPreference:'Arrange pickup',photoUrls:[]},{...common,id:102,title:'Seek books',postType:'ISO',status:'LOOKING',category:'Books',neighborhood:'North',pickupPreference:'Arrange pickup',photoUrls:[]}];
const sells=[{...common,id:201,title:'Cheap chair',status:'ACTIVE',priceCents:2400,category:'Furniture',condition:'Good',neighborhood:'SE',photoUrls:[]},{...common,id:202,title:'Other chair',status:'ACTIVE',priceCents:5000,category:'Furniture',condition:'Like new',neighborhood:'North',photoUrls:[]}];
const missed=[{...common,id:301,title:'At the event',body:'Connection',status:'ACTIVE',eventId:1,placeName:'SE'},{...common,id:302,title:'At the beach',body:'Connection',status:'ACTIVE',beachId:'rooster',placeName:'Rooster'}];
await page.route('**/api/**',r=>{const p=new URL(r.request().url()).pathname;const data=p==='/api/gigs'?gigs:p==='/api/gifting'?gifts:p==='/api/sellz'?sells:p==='/api/missed-connections'?missed:p==='/api/housing'?{posts:[],stats:{}}:[];if(p==='/api/auth/me')return r.fulfill({status:401,json:{error:'Guest'}});return r.fulfill({json:data});});
async function filters(){if(!await page.getByRole('combobox',{name:'Post type',exact:true}).isVisible())await page.getByRole('button',{name:'Filter board posts',exact:true}).click();}
async function titles(expected){await expect(page.locator('.ab-card h3')).toHaveText(expected);}
try{
await page.goto(`${base}/boardz?board=gigz`,{waitUntil:'domcontentloaded'});await expect(page.locator('.ab-card')).toHaveCount(30);
await filters();await page.getByLabel('Remote opportunities',{exact:true}).check();await titles(['Gig 2']);
await page.getByRole('button',{name:'Giftz',exact:true}).click();await titles(['Seek books','Give chair']);assert.ok(!(await page.url()).includes('remote='));
await filters();await page.getByRole('combobox',{name:'Post type',exact:true}).selectOption('iso');await titles(['Seek books']);await page.getByRole('combobox',{name:'Post type',exact:true}).selectOption('all');await page.getByRole('combobox',{name:/^Category/}).selectOption('Furniture');await titles(['Give chair']);
await filters();await page.getByRole('combobox',{name:/^Category/}).selectOption('');await titles(['Seek books','Give chair']);await page.keyboard.press('Escape');
await page.getByRole('button',{name:'Sellz',exact:true}).click();await titles(['Other chair','Cheap chair']);await filters();await page.getByRole('combobox',{name:/^Price/}).selectOption('under25');await titles(['Cheap chair']);await filters();await page.getByRole('combobox',{name:/^Price/}).selectOption('');await titles(['Other chair','Cheap chair']);await page.keyboard.press('Escape');
await page.getByRole('button',{name:'Mizzed',exact:true}).click();await titles(['At the beach','At the event']);await filters();await page.getByRole('combobox',{name:/^Where you connected/}).selectOption('outzide');await titles(['At the beach']);await filters();await page.getByRole('combobox',{name:/^Where you connected/}).selectOption('');await titles(['At the beach','At the event']);await page.keyboard.press('Escape');
await page.goto(`${base}/boardz?board=giftz&intent=available&remote=1&condition=Good&price=under25`,{waitUntil:'domcontentloaded'});await titles(['Seek books','Give chair']);
await page.goto(`${base}/boardz?board=sellz&price=bad`,{waitUntil:'domcontentloaded'});await titles(['Other chair','Cheap chair']);
await page.goto(`${base}/boardz?board=gigz&mine=1`,{waitUntil:'domcontentloaded'});await expect(page.locator('.ab-card')).toHaveCount(0);
console.log('PASS category completeness, remote, category, intent, price, source, hidden stale links, invalid values, guest mine scope');
}finally{await browser.close();}
