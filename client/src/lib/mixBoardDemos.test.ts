import assert from 'node:assert/strict';
import test from 'node:test';
import type { BoardPost } from './allBoards';
import { mixBoardDemos } from './mixBoardDemos';

test('real posts stay first in order, while grouped demos mix without losing records', () => {
  const row = (key: string, category: BoardPost['category'], isDemo = true) => ({ key, category, isDemo }) as BoardPost;
  const input = [row('outz:1', 'outz'), row('outz:2', 'outz'), row('outz:3', 'outz'), row('gigz:real', 'gigz', false), row('giftz:1', 'giftz'), row('giftz:2', 'giftz'), row('housing:real', 'housing', false), row('sellz:1', 'sellz')];
  const original = [...input];
  const result = mixBoardDemos(input);
  assert.deepEqual(result.slice(0, 2).map(p => p.key), ['gigz:real', 'housing:real']);
  assert.deepEqual(result.map(p => p.key).sort(), input.map(p => p.key).sort());
  assert.deepEqual(input, original);
  const examples = result.slice(2);
  assert.ok(examples.every((p, i) => i === 0 || p.category !== examples[i - 1].category));
  assert.deepEqual(mixBoardDemos([input[6], input[3], ...input.filter(p => p.isDemo).reverse()]).slice(2), examples);
});

test('empty, real-only and single-category boards retain all posts', () => {
  assert.deepEqual(mixBoardDemos([]), []);
  const real = [{ key: 'gigz:1', category: 'gigz' }] as BoardPost[];
  assert.deepEqual(mixBoardDemos(real), real);
  const demos = [1, 2, 3].map(id => ({ key: `housing:${id}`, category: 'housing', isDemo: true })) as BoardPost[];
  assert.equal(mixBoardDemos(demos).length, demos.length);
});

test('Outzide examples also mix their different card types', () => {
  const posts = ['buddy', 'buddy', 'buddy', 'ride', 'ride', 'missed'].map((intent, id) => ({ key: `outz:${id}`, category: 'outz', intent, isDemo: true })) as BoardPost[];
  const result = mixBoardDemos(posts);
  assert.ok(result.every((post, i) => i === 0 || post.intent !== result[i - 1].intent));
});
