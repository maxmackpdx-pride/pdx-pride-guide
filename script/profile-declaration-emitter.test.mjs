import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import ts from 'typescript';
import { emitProfileDeclarations } from './profile-declaration-emitter.mjs';

function fixture(t, code) {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'profile-declaration-'));
  t.after(() => fs.rmSync(rootDir, { recursive: true, force: true }));
  const outDir = path.join(rootDir, 'types'), entrySource = path.join(rootDir, 'index.ts');
  fs.writeFileSync(entrySource, code);
  fs.writeFileSync(path.join(rootDir, 'data.json'), '{"name":"public poster"}');
  const program = ts.createProgram([entrySource], {
    declaration: true, emitDeclarationOnly: true, noEmitOnError: true,
    rootDir, outDir, resolveJsonModule: true, esModuleInterop: true,
    module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ES2022, strict: true, skipLibCheck: true, types: [],
  });
  return { program, rootDir, outDir, entrySource };
}

test('JSON imports emit complete TS declarations, not false aggregate skips', t => {
  const config = fixture(t, "import data from './data.json'; export const name = data.name;");
  const result = emitProfileDeclarations(config);
  assert.deepEqual(result.emittedFiles, [path.join(config.outDir, 'index.d.ts')]);
  assert.deepEqual(result.skippedJsonSources, [path.join(config.rootDir, 'data.json')]);
  assert.match(fs.readFileSync(result.emittedFiles[0], 'utf8'), /export declare const name: string/);
});

test('real TS errors fail with diagnostics and do not emit declarations', t => {
  const config = fixture(t, 'export const count: number = "not a number";');
  assert.throws(() => emitProfileDeclarations(config), /Type.*string.*not assignable to type.*number/s);
  assert.equal(fs.existsSync(path.join(config.outDir, 'index.d.ts')), false);
});

test('missing this-invocation declaration fails even if a stale file exists', t => {
  const config = fixture(t, 'export const count: number = 1;');
  fs.mkdirSync(config.outDir); fs.writeFileSync(path.join(config.outDir, 'index.d.ts'), 'stale');
  config.program.emit = () => ({ emitSkipped: false, diagnostics: [] });
  assert.throws(() => emitProfileDeclarations(config), /Missing profile declaration emitted this invocation/);
});

test('a TS emit skip is never tolerated, even when imported JSON exists', t => {
  const config = fixture(t, "import data from './data.json'; export const name = data.name;");
  config.program.emit = () => ({ emitSkipped: true, diagnostics: [] });
  assert.throws(() => emitProfileDeclarations(config), /TypeScript skipped this TS declaration/);
});

test('public JSON re-exports cannot publish references to unpackaged JSON', t => {
  const config = fixture(t, "export { default as data } from './data.json';");
  assert.throws(() => emitProfileDeclarations(config), /Unpackaged JSON dependency/);
});

test('JSON import types cannot publish references to unpackaged JSON', t => {
  const config = fixture(t, "export type Data = typeof import('./data.json');");
  assert.throws(() => emitProfileDeclarations(config), /Unpackaged JSON dependency/);
});
