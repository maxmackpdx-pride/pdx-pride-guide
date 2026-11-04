import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('NEEDZ resource and safety details share the in-flow card host', () => {
  const source = read('../../pages/Resources.tsx');
  assert.match(source, /data-card-category="needz"/);
  assert.match(source, /onClickCapture=\{rememberCardOrigin\}/);
  assert.match(source, /modal=\{false\}/);
  assert.match(source, /detailOpen && <CardDetails key=/);
  assert.match(source, /<PausedCard open=\{supportOpen\}><CardDetails onClose=/);
  assert.doesNotMatch(source, /<(?:Dialog|Drawer)\.Portal/);
});

test('BoardZ opens in the shared host on phones as well as desktop', () => {
  const source = read('../../pages/Boards.tsx');
  assert.match(source, /<CardDetails key=\{validPost\} onClose=\{close\}>/);
  assert.doesNotMatch(source, /validPost && \(phoneLayout/);
  assert.doesNotMatch(source, /expanded = !phoneLayout/);
  // The native pinboard arrangement remains, rather than changing mixed cards to oversized cells.
  assert.match(source, /pinboardPlacement\(post.key, phoneLayout\)/);
});

test('BoardZ native face records origin and preserves category-specific size selection', () => {
  const source = read('../board/punk/PunkBoardCard.jsx');
  assert.match(source, /data-card-size=\{size\}/);
  assert.match(source, /data-card-category=\{post.category\}/);
  assert.match(source, /onClickCapture=\{rememberCardOrigin\}/);
  assert.match(source, /onSave\(\)/);
});
