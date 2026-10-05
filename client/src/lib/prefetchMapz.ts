import {mapzAssets} from './mapzAssets';
const MAPZ_ASSETS=[
 {href:mapzAssets.maplibre,as:'script'},
 {href:mapzAssets.maplibreCss,as:'style'},
 {href:mapzAssets.contour,as:'script'},
 {href:mapzAssets.style,as:'style'},
 {href:mapzAssets.script,rel:'modulepreload'},
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
 void import('@/pages/MapzMapDemo');
}
