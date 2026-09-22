import test from 'node:test';import assert from 'node:assert/strict';
import {freshness,parseMeadows,parseBachelor,parseReportHtml,parsePassPrices} from './outzWinter';
import {publicWinterEvents,explicitWinterPrideEvent} from '../shared/outzWinterEvents';
test('missing snowfall stays unknown; metric measurements convert without coercing null to zero',()=>{const p=parseMeadows({data:{snow:{snowZones:[{altitudeLevel:'LOW',snowTotalDepth:{value:25.4,unit:'CENTIMETER'}}]}}},{data:[]},'https://example.com');assert.equal(p.snow24In,null);assert.equal(p.baseIn,10);assert.equal(p.freshness,'unknown')});
test('off-season reports and lift timestamps retain their age',()=>{const p=parseBachelor([{updated:1,base_depth:0,unit_of_measurement:'in',computed:{'24_hour':0}}],[{name:'Old chair',season:'winter',status:'closed',updated:1},{name:'Bike lift',season:'summer',status:'open'}],'https://example.com');assert.equal(p.freshness,'stale');assert.equal(p.lifts.length,1);assert.equal(p.snow24In,0);assert.equal(freshness(null),'unknown');assert.equal(freshness(new Date(Date.now()+86400000).toISOString()),'unknown')});
test('HTML reports extract explicit snowfall and lifts, never unrelated table statuses',()=>{const p=parseReportHtml('<p>3&quot; 24-Hour Snowfall</p><table><tr><td>Ariel Double Chair</td><td>Closed</td></tr><tr><td>Main parking lot</td><td>Open</td></tr></table>','https://example.com');assert.equal(p.snow24In,3);assert.equal(p.baseIn,null);assert.deepEqual(p.lifts,[{name:'Ariel Double Chair',status:'Closed'}])});
test('pass cost text keeps age and restrictions together',()=>{assert.deepEqual(parsePassPrices('<table><td>ADULT Age 20-69 $649 No blackout dates</td><td>Parking $5</td></table>'),['ADULT Age 20-69 $649 No blackout dates'])});
test('resort event holograms use only future public LIVE LGBTQ+ events with exact resort identity',()=>{const base={id:1,title:'Pride Day',description:'LGBTQ+ ski weekend',venueName:'Mt. Hood Meadows',status:'LIVE',isPublic:true,isPrivate:false,dateStart:'2027-03-01T17:00:00Z',dateEnd:'2027-03-02T01:00:00Z'};const now=Date.parse('2026-09-22');assert.equal(publicWinterEvents([base],now)[0].placeId,'winter-meadows');for(const patch of [{status:'HIDDEN'},{status:'CANCELED'},{isPrivate:true},{dateEnd:'2025-03-02'},{venueName:'Meadows Bar'},{title:'Banked slalom',description:'Take pride in your skills'}])assert.equal(publicWinterEvents([{...base,...patch}],now).length,0);assert.equal(explicitWinterPrideEvent({title:'Pride of the mountain race'}),false)});
test('winter event card links back to the canonical event, with no synthetic listing',async()=>{
 const original=globalThis.fetch;
 try {
  globalThis.fetch=(async()=>({ok:true,json:async()=>({events:[{id:42,placeId:'winter-bachelor',title:'Pride Ski Day',dateStart:'2099-02-27T17:00:00Z',dateEnd:'2099-02-28T01:00:00Z'}]})})) as any;
  const ui=await import('../client/public/outzide-map/assets/winter-cards.js');
  await ui.refreshWinterEvents();assert.equal(ui.activeWinterEvents('winter-bachelor').length,1);
  const html=ui.winterCard({kind:'winter',id:'winter-bachelor',winter:{reportUrl:'https://example.com',passUrl:'https://example.com',priceNote:'Date-specific'}});
  assert.ok(html.includes('/events/42'));assert.ok(html.includes('Pride Ski Day'));
 }finally{globalThis.fetch=original}
});
