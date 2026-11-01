import { createHash } from 'node:crypto';

/** Planning only: this module never invokes an agent, queues work or writes files. */
export const OUTZIDE_BLEND_TREATMENT_VERSION = 'xerox-blend-v1';
const VARIANTS = new Set(['tall', 'wide']);
const SHA256 = /^[a-f0-9]{64}$/;
const text = (value, field) => {
  if (typeof value !== 'string' || !value.trim() || value.length > 512) throw new TypeError(`Invalid ${field}`);
  return value;
};

export function imageContentHash(bytes) {
  if (!(bytes instanceof Uint8Array)) throw new TypeError('Image bytes are required');
  return createHash('sha256').update(bytes).digest('hex');
}

/** Destination identity protects destination-specific outlines/routes from cross-place reuse. */
export function imagePreparationIdentity(input) {
  const placeId = text(input?.placeId, 'placeId');
  const sourceHash = input?.sourceHash;
  if (typeof sourceHash !== 'string' || !SHA256.test(sourceHash)) throw new TypeError('Invalid sourceHash');
  const variant = input.variant;
  if (!VARIANTS.has(variant)) throw new TypeError('Invalid variant');
  const treatmentVersion = text(input.treatmentVersion ?? OUTZIDE_BLEND_TREATMENT_VERSION, 'treatmentVersion');
  const key = createHash('sha256').update(JSON.stringify([placeId, sourceHash, variant, treatmentVersion])).digest('hex');
  return { key, placeId, sourceHash, variant, treatmentVersion };
}

/** Mirrors the current renderer's mandatory checkBlend fields, not the older HDR overlay treatment. */
export function qualifyingBlendCheck(check) {
  return Boolean(check?.ok === true && check.recipe === true && check.photo === true &&
    Number.isInteger(check.cutouts) && check.cutouts >= 5 &&
    Number.isFinite(check.contour) && check.contour > 0 && check.route === true);
}

/**
 * Explicit inputs only. A saved ready record is reusable only when its source/version identity
 * matches and the CURRENT renderer still qualifies it. Callers supply checkBlend(placeId, variant).
 * Unproven legacy recipes are held for adoption/review, never automatically regenerated.
 */
export function planImagePreparation(inputs, records = [], checkBlend = () => null) {
  if (!Array.isArray(inputs) || !Array.isArray(records) || typeof checkBlend !== 'function') throw new TypeError('Invalid planner inputs');
  const saved = new Map();
  for (const record of records) {
    const identity = imagePreparationIdentity(record);
    if (saved.has(identity.key)) throw new Error(`Duplicate preparation record: ${identity.key}`);
    if (!['ready', 'pending', 'running', 'failed'].includes(record.status)) throw new TypeError('Invalid preparation status');
    saved.set(identity.key, record);
  }
  const seen = new Set();
  return inputs.flatMap(input => {
    const identity = imagePreparationIdentity(input);
    if (seen.has(identity.key)) return [];
    seen.add(identity.key);
    const record = saved.get(identity.key);
    const qualifies = qualifyingBlendCheck(checkBlend(identity.placeId, identity.variant));
    let action;
    if (record?.status === 'ready' && qualifies) action = 'reuse';
    else if (record?.status === 'pending' || record?.status === 'running') action = 'wait';
    else if (record?.status === 'failed') action = 'review-failure';
    else if (record?.status === 'ready') action = 'review-invalid-art';
    else if (qualifies) action = 'review-existing-art';
    else action = 'needs-agent';
    return [{ ...identity, action }];
  });
}
