import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { responsivePoster, restoreOriginalPoster, POSTER_DETAIL_SIZES } from './responsivePoster';
const manifest = {'/uploads/new.jpg':{width:1600,height:2000,variants:[{src:'/api/poster-variants/image/example-640.webp',width:640}]}};

test('unknown, future, private and external URLs retain original-only delivery', () => {
  for (const url of ['/uploads/future.jpg', '/private/album.jpg', 'https://external.test/a.jpg', '__proto__', '/brand/logo.png']) {
    assert.deepEqual(responsivePoster(url), { src: url });
  }
});
test('known poster uses only recorded variants plus full-resolution original', () => {
  for (const [src, entry] of Object.entries(manifest)) {
    const attrs = responsivePoster(src, '200px', manifest);
    assert.equal(attrs.src, src); assert.equal(attrs.sizes, '200px');
    assert.equal(attrs.width, entry.width); assert.equal(attrs.height, entry.height);
    for (const v of entry.variants) assert.ok(attrs.srcSet?.includes(`${v.src} ${v.width}w`));
    if (!entry.variants.some(v => v.width >= entry.width)) assert.ok(attrs.srcSet?.includes(`${src} ${entry.width}w`));
  }
});
test('missing derivative restores original once and drops responsive attributes', () => {
  const attrs = new Map([['srcset', 'missing.webp 640w'], ['sizes', '200px']]); let resets = 0;
  const fake = { getAttribute: (k: string) => attrs.get(k), removeAttribute: (k: string) => attrs.delete(k), set src(v: string) { assert.equal(v, '/uploads/original.jpg'); resets++; } };
  assert.equal(restoreOriginalPoster(fake as unknown as HTMLImageElement, '/uploads/original.jpg'), true, 'first error schedules an original retry');
  assert.equal(restoreOriginalPoster(fake as unknown as HTMLImageElement, '/uploads/original.jpg'), false, 'original failure is terminal and may notify caller');
  assert.equal(resets, 1); assert.equal(attrs.size, 0);
});
test('detail sizes has lazy auto sizing with bounded legacy fallback', () => {
  assert.match(POSTER_DETAIL_SIZES, /^auto,/); assert.match(POSTER_DETAIL_SIZES, /760px$/);
});
test('exact canonical origin aliases use the same variants without accepting other hosts', () => {
  const src = Object.keys(manifest)[0];
  assert.equal(responsivePoster('https://www.zaylist.com' + src, undefined, manifest).width, responsivePoster(src, undefined, manifest).width);
  assert.deepEqual(responsivePoster('https://evil.test' + src), { src: 'https://evil.test' + src });
  assert.deepEqual(responsivePoster('https://www.zaylist.com.evil.test' + src), { src: 'https://www.zaylist.com.evil.test' + src });
});

test('EventFlyerArt notifies caller only after original retry has failed', () => {
  const source = readFileSync(new URL('../components/events/EventFlyerArt.tsx', import.meta.url), 'utf8');
  assert.match(source, /if \(!restoreOriginalPoster\(event\.currentTarget, src\)\) onError\?\.\(event\)/);
});
