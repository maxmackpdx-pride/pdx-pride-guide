import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createFoodFinder,normalizeFoodResource,foodText} from './foodResources';
const location=(id='pantry')=>({id,name:'Community Pantry',address:'123 Main St\n Portland OR 97215',location_categories:[{id:4}],grouped_location_hours:[{days:[3],open_time:'2026-11-07T17:00',close_time:'2026-11-07T18:30'}],hours_comment:'<p>1st &amp; 3rd Wednesdays only.</p>',comment:'Call for an appointment.',website:['{}','javascript:alert(1)','https://pantry.example.org'],phone:'503-555-0100',served_areas:['Local households'],location_closures:[]});
const response=(locations:unknown[],meta={page:1,count:25,total_pages:1,total_count:locations.length})=>new Response(JSON.stringify({locations,meta:{pagination:meta}}),{headers:{'Content-Type':'application/json'}});
test('retains service restrictions and recurrence, uses source weekday instead of fabricated date',()=>{
 const result=normalizeFoodResource(location())!;assert.equal(result.website,'https://pantry.example.org/');assert.equal(result.hours[0],'Wed · 5 pm to 6:30 pm');assert.match(result.notes,/1st & 3rd Wednesdays only/);assert.match(result.notes,/appointment/);assert.equal(result.onlineUrl,null);assert.equal(result.serviceArea,'Local households');
});
test('unsafe or absent websites fall back to explicit source link; source HTML stays plain text',()=>{
 const result=normalizeFoodResource({...location(),website:['{}','javascript:alert(1)'],comment:'<a href="javascript:evil()">Visit</a>'})!;assert.equal(result.website,null);assert.equal(result.sourceUrl,'https://foodfinder.oregonfoodbank.org/locations/pantry');assert.equal(result.notes.includes('<a'),false);assert.equal(foodText('&#x110000; &amp; food'),'& food');assert.equal(normalizeFoodResource({name:'Incomplete'}),null);
});
test('online ordering is explicit; appointments are not mislabeled as ordering',()=>{
 assert.equal(normalizeFoodResource({...location(),website:['https://pantry.example.org/order-online']})!.onlineLabel,'Order online');const csc=normalizeFoodResource(location('clackamas-service-center-day-and-night-markets'))!;assert.equal(csc.onlineLabel,'Appointments & delivery');assert.equal(csc.onlineUrl,'https://www.cscoregon.org/order-online');
});
test('maps ZIP and category correctly, caches requests, serves dated stale results on failure',async()=>{
 let calls=0,clock=Date.now(),fail=false;const fake=async(input:RequestInfo|URL)=>{calls++;const u=new URL(String(input));assert.equal(u.origin,'https://foodfinder.oregonfoodbank.org');assert.equal(u.searchParams.get('user_search'),'97215');assert.equal(u.searchParams.get('location_categories[]'),'4');if(fail)throw new Error('offline');return response([location()]);};const lookup=createFoodFinder(fake as typeof fetch,()=>clock);const first=await lookup('97215','groceries');assert.equal(first.resources.length,1);assert.equal(first.stale,false);await lookup('97215','groceries');assert.equal(calls,1);clock+=31*60_000;fail=true;const stale=await lookup('97215','groceries');assert.equal(stale.stale,true);assert.equal(stale.fetchedAt,first.fetchedAt);clock+=25*60*60_000;await assert.rejects(()=>lookup('97215','groceries'));
});
test('SNAP campaign and requested page return detailed rows rather than the other map pins',async()=>{
 const lookup=createFoodFinder((async(input:RequestInfo|URL)=>{const u=new URL(String(input));assert.equal(u.searchParams.get('active_campaign'),'true');assert.equal(u.searchParams.get('page'),'2');assert.equal(u.searchParams.has('location_categories[]'),false);return response([{id:'map-only',name:'Map only',address:'Address'},location('page-two')],{page:2,count:1,total_pages:2,total_count:2});}) as typeof fetch);const data=await lookup('97215','snap',2);assert.equal(data.resources[0].id,'page-two');assert.equal(data.totalPages,2);assert.match(data.sourceUrl,/campaign=1/);
});
test('concurrent lookups share one upstream request',async()=>{
 let calls=0;const lookup=createFoodFinder((async()=>{calls++;await new Promise(resolve=>setTimeout(resolve,5));return response([location()]);}) as typeof fetch);await Promise.all([lookup('97215','meals'),lookup('97215','meals')]);assert.equal(calls,1);
});
