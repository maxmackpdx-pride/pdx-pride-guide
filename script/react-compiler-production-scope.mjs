/**
 * Check transforms through the actual Vite app configuration, not only an
 * isolated benchmark. Nothing here imports live user data or writes to APIs.
 * Assert each lazy route component actually receives its own memo cache.
 */
import assert from 'node:assert/strict';
import {assertCompiledFunction} from './react-compiler-function-proof.mjs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {createServer} from 'vite';
import {cardCompilerFunction,cardFaceModules,placezCompilerModules} from './react-compiler-card-scope.mjs';

const root=path.resolve(import.meta.dirname,'..');
const compilerMarker=/react(?:\/|_)compiler-runtime|useMemoCache|memo_cache_sentinel/;
const inScope=[
 'components/cards/EventCard.tsx',
 'components/cards/BoardCard.tsx',
 ...placezCompilerModules.map(module=>'components/'+module+'.tsx'),
 ...cardFaceModules.map(face=>'components/'+face+(face.startsWith('board/punk/')?'.jsx':'.tsx')),
];
// Derive the route inventory from the real app shell, including lazy routes.
const app = await readFile(path.join(root, 'client/src/App.tsx'), 'utf8');
const pages = [...new Set(
  [...app.matchAll(/import\(["']\.\/pages\/([^"']+)["']\)/g)]
    .map(([, name]) => `pages/${name}.tsx`),
)];
assert.ok(pages.length > 0, 'No route modules found in App.tsx');

const server = await createServer({
  configFile: path.join(root, 'vite.config.ts'),
  server: { host: '127.0.0.1', port: 0, hmr: false, watch: null },
});
try {
  const compiled = [];
  const functionProofs = [];
  for (const file of [...inScope, ...pages]) {
    const url = '/src/' + file;
    const transformed = await server.transformRequest(url);
    assert.ok(transformed?.code, `Vite did not transform ${url}`);
    assert.match(transformed.code, compilerMarker, `React Compiler emitted no cache: ${url}`);
    compiled.push(url);

    const place = placezCompilerModules.find(module => file === `components/${module}.tsx`);
    const names = place ? [cardCompilerFunction(place)] : [];
    if (file.startsWith('pages/')) {
      const source = await readFile(path.join(root, 'client/src', file), 'utf8');
      const entry = source.match(/export default function (\w+)/)?.[1];
      assert.ok(entry, `Missing named route component: ${url}`);
      names.push(entry);
    }
    if (file === 'components/events/FlyerBoard.tsx') names.push('FlyerBoard', 'PastCell');
    if (file === 'components/events/EventFlyerFront.tsx') names.push('PosterCell');
    for (const name of names) {
      functionProofs.push(assertCompiledFunction(transformed.code, name, true));
    }
  }

  console.log('REACT_COMPILER_PRODUCTION_SCOPE ' + JSON.stringify({
    mode: 'app-infer-react-19',
    config: 'vite.config.ts',
    functionProofs,
    compiled,
  }));
} finally {
  await server.close();
}
