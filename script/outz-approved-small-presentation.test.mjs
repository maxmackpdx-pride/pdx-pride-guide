import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
import {destinationIdentity} from '../client/src/lib/outzDestinationBrowse.ts';
test('converted destinations retain approved names, descriptors, waypoint glyphs and secondary colors',()=>{
 assert.deepEqual(destinationIdentity('Silver Falls', 'trailhead', 'dayuse'), {
   artworkId:'silver-falls',name:'Silver Falls State Park',kind:'Camping · Hiking',waypointKind:'camp',categoryAccent:'#2BFF00',
 });
 assert.deepEqual(destinationIdentity('Rooster Rock', 'beach', 'fishing'), {
   artworkId:'rooster-rock',name:'Rooster Rock State Park',kind:'Beach · Day use',waypointKind:'beach',categoryAccent:'#FF1FA0',
 });
 assert.deepEqual(destinationIdentity('Eagle Creek', 'trailhead', 'winter'), {
   artworkId:null,name:'Eagle Creek',kind:'Winter',waypointKind:'winter',categoryAccent:'#7B00FF',
 });
 assert.equal(destinationIdentity('Fern Lake', 'camp-hike').kind,'camp hike');
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
