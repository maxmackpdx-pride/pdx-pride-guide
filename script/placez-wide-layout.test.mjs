import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import postcss from 'postcss';
const placez=postcss.parse(readFileSync('client/src/components/placez/PlacezQuickCard.css','utf8'));
const scene=postcss.parse(readFileSync('client/src/components/scenez/scenezNative.css','utf8'));
function declarations(css,selector){const values={};css.walkRules(selector,rule=>rule.walkDecls(d=>values[d.prop]=d.value));return values;}
test('wide PlaceZ remains locked 360x216 with logo left and information right',()=>{
 const card=declarations(placez,'.pz-card--wide-map');assert.equal(card.width,'360px');assert.equal(card.height,'216px');
 const info=declarations(placez,'.pz-card--wide-map .pz-content');assert.equal(info.left,'51%');assert.equal(info.right,'16px');
 const logo=declarations(placez,'.pz-card--wide-map .pz-art .pz-art__logo');assert.equal(logo.left,'2%');assert.equal(logo.width,'40%');
 const approved=declarations(placez,'.pz-card--wide-map .pz-art .pz-art__wide-logo');assert.equal(approved.left,'8px');assert.equal(approved.width,'160px');
});
test('wide PlaceZ preserves fullbleed image and right-dark gradient',()=>{
 assert.equal(declarations(placez,'.pz-card--wide-map .pz-art').width,'100%');
 assert.match(declarations(placez,'.pz-card--wide-map .pz-art:after').background,/linear-gradient\(90deg,rgba\(4,9,13,\.02\) 0%,rgba\(4,9,13,\.25\) 36%,rgba\(4,9,13,\.9\) 72%/);
});
test('SceneZ retains its right-side information column',()=>{
 const info=declarations(scene,'.scenez-native .pz-card--wide-map .pz-content');assert.equal(info.left,'49%');assert.equal(info.right,'25px');
 const logo=declarations(scene,'.scenez-native .pz-card--wide-map .scene-logo,.scenez-native .pz-card--wide-map .scene-wordmark');assert.equal(logo.left,'5%');assert.equal(logo.width,'39%');
});

test('logo-only records do not render a duplicate centered fallback name',()=>{
 const source=readFileSync('client/src/components/placez/PlacezQuickCard.tsx','utf8');
 assert.ok(source.includes(':!m.logoUrl&&<span className="pz-name-fallback">{m.name}</span>'));
 assert.ok(source.includes('{m.logoUrl&&<img className="pz-art__logo"'));
});
