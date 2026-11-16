import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
const source=read('client/src/pages/OutzidePlacesPage.tsx');
test('converted destinations retain approved names, descriptors, waypoint glyphs and secondary colors',()=>{
 assert.ok(source.includes("name:silver?'Silver Falls State Park':rooster?'Rooster Rock State Park':place.name"));
 assert.ok(source.includes("kind:silver?'Camping · Hiking':rooster?'Beach · Day use':place.kind.replaceAll('-',' ')"));
 assert.ok(source.includes("categoryAccent:silver?COLORS.camp:rooster?'#FF1FA0':COLORS[kind]"));
 assert.ok(source.includes("waypointKind:silver?'camp':rooster?'beach':kind"));
});
test('approved v35 screenprint artwork remains byte-identical',()=>{
 for(const [file,sha] of Object.entries({'rooster-rock':'4c006d4ae072918627d1842bcfa8bd6116c48474b5037099678771591046316a','silver-falls':'c74216dcc7a079e7733bd535426559f78e577fed97e9e2db535778fb97c6e708'})){
 assert.equal(createHash('sha256').update(readFileSync(new URL(`client/public/outzide-native/${file}-screenprint-v1.png`,root))).digest('hex'),sha);
 }
});
test('small card keeps approved dimensions, full bleed and bottom identity',()=>{
 const css=read('client/src/components/outz/native/NativeOutzideFace.css');
 assert.match(css,/\.oz-small\{width:136px;height:170px/);
 assert.match(css,/\.oz-card\.oz-square \.oz-hero,\.oz-card\.oz-small \.oz-hero\{height:100%/);
 assert.match(css,/\.oz-card\.oz-small \.oz-identity\{bottom:10px;left:9px;right:43px\}/);
});
