import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
const base=new URL('../client/public/outzide-map/',import.meta.url);
const {places}=JSON.parse(await readFile(new URL('places.json',base),'utf8'));
test('every destination has unique identity and shipped artwork',async()=>{
 assert.equal(places.length,346);assert.equal(new Set(places.map(p=>p.id)).size,places.length);
 for(const place of places){assert.ok(place.name);assert.ok(place.art.startsWith('assets/'));await access(new URL(place.art,base));}
});
test('production map retains live beach data and never uses session-only social writes',async()=>{
 const source=await readFile(new URL('app.js',base),'utf8');
 assert.ok(source.includes("fetch('/api/nude-beaches'"));assert.ok(!source.includes('sessionStorage'));
 assert.ok(!source.includes('Prototype check-in'));assert.ok(source.includes("api('wall','POST'"));
 assert.ok(source.includes("api('checkins','POST'"));assert.ok(source.includes("response.status===401"));
});

test('activity expansion has requested counts, sourced locations and individual artwork',async()=>{
 const additions=places.filter(p=>p.collection==='outz-activities-2026');
 assert.equal(additions.length,110);
 for(const state of ['OR','WA'])for(const [kind,count] of Object.entries({fishing:30,boating:15,atv:10}))
  assert.equal(additions.filter(p=>p.state===state&&p.kind===kind).length,count,state+' '+kind);
 assert.equal(new Set(additions.map(p=>p.art)).size,110);
 const shared=await readFile(new URL('../shared/outzMapCatalog.ts',import.meta.url),'utf8');
 for(const p of additions){
  assert.ok(p.lat>=41.9&&p.lat<=49.1&&p.lng>=-125&&p.lng<=-116,'OR/WA coordinates');
  assert.ok(p.officialUrl.startsWith('https://'));assert.ok(p.sourceName);assert.ok(p.sourceCheckedAt);
  assert.ok(['agency-area','approximate-area'].includes(p.locationPrecision));
  assert.ok(shared.includes(p.id),'backend recognizes destination');
  if(p.kind==='atv')assert.equal(p.accent,'#D95757');
 }
});

test('day-use destinations add ten per state without repeating earlier places',async()=>{
 const added=places.filter(p=>p.collection==='outz-dayuse-2026');assert.equal(added.length,20);
 for(const state of ['OR','WA'])assert.equal(added.filter(p=>p.state===state).length,10);
 const priorNames=new Set(places.filter(p=>p.collection!=='outz-dayuse-2026').map(p=>p.name.toLowerCase()));
 for(const p of added){assert.ok(!priorNames.has(p.name.toLowerCase()));assert.equal(p.kind,'dayuse');assert.equal(p.locationPrecision,'agency-area');assert.ok(Number.isFinite(p.lat)&&Number.isFinite(p.lng));assert.ok(p.officialUrl.startsWith('https://'));const art=await readFile(new URL(p.art,base),'utf8');assert.ok(art.includes('<circle'),'sun artwork');}
});
