import type { Express, Request, Response } from "express";

function tileIndex(value: string, max: number): number | null {
  if (!/^\d+$/.test(value)) return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > max) return null;
  return n;
}

function readCartoKey(): string {
  return (
    process.env.CARTO_BASEMAP_KEY?.trim() ||
    process.env.VITE_CARTO_BASEMAP_KEY?.trim() ||
    ""
  );
}

export function registerCartoTileRoutes(app: Express): void {
  app.get("/api/mapz/carto-tiles/:z/:x/:y.png", async (req: Request, res: Response) => {
    const z = tileIndex(String(req.params.z), 20);
    if (z === null) return res.status(400).end();
    const span = 2 ** z - 1;
    const x = tileIndex(String(req.params.x), span);
    const y = tileIndex(String(req.params.y), span);
    if (x === null || y === null) return res.status(400).end();

    const key = readCartoKey();
    const query = key ? `?key=${encodeURIComponent(key)}` : "";
    const url = `https://a.basemaps.cartocdn.com/dark_all/${z}/${x}/${y}.png${query}`;

    try {
      const tile = await fetch(url, { signal: AbortSignal.timeout(8_000) });
      if (!tile.ok) return res.status(tile.status).end();
      const buffer = Buffer.from(await tile.arrayBuffer());
      res.setHeader("Content-Type", tile.headers.get("content-type") || "image/png");
      res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400");
      res.send(buffer);
    } catch (error) {
      console.error("carto tiles", error);
      res.status(502).end();
    }
  });
}
