import type { Express, Request, Response } from "express";

function readKey(): string {
  return (
    process.env.GOOGLE_MAP_TILES_KEY?.trim() ||
    process.env.GOOGLE_MAPS_TILES_KEY?.trim() ||
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    ""
  );
}

type Session = { session: string; expiry: number; imageFormat?: string };
let cached: Session | null = null;
let pending: Promise<Session> | null = null;

async function createSession(): Promise<Session> {
  const key = readKey();
  if (!key) throw new Error("google tiles key missing");
  const response = await fetch(`https://tile.googleapis.com/v1/createSession?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mapType: "satellite",
      language: "en-US",
      region: "US",
      imageFormat: "jpeg",
    }),
  });
  if (!response.ok) throw new Error(`google session ${response.status}`);
  const body = await response.json() as Session;
  if (!body?.session) throw new Error("google session empty");
  return body;
}

function stillValid(session: Session): boolean {
  return session.expiry * 1000 - Date.now() > 5 * 60 * 1000;
}

async function session(): Promise<Session> {
  if (cached && stillValid(cached)) return cached;
  if (pending) return pending;
  pending = createSession().then((next) => {
    cached = next;
    pending = null;
    return next;
  }).catch((error) => {
    pending = null;
    throw error;
  });
  return pending;
}

function tileIndex(value: string, max: number): number | null {
  if (!/^\d+$/.test(value)) return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > max) return null;
  return n;
}

export function googleTilesConfigured(): boolean {
  return Boolean(readKey());
}

export function registerGoogleTileRoutes(app: Express): void {
  app.get("/api/mapz/google-session", async (_req: Request, res: Response) => {
    if (!readKey()) return res.status(204).end();
    try {
      const current = await session();
      res.setHeader("Cache-Control", "private, max-age=60");
      res.json({ ok: true, expiry: current.expiry, attribution: "Google" });
    } catch (error) {
      console.error("google tiles session", error);
      res.status(502).json({ ok: false });
    }
  });

  app.get("/api/mapz/google-tiles/:z/:x/:y", async (req: Request, res: Response) => {
    if (!readKey()) return res.status(404).end();
    const z = tileIndex(String(req.params.z), 22);
    if (z === null) return res.status(400).end();
    const span = 2 ** z - 1;
    const x = tileIndex(String(req.params.x), span);
    const y = tileIndex(String(req.params.y), span);
    if (x === null || y === null) return res.status(400).end();
    try {
      const current = await session();
      const key = readKey();
      const url = `https://tile.googleapis.com/v1/2dtiles/${z}/${x}/${y}?session=${encodeURIComponent(current.session)}&key=${encodeURIComponent(key)}`;
      const tile = await fetch(url);
      if (!tile.ok) return res.status(tile.status).end();
      const buffer = Buffer.from(await tile.arrayBuffer());
      res.setHeader("Content-Type", tile.headers.get("content-type") || "image/jpeg");
      res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
      res.send(buffer);
    } catch (error) {
      console.error("google tiles", error);
      res.status(502).end();
    }
  });
}
