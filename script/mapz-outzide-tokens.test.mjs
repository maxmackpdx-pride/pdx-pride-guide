import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {outzideTokens} from './build-outzide-tokens.mjs';

test('shared Outzide token CSS stays canonical without depending on a retired iframe document',async()=>{
 const result=await outzideTokens(),{css,hash}=result;
 const colors=(await readFile(new URL('../client/src/components/ds/tokens/colors.css',import.meta.url),'utf8')).trim();
 assert.ok(css.includes(colors),'generated export must carry the canonical color source verbatim');
 const build=await readFile(new URL('./build.ts',import.meta.url),'utf8');
 assert.ok(build.indexOf('await writeOutzideTokens()')<build.indexOf('await viteBuild()'),'generate shared CSS before client assets are copied');
 assert.match(hash,/^[a-f0-9]{10}$/);assert.equal('html' in result,false);
 assert.match(css,/--neon-/);assert.match(css,/\.pdx-glass-rebind/);
 assert.doesNotMatch(css,/\bbody\s*\{|@font-face|\*\s*\{/);
 const generator=await readFile(new URL('./build-outzide-tokens.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(generator,/outzide-map\/index\.html|const HTML|writeFile\(new URL\(HTML/);
 assert.deepEqual(await outzideTokens(),result);
});
