import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {outzCategoryLabel} from './outzCategoryLabel';
import {destinationIdentity} from '../client/src/lib/outzDestinationBrowse';
test('real catalog categories override legacy trailhead labels by exact id lookup',()=>{
 const catalog=JSON.parse(readFileSync(new URL('../client/public/outzide-map/places.json',import.meta.url),'utf8')).places;
 for(const [id,label] of [['fishing-wa-riffe-lake','Fishing'],['fishing-or-lake-of-the-woods','Fishing'],['fishing-or-vernonia-lake','Fishing'],['dayuse-wa-peace-arch-historical-state-park','Day use']]){
  const row=catalog.find((r:{id:string})=>r.id===id);assert.ok(row, id);assert.equal(outzCategoryLabel(row.kind,'trailhead'),label);assert.equal(outzCategoryLabel(row.kind,'Hike'),label);
 }
});
test('canonical labels do not infer an unknown category from a name or default',()=>{
 assert.equal(outzCategoryLabel(undefined,'Camping · Hiking'),'Camping · Hiking');
 assert.equal(outzCategoryLabel('unknown','Hike'),'Hike');
 assert.equal(outzCategoryLabel('atv','trailhead'),'ATV / OHV');
 assert.equal(outzCategoryLabel('winter','trailhead'),'Winter');
});
test('closed cards and expanded conditions both use canonical category labels',()=>{
 const catalogKind='fishing';
 assert.equal(destinationIdentity('Riffe Lake','trailhead',catalogKind).kind,outzCategoryLabel(catalogKind,'Hike'));
 assert.match(readFileSync(new URL('../client/src/pages/OutzPlace.tsx',import.meta.url),'utf8'),/outzCategoryLabel\(fullCatalogSite\?\.kind,/);
});
