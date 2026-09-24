import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const canonical=readFileSync(new URL('../client/src/components/ds/tokens/colors.css',import.meta.url),'utf8');
const mirror=readFileSync(new URL('../client/public/outzide-map/assets/waypoint-tokens.css',import.meta.url),'utf8');
const app=readFileSync(new URL('../client/public/outzide-map/app.js',import.meta.url),'utf8');
test('Outzide marker colors match shared token values',()=>{
 for(const name of ['neon-yellow','neon-cyan','neon-magenta','neon-orange','neon-red','neon-blue','green-acid']){
  const pattern=new RegExp('--'+name+'\\s*:\\s*(#[0-9a-f]{6})','i');
  assert.equal(mirror.match(pattern)?.[1].toLowerCase(),canonical.match(pattern)?.[1].toLowerCase(),name);
  assert.match(app,new RegExp("'--"+name+"'"));
 }
 assert.match(app,/waypointAccent\(kind\)/);
});
