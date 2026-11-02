import type Database from 'better-sqlite3';

export type CacheStatus = 'HIT' | 'MISS' | 'BYPASS';
export interface PublicRow { isPublic?: boolean | number; isPrivate?: boolean | number; dayOfWeek?: string | null }
export class EventFeedChangedError extends Error {
  constructor() { super('Event feed changed repeatedly during computation; retry request'); this.name = 'EventFeedChangedError'; }
}
let instance = 0;
/** Connection-local only. Initialize after schema creation; never on a request-scoped connection.
 * build MUST capture every SQLite input synchronously before its first await. It must
 * be session-independent. Detail/admin/personalized payloads must not use this cache.
 * Retains at most maxBytes of UTF-8 JSON (not a bound on transient computation/JS heap).
 */
export function createPublicEventFeedCache<T extends PublicRow>(db: Database.Database, build: () => Promise<T[]> | T[], options: {
  ttlMs?: number; maxBytes?: number; maxAttempts?: number; now?: () => number;
} = {}) {
  const { ttlMs = 30_000, maxBytes = 8 * 1024 * 1024, maxAttempts = 3, now = () => performance.now() } = options;
  if (!Number.isFinite(ttlMs) || ttlMs <= 0 || !Number.isSafeInteger(maxBytes) || maxBytes < 0 || !Number.isSafeInteger(maxAttempts) || maxAttempts < 1) throw new RangeError('Invalid cache options');
  const prefix = `public_feed_${++instance}`;
  const triggers: string[] = [];
  db.exec(`CREATE TEMP TABLE ${prefix} (revision INTEGER NOT NULL); INSERT INTO ${prefix} VALUES (0)`);
  try {
    for (const [table, columns] of [['events', null], ['businesses', null], ['submissions', 'type,status,event_id'], ['event_talent', null], ['users', 'id,username,display_name']] as const) {
      for (const operation of ['INSERT', 'UPDATE', 'DELETE']) {
        const name = `${prefix}_${table}_${operation.toLowerCase()}`;
        db.exec(`CREATE TEMP TRIGGER ${name} AFTER ${operation}${operation === 'UPDATE' && columns ? ` OF ${columns}` : ''} ON main.${table} BEGIN UPDATE ${prefix} SET revision = revision + 1; END`);
        triggers.push(name);
      }
    }
  } catch (error) {
    for (const name of triggers) db.exec(`DROP TRIGGER temp.${name}`);
    db.exec(`DROP TABLE temp.${prefix}`);
    throw error;
  }
  const localRevision = db.prepare(`SELECT revision FROM temp.${prefix}`);
  function revision() { return `${(localRevision.get() as {revision:number}).revision}:${db.pragma('data_version', { simple: true })}`; }
  let entry: { json: string; revision: string; until: number } | undefined;
  let pending: Promise<{ rows: T[]; status: CacheStatus; revision: string }> | undefined;
  let disposed = false;
  function requireCommittedState() {
    if (db.inTransaction) {
      entry = undefined;
      throw new EventFeedChangedError();
    }
  }
  async function compute(): Promise<{rows:T[];status:CacheStatus;revision:string}> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      requireCommittedState();
      const before = revision();
      const rows = await build();
      if (disposed) throw new Error('Cache disposed');
      requireCommittedState();
      if (before !== revision()) continue;
      // Missing flags are conservatively treated as not proven public.
      const publicOnly = rows.every(row => (row.isPublic === true || row.isPublic === 1) && (row.isPrivate === false || row.isPrivate === 0));
      const json = JSON.stringify(rows);
      if (before !== revision()) continue;
      if (!publicOnly || Buffer.byteLength(json, 'utf8') > maxBytes) return { rows, status: 'BYPASS', revision: before };
      entry = { json, revision: before, until: now() + ttlMs };
      return { rows: JSON.parse(json), status: 'MISS', revision: before };
    }
    throw new EventFeedChangedError();
  }
  return {
    async get(): Promise<{rows:T[];status:CacheStatus}> {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (disposed) throw new Error('Cache disposed');
        requireCommittedState();
        // Private/oversized results are never shared with queued callers.
        while (pending) { await pending; if (disposed) throw new Error('Cache disposed'); requireCommittedState(); }
        if (entry && now() < entry.until && revision() === entry.revision) return { rows: JSON.parse(entry.json), status: 'HIT' };
        entry = undefined;
        const work = compute();
        pending = work;
        let result;
        try { result = await work; } finally { if (pending === work) pending = undefined; }
        if (disposed) throw new Error('Cache disposed');
        requireCommittedState();
        // Also close the microtask gap between compute completion and this await.
        if (result.revision !== revision()) continue;
        return { rows: result.rows, status: result.status };
      }
      throw new EventFeedChangedError();
    },
    dispose() {
      if (disposed) return;
      disposed = true; entry = undefined;
      // Closing SQLite already destroyed this connection's TEMP objects.
      if (!db.open) return;
      for (const name of triggers) db.exec(`DROP TRIGGER temp.${name}`);
      db.exec(`DROP TABLE temp.${prefix}`);
    },
  };
}

export class EventFeedQueryError extends Error {
  readonly status = 400;
  constructor(message: string) { super(message); this.name = 'EventFeedQueryError'; }
}
export function parseEventFeedQuery(query: Record<string, unknown>): { day?: string; offset: number; limit?: number } {
  const integer = (value: unknown, key: string, max = Number.MAX_SAFE_INTEGER) => {
    if (value === undefined) return undefined;
    if (typeof value !== 'string' || !/^\d+$/.test(value)) throw new EventFeedQueryError(`${key} must be a non-negative integer`);
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed > max) throw new EventFeedQueryError(`${key} exceeds supported range`);
    return parsed;
  };
  // Preserve existing exact day matching, including empty-string = no filter.
  return { day: typeof query.day === 'string' && query.day.length > 0 ? query.day : undefined, offset: integer(query.offset, 'offset') ?? 0, limit: integer(query.limit, 'limit', 500) };
}
export function selectEventFeed<T extends PublicRow>(rows: T[], query: ReturnType<typeof parseEventFeedQuery>): T[] {
  const selected = query.day === undefined ? rows : rows.filter(row => row.dayOfWeek === query.day);
  // Avoid offset + limit integer overflow by slicing twice.
  return query.limit === undefined ? selected.slice(query.offset) : selected.slice(query.offset).slice(0, query.limit);
}
