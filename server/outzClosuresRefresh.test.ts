import test from 'node:test';
import assert from 'node:assert/strict';
import {getOutzClosures} from './outzClosures';
import {winterResorts} from '../shared/outzWinterCatalog';
test('winter closure refresh survives Forest Service failure and removes seasonal status when reopened',async()=>{
 const originalFetch=globalThis.fetch,originalNow=Date.now;
 let now=originalNow(),open=false;Date.now=()=>now;
 globalThis.fetch=async(input)=>{
  if(String(input).includes('apps.fs.usda.gov'))throw Error('Forest Service offline');
  return new Response(open?'Winter operations are open':'Winter operations: closed for the season');
 };
 try{
  const closed=await getOutzClosures();assert.equal(closed.statuses.length,winterResorts.length);assert.ok(closed.statuses.every(s=>s.status==='seasonal'));
  open=true;now+=6*60_000;
  const reopened=await getOutzClosures();assert.equal(reopened.statuses.length,winterResorts.length);assert.ok(reopened.statuses.every(s=>s.status==='open'));
 }finally{globalThis.fetch=originalFetch;Date.now=originalNow;}
});
