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
  const context = { exports: {}, lazy: fn => fn, clearPwaCaches: async () => {}, Error, Date, Promise, setTimeout: () => 0, clearTimeout: () => {},
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

test('recovery never strands a route: hung cache cleanup still reloads, and a failed reload rejects', async () => {
  const listeners = {};
  let reloads = 0;
  const storage = new Map();
  const timers = [];
  const source = readFileSync(new URL('../client/src/lib/lazyWithReload.ts', import.meta.url), 'utf8')
    .replace(/^import .*;\n/gm, '');
  const context = { exports: {}, lazy: fn => fn, clearPwaCaches: () => new Promise(() => {}), Error, Date, Promise,
    setTimeout: (fn, ms) => { timers.push({ fn, ms }); return timers.length; }, clearTimeout: () => {},
    window: { addEventListener: (name, fn) => { listeners[name] = fn; },
      sessionStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
      location: { reload: () => { reloads++; } } } };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, context);
  const err = new Error('Failed to fetch dynamically imported module: /assets/x.js');
  const pending = context.exports.lazyWithReload(() => Promise.reject(err))();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(reloads, 0, 'cleanup is still hung');
  const cleanup = timers.find(t => t.ms === 3000);
  assert.ok(cleanup, 'cleanup has a timeout');
  cleanup.fn();
  assert.equal(reloads, 1, 'reloads even though cache cleanup never settles');
  let settled = null;
  pending.then(() => { settled = 'resolved'; }, e => { settled = e; });
  timers.filter(t => t.ms === 10000).forEach(t => t.fn());
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(settled, err, 'lazy import rejects to the error boundary if the reload never navigates');
});
