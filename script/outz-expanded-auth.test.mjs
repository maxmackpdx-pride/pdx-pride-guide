import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('OutZide auth stays inside the expanded card dialog on both entry paths',()=>{
 const modal=readFileSync('client/src/components/AuthModal.tsx','utf8');
 assert.match(modal,/portalTargetSelector\?: string/);
 assert.ok(modal.includes('document.querySelector(portalTargetSelector)'));
 assert.ok(modal.includes('|| document.body'));
 assert.match(modal,/createPortal\([\s\S]*portalTarget,/);
 const page=readFileSync('client/src/pages/OutzidePlacesPage.tsx','utf8');
 assert.match(page, /role="dialog"[^>]*className="outz-native-dialog"/);
 assert.ok(page.includes('<AuthModal portalTargetSelector=".outz-native-dialog"'));
 const embedded=readFileSync('client/src/pages/OutzPlace.tsx','utf8');
 assert.ok(embedded.includes('portalTargetSelector={embedded ? ".outz-native-dialog" : undefined}'));
});

test('PlaceZ native detail authentication also targets its top layer',()=>{
 for(const path of ['client/src/pages/PlacezBrowse.tsx','client/src/pages/Directory.tsx'])assert.ok(readFileSync(path,'utf8').includes('<AuthModal portalTargetSelector=".placez-fullscreen[open]"'));
});

test('Embedded destination category badge inherits the approved card waypoint color without changing map tokens',()=>{
 const page=readFileSync('client/src/pages/OutzPlace.tsx','utf8');
 assert.ok(page.includes('<Badge color={embedded ? "var(--oz-category)" : meta.color}'));
});
