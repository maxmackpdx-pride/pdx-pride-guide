import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

// Regression guard for the Missed Connections BoardZ defect: tapping an
// OutZide missed-connection card navigated away to OutZide instead of
// expanding the card. Buddy/ride posts are place-first by design; missed
// connections must expand in place, render the missed-connections detail
// (never the Sellz overlay), and keep replies locked — an OutZide wall
// post's id is not a /api/missed-connections id, so the reply, edit and
// report mutations in SpottedDetailModal must not fire for it.

const boards = await readFile(new URL('../client/src/pages/Boards.tsx', import.meta.url), 'utf8');
const detail = await readFile(new URL('../client/src/components/board/BoardDetail.tsx', import.meta.url), 'utf8');
const spotted = await readFile(new URL('../client/src/components/SpottedDetailModal.tsx', import.meta.url), 'utf8');

test('Boards only navigates to OutZide for place-first intents', () => {
  assert.match(boards, /if \(outzPost && shouldOpenOutzPlace\(outzPost\.intent\)\) \{ navigate\(`\/outzide\?place=/,
    'navigation is gated on buddy/ride intent; missed connections fall through to expansion');
});

test('BoardDetail renders a missed OutZide post with the missed-connections detail', () => {
  assert.match(detail, /outzBoardIntent\(row\.postKind\) === "missed"/);
  assert.match(detail, /<SpottedDetailModal/);
  assert.match(detail, /external/, 'external posts render with interactions locked');
  assert.match(detail, /outzMissedSource\(row\.placeId, row\.placeName\)/, 'the explicit OutZide source link is preserved');
  const fallback = detail.slice(detail.indexOf('if (!ownQuery)'));
  assert.match(fallback, /"sellz"/, 'the unrelated Sellz fallback is untouched for the categories that use it');
  assert.doesNotMatch(detail.slice(0, detail.indexOf('if (!ownQuery)')), /kind=\{\s*selected\.category/,
    'OutZide missed posts never reach the generic overlay kind mapping');
});

test('SpottedDetailModal locks reply, edit and report for external posts', () => {
  assert.match(spotted, /external \|\| isDemo|isDemo \|\| external/, 'the interaction block is gated on external as well as demo');
  assert.match(spotted, /external && !isDemo/, 'external posts explain where to reply instead of showing the demo notice');
});
