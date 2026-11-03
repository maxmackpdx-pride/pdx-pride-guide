import type Database from "better-sqlite3";
import type { Express } from "express";
import type { Server } from "node:http";
import path from "node:path";
import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";

const RECIPE = "webp-q88-v1";
const MAX_BYTES = 20 * 1024 * 1024;
const PUBLIC = "e.status = 'LIVE' AND e.is_public = 1 AND e.is_private = 0";
type Job = { event_id: number; source: string; attempts: number };
export type PosterVariantEntry = { width: number; height: number; variants: { src: string; width: number }[] };
/** No network fetching and no initial scan. Persistent triggers observe future event changes. */
export function createPosterVariantProcessor(db: Database.Database, options: {
  uploadsDir: string; publicDir: string; outputDir: string; now?: () => number;
}) {
  const now = options.now ?? Date.now;
  db.exec(`CREATE TABLE IF NOT EXISTS poster_variant_jobs (
    event_id INTEGER PRIMARY KEY, source TEXT NOT NULL, state TEXT NOT NULL DEFAULT 'pending',
    attempts INTEGER NOT NULL DEFAULT 0, next_attempt INTEGER NOT NULL DEFAULT 0,
    metadata TEXT, error TEXT);
    CREATE INDEX IF NOT EXISTS poster_variants_pending ON poster_variant_jobs(state,next_attempt,event_id);
    CREATE INDEX IF NOT EXISTS poster_variants_image0 ON poster_variant_jobs(json_extract(metadata,'$.variants[0].src'));
    CREATE INDEX IF NOT EXISTS poster_variants_image1 ON poster_variant_jobs(json_extract(metadata,'$.variants[1].src'));
    CREATE TRIGGER IF NOT EXISTS poster_variants_insert AFTER INSERT ON events
    WHEN NEW.poster_image_url IS NOT NULL AND NEW.status='LIVE' AND NEW.is_public=1 AND NEW.is_private=0
    BEGIN INSERT OR REPLACE INTO poster_variant_jobs(event_id,source) VALUES(NEW.id,NEW.poster_image_url); END;
    CREATE TRIGGER IF NOT EXISTS poster_variants_update AFTER UPDATE OF poster_image_url,status,is_public,is_private ON events
    WHEN NEW.poster_image_url IS NOT NULL AND NEW.status='LIVE' AND NEW.is_public=1 AND NEW.is_private=0
    AND (NEW.poster_image_url IS NOT OLD.poster_image_url OR OLD.status IS NOT NEW.status OR OLD.is_public IS NOT NEW.is_public OR OLD.is_private IS NOT NEW.is_private)
    BEGIN INSERT OR REPLACE INTO poster_variant_jobs(event_id,source) VALUES(NEW.id,NEW.poster_image_url); END;
    CREATE TRIGGER IF NOT EXISTS poster_variants_delete AFTER DELETE ON events
    BEGIN DELETE FROM poster_variant_jobs WHERE event_id=OLD.id; END;`);
  let running = false;
  let stopped = false;
  function manifest(): Record<string, PosterVariantEntry> {
    const entries: Record<string, PosterVariantEntry> = Object.create(null);
    const rows = db.prepare(`SELECT j.source,j.metadata FROM poster_variant_jobs j JOIN events e ON e.id=j.event_id
      WHERE j.state='ready' AND e.poster_image_url=j.source AND ${PUBLIC} ORDER BY e.id DESC LIMIT 5000`).all() as {source:string;metadata:string}[];
    let bytes = 0;
    for (const row of rows) { bytes += row.metadata.length + row.source.length; if (bytes > 2_000_000) break; entries[row.source] = JSON.parse(row.metadata); }
    return entries;
  }
  async function sourceFile(source: string) {
    const u = new URL(source, 'https://www.zaylist.com');
    if (u.origin !== 'https://www.zaylist.com' || u.search || u.hash || u.username || u.password) throw new Error('Unsupported poster origin');
    const decoded = decodeURIComponent(u.pathname);
    if (!/^\/(uploads|posters|event-posters)\/[A-Za-z0-9_./-]+$/.test(decoded) || decoded.split('/').some(s => s === '.' || s === '..')) throw new Error('Unsupported poster path');
    const root = await fs.realpath(decoded.startsWith('/uploads/') ? options.uploadsDir : options.publicDir);
    const name = decoded.startsWith('/uploads/') ? decoded.slice('/uploads/'.length) : decoded.slice(1);
    const file = await fs.realpath(path.resolve(root, name));
    if (!file.startsWith(root + path.sep)) throw new Error('Poster path escapes storage');
    const stat = await fs.stat(file);
    if (!stat.isFile() || stat.size > MAX_BYTES) throw new Error('Poster file limit');
    return fs.readFile(file);
  }
  async function tick() {
    if (running || stopped) return;
    running = true;
    try {
      const jobs = db.prepare(`SELECT j.event_id,j.source,j.attempts FROM poster_variant_jobs j JOIN events e ON e.id=j.event_id
        WHERE j.state='pending' AND j.attempts<3 AND j.next_attempt<=? AND e.poster_image_url=j.source AND ${PUBLIC}
        ORDER BY j.event_id LIMIT 2`).all(now()) as Job[];
      // Sequential encoding keeps peak memory and CPU bounded on the production service.
      for (const job of jobs) {
        if (stopped) break;
        try {
          const input = await sourceFile(job.source);
          const metadata = await sharp(input, {limitInputPixels:40_000_000,failOn:'error'}).metadata();
          if (!metadata.width || !metadata.height || (metadata.pages ?? 1)>1 || !['jpeg','png','webp','heif','avif'].includes(metadata.format ?? '')) throw new Error('Unsupported poster image');
          const rotated = (metadata.orientation ?? 1)>=5;
          const width = rotated ? metadata.height : metadata.width, height = rotated ? metadata.width : metadata.height;
          const variants: PosterVariantEntry['variants'] = [];
          await fs.mkdir(options.outputDir, {recursive:true});
          for (const size of [640,1280].filter(size => size <= width)) {
            const key = createHash('sha256').update(input).update(RECIPE+size).digest('hex');
            const filename = `${key}-${size}.webp`, destination = path.join(options.outputDir, filename);
            let output: Buffer;
            try { output = await fs.readFile(destination); } catch (error: any) {
              if (error.code !== 'ENOENT') throw error;
              output = await sharp(input, {limitInputPixels:40_000_000,failOn:'error'}).rotate().resize({width:size,withoutEnlargement:true}).webp({quality:88,effort:4}).toBuffer();
              if (output.length >= input.length * .95) continue;
              const temporary = destination + '.tmp'; await fs.writeFile(temporary,output); await fs.rename(temporary,destination);
            }
            if (output.length < input.length * .95) variants.push({src:`/api/poster-variants/image/${filename}`,width:size});
          }
          const entry = variants.length ? JSON.stringify({width,height,variants}) : null;
          // Conditional update prevents an old in-flight image replacing a newer poster.
          db.prepare("UPDATE poster_variant_jobs SET state=?,metadata=?,error=NULL WHERE event_id=? AND source=?").run(entry?'ready':'original',entry,job.event_id,job.source);
        } catch (error: any) {
          db.prepare("UPDATE poster_variant_jobs SET attempts=attempts+1,next_attempt=?,error=? WHERE event_id=? AND source=?")
            .run(now()+60_000*(job.attempts+1),String(error?.message ?? 'Conversion failed').slice(0,180),job.event_id,job.source);
        }
      }
    } finally { running = false; }
  }
  function canServe(filename: string) {
    if (!/^[a-f0-9]{64}-(640|1280)\.webp$/.test(filename)) return false;
    const url = '/api/poster-variants/image/' + filename;
    return !!db.prepare(`SELECT 1 FROM poster_variant_jobs j JOIN events e ON e.id=j.event_id
      WHERE j.state='ready' AND e.poster_image_url=j.source AND ${PUBLIC}
      AND (json_extract(j.metadata,'$.variants[0].src')=? OR json_extract(j.metadata,'$.variants[1].src')=?) LIMIT 1`).get(url,url);
  }
  return {tick,manifest,canServe,stop:()=>{stopped=true;}};
}

export function registerPosterVariants(app: Express, server: Server, db: Database.Database, uploadsDir: string) {
  // A sibling of uploads, never inside an express.static directory.
  const outputDir = path.join(path.dirname(uploadsDir),'poster-variants');
  const processor = createPosterVariantProcessor(db,{uploadsDir,outputDir,publicDir:path.resolve(process.env.NODE_ENV==='production'?'dist/public':'client/public')});
  app.get('/api/poster-variants',(_req,res)=>{res.setHeader('Cache-Control','private, no-store');res.json(processor.manifest());});
  app.get('/api/poster-variants/image/:filename',(req,res)=>{
    res.setHeader('Cache-Control','private, no-store');
    if (!processor.canServe(req.params.filename)) return res.status(404).end();
    res.sendFile(path.join(outputDir,req.params.filename),error=>{if(error&&!res.headersSent)res.status(404).end();});
  });
  const run = ()=>void processor.tick().catch(error=>console.error('[poster-variants]',error));
  const timer=setInterval(run,5_000); timer.unref(); run();
  server.once('close',()=>{clearInterval(timer);processor.stop();});
  return processor;
}
