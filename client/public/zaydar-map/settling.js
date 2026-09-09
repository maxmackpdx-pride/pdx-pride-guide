// Exact critically damped motion: smooth acceleration and settling without bounce.
export function settleValue(state, positionKey, velocityKey, target, frequency, dt) {
  if (dt <= 0) return;
  const offset = state[positionKey] - target, velocity = state[velocityKey] || 0;
  const impulse = (velocity + frequency * offset) * dt;
  const decay = Math.exp(-frequency * dt);
  state[positionKey] = target + (offset + impulse) * decay;
  state[velocityKey] = (velocity - frequency * impulse) * decay;
}
