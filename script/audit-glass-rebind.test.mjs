import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

function audit(source) {
  const root = mkdtempSync(join(tmpdir(), 'glass-audit-'));
  try {
    mkdirSync(join(root, 'script'));
    mkdirSync(join(root, 'client/src/components/ds/tokens'), { recursive: true });
    copyFileSync(new URL('./audit-glass-rebind.mjs', import.meta.url), join(root, 'script/audit.mjs'));
    writeFileSync(join(root, 'client/src/components/ds/tokens/glass.css'), '.pdx-glass-rebind { --glass-card-bg: var(--c); }');
    writeFileSync(join(root, 'client/src/Fixture.tsx'), source);
    return spawnSync(process.execPath, [join(root, 'script/audit.mjs')], { encoding: 'utf8' });
  } finally { rmSync(root, { recursive: true, force: true }); }
}

test('accepts rebind after interpolated class names', () => {
  const result = audit('const node = <article className={`card card--${size} pdx-glass-rebind`} style={{ "--c": color }} />;');
  assert.equal(result.status, 0, result.stderr);
});
test('accepts rebind after nested class expressions', () => {
  const result = audit('const node = <article className={cx({ card: true }, "pdx-glass-rebind")} style={{ "--c": color }} />;');
  assert.equal(result.status, 0, result.stderr);
});
test('still rejects interpolated classes without rebind', () => {
  const result = audit('const node = <article className={`card card--${size}`} style={{ "--c": color }} />;');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /1 violation/);
});
test('does not accept rebind on a child or another attribute', () => {
  for (const source of [
    'const node = <article className="card" style={{ "--c": color }}><span className="pdx-glass-rebind" /></article>;',
    'const node = <article className="card" data-note="pdx-glass-rebind" style={{ "--c": color }} />;',
  ]) assert.equal(audit(source).status, 1);
});
