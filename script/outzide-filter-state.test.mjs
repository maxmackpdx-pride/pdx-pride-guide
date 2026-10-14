import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {hasActiveOutzFilters} from '../client/public/outzide-map/assets/filter-state.js';
import {browseRegions,browseRegionFor,matchesBrowse} from '../client/public/outzide-map/assets/browse-regions.js';
const clean={region:'all',kind:'all',hiddenKinds:new Set(),query:'',browseRegion:null,activities:[]};
test('region-only selection exposes Reset, while the clear state hides it',()=>{
 assert.equal(hasActiveOutzFilters(clean),false);
 for(const region of ['OR','WA'])assert.equal(hasActiveOutzFilters({...clean,region}),true);
 for(const patch of [{kind:'trail'},{hiddenKinds:new Set(['camp'])},{query:'Portland'},{browseRegion:'portland-gorge'},{activities:['trail']}])assert.equal(hasActiveOutzFilters({...clean,...patch}),true);
});
test('actual runtime filtering applies selected region AND selected activity families',()=>{
 const source=readFileSync(new URL('../client/public/outzide-map/app.js',import.meta.url),'utf8');
 const body=source.match(/function filtered\(\)\{([^\n]+)\}/)[1];
 const filter=new Function('places','state','kinds','matchesBrowse','browseRegionFor','browseRegions',body);
 const places=[{name:'OR trail',kind:'trail',state:'OR',region:'Portland',lat:45.5,lng:-122.3},{name:'WA trail',kind:'trail',state:'WA',region:'Seattle',lat:47.6,lng:-122.3},{name:'OR camp',kind:'camp',state:'OR',region:'Portland',lat:45.5,lng:-122.3},{name:'OR beach',kind:'beach',state:'OR',region:'Portland',lat:45.5,lng:-122.3}];
 const selected=filter(places,{...clean,region:'OR',activities:['trail','camp']},{trail:'Hike',camp:'Camp',beach:'Beach'},matchesBrowse,browseRegionFor,browseRegions);
 assert.deepEqual(selected.map(p=>p.name),['OR trail','OR camp']);
 assert.match(source,/reset-filters'\)\.hidden=!hasActiveOutzFilters\(state\)/);
});
