import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const source = await readFile(new URL('../client/src/lib/mapDrawerNavigation.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { mapReturnPath, mapRecordId, clearMapOverlay } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);

test('housing return destinations allow only Mapz, preserving drawer filters', () => {
  for (const path of ['/map', '/map?layer=houz&housingType=FORMING', '/map-demo?layer=houz']) assert.equal(mapReturnPath(path), path);
  for (const path of [null, '', '//example.com/map', 'https://example.com/map', '/map/other', '/mapz', '/map-demo.evil', '/map\\evil']) assert.equal(mapReturnPath(path), null);
});
test('detail IDs reject empty, malformed, fractional and unsafe values', () => {
  assert.equal(mapRecordId('42'), 42);
  assert.equal(mapRecordId('-900001', true), -900001);
  for (const value of [null, '', '0', '-1', '1.5', 'Infinity', '1e3', '42oops', '9007199254740992']) assert.equal(mapRecordId(value), null);
});
test('closing details preserves layer, query and filters while removing overlay aliases', () => {
  const params = new URLSearchParams('layer=places&q=cafe&when=soon&placeTypes=cafe&event=1&place=2&gig=3&gift=4&sellz=5&mizzed=6&spotted=7&sell=8');
  clearMapOverlay(params);
  assert.equal(params.toString(), 'layer=places&q=cafe&when=soon&placeTypes=cafe');
});
