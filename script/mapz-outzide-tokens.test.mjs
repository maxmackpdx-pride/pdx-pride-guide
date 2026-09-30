import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {outzideTokens} from './build-outzide-tokens.mjs';

test('OutZide token bridge is current and loads before OutZide styles',async()=>{
 const {css,hash}=await outzideTokens();
 const committed=await readFile(new URL('../client/public/outzide-map/assets/zaylist-tokens.css',import.meta.url),'utf8');
 assert.equal(committed,css,'run node script/build-outzide-tokens.mjs');
 const html=await readFile(new URL('../client/public/outzide-map/index.html',import.meta.url),'utf8');
 assert.ok(html.includes(`assets/zaylist-tokens.css?v=${hash}`));
 // OutZide's own :root (--orange and friends) must win, so the bridge loads first.
 assert.ok(html.indexOf('zaylist-tokens.css')<html.indexOf('href="style.css'));
 assert.doesNotMatch(css,/\bbody\s*\{|@font-face|\*\s*\{/);
});
