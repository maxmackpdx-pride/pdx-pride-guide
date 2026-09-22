export const CASCADIA_MIN_ZOOM=3;
export const isCascadiaZoom=zoom=>zoom<=CASCADIA_MIN_ZOOM+.04;
// Original, deliberately simplified bioregional silhouette; not a jurisdictional boundary.
// General extent: Pacific coastal watersheds and the Columbia/Fraser basins.
export const cascadiaOutline=[[-141,60],[-138,60.1],[-135.5,59.7],[-133,58.7],[-130.7,57.8],[-128,56.8],[-125.5,55.7],[-123,54.7],[-120,54.3],[-118.2,53.4],[-116.7,51.7],[-115,50.6],[-114.1,49.3],[-113.3,48.4],[-112.8,46.9],[-111.5,45],[-110.8,43.6],[-113.2,42.1],[-115.8,41.9],[-118,42.1],[-119.5,41.6],[-120.5,40.6],[-122,40],[-124.4,40.1],[-124.3,41.5],[-124.5,42.8],[-124.1,44.2],[-124,45.6],[-124.4,46.8],[-124.7,48.3],[-125.6,48.7],[-127.2,49.8],[-128,50.8],[-128.6,52],[-130.2,53.1],[-132.2,54.1],[-133.2,55.4],[-135.3,57],[-137.5,58.4],[-139.5,59.6],[-141,60]];
export function addCascadiaOutline(style){
 style.sources['cascadia-outline']={type:'geojson',lineMetrics:true,data:{type:'Feature',properties:{description:'Original stylized Cascadia bioregion outline — approximate, not an official boundary'},geometry:{type:'LineString',coordinates:cascadiaOutline}}};
 const gradient=['interpolate',['linear'],['line-progress'],0,'#ff2579',.17,'#ff7600',.33,'#eeff25',.5,'#3cff67',.67,'#16eeff',.83,'#7658ff',1,'#ff2579'];
 const layers=[['bloom',17,9,.42],['halo',7,3,.75],['core',2.4,.2,1]].map(([name,width,blur,opacity])=>({id:'cascadia-'+name,type:'line',source:'cascadia-outline',layout:{visibility:'none','line-cap':'round','line-join':'round'},paint:{'line-gradient':gradient,'line-width':width,'line-blur':blur,'line-opacity':opacity}}));
 const index=style.layers.findIndex(l=>l.type==='symbol');style.layers.splice(index<0?style.layers.length:index,0,...layers);
}
export function installCascadiaReveal(map){
 let active=false,entryCenter=null;const sign=document.createElement('div');sign.id='cascadia-reveal';sign.hidden=true;sign.setAttribute('role','status');sign.innerHTML='<img src="assets/cascadia-wordmark.png" alt="Cascadia">';document.body.append(sign);
 const update=()=>{const next=isCascadiaZoom(map.getZoom());if(next===active)return;active=next;document.body.classList.toggle('cascadia-mode',active);sign.hidden=!active;
 for(const layer of map.getStyle().layers){if(layer.id.startsWith('i5-spectrum-'))map.setLayoutProperty(layer.id,'visibility',active?'none':'visible');if(layer.id.startsWith('cascadia-'))map.setLayoutProperty(layer.id,'visibility',active?'visible':'none');}
 // One camera reset on entry keeps the entire silhouette in the wide view.
 if(active){entryCenter=map.getCenter();map.jumpTo({center:[-125.5,50.5],zoom:CASCADIA_MIN_ZOOM,pitch:0,bearing:0});}
 };
 document.addEventListener('click',e=>{if(active&&e.target.closest('.browse-toggle,#updates-button,[data-kind]'))map.jumpTo({center:entryCenter,zoom:5.5});});
 map.on('zoom',update);map.on('load',update);return update;
}
