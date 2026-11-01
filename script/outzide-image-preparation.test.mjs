import test from 'node:test';
import assert from 'node:assert/strict';
import { imageContentHash, imagePreparationIdentity, planImagePreparation, qualifyingBlendCheck } from './outzide-image-preparation.mjs';
import { checkBlend } from '../client/public/outzide-map/assets/blend-art.js';

const request = { placeId: 'rooster-rock', sourceHash: imageContentHash(Buffer.from('source bytes')), variant: 'tall' };
const qualified = { ok: true, recipe: true, photo: true, cutouts: 6, contour: 1, route: true };

test('same image bytes and treatment deduplicate without scheduling any work', () => {
  assert.deepEqual(planImagePreparation([request, { ...request }]), [{ ...imagePreparationIdentity(request), action: 'needs-agent' }]);
  assert.deepEqual(planImagePreparation([]), []);
});
test('source bytes, treatment, art variant and destination route identity invalidate reuse', () => {
  const baseline = imagePreparationIdentity(request).key;
  for (const change of [{ sourceHash: imageContentHash(Buffer.from('changed')) }, { treatmentVersion: 'xerox-blend-v2' }, { variant: 'wide' }, { placeId: 'another-place' }]) {
    assert.notEqual(imagePreparationIdentity({ ...request, ...change }).key, baseline);
  }
  assert.equal(imageContentHash(Buffer.from('source bytes')), request.sourceHash);
});
test('reuse requires current qualifying recipe and exact saved source/version', () => {
  const ready = { ...request, status: 'ready' };
  assert.equal(planImagePreparation([request], [ready], () => qualified)[0].action, 'reuse');
  assert.equal(planImagePreparation([request], [ready], () => ({ ...qualified, contour: 0 }))[0].action, 'review-invalid-art');
  assert.equal(planImagePreparation([request], [], () => qualified)[0].action, 'review-existing-art');
  assert.equal(planImagePreparation([{ ...request, treatmentVersion: 'next' }], [ready], () => qualified)[0].action, 'review-existing-art');
});
test('in-flight and failed jobs never trigger repeated agent invocation', () => {
  for (const status of ['pending', 'running']) assert.equal(planImagePreparation([request], [{ ...request, status }])[0].action, 'wait');
  assert.equal(planImagePreparation([request], [{ ...request, status: 'failed' }])[0].action, 'review-failure');
});
test('real renderer recognizes existing Rooster Rock art without silently reprocessing it', () => {
  assert.equal(qualifyingBlendCheck(checkBlend('rooster-rock', 'tall')), true);
  assert.equal(planImagePreparation([request], [], checkBlend)[0].action, 'review-existing-art');
  assert.equal(planImagePreparation([{ ...request, placeId: 'unprocessed-place' }], [], checkBlend)[0].action, 'needs-agent');
});
test('invalid identities and contradictory duplicate state fail explicitly', () => {
  for (const change of [{ sourceHash: 'url-is-not-content-hash' }, { variant: 'small' }, { placeId: '' }, { treatmentVersion: '' }]) assert.throws(() => imagePreparationIdentity({ ...request, ...change }));
  assert.throws(() => imageContentHash('not bytes'));
  assert.throws(() => planImagePreparation([request], [{ ...request, status: 'ready' }, { ...request, status: 'running' }]));
  assert.throws(() => planImagePreparation([request], [{ ...request, status: 'invented' }]));
  for (const check of [null, { ...qualified, photo: false }, { ...qualified, cutouts: 4 }, { ...qualified, route: false }]) assert.equal(qualifyingBlendCheck(check), false);
});
