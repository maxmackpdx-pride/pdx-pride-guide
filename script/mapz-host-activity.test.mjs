import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=path=>readFile(new URL('../client/src/components/'+path,import.meta.url),'utf8');
const [activity,host,rsvps,follow,sheet]=await Promise.all(['MapzActivity.ts','RetainedMapzRoute.tsx','MapzUpcomingRsvps.tsx','BoardFollowButton.tsx','MapzLayerSheet.tsx'].map(source));
test('shared card consumers remain active outside the retained Mapz provider',()=>{
 assert.match(activity,/createContext\(true\)/);
 assert.match(host,/<Activity.Provider value=\{active&&documentVisible\}/);
});
test('every RSVP child query pauses with Mapz activity, including row contact lookup',()=>{
 const enabled=[...rsvps.matchAll(/enabled:([^,}\n]+)/g)].map(match=>match[1]);
 assert.equal(enabled.length,4);
 assert.ok(enabled.every(value=>value.startsWith('active&&')));
 assert.match(rsvps,/useEffect\(\(\)=>\{if\(!active\)return;[\s\S]*clearInterval\(timer\);\},\[active\]\)/);
});
test('mounted follow controls and drawer listeners stop work while Mapz is away',()=>{
 assert.match(follow,/enabled: active && !!user/);
 assert.match(sheet,/if\(!mapActive\)return;\s*window.addEventListener\("zaylist:map-sheet-close"/);
 assert.match(sheet,/removeEventListener\("zaylist:map-sheet-close", close\)/);
 assert.match(sheet,/if\(!mapActive\)return;\s*const root = document.documentElement/);
});
