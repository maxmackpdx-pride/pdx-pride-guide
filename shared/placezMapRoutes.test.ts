import test from 'node:test';
import assert from 'node:assert/strict';
import {legacyPlacezMapRedirect} from './placezMapRoutes';
import {safeMapReturnTo} from './authReturn';
import {navLinkActive,mapWorldNeedsReload,PLACES_NAV} from '../client/src/lib/siteNav';
import {isMapzRoute} from '../client/src/lib/mapRouteRetention';
import {mapReturnPath} from '../client/src/lib/mapDrawerNavigation';
test('legacy entrances preserve raw query, selection, camera and fragment',()=>{
 for(const path of ['/map','/map/','/map-demo','/mapz','/mapz-map','/mapz-map/index.html','/zaydar-map/index.html']){
  const suffix='?mode=mapz&place=9&event=-3&q=a%20b&lat=45.5&lng=-122.6&zoom=16&item=venue-9#card';
  assert.equal(legacyPlacezMapRedirect(path+suffix),'/placez/map'+suffix);
 }
});
test('directory, assets, and other worlds are isolated',()=>{
 for(const path of ['/directory','/directory/9/test','/placez/map','/placez/9/test','/scenez','/outzide','/outzide/share/test','/outzide/places','/map?mode=outzide','/map?mode=boardz','/map?mode=afterz','/map?mode=zaydark','/map?layer=gigz','/mapz-map/app.js']) assert.equal(legacyPlacezMapRedirect(path),null,path);
 assert.equal(PLACES_NAV[0].href,'/directory');
});
test('canonical map participates in navigation, retention and safe returns',()=>{
 assert.equal(navLinkActive('/placez/map?mode=mapz','/placez/map?mode=mapz'),true);
 assert.equal(navLinkActive('/directory','/placez/map?mode=mapz'),false);
 assert.equal(mapWorldNeedsReload('/placez/map','/map?mode=outzide'),true);
 assert.equal(mapWorldNeedsReload('/map?mode=outzide','/placez/map?mode=mapz'),true);
 assert.equal(isMapzRoute('/placez/map?lat=45'),true);
 assert.equal(mapReturnPath('/placez/map?place=9'),'/placez/map?place=9');
 assert.equal(safeMapReturnTo('/placez/map?auth=login'),'/placez/map?auth=login');
 for(const path of ['https://evil.test/placez/map','//evil.test/placez/map','/placez/map/evil']) assert.equal(safeMapReturnTo(path),undefined);
});

test('standalone guestPlace compatibility survives the canonical redirect',()=>{
 assert.equal(legacyPlacezMapRedirect('/mapz-map/index.html?guestPlace=9&zoom=12#card'),'/placez/map?zoom=12&place=9#card');
});
