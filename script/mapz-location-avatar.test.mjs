import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const renderer=await readFile(new URL('../client/public/zaydar-map/river-flight.js',import.meta.url),'utf8');

test('the map location avatar matches the nav bloom and is thirty percent larger',()=>{
 assert.match(renderer,/const USER_LOCATION_AVATAR_SCALE=1\.3/);
 assert.match(renderer,/USER_LOCATION_CENTER_LIFT=27\*USER_LOCATION_AVATAR_SCALE/);
 assert.match(renderer,/radius=23\*USER_LOCATION_AVATAR_SCALE/);
 assert.match(renderer,/createConicGradient\(-Math\.PI\/2\+rotation,x,y\)/);
 assert.match(renderer,/filter=`blur\(\$\{radius\*\.12\}px\) saturate\(1\.2\) brightness\(1\.12\)`/);
 assert.match(renderer,/ctx\.arc\(x,y,radius,0,Math\.PI\*2\);ctx\.fillStyle='#000';ctx\.fill\(\)/);
 assert.doesNotMatch(renderer,/ctx\.fillStyle=ring\|\|palette\[0\];ctx\.fill\(\);\s*ctx\.beginPath\(\);ctx\.arc\(x,y,radius-4/);
});
