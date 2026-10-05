// A shuffled pass through the visible logos: every candidate is acquired once
// before the pool repeats. Appearance timing and hold length stay independent.
export function createLogoFocus(random = Math.random) {
  const active = new Map(), pending = new Set(), cooldown = new Map();
  let visible = new Set(), nextStart = 0;
  return {
    active,
    update(now, ids) {
      const nextVisible = new Set(ids);
      for (const [id, focus] of active) {
        if (!nextVisible.has(id) || now >= focus.end) {
          active.delete(id);
          cooldown.set(id, now + .35 + random() * .65);
        }
      }
      for (const id of pending) if (!nextVisible.has(id)) pending.delete(id);
      for (const id of nextVisible) if (!visible.has(id) && !active.has(id)) pending.add(id);
      for (const id of cooldown.keys()) if (!nextVisible.has(id)) cooldown.delete(id);
      visible = nextVisible;
      if (!visible.size) { nextStart = now; return active; }
      if (active.size >= 5 || now < nextStart) return active;
      if (!pending.size) for (const id of visible) if (!active.has(id)) pending.add(id);
      const ready = [...pending].filter(id => !active.has(id) && now >= (cooldown.get(id) ?? -Infinity));
      if (!ready.length) return active;
      const id = ready[Math.floor(random() * ready.length)];
      pending.delete(id);
      active.set(id, {start: now, end: now + 1 + random() * 1.5, seed: random() * Math.PI * 2});
      nextStart = now + .14 + random() * .3;
      return active;
    }
  };
}
