export function readCartoBasemapKey(): string | null {
  const key =
    process.env.CARTO_BASEMAP_KEY?.trim() ||
    process.env.VITE_CARTO_BASEMAP_KEY?.trim() ||
    "";
  return key || null;
}

export function buildCartoBasemapHead(): string {
  const key = readCartoBasemapKey();
  if (!key) return "";
  return `<script>window.__PDX_CARTO_KEY__=${JSON.stringify(key)};</script>`;
}
