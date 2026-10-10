import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

test('Vite rejection remains available to React lazy during recovery', async () => {
  const listeners = {};
  let reloads = 0;
  const storage = new Map();
  const source = readFileSync(new URL('../client/src/lib/lazyWithReload.ts', import.meta.url), 'utf8')
    .replace(/^import .*;\n/gm, '');
  const context = { exports: {}, lazy: fn => fn, clearPwaCaches: async () => {}, Error, Date,
    window: { addEventListener: (name, fn) => { listeners[name] = fn; },
      sessionStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
      location: { reload: () => { reloads++; } } } };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context);
  context.exports.installStaleAssetRecovery();
  let cancelled = false;
  listeners['vite:preloadError']({ payload: new Error('Unable to preload CSS for /assets/old.css'), preventDefault: () => { cancelled = true; } });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(cancelled, false, 'cancelling Vite returns undefined to React');
  assert.equal(reloads, 1);
  assert.equal(context.exports.recoverFromStaleAsset(new Error('ordinary render bug')), false);
});
