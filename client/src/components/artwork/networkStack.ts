export const NETWORK_ORIENTATIONS = ["normal", "mirror-x", "half-turn", "mirror-y"] as const;
export function networkStack(index: number) {
  const position = Math.max(0, Math.floor(index));
  return {
    set: position % 2 === 0 ? "a" : "b",
    // All eight set/orientation combinations, without identical adjacent turns.
    orientation: NETWORK_ORIENTATIONS[(position + Math.floor(position / 4)) % 4],
  };
}
export function networkSeed(key: string) {
  return Array.from(key).reduce((n, c) => (Math.imul(n, 31) + c.charCodeAt(0)) >>> 0, 7);
}
