import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
const base=new URL('../client/public/outzide-map/',import.meta.url);
const {places}=JSON.parse(await readFile(new URL('places.json',base),'utf8'));
test('every destination has unique identity and shipped artwork',async()=>{
 assert.equal(places.length,216);assert.equal(new Set(places.map(p=>p.id)).size,places.length);
 for(const place of places){assert.ok(place.name);assert.ok(place.art.startsWith('assets/'));await access(new URL(place.art,base));}
});
test('production map retains live beach data and never uses session-only social writes',async()=>{
 const source=await readFile(new URL('app.js',base),'utf8');
 assert.ok(source.includes("fetch('/api/nude-beaches'"));assert.ok(!source.includes('sessionStorage'));
 assert.ok(!source.includes('Prototype check-in'));assert.ok(source.includes("api('wall','POST'"));
 assert.ok(source.includes("api('checkins','POST'"));assert.ok(source.includes("response.status===401"));
});
