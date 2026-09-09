import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import { copyFileSync,mkdirSync,mkdtempSync,rmSync } from 'node:fs';
import path from 'node:path';
import { haversineMeters } from '@shared/geo';
mkdirSync('.local',{recursive:true});
const dir=mkdtempSync(path.resolve('.local/outz-details-test-'));
process.env.DATABASE_PATH=path.join(dir,'data.db');
copyFileSync('data.db',process.env.DATABASE_PATH);
const {forecastDays,usfsFacts,forestVisitorFacts,getOutzDetails}=await import('./outzDetails');
const {sqlite}=await import('./storage');
after(()=>{sqlite.close();rmSync(dir,{recursive:true,force:true});});
test('forecast preserves evening-only periods, converts Celsius and limits seven dates',()=>{
 const periods=Array.from({length:16},(_,i)=>({startTime:`2026-09-${String(8+Math.floor(i/2)).padStart(2,'0')}T${i%2?'18':'06'}:00:00-07:00`,isDaytime:i%2===0,temperature:i%2?10:20,temperatureUnit:'C',shortForecast:'Clear',probabilityOfPrecipitation:{value:i%2?20:0}}));
 const days=forecastDays(periods.slice(1),Date.parse('2026-09-08T20:00:00-07:00'));
 assert.equal(days.length,7);assert.equal(days[0].highF,null);assert.equal(days[0].lowF,50);assert.equal(days[1].highF,68);assert.equal(days[1].rainChance,20);
});
test('USFS records omit placeholder elevations and never infer parking from generic capacity',()=>{
 const facts=usfsFacts({minimum_elevation:' feet',total_capacity:40,fee_charged:'N',water_availability:'None',restroom_availability:'<p>Vault toilet</p>'},'https://example.test');
 assert.equal(facts.length,2);assert.equal(facts[0].value,'Vault toilet');assert.ok(!JSON.stringify(facts).includes('40'));
});
test('visitor-page amenities retain negative availability and parking wording',()=>{
 const facts=forestVisitorFacts('<h3>Parking</h3><div><p>Parking for 36 vehicles.</p></div><h3>Restrooms</h3><p>Restrooms are not available.</p><h3>Water</h3><p>Potable water is not available.</p>','https://www.fs.usda.gov/');
 assert.equal(facts.length,3);assert.equal(facts[0].value,'Parking for 36 vehicles.');assert.match(facts[2].value,/not available/);
});
test('unknown destinations cannot trigger arbitrary source requests',async()=>{
 const result=await getOutzDetails('https://localhost/',{destinations:[],catalog:[],communityStays:[],sources:[],fetchedAt:''});assert.equal(result,null);
});
test('distance is straight-line miles with zero at same point',()=>{
 assert.equal(haversineMeters({lat:45,lng:-122},{lat:45,lng:-122}),0);
 const miles=haversineMeters({lat:0,lng:0},{lat:0,lng:1})/1609.344;assert.ok(miles>69&&miles<70);
});
