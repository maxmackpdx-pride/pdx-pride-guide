/* Runs after MapLibre + contour, before river-flight.
   Phone pixel cap, cheap first style, iOS-style pan (freeze overlay + follow camera). */
(function(){
 var coarse=typeof matchMedia==='function'&&matchMedia('(pointer:coarse)').matches;
 var pixelRatio=Math.min(window.devicePixelRatio||1,coarse?1.5:2);
 function overlayEls(){
  return [document.getElementById('waypoint-lights'),document.getElementById('hologram-labels')].filter(Boolean);
 }
 function attachIosPan(map){
  if(map.__mapzIosPan)return;
  map.__mapzIosPan=true;
  var start=null;
  function dragging(){return !!(map.dragPan&&map.dragPan.isEnabled&&map.dragPan.isEnabled());}
  map.on('movestart',function(){
   if(!dragging())return;
   var center=map.getCenter();
   start={lng:center.lng,lat:center.lat,zoom:map.getZoom(),bearing:map.getBearing(),point:map.project(center)};
   overlayEls().forEach(function(el){
    el.style.willChange='transform';
    el.style.pointerEvents='none';
   });
  });
  map.on('render',function(){
   if(!start||!dragging())return;
   var origin=map.project([start.lng,start.lat]);
   var scale=Math.pow(2,map.getZoom()-start.zoom);
   var rotate=map.getBearing()-start.bearing;
   var t='translate('+origin.x+'px,'+origin.y+'px) rotate('+rotate+'deg) scale('+scale+') translate('+(-start.point.x)+'px,'+(-start.point.y)+'px)';
   overlayEls().forEach(function(el){el.style.transform=t;el.style.transformOrigin='0 0';});
  });
  function clearFreeze(){
   start=null;
   overlayEls().forEach(function(el){
    el.style.transform='';
    el.style.transformOrigin='';
    el.style.willChange='';
    el.style.pointerEvents='';
   });
  }
  map.on('moveend',clearFreeze);
  map.on('mouseup',clearFreeze);
  map.on('touchend',clearFreeze);
 }
 if(window.maplibregl?.Map&&!window.__mapzPerfMap){
  window.__mapzPerfMap=true;
  var Original=window.maplibregl.Map;
  window.maplibregl.Map=class MapzPerfMap extends Original{
   constructor(options){
    var next=Object.assign({
     refreshExpiredTiles:false,
     fadeDuration:0,
     maxTileCacheSize:coarse?80:200,
     canvasContextAttributes:{antialias:!coarse,powerPreference:'high-performance',alpha:true,preserveDrawingBuffer:false}
    },options||{},{pixelRatio:pixelRatio,fadeDuration:0});
    var style=next.style;
    if(style&&typeof style==='object'){
     style=structuredClone(style);
     delete style.terrain;
     if(style.sources){
      delete style.sources.elevation;
      delete style.sources['hillshade-elevation'];
      delete style.sources.contours;
     }
     if(Array.isArray(style.layers)){
      style.layers=style.layers.filter(function(layer){return layer.id!=='land-relief'&&layer.id!=='elevation-contours';});
     }
     next.style=style;
    }
    super(next);
    attachIosPan(this);
   }
  };
 }
 if(window.mlcontour?.DemSource&&!window.__mapzLazyDem){
  window.__mapzLazyDem=true;
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
