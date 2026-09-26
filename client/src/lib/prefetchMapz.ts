const MAPZ_ASSETS=[
 {href:'/home-flight/vendor/maplibre-gl-5.6.2.js',as:'script'},
 {href:'/home-flight/vendor/maplibre-gl-5.6.2.css',as:'style'},
 {href:'/zaydar-map/vendor/maplibre-contour-0.1.0.js',as:'script'},
 {href:'/zaydar-map/studio.css?v=20260925-map-boot',as:'style'},
 {href:'/zaydar-map/river-flight.js?v=20260925-map-boot',rel:'modulepreload'},
] as const;

let started=false;

export function prefetchMapz(){
 if(started||typeof document==='undefined')return;
 started=true;
 for(const asset of MAPZ_ASSETS){
  const link=document.createElement('link');
  link.rel='rel' in asset?asset.rel:'preload';
  link.href=asset.href;
  if('as' in asset)link.as=asset.as;
  document.head.appendChild(link);
 }
 void import('@/pages/ZaydarMapDemo');
}
