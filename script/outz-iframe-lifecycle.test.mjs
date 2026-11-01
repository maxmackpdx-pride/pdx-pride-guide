import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

// Regression guard for the OutZide iframe destruction defect: the disposal
// effect in Outz.tsx dispatches a synthetic pagehide into the map iframe,
// whose handler performs full map disposal. If the effect's dependencies
// include the shared-destination query state (sharePending / shareError /
// sharedId), React runs that cleanup the moment a destination lookup
// resolves — destroying a healthy map ("Map removed before first frame").
// Disposal may only track the retry remount generation (attempt) and real
// component unmount.

const outz = await readFile(new URL('../client/src/pages/Outz.tsx', import.meta.url), 'utf8');

function disposalDeps(source) {
  const marker = source.indexOf("PageTransitionEvent('pagehide'");
  assert.notEqual(marker, -1, 'Outz.tsx keeps the iframe disposal effect');
  const depsStart = source.indexOf('}, [', marker);
  assert.notEqual(depsStart, -1, 'disposal effect has a dependency array');
  const depsEnd = source.indexOf(']);', depsStart);
  assert.notEqual(depsEnd, -1, 'disposal effect dependency array closes');
  return source.slice(depsStart + 4, depsEnd);
}

test('OutZide map disposal never runs when the destination lookup resolves', () => {
  const deps = disposalDeps(outz);
  assert.match(deps, /\battempt\b/, 'retry remounts still dispose the previous map generation');
  assert.doesNotMatch(deps, /sharePending|shareError|sharedId/, 'lookup state changes must not dispose the active map');
});

test('OutZide iframe remounts only on retry attempts', () => {
  assert.match(outz, /key=\{attempt\}/, 'iframe identity is keyed to the retry generation, not to lookup state');
  assert.match(outz, /setAttempt\(value => value \+ 1\)/, 'retry is the one interaction that remounts the map');
});
