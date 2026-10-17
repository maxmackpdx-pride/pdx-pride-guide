import test from 'node:test';
import assert from 'node:assert/strict';
import {photoQuietStyle} from './photoQuiet';
// Public iframe module is plain JavaScript and shares this typed React contract.
// @ts-expect-error no declaration needed for the public browser module in this test.
import {photoQuietStyle as iframeStyle} from '../../../public/outzide-map/assets/destination-photos.js';
test('React and iframe quiet geometry stay identical for valid and malformed metadata',()=>{
 const valid={cx:.5,cy:.5,rx:.43,ry:.28};
 for(const value of [valid,{cx:.5,cy:.5,rx:.5,ry:.32},undefined,null,{},'bad',{...valid,rx:NaN},{...valid,cx:.1},{...valid,cy:'red;mask:none'},{...valid,ry:.1}]){
  const react=photoQuietStyle(value);const serialized=react?Object.entries(react).map(([key,v])=>`${key}:${v}`).join(';'):'';
  assert.equal(serialized,iframeStyle(value));
 }
});
