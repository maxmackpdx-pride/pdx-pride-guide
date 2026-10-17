/** Stable per-post clocks: rerenders never reset or synchronize neighboring cards. */
export function boardMotionTiming(key: string) {
  let hash=2166136261;
  for(const char of key) hash=Math.imul(hash^char.charCodeAt(0),16777619)>>>0;
  const mixed=Math.imul(hash^(hash>>>16),0x45d9f3b)>>>0;
  return {
    plane: (hash&1)?'nodes':'lines',
    networkCycle: 16+(mixed%14001)/1000,
    networkPhase: -((mixed>>>7)%29001)/1000,
    pinCycle: 9+(hash%11001)/1000,
    pinPhase: -((hash>>>8)%19001)/1000,
  } as const;
}
