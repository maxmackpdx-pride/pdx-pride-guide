/** Bounded process cache for public profile artwork. Callers must recheck visibility before using it. */
export function createProfileShareCache({maxEntries = 48, maxBytes = 24 * 1024 * 1024, ttlMs = 5 * 60_000, now = Date.now} = {}) {
  const entries = new Map<string, {image: Buffer; expires: number}>();
  const pending = new Map<string, Promise<Buffer>>();
  let bytes = 0;
  const remove = (key: string) => {const entry = entries.get(key); if (entry) bytes -= entry.image.length; entries.delete(key);};
  return async (key: string, render: () => Promise<Buffer>): Promise<Buffer> => {
    const cached = entries.get(key);
    if (cached && cached.expires > now()) {entries.delete(key); entries.set(key, cached); return cached.image;}
    remove(key);
    const underway = pending.get(key);
    if (underway) return underway;
    const work = render().then(image => {
      for (const [oldKey, entry] of entries) if (entry.expires <= now()) remove(oldKey);
      if (image.length <= maxBytes) {
        while (entries.size >= maxEntries || bytes + image.length > maxBytes) remove(entries.keys().next().value!);
        entries.set(key, {image, expires: now() + ttlMs}); bytes += image.length;
      }
      return image;
    }).finally(() => pending.delete(key));
    if (pending.size < maxEntries) pending.set(key, work);
    return work;
  };
}
