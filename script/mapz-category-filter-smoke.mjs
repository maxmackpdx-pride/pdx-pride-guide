/** Synthetic API fixtures only: no live reads or writes. */
import {createRequire} from 'node:module';
const require=createRequire('/Users/tuckercasey/Projects/Zaylist/zaylist-foundation-library/package.json');
const {chromium,expect}=require('@playwright/test');
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 const context=await browser.newContext({viewport:{width:390,height:900}}),page=await context.newPage();page.setDefaultTimeout(15000);
 const places=[{id:1,type:'bar',name:'Synthetic Bar Alpha'},{id:2,type:'bar',name:'Synthetic Bar Beta'},{id:3,type:'cafe',name:'Synthetic Cafe'}].map(p=>({...p,description:'Fixture',lat:null,lng:null,neighborhood:'North',queerOwned:false,queerFriendly:true,imageUrl:null,events:[],pastEvents:[],gigs:[]}));
 await page.route('**/api/**',route=>{const path=new URL(route.request().url()).pathname;if(path==='/api/auth/me')return route.fulfill({status:401,json:{}});if(path==='/api/directory')return route.fulfill({json:places});if(path==='/api/events/attendance-summaries')return route.fulfill({json:{}});return route.fulfill({json:[]});});
 await page.goto('http://localhost:5087/map?layer=places&placeTypes=bar&lat=45.52&lng=-122.67&zoom=15',{waitUntil:'domcontentloaded'});
 const panel=page.getByRole('region',{name:'Placez in this map',exact:true});
 await expect(panel).toBeVisible();
 const names=()=>panel.locator('.mapz-layer-row strong').allTextContents();
 await expect.poll(names).toEqual(['Synthetic Bar Alpha','Synthetic Bar Beta']);
 await expect(panel.getByRole('button',{name:'Clear filters',exact:true})).toBeVisible();
 await expect(panel.getByRole('button',{name:'Remove place category filter',exact:true})).toBeVisible();
 await panel.getByRole('button',{name:'Clear filters',exact:true}).click();
 await expect.poll(names).toEqual(['Synthetic Bar Alpha','Synthetic Bar Beta','Synthetic Cafe']);
 const url=new URL(page.url());expect(url.searchParams.has('placeTypes')).toBe(false);for(const [key,value]of[['layer','places'],['lat','45.52'],['lng','-122.67'],['zoom','15']])expect(url.searchParams.get(key)).toBe(value);
 await expect(panel.getByRole('button',{name:'Remove place category filter',exact:true})).toHaveCount(0);
 await page.screenshot({path:'/private/tmp/mapz-category-filter-reset-390.png'});
 console.log('PASS Mapz actual DOM: category-only Clear/chip visible, 2 bars -> all 3 rows; layer/camera parameters preserved.');
 await context.close();
}finally{await browser.close();}
