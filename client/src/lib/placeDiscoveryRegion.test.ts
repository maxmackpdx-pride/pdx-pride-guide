import test from 'node:test';
import assert from 'node:assert/strict';
import {matchesPlaceDiscoveryRegion,readPlaceDiscoveryRegion} from './placeDiscoveryRegion';
test('Vancouver means Washington, never Vancouver BC',()=>{
 assert.equal(matchesPlaceDiscoveryRegion({address:'1703 Main St, Vancouver, WA 98660'},'VAN'),true);
 assert.equal(matchesPlaceDiscoveryRegion({address:'Davie St, Vancouver, BC',neighborhood:'Vancouver'},'VAN'),false);
 assert.equal(matchesPlaceDiscoveryRegion({address:'203 SE Grand Ave, Portland, OR'},'VAN'),false);
});
test('Oregon excludes Washington and BC while accepting local neighborhood-only records',()=>{
 assert.equal(matchesPlaceDiscoveryRegion({address:'Seattle, WA'},'OR'),false);
 assert.equal(matchesPlaceDiscoveryRegion({address:'Vancouver, WA'},'OR'),false);
 assert.equal(matchesPlaceDiscoveryRegion({neighborhood:'Alberta'},'OR'),true);
 assert.equal(matchesPlaceDiscoveryRegion({address:'Eugene, OR'},'OR'),true);
});
test('unsupported region query values safely return all listings',()=>{
 assert.equal(readPlaceDiscoveryRegion('BC'),'ALL');assert.equal(readPlaceDiscoveryRegion('VAN'),'VAN');
 assert.equal(matchesPlaceDiscoveryRegion({},'ALL'),true);
});
