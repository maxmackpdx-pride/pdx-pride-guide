/* Phone pixel cap and cheap first style.
   Pins stay on lng/lat via live project() — never a 2D snapshot. */
(function(){
 var coarse=typeof matchMedia==='function'&&matchMedia('(pointer:coarse)').matches;
 var pixelRatio=Math.min(window.devicePixelRatio||1,coarse?1.5:2);
 function lockPinLayer(){
  var frozen=document.getElementById('waypoint-lights-frozen');
  if(frozen)frozen.remove();
  ['waypoint-lights','hologram-labels'].forEach(function(id){
   var el=document.getElementById(id);
   if(!el)return;
   el.style.transform='';
   el.style.transformOrigin='';
   el.style.willChange='';
   el.style.visibility='';
   el.style.pointerEvents='';
  });
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
    this.on('load',lockPinLayer);
    this.on('movestart',lockPinLayer);
    this.on('move',lockPinLayer);
    this.on('moveend',lockPinLayer);
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
 document.addEventListener('DOMContentLoaded',lockPinLayer);
})();
