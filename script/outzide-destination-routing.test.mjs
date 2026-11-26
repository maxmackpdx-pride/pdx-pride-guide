import assert from 'node:assert/strict';
import {test} from 'node:test';
import {outzDestinationSelection,outzDestinationClosedUrl} from '../client/src/lib/mapBookmarks.ts';

test('map pin, legacy bookmarks and share links resolve the same host card ID',()=>{
 const molalla='molalla-river-trails';
 for(const [path,query] of [
  ['/outzide','?item='+molalla],
  ['/outzide','?place='+molalla],
  ['/outzide','?guestPlace='+molalla],
  ['/outzide/share/'+molalla,''],
  ['/map','?mode=outzide&item='+molalla],
 ])assert.equal(outzDestinationSelection(path,new URLSearchParams(query),'outzide'),molalla);
 assert.equal(outzDestinationSelection('/outzide/share/%z',new URLSearchParams(),'outzide'),undefined);
 assert.equal(outzDestinationSelection('/outzide/share/%2Froot',new URLSearchParams(),'outzide'),undefined);
 assert.equal(outzDestinationSelection('/map',new URLSearchParams('item=board-post-10'),'boardz'),undefined);
});

test('closing a destination clears selection only, keeping the camera and other route state',()=>{
 const query='mode=outzide&lat=45.54&lng=-122.42&zoom=8.4&pitch=35&bearing=0';
 for(const path of ['/outzide','/outzide/share/molalla-river-trails','/map']){
  const opened=new URL('https://example.test'+path+'?'+query+'&item=molalla-river-trails&place=old&guestPlace=old&wall=1&tab=community#map');
  assert.equal(outzDestinationClosedUrl(opened),(path.startsWith('/outzide')?'/outzide':'/map')+'?'+query+'#map');
 }
});
