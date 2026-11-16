import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import postcss from 'postcss';
function rule(file,selector){let result;postcss.parse(readFileSync(file,'utf8')).walkRules(selector,r=>{result=Object.fromEntries(r.nodes.filter(n=>n.type==='decl').map(n=>[n.prop,n.value]));});assert.ok(result,selector);return result;}
test('PlaceZ small and square photos fill their locked card, without the old header cutout',()=>{
 const file='client/src/components/placez/PlacezQuickCard.css';
 const art=rule(file,'.pz-card.pz-card--small .pz-art,.pz-card.pz-card--square .pz-art');
 assert.equal(art.inset,'0');assert.equal(art.height,'100%');assert.equal(art.width,'100%');assert.equal(art['mask-image'],'none');
 assert.match(rule(file,'.pz-card.pz-card--small .pz-art:after,.pz-card.pz-card--square .pz-art:after').background,/linear-gradient\(0deg/);
 for(const [size,width,height] of [['small','136px','170px'],['square','250px','250px']]){const card=rule(file,`.pz-card--${size}`);assert.equal(card.width,width);assert.equal(card.height,height);}
});
test('SceneZ small and square backgrounds fill their locked card with a bottom-up gradient',()=>{
 const file='client/src/components/scenez/nativeOverrides.css';
 const art=rule(file,'.scenez-native .pz-card.pz-card--small .scene-art,.scenez-native .pz-card.pz-card--square .scene-art');assert.equal(art.height,'100%');assert.equal(art.width,'100%');assert.equal(art.inset,'0');
 assert.match(rule(file,'.scenez-native .pz-card.pz-card--small .scene-art:after,.scenez-native .pz-card.pz-card--square .scene-art:after').background,/linear-gradient\(0deg/);
});
test('OutZide existing small and square fullbleed bottom-up gradient is retained',()=>{
 const file='client/src/components/outz/native/NativeOutzideFace.css';
 assert.equal(rule(file,'.oz-card.oz-square .oz-hero,.oz-card.oz-small .oz-hero').height,'100%');
 assert.match(rule(file,'.oz-card.oz-square .oz-hero:after,.oz-card.oz-small .oz-hero:after').background,/linear-gradient\(0deg/);
});
