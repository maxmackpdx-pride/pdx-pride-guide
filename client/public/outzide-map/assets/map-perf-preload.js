/* Same phone budget as Mapz: cap DPR, cheap first style, freeze holograms while dragging. */
(function(){
 var coarse=typeof matchMedia==='function'&&matchMedia('(pointer:coarse), (max-width:760px)').matches;
 var pixelRatio=Math.min(window.devicePixelRatio||1,coarse?1.5:2);
 function attachIosPan(map){
  if(map.__mapzIosPan)return;
  map.__mapzIosPan=true;
  var start=null,frozen=null;
  function live(){return map.getContainer().querySelector('.hologram-canvas');}
  function dragging(){return !!(map.dragPan&&map.dragPan.isEnabled&&map.dragPan.isEnabled());}
  function ensureFrozen(){
   var src=live();
   if(!src||!src.width)return null;
   if(!frozen){
    frozen=document.createElement('canvas');
    frozen.className='hologram-canvas-frozen';
    frozen.setAttribute('aria-hidden','true');
    frozen.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:2;';
    src.parentNode.insertBefore(frozen,src.nextSibling);
   }
   if(frozen.width!==src.width||frozen.height!==src.height){frozen.width=src.width;frozen.height=src.height;}
   frozen.getContext('2d').drawImage(src,0,0);
   frozen.style.display='block';
   src.style.visibility='hidden';
   return frozen;
  }
  map.on('dragstart',function(){
   if(!dragging())return;
   var center=map.getCenter();
   start={lng:center.lng,lat:center.lat,zoom:map.getZoom(),bearing:map.getBearing(),point:map.project(center)};
   ensureFrozen();
  });
  map.on('render',function(){
   if(!start||!dragging())return;
   var origin=map.project([start.lng,start.lat]);
   var scale=Math.pow(2,map.getZoom()-start.zoom);
   var rotate=map.getBearing()-start.bearing;
   var t='translate('+origin.x+'px,'+origin.y+'px) rotate('+rotate+'deg) scale('+scale+') translate('+(-start.point.x)+'px,'+(-start.point.y)+'px)';
   if(frozen){frozen.style.transformOrigin='0 0';frozen.style.transform=t;}
  });
  map.on('moveend',function(){
   start=null;
   var src=live();
   if(src)src.style.visibility='';
   if(frozen){frozen.style.display='none';frozen.style.transform='';}
  });
 }
 if(window.maplibregl?.Map&&!window.__outzPerfMap){
  window.__outzPerfMap=true;
  var Original=window.maplibregl.Map;
  window.maplibregl.Map=class OutzPerfMap extends Original{
   constructor(options){
    var next=Object.assign({
     refreshExpiredTiles:false,
     fadeDuration:coarse?0:300,
     maxTileCacheSize:coarse?80:200,
     canvasContextAttributes:{antialias:!coarse,powerPreference:'high-performance',alpha:true,preserveDrawingBuffer:false}
    },options||{},{pixelRatio:pixelRatio});
    if(coarse)next.fadeDuration=0;
    var style=next.style;
    if(style&&typeof style==='object'&&style.terrain){
     style=structuredClone(style);
     delete style.terrain;
     if(style.sources){
      delete style.sources.elevation;
      delete style.sources['hillshade-elevation'];
      delete style.sources.contours;
     }
     if(Array.isArray(style.layers)){
      style.layers=style.layers.filter(function(layer){
       if(layer.source==='contours'||layer.source==='elevation'||layer.source==='hillshade-elevation')return false;
       return layer.id!=='land-relief'&&layer.id!=='elevation-contours';
      });
     }
     next.style=style;
    }
    super(next);
    attachIosPan(this);
   }
  };
 }
 if(window.mlcontour?.DemSource&&!window.__outzLazyDem){
  window.__outzLazyDem=true;
  var RealDem=window.mlcontour.DemSource;
  window.mlcontour.DemSource=function(opts){
   var real=null;
   function ensure(){
    if(!real)real=new RealDem(opts);
    return real;
   }
   return {
    get sharedDemProtocolUrl(){return ensure().sharedDemProtocolUrl;},
    contourProtocolUrl:function(options){return ensure().contourProtocolUrl(options);},
    setupMaplibre:function(lib){return ensure().setupMaplibre(lib);}
   };
  };
 }
})();
