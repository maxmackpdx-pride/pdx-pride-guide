import {mapzSurfaceStyle as sharedSurface} from '../../map-foundation/surface.js';
export {createWaterBloom} from '../../mapz-map/natural-surfaces.js';

// Outzide's contour signals remain product artwork on the common geography.
const CONTOUR_SIGNAL_COLORS=['#668f83','#8f6688','#a58b67'];
export function mapzSurfaceStyle(options={}){
 const style=sharedSurface(options);
 if(options.terrainStrength>0){
  delete style.sources['hillshade-elevation'];
  style.layers.find(layer=>layer.id==='land-relief').source='elevation';
 }
 if(options.contourTiles){
  const at=style.layers.findIndex(layer=>layer.id==='elevation-contours')+1;
  style.layers.splice(at,0,...CONTOUR_SIGNAL_COLORS.map((color,band)=>({
   id:`elevation-contour-signal-${band}`,type:'line',source:'contours','source-layer':'contours',minzoom:10,maxzoom:15.9,
   filter:['==',['%', ['to-number',['get','ele'],0],3],band],
   paint:{'line-color':color,'line-opacity':0,'line-width':['match',['get','level'],1,1.12,.58],'line-blur':.25},
  })));
 }
 return style;
}
