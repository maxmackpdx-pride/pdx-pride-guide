/* Runs after MapLibre + contour, before river-flight.
   Caps phone pixel ratio and keeps Mapterhorn off the first style. */
(function(){
 var coarse=typeof matchMedia==='function'&&matchMedia('(pointer:coarse)').matches;
 var pixelRatio=Math.min(window.devicePixelRatio||1,coarse?1.5:2);
 if(window.maplibregl?.Map&&!window.__mapzPerfMap){
  window.__mapzPerfMap=true;
  var Original=window.maplibregl.Map;
  window.maplibregl.Map=class MapzPerfMap extends Original{
   constructor(options){
    var next=Object.assign({},options||{},{pixelRatio:pixelRatio,fadeDuration:0});
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
