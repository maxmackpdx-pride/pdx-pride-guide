/**
 * The open event card and the card types it opens must compile with no
 * React Compiler bailouts (Tucker, t321u). A bailout silently drops the
 * component back to uncompiled React, so this fails on any CompileError.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {transformSync} from '@babel/core';
import {openCardModules} from './react-compiler-card-scope.mjs';

const root = path.resolve(import.meta.dirname, '..');
for (const [module, functions] of openCardModules) {
  test(`React Compiler compiles ${module} without bailouts`, () => {
    const file = path.join(root, 'client/src/components', module + '.tsx');
    const failures = [], compiled = [];
    transformSync(fs.readFileSync(file, 'utf8'), {
      filename: file, configFile: false, babelrc: false, parserOpts: {plugins: ['jsx', 'typescript']},
      plugins: [['babel-plugin-react-compiler', {compilationMode: 'infer', panicThreshold: 'none', logger: {logEvent: (_f, e) => {
        if (e.kind === 'CompileSuccess') compiled.push(e.fnName);
        else if (e.kind === 'CompileError' || e.kind === 'PipelineError') failures.push(`${e.fnName ?? '?'}: ${e.detail?.reason ?? e.detail?.options?.reason ?? e.kind}`);
      }}}]],
    });
    assert.deepEqual(failures, [], `Compiler bailouts in ${module}`);
    for (const fn of functions) assert.ok(compiled.includes(fn), `${fn} was not compiled`);
  });
}
