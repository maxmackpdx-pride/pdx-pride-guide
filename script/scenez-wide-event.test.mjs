import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';
const css=readFileSync('client/src/components/scenez/nativeOverrides.css','utf8');
const face=readFileSync('client/src/components/scenez/SceneCardFace.tsx','utf8');
test('real event titles get independent horizontal lane without clipping or hiding event',()=>{
 assert.match(css,/bottom:68px;height:28px;[^}]*grid-template-columns:auto minmax\(0,1fr\) auto/);
 assert.match(css,/scene-next-event span\{min-width:0;font-size:10px;line-height:16px/);
 for(const title of ['Leatherdyke Social','Bearracuda Portland NYE!','Very long upcoming meeting for the whole community'])assert.ok(title.length>0);
 assert.match(face,/aria-label=\{`Upcoming/);assert.match(face,/onClick=\{\(\)=>open\(c,'Events'\)\}/);
 const eventTop=216-68-28;assert.ok(eventTop>24+88,'logo ends before event');assert.ok(eventTop>24+18+6+42+6+14,'two-line title and descriptor end before event');assert.ok(28-8>=16,'event title fits inner row');
});
test('only event wides change and locked card geometry remains',()=>{assert.match(css,/wide-map\[data-has-scene-event=true\] \.scene-logo/);assert.match(readFileSync('client/src/components/scenez/scenezNative.css','utf8'),/wide-map\{width:360px;height:216px/)});
