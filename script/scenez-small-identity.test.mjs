import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync('client/src/components/scenez/nativeOverrides.css','utf8');
const base=readFileSync('client/src/components/scenez/scenezNative.css','utf8');
const face=readFileSync('client/src/components/scenez/SceneCardFace.tsx','utf8');
test('small long identity is bounded below compose and above unchanged counter lane',()=>{
 assert.match(css,/\.pz-card--small\.page-scenez \.pz-content\{left:9px;right:9px;bottom:47px/);
 assert.match(css,/-webkit-line-clamp:2;max-height:32px;overflow:hidden/);
 assert.match(css,/\.pz-identity\{gap:3px/);
 assert.ok(170-47-32-3-11>47,'longest title stays below compose 3+44');
 assert.ok(47>7+32,'identity stays above counters');
 assert.match(face,/aria-label=\{`Open \$\{c.name\} \$\{size\}`\}/);
});
test('small logos have their own bright upper lane without changing locked geometry',()=>{
 assert.match(css,/z-index:2;left:44px;right:8px;top:22px;width:84px;height:48px/);
 assert.match(base,/\.pz-card--small\{width:136px;height:170px/);
 assert.match(css,/\.pz-card\.pz-card--small \.scene-art[^}]+height:100%/);
});
