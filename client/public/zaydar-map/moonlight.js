import {radix} from './radix-map.js';

// One geographically fixed northwest moon. Building light and terrain shading
// share an azimuth, so rotating the camera never moves the light source.
export function applyMoonlight(style){
 const azimuth=315;
 style.light={anchor:'map',color:radix.slate11,intensity:.72,position:[1.15,azimuth,55]};
 const paint=(id,values)=>Object.assign(style.layers.find(layer=>layer.id===id).paint,values);
 paint('terrain-shade',{
  'hillshade-illumination-anchor':'map',
  'hillshade-illumination-direction':azimuth,
  'hillshade-exaggeration':.75,
  'hillshade-shadow-color':radix.slate1,
  'hillshade-highlight-color':radix.slate8,
  'hillshade-accent-color':radix.sage5
 });
 paint('park-ground',{'fill-color':radix.sage3});
 paint('woodland-ground',{'fill-color':['match',['get','class'],'scrub',radix.sage4,radix.sage2]});
 paint('water',{'fill-color':['interpolate',['linear'],['zoom'],9.5,radix.cyan3,13,radix.cyan4,16,radix.cyan5]});
 paint('river-depth',{'line-color':radix.cyan6});
 paint('banks',{'line-color':radix.cyan9});
 paint('streams',{'line-color':radix.cyan8});
 paint('skyline',{'fill-extrusion-color':['interpolate',['linear'],['to-number',['coalesce',['get','render_height'],['get','height'],9]],0,radix.slate2,18,radix.slate3,60,radix.slate4,160,radix.slate6]});
 style.sky={
  'sky-color':radix.slate1,
  'sky-horizon-blend':.42,
  'horizon-color':radix.cyan3,
  'horizon-fog-blend':.72,
  'fog-color':radix.slate2,
  'fog-ground-blend':.22,
  'atmosphere-blend':.16
 };
}
