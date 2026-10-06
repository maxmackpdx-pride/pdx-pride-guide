let started = false;

/** Warm code and catalog only; the second map never creates an offscreen WebGL context. */
export function prefetchOutzide() {
  if (started || typeof document === "undefined") return;
  started = true;
  void import("@/pages/Outz");
  for (const [href, rel, as] of [
    ["/outzide-map/app.js?v=20261006-keep-markers", "modulepreload", ""],
    ["/outzide-map/assets/maplibre-gl-5.6.2.js", "prefetch", "script"],
    ["/outzide-map/assets/maplibre-gl-5.6.2.css", "prefetch", "style"],
    ["/outzide-map/places.json", "prefetch", "fetch"],
    ["/outzide-map/details.json", "prefetch", "fetch"],
    ["/outzide-map/routes.json", "prefetch", "fetch"],
    ["/outzide-map/i5-route.json", "prefetch", "fetch"],
  ]) {
    const link = document.createElement("link");
    link.rel = rel;
    link.href = href;
    if (as) link.as = as;
    document.head.appendChild(link);
  }
}
