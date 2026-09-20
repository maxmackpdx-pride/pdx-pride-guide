import type { Express, Request, Response } from "express";

const OPEN_FREE_MAP_TILEJSON = "https://tiles.openfreemap.org/planet";
const MAPTERHORN_ORIGIN = "https://tiles.mapterhorn.com";
const CACHE_CONTROL = "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400";

let vectorTemplate = "";
let vectorTemplateExpires = 0;

function tileIndex(value: string, max: number): number | null {
  if (!/^\d+$/.test(value)) return null;
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 && number <= max ? number : null;
}

async function openFreeMapTemplate(): Promise<string> {
  if (vectorTemplate && Date.now() < vectorTemplateExpires) return vectorTemplate;
  try {
    const response = await fetch(OPEN_FREE_MAP_TILEJSON, { signal: AbortSignal.timeout(8_000) });
    if (!response.ok) throw new Error(`OpenFreeMap TileJSON ${response.status}`);
    const json = await response.json() as { tiles?: unknown };
    const candidate = Array.isArray(json.tiles) ? json.tiles[0] : null;
    if (typeof candidate !== "string" || !/^https:\/\/tiles\.openfreemap\.org\/planet\/[\w-]+\/\{z\}\/\{x\}\/\{y\}\.pbf$/.test(candidate)) {
      throw new Error("OpenFreeMap returned an invalid tile template");
    }
    vectorTemplate = candidate;
    vectorTemplateExpires = Date.now() + 6 * 60 * 60 * 1_000;
    return candidate;
  } catch (error) {
    if (vectorTemplate) return vectorTemplate;
    throw error;
  }
}

async function sendUpstream(res: Response, url: string, fallbackType: string): Promise<void> {
  try {
    const upstream = await fetch(url, {
      headers: { "User-Agent": "Zaylist-Mapz/1.0" },
      signal: AbortSignal.timeout(12_000),
    });
    if (!upstream.ok) {
      res.status(upstream.status).end();
      return;
    }
    res.setHeader("Content-Type", upstream.headers.get("content-type") || fallbackType);
    res.setHeader("Cache-Control", CACHE_CONTROL);
    res.send(Buffer.from(await upstream.arrayBuffer()));
  } catch (error) {
    console.error("mapz tile proxy", url, error);
    res.status(502).end();
  }
}

export function registerMapzTileRoutes(app: Express): void {
  app.get("/api/mapz/vector-tiles/:z/:x/:y.pbf", async (req: Request, res: Response) => {
    const z = tileIndex(String(req.params.z), 14);
    if (z === null) return res.status(400).end();
    const span = 2 ** z - 1;
    const x = tileIndex(String(req.params.x), span);
    const y = tileIndex(String(req.params.y), span);
    if (x === null || y === null) return res.status(400).end();
    try {
      const template = await openFreeMapTemplate();
      await sendUpstream(res, template.replace("{z}", String(z)).replace("{x}", String(x)).replace("{y}", String(y)), "application/vnd.mapbox-vector-tile");
    } catch (error) {
      console.error("mapz vector template", error);
      res.status(502).end();
    }
  });

  app.get("/api/mapz/terrain-tiles/:z/:x/:y.webp", async (req: Request, res: Response) => {
    const z = tileIndex(String(req.params.z), 15);
    if (z === null) return res.status(400).end();
    const span = 2 ** z - 1;
    const x = tileIndex(String(req.params.x), span);
    const y = tileIndex(String(req.params.y), span);
    if (x === null || y === null) return res.status(400).end();
    await sendUpstream(res, `${MAPTERHORN_ORIGIN}/${z}/${x}/${y}.webp`, "image/webp");
  });

  app.get("/api/mapz/fonts/:fontstack/:range.pbf", async (req: Request, res: Response) => {
    const fontstack = String(req.params.fontstack);
    const range = String(req.params.range);
    if (!/^[\w +,-]{1,80}$/.test(fontstack) || !/^\d+-\d+$/.test(range)) return res.status(400).end();
    const url = `https://tiles.openfreemap.org/fonts/${encodeURIComponent(fontstack)}/${range}.pbf`;
    await sendUpstream(res, url, "application/x-protobuf");
  });
}
