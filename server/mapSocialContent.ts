/** Launch-content storage only. This does not implement live invitations,
 * geolocation, push delivery, private albums or cross-device group chat. */
import type { Express, Request } from 'express';

type Mode = 'afterz' | 'zaydark';
type Sqlite = { exec(sql: string): unknown; prepare(sql: string): { run(...args: any[]): unknown; get(...args: any[]): unknown } };
export type ContentEnvelope = {
  contract: 'zaylist-map-social/v1'; mode: Mode; revision: number;
  contentKind: 'fictional-demo' | 'live' | 'mixed'; demoLabel?: string; notDirections: true;
  adultGateRequired?: true; content: Record<string, any>;
};

const forbiddenKey = /address|private.*note|owner.*note|accesscode|doorcode|unitnumber/i;
export function assertSafeSeed(value: any): asserts value is ContentEnvelope {
  if (!value || value.contract !== 'zaylist-map-social/v1' || !['afterz','zaydark'].includes(value.mode)
    || !['fictional-demo','live','mixed'].includes(value.contentKind) || value.notDirections !== true
    || !Number.isInteger(value.revision) || value.revision < 1
    || (value.contentKind !== 'live' && !/FICTIONAL DEMO/.test(value.demoLabel || '')) || !value.content)
    throw new Error('Invalid or unlabeled social demo content');
  const walk = (node: any) => {
    if (!node || typeof node !== 'object') return;
    for (const [key, item] of Object.entries(node)) {
      if (forbiddenKey.test(key)) throw new Error('Address/private-note field forbidden in launch demos');
      if ((key === 'startAt' || key === 'endAt') && typeof item === 'string' && node.synthetic === true)
        throw new Error('Use fictional demo-night schedules, not frozen prototype dates');
      if (key === 'age' && (typeof item !== 'number' || item < 18)) throw new Error('Adult-only demo required');
      if (node.synthetic === true && !/FICTIONAL DEMO/.test(node.demoLabel || '')) throw new Error('Fixture label required on every demo record');
      walk(item);
    }
  };
  walk(value.content);
  if (value.mode === 'zaydark' && (value.adultGateRequired !== true || value.content.adultGateRequired !== true))
    throw new Error('ZayDark adult gate required');
  const people = value.mode === 'afterz' ? value.content.hosts : value.content.profiles;
  const items = value.mode === 'afterz' ? value.content.gatherings : value.content.profiles;
  if (!Array.isArray(people) || !Array.isArray(items)) throw new Error('Missing content collection');
  if (people.some(p => typeof p.synthetic !== 'boolean' || p.adultConfirmed !== true || !(p.age >= 18))
    || items.some(p => typeof p.synthetic !== 'boolean' || (value.contentKind === 'fictional-demo' && p.synthetic !== true))) throw new Error('Unlabeled or nonadult fixture');
}

export function createMapSocialContentStore(db: Sqlite, seeds: ContentEnvelope[]) {
  seeds.forEach(assertSafeSeed);
  db.exec(`CREATE TABLE IF NOT EXISTS map_social_content (
    mode TEXT PRIMARY KEY CHECK(mode IN ('afterz','zaydark')),
    revision INTEGER NOT NULL, payload TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  const seed = db.prepare('INSERT OR IGNORE INTO map_social_content (mode, revision, payload) VALUES (?, ?, ?)');
  for (const entry of seeds) seed.run(entry.mode, entry.revision, JSON.stringify(entry));
  return {
    read(mode: Mode): ContentEnvelope | null {
      const row = db.prepare('SELECT payload FROM map_social_content WHERE mode = ?').get(mode) as {payload:string} | undefined;
      if (!row) return null;
      const payload = JSON.parse(row.payload);
      assertSafeSeed(payload); // validate both seeded and later live content; never strip demo labels
      if(payload.mode!==mode)throw new Error('Stored content mode mismatch');
      return payload;
    },
  };
}

export function registerMapSocialContentRoutes(app: Express, options: {
  store: ReturnType<typeof createMapSocialContentStore>;
  /** Must use the site's actual server session gate, never a query/header/client boolean. */
  hasAdultAccess(req: Request): boolean;
}) {
  app.get('/api/maps/v1/social/:mode', (req, res) => {
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Vary', 'Cookie');
    const mode = req.params.mode;
    if (mode !== 'afterz' && mode !== 'zaydark') return res.status(404).json({error:'Unknown social mode'});
    if (mode === 'zaydark' && !options.hasAdultAccess(req))
      return res.status(403).json({error:'adult-gate-required', adultGateRequired:true});
    try {
      const content = options.store.read(mode);
      if (!content) return res.status(404).json({error:'Content unavailable'});
      return res.json(content);
    } catch {
      return res.status(503).json({error:'Content unavailable'});
    }
  });
}
