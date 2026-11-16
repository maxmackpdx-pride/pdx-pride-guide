import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,writeFile,rm,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

test('approved artwork retains its own terrain mesh; legacy hero retains generic mesh', async () => {
 const dir=await mkdtemp(resolve('script/.outz-mesh-test-'));
 try {
  const result=await build({entryPoints:['client/src/components/outz/native/NativeOutzideFace.tsx'],bundle:true,write:false,format:'esm',platform:'node',packages:'external',jsx:'automatic',loader:{'.css':'empty'},plugins:[{name:'raw-svg',setup(b){b.onResolve({filter:/\.svg\?raw$/},a=>({path:resolve(a.resolveDir,a.path.slice(0,-4)),namespace:'raw-svg'}));b.onLoad({filter:/.*/,namespace:'raw-svg'},async a=>({contents:await readFile(a.path,'utf8'),loader:'text'}));}}]});
  const modulePath=resolve(dir,'hero.mjs');await writeFile(modulePath,result.outputFiles[0].contents);
  const {OutzHero}=await import(pathToFileURL(modulePath).href);
  const entry={id:'test',name:'Lake',image:'/lake.png',photoAlt:'Real lake',categoryAccent:'#00FFFF'};
  const legacy=renderToStaticMarkup(createElement(OutzHero,{entry}));
  const approved=renderToStaticMarkup(createElement(OutzHero,{entry:{...entry,approvedArtworkId:'test'}}));
  assert.match(legacy,/class="oz-blend-mesh"/);
  assert.doesNotMatch(approved,/class="oz-blend-mesh"/);
  assert.match(approved,/oz-source-photo--approved-art/);
  assert.match(approved,/src="\/lake.png"/);
 } finally {await rm(dir,{recursive:true,force:true});}
});
