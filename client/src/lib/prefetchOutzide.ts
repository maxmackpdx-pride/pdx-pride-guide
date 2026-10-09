declare const __OUTZIDE_ASSETS__: {script:string;maplibre:string;maplibreCss:string};
let started = false;

/** Warm code and catalog only; the second map never creates an offscreen WebGL context. */
export function prefetchOutzide() {
  if (started || typeof document === "undefined") return;
  started = true;
  void import("@/pages/Outz");
  for (const [href, rel, as] of [
    [__OUTZIDE_ASSETS__.script, "modulepreload", ""],
    [__OUTZIDE_ASSETS__.maplibre, "prefetch", "script"],
    [__OUTZIDE_ASSETS__.maplibreCss, "prefetch", "style"],
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
