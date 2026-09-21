import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

const mapPageUrl=new URL('../client/src/pages/ZaydarMapDemo.tsx',import.meta.url);
const overlayUrl=new URL('../client/src/components/housing/HousingPostOverlay.tsx',import.meta.url);
const composerUrl=new URL('../client/src/components/housing/HousingComposerOverlay.tsx',import.meta.url);

test('HOÜS card, detail, and close stay on Mapz',async()=>{
  const [page,overlay]=await Promise.all([readFile(mapPageUrl,'utf8'),readFile(overlayUrl,'utf8')]);
  assert.match(page,/goOverlay\("houz", postId\)/);
  assert.match(page,/<HousingPostOverlay/);
  assert.match(overlay,/onOpen: \(\) => setDetail\(true\)/);
  assert.match(overlay,/backLabel: "Back to card"/);
  assert.match(overlay,/aria-label="Close HOÜS and return to map"/);
  assert.doesNotMatch(overlay,/\/the-hauz/);
});

test('HOÜS drawer replaces the standalone board controls',async()=>{
  const page=await readFile(mapPageUrl,'utf8');
  assert.match(page,/Post to HOÜS/);
  assert.match(page,/Offer a room/);
  assert.match(page,/Find housing/);
  assert.match(page,/Build a HOÜS/);
  assert.match(page,/List a rental/);
  assert.match(page,/<HousingTagFilter/);
  assert.match(page,/housingSaved/);
  assert.match(page,/How HOÜS works/);
  assert.doesNotMatch(page,/View more HOÜS/);
});

test('HOÜS composer posts back into the active map overlay',async()=>{
  const [page,composer]=await Promise.all([readFile(mapPageUrl,'utf8'),readFile(composerUrl,'utf8')]);
  assert.match(page,/<HousingComposerOverlay/);
  assert.match(page,/p\.delete\("houzCompose"\); clearMapOverlay\(p\); p\.set\("houz", String\(postId\)\)/);
  assert.match(composer,/queryClient\.invalidateQueries\(\{ queryKey: \["\/api\/housing"\] \}\)/);
});

test('HOÜS overlay keeps the standalone page actions in the map',async()=>{
  const overlay=await readFile(overlayUrl,'utf8');
  for(const endpoint of ['request','save','convert','build-haus','report'])assert.match(overlay,new RegExp(`/api/housing/\\$\\{postId\\}/${endpoint}`));
  assert.match(overlay,/<HousingWorkspace/);
  assert.match(overlay,/openSheet\(\{ view: "inbox" \}\)/);
});
