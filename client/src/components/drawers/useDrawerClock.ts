import { useSyncExternalStore } from "react";

const listeners = new Set<() => void>();
let clock = Date.now();
let timer: number | undefined;
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (timer === undefined) {
    clock = Date.now();
    timer = window.setInterval(() => {
      clock = Date.now();
      listeners.forEach(notify => notify());
    }, 30_000);
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) { window.clearInterval(timer); timer = undefined; }
  };
}
const noopSubscribe = () => () => {};
const read = () => clock;

/** A visible rail of cards needs only one clock. Place records have no countdown. */
export function useDrawerClock(enabled = true) {
  return useSyncExternalStore(enabled ? subscribe : noopSubscribe, read, read);
}
